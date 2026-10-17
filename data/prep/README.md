# data/prep

Builds `data/corridors/<id>.json` (spec 4.4) from Toronto Open Data. Sources and licences are in [`../SOURCES.md`](../SOURCES.md).

## Run

```bash
cd data/prep
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python test_prep.py                                   # self-check on synthetic data
python prep.py info motor-vehicle-collisions-involving-killed-or-seriously-injured-persons
python prep.py fetch motor-vehicle-collisions-involving-killed-or-seriously-injured-persons "Motor Vehicle Collisions with KSI Data - 4326.geojson"
```

Build a corridor from its config (small datastore queries plus the 11 MB KSI CSV, fetched if missing):

```bash
python prep.py corridor corridors/bloor-christie-ossington.toml   # writes data/corridors/bloor-christie-ossington.json
```

The config pins every input: centreline segment ids, the TMC count id and peak, the KSI buffer and window, the Official Plan width, and the values marked `estimate` (copied into the JSON's `estimates` list).

(With uv: `uv run --no-project --with-requirements requirements.txt python test_prep.py`.)

Downloads go to `data/raw/<dataset>/`, which is git-ignored. `fetch` refuses anything over 50 MB unless you pass `--allow-large`.

## Projection gotcha

Portal files come in **EPSG:4326** (longitude/latitude in degrees) or **EPSG:2952** (NAD83(CSRS) / Ontario MTM zone 10). Always download the **4326** version, then call `to_metric()` (EPSG:32617, UTM 17N, metres) before any buffer, distance or area. Buffering a 4326 layer by `50` means 50 *degrees*. `to_metric()` refuses layers with no CRS.

## Downloads

Small files you can fetch directly:
- KSI 4326 GeoJSON (~28 MB) or CSV (~11 MB).
- `tmc_most_recent_summary_data.csv` (~1.5 MB) and `tmc_summary_data.csv` (~7.5 MB).
- `cycling-network - 4326.geojson` (~3 MB).
- `cycling_permanent_counts_locations.csv` (~11 KB).

**Do not download by default:**
- **Police Traffic Collisions** (4326 GeoJSON is 493 MB; the SHP zip is 1.3 GB). Use it only if KSI is not enough, run `fetch … --allow-large` yourself, and prefer the 178 MB CSV.
- **TMC raw data** (54–655 MB per decade file).
- **Centreline GeoJSON** (93 MB). Use the 30 MB GPKG instead, or filter the datastore by `LINEAR_NAME_FULL` through the API.

## Data gotchas

- **KSI is one row per involved person.** Deduplicate by `collision_id` before counting (20,809 rows → 7,638 collisions). The `pedestrian`/`cyclist` columns are collision-level flags, so count them after deduplicating. `ksi_summary()` does both.
- KSI counts on a short corridor are small. Keep the buffer and period configurable, publish aggregates only, and avoid over-precise claims (spec 4.5).
- The Centreline has **no width attribute**. Width comes from Official Plan Map 3 / Schedule 1 by hand and is labelled "planned right-of-way width".
- TMC `count_duration` is `14`, `8R` or `8S`. Don't compare 8-hour and 14-hour totals directly; use the AM/PM peak-hour fields.

## Attribution

Credit the City of Toronto, the Toronto Police Service and **OpenStreetMap contributors** (required by the ODbL) on the map and on `/data`.

## Not done yet

The corridor build itself is waiting until a corridor is chosen (issue #11).
