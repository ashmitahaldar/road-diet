# Devpost draft: Road Diet

Paste each section into Devpost. **UNVERIFIED** marks anything not confirmed yet. Fill it in before submitting.

## Initial submission (save a draft now, finish later)
Devpost lets you edit until the deadline, so save a draft with what is ready today:

| Devpost field | What to paste |
|---|---|
| Project name | Road Diet |
| Elevator pitch | The tagline below |
| About the project | "Inspiration" through "What's next", below |
| Built with | The "Built with" list below |
| Try it out | The repo link now; add the live game after the deploy (#10) |
| Image gallery | The 7 images in `docs/devpost/`, in order, with the captions below |
| Video demo | Add after #26 |

Fill in later: the live link, the video, the Gemini model, the Tiger Data and Vultr details, the domain and the Solo-hack declaration (all marked UNVERIFIED).

## Image gallery
Taken at 1440×960 from the current build, with no API server, so reactions are the built-in fallback text and no "Powered by Gemini" label shows. Retake 5 and 6 on the live site once Gemini is connected.
1. `1-start.png`: Road Diet. Every street has a budget.
2. `2-briefing.png`: Three steps and one goal. Then the real street, drawn from City of Toronto data.
3. `3-editor-3d.png`: Edit Bloor St W in 3D. Tap a piece and drag its handles; traffic follows the lanes you build.
4. `4-editor-2d-traffic.png`: The same street from above, with keyboard controls and a design tip.
5. `5-scorecard.png`: Goal met. Stars, badges, what residents said and the emissions change.
6. `6-residents-react.png`: Residents keep their reactions on screen while you try another design.
7. `7-data-sources.png`: Every source and every limitation, listed in the app.

## Tagline
Every street has a budget. How would you spend it?

## Inspiration / the problem
Road space on Toronto streets is fixed, but demands on it are not. Drivers, delivery trucks, transit riders, cyclists, people walking and local shops all compete for it. Debates about bike lanes, bus lanes and parking get heated, but the trade-offs are hard to see and feel, and the information is spread across datasets and reports.

The UofT School of Cities challenge asks: *"What would changing how we use road space actually do?"* (UNVERIFIED wording: copied from our spec. Check it against the challenge page before pasting.) Road Diet is a scenario explorer for that question.

## What it does
You redesign a real Toronto street, Bloor St W from Christie St to Ossington Ave (20 m wide, 0.61 km long), within its fixed width:
- add, remove, resize and reorder sidewalks, car lanes, a bus lane, painted or protected bike lanes, parking and trees
- edit in 3D (tap a piece, drag its handles) while cars, buses, bikes and people move along the lanes you build, or switch to a 2D view from above that also works by keyboard
- read design tips drawn from the model's own rules, such as "a painted bike lane beside parking puts riders in the door zone"
- press **Run a day**

Everything fits on one screen: meters and tips on the left, the street in the middle, the residents on the right.

A transparent model then estimates:
- emissions (kg CO₂e and % change against today's street)
- a safety index
- travel times
- how happy four fictional residents are with their trips: a delivery driver, a student who bikes, a senior who walks and a shop owner

Each resident reacts in their own words, and the reaction stays on their card while you try another design. The scorecard checks the level goal: cut emissions by at least 25% while keeping every resident at least 50 happy. It then shows:
- stars and badges
- a plain-language debrief
- a visible Limitations panel
- a chart of how other players solved the same street
- a share image of your result

## School of Cities questions
- **Who is the user?** Toronto residents, journalists, community groups and students who want an explorable, shareable way to understand what changing street space does.
- **What problem does it address?** Every metre of a street given to one use is taken from another, but those trade-offs are hard to see in the debate. The data behind them is spread across many sources.
- **How does the data solve it?** The level starts from real City of Toronto data for the corridor:
  - length from the Toronto Centreline
  - peak-hour car, bike and pedestrian volumes from a 2025 intersection count at Bloor/Shaw
  - nearby collisions where someone was killed or seriously injured (KSI), aggregated
  - existing cycle tracks from the Cycling Network
  - the planned right-of-way width from Official Plan Map 3

  The briefing opens with a map of the corridor drawn from this data: the street, nearby bike routes, subway stations and the collision total. Lane widths follow the City's Lane Widths Guideline. Lane capacities come from NACTO, and emission factors from UK DESNZ. Every source is linked in the app at `/data`.
- **How does it benefit the user?** It makes trade-offs concrete and personal: you see the effect through residents' eyes, not only as totals.
  - It explains each result in plain language.
  - It always says what the model cannot know.
  - It is neutral by design: it never rewards adding or removing a particular kind of lane. Stars and badges reward meeting the goal, fairness and balance.

## Responsible interpretation
- Footer on every page and on the scorecard: "A learning tool, not a forecast. Residents are fictional."
- The Limitations panel sits on the scorecard itself, not only on a separate page. It lists:
  - the cap on how many trips switch mode
  - that safety is a layout index, not a collision forecast
  - every value still waiting for a source
  - every game-design parameter
- Estimates in the corridor data are flagged in the app (baseline lane layout, 40 km/h speed, car occupancy).
- No neighbourhood rankings. The only comparison is with other runs of the same street.
- An automated test fails the build if game copy uses election words. The Gemini prompt forbids them, and a filter replaces any reply that uses them.

## Prize sections
**Best Climate Action & Sustainability.**
- Every scorecard shows estimated emissions in kg CO₂e and the % change against today's street.
- Level 1's goal is an emissions cut, so every winning run is a climate result.
- The debrief states the mode-shift assumption behind the emissions number.
- Emission factors: UK DESNZ 2024, "average car" 0.16691 kg CO₂e/km and "average local bus" 0.10846 kg CO₂e/passenger-km.

**MLH Best Use of Gemini API.**
- After each run, the server makes one Gemini call with structured JSON output. It returns the four residents' reactions (at most 25 words each) and a 2–3 sentence debrief.
- The prompt gets only numbers the server computed itself. Moods come from the model, never from Gemini. The debrief must cite a limitation.
- Any reply that is off-topic, too long or politically worded is replaced with canned text. A "Powered by Gemini" label appears only when the text really came from Gemini.
- Model: **UNVERIFIED** (the `GEMINI_MODEL` value on the server).

**MLH Best Use of Tiger Data.**
- Every run is stored in a TimescaleDB **hypertable** (`runs`, partitioned on `created_at`).
- A **continuous aggregate** (`runs_hourly`, refreshed every 30 minutes, with real-time aggregation so new runs show at once) stores hourly plays, star counts and emission sums per level. It feeds the scorecard chart "How others solved this street" and the average emissions cut.
- **Compression** is enabled on `runs`, segmented by level, with a 30-day policy.
- A percentile query on the raw hypertable powers "your least happy resident is happier than in N% of earlier runs".
- Seeded demo runs are flagged with a `demo` column and labelled in the chart.
- Tiger Data service URL: **UNVERIFIED** until it is connected.

**MLH Best Use of Vultr.**
- **UNVERIFIED until the deploy (#10):** the production game, its API and the Caddy reverse proxy with HTTPS run on a Vultr instance.
- The footer says "Hosted on Vultr".
- Instance type: **UNVERIFIED**.

**MLH Best Domain Name from GoDaddy Registry.**
- Domain: **UNVERIFIED**.
- Before claiming, check on the MLH prize page that its ending qualifies.

**Best Solo Hack.**
- Built solo; the Devpost team has one member.
- Everything in the repo was built during the event, from the first commit on 2026-10-16 at 22:32 (UTC−4). Pre-event preparation: **UNVERIFIED** (say what, if anything, was set up before the event).
- Built with an AI coding assistant (Claude Code). (UNVERIFIED: check how the organizers want AI assistance and pre-event preparation declared.)

## How we built it
- **Client:** React 19, Vite, Tailwind CSS v4, Motion, and Three.js for the editable 3D street (procedural models, no asset files), and Web Audio for short synthesized sounds.
- **Server:** Express 5 and zod, plus `pg` for Tiger Data / TimescaleDB.
- **Model:** pure TypeScript functions shared by the client and server, with vitest tests. Every constant is tagged with its source or marked as a design choice.
- **Data prep:** a Python script that pulls only corridor-sized extracts from Toronto Open Data, and draws the briefing's corridor map as a static SVG (no map tiles or API keys at demo time).

## Data sources
These are the sources used in the game, also listed in the app at `/data`.
- Toronto Centreline (TCL) v2: https://open.toronto.ca/dataset/toronto-centreline-tcl/
- Traffic Volumes at Intersections for All Modes: https://open.toronto.ca/dataset/traffic-volumes-at-intersections-for-all-modes/
- Motor Vehicle Collisions involving Killed or Seriously Injured Persons: https://open.toronto.ca/dataset/motor-vehicle-collisions-involving-killed-or-seriously-injured-persons/
- Cycling Network: https://open.toronto.ca/dataset/cycling-network/
- Official Plan Map 3, Right-of-Way Widths (June 2026): https://www.toronto.ca/wp-content/uploads/2026/06/98b4-CityPlanning-Map-3-ROW-Widths-Associated-with-Existing-Major-Streets.pdf
- City of Toronto Lane Widths Guideline v3.0 (2025): https://www.toronto.ca/wp-content/uploads/2025/11/96f7-Lane-Widths-Guideline-Version-3.0.pdf
- NACTO Transit Street Design Guide, "Designing to Move People" (read through this excerpt): https://archive.strongtowns.org/journal/2016/5/23/excerpt-from-nacto-transit-street-design-guide
- UK DESNZ Greenhouse gas reporting conversion factors 2024: https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024
- OpenStreetMap contributors (streets and subway stations on the corridor map, ODbL): https://www.openstreetmap.org/copyright

## Challenges
- Lane widths aren't in any open dataset, so today's layout is an estimate, flagged in the app.
- Bloor St W has the subway underneath and no daytime surface bus, so bus demand on this segment is zero.
- Keeping the scoring neutral: badges are gated on meeting the goal, because the unchanged street already scored as "fair".

## What's next
- A second corridor.
- Sourcing the remaining constants listed on `/data`.

## Built with
typescript, react, vite, tailwindcss, three.js, node.js, express, postgresql, timescaledb, tiger-data, gemini, vultr, caddy, python

## Links
- Live game: **UNVERIFIED** (domain)
- Repo: https://github.com/ashmitahaldar/road-diet
- Demo video: **UNVERIFIED** (upload, then check the link in an incognito window)

## Backup demo recording
`docs/demo/record.mjs` walks the spec 1.7c demo in about 77 s at 1280×720: the problem and neutrality line, the corridor and its sources, an edit and a run, the scorecard with Limitations, the Others chart, and the footer and `/data`. It has no voiceover. Narrate over it, or record your own and keep this one as the backup.

```bash
npm i --no-save playwright@1.64.1 && npx playwright install chromium
BASE_URL=https://<your-domain> node docs/demo/record.mjs /tmp/demo   # prints the timeline and the .webm path
ffmpeg -i /tmp/demo/*.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart road-diet-demo.mp4
```
Run it against the live site, so the video shows the domain, the Vultr footer and the Gemini label. The Others chart appears only when the server has a database.

---

## Pre-submission checklist (spec 1.7d)
| Item | Status |
|---|---|
| Devpost team size is 1 | You |
| Each prize opted in on Devpost: School of Cities, Climate, Solo, Gemini, Tiger Data, Vultr, GoDaddy | You |
| Devpost text names every prize and its feature | Done above; fill in the UNVERIFIED items |
| All data sources linked in Devpost and on `/data` | Done (list above = corridor `sources` + cited constants) |
| School of Cities answers pasted verbatim | Done above |
| Gemini, Tiger Data and Vultr labels visible in the live app | Blocked on deploy (#10), the Gemini key and the Tiger Data URL |
| Domain qualifies for GoDaddy Registry (confirmed on the MLH page) | You |
| Demo video uploaded; link works in an incognito window | You. A scripted backup is described above |
| Submitted at least 1 hour before the deadline (aim for 9:00 AM Sunday) | You |
