#!/usr/bin/env bash
# Creates labels, milestones and issues for Street Budget.
# Prereqs: `gh auth login` done, and you are inside the cloned (ideally brand-new, empty) GitHub repo.
# Issue numbers below ("Depends on #N") assume a fresh repo with no existing issues, created in this order.
set -euo pipefail

# ---------- Labels ----------
lbl() { gh label create "$1" --color "$2" --description "$3" --force >/dev/null; }
lbl must        d73a4a "Required to submit"
lbl should      fbca04 "Do if time allows after Must"
lbl stretch     c5def5 "Only after Must and Should are done"
lbl model       1d76db "Shared game model"
lbl client      0e8a16 "Frontend"
lbl server      5319e7 "Backend/API"
lbl data        bfd4f2 "Toronto data prep"
lbl ai          f9d0c4 "Gemini features"
lbl infra       ededed "Repo, deploy, tooling"
lbl submission  006b75 "Devpost and demo"
lbl prize:school-of-cities 0052cc "School of Cities challenge"
lbl prize:climate          2ea44f "Best Climate Action & Sustainability"
lbl prize:solo             a2eeef "Best Solo Hack"
lbl prize:gemini           ff7b72 "MLH Best Use of Gemini API"
lbl prize:tiger-data       d4c5f9 "MLH Best Use of Tiger Data"
lbl prize:vultr            1f6feb "MLH Best Use of Vultr"
lbl prize:godaddy          e99695 "MLH Best Domain (GoDaddy Registry)"

# ---------- Milestones ----------
ms() { gh api "repos/{owner}/{repo}/milestones" -f title="$1" -f description="$2" >/dev/null; }
ms "1 - Core playable (Fri night)"   "Working game on placeholder data, deployed"
ms "2 - Data + AI (Sat evening)"     "Real corridor data, Gemini, Tiger Data"
ms "3 - Polish + submit (Sun AM)"    "Bug fixes, demo video, Devpost. Submit by 9:00 AM"
ms "Stretch"                          "Only if everything else is done"

M1="1 - Core playable (Fri night)"
M2="2 - Data + AI (Sat evening)"
M3="3 - Polish + submit (Sun AM)"
M4="Stretch"

mk() { # title, milestone, labels  (body from stdin)
  local body; body="$(cat)"
  gh issue create --title "$1" --milestone "$2" --label "$3" --body "$body"
}

# ======================= MILESTONE 1 =======================

mk "Scaffold monorepo" "$M1" "must,infra" <<'EOF'
npm workspaces: `client` (Vite + React + TS + Tailwind), `server` (Express + TS), `shared` (TS + vitest).
Add `.gitignore`, `.env.example` (GEMINI_API_KEY, GEMINI_MODEL, DATABASE_URL, PORT), root scripts: `dev`, `build`, `test`.

**Acceptance**
- `npm install && npm run dev` starts client and server.
- `npm test` runs vitest in `shared`.
- No secrets committed.
Spec: sections 6, 6.1, 6.2.
EOF

mk "Shared types, element constants, personas, placeholder level" "$M1" "must,model" <<'EOF'
Implement types (Layout, Mode, Demand, Metrics, PersonaId), element table (section 2.2), five personas (2.3), one placeholder level with baseline layout, demand, goal and star thresholds.
Every number without a verified source gets a `source: 'TODO-SOURCE'` field.

**Acceptance**
- Constants live in `shared/src/model/constants.ts` with `source` fields.
- A helper lists all `TODO-SOURCE` constants (used later by the limitations panel).
Depends on #1.
EOF

mk "Model: layout validation" "$M1" "must,model" <<'EOF'
Validate layout: total width equals level width W, each element within min/max, unused width computed.

**Acceptance**
- Unit tests for valid, over-width, under-width and out-of-range cases.
Depends on #2.
EOF

