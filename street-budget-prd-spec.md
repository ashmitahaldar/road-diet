# Street Budget — PRD + Technical Spec

Project name: **Road Diet** ("Street Budget" was the working title; use Road Diet everywhere). See section 8b for the style spec.
Event: Hack the Valley 11 (Oct 16–18, 2026, UTSC). Solo build. Hard submission deadline: Sunday morning. Treat **Sunday 9:00 AM** as the real deadline.

---

## 0. Instructions for Claude Code (read first)

You are scaffolding and building a hackathon project with one human developer who has limited, fragmented time (about 13–14 hours total across Fri night, Sat evening, Sun morning).

Working rules:

1. **Playable first, pretty later.** A fun, working 60-second round must exist before any polish, 3D, or extra features.
2. **Deploy early.** A bare version must be live on a Vultr VPS (with HTTPS and a domain) before any Gemini/Tiger Data work.
3. **Small commits, working main.** Commit after each working step. Never leave `main` broken.
4. **Pure, testable model.** All game math lives in `shared/model` as pure TypeScript functions with unit tests. No I/O inside the model.
5. **Graceful degradation.** If Gemini or the database fails, the game must still work (canned persona lines, local-only scoring).
6. **No scope creep.** Anything not in the "Must" or "Should" lists below needs explicit approval from the developer.
7. **Secrets stay on the server.** The Gemini key and DB credentials never ship to the browser.
8. **Ask before guessing data.** Real Toronto numbers go in `data/` with a documented source. Placeholder constants must be clearly marked `TODO-SOURCE` and listed in the limitations panel until replaced.

---

## 1. Product Requirements (PRD)

### 1.1 One-liner
A short, replayable game where you redesign a real Toronto street's limited road space and see how it affects the daily trips of five residents, plus emissions, safety and fairness.

### 1.2 Problem
Road space on Toronto streets is fixed, but demands on it are not: drivers, delivery trucks, transit riders, cyclists, people walking, and local shops all compete. Debates about bike lanes, bus lanes and parking are heated, but the trade-offs are hard for residents, journalists and community groups to see and feel. Existing information is fragmented across datasets and reports.

### 1.3 Target users (answers the School of Cities "Who is the user?")
- **Primary:** Toronto residents and first-time voters who want to understand what changing street space actually does, ahead of the 2026 municipal election.
- **Secondary:** Journalists, community organizations, and students who want an explorable, shareable way to discuss street-design trade-offs.

### 1.4 How it benefits the user
- Makes trade-offs concrete: every metre given to one use is taken from another.
- Shows impacts through residents' eyes, not just aggregate numbers.
- Explains in plain language what the design did and what the model does not capture.
- Neutral by design: **no candidates, no parties, no election predictions, no recommendations on how to vote.**

### 1.5 Goals
- A usable, playable prototype (not just an analysis) with a clear problem and user.
- Real Toronto data as the foundation for at least one corridor, with sources linked in-app.
- Responsible interpretation: visible limitations, no stigmatizing neighbourhood comparisons.
- Intentional AI use (grounded persona reactions + planner debrief), not a generic chatbot.

### 1.6 Non-goals
- Predicting election outcomes or supporting any candidate or party.
- Real traffic simulation or routing. The model is a transparent, simplified estimate.
- Accounts, authentication, payments, multiplayer.
- A full city-wide tool. One to two corridors only.
- A 3D editor. (3D is a read-only view; see Stretch.)

### 1.7 Prize targets and how the project maps
| Prize | How we qualify | Requirement to satisfy |
|---|---|---|
| UofT School of Cities Challenge | Civic tool on Toronto data; scenario explorer format; road-space prompt | Answer the 4 questions in the submission, link all data sources, limitations panel, election-neutral |
| Best Climate Action & Sustainability | Emissions meter, mode-shift effects | Make emissions impact explicit in demo |
| Best Solo Hack | Solo build | Stay solo; do not join a team |
| Best Use of Gemini API | Persona reactions + planner debrief | Mention in Devpost + demo |
| Best Use of Tiger Data | Store every run; "how other players solved it" aggregate | Use Tiger Data (Postgres + hypertable/continuous aggregate) visibly |
| Best Use of Vultr | Production deploy on Vultr | Use the MLH promo code for credits |
| Best Domain from GoDaddy Registry | Game on a registered domain | Register a fun domain |
| DEV Writing Challenge | Post-event write-up | Do after the event |

Devpost: opt in to each prize explicitly.

### 1.7b Prize Compliance Matrix (no ambiguity)

Rule: every targeted prize needs (a) a feature a judge can see in under 10 seconds, (b) a sentence in the Devpost description that names the prize and the feature, and (c) a moment in the 2-minute demo. If a prize has no feature in the product, we do not claim it.

