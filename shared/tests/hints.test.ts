import { expect, test } from 'vitest'
import { BLOOR_LEVEL as level, ELEMENTS, computeMetrics, hints, scoreRun, type ElementId, type Layout } from '../src'

const street = (...ids: ElementId[]): Layout => ({ elements: ids.map((id) => ({ id, widthM: ELEMENTS[id].defaultW })) })
const run = (layout: Layout) => {
  const m = computeMetrics(layout, level)
  return { score: scoreRun(m, level), hints: hints(layout, m, level) }
}

test('the baseline street gets hints for each unmet goal, and only those', () => {
  const { score, hints: h } = run(level.corridor.baselineLayout)
  const missed = score.goals.filter((g) => !g.met).map((g) => g.kind)
  expect(missed.length).toBeGreaterThan(0)
  expect(new Set(h.map((x) => x.for))).toEqual(new Set(missed))
})

test('the happiness hint names the least happy resident', () => {
  const layout = street('sidewalk', 'bike_protected', 'car_lane', 'bus_lane', 'sidewalk')
  const m = computeMetrics(layout, level)
  const h = hints(layout, m, level).filter((x) => x.for === 'happiness')
  expect(h[0].text).toMatch(/^Marco is least happy/)
})

test('once the goal is met, hints point at the stars still missing', () => {
  const layout = street('sidewalk', 'planter', 'bike_protected', 'car_lane', 'bus_lane', 'parking', 'sidewalk')
  const { score, hints: h } = run(layout)
  expect(score.goalMet).toBe(true)
  expect(score.stars).toBeLessThan(3)
  expect(h.length).toBeGreaterThan(0)
  expect(h.every((x) => x.for !== 'emissions')).toBe(true)
})

test('hints describe trade-offs, not which lanes to add or remove (spec 2.7)', () => {
  const layouts = [level.corridor.baselineLayout, street('sidewalk', 'parking', 'bike_painted', 'car_lane', 'car_lane', 'sidewalk')]
  for (const layout of layouts)
    for (const { text } of hints(layout, computeMetrics(layout, level), level)) expect(text).not.toMatch(/\b(remove|delete|get rid of|add more)\b/i)
})
