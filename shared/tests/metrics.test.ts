import { describe, expect, test } from 'vitest'
import { PERSONAS, PLACEHOLDER_LEVEL, computeMetrics, safetyBreakdown, type Layout } from '../src'

const level = PLACEHOLDER_LEVEL
const baseline = level.corridor.baselineLayout
const L = (...ids: [Layout['elements'][number]['id'], number][]): Layout => ({ elements: ids.map(([id, widthM]) => ({ id, widthM })) })

describe('computeMetrics', () => {
  test('baseline gives zero emissions change and baseline happiness', () => {
    const m = computeMetrics(baseline, level)
    expect(m.emissionsReductionPct).toBe(0)
    for (const p of Object.values(PERSONAS)) expect(m.happiness[p.id]).toBeCloseTo(p.baselineHappiness, 9)
    expect(m.safetyScore).toBeGreaterThan(0)
    expect(m.safetyScore).toBeLessThan(100)
    expect(m.fairness).toBe(Math.min(...Object.values(m.happiness)))
    expect(m.unusedWidthM).toBe(0)
  })

  test('trading car lanes for bus and protected bike lanes cuts emissions', () => {
    const m = computeMetrics(
      L(['sidewalk', 2.5], ['bike_protected', 2], ['bus_lane', 3.3], ['car_lane', 3.3], ['car_lane', 3.3], ['parking', 2.4], ['sidewalk', 2.5]),
      level,
    )
    expect(m.emissionsReductionPct).toBeGreaterThan(0)
  })
})

describe('safetyBreakdown', () => {
  const withProtected = (layout: Layout): Layout => ({ elements: [...layout.elements, { id: 'bike_protected', widthM: 2 }] })
  const cases: Record<string, Layout> = {
    baseline,
    'painted lane in the door zone': L(['sidewalk', 2.5], ['parking', 2.4], ['bike_painted', 1.5], ['car_lane', 3.3], ['car_lane', 3.3], ['sidewalk', 2.5]),
    'already protected': L(['sidewalk', 2.5], ['bike_protected', 2], ['car_lane', 3.3], ['sidewalk', 2.5]),
  }

  for (const [name, layout] of Object.entries(cases)) {
    test(`adding a protected bike lane never lowers cyclist safety (${name})`, () => {
      expect(safetyBreakdown(withProtected(layout)).cyclist).toBeGreaterThanOrEqual(safetyBreakdown(layout).cyclist)
    })
  }

  test('door zone makes a painted lane less safe', () => {
    const doorZone = L(['parking', 2.4], ['bike_painted', 1.5], ['car_lane', 3.3])
    const clear = L(['parking', 2.4], ['planter', 1], ['bike_painted', 1.5], ['car_lane', 3.3])
    expect(safetyBreakdown(doorZone).cyclist).toBeLessThan(safetyBreakdown(clear).cyclist)
  })
})
