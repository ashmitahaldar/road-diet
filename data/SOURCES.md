# Data sources

Every dataset Road Diet uses or plans to use. Toronto Open Data URLs follow `https://open.toronto.ca/dataset/<dataset-name>/`. The metadata was checked with the portal API (`package_show`, `datastore_search`) on the retrieval date below.

- **Verified = yes:** the dataset name, owner, refresh rate, formats and fields were confirmed against the source.
- **Verified = slug only:** the portal search returned the dataset name; its contents have not been reviewed.
- **Verified = no:** not confirmed.
- **Licence = "verify":** confirm before launch. The portal metadata wording is quoted in brackets.

Credit on `/data` names only the publishers of data the game actually uses (checked with `package_show` on 2026-10-17): City of Toronto (`owner_division` Transportation Services for TMC, KSI and Cycling Network; Information & Technology for Toronto Centreline; City Planning for Official Plan Map 3; the Lane Widths Guideline), UK DESNZ (emission factors) and NACTO (lane capacities). The KSI dataset is owned by Transportation Services, not Toronto Police Service. OpenStreetMap is not used yet; credit OpenStreetMap contributors if it is.

| Dataset | Dataset name | URL | Licence | Retrieved | What we use it for | Verified |
|---|---|---|---|---|---|---|
| Motor Vehicle Collisions Involving Killed or Seriously Injured Persons | `motor-vehicle-collisions-involving-killed-or-seriously-injured-persons` | https://open.toronto.ca/dataset/motor-vehicle-collisions-involving-killed-or-seriously-injured-persons/ | verify ("License not specified") | 2026-10-16 | Safety baseline: KSI collisions near the corridor, deduplicated by `collision_id` | yes |
| Traffic Volumes - Multimodal Intersection Turning Movement Counts | `traffic-volumes-at-intersections-for-all-modes` | https://open.toronto.ca/dataset/traffic-volumes-at-intersections-for-all-modes/ | verify ("License not specified") | 2026-10-16 | Demand baseline: car, bike and pedestrian volumes at corridor intersections (`tmc_most_recent_summary_data`, `tmc_summary_data`) | yes |
| Traffic Collisions (Toronto Police) | `police-annual-statistical-report-traffic-collisions` | https://open.toronto.ca/dataset/police-annual-statistical-report-traffic-collisions/ | verify ("License not specified") | 2026-10-16 | Optional; only if KSI is not enough. 4326 GeoJSON is 493 MB, do not download by default | yes (TPS documentation not read) |
| Permanent Bicycle Counters | `permanent-bicycle-counters` | https://open.toronto.ca/dataset/permanent-bicycle-counters/ | verify ("License not specified") | 2026-10-16 | Optional; bike volumes if a detector is on the corridor | yes |
| Official Plan Map 3: Right-of-Way Widths Associated with Existing Major Streets (June 2026) | — | https://www.toronto.ca/wp-content/uploads/2026/06/98b4-CityPlanning-Map-3-ROW-Widths-Associated-with-Existing-Major-Streets.pdf | verify | 2026-10-16 | Planned right-of-way width (hand lookup) | yes |
| Official Plan Schedule 1: Existing Minor Streets with Right-of-Way Widths Greater Than 20 Metres | — | https://www.toronto.ca/wp-content/uploads/2017/11/908d-cp-official-plan-Schedule-1.pdf | verify | 2026-10-16 | Planned right-of-way width for minor streets | yes |
| Toronto Centreline (TCL) | `toronto-centreline-tcl` | https://open.toronto.ca/dataset/toronto-centreline-tcl/ | verify (no licence in metadata) | 2026-10-16 | Corridor line geometry and joins; has **no width attribute** | yes |
| City of Toronto Lane Widths Guideline v3.0 (2025) | — | https://www.toronto.ca/wp-content/uploads/2025/11/96f7-Lane-Widths-Guideline-Version-3.0.pdf | verify | 2026-10-17 | Car, bus and parking lane widths (Table 15). Defers cycling facility widths to Ontario Traffic Manual Book 18 (not yet opened) | yes |
| NACTO Transit Street Design Guide, "Designing to Move People" | — | https://archive.strongtowns.org/journal/2016/5/23/excerpt-from-nacto-transit-street-design-guide | verify (NACTO page returned 403; read through this excerpt) | 2026-10-17 | Car lane (600-1,600 people/h) and bus lane (up to 8,000 passengers/h) capacity | yes (excerpt) |
| UK DESNZ Greenhouse gas reporting: conversion factors 2024, condensed set | — | https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024 | Open Government Licence (verify) | 2026-10-17 | Emission factors: "Average car" unknown fuel 0.16691 kg CO2e/km; "Average local bus" 0.10846 kg CO2e/passenger.km. UK fleet averages | yes |
| Cycling Network | `cycling-network` | https://open.toronto.ca/dataset/cycling-network/ | verify (no licence in metadata) | 2026-10-16 | Existing bike facilities (`INFRA_HIGHORDER`) | yes |
| Bike ways in Toronto (ArcGIS FeatureServer) | — | https://services.arcgis.com/As5CFN3ThbQpy8Ph/ArcGIS/rest/services/TorontoBikeways/FeatureServer | verify (service copyright: "City of Toronto") | 2026-10-16 | Not used; `cycling-network` is preferred | yes (fields only) |
| City of Toronto Open Data catalogue | — | https://open.toronto.ca/ | — | 2026-10-16 | Dataset search | yes |
| TTC Routes and Schedules | `ttc-routes-and-schedules` | https://open.toronto.ca/dataset/ttc-routes-and-schedules/ | verify ("License not specified") | 2026-10-16 | Stops, routes, trips per hour (GTFS) | slug only |
| OpenStreetMap (via OSMnx; Overpass Turbo for exploring) | — | https://www.openstreetmap.org/copyright | verify (copyright page names the Open Data Commons Open Database License; attribution required) | 2026-10-16 | Lane tags, sidewalks, parking, shops, persona destinations | yes (licence page); tag coverage no |
| 2021 Census Profile and census tract boundaries | — | — | verify | — | Commute mode share and demographics (approximation) | no (Statistics Canada blocked automated access) |
| Neighbourhood Profiles | `neighbourhood-profiles` | https://open.toronto.ca/dataset/neighbourhood-profiles/ | verify ("License not specified") | 2026-10-16 | Context | slug only |
| Ward Profiles (25-Ward Model) | `ward-profiles-25-ward-model` | https://open.toronto.ca/dataset/ward-profiles-25-ward-model/ | verify ("License not specified") | 2026-10-16 | Context | slug only |
| City Wards | `city-wards` | https://open.toronto.ca/dataset/city-wards/ | verify (no licence in metadata) | 2026-10-16 | Boundaries | slug only |
| Neighbourhoods | `neighbourhoods` | https://open.toronto.ca/dataset/neighbourhoods/ | verify ("License not specified") | 2026-10-16 | Boundaries | slug only |
| TTC Bus Delay Data | `ttc-bus-delay-data` | https://open.toronto.ca/dataset/ttc-bus-delay-data/ | verify (no licence in metadata) | 2026-10-16 | Transit reliability (should) | slug only |
| TTC Streetcar Delay Data | `ttc-streetcar-delay-data` | https://open.toronto.ca/dataset/ttc-streetcar-delay-data/ | verify (no licence in metadata) | 2026-10-16 | Transit reliability (should) | slug only |
| Bike Share Toronto | `bike-share-toronto` | https://open.toronto.ca/dataset/bike-share-toronto/ | verify ("License not specified") | 2026-10-16 | Bike context (nice) | slug only |
| Parks and Recreation Facilities | `parks-and-recreation-facilities` | https://open.toronto.ca/dataset/parks-and-recreation-facilities/ | verify ("License not specified") | 2026-10-16 | Persona destinations (nice) | slug only |
| Licensed Child Care Centres | `licensed-child-care-centres` | https://open.toronto.ca/dataset/licensed-child-care-centres/ | verify ("open-government-licence-toronto", see https://open.toronto.ca/open-data-licence/) | 2026-10-16 | Persona destinations (nice) | slug only |
| 311 Service Requests - Customer Initiated | `311-service-requests-customer-initiated` | https://open.toronto.ca/dataset/311-service-requests-customer-initiated/ | verify ("License not specified") | 2026-10-16 | Skip unless time | slug only |