**UofT School of Cities Challenge** (rubric: usefulness, creativity, urban insight, technical execution, AI integration, accessibility, responsible interpretation)
| Their requirement | Where it lives in the product |
|---|---|
| Who is the user? | Landing page: "For Toronto residents, journalists and community groups" |
| What problem? | Landing page: one sentence on road-space trade-offs; same text in Devpost |
| How does the data solve it? | Every level starts from real corridor data (width, volumes, collisions, mode share) shown on the level briefing |
| How does it benefit the user? | Scorecard + planner debrief explain trade-offs in plain language |
| Links to all data sources | `/data` page auto-generated from each corridor JSON `sources`; also pasted into Devpost |
| Not predicting the election / no candidate support | Footer statement on every page; no candidate or party content anywhere |
| Responsible interpretation | Visible Limitations panel on the scorecard (not only a separate page); fictional personas labelled; no neighbourhood rankings |
| AI integration with intention | Gemini persona reactions and debrief are computed from model output, cite the numbers used, and say what they cannot know |
| Accessibility | Keyboard-operable editor, text labels beside colours, works at phone width |
| Meaningful use of Toronto data | Corridor map panel on the level briefing, with linked sources |
Format fit: their listed formats include "scenario explorer"; their listed prompt includes "What would changing how we use road space actually do?" Quote that prompt in the Devpost.

**Best Climate Action & Sustainability (HTV theme prize)**
- Headline metric on every scorecard: estimated **kg CO2e per day** and **% change vs baseline**.
- Level 1 goal is an emissions target, so every winning run is a climate result.
- Debrief always states the mode-shift assumption behind the emissions change.
- Devpost: pick this as the primary theme track. Ask organizers whether a project can be entered in more than one theme prize; do not assume.

**Best Solo Hack**
- Devpost team has exactly one member. No teammates listed. No joining a team at team formation.
- Ask the organizers how they treat AI coding assistants and pre-event prep (keys, accounts); state in Devpost what was built during the event.

**MLH: Best Use of Gemini API**
- Two visible Gemini features: persona reactions after every run, and the end-of-level planner debrief.
- Both use structured JSON output and are grounded in computed metrics.
- UI shows a small "Powered by Gemini" label next to those outputs; Devpost names the model used.

**MLH: Best Use of Tiger Data** (their criteria stress real-time data, time-series, continuous aggregates, SQL, compression)
- Every run is stored in a hypertable; the results screen shows a live "how other players solved this street" chart read from a **continuous aggregate**.
- Optional (Should): store per-round metric snapshots as a time series so the chart shows the run's trajectory, not just the final score.
- Optional: enable compression on the hypertable and mention it in Devpost.
- Devpost: one paragraph describing the schema, the hypertable, the continuous aggregate and the chart it powers.

**MLH: Best Use of Vultr**
- Production app (frontend, API and reverse proxy) runs on a Vultr instance; site footer says "Hosted on Vultr".
- Devpost: state the instance type and what runs on it. Use the MLH promo code for credits.

**MLH: Best Domain Name from GoDaddy Registry**
- Check the MLH prize page for which domain endings qualify and how to claim; do not assume any ending counts.
- Register a short, memorable domain with a qualifying ending and make it the primary URL for the game, the Devpost link and the demo.

**DEV Writing Challenge ($100)**
- After the event: publish a build write-up on DEV (the model design, the data choices, what went wrong). Follows their notes on substance, originality and storytelling.

**Not targeted (no feature, so no claim):** Best Use of Solana, AI for Social Impact, FinTech, Healthcare, PointClickCare, FDM, Project KAZE, Papiers.ai, Best Beginner Hack (only if it applies to you; check the eligibility wording).

### 1.7c Judge-facing demo script (2 minutes)
1. (10s) Problem and user: "Toronto's road space is fixed; this lets residents feel the trade-offs before the election." State the neutrality line.
2. (15s) Show the real corridor: width, mode share, collision data, with source links visible.
3. (40s) Play a round: change the layout, run a day; emissions and safety meters move; residents react (Gemini label visible).
4. (20s) Scorecard: stars, kg CO2e change, Limitations panel opened.
5. (20s) "How other players solved this" chart (Tiger Data continuous aggregate).
6. (15s) Show the custom domain, the Vultr footer, and the Data page with all sources.
Keep a recorded backup of this exact flow.

### 1.7d Pre-submission prize checklist
- [ ] Devpost team size is 1.
- [ ] Each prize above is explicitly opted in on Devpost.
- [ ] Devpost text names every prize and its feature (copy from 1.7b).
- [ ] All data sources linked in Devpost and on `/data`.
- [ ] School of Cities answers (user, problem, data solution, benefit) pasted verbatim.
- [ ] Gemini, Tiger Data and Vultr labels visible in the live app.
- [ ] Domain qualifies for the GoDaddy Registry prize (confirmed on the MLH page).
- [ ] Demo video uploaded and link works in an incognito window.
- [ ] Submitted at least 1 hour before the deadline.

