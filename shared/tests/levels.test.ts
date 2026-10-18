import { expect, test } from 'vitest'
import { BLOOR_LEVEL, LEVELS, MOUNT_PLEASANT_LEVEL, residentsOf, computeMetrics, scoreRun, validateLayout, type ElementId, type Layout, type Level } from '../src'

const S = (...xs: [ElementId, number][]): Layout => ({ elements: xs.map(([id, widthM]) => ({ id, widthM })) })
const stars = (l: Layout, level: Level) => scoreRun(computeMetrics(l, level), level).stars
const lanes = (l: Layout) => l.elements.filter((e) => e.id === 'car_lane').length

test('Mount Pleasant is level 1 and Bloor level 2; both corridors have every spec 4.4 field', () => {
  expect(Object.keys(LEVELS)).toEqual(['mount-pleasant-eglinton-blythwood', 'bloor-christie-ossington'])
  for (const level of Object.values(LEVELS)) {
    for (const key of ['id', 'name', 'widthM', 'lengthKm', 'baselineLayout', 'baselineDemand', 'baselineSafety', 'freeFlowSpeedKph', 'sources'])
      expect(level.corridor).toHaveProperty(key)
    expect(level.corridor.sources.length).toBeGreaterThanOrEqual(5)
    expect(level.corridor.estimates?.map((e) => e.field)).toContain('baselineLayout')
  }
})

test("today's street fills the width exactly and earns no stars, on both levels", () => {
  for (const level of Object.values(LEVELS)) {
    expect(validateLayout(level.corridor.baselineLayout, level)).toMatchObject({ valid: true, unusedWidthM: 0 })
    expect(stars(level.corridor.baselineLayout, level)).toBe(0)
  }
})

test('Mount Pleasant can be won three stars with one car lane and with two (spec 2.7)', () => {
  const level = MOUNT_PLEASANT_LEVEL
  const one = S(['sidewalk', 4], ['bike_protected', 2], ['parking', 2.4], ['car_lane', 3.3], ['parking', 2.4], ['sidewalk', 5.9])
  const two = S(['sidewalk', 4.5], ['parking', 2.4], ['car_lane', 3.3], ['car_lane', 3.3], ['bike_protected', 2], ['sidewalk', 4.5])
  const twoWithBus = S(['sidewalk', 3], ['bike_protected', 2], ['car_lane', 3.3], ['bus_lane', 3.5], ['car_lane', 3.3], ['parking', 2.4], ['sidewalk', 2.5])
  for (const l of [one, two, twoWithBus]) expect(validateLayout(l, level).valid).toBe(true)
  expect([one, two, twoWithBus].map((l) => [lanes(l), stars(l, level)])).toEqual([[1, 3], [2, 3], [2, 3]])
})

test('Bloor: three stars are reachable, and a two-lane design can clear the goal', () => {
  const level = BLOOR_LEVEL
  const three = S(['sidewalk', 5], ['bike_protected', 2], ['parking', 2.4], ['car_lane', 3.3], ['parking', 2.4], ['sidewalk', 4.9])
  expect(stars(three, level)).toBe(3)
  const two = S(['sidewalk', 3.7], ['planter', 1.5], ['bike_protected', 2], ['car_lane', 3.3], ['car_lane', 3.3], ['bike_protected', 2], ['parking', 2.4], ['sidewalk', 1.8])
  expect(validateLayout(two, level).valid).toBe(true)
  expect(stars(two, level)).toBeGreaterThanOrEqual(1)
})

test('each street has its own residents in the same four roles', () => {
  const names = (level: Level) => Object.values(residentsOf(level)).map((p) => p.name)
  expect(names(BLOOR_LEVEL)).toEqual(['Marco', 'Priya', 'Mr. Okafor', 'Lin'])
  expect(names(MOUNT_PLEASANT_LEVEL)).toEqual(['Dev', 'Maya', 'Mrs. Rossi', 'Omar'])
  expect(residentsOf(MOUNT_PLEASANT_LEVEL).student_cyclist.trip).toEqual(residentsOf(BLOOR_LEVEL).student_cyclist.trip)
})

test('a score that reads as meeting a star earns it (54.6 safety shows as 55)', () => {
  const l = S(['sidewalk', 3.4], ['bike_protected', 2], ['parking', 2.4], ['car_lane', 3.3], ['car_lane', 3.3], ['sidewalk', 3.4])
  const m = computeMetrics(l, MOUNT_PLEASANT_LEVEL)
  expect(m.safetyScore).toBe(MOUNT_PLEASANT_LEVEL.stars.safety)
  expect(stars(l, MOUNT_PLEASANT_LEVEL)).toBeGreaterThanOrEqual(2)
})
