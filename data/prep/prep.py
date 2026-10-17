"""Road Diet data prep: Toronto Open Data -> data/corridors/<id>.json (spec section 4).

Usage:
  python data/prep/prep.py info <dataset-name>               # list resources, no download
  python data/prep/prep.py fetch <dataset-name> <resource>   # download one resource to data/raw/
"""

import argparse
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

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


def ksi_summary(df, since_year):
    """Aggregate counts only (spec 4.5). `pedestrian`/`cyclist` are collision-level flags, so count after dedupe."""
    df = dedupe_ksi(df[pd.to_datetime(df["accdate"]).dt.year >= since_year])
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


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("info").add_argument("dataset")
    f = sub.add_parser("fetch")
    f.add_argument("dataset")
    f.add_argument("resource")
    f.add_argument("--allow-large", action="store_true")
    a = p.parse_args(argv)
    if a.cmd == "info":
        for r in resources(a.dataset):
            size = f"{r['size'] / 1e6:.1f} MB" if r.get("size") else "size unknown"
            print(f"{r['name']}  [{r['format']}, {size}]")
    else:
        print(fetch(a.dataset, a.resource, a.allow_large))


if __name__ == "__main__":
    sys.exit(main())
