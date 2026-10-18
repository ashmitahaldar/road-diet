import { expect, test } from 'vitest'
import { BLOOR_LEVEL as level, CONCEPTS, ELEMENTS, computeMetrics, lessons, type ElementId, type Layout } from '../src'

const street = (...ids: ElementId[]): Layout => ({ elements: ids.map((id) => ({ id, widthM: ELEMENTS[id].defaultW })) })
const run = (layout: Layout) => lessons(layout, computeMetrics(layout, level), level)
const find = (layout: Layout, concept: keyof typeof CONCEPTS) => run(layout).find((l) => l.concept === concept)

test('today’s street: nobody switches, so mode shift is something to work on', () => {
  const l = find(level.corridor.baselineLayout, 'mode-shift')!
  expect(l.good).toBe(false)
  expect(l.text).toMatch(/Almost nobody switched/)
})

test('a painted bike lane beside parking is the door zone; protected is not', () => {
  expect(find(street('sidewalk', 'parking', 'bike_painted', 'car_lane', 'car_lane', 'sidewalk'), 'door-zone')!.good).toBe(false)
  expect(find(street('sidewalk', 'parking', 'bike_protected', 'car_lane', 'car_lane', 'sidewalk'), 'door-zone')!.good).toBe(true)
  expect(find(street('sidewalk', 'car_lane', 'car_lane', 'sidewalk'), 'door-zone')).toBeUndefined()
})

test('trees beside a sidewalk are a buffer; none is something to work on', () => {
  expect(find(street('sidewalk', 'planter', 'car_lane', 'car_lane', 'sidewalk'), 'buffer')!.good).toBe(true)
  expect(find(street('sidewalk', 'car_lane', 'car_lane', 'sidewalk'), 'buffer')!.good).toBe(false)
})

test('things to work on come before things that went well', () => {
  const ls = run(level.corridor.baselineLayout)
  expect(ls.findIndex((l) => l.good)).toBeGreaterThan(ls.findLastIndex((l) => !l.good))
})

test('lessons describe outcomes, not which lanes to add or remove (spec 2.7)', () => {
  const layouts = [level.corridor.baselineLayout, street('sidewalk', 'bike_protected', 'car_lane', 'bus_lane', 'sidewalk'), street('sidewalk', 'parking', 'bike_painted', 'car_lane', 'car_lane', 'sidewalk')]
  for (const l of layouts.flatMap(run)) expect(l.text).not.toMatch(/\b(remove|delete|get rid of|add more|add a)\b/i)
})
