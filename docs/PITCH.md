# Road Diet: 4-minute pitch and Q&A

A 4-minute pitch to the slide deck with a short live demo, then questions. The deck is at https://claude.ai/artifact/URvZo6kgL5SvXb6ZtrMK3x (share it from its Share menu before anyone else opens it). Each slide's speaker notes hold the same lines as the script below.

The script is about 410 spoken words. At 140 words a minute, with a moment per slide change and 65 seconds for the demo, it runs about 3:41, which leaves about 20 seconds of buffer. Read it aloud once with a timer, demo included.

## Before you go on
- **Deck:** open it and start Present from the cover.
- **Game:** in a second window, open https://roaddiet.design, press **Play**, then **Play** on Mount Pleasant Rd, and skip the story and tour, so it waits on the street with four car lanes. Zoom the browser to 110–125% if the room screen is far away.
- **Gemini:** run one game earlier that day to check that the "Powered by Gemini" labels show. The free tier allows 20 Gemini requests a day, and each run uses three or four.
- **Placeholder:** fill in your name in the cover's speaker notes.
- **Backup:** the hidden last slide holds the whole silent demo video (1:40). Unhide it, or open it from All slides, if needed.

## Script

| Time | Slide |
|---|---|
| 0:00–0:09 | Cover |
| 0:09–0:26 | The challenges we answer |
| 0:26–0:47 | Every street has a budget |
| 0:47–0:54 | Who it’s for |
| 0:54–1:00 | How it works |
| 1:00–1:18 | Demo 1: Design |
| 1:18–1:35 | Demo 2: Run a day |
| 1:35–1:51 | Demo 3: Fix it |
| 1:51–2:05 | Demo 4: Learn why |
| 2:05–2:20 | Technicality and design |
| 2:20–2:34 | Climate Action & Sustainability |
| 2:34–2:47 | School of Cities: the brief, line by line |
| 2:47–2:49 | School of Cities: the four questions |
| 2:49–3:00 | Data sources |
| 3:00–3:16 | Architecture (MLH prizes) |
| 3:16–3:29 | Judging criteria |
| 3:29–3:41 | Close |
| Q&A only | MLH prizes, one card per prize with logos |

### 0:00–0:09 · Cover
> Hi, I’m [name]. This is Road Diet: an educational game about how a real Toronto street gets shared.

### 0:09–0:26 · The challenges we answer
> It’s built for Climate Action and Sustainability first: every design is tracked in kilograms of CO₂. It also answers the School of Cities question about road space, and it uses Gemini, Tiger Data and Vultr.

### 0:26–0:47 · Every street has a budget
> Every street has a budget. Mount Pleasant Road is 20 metres wide, and four lanes go to cars. The City counted about 1,900 vehicles and 5 bikes in the evening peak hour. Every fight about bike lanes, bus lanes or parking is a fight over these metres.

### 0:47–0:54 · Who it’s for
> It’s for students, teachers and neighbours, who learn by redesigning the street themselves.

### 0:54–1:00 · How it works
> Design, run a day, learn why. Let me show you.

### 1:00–2:05 · Short live demo
Switch to the game window and do the clicks in the table below while you say these four lines. If anything goes wrong, switch back to the deck: the four demo slides play the same steps as silent clips, so say the same lines over them.

### 1:00–1:18 · Demo 1: Design
> I swap two car lanes for a painted bike lane and parking. Traffic follows my lanes, and Pip, our guide, spots a problem: the door zone.

### 1:18–1:35 · Demo 2: Run a day
> I run a day anyway. Emissions fall 8 percent, but safety is 45, so one star. Each resident tells me how their day went.

### 1:35–1:51 · Demo 3: Fix it
> So I switch to a protected lane. Three stars: 36 kilograms of CO₂ saved per peak hour, still with two car lanes.

### 1:51–2:05 · Demo 4: Learn why
> Why did emissions fall? Pip says about 245 fewer people drive. That’s mode shift, the only way the model cuts emissions.

Switch back to the deck and go to the next slide.

### 2:05–2:20 · Technicality and design
> Under that is a real product: a TypeScript model with 93 automated tests, a Python pipeline from City data, and a 2D editor that works by keyboard and screen reader.

### 2:20–2:34 · Climate Action & Sustainability
> For Climate: every scorecard tracks CO₂ against today’s street. Players learn the lever that actually cuts it, mode shift. And a cut only counts if every resident stays on board.

### 2:34–2:47 · School of Cities: the brief, line by line
> For School of Cities: it takes on bikes versus cars versus pedestrians directly, it’s the street-design scenario explorer the brief asks for, and it’s free, accessible and neutral.

### 2:47–2:49 · School of Cities: the four questions
Click straight through. The answers are on screen.

### 2:49–3:00 · Data sources
> It’s all built on City of Toronto Open Data and TTC schedules, and every source is linked in the app.

### 3:00–3:16 · Architecture (MLH prizes)
> Here’s how it fits together, all on Vultr. One TypeScript model scores every design. Gemini only gets its facts, and its numbers must match. Tiger Data stores every run and shows how others solved the street.

### 3:16–3:29 · Judging criteria
> My inspiration is my own interest in urban design and planning, turned into something that teaches others. It’s original, and I built it solo, here.

### 3:29–3:41 · Close
> After a few runs, a player can explain the street budget, predict mode shift and spot a safer layout. Play it free at roaddiet.design. Thank you.

## Live demo clicks (1:00–2:05)
Mount Pleasant Rd, level 1, starting on the street with the story and tour already skipped. Numbers checked against the model for this exact design.

| Line | Click | What appears |
|---|---|---|
| Demo 1 | **Edit in 2D**. Select a car lane, **Remove**. Do it again. Then **Add Painted bike lane** and **Add On-street parking** | "Pip noticed": door zone |
| Demo 2 | **Run a day**. Open one resident's day if there's time. Close the scorecard | Goal met, 1 star. Emissions −8.0%. Safety 45/100 |
| Demo 3 | Select the painted bike lane, **Remove**, then **Add Protected bike lane**. **Run another day**. Close the scorecard | 3 stars. Emissions −9.6% (−36 kg CO₂e per peak hour). Safety 55/100 |
| Demo 4 | **Why?** on Emissions cut | "About 245 fewer people drive in the peak hour" |

After Demo 1 the street reads, left to right: sidewalk 3.4 m, painted bike lane 1.5 m, parking 2.4 m, car lane, car lane, sidewalk 3.4 m. Demo 3 puts a 2.0 m protected lane in the painted lane's place. Rehearsed in the browser on 2026-10-18: 1 star, then 3 stars.

**If the demo runs long.** Skip opening a resident's day, and skip "Why?" by switching to the deck's Demo 4 slide.

**If Gemini is rate-limited.** The reactions, days and "Why?" fall back to built-in text built from the same model facts, and the "Powered by Gemini" label disappears. Say: "Gemini's free tier is out for today, so you're seeing the built-in text. It's built from the same facts Gemini gets."

**If the 3D view is slow or blank.** Stay in 2D. Everything in the demo works there.

**If roaddiet.design is down.** Use the deck's demo slides. Their clips don't use the live site.

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
