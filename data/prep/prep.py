"""Road Diet data prep: Toronto Open Data -> data/corridors/<id>.json (spec section 4).

Usage:
  python data/prep/prep.py info <dataset-name>               # list resources, no download
  python data/prep/prep.py fetch <dataset-name> <resource>   # download one resource to data/raw/
  python data/prep/prep.py corridor data/prep/corridors/<id>.toml   # build data/corridors/<id>.json
  python data/prep/prep.py map data/prep/corridors/<id>.toml        # then data/corridors/<id>.map.svg
"""

import argparse
import json
import sys
import tomllib
import urllib.parse
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape

import geopandas as gpd
import pandas as pd

CKAN = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/"
ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
CORRIDORS = ROOT / "data" / "corridors"

# Portal files come in EPSG:4326 (degrees) or EPSG:2952. Load 4326, measure in UTM 17N (metres).
METRIC_CRS = 32617
MAX_BYTES = 50_000_000

# Confirmed from the KSI datastore schema (2026-10-16): one row per involved person, shared collision_id.
KSI_COLLISION_ID = "collision_id"
CORRIDOR_KEYS = {"id", "name", "widthM", "lengthKm", "baselineLayout", "baselineDemand",
                 "baselineSafety", "freeFlowSpeedKph", "sources"}


def api(action, **params):
    url = CKAN + action + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=60) as r:
        body = json.load(r)
    if not body.get("success"):
        raise RuntimeError(f"{action} failed: {body.get('error')}")
    return body["result"]


def resources(name):
    return api("package_show", id=name)["resources"]


def fetch(name, resource_name, allow_large=False):
    res = next((r for r in resources(name) if r["name"] == resource_name), None)
    if res is None:
        raise SystemExit(f"No resource {resource_name!r} in {name}. Run `info {name}`.")
    size = res.get("size") or _content_length(res["url"])
    if size is None and not allow_large:
        raise SystemExit("Size unknown; pass --allow-large if you are sure.")
    if size and size > MAX_BYTES and not allow_large:
        raise SystemExit(f"{resource_name} is {size / 1e6:.0f} MB (> {MAX_BYTES / 1e6:.0f} MB). Pass --allow-large.")
    dest = RAW / name / Path(urllib.parse.urlparse(res["url"]).path).name
    dest.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(res["url"], dest)
    return dest


def _content_length(url):
    with urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=60) as r:
        n = r.headers.get("Content-Length")
    return int(n) if n else None


def load(path):
    path = Path(path)
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    return gpd.read_file(path)


def to_metric(gdf):
    if gdf.crs is None:
        raise ValueError("Layer has no CRS; set it (portal files are EPSG:4326 or EPSG:2952) before measuring.")
    return gdf.to_crs(METRIC_CRS)


def buffer_corridor(line, metres):
    """Single buffer polygon (EPSG:32617) around the corridor line(s)."""
    return to_metric(line).buffer(metres).union_all()


def clip(layer, buffer):
    return gpd.clip(to_metric(layer), buffer)


def dedupe_ksi(df):
    return df.drop_duplicates(subset=KSI_COLLISION_ID)


def ksi_summary(df, since):
    """Aggregate counts only (spec 4.5). `pedestrian`/`cyclist` are collision-level flags, so count after dedupe.
    `since` is an ISO date; collisions on or after it are counted."""
    df = dedupe_ksi(df[pd.to_datetime(df["accdate"]) >= pd.Timestamp(since)])
    flag = lambda col: int((df[col].astype(str).str.lower() == "true").sum())
    return {"ksiCollisions": len(df), "pedestrianInvolved": flag("pedestrian"), "cyclistInvolved": flag("cyclist")}


def write_corridor(corridor):
    missing = CORRIDOR_KEYS - corridor.keys()
    if missing:
        raise ValueError(f"Corridor JSON missing {sorted(missing)} (spec 4.4)")
    CORRIDORS.mkdir(parents=True, exist_ok=True)
    out = CORRIDORS / f"{corridor['id']}.json"
    out.write_text(json.dumps(corridor, indent=2) + "\n")
    return out