### 1.8 Core user flow
1. Landing: short explainer + "Play" button + link to Data & Limitations.
2. Pick a level (a Toronto corridor).
3. Level briefing: the street, its width, the goal (e.g. "cut emissions 20% without any resident dropping below 40 happiness").
4. Edit the cross-section: add/remove/resize street elements within the fixed width.
5. Press "Run a day": model computes metrics, residents' trips play out, residents react (Gemini).
6. See the scorecard (stars), try again or continue to the next level.
7. End: planner debrief (Gemini), data sources, limitations, "how other players solved this" (Tiger Data).

### 1.9 Feature priority

**Lean scope.** Items cut from Must/Should are kept under Stretch and marked with their old ID.

**Must (ship or don't submit)**
- M1. One level on one real corridor with real baseline data.
- M2. 2D cross-section editor with fixed total width and 7 elements: sidewalk, car lane, bus lane, painted bike lane, protected bike lane, parking, planter.
- M3. Model: capacity, capped mode shift, congestion, emissions, safety index, happiness, fairness.
- M4. Four personas: delivery driver, student cyclist, senior pedestrian, shop owner.
- M5. Scorecard with goal check and 1–3 stars.
- M6. Deployed on Vultr with HTTPS and a custom domain.
- M7. Data & Limitations page with all sources linked.
- M8. Gemini persona reactions with canned fallback.

**Should**
- S1. One Gemini call that returns persona reactions plus a 2–3 sentence debrief.
- S2. Tiger Data run logging, one continuous aggregate, one stats endpoint and one chart ("how others solved this street").
- S3. The three badges, the percentile line and the "Copy my result" text button (section 2.7).

**Stretch (do not build unless everything above is done and deployed)**
- Random events: snowstorm, festival, delivery surge, collision. *(was S4)*
- Sound effects and juicy feedback: meter animations, persona bounce. *(was S5)*
- Level 2: a second level/corridor. *(was S3)*
- Shareable result image card. *(was S6)*
- Corridor map panel: a read-only map of the real corridor on the level briefing, showing context data (section 8c). *(was S7)*
- "Political capital" resource that limits big changes. *(was C2)*
- Town-hall round.
- Daily challenge.
- Read-only 3D street view (Three.js) rendering the same layout data. Time-box 3 hours. Cut if unstable. *(was C1)*
- Animated traffic strip above the editor. *(was C3)*
- Unlockable tools across levels. *(was C4)*
- Loading zone and patio elements (section 2.2). *(cut from M2)*
- The parent-with-stroller persona (section 2.3). *(cut from M4)*
- Extra datasets: TTC delay, Bike Share, parks, child care (section 4.2).
- Separate end-of-level planner debrief. *(was S1; folded into the single Gemini call)*

---

## 2. Game Design Spec

### 2.1 Street model
- A level defines a **right-of-way cross-section** of fixed total width `W` metres (e.g. 20 m) and a baseline layout.
- The player edits an ordered list of **elements**, left to right. Total width must equal `W` (UI enforces; excess is not allowed, leftover is shown as "unused space" and penalized slightly).

### 2.2 Element types
Each has a default width, min/max width, and properties used by the model. Values below are placeholders; keep them in `shared/model/constants.ts` with `source` fields.

| id | Label | Default w (m) | Min–Max (m) | Notes |
|---|---|---|---|---|
| `sidewalk` | Sidewalk | 2.5 | 1.5–6 | Pedestrian capacity, comfort |
| `bike_painted` | Painted bike lane | 1.5 | 1.2–2 | Cyclist capacity, weaker safety |
| `bike_protected` | Protected bike lane | 2.0 | 1.8–3 | Higher cyclist capacity and safety |
| `bus_lane` | Bus lane | 3.3 | 3–3.7 | High person throughput, transit speed |
| `car_lane` | Car lane | 3.3 | 3–3.7 | Vehicle throughput, emissions |
| `parking` | On-street parking | 2.4 | 2–2.7 | Shop access, blocks space, door-zone risk |
| `loading` | Loading zone **(Stretch)** | 3.0 | 2.5–3.5 | Deliveries, shop access |
| `planter` | Trees/planting strip | 1.5 | 1–3 | Comfort, buffer, small safety gain |
| `patio` | Patio/public space **(Stretch)** | 2.0 | 1.5–4 | Shop revenue, comfort |

Lean scope: the 7 elements without **(Stretch)** are Must. Loading zone and patio keep their definitions for later.

### 2.3 Personas (fictional composites, never real people)
| id | Name (example) | Trip | Cares about |
|---|---|---|---|
| `driver_delivery` | Marco, delivery driver | Drives a route, loads at shops | Car/loading capacity, travel time |
| `student_cyclist` | Priya, student | Bikes to campus | Bike safety, bike continuity |
| `senior_walker` | Mr. Okafor, senior | Walks to pharmacy and grocery | Sidewalk width, crossings, comfort, nearby parking/loading |
| `parent_stroller` | Dana, parent with stroller **(Stretch)** | Walks to daycare, uses transit | Sidewalk, buffer from traffic, bus reliability |
| `shop_owner` | Lin, shop owner | Runs a store on the street | Foot traffic, loading, patio, parking |

Each persona has: `id`, `name`, `blurb`, `weights` (over metrics), `trip` (mode, distance in km), `baselineHappiness`.

Lean scope: the 4 personas without **(Stretch)** are Must. The parent persona keeps its definition for later.

### 2.4 Levels
- **Level 1 (required):** one real corridor, simple, goal on emissions + minimum happiness.
- **Level 2 (Stretch; was Should):** a harder context (e.g. streetcar line or narrow downtown block) with a different goal such as safety.
- Each level JSON declares: corridor id, width `W`, baseline layout, baseline demand, allowed elements, goal, star thresholds.

### 2.5 Events (Stretch; was Should)
Applied before "Run a day", with visible modifiers: snowstorm (bike use down, bus delay up), festival (pedestrian demand up), delivery surge (loading demand up), collision (safety weight up for that round).

### 2.6 Scoring and stars
- Level goal: set of constraints, e.g. `emissionsReductionPct >= 20` and `min(personaHappiness) >= 40`.
- Stars: 1 = goal met; 2 = goal met and safety score >= threshold; 3 = goal met, safety >= threshold, fairness (min persona happiness) >= higher threshold.

### 2.7 Gamification (lean)
- Level goal with 1–3 stars, as specified in 2.6.
- Badges (thresholds are configurable constants):
  - **Fair Share:** minimum persona happiness >= 60.
  - **Low-Carbon Street:** `emissionsReductionPct >= 30` AND minimum persona happiness >= 40.
  - **Everyone's Second Choice:** spread (max minus min persona happiness) <= 25 AND minimum >= 40.
- Percentile line on the results screen, from the Tiger Data stats endpoint (for example "you scored higher on fairness than X% of runs"). Hide it when fewer than 20 runs exist.
- "Copy my result" button: copies a short text summary (stars, badge names, kg CO2e change, game URL) to the clipboard.
- **Neutrality rule:** scoring and badges must reward balance, fairness and meeting stated goals. No score, badge or message may reward removing or keeping car lanes, bike lanes or parking as such. Do not use the words vote, election, party or candidate in game copy.
- Keep the Data and Limitations link visible on the scorecard.

---

## 3. Model Spec (pure functions)

All functions are pure, deterministic and unit-tested. Constants are tunable and documented with sources. **Anything without a verified source is labelled `TODO-SOURCE` and listed in the in-app limitations.**

### 3.1 Types (sketch)
```ts
type ElementId = 'sidewalk'|'bike_painted'|'bike_protected'|'bus_lane'|'car_lane'|'parking'|'loading'|'planter'|'patio';
type Layout = { elements: { id: ElementId; widthM: number }[] };
type Mode = 'car'|'bus'|'bike'|'walk';
type Demand = Record<Mode, number>;           // persons/hour on the corridor at peak
type Metrics = {
  emissionsKgPerHour: number;
  emissionsReductionPct: number;              // vs baseline layout
  safetyScore: number;                        // 0-100
  travelTimeMin: Record<PersonaId, number>;
  happiness: Record<PersonaId, number>;       // 0-100
  fairness: number;                           // min happiness
  unusedWidthM: number;
};
```

### 3.2 Capacity per mode
Per element, a `capacityPersonsPerHour` (placeholder, `TODO-SOURCE`; design-guide figures such as NACTO's are a candidate source and must be verified before use). Total mode capacity = sum over elements serving that mode, adjusted by width relative to the standard width (linear, clamped).

### 3.3 Mode shift
Start from baseline observed mode shares for the corridor (data). Compute each mode's **quality index** from the layout (capacity, protection, continuity). Shift a limited share of demand between modes as quality changes:

```
shift_to_mode_m = clamp( k * (quality_m(layout) - quality_m(baseline)), -maxShift, +maxShift )
```
Shifts are taken proportionally from other modes. `k` and `maxShift` are constants; cap total shift (e.g. 25%) to avoid unrealistic swings. Document this as an assumption.

### 3.4 Congestion and travel time
Use a BPR-style volume-delay function for vehicle modes:
```
t = t0 * (1 + alpha * (v / c)^beta)   // alpha=0.15, beta=4 as common defaults
```
- Car time uses car volume vs car lane capacity.
- Bus time uses bus lane presence (a bus lane greatly reduces the congestion term).
- Bike and walk time are mostly distance / speed, with small penalties for low-protection or narrow sidewalks.
Per persona travel time = persona trip distance / mode speed under the computed conditions.

### 3.5 Emissions
```
emissions = sum_m ( personKm_m * emissionFactor_m )   // car > bus > bike/walk = 0
```
Emission factors are placeholders (`TODO-SOURCE`); use a published Canadian source and record it. `emissionsReductionPct` is relative to the level's baseline layout under baseline demand.

### 3.6 Safety score (0–100, higher is safer)
Start from a corridor baseline risk (from collision data) and apply multipliers:
- Protected bike lane: lowers cyclist risk; painted lane: smaller reduction; none: baseline.
- Planter/buffer and wider sidewalk: lower pedestrian risk.
- More car lanes: higher speed, higher risk.
- Parking next to bike lane without buffer: door-zone penalty.
Document as a **simplified index, not a prediction of collisions**.

### 3.7 Persona happiness (0–100)
Normalize relevant metrics to 0–1 per persona (travel time vs baseline, safety, comfort, access) and compute:
```
happiness_p = 100 * sum_i ( w_{p,i} * metric_i ) / sum_i w_{p,i}
```
Weights live in persona definitions. Add event modifiers when active.

### 3.8 Fairness
`fairness = min(happiness_p)`. Also expose spread (max−min) for the debrief.

### 3.9 Tests required
- Layout width validation (sum equals `W`, within min/max).
- Monotonic sanity checks: adding a protected bike lane never lowers cyclist safety; removing a car lane never raises car capacity.
- Baseline layout yields `emissionsReductionPct == 0`.
- Mode shift caps respected.

---

## 4. Data Spec

### 4.1 Principle
Real Toronto data is the foundation. Use a small preprocessing step to produce one static JSON per corridor so the app never depends on live data at demo time.

### 4.2 Candidate datasets (verify availability and licence before use)
Plan to confirm each after the School of Cities data workshop and the "Toronto Civic Data Starter Guide":
- Street/centreline geometry and right-of-way width
- Traffic volumes (City of Toronto)
- Collision data (e.g. Toronto Police Service open data on killed or seriously injured collisions)
- Cycling network (City of Toronto)
- TTC routes, stops, and (if available) ridership/delay data
- Census/neighbourhood indicators (commute mode share, demographics) from the Census and City neighbourhood profiles
- Neighbourhood/ward boundaries

**Corridor selection criteria:** (1) has collision, volume and transit data nearby; (2) real, defensible right-of-way width; (3) has meaningful car/bike/bus/pedestrian mix; (4) recognizable to Toronto residents; (5) one to a few blocks only.

### 4.3 Preprocessing
- `data/prep/` Jupyter notebook or Python script (pandas, geopandas, numpy) that reads raw downloads and writes `data/corridors/<id>.json`.
- Raw downloads go in `data/raw/` and are git-ignored if large. Keep a `data/SOURCES.md` listing each dataset, URL, licence and retrieval date.

### 4.4 Corridor JSON schema
```json
{
  "id": "example-corridor",
  "name": "Example St (X to Y)",
  "widthM": 20,
  "lengthKm": 0.8,
  "baselineLayout": [{ "id": "sidewalk", "widthM": 2.5 }],
  "baselineDemand": { "car": 0, "bus": 0, "bike": 0, "walk": 0 },
  "baselineSafety": { "ksiCollisions5y": 0, "pedestrianInvolved": 0, "cyclistInvolved": 0 },
  "freeFlowSpeedKph": 30,
  "sources": [{ "label": "", "url": "", "retrieved": "YYYY-MM-DD", "note": "" }],
  "mapSvg": "data/corridors/example-corridor.map.svg"
}
```
Numbers above are structure only; fill from real data.
`mapSvg` is optional: the path to the generated corridor map SVG (see 8c).

---

## 5. AI Spec (Gemini)

### 5.1 Principles
- **Grounded:** the model receives computed metrics and facts; it explains only what is in them and says so when it does not know.
- **Structured output:** request JSON so the UI can render reliably.
- **Neutral:** no candidates, parties, election predictions, or voting advice. Residents are fictional and clearly labelled.
- **Safe fallback:** on error or timeout (>6 s), show canned lines per persona and a generic debrief.

### 5.2 Endpoints and prompts
**`POST /api/react`** — input: layout, metrics before/after, active event, personas. Output:
```json
{ "reactions": [{ "personaId": "senior_walker", "mood": "up|flat|down", "line": "<=25 words, first person" }] }
```
Prompt rules: stay in character; refer only to supplied numbers; one concrete reason per line; no real people or politicians.

**`POST /api/debrief`** — input: final layout, metrics, goal result, level facts. Output:
```json
{ "summary": "<=120 words plain language",
  "tradeoffs": ["..."],
  "limitations": ["..."] }
```
The debrief must always include at least one limitation relevant to the design.

Use the `gemini-*` model string available to the developer's key (confirm in AI Studio) and keep it configurable via env var.

---

## 6. Architecture and Stack

- **Frontend:** React + Vite + TypeScript, SVG-based cross-section editor, Tailwind, Framer Motion. No game engine.
- **Backend:** Node + Express (TypeScript). Serves the built frontend and the API from one process.
- **Shared:** `shared/` package with model, types, constants (imported by both).
- **AI:** Gemini API from the server only.
- **DB:** Tiger Data (Postgres). Store runs; expose aggregates.
- **Hosting:** Vultr VPS, Caddy reverse proxy for automatic HTTPS, systemd or Docker for the server process.
- **Domain:** registered through GoDaddy Registry, DNS A record to the Vultr IP.
- **Stretch 3D:** Three.js / react-three-fiber, read-only, primitive shapes only.

### 6.1 Repository layout
```
street-budget/
  README.md
  package.json            # workspaces: client, server, shared
  .env.example
  .gitignore
  shared/
    src/model/            # pure functions + constants + types
    src/personas.ts
    src/levels/           # level JSON/TS
    tests/
  client/
    index.html
    src/                  # React app, editor, scorecard, pages
  server/
    src/index.ts          # Express app
    src/routes/           # react, debrief, runs, stats
    src/gemini.ts
    src/db.ts
    migrations/
  data/
    SOURCES.md
    raw/                  # git-ignored if large
    prep/                 # notebooks/scripts
    corridors/            # output JSON used by the app
  deploy/
    Caddyfile
    street-budget.service # or docker-compose.yml
  docs/
    DEVPOST.md            # submission answers drafted early
```

### 6.2 Environment variables
```
GEMINI_API_KEY=
GEMINI_MODEL=
DATABASE_URL=            # Tiger Data connection string
PORT=3000
NODE_ENV=production
```
`.env` is git-ignored. Provide `.env.example` only.

---

## 7. API Spec

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/levels` | List levels |
| GET | `/api/levels/:id` | Level + corridor data |
| POST | `/api/react` | Persona reactions (Gemini, with fallback) |
| POST | `/api/debrief` | Planner debrief (Gemini, with fallback) |
| POST | `/api/runs` | Save a finished run (Tiger Data) |
| GET | `/api/stats/:levelId` | Aggregates: star distribution, most common element mix |
| GET | `/api/health` | Health check |

Validation with a schema library (zod). Rate-limit AI endpoints (simple in-memory limiter) to protect the key. Request size limits.

### 7.1 Database (Tiger Data / Postgres)
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE runs (
  id           BIGSERIAL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  level_id     TEXT NOT NULL,
  layout       JSONB NOT NULL,
  emissions_reduction_pct DOUBLE PRECISION NOT NULL,
  safety_score DOUBLE PRECISION NOT NULL,
  fairness     DOUBLE PRECISION NOT NULL,
  stars        SMALLINT NOT NULL,
  event_id     TEXT,
  PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('runs', 'created_at', if_not_exists => TRUE);

-- Continuous aggregate for fast "how others solved it"
CREATE MATERIALIZED VIEW runs_hourly
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', created_at) AS bucket,
       level_id,
       count(*) AS plays,
       avg(stars) AS avg_stars,
       avg(emissions_reduction_pct) AS avg_emissions_reduction
FROM runs
GROUP BY bucket, level_id;
```
Confirm extension availability on the Tiger Data instance; fall back to a plain table if needed.

---

## 8. UX Spec

- **Editor:** horizontal strip, colour-coded blocks with width labels. Drag handles or +/- buttons to resize; add/remove from a palette. Always show remaining width. Snap to 0.1 m.
- **Run a day:** persona cards animate their trips; meters fill; reactions appear as speech bubbles.
- **Scorecard:** stars, goal checklist, four meters (emissions, safety, travel time, fairness).
- **Data & Limitations page:** sources (with links), model assumptions, every `TODO-SOURCE` constant, and plain statements such as "This is a simplified estimate, not a prediction" and "Personas are fictional".
- **Tone:** friendly, neutral, civic. Clear, large text; keyboard accessible; sufficient colour contrast; do not rely on colour alone to carry meaning; works on laptop and phone widths.
- **Neutrality:** no election content beyond a one-line context note. Never rank neighbourhoods against each other.

---

## 8b. UI and Style Spec

Project name: **Road Diet** (a real planning term for taking lanes out of a street and giving the space to other uses). Use "Road Diet" in the UI title, repo and copy. Tagline: **"Every street has a budget. How would you spend it?"**

### Design direction
- Friendly city-planning look: flat vector shapes, rounded corners, 2px dark outlines, no gradients or realistic textures. Think transit-agency street cross-section poster crossed with a puzzle game.
- Background is warm "planner paper" with a faint grid.
- **Neutral by design:** no red-vs-green good/bad framing for car vs bike vs bus. Meters use calm distinct accent colours, never traffic-light colours.
- Build everything with SVG, CSS and Tailwind. No images required.

### Design tokens (define first, in `tailwind.config` and CSS variables, before building screens)
| Token | Value |
|---|---|
| `--paper` | `#FAF6EE` |
| `--grid` | `#E8E1D2` |
| `--ink` | `#1F2A37` |
| `--primary` | `#2B59C3` |
| `--sidewalk` | `#CBD2D9` |
| `--car` | `#4A5560` |
| `--bike-painted` | `#7CC576` (dashed edge) |
| `--bike-protected` | `#2FA84F` (solid barrier stripe) |
| `--bus` | `#D64545` (a nod to Toronto's red transit lanes) |
| `--parking` | `#5B8DEF` (hatched) |
| `--loading` | `#F2C94C` |
| `--planter` | `#3E8E5A` (dotted/tree icons) |
| `--patio` | `#F2994A` |
| meter: emissions | `#1E9E8A` |
| meter: safety | `#5B5BD6` |
| meter: travel time | `#2B8FD6` |
| meter: fairness | `#A24CB8` |

Spacing on a 4px scale; corner radius 12-16px; 2px ink outlines on blocks and cards. Check text contrast against WCAG AA.

### Typography
- Display: a rounded Google Font such as **Fredoka** for titles and the logo.
- UI/body: **Inter**.
- Tabular numerals on all meter values so they do not jitter while animating.

### Element visuals (never rely on colour alone)
Each street element has a colour, a pattern or icon, and a text label:
- Car lane: solid dark with dashed centre marks
- Bus lane: red with a bus icon
- Bike lanes: green with a bike icon (painted = dashed edge, protected = solid barrier stripe)
- Parking: blue with diagonal hatching and a "P"
- Loading: yellow with a box icon
- Sidewalk: light grey with a walking icon
- Planter: green with tree icons
- Patio: orange with table icon
Labels show width in metres on or directly under each block.

### Screens and layout (desktop)
- **Header:** logo + level name, goal checklist, remaining width.
- **Centre:** the cross-section editor, as large as possible; this is the hero of the screen.
- **Bottom:** element palette as large chips with icons.
- **Side panel:** persona cards (avatar, name, mood, speech bubble) and the four meters.
- **Primary action:** one large "Run a day" button.
- **Scorecard:** modal with stars, goal checklist, kg CO2e change, Limitations panel, debrief, "how others solved it" chart.
- Other pages: Landing (explainer, Play), Level select, Data & Limitations.

### Screens and layout (phone)
- Single column: editor full width, palette as a bottom sheet, meters as a compact bar that expands, persona cards in a horizontal scroll.
- Tap targets at least 44px; no hover-only interactions.

### Motion and sound
- Meters animate with eased fills; persona avatars bounce on mood change; stars pop in one at a time; blocks animate when resized.
- Use Framer Motion; respect `prefers-reduced-motion`.
- Short sound cues for place, remove, run and win; a visible mute toggle; no autoplay before first interaction.

### Personas visuals
- Simple flat avatars (emoji or SVG), one accent colour each; always labelled "fictional resident". Speech bubbles are short (max 25 words).

### Copy and tone
- Friendly, plain language, light humour (for example "Your street went on a diet").
- Never name candidates, parties or elections beyond one neutral context line in the footer.
- Always say what the model cannot know.

### Accessibility checklist
- Keyboard-operable editor (arrow keys to resize, Enter to place); visible focus states.
- ARIA labels and live regions for meter changes; text alternatives for charts.
- Colour contrast AA; pattern + icon + label for every element.
- Works at phone width and with reduced motion.

### Process rules for the UI
1. Set up tokens, fonts and base components (button, card, meter, chip, modal) first.
2. Build the editor first and share a screenshot with the developer before building other screens.
3. Do not introduce new colours, fonts or component styles outside this section without asking.

---

## 8c. Corridor Map Panel (Stretch; was Should S7)

- **Purpose:** make the real Toronto data visible in the first 10 seconds of a level (supports the School of Cities "urban insight" and "uses Toronto data" criteria). It is read-only context, not a game mechanic.
- **Default implementation:** a static SVG generated in `data/prep` from the corridor's GeoJSON (corridor line, nearby bike lanes, transit stops, aggregated collision counts), saved to `data/corridors/<id>.map.svg` and rendered in the level briefing. No third-party tile service, no API keys, no network dependency at demo time.
- **Upgrade path (only if all Must and Should items are done):** a Leaflet map with a basemap. If used, use a tile provider whose free tier and terms allow a deployed hackathon site, include attribution, and keep the static SVG as a fallback if tiles fail to load.
- **Content rules:** highlight the corridor; show a legend; show collisions only as aggregated counts or density, never individual incident details; link and credit all data sources, including OpenStreetMap attribution, on the map and on the `/data` page.
- **Style:** follow section 8b tokens (flat shapes, paper background, 2px ink outlines, pattern + label for each layer, not colour alone).
- **Accessibility:** provide a text alternative describing what the map shows and the key numbers.
- **Performance:** the map must not slow the level briefing on a phone.
- **Schema:** optional corridor JSON field `"mapSvg": "<path to the generated svg>"` (section 4.4).

---

## 9. Milestones (fits the developer's schedule)

**Friday (~3.5 h):** scaffold, model and tests, editor + meters + personas + scorecard, deploy.

**Saturday evening (~5.5 h):** corridor JSON and sourced constants, Gemini call, Tiger Data, badges and percentile, buffer.

**Sunday morning (~2 h):** phone and keyboard check, neutrality review, demo video, Devpost, **submit by 9:00 AM**.

**Fallback rule:** if you are behind at the end of the first hour on Saturday, use canned persona lines and skip the percentile line before cutting anything else.

**Cut order if behind:** Stretch items → S3 → S2 → S1. Never cut M-items.

---

## 10. Acceptance Criteria (Definition of Done)

- Live at the custom domain over HTTPS on Vultr.
- A new player can understand the goal and finish Level 1 in under 3 minutes without instructions.
- All Must features work; unit tests for the model pass.
- Gemini and DB outages do not break gameplay.
- Data & Limitations page lists every source with a link and every placeholder constant.
- No API keys in the client bundle or git history.
- Devpost submission complete, with a demo video and all prize opt-ins done.

---

## 11. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Real data is messy or missing | Time-box corridor selection to ~60 min; fall back to a simplified level with clearly labelled assumptions |
| Model numbers questioned by judges | Transparent formulas, sourced constants, visible limitations, "simplified estimate" framing |
| Gemini slow or unavailable | Timeout + canned fallback lines; cache identical requests |
| Deploy problems late | Deploy in Block 1; redeploy after each milestone |
| Stigmatizing comparisons | One corridor at a time, no rankings, fictional personas |
| Developer time is fragmented | Small commits, working main, strict priority order |
| Scope creep (3D) | 3D only after all Must/Should work; time-boxed; read-only |

---

## 12. Open Questions (fill in after the data workshop)

1. Which corridor (or two) has usable collision, volume, transit and width data?
2. What are the verified values and sources for capacity per element, emission factors, and speeds?
3. Is there TTC delay or ridership data usable for a "reliability" metric (Should/Stretch)?
4. Exact School of Cities submission fields and data-link requirements.
5. Does the Tiger Data instance support the hypertable and continuous aggregate extensions?
6. Final domain name.

---

## 13. Kickoff Prompt for Claude Code

> Read `street-budget-prd-spec.md` fully. Then:
> 1. Create a monorepo named `street-budget` with npm workspaces (`client`, `server`, `shared`), TypeScript everywhere, Vite + React in `client`, Express in `server`, and a `.gitignore` and `.env.example` per section 6.
> 2. In `shared`, implement the types, element constants (with `TODO-SOURCE` markers), personas, one placeholder level, and the model functions from section 3, with unit tests (vitest).
> 3. In `client`, first set up the design tokens, fonts and base components from section 8b, then build the SVG cross-section editor, meters, scorecard, and Data & Limitations page per sections 8 and 8b, using the shared model. Show me a screenshot of the editor before building other screens.
> 4. In `server`, implement `/api/health`, `/api/levels`, and stubbed `/api/react` and `/api/debrief` that return canned fallback data.
> 5. Initialize git, make small commits, and give me exact commands to create the GitHub repo and push.
> 6. Add `deploy/` files (Caddyfile and a systemd unit or docker-compose) so I can deploy to a Vultr VPS.
>
> Follow the working rules in section 0. Do not add features outside the Must/Should lists. Ask me before choosing real data values.
>
> **Work from GitHub issues.** The issues were created by `create-issues.sh` (labels: must/should/stretch; milestones 1-3 plus Stretch). Run `gh issue list --milestone "<name>"` to see them. Work in this order: all `must` issues in the earliest open milestone (lowest number first, respecting "Depends on"), then `should`, then `stretch`. For each issue: read it and the relevant spec sections, implement it, run `npm test`, commit with a message ending in `Closes #N`, and push. Do not start an issue whose dependencies are open. If an issue is blocked (for example missing data), comment on it, tell me, and move to the next unblocked `must` issue.