## Field notes (confirmed from the datastore schema, 2026-10-16)

**KSI** (datastore resource `Motor Vehicle Collisions with KSI Data`)
- Size: 20,809 rows, 7,638 distinct `collision_id`. Dates run from 2006-01-01 to 2026-10-11.
- `collision_id` (text, e.g. `2006:893184`): the deduplication key.
- `accdate` (timestamp), `stname1`, `stname2`, `stname3`, `latitude`, `longitude`.
- `acclass`: `Non-Fatal Injury`, `Fatal Injury`, `Property Damage Only` (18 rows), plus 1 null.
- `injury` (per person): `Major`, `Minor`, `Minimal`, `Fatal`, or None.
- `road_user` (per person): `driver`, `pedestrian`, `passenger`, `owner`, `cyclist`, `motorcyclist`, `other`, `other_micromobility`.
- `pedestrian` and `cyclist` are `true`/`false` collision-level flags that repeat on every person row. 8,488 rows have `pedestrian = true` but only 3,671 rows have `road_user = pedestrian`, so count them **after** deduplicating.
- Also present: `traffictl`, `impactype`, `visible`, `light`, `rdsfcond`, `road_class`, `wardname`, `division`, `neighbourhood`, and others.
- The portal text refers to a data dictionary, but none is listed as a resource. **UNVERIFIED.**

