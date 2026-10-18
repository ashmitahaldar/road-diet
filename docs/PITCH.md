# Road Diet: 4-minute pitch and Q&A

A 4-minute pitch with a live demo, then 1 minute of questions. The spoken script below is about 500 words, which is about 3:50 at 130 words a minute. Read it aloud once with a timer and cut the lines marked *(cut if long)* if you run over.

## Before you go on
- Open https://roaddiet.design in a fresh browser window (or a private one), so the story and tour play from the start. Zoom the browser to 110–125% if the room screen is far away.
- Open a second tab on https://roaddiet.design/data.
- Run one game earlier that day to check that the "Powered by Gemini" labels show. The free tier allows 20 Gemini requests a day, and each run uses three or four. If the labels are missing, the game still works on its built-in text. Say so in one line (see the backup below).
- Turn the sound off unless the room has speakers.

## Script

| Time | Beat |
|---|---|
| 0:00–0:30 | Hook |
| 0:30–1:00 | Who and why |
| 1:00–2:45 | Live demo |
| 2:45–3:30 | Trust |
| 3:30–4:00 | Impact and close |

### 0:00–0:30 · Hook
> Every street has a budget. Mount Pleasant Road, north of Eglinton, is 20 metres wide. Today four of those lanes go to cars. In the City's own count, about 1,900 vehicles and 5 bikes went by in the evening peak hour.
>
> Every fight about a bike lane, a bus lane or parking is a fight over those metres. The School of Cities challenge asks what changing how we use road space would actually do. Road Diet lets you find out.

### 0:30–1:00 · Who and why
> Road Diet is an educational game for students, teachers and neighbours. You can't feel a trade-off from a news story or a spreadsheet, so here you redesign a real Toronto street yourself and hear from the people who use it. There's no one right answer. You see why every choice helps someone and costs someone else.

### 1:00–2:45 · Live demo
Do each action as you say its line. The run-of-show below lists the exact clicks.

> This is Pip. Pip lives on a lamppost and introduces the residents: Dev, a courier; Maya, a student who'd bike if it felt safer; Mrs. Rossi, who walks to the pharmacy; and Omar, who runs a bakery. Each wants something different from the same 20 metres.
>
> I'll take out two car lanes and add a protected bike lane and parking. Traffic follows the lanes I build, and Pip points out the planning idea behind each change.
>
> Run a day. The goal's met: emissions are down almost 10 percent, and nobody fell below 50 happy. But only one star. Each resident reacts, and I can open the story of their day.
>
> Why did emissions fall? I ask Pip. About 245 fewer people drive, because the other ways of getting around got better. That's mode shift.
>
> Pip's tip says parking between the sidewalk and traffic acts as a buffer. So I move the parking next to the sidewalk and run another day. Three stars, still with two car lanes.
>
> A quick check at the end tests what stuck.

### 2:45–3:30 · Trust
> Three things make it trustworthy. First, the data. Both streets start from City of Toronto Open Data: traffic counts, serious collisions, the Cycling Network, TTC schedules and the Official Plan. Every source and estimate is on this page. *(Switch to the `/data` tab.)*
>
> Second, it's neutral. No star or badge rewards adding or removing any kind of lane. You just saw three stars with two car lanes.
>
> Third, Gemini gives the residents and Pip their voice, but it never decides a result. Our tested model computes every number. Gemini only sees those facts, any number it writes has to match them, and the quiz answers come from the model. *(cut if long)* Runs are stored in Tiger Data, so you can see how other players solved the same street.

### 3:30–4:00 · Impact and close
> After a few runs, a player can explain the street budget, predict mode shift, spot a safer layout, and judge a design by its least happy resident. A teacher can run it in a browser with no accounts. It's live at roaddiet.design.
>
> I built it solo for Hack The Valley. Next come more Toronto streets from the same data pipeline, and a teacher's guide. Thank you.

## Demo run-of-show
Mount Pleasant Rd, level 1. Numbers checked against the model for this exact design.

| Step | Click | What appears |
|---|---|---|
| 1 | **Play**, then **Play** on Mount Pleasant Rd | The story with Pip and the four residents |
| 2 | **Next** through two or three lines, then **Skip story**, **Skip to the street** and **Skip tour** | The 3D street: 3.4 m sidewalk, four 3.3 m car lanes, 3.4 m sidewalk |
| 3 | **Edit in 2D**. Select a car lane, **Remove**. Do it again | Two car lanes left, 6.6 m free |
| 4 | **Add Protected bike lane**, then **Add On-street parking** | "Pip noticed" with curb access and fairness |
| 5 | **Edit in 3D** (optional, for the traffic) and **Run a day** | Goal met, 1 star. Emissions −9.6% (−36 kg CO₂e per peak hour). Fair Share badge |
| 6 | Open one resident's day. Close the scorecard. **Why?** on Emissions cut | "About 245 fewer people drive in the peak hour" |
| 7 | Select the parking, press **Move left** (◀) once. **Run another day** | 3 stars. Safety 57/100 |
| 8 | Scroll the scorecard to **Quick check** and answer it | Pip says whether you're right and why |

After step 4 the street reads, left to right: sidewalk 3.4 m, protected bike lane 2.0 m, parking 2.4 m, car lane, car lane, sidewalk 3.4 m (2.2 m unused). Step 7 swaps the bike lane and the parking. Rehearsed on the live site on 2026-10-18: 1 star, then 3 stars. Step 5 reads "Safety 55/100" but earns only one star. That's because the score is 54.6 and the star needs 55. Don't dwell on it. Step 7 fixes it.

**If Gemini is rate-limited.** The reactions, days, "Why?" and quiz all fall back to built-in text built from the same model facts, and the "Powered by Gemini" label disappears. Say: "Gemini's free tier is out for today, so you're seeing the built-in text. It's built from the same facts Gemini gets."

**If the 3D view is slow or blank.** Stay in 2D. Everything in the demo works there, and it's the keyboard and screen-reader path anyway.

**If the network fails.** Play the demo video (#26) instead.

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
