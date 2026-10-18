# Road Diet: 4-minute pitch and Q&A

A 4-minute pitch to the slide deck, then questions. The deck is at https://claude.ai/artifact/URvZo6kgL5SvXb6ZtrMK3x (share it from its Share menu before anyone else opens it). Each slide's speaker notes hold the same lines as the script below.

The script is about 460 spoken words, about 3:40 at 130 words a minute, which leaves time for slide changes. Read it aloud once with a timer.

## Before you go on
- Open the deck and start Present from the cover. The four demo slides play silent clips from the demo video on a loop, so you talk over them and need no sound.
- Fill in the two placeholders in the speaker notes: your name on the cover, and one line of inspiration on the judging-criteria slide.
- Keep https://roaddiet.design open in a second tab in case a judge wants to see it live, or for questions.
- The hidden last slide holds the whole silent demo video (1:40). Unhide it, or open it from All slides, if the clips fail.

## Script

| Time | Slide |
|---|---|
| 0:00–0:08 | Cover |
| 0:08–0:22 | The challenges we answer |
| 0:22–0:42 | Every street has a budget |
| 0:42–0:52 | Who it’s for |
| 0:52–0:58 | How it works |
| 0:58–1:12 | Demo 1: Design (clip) |
| 1:12–1:26 | Demo 2: Run a day (clip) |
| 1:26–1:38 | Demo 3: Fix it (clip) |
| 1:38–1:52 | Demo 4: Learn why (clip) |
| 1:52–2:10 | Technicality and design |
| 2:10–2:32 | Climate Action & Sustainability |
| 2:32–2:50 | School of Cities: the brief, line by line |
| 2:50–2:55 | School of Cities: the four questions |
| 2:55–3:05 | Data sources |
| 3:05–3:27 | MLH prizes |
| 3:27–3:40 | Judging criteria |
| 3:40–3:55 | Close |

### 0:00–0:08 · Cover
> Hi, I’m [name]. This is Road Diet: an educational game about how a real Toronto street gets shared.

### 0:08–0:22 · The challenges we answer
> It’s built for Climate Action and Sustainability first: every design is tracked in kilograms of CO₂. It also answers the School of Cities question, what would changing road space actually do? And it uses Gemini, Tiger Data and Vultr.

### 0:22–0:42 · Every street has a budget
> Every street has a budget. Mount Pleasant Road is 20 metres wide, and four lanes go to cars. The City counted about 1,900 vehicles and 5 bikes in the evening peak hour. Every fight about bike lanes, bus lanes or parking is a fight over these metres.

### 0:42–0:52 · Who it’s for
> But you can’t feel that trade-off from a news story. So students, teachers and neighbours redesign the street themselves.

### 0:52–0:58 · How it works
> Design, run a day, learn why.

### 0:58–1:12 · Demo 1: Design (clip)
> I swap two car lanes for a painted bike lane and parking. Traffic follows my lanes, and Pip, our guide, spots a problem: the door zone.

### 1:12–1:26 · Demo 2: Run a day (clip)
> I run a day anyway. Emissions fall 8 percent, but safety is 45, so one star. Each resident tells me how their day went.

### 1:26–1:38 · Demo 3: Fix it (clip)
> So I switch to a protected lane. Three stars: 36 kilograms of CO₂ saved per peak hour, still with two car lanes.

### 1:38–1:52 · Demo 4: Learn why (clip)
> Why did emissions fall? Pip says about 245 fewer people drive. That’s mode shift, the only way the model cuts emissions.

### 1:52–2:10 · Technicality and design
> Under that is a real product: a TypeScript model with 93 automated tests, a Python pipeline from City data, and a 3D editor plus a 2D one that works by keyboard and screen reader, on a phone too.

### 2:10–2:32 · Climate Action & Sustainability
> For Climate: the brief asks for carbon tracking, and every scorecard tracks CO₂ against today. It asks to reduce impact, and players learn the lever that works, mode shift. And a cut only counts if every resident stays on board.

### 2:32–2:50 · School of Cities: the brief, line by line
> For School of Cities: it takes on bikes versus cars versus pedestrians directly, it’s the street-design scenario explorer the brief describes, and it’s free, accessible and neutral. No star rewards any lane type.

### 2:50–2:55 · School of Cities: the four questions
> And here are the brief’s four questions, answered.

### 2:55–3:05 · Data sources
> It’s all built on City of Toronto Open Data and TTC schedules, and every source is linked in the app.

### 3:05–3:27 · MLH prizes
> For MLH: Gemini voices the residents and Pip, but never decides a result. It only sees our model’s facts, and its numbers must match. Tiger Data stores every run in a hypertable, with a continuous aggregate for how others solved the street. And it’s live on Vultr.

### 3:27–3:40 · Judging criteria
> So: it’s live and tested, built for anyone, teaches the carbon cost of street design, and explains every number. [Inspiration: one line on what got you thinking about Toronto streets.] And I built it solo, here.