**TMC** (`tmc_most_recent_summary_data`: 6,401 locations; `tmc_summary_data`: 30,953 counts)
- `latest_count_id` / `count_id`, `latest_count_date` / `count_date`, `location_name` (e.g. `Marlee Ave / Glengrove Ave`), `longitude`, `latitude`, `centreline_type`, `centreline_id`, `px`.
- `count_duration`: values seen are `14`, `8R` and `8S`. The 8R/8S meaning is **UNVERIFIED**.
- `total_vehicle`, `total_bike`, `total_heavy_pct`, `total_pedestrian`.
- `am_peak_start`, `am_peak_vehicle`, `am_peak_bike`, `am_peak_heavy_pct`, and the same `pm_peak_*` fields.
- `n_appr_vehicle`, `n_appr_bike`, `n_appr_heavy_pct`, and the same for `e_`, `s_` and `w_`.
- These are summary files, so pedestrian volumes come only as totals; per-leg pedestrian counts are in the raw files.

**Toronto Centreline, Version 2** (64,392 segments)
- `CENTRELINE_ID`, `LINEAR_NAME_FULL`, address ranges, `FROM_INTERSECTION_ID`, `TO_INTERSECTION_ID`, `ONEWAY_DIR_CODE`, `FEATURE_CODE(_DESC)`, `JURISDICTION`, `CENTRELINE_STATUS`.
- **No width field.**

**Cycling Network** (1,581 segments)
- `SEGMENT_ID`, `INSTALLED`, `UPGRADED`, `STREET_NAME`, `FROM_STREET`, `TO_STREET`, `ROADCLASS`, `CNPCLASS`, `SURFACE`, `OWNER`, `DIR_LOWORDER`, `INFRA_LOWORDER`, `INFRA_HIGHORDER`, `CONVERTED`.
- `INFRA_HIGHORDER` (segment count in brackets): Multi-Use Trail (370), Signed Route (No Pavement Markings) (196), Bike Lane (178), Multi-Use Trail - Entrance (177), Sharrows (141), Cycle Track (137), Sharrows - Wayfinding (102), Bike Lane - Contraflow (84), Multi-Use Trail - Boulevard (48), Bi-Directional Cycle Track (36), Park Road (35), Multi-Use Trail - Existing Connector (18), Bike Lane - Buffered (17), Cycle Track - Contraflow (14), Sharrows - Arterial - Connector (13), Multi-Use Trail - Connector (10), Sharrows - Arterial (5).
- Game mapping (our choice, not the City's): `Bike Lane`, `Bike Lane - Buffered` and `Bike Lane - Contraflow` → painted lane. `Cycle Track`, `Cycle Track - Contraflow` and `Bi-Directional Cycle Track` → protected lane.

**Bike ways in Toronto (ArcGIS)** (7,049 features)
- The facility field is `CP_TYPE`: `Bike Lanes` (1,265), `Cycle Tracks` (285), `Major Multi-use Pathway`, `Minor Multi-use Pathway`, `Signed Routes`, `Suggested On-Street Routes`, `Quiet Street Cycling Routes`, `Park Roads Cycling Connections`, `Informal Dirt Footpath`.

**Traffic Collisions (Toronto Police)** (825,265 records)
- `OCC_DATE`, `OCC_MONTH`, `OCC_DOW`, `OCC_YEAR`, `OCC_HOUR`, `DIVISION`, `FATALITIES`, `INJURY_COLLISIONS`, `FTR_COLLISIONS`, `PD_COLLISIONS`, `HOOD_158`, `NEIGHBOURHOOD_158`, `LONG_WGS84`, `LAT_WGS84`, `AUTOMOBILE`, `MOTORCYCLE`, `PASSENGER`, `BICYCLE`, `PEDESTRIAN`.

**Permanent Bicycle Counters** (59 locations)
- `location_dir_id`, `location_name`, `direction`, `linear_name_full`, `side_street`, `longitude`, `latitude`, `centreline_id`, `bin_size`, `first_active`, `last_active`, `date_decommissioned`, `technology`.

## Seen but not evaluated
- `sidewalk-inventory` (Sidewalk Inventory, Transportation Services; portal licence "open-government-licence-toronto") may help with sidewalk presence or width. Its fields have not been checked, so ask before using it.