mk "Model: capacity, mode shift, congestion, travel time" "$M1" "must,model" <<'EOF'
Pure functions per spec 3.2-3.4: capacity per mode from layout, capped mode shift (max 25% total), BPR-style congestion (alpha 0.15, beta 4), per-persona travel time.

**Acceptance**
- Baseline layout under baseline demand gives baseline travel times.
- Removing a car lane never raises car capacity (test).
- Mode shift caps respected (test).
Depends on #2, #3.
EOF

mk "Model: emissions, safety, happiness, fairness" "$M1" "must,model,prize:climate" <<'EOF'
Spec 3.5-3.8: kg CO2e per hour and % change vs baseline; 0-100 safety index; per-persona happiness from weights; fairness = min happiness.

**Acceptance**
- Baseline gives emissionsReductionPct == 0 (test).
- Adding a protected bike lane never lowers cyclist safety (test).
- Single `computeMetrics(layout, level, event?)` entry point returns the full Metrics object.
Depends on #4.
EOF

mk "Client: SVG cross-section editor" "$M1" "must,client" <<'EOF'
Horizontal colour-coded strip of elements with width labels, add/remove from palette, resize via +/- buttons (drag optional), snap to 0.1 m, remaining width always visible, invalid states blocked.

**Acceptance**
- Keyboard operable; labels do not rely on colour alone.
- Cannot exceed total width W.
Depends on #3.
EOF

mk "Client: meters, persona cards, 'Run a day' flow" "$M1" "must,client" <<'EOF'
Four meters (emissions, safety, travel time, fairness), five persona cards with simple trip animation and mood, a 'Run a day' button that calls the shared model.

**Acceptance**
- A full round (edit, run, see results) works on placeholder data in under 60 seconds.
Depends on #5, #6.
EOF

mk "Client: scorecard, stars, goal check, limitations panel" "$M1" "must,client,prize:school-of-cities,prize:climate" <<'EOF'
Scorecard shows goal checklist, 1-3 stars, kg CO2e change and % vs baseline, and an always-visible Limitations panel listing model assumptions and every TODO-SOURCE constant. Footer: "Not an election prediction. No candidates or parties."

**Acceptance**
- Stars follow spec 2.6.
- Limitations panel visible on the scorecard itself, not only on another page.
Depends on #7.
EOF

mk "Server: Express skeleton, /api/health, /api/levels, static serving" "$M1" "must,server" <<'EOF'
Express app with zod validation helper, JSON size limit, `/api/health`, `/api/levels`, `/api/levels/:id`, and serving the built client in production.

**Acceptance**
- `npm run build && node server` serves the game and the API from one process.
Depends on #1, #2.
EOF

mk "Deploy to Vultr with Caddy, HTTPS and custom domain" "$M1" "must,infra,prize:vultr,prize:godaddy" <<'EOF'
Provision a Vultr instance (use MLH promo code for credits), install Node and Caddy, run the server (systemd or docker-compose), point the domain at it, HTTPS via Caddy. Add "Hosted on Vultr" to the footer.
Before buying the domain, confirm on the MLH prize page which domain endings qualify for the GoDaddy Registry prize.

**Acceptance**
- Game loads over HTTPS at the custom domain from an incognito window.
- `deploy/` contains Caddyfile and service/compose file; README has redeploy steps.
Depends on #9.
EOF

# ======================= MILESTONE 2 =======================

mk "Data: choose corridor and build corridor JSON" "$M2" "must,data,prize:school-of-cities" <<'EOF'
Time-box 60 min for corridor selection. Criteria in spec 4.2. Build `data/prep` notebook or script (pandas, geopandas, numpy) that clips datasets to a buffer around the corridor and writes `data/corridors/<id>.json` (schema in spec 4.4).
Confirm availability and licence of each dataset before use. If a dataset is missing, document the substitute and flag it in the limitations list.

