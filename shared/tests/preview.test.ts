import { describe, expect, test } from 'vitest'
import { BLOOR_LEVEL, previewTraffic, removeElement, type Layout } from '../src'

const corridor = BLOOR_LEVEL.corridor
const base = corridor.baselineLayout
const idx = (layout: Layout, id: string) => layout.elements.flatMap((e, i) => (e.id === id ? [i] : []))

describe('previewTraffic', () => {
  test('objects follow demand: no bus demand on Bloor means no buses; the rest add up to about max', () => {
    const p = previewTraffic(base, corridor, 80)
    expect(p.bus.count).toBe(0)
    expect(p.car.count + p.bike.count + p.walk.count).toBeGreaterThanOrEqual(78)
    expect(p.car.count).toBeGreaterThan(p.walk.count)
  })

  test('each mode uses its own elements', () => {
    const p = previewTraffic(base, corridor)
    expect(p.car.lanes).toEqual(idx(base, 'car_lane'))
    expect(p.bike.lanes).toEqual(idx(base, 'bike_protected'))
    expect(p.walk.lanes).toEqual(idx(base, 'sidewalk'))
  })

  test('without bike lanes, bikes ride the curbside car lanes; without sidewalks nobody walks', () => {
    const noBikes = { elements: base.elements.filter((e) => e.id !== 'bike_protected') }
    const cars = idx(noBikes, 'car_lane')
    expect(previewTraffic(noBikes, corridor).bike.lanes).toEqual([cars[0], cars.at(-1)])
    const noWalk = { elements: base.elements.filter((e) => e.id !== 'sidewalk') }
    expect(previewTraffic(noWalk, corridor).walk).toMatchObject({ count: 0, lanes: [] })
  })

  test('buses fall back to car lanes; one car lane fewer means slower cars', () => {
    const withBus = { ...corridor, baselineDemand: { ...corridor.baselineDemand, bus: 300 } }
    expect(previewTraffic(base, withBus).bus.lanes).toEqual(idx(base, 'car_lane'))
    const oneLane = removeElement(base, idx(base, 'car_lane')[1])
    expect(previewTraffic(oneLane, corridor).car.speedMps).toBeLessThan(previewTraffic(base, corridor).car.speedMps)
  })
})
