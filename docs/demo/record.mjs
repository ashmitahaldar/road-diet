// Backup demo for spec 1.7c; see docs/DEVPOST.md for how to run it.
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const out = process.argv[2] ?? '.'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out, size: { width: 1280, height: 720 } } })
const page = await ctx.newPage()
const t0 = Date.now()
const mark = (step) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${step}`)
const pause = (s) => page.waitForTimeout(s * 1000)
const show = async (locator, s) => {
  await locator.evaluate((e) => e.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  await pause(s)
}

await page.goto(BASE)
mark('1 problem, user and neutrality line')
await pause(4)
await show(page.getByText('A learning tool, not a forecast.').first(), 4)

await page.getByRole('button', { name: 'Play' }).click()
mark('2 Pip and the residents ask for help')
for (let i = 0; i < 4; i++) {
  await pause(2.5)
  await page.getByRole('button', { name: 'Next' }).click()
}
await page.getByRole('button', { name: 'Skip story' }).click()
mark('2b real corridor and sources')
for (let i = 0; i < 2; i++) {
  await pause(4)
  await page.getByRole('button', { name: 'Next' }).click()
}
await pause(6)

await page.getByRole('button', { name: 'Start editing' }).click()
mark('3 change the layout and run a day')
await pause(4)
// 3D is the default view; the 2D blocks have names the script can select.
const to2d = page.getByRole('button', { name: 'Edit in 2D' })
if (await to2d.isVisible()) await to2d.click()
await page.getByRole('button', { name: /^Car 3\.3 m/ }).nth(1).click()
await pause(2)
await page.getByRole('button', { name: 'Remove' }).click()
await pause(2)
await page.getByRole('button', { name: /^Add Trees/ }).click()
await pause(3)
await page.getByRole('button', { name: /^run (a|another) day/i }).click()
const dialog = page.getByRole('dialog')
await dialog.waitFor({ timeout: 30000 })

mark('4 scorecard, kg CO2e, limitations')
await pause(6)
await show(dialog.getByRole('heading', { name: 'Limitations' }), 7)

mark('5 how others solved this street')
const others = dialog.locator('[aria-labelledby=others-title]')
if (await others.count()) await show(others, 9)
else console.log('   (no Others chart: is DATABASE_URL set?)')

await dialog.getByRole('button', { name: /keep editing|see it in 3d/i }).first().click()
mark('6 residents, footer, data page')
await pause(5)
await show(page.getByText('Hosted on Vultr'), 3)
await page.goto(`${BASE}/data`)
await pause(4)
await page.mouse.wheel(0, 600)
await pause(4)
mark('end')

const video = page.video()
await ctx.close()
console.log('video:', await video.path())
await browser.close()
