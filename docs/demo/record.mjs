// Records the demo video's game scenes from the live site in one take, and the animated cards from cards.mjs.
// Writes <out>/take.webm, <out>/<card>.webm and <out>/scenes.json for build.mjs. See docs/demo/README.md.
import { renameSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { CARDS } from './cards.mjs'

const BASE = process.env.BASE_URL ?? 'https://roaddiet.design'
const OUT = process.argv[2] ?? 'video-out'
const W = 1600
const H = 900
// Metal gives the 3D street 60 fps on a Mac; SwiftShader (GL=swiftshader) works anywhere at about 14.
const GL = process.env.GL === 'swiftshader' ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=metal', '--ignore-gpu-blocklist']

const browser = await chromium.launch({ args: GL })
const scenes = []
const warnings = []

async function recorded(width, height, run) {
  const ctx = await browser.newContext({ viewport: { width, height }, recordVideo: { dir: OUT, size: { width, height } } })
  const page = await ctx.newPage()
  const t0 = Date.now()
  await run(page, () => (Date.now() - t0) / 1000)
  const video = page.video()
  await ctx.close()
  return video.path()
}

for (const card of CARDS) {
  const path = await recorded(1920, 1080, async (page, now) => {
    await page.setContent(card.html)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(300)
    const start = now()
    await page.evaluate(() => window.play())
    await page.waitForTimeout(card.dur * 1000 + 200)
    scenes.push({ name: card.name, file: `${card.name}.webm`, start, dur: card.dur })
  })
  renameSync(path, `${OUT}/${card.name}.webm`)
  console.log(`card ${card.name} (${card.dur} s)`)
}

const take = await recorded(W, H, async (page, now) => {
  const pause = (s) => page.waitForTimeout(s * 1000)
  /** Runs `act`, then holds until `dur` seconds have passed, so the cut is exactly `dur` long. */
  async function scene(name, dur, act = async () => {}) {
    const start = now()
    await act()
    const left = start + dur - now()
    if (left < 0) warnings.push(`${name} ran ${(-left).toFixed(1)} s over its ${dur} s`)
    await pause(Math.max(0, left))
    scenes.push({ name, file: 'take.webm', start, dur })
    console.log(`${start.toFixed(1)}s  ${name} (${dur} s)`)
  }
  const gemini = async (name, root) => {
    if (!(await root.getByText('Powered by Gemini').first().isVisible())) warnings.push(`${name}: no "Powered by Gemini" label (rate limit or daily quota)`)
  }
  const center = (locator) => locator.evaluate((e) => e.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  const tap = async (name) => {
    await page.getByRole('button', { name }).first().click({ force: true })
    await pause(0.5)
  }
  const card = page.getByRole('dialog', { name: /Goal met|Not there yet/ })
  const run = async () => {
    await page.getByRole('button', { name: /Run (a|another) day/ }).click()
    await card.waitFor()
    await page.waitForResponse((r) => r.url().endsWith('/api/story'), { timeout: 20000 }).catch(() => {})
    await pause(0.5)
  }

  await page.goto(BASE)
  await page.getByRole('button', { name: 'Play' }).click()
  await page.getByRole('heading', { name: 'Choose a street' }).waitFor()
  await pause(0.5)
  await scene('story', 13, async () => {
    await pause(2)
    await page.getByRole('button', { name: 'Play' }).first().click()
    for (let i = 0; i < 2; i++) {
      await pause(2.1)
      await page.getByRole('button', { name: 'Next' }).click()
    }
    await pause(2)
    await page.getByRole('button', { name: 'Skip story' }).click()
    for (let i = 0; i < 2; i++) {
      await pause(0.8)
      await page.getByRole('button', { name: 'Next' }).click()
    }
  })
  await page.getByRole('button', { name: 'Skip to the street' }).click()
  await page.getByRole('button', { name: 'Skip tour' }).click()
  await pause(2)

  // A painted bike lane beside parking: Pip flags the door zone.
  await scene('play', 15, async () => {
    await pause(2)
    await page.getByRole('button', { name: 'Edit in 2D' }).click()
    for (let i = 0; i < 2; i++) {
      await pause(0.6)
      await tap(/^Car 3\.3 m/)
      await tap('Remove')
    }
    await tap(/^Add Painted bike lane/)
    await pause(0.4)
    await tap(/^Add On-street parking/)
    await pause(2.5)
    await page.getByRole('button', { name: 'Edit in 3D' }).click()
  })

  await run()
  await gemini('run1', card)
  await scene('run1', 12, async () => {
    await pause(2.5)
    const day = card.locator('details', { hasText: '’s day' }).first()
    await day.locator('summary').click()
    await pause(3.5)
    await center(card.getByText('Door zone', { exact: true }).first())
  })
  await card.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'Edit in 2D' }).click()
  await pause(0.5)

  await scene('fix', 4, async () => {
    await pause(0.4)
    await tap(/^Painted bike/)
    await tap('Remove')
    await tap(/^Add Protected bike lane/)
  })
  const quiz = page.waitForResponse((r) => r.url().endsWith('/api/quiz'), { timeout: 20000 }).then((r) => r.json()).catch(() => null)
  await run()
  await scene('stars', 5)
  await card.getByRole('button', { name: 'Close' }).click()

  const why = page.getByRole('button', { name: 'Why? Emissions cut' })
  await why.click()
  const panel = page.locator(`[id="${await why.getAttribute('aria-controls')}"]`)
  await panel.getByText('Pip is thinking…').waitFor({ state: 'detached', timeout: 15000 })
  await gemini('why', panel)
  console.log(`   why: ${(await panel.textContent()).replace('Powered by Gemini', '').trim()}`)
  await scene('why', 8)

  await page.getByRole('button', { name: 'See scorecard' }).click()
  await card.waitFor()
  const check = card.locator('details', { hasText: 'Quick check' })
  await center(check)
  await pause(1)
  await scene('quiz', 7, async () => {
    await check.locator('summary').click()
    await pause(2.5)
    await check.getByRole('group').getByRole('button').nth((await quiz)?.answer ?? 0).click()
  })

  const others = card.locator('[aria-labelledby=others-title]')
  if (await others.count()) {
    await center(others)
    await pause(1)
    await scene('others', 4)
  } else warnings.push('others: no "How others solved this street" chart (no database?)')

  await page.goto(`${BASE}/data`)
  await page.getByRole('heading', { level: 1 }).waitFor()
  await pause(0.5)
  await scene('data', 6, async () => {
    await pause(2)
    await page.mouse.wheel(0, 500)
  })
})
renameSync(take, `${OUT}/take.webm`)
await browser.close()

const order = ['intro', 'question', 'story', 'lesson-budget', 'play', 'run1', 'lesson-door', 'fix', 'stars', 'lesson-mode', 'why', 'quiz', 'others', 'data', 'outro']
writeFileSync(`${OUT}/scenes.json`, JSON.stringify(order.flatMap((n) => scenes.filter((s) => s.name === n)), null, 2))
for (const w of warnings) console.warn(`warning: ${w}`)
console.log(`wrote ${OUT}/scenes.json`)