### 3:40–3:55 · Close
> After a few runs, a player can explain the street budget, predict mode shift and spot a safer layout. Play it free at roaddiet.design. Thank you.

## Live demo instead of the clips
If you have time for a live demo, or a judge asks to see the game, follow this on Mount Pleasant Rd, level 1. It is the same design the clips show. Numbers checked against the model for this exact design.

| Step | Click | What appears |
|---|---|---|
| 1 | **Play**, then **Play** on Mount Pleasant Rd | The story with Pip and the four residents |
| 2 | **Next** through two or three lines, then **Skip story**, **Skip to the street** and **Skip tour** | The 3D street: 3.4 m sidewalk, four 3.3 m car lanes, 3.4 m sidewalk |
| 3 | **Edit in 2D**. Select a car lane, **Remove**. Do it again | Two car lanes left, 6.6 m free |
| 4 | **Add Painted bike lane**, then **Add On-street parking** | "Pip noticed": door zone (to work on), curb access, fairness |
| 5 | **Edit in 3D** (optional, for the traffic) and **Run a day** | Goal met, 1 star. Emissions −8.0%. Safety 45/100 |
| 6 | Open one resident's day. Close the scorecard | |
| 7 | **Edit in 2D** if needed. Select the painted bike lane, **Remove**, then **Add Protected bike lane**. **Run another day** | 3 stars. Emissions −9.6% (−36 kg CO₂e per peak hour). Safety 55/100 |
| 8 | Close the scorecard. **Why?** on Emissions cut | "About 245 fewer people drive in the peak hour" |
| 9 | **See scorecard**, scroll to **Quick check** and answer it | Pip says whether you're right and why |

After step 4 the street reads, left to right: sidewalk 3.4 m, painted bike lane 1.5 m, parking 2.4 m, car lane, car lane, sidewalk 3.4 m. Step 7 puts a 2.0 m protected lane in the painted lane's place. Rehearsed in the browser on 2026-10-18: 1 star, then 3 stars.

**If Gemini is rate-limited.** The reactions, days, "Why?" and quiz all fall back to built-in text built from the same model facts, and the "Powered by Gemini" label disappears. Say: "Gemini's free tier is out for today, so you're seeing the built-in text. It's built from the same facts Gemini gets."

**If the 3D view is slow or blank.** Stay in 2D. Everything in the demo works there, and it's the keyboard and screen-reader path anyway.

**If roaddiet.design is down.** Stay on the deck. The clips and the hidden backup slide don't use the live site.

**If the venue network fails.** The deck itself is online. Download it as PPTX beforehand (downloads show still frames, not clips) and keep the demo video file on your laptop.

## Anticipated questions
Each answer takes about 20 seconds.

**How accurate is the model?**
It's a simple, open model meant for learning, not forecasting. Every constant is tagged with its source or marked as a design choice, and the scorecard's Limitations panel lists what it can't know, such as the cap on how many trips can switch.

**Isn't it biased toward bike lanes?**
No star or badge rewards any lane type. On Mount Pleasant there are three-star designs with one car lane and with two, and a test checks that. Badges reward meeting the goal, fairness and balance.

**How do you stop Gemini making things up?**
It gets a list of facts computed by our model. Any number it writes in an explanation must appear in those facts, a filter catches political words, and the quiz answers come from the model, never from Gemini. Any failure falls back to built-in text.

**Why fictional residents?**
They keep real people out of it. Each is a composite of a common trip: a delivery driver, a student who bikes, a senior who walks and a shop owner. That lets the game show needs that pull in different directions.

**Where does the data come from?**
City of Toronto Open Data (the centreline, intersection traffic counts, serious collisions and the Cycling Network), the Official Plan's right-of-way map, TTC schedules and OpenStreetMap. Lane widths and the 40 riders per bus are labelled as estimates in the app.

**How would a teacher use it?**
One street per lesson, in a browser, with no accounts or installs. "Why?" and the quick check give discussion prompts, and the About page lists the learning outcomes.

**What does Tiger Data do?**
Every run is stored anonymously in a TimescaleDB hypertable. A continuous aggregate powers "How others solved this street" and the average emissions cut on the scorecard.

**Does safety use the real collision data?**
Not yet. Today the safety index comes from the layout: car lanes, bike facilities, the door zone and buffers. Collision counts are shown as context. Scaling risk by them is next.

**Can it work for other streets or cities?**
Each level comes from a short config file run through our data pipeline, `data/prep/prep.py`. Any Toronto street can be added that way. Other cities would need their own data sources.

**What did you build, and what did AI build?**
I built it solo with Claude Code as a pair programmer. I set the direction, the learning goals, and the data and neutrality rules, and I reviewed every change. Gemini runs inside the game for the residents' and Pip's words, always grounded in our numbers.
