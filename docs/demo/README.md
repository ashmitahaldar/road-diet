# Demo video

A demo video of about 1:45, built from one recorded take of the live game, plus three title cards in the game's style. The narration is in `build.mjs` (`NARRATION`), one line per scene, and it doubles as the captions.

## Build it
Needs Node, `ffmpeg`, and Playwright with Chromium (`npm i --no-save playwright@1.64.1 && npx playwright install chromium`).

```bash
node docs/demo/record.mjs video-out     # about 2 minutes: take.webm, card-*.png, scenes.json
node docs/demo/build.mjs video-out      # silent cut with captions, to check timing
node docs/demo/build.mjs video-out voiceover.m4a   # final: road-diet-demo.mp4 + road-diet-demo.srt
```

- `record.mjs` plays the game once against https://roaddiet.design (set `BASE_URL` to change it) at 1600×900 and notes when each scene starts. Each scene holds for a fixed length, so the cut is exact. It warns if a Gemini scene shows fallback text or a scene overruns. On a machine without a Mac GPU, set `GL=swiftshader` (the 3D street drops to about 14 fps).
- `build.mjs` cuts the scenes, scales them to 1920×1080 at 30 fps, cross-fades them with the cards, and writes an H.264 MP4 with `faststart`. The captions go in as a soft subtitle track and as a separate `.srt` file. It fails if the video is over 2:00.
- Each run of the game uses three or four Gemini requests, and the free tier allows 20 a day. Record when the quota is fresh, and check that `record.mjs` prints no Gemini warnings.

## Storyboard
| Scene | Length | On screen | Shows |
|---|---|---|---|
| card-hook | 6 s | Pip, "Every street has a budget." | Tone |
| start | 6 s | Start screen | Brand |
| card-question | 8 s | The School of Cities question and the audience | Challenge fit |
| story | 15 s | Choose a street, Pip and the residents, the briefing map | Story, real data |
| play | 22 s | 2D edits with traffic, then 3D with "Pip noticed" | Learning by doing |
| results | 17 s | Scorecard reactions, a resident's day, quick check answered | Gemini, learning outcomes |
| why | 8 s | Pip answers "Why?" on emissions | Mode shift, Climate |
| move, stars | 4 s + 5 s | Parking moved next to the sidewalk, 3 stars with two car lanes | Neutrality |
| others | 5 s | "How others solved this street" and Limitations | Tiger Data |
| data | 6 s | Data & Limitations page, Vultr in the footer | Data rules, Vultr |
| card-close | 8 s | Residents, roaddiet.design, Hack The Valley 11 credit | Domain, Solo |

## What you do
1. Run `record.mjs` and `build.mjs video-out` once, and watch the silent cut with captions on.
2. Record the narration while it plays, reading each caption as it appears (a phone mic is fine). Save it as `voiceover.m4a`, starting at 0:00.
3. Run `build.mjs video-out voiceover.m4a`. Optional background music needs a track whose licence you've checked.
4. Upload `road-diet-demo.mp4` to YouTube (unlisted is fine), add `road-diet-demo.srt` as the English captions, and check the link in a private window.
