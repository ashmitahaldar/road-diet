import { describe, expect, test } from 'vitest'
import {
  ELEMENTS,
  PLACEHOLDER_LEVEL,
  addElement,
  moveElement,
  remainingWidth,
  removeElement,
  resizeElement,
  validateLayout,
  type ElementId,
  type Layout,
} from '../src'

const level = PLACEHOLDER_LEVEL
const baseline = level.corridor.baselineLayout
const carLane = baseline.elements.findIndex((e) => e.id === 'car_lane')

describe('editor operations', () => {
  test('cannot add to a full street', () => {
    expect(remainingWidth(baseline, level)).toBe(0)
    expect(addElement(baseline, level, 'planter')).toBe(baseline)
  })

  test('add uses the default width, capped by free space, and needs at least minW', () => {
    let l = removeElement(baseline, carLane) // frees 3.4 m
    l = addElement(l, level, 'bike_protected', carLane)
    expect(l.elements[carLane]).toEqual({ id: 'bike_protected', widthM: 2 })
    expect(remainingWidth(l, level)).toBe(1.4)
    expect(addElement(l, level, 'bike_protected')).toBe(l) // needs 1.8
    expect(addElement(l, level, 'planter').elements.at(-1)).toEqual({ id: 'planter', widthM: 1.4 })
  })

  test('resize snaps to 0.1 m and respects min, max and free space', () => {
    const l = resizeElement(baseline, level, carLane, -0.1)
    expect(l.elements[carLane].widthM).toBe(3.3)
    expect(resizeElement(l, level, carLane, 0.1).elements[carLane].widthM).toBe(3.4)
    expect(resizeElement(baseline, level, carLane, 0.1)).toBe(baseline) // no free space
    expect(resizeElement(l, level, carLane, -1).elements[carLane].widthM).toBe(ELEMENTS.car_lane.minW)
    const roomy = removeElement(l, 0)
    expect(resizeElement(roomy, level, carLane - 1, 2).elements[carLane - 1].widthM).toBe(ELEMENTS.car_lane.maxW)
  })

  test('move swaps neighbours and stops at the edges', () => {
    expect(moveElement(baseline, 0, 1).elements.slice(0, 2).map((e) => e.id)).toEqual(['parking', 'sidewalk'])
    expect(moveElement(baseline, 0, -1)).toBe(baseline)
  })

  test('random edit sequences never exceed the street width', () => {
    const ids = Object.keys(ELEMENTS) as ElementId[]
    let seed = 42
    const rand = (n: number) => ((seed = (seed * 1103515245 + 12345) % 2 ** 31), seed % n)
    let l: Layout = baseline
    for (let step = 0; step < 2000; step++) {
      const i = rand(Math.max(1, l.elements.length))
      const op = rand(4)
      if (op === 0) l = addElement(l, level, ids[rand(ids.length)], i)
      if (op === 1) l = resizeElement(l, level, i, (rand(21) - 10) / 10)
      if (op === 2 && rand(3) === 0) l = removeElement(l, i)
      if (op === 3) l = moveElement(l, i, rand(2) ? 1 : -1)
      expect(validateLayout(l, level).valid).toBe(true)
    }
  })
})
