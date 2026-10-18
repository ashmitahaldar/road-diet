// Records the demo video's scenes from the live game in one take, and renders the title cards.
// Writes <out>/take.webm, <out>/card-*.png and <out>/scenes.json for build.mjs. See docs/demo/README.md.
import { renameSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'https://roaddiet.design'
const OUT = process.argv[2] ?? 'video-out'
const W = 1600
const H = 900
// Metal gives the 3D street 60 fps on a Mac; SwiftShader (GL=swiftshader) works anywhere at about 14.
const GL = process.env.GL === 'swiftshader' ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=metal', '--ignore-gpu-blocklist']

const browser = await chromium.launch({ args: GL })
const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: OUT, size: { width: W, height: H } } })
const page = await ctx.newPage()
const t0 = Date.now()
const scenes = []
const warnings = []
const pause = (s) => page.waitForTimeout(s * 1000)

/** Runs `act`, then holds until `dur` seconds have passed, so the cut is exactly `dur` long. */
async function scene(name, dur, act = async () => {}) {
  const start = (Date.now() - t0) / 1000
  await act()
  const left = start + dur - (Date.now() - t0) / 1000
  if (left < 0) warnings.push(`${name} ran ${(-left).toFixed(1)} s over its ${dur} s`)
  await pause(Math.max(0, left))
  scenes.push({ name, kind: 'clip', start, dur })
  console.log(`${start.toFixed(1)}s  ${name} (${dur} s)`)
}
const gemini = async (name, root = page) => {
  if (!(await root.getByText('Powered by Gemini').first().isVisible())) warnings.push(`${name}: no "Powered by Gemini" label (rate limit or daily quota)`)
}
const center = (locator) => locator.evaluate((e) => e.scrollIntoView({ behavior: 'smooth', block: 'center' }))

await page.goto(BASE)
await page.getByRole('button', { name: 'Play' }).waitFor()
await pause(1)
await scene('start', 6)

await scene('story', 15, async () => {
  await page.getByRole('button', { name: 'Play' }).click()
  await page.getByRole('heading', { name: 'Choose a street' }).waitFor()
  await pause(2)
  await page.getByRole('button', { name: 'Play' }).first().click()
  for (let i = 0; i < 3; i++) {
    await pause(2.1)
    await page.getByRole('button', { name: 'Next' }).click()
  }
  await page.getByRole('button', { name: 'Skip story' }).click()
  for (let i = 0; i < 2; i++) {
    await pause(0.8)
    await page.getByRole('button', { name: 'Next' }).click()
  }
})
await page.getByRole('button', { name: 'Skip to the street' }).click()
await page.getByRole('button', { name: 'Skip tour' }).click()
await pause(2)

// Two car lanes out, a protected bike lane and parking in; then back to 3D while Pip's lesson shows.
await scene('play', 22, async () => {
  await pause(3)
  await page.getByRole('button', { name: 'Edit in 2D' }).click()
  for (let i = 0; i < 2; i++) {
    await pause(1)
    await page.getByRole('button', { name: /^Car 3\.3 m/ }).first().click({ force: true })
    await pause(0.8)
    await page.getByRole('button', { name: 'Remove', exact: true }).click()
  }
  await pause(1)
  await page.getByRole('button', { name: /^Add Protected bike lane/ }).click()
  await pause(1.2)
  await page.getByRole('button', { name: /^Add On-street parking/ }).click()
  await pause(2.5)
  await page.getByRole('button', { name: 'Edit in 3D' }).click()
})

const quiz = page.waitForResponse((r) => r.url().endsWith('/api/quiz'), { timeout: 20000 }).then((r) => r.json()).catch(() => null)
const story = page.waitForResponse((r) => r.url().endsWith('/api/story'), { timeout: 20000 }).catch(() => null)
await page.getByRole('button', { name: /Run (a|another) day/ }).click()
const card = page.getByRole('dialog', { name: /Goal met|Not there yet/ })
await card.waitFor()
await story
await pause(0.5)
await gemini('results', card)
await scene('results', 17, async () => {
  await pause(3)
  const day = card.locator('details', { hasText: '’s day' }).first()
  await day.locator('summary').click()
  await pause(4)
  const check = card.locator('details', { hasText: 'Quick check' })
  await center(check)
  await pause(1)
  await check.locator('summary').click()
  await pause(2.5)
  await check.getByRole('group').getByRole('button').nth((await quiz)?.answer ?? 0).click()
})
await card.getByRole('button', { name: 'Close' }).click()

