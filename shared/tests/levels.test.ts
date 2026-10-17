import { expect, test } from 'vitest'
import { BLOOR_LEVEL, LEVELS, computeMetrics, scoreRun, validateLayout, type ElementId, type Layout } from '../src'

const level = BLOOR_LEVEL
const S = (...xs: [ElementId, number][]): Layout => ({ elements: xs.map(([id, widthM]) => ({ id, widthM })) })

test('Bloor St W is the only playable level and its corridor has every spec 4.4 field', () => {
  expect(Object.keys(LEVELS)).toEqual(['bloor-christie-ossington'])
  for (const key of ['id', 'name', 'widthM', 'lengthKm', 'baselineLayout', 'baselineDemand', 'baselineSafety', 'freeFlowSpeedKph', 'sources'])
    expect(level.corridor).toHaveProperty(key)
  expect(level.corridor.sources.length).toBeGreaterThanOrEqual(5)
  expect(level.corridor.estimates?.map((e) => e.field)).toContain('baselineLayout')
})

test("today's street fills the width exactly and earns no stars", () => {
  expect(validateLayout(level.corridor.baselineLayout, level)).toMatchObject({ valid: true, unusedWidthM: 0 })
  expect(scoreRun(computeMetrics(level.corridor.baselineLayout, level), level).stars).toBe(0)
})

test('three stars are reachable: one travel lane, parking kept on both sides, a cycle track', () => {
  const l = S(['sidewalk', 5], ['bike_protected', 2], ['parking', 2.4], ['car_lane', 3.3], ['parking', 2.4], ['sidewalk', 4.9])
  expect(validateLayout(l, level).valid).toBe(true)
  expect(scoreRun(computeMetrics(l, level), level).stars).toBe(3)
})