**Acceptance**
- One corridor JSON with real width, volumes/mode share, collision counts, transit info.
- Each source has label, URL, retrieval date and note.
Fallback: if no usable corridor after 60 min, ask the developer before proceeding.
EOF

mk "Data: SOURCES.md and auto-generated /data page" "$M2" "must,client,prize:school-of-cities" <<'EOF'
`data/SOURCES.md` listing every dataset, URL, licence and retrieval date. A `/data` page generated from each corridor JSON's `sources`, plus model assumptions. Same list gets pasted into Devpost.

**Acceptance**
- Every source linked and dated; no source used in the model is missing from the page.
Depends on #11.
EOF

mk "Replace placeholder constants with sourced values" "$M2" "must,model" <<'EOF'
Replace TODO-SOURCE constants (capacity, emission factors, speeds, risk multipliers) with verified published values and record the source for each. Update the limitations panel automatically.
Ask the developer if a value cannot be sourced.

**Acceptance**
- Remaining TODO-SOURCE constants (if any) are listed on the scorecard limitations panel.
- Model tests still pass.
Depends on #11.
EOF

mk "Server: Gemini client and POST /api/react" "$M2" "must,ai,server,prize:gemini" <<'EOF'
Server-side Gemini client (model from `GEMINI_MODEL`), `/api/react` takes layout, before/after metrics, event and personas; returns `{reactions:[{personaId, mood, line}]}` as structured JSON. Grounded prompt: only supplied numbers, in character, one concrete reason, no real people or politicians. Zod validation of input and output, 6 s timeout, in-memory rate limit, canned fallback lines per persona on any failure.

**Acceptance**
- With the key unset or the API failing, the endpoint returns fallback lines and the game still works.
- API key never reaches the client bundle.
Depends on #9.
EOF

mk "Client: reactions UI with Gemini label and fallback" "$M2" "must,client,ai,prize:gemini" <<'EOF'
Show persona speech bubbles after 'Run a day'. Show a small "Powered by Gemini" label when the lines came from Gemini and no label when fallback was used. Loading state under 1 s feel (skeleton or optimistic canned line).

**Acceptance**
- Reactions appear without blocking the meters.
Depends on #7, #14.
EOF

mk "Server + client: POST /api/debrief and end-of-level debrief" "$M2" "should,ai,prize:gemini,prize:school-of-cities" <<'EOF'
`/api/debrief` returns `{summary (<=120 words), tradeoffs[], limitations[]}`; at least one design-specific limitation always included. Client shows it on the scorecard. Fallback text if Gemini fails.

**Acceptance**
- No election advice or candidate mentions in output (add a prompt rule and a simple output check).
Depends on #14.
EOF

mk "DB: Tiger Data schema, hypertable and continuous aggregate" "$M2" "should,server,prize:tiger-data" <<'EOF'
Migration per spec 7.1: `runs` table, hypertable on `created_at`, `runs_hourly` continuous aggregate. Confirm the Tiger Data instance supports the extensions; fall back to a plain table and note it if not. Enable compression if available.

**Acceptance**
- Migration runs cleanly on a fresh database; `DATABASE_URL` read from env.
Depends on #9.
EOF

mk "Server: POST /api/runs and GET /api/stats/:levelId" "$M2" "should,server,prize:tiger-data" <<'EOF'
Save finished runs (layout, metrics, stars, event). Stats endpoint reads from the continuous aggregate and returns plays, avg stars, avg emissions reduction, and the most common element mix. Validation and rate limit on writes. DB failure must not break gameplay.

**Acceptance**
- Playing a level creates a row; stats reflect it within the aggregate's refresh window (add a manual refresh for demo).
Depends on #17.
EOF

mk "Client: 'How others solved this street' chart" "$M2" "should,client,prize:tiger-data" <<'EOF'
Chart on the results screen powered by `/api/stats`. Text alternative for the chart. Empty-state message when there are no runs yet (seed a few demo runs for the demo).

