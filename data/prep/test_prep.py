"""Self-check for prep.py on synthetic data. Run: python data/prep/test_prep.py"""

import geopandas as gpd
import pandas as pd
from shapely.geometry import LineString, Point

import prep

# ~1 km east-west line in downtown Toronto (EPSG:4326).
line = gpd.GeoDataFrame(geometry=[LineString([(-79.40, 43.66), (-79.3876, 43.66)])], crs=4326)
buf = prep.buffer_corridor(line, 50)

# Buffer is measured in metres: area ~ length * 2 * 50 m.
assert 90_000 < buf.area < 130_000, buf.area

# ~11 m north is inside the 50 m buffer, ~550 m north is not.
pts = gpd.GeoDataFrame({"name": ["near", "far"]}, geometry=[Point(-79.395, 43.6601), Point(-79.395, 43.665)], crs=4326)
assert list(prep.clip(pts, buf)["name"]) == ["near"]

# Unprojected layers are refused rather than measured in degrees.
try:
    prep.to_metric(gpd.GeoDataFrame(geometry=[Point(0, 0)]))
    raise AssertionError("expected ValueError")
except ValueError:
    pass

# Two people in one collision + one person in another = 2 collisions; flags counted per collision.
ksi = pd.DataFrame({
    "collision_id": ["2024:1", "2024:1", "2024:2", "2019:9"],
    "accdate": ["2024-05-01", "2024-05-01", "2024-06-01", "2019-01-01"],
    "pedestrian": ["true", "true", "false", "true"],
    "cyclist": ["false", "false", "true", "false"],
})
assert prep.ksi_summary(ksi, since="2021-10-17") == {"ksiCollisions": 2, "pedestrianInvolved": 1, "cyclistInvolved": 1}
assert prep.ksi_summary(ksi, since="2024-06-01") == {"ksiCollisions": 1, "pedestrianInvolved": 0, "cyclistInvolved": 1}

from shapely.geometry import LineString, Point
import xml.etree.ElementTree as ET

assert [prep.bike_kind(i) for i in ("Cycle Track", "Bi-Directional Cycle Track", "Bike Lane - Contraflow", "Sharrows")] == ["protected", "protected", "painted", "other"]
assert prep.and_list(["A", "B", "C"]) == "A, B and C" and prep.and_list(["A"]) == "A"
body, w, h = prep.render_map(LineString([(0, 0), (600, 0)]), "Test St", [LineString([(300, -500), (300, 500)])], [("protected", LineString([(0, 0), (600, 0)]))],
                             [("Stop", Point(10, 10))], "3 fatal or serious-injury collisions (30 m, 5 years)")
svg = ET.fromstring(f'<svg xmlns="http://www.w3.org/2000/svg">{"".join(body)}</svg>')
assert (w, h) == (900, 300)
assert len(svg.findall("{http://www.w3.org/2000/svg}circle")) == 1, "only stations are points; collisions stay an aggregate label"

print("prep self-check passed")