PORTAL = "https://open.toronto.ca/dataset/"
CENTRELINE = ("toronto-centreline-tcl", "ad296ebf-fca6-4e67-b3ce-48040a20e6cd")
TMC = ("traffic-volumes-at-intersections-for-all-modes", "6afa3b1f-f6a5-4235-8bd6-7568411c19f4")
CYCLING = ("cycling-network", "71fdb11f-99df-4f7b-8af1-d7240dae69b3")
KSI = ("motor-vehicle-collisions-involving-killed-or-seriously-injured-persons", "Motor Vehicle Collisions with KSI Data - 4326.csv")
MAP3 = "https://www.toronto.ca/wp-content/uploads/2026/06/98b4-CityPlanning-Map-3-ROW-Widths-Associated-with-Existing-Major-Streets.pdf"


def datastore(resource_id, **filters):
    return api("datastore_search", resource_id=resource_id, filters=json.dumps(filters), limit=1000)["records"]


def build_corridor(cfg):
    """Corridor JSON (spec 4.4) from a config file: small datastore queries plus the 11 MB KSI CSV."""
    from shapely.geometry import shape

    retrieved = cfg["retrieved"]
    street = cfg["segment"]["street"]
    segs = [r for r in datastore(CENTRELINE[1], LINEAR_NAME_FULL=street) if r["CENTRELINE_ID"] in cfg["segment"]["centreline_ids"]]
    if len(segs) != len(cfg["segment"]["centreline_ids"]):
        raise SystemExit(f"Found {len(segs)} of {len(cfg['segment']['centreline_ids'])} centreline segments")
    line = gpd.GeoDataFrame(geometry=[shape(json.loads(r["geometry"])) for r in segs], crs=4326)
    length_km = round(to_metric(line).length.sum() / 1000, 2)

    (count,) = datastore(TMC[1], latest_count_id=cfg["count"]["latest_count_id"])
    p = cfg["count"]["peak"]
    bloor_vehicle_share = (count["e_appr_vehicle"] + count["w_appr_vehicle"]) / count["total_vehicle"]
    bloor_bike_share = (count["e_appr_bike"] + count["w_appr_bike"]) / count["total_bike"]
    peak_vehicles = count[f"{p}_peak_vehicle"] * bloor_vehicle_share
    peak_bikes = count[f"{p}_peak_bike"] * bloor_bike_share
    # No peak-hour pedestrian field: scale the 14 h crossing total by the vehicle peak-hour share.
    peak_pedestrians = count["total_pedestrian"] * count[f"{p}_peak_vehicle"] / count["total_vehicle"]

    ksi_path = RAW / KSI[0] / "motor-vehicle-collisions-with-ksi-data-4326.csv"
    if not ksi_path.exists():
        fetch(*KSI)
    ksi = pd.read_csv(ksi_path)
    pts = gpd.GeoDataFrame(ksi, geometry=gpd.points_from_xy(ksi.longitude, ksi.latitude), crs=4326)
    near = clip(pts, buffer_corridor(line, cfg["safety"]["buffer_m"]))
    since = (pd.Timestamp(retrieved) - pd.DateOffset(years=cfg["safety"]["years"])).date().isoformat()
    safety = ksi_summary(near, since)

    # Cycling segments on the street that run along the corridor (more than 1 m inside a 15 m buffer).
    lane_buffer = buffer_corridor(line, 15)
    bike_rows = [
        r
        for r in datastore(CYCLING[1], STREET_NAME=street)
        if to_metric(gpd.GeoDataFrame(geometry=[shape(json.loads(r["geometry"]))], crs=4326)).geometry.iloc[0].intersection(lane_buffer).length > 1
    ]
    infra = sorted({r["INFRA_HIGHORDER"] for r in bike_rows})

    d = cfg["demand"]
    src = lambda label, slug, note: {"label": label, "url": PORTAL + slug + "/", "retrieved": retrieved, "note": note}
    return {
        "id": cfg["id"],
        "name": cfg["name"],
        "widthM": cfg["width"]["metres"],
        "lengthKm": length_km,
        "baselineLayout": {"elements": cfg["layout"]["elements"]},
        "baselineDemand": {
            "car": round(peak_vehicles * d["car_occupancy"]),
            "bus": d["bus_persons_per_hour"],
            "bike": round(peak_bikes),
            "walk": round(peak_pedestrians),
        },
        "baselineSafety": {"ksiCollisions5y": safety["ksiCollisions"], "pedestrianInvolved": safety["pedestrianInvolved"], "cyclistInvolved": safety["cyclistInvolved"]},
        "freeFlowSpeedKph": cfg["speed"]["kph"],
        "sources": [
            src("Toronto Centreline (TCL) v2", CENTRELINE[0], f"{len(segs)} segments of {cfg['name']}: {length_km} km."),
            src("Traffic Volumes at Intersections for All Modes", TMC[0], f"{count['location_name']}, {count['latest_count_date']}, {count['count_duration']} h count; {p.upper()} peak hour, Bloor approaches only."),
            src("Motor Vehicle Collisions involving Killed or Seriously Injured Persons", KSI[0], f"Within {cfg['safety']['buffer_m']} m of the segment since {since}; deduplicated by collision; aggregate counts only."),
            src("Cycling Network", CYCLING[0], "; ".join(f"{street}, {r['FROM_STREET']} to {r['TO_STREET']}: {r['INFRA_HIGHORDER']} ({r['INSTALLED']})" for r in bike_rows) + "."),
            {"label": "Official Plan Map 3: Right-of-Way Widths Associated with Existing Major Streets (June 2026)", "url": MAP3, "retrieved": retrieved, "note": cfg["width"]["source"]},
        ],
        "estimates": [
            {"field": "baselineLayout", "note": cfg["layout"]["note"]},
            {"field": "freeFlowSpeedKph", "note": cfg["speed"]["note"]},
            {"field": "baselineDemand.walk", "note": "Peak-hour pedestrians scaled from the 14 h crossing count by the vehicle peak-hour share."},
            {"field": "baselineDemand.car", "note": f"Vehicles x {d['car_occupancy']} persons per vehicle (occupancy not yet sourced)."},
            {"field": "baselineDemand.bus", "note": d["bus_note"]},
        ],
        "observed": {
            "count": {k: count[k] for k in ("location_name", "latest_count_date", "count_duration", "total_vehicle", "total_bike", "total_pedestrian", f"{p}_peak_start", f"{p}_peak_vehicle", f"{p}_peak_bike", "e_appr_vehicle", "w_appr_vehicle", "e_appr_bike", "w_appr_bike")},
            "peakHour": {"vehicles": round(peak_vehicles), "bikes": round(peak_bikes), "pedestrians": round(peak_pedestrians)},
            "bikeFacility": infra,
        },
        "source": "Toronto Open Data and City of Toronto Official Plan; see sources and estimates.",
    }


