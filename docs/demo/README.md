# Demo video

A demo video of about 1:40 about learning how a street is shared. It's built from one recorded take of the live game, plus animated SVG cards (`cards.mjs`) in the game's style: an intro, the challenge question, three lesson cards and an outro. The narration is in `build.mjs` (`NARRATION`), one line per scene, and it doubles as the captions.

## Build it
Needs Node, `ffmpeg`, and Playwright with Chromium (`npm i --no-save playwright@1.64.1 && npx playwright install chromium`).

```bash
node docs/demo/record.mjs video-out     # about 2 minutes: take.webm, card-*.png, scenes.json
node docs/demo/build.mjs video-out      # silent cut with captions, to check timing
node docs/demo/build.mjs video-out voiceover.m4a   # final: road-diet-demo.mp4 + road-diet-demo.srt
```

- `record.mjs` records each card from `cards.mjs` at 1920×1080, then plays the game once against https://roaddiet.design (set `BASE_URL` to change it) at 1600×900 and notes when each scene starts. Each scene holds for a fixed length, so the cut is exact. It warns if a Gemini scene shows fallback text or a scene overruns. On a machine without a Mac GPU, set `GL=swiftshader` (the 3D street drops to about 14 fps).
- `build.mjs` cuts the scenes, scales them to 1920×1080 at 30 fps, cross-fades them with the cards, and writes an H.264 MP4 with `faststart`. The captions go in as a soft subtitle track and as a separate `.srt` file. It fails if the video is over 2:00.
- Each run of the game uses three or four Gemini requests, and the free tier allows 20 a day. Record when the quota is fresh, and check that `record.mjs` prints no Gemini warnings.

## Storyboard
The arc teaches by a mistake and its fix. A painted bike lane beside parking puts riders in the door zone and earns 1 star. Swapping in a protected lane earns 3, still with two car lanes.

| Scene | Length | On screen | Teaches or shows |
|---|---|---|---|
| intro | 7 s | Animated 20 m street that morphs between designs | The street budget |
| question | 8 s | "Bikes vs. cars vs. pedestrians: can Toronto streets work for everyone?" (School of Cities, Transit, Congestion and Access), the street's users | Challenge fit, audience |
| story | 13 s | Choose a street, Pip and the residents, the briefing map | Real data, fictional residents |
| lesson-budget | 3.5 s | Lesson 1: a sidewalk grows as a car lane shrinks | Right-of-way |
| play | 15 s | Two car lanes out, painted bike lane and parking in; "Pip noticed" flags the door zone | Learning by doing |
| run1 | 12 s | 1 star, a resident's day, "What this street teaches" | Feedback, Gemini |
| lesson-door | 4 s | Lesson 2: a car door opens into a painted lane; a buffer and protected lane fix it | Door zone, buffers |
| fix, stars | 4 s + 5 s | Protected lane swapped in; 3 stars with two car lanes | Neutrality |
| lesson-mode | 3.5 s | Lesson 3: car trips switch to bus, bike and walking | Mode shift, Climate |
| why | 8 s | Pip answers "Why?" on emissions | Mode shift explained |
| quiz | 7 s | Quick check answered | Checking understanding |
| others | 4 s | "How others solved this street" (live site only) | Tiger Data |
| data | 6 s | Data & Limitations, Vultr in the footer | Reading data critically |
| outro | 10 s | The five learning outcomes, roaddiet.design, credit | Domain, Solo |

## What you do
1. Run `record.mjs` and `build.mjs video-out` once, and watch the silent cut with captions on.
2. Record the narration while it plays, reading each caption as it appears (a phone mic is fine). Save it as `voiceover.m4a`, starting at 0:00.
3. Run `build.mjs video-out voiceover.m4a`. Optional background music needs a track whose licence you've checked.
4. Upload `road-diet-demo.mp4` to YouTube (unlisted is fine), add `road-diet-demo.srt` as the English captions, and check the link in a private window.