const why = page.getByRole('button', { name: 'Why? Emissions cut' })
await why.click()
const panel = page.locator(`[id="${await why.getAttribute('aria-controls')}"]`)
await panel.getByText('Pip is thinking…').waitFor({ state: 'detached', timeout: 15000 })
await gemini('why', panel)
await scene('why', 8)

await page.getByRole('button', { name: 'Edit in 2D' }).click()
await pause(0.5)
await scene('move', 4, async () => {
  await pause(0.6)
  await page.getByRole('button', { name: /^Parking 2\.4 m/ }).first().click({ force: true })
  await pause(1)
  await page.getByRole('button', { name: 'Move left' }).click()
})
await page.getByRole('button', { name: /Run (a|another) day/ }).click()
await card.waitFor()
await pause(0.5)
await scene('stars', 5)

const others = card.locator('[aria-labelledby=others-title]')
if (await others.count()) {
  await center(others)
  await pause(1)
  await scene('others', 5)
} else warnings.push('others: no "How others solved this street" chart (no database?)')

await page.goto(`${BASE}/data`)
await page.getByRole('heading', { level: 1 }).waitFor()
await pause(0.5)
await scene('data', 6, async () => {
  await pause(2)
  await page.mouse.wheel(0, 500)
})

// Pip and the residents, transparent, for the title cards.
await page.goto(BASE)
await page.getByRole('button', { name: 'Play' }).click()
await page.getByRole('button', { name: 'Play' }).first().click()
const cast = page.getByRole('list', { name: 'Who you’ll meet' })
await pause(1)
const pip = (await cast.locator('svg').first().screenshot({ omitBackground: true })).toString('base64')
const castPng = (await cast.screenshot({ omitBackground: true })).toString('base64')

const video = page.video()
await ctx.close()
renameSync(await video.path(), `${OUT}/take.webm`)

const CARDS = [
  { name: 'card-hook', dur: 6, body: `<img class="pip" src="data:image/png;base64,${pip}" alt=""><h1>Every street has a budget.</h1>` },
  {
    name: 'card-question',
    dur: 8,
    body: `<p class="kicker">Hack the Valley × School of Cities</p><h1 class="q">“What would changing how we use road space actually do?”</h1><p class="sub">An educational game for students, teachers and neighbours, on real Toronto streets.</p>`,
  },
  {
    name: 'card-close',
    dur: 8,
    body: `<img class="cast" src="data:image/png;base64,${castPng}" alt=""><h1>roaddiet.design</h1><p class="sub">Built solo for Hack The Valley 11 (2026) by @ashmitahaldar</p><p class="note">A learning tool, not a forecast. Residents are fictional.</p>`,
  },
]
const cardPage = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
for (const c of CARDS) {
  await cardPage.setContent(`<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root { --paper: #faf6ee; --grid: #e8e1d2; --ink: #1f2a37; --primary: #2b59c3; }
  body { margin: 0; width: 1920px; height: 1080px; display: grid; place-items: center; color: var(--ink); font-family: Inter, sans-serif;
    background: var(--paper) linear-gradient(var(--grid) 1px, transparent 1px) 0 0 / 48px 48px, linear-gradient(90deg, var(--grid) 1px, transparent 1px) 0 0 / 48px 48px; }
  main { display: flex; flex-direction: column; align-items: center; gap: 36px; max-width: 1500px; text-align: center; }
  h1 { margin: 0; font: 600 120px/1.05 Fredoka, sans-serif; letter-spacing: -0.02em; }
  h1.q { font-size: 84px; }
  .kicker { margin: 0; font: 600 40px Fredoka, sans-serif; color: var(--primary); }
  .sub { margin: 0; font-size: 44px; }
  .note { margin: 0; font-size: 30px; }
  .pip { width: 260px; }
  .cast { height: 200px; }
</style></head><body><main>${c.body}</main></body></html>`)
  await cardPage.evaluate(() => document.fonts.ready)
  await cardPage.screenshot({ path: `${OUT}/${c.name}.png` })
}
await browser.close()

const order = ['card-hook', 'start', 'card-question', 'story', 'play', 'results', 'why', 'move', 'stars', 'others', 'data', 'card-close']
const all = [...scenes, ...CARDS.map(({ name, dur }) => ({ name, kind: 'card', dur }))]
writeFileSync(`${OUT}/scenes.json`, JSON.stringify(order.flatMap((n) => all.filter((s) => s.name === n)), null, 2))
for (const w of warnings) console.warn(`warning: ${w}`)
console.log(`wrote ${OUT}/take.webm, cards and scenes.json`)