**Acceptance**
- Chart renders from live API data in the deployed app.
Depends on #18.
EOF

mk "Events system (snowstorm, festival, delivery surge, collision)" "$M2" "should,model,client" <<'EOF'
Event modifiers applied in the model before 'Run a day', with a visible banner that explains the effect. Pure functions plus tests.

**Acceptance**
- Each event changes at least one metric in the expected direction (tests).
Depends on #5, #7.
EOF

mk "Game feel: sound effects, meter and persona animations" "$M2" "should,client" <<'EOF'
Small sounds for place/remove/run/win, animated meter fills, persona bounce on mood change. Mute toggle; respect reduced-motion setting.

**Acceptance**
- No sound autoplay before first user interaction; mute persists in the session.
Depends on #7.
EOF

mk "Level 2 on a second context" "$M2" "should,data,model" <<'EOF'
Second corridor or harder context (e.g. streetcar line or narrow block) with a different goal such as a safety target. Reuses the corridor JSON schema.

**Acceptance**
- Level select shows both levels; both are completable.
Depends on #11, #13.
EOF

mk "Share result card" "$M2" "should,client" <<'EOF'
Generate a shareable result summary (stars, kg CO2e change, layout) as an image or link.

**Acceptance**
- Works on mobile browsers; includes the game URL.
Depends on #8.
EOF

# ======================= MILESTONE 3 =======================

mk "Responsive and accessibility pass" "$M3" "must,client,prize:school-of-cities" <<'EOF'
Test at phone and laptop widths; keyboard-only play-through; colour contrast; text labels in addition to colour; reduced-motion; focus states; alt/ARIA for the editor and charts.

**Acceptance**
- Full level playable on a phone-width viewport and with keyboard only.
EOF

mk "Neutrality and responsible-interpretation review" "$M3" "must,prize:school-of-cities" <<'EOF'
Review all copy, prompts and outputs: no candidates, parties, election predictions or voting advice; personas clearly fictional; no neighbourhood rankings; limitations visible on scorecard and `/data`.

**Acceptance**
- Checklist in the PR/commit message; Gemini prompts contain the neutrality rule.
EOF

mk "Demo video and Devpost draft" "$M3" "must,submission,prize:solo" <<'EOF'
Record a backup demo (under 2 minutes) following spec 1.7c. Draft `docs/DEVPOST.md`: School of Cities answers (user, problem, data solution, benefit), all data links, sponsor feature paragraphs from spec 1.7b. Devpost team size must be 1.

**Acceptance**
- Video link works in an incognito window.
EOF

mk "Prize checklist verification and submit" "$M3" "must,submission" <<'EOF'
Walk the pre-submission checklist (spec 1.7d), opt in to every targeted prize on Devpost, and submit at least one hour before the deadline (aim for 9:00 AM Sunday).

**Acceptance**
- Submission confirmed on Devpost; all checklist items ticked.
EOF

# ======================= STRETCH =======================

mk "Read-only 3D street view (Three.js)" "$M4" "stretch,client" <<'EOF'
Render the current layout as extruded primitive shapes (slabs, boxes, cones), slow orbit camera, optional moving vehicles. Read-only; no game logic. Time-box 3 hours. Cut if unstable or slow on a laptop.
Only start if all Must and Should issues are closed.
EOF

mk "Political capital resource" "$M4" "stretch,model,client" <<'EOF'
Limited points spent on big changes. Keep neutral; no references to real parties or candidates.
EOF

mk "Animated traffic strip above the editor" "$M4" "stretch,client" <<'EOF'
Small animated strip with cars, bikes and pedestrians reacting to the layout.
EOF

mk "Post-event: DEV write-up" "$M4" "stretch,submission" <<'EOF'
Publish a build story on DEV after the event (model design, data choices, what went wrong). Targets the DEV Writing Challenge.
EOF

echo "Done. View with: gh issue list --limit 50"
