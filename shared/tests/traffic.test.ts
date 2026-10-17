import { describe, expect, test } from 'vitest'
import { MODEL, MODES, PLACEHOLDER_LEVEL, capacityByMode, shiftDemand, simulateTraffic, type Demand, type Layout } from '../src'

const corridor = PLACEHOLDER_LEVEL.corridor
const baseline = corridor.baselineLayout
const total = (d: Demand) => MODES.reduce((s, m) => s + d[m], 0)

describe('simulateTraffic', () => {
  test('baseline layout keeps baseline demand and baseline travel times', () => {
    const t = simulateTraffic(baseline, corridor)
    for (const m of MODES) expect(t.demand[m]).toBeCloseTo(corridor.baselineDemand[m], 9)

    // Marco drives 6 km at 40 km/h free flow, 3 lanes of 3.4 m at 600 pph each (scaled by 3.4/3.3).
    const carCap = 3 * 600 * (3.4 / 3.3)
    const expected = 6 * (60 / 40) * (1 + 0.15 * (1200 / carCap) ** 4)
    expect(t.travelTimeMin.driver_delivery).toBeCloseTo(expected, 9)
  })

  test('removing a car lane never raises car capacity', () => {
    const before = capacityByMode(baseline).car
    baseline.elements.forEach((e, i) => {
      if (e.id !== 'car_lane') return
      const without: Layout = { elements: baseline.elements.filter((_, j) => j !== i) }
      expect(capacityByMode(without).car).toBeLessThan(before)
    })
  })

  test('mode shift respects per-mode and total caps on an extreme redesign', () => {
    const noCars: Layout = {
      elements: [
        { id: 'sidewalk', widthM: 3 },
        { id: 'bike_protected', widthM: 2.5 },
        { id: 'bus_lane', widthM: 3.5 },
        { id: 'bus_lane', widthM: 3.5 },
        { id: 'bike_protected', widthM: 2.5 },
        { id: 'sidewalk', widthM: 3 },
      ],
    }
    const base = corridor.baselineDemand
    const d = simulateTraffic(noCars, corridor).demand
    const T = total(base)
    const shares = MODES.map((m) => (d[m] - base[m]) / T)

    expect(total(d)).toBeCloseTo(T, 9)
    for (const m of MODES) expect(d[m]).toBeGreaterThanOrEqual(0)
    for (const s of shares) expect(Math.abs(s)).toBeLessThanOrEqual(MODEL.maxShiftPerMode.value + 1e-9)
    expect(shares.reduce((a, s) => a + Math.abs(s), 0) / 2).toBeLessThanOrEqual(MODEL.maxTotalShift.value + 1e-9)
    expect(d.car).toBeLessThan(base.car)
  })

  test('shiftDemand caps a huge quality jump and conserves demand', () => {
    const base: Demand = { car: 1000, bus: 0, bike: 0, walk: 1000 }
    const zero = { car: 0, bus: 0, bike: 0, walk: 0 }
    const d = shiftDemand(base, zero, { ...zero, bike: 10 })
    expect(total(d)).toBeCloseTo(2000, 9)
    expect(d.bike / 2000).toBeCloseTo(0, 9) // zero baseline share stays zero (pivot-point logit)
    expect(shiftDemand(base, zero, zero)).toEqual(base)
  })
})
