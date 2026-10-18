// Retakes the Devpost gallery from the live game. See docs/DEVPOST.md, "Image gallery".
//   npm i --no-save playwright@1.64.1 && npx playwright install chromium
//   node docs/devpost/shoot.mjs [outDir]          (BASE_URL defaults to https://roaddiet.design)
import { statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'https://roaddiet.design'
const OUT = process.argv[2] ?? fileURLToPath(new URL('.', import.meta.url))
const DEVPOST_MAX_BYTES = 5 * 1024 * 1024

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const warnings = []
const shot = async (page, name, gemini = false) => {
  await page.waitForTimeout(600)
  const path = `${OUT}/${name}.png`
  await page.screenshot({ path })
  const geminiShown = gemini && (await page.getByText('Powered by Gemini').first().isVisible())
  if (gemini && !geminiShown) warnings.push(`${name}: no "Powered by Gemini" label (Gemini rate limit or daily quota). Rerun once it resets.`)
  const kb = statSync(path).size / 1024
  if (kb * 1024 > DEVPOST_MAX_BYTES) warnings.push(`${name}: ${kb.toFixed(0)} KB is over Devpost's limit`)
  console.log(`${name}.png  ${kb.toFixed(0)} KB${gemini ? (geminiShown ? '  Gemini' : '  fallback text') : ''}`)
}

async function toTheStreet(page, { story } = {}) {
  await page.goto(BASE)
  await page.getByRole('button', { name: 'Play' }).click()
  await page.getByRole('heading', { name: 'Choose a street' }).waitFor()
  if (story) await story.streets(page)
  await page.getByRole('button', { name: 'Play' }).first().click()
  await page.getByRole('button', { name: 'Skip story' }).waitFor()
  if (story) await story.story(page)
  await page.getByRole('button', { name: 'Skip story' }).click()
  await page.getByRole('button', { name: 'Skip to the street' }).click()
  await page.getByRole('button', { name: 'Skip tour' }).click()
}

{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 960 } })).newPage()
  await page.goto(BASE)
  await page.getByRole('button', { name: 'Play' }).waitFor()
  await shot(page, '1-start')
  await toTheStreet(page, {
    story: {
      streets: (p) => shot(p, '2-streets'),
      story: async (p) => {
        for (let i = 0; i < 2; i++) await p.getByRole('button', { name: /^Next/ }).click()
        await shot(p, '3-story')
      },
    },
  })

  // Edit in 2D (two car lanes out, a protected bike lane and parking in), then back to 3D while Pip's lesson shows.
  await page.getByRole('button', { name: 'Edit in 2D' }).click()
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: /^Car 3\.3 m/ }).first().click({ force: true })
    await page.getByRole('button', { name: 'Remove', exact: true }).click()
  }
  await page.getByRole('button', { name: /^Add Protected bike lane/ }).click()
  await page.getByRole('button', { name: /^Add On-street parking/ }).click()
  await page.getByRole('button', { name: 'Edit in 3D' }).click()
  await page.waitForTimeout(2500)
  await shot(page, '4-editor-3d')

  const quiz = page.waitForResponse((r) => r.url().endsWith('/api/quiz'), { timeout: 20000 }).then((r) => r.json()).catch(() => null)
  await page.getByRole('button', { name: /Run (a|another) day/ }).click()
  const card = page.getByRole('dialog', { name: /Goal met|Not there yet/ })
  await card.waitFor()
  await page.waitForResponse((r) => r.url().endsWith('/api/story'), { timeout: 20000 }).catch(() => {})
  const day = card.locator('details', { hasText: '’s day' }).first()
  await day.locator('summary').click()
  await day.scrollIntoViewIfNeeded()
  await shot(page, '6-scorecard', true)

  const check = card.locator('details', { hasText: 'Quick check' })
  await check.locator('summary').click()
  const answer = (await quiz)?.answer ?? 0
  await check.getByRole('group').getByRole('button').nth(answer).click()
  await check.getByText(/Right!|Not quite\./).waitFor()
  await check.scrollIntoViewIfNeeded()
  await shot(page, '7-quick-check', true)

  await card.getByRole('button', { name: 'Close' }).click()
  const why = page.getByRole('button', { name: 'Why? Emissions cut' })
  await why.click()
  await page.locator(`[id="${await why.getAttribute('aria-controls')}"]`).getByText('Pip is thinking…').waitFor({ state: 'detached', timeout: 15000 })
  await shot(page, '5-why', true)

  await page.getByRole('button', { name: /^Badges/ }).click()
  await page.getByRole('dialog', { name: 'Your badges' }).waitFor()
  await shot(page, '8-badges')

  await page.goto(`${BASE}/data`)
  await page.getByRole('heading', { level: 1 }).waitFor()
  await shot(page, '9-data')
}
{
  const page = await (await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage()
  await toTheStreet(page)
  await page.waitForTimeout(2500)
  await shot(page, '10-phone')
}
await browser.close()
for (const w of warnings) console.warn(`warning: ${w}`)
