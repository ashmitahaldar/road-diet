import { describe, expect, test } from 'vitest'
import { PLACEHOLDER_LEVEL, validateLayout, type Layout, type Level } from '../src'

const level = PLACEHOLDER_LEVEL
const baseline = level.corridor.baselineLayout
const withElements = (elements: Layout['elements']): Layout => ({ elements })

describe('validateLayout', () => {
  test('placeholder baseline fills the width exactly', () => {
    expect(validateLayout(baseline, level)).toEqual({ valid: true, totalWidthM: 20, unusedWidthM: 0, errors: [] })
  })

  test('over-width is invalid', () => {
    const r = validateLayout(withElements([...baseline.elements, { id: 'planter', widthM: 1 }]), level)
    expect(r.valid).toBe(false)
    expect(r.errors).toEqual([{ kind: 'over-width', overByM: 1 }])
    expect(r.unusedWidthM).toBe(0)
  })

  test('under-width is valid and reports unused space', () => {
    const r = validateLayout(withElements(baseline.elements.slice(1)), level)
    expect(r.valid).toBe(true)
    expect(r.unusedWidthM).toBe(2.5)
  })

  test('element narrower or wider than its range is invalid', () => {
    const r = validateLayout(
      withElements([
        { id: 'car_lane', widthM: 2.9 },
        { id: 'sidewalk', widthM: 6.1 },
      ]),
      level,
    )
    expect(r.valid).toBe(false)
    expect(r.errors.map((e) => e.kind === 'out-of-range' && e.index)).toEqual([0, 1])
  })

  test('element not allowed in the level is invalid', () => {
    const strict: Level = { ...level, allowedElements: ['sidewalk', 'car_lane', 'parking'] }
    const r = validateLayout(withElements([{ id: 'patio', widthM: 2 }]), strict)
    expect(r.errors).toEqual([{ kind: 'not-allowed', index: 0, id: 'patio' }])
  })
})

test('lean Level 1 allows the 7 Must elements only (spec 1.9)', () => {
  expect(PLACEHOLDER_LEVEL.allowedElements).toHaveLength(7)
  const r = validateLayout({ elements: [{ id: 'loading', widthM: 3 }, { id: 'patio', widthM: 2 }] }, PLACEHOLDER_LEVEL)
  expect(r.errors.filter((e) => e.kind === 'not-allowed')).toHaveLength(2)
})