OVERPASS = "https://overpass-api.de/api/interpreter"
OSM_COPYRIGHT = "https://www.openstreetmap.org/copyright"
# Spec 8b tokens (client/src/index.css).
INK, PAPER, PRIMARY, STREET = "#1f2a37", "#faf6ee", "#2b59c3", "#cbd2d9"
BIKE = {"protected": ("#2fa84f", ""), "painted": ("#7cc576", "10 6"), "other": ("#3e8e5a", "2 6")}
MAP_PAD_M = 150


def bike_kind(infra):
    """Game mapping (SOURCES.md): *Cycle Track* -> protected, Bike Lane* -> painted; the rest (sharrows, trails, signed routes) -> other."""
    return "protected" if "Cycle Track" in infra else "painted" if infra.startswith("Bike Lane") else "other"


def overpass(s, w, n, e):
    q = (f'[out:json][timeout:25];(way["highway"~"^(primary|secondary|tertiary|residential|unclassified)$"]({s},{w},{n},{e});'
         f'node["railway"="station"]["station"="subway"]({s},{w},{n},{e}););out geom;')
    req = urllib.request.Request(OVERPASS, data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent": "road-diet-prep"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def and_list(xs):
    return ", ".join(xs[:-1]) + " and " + xs[-1] if len(xs) > 1 else "".join(xs)


def map_frame(corridor):
    from shapely.geometry import box

    x0, y0, x1, y1 = corridor.bounds
    return box(x0 - MAP_PAD_M, y0 - MAP_PAD_M, x1 + MAP_PAD_M, y1 + MAP_PAD_M)


def render_map(corridor, street, streets, bikes, stations, ksi_label):
    """SVG in metres (EPSG:32617), north up. corridor/streets: shapely lines; bikes: [(kind, line)]; stations: [(name, point)]."""
    frame = map_frame(corridor)
    x0, y0, x1, _ = corridor.bounds
    fx, fy, fx1, fy1 = frame.bounds
    w, h = round(fx1 - fx), round(fy1 - fy)
    pt = lambda x, y: f"{x - fx:.0f},{fy1 - y:.0f}"

    def path(geom, attrs):
        geom = geom.intersection(frame)
        lines = getattr(geom, "geoms", [geom])
        d = " ".join("M" + " L".join(pt(*c) for c in g.coords) for g in lines if not g.is_empty and g.length > 0)
        return f'<path d="{d}" fill="none" stroke-linecap="round" stroke-linejoin="round" {attrs}/>' if d else ""

    out = [f'<rect width="{w}" height="{h}" fill="{PAPER}"/>']
    out += [path(g, f'stroke="{STREET}" stroke-width="7"') for g in streets]
    out.append(path(corridor, f'stroke="{INK}" stroke-width="26"'))
    out.append(path(corridor, f'stroke="{PRIMARY}" stroke-width="18"'))
    for kind, g in bikes:
        colour, dash = BIKE[kind]
        out.append(path(g, f'stroke="{colour}" stroke-width="{6 if kind == "protected" else 5}"' + (f' stroke-dasharray="{dash}"' if dash else "")))
    # Keep centred labels inside the frame (approximate glyph width 0.6 em).
    inside = lambda x, s, size: min(max(x, 0.3 * size * len(s) + 8), w - 0.3 * size * len(s) - 8)
    text = lambda x, y, s, anchor="middle", size=22, weight=600: (
        f'<text x="{inside(x, s, size) if anchor == "middle" else x:.0f}" y="{y:.0f}" text-anchor="{anchor}" font-size="{size}" font-weight="{weight}" fill="{INK}" '
        f'stroke="{PAPER}" stroke-width="5" paint-order="stroke">{escape(s)}</text>')
    for name, p in stations:
        x, y = (float(v) for v in pt(p.x, p.y).split(","))
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="13" fill="{PAPER}" stroke="{INK}" stroke-width="5"/>')
        out.append(text(x, y - 28, f"{name} station", size=28))
    mx = (x0 + x1) / 2 - fx
    below = fy1 - y0 + 50  # under the corridor's lowest point, so a tilted street never crosses the labels
    out.append(text(mx, below, street, size=32, weight=700))
    out.append(text(mx, below + 38, ksi_label, size=26, weight=500))
    out.append(f'<path d="M20,{h - 40} h100" stroke="{INK}" stroke-width="5"/>' + text(70, h - 54, "100 m", size=24, weight=500))
    out.append(text(w - 16, h - 16, "© OpenStreetMap contributors · City of Toronto", anchor="end", size=20, weight=500))
    return out, w, h


def build_map(cfg):
    """data/corridors/<id>.map.svg (spec 8c) plus mapSvg/mapAlt and an OSM source on the corridor JSON (run `corridor` first)."""
    from datetime import date
    from shapely.geometry import LineString, Point, shape
    from shapely.ops import linemerge, unary_union

    out_json = CORRIDORS / f"{cfg['id']}.json"
    corridor = json.loads(out_json.read_text())
    street = cfg["segment"]["street"]
    segs = [r for r in datastore(CENTRELINE[1], LINEAR_NAME_FULL=street) if r["CENTRELINE_ID"] in cfg["segment"]["centreline_ids"]]
    line = gpd.GeoDataFrame(geometry=[shape(json.loads(r["geometry"])) for r in segs], crs=4326)
    w, s, e, n = line.total_bounds + [-0.003, -0.003, 0.003, 0.003]  # 240-330 m; render_map clips to MAP_PAD_M
    osm_path = RAW / "osm" / f"{cfg['id']}.json"  # cached: Overpass is a shared, rate-limited service
    if not osm_path.exists():
        osm_path.parent.mkdir(parents=True, exist_ok=True)
        osm_path.write_text(json.dumps(overpass(s, w, n, e)))
    osm = json.loads(osm_path.read_text())
    to_m = lambda geoms: list(to_metric(gpd.GeoSeries(geoms, crs=4326)))
    streets = to_m([LineString([(p["lon"], p["lat"]) for p in el["geometry"]]) for el in osm["elements"] if el["type"] == "way"])
    stations = [el for el in osm["elements"] if el["type"] == "node"]
    station_pts = to_m([Point(el["lon"], el["lat"]) for el in stations])

    bikes_path = RAW / CYCLING[0] / "cycling-network-4326.geojson"
    if not bikes_path.exists():
        fetch(CYCLING[0], "cycling-network - 4326.geojson")
    centre = linemerge(unary_union(list(to_metric(line).geometry)))
    bikes = to_metric(gpd.read_file(bikes_path).cx[w:e, s:n])
    bikes = bikes[bikes.intersects(map_frame(centre))]
    bike_lines = [(bike_kind(i), g) for i, g in zip(bikes.INFRA_HIGHORDER, bikes.geometry)]
    k, sf = corridor["baselineSafety"]["ksiCollisions5y"], cfg["safety"]
    body, width, height = render_map(centre, street, streets, bike_lines, [(el["tags"]["name"], p) for el, p in zip(stations, station_pts)],
                                     f"{k} fatal or serious-injury collisions ({sf['buffer_m']} m, {sf['years']} years)")
    on = lambda kind: and_list(sorted({st for st, i in zip(bikes.STREET_NAME, bikes.INFRA_HIGHORDER) if bike_kind(i) == kind}))
    bike_text = {"protected": "Protected bike lanes (cycle tracks) on {}. ", "painted": "Painted bike lanes on {}. ", "other": "Other cycling routes on {}. "}
    names = sorted(el["tags"]["name"] for el in stations)
    alt = (f"Map of {corridor['name']}, {corridor['lengthKm']} km, highlighted in blue. "
           + (f"Subway stations: {and_list(names)}. " if names else "")
           + "".join(t.format(on(kind)) for kind, t in bike_text.items() if on(kind))
           + f"{k} collisions where someone was killed or seriously injured happened within {sf['buffer_m']} m of this stretch in the last {sf['years']} years (a total, not individual incidents).")
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" role="img" '
           f'font-family="Inter, system-ui, sans-serif"><title>{escape(corridor["name"])}</title><desc>{escape(alt)}</desc>'
           + "".join(body) + "</svg>\n")
    svg_path = CORRIDORS / f"{cfg['id']}.map.svg"
    svg_path.write_text(svg)

    osm_source = {"label": "OpenStreetMap contributors", "url": OSM_COPYRIGHT, "retrieved": date.fromtimestamp(osm_path.stat().st_mtime).isoformat(),
                  "note": f"Streets and subway stations on the corridor map, from the Overpass API. {osm.get('osm3s', {}).get('copyright', '')}".strip()}
    corridor["sources"] = [src for src in corridor["sources"] if src["url"] != OSM_COPYRIGHT] + [osm_source]
    corridor |= {"mapSvg": f"data/corridors/{svg_path.name}", "mapAlt": alt}
    write_corridor(corridor)
    return svg_path


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("info").add_argument("dataset")
    f = sub.add_parser("fetch")
    f.add_argument("dataset")
    f.add_argument("resource")
    f.add_argument("--allow-large", action="store_true")
    c = sub.add_parser("corridor")
    c.add_argument("config", help="corridors/<id>.toml")
    sub.add_parser("map").add_argument("config", help="corridors/<id>.toml")
    a = p.parse_args(argv)
    if a.cmd == "info":
        for r in resources(a.dataset):
            size = f"{r['size'] / 1e6:.1f} MB" if r.get("size") else "size unknown"
            print(f"{r['name']}  [{r['format']}, {size}]")
    elif a.cmd == "corridor":
        print(write_corridor(build_corridor(tomllib.loads(Path(a.config).read_text()))))
    elif a.cmd == "map":
        print(build_map(tomllib.loads(Path(a.config).read_text())))
    else:
        print(fetch(a.dataset, a.resource, a.allow_large))


if __name__ == "__main__":
    sys.exit(main())
