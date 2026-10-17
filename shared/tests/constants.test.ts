import { expect, test } from 'vitest'
import { ELEMENTS, MODEL, listDesignChoices, listTodoSources } from '../src'

test('every constant is sourced, a design choice, or listed as unsourced', () => {
  const todo = listTodoSources()
  const design = listDesignChoices()
  expect(todo.filter((p) => design.includes(p))).toEqual([])
  for (const key of Object.keys(MODEL)) {
    const sourced = !todo.includes(`model.${key}`) && !design.includes(`model.${key}`)
    expect(sourced ? MODEL[key as keyof typeof MODEL].source : 'tagged').toMatch(/https?:\/\/|Bureau of Public Roads|tagged/)
  }
})

test('sourced so far: car, bus and parking lanes, emission factors, BPR; Bloor corridor is sourced', () => {
  const todo = listTodoSources()
  for (const id of ['car_lane', 'bus_lane', 'parking']) expect(todo).not.toContain(`elements.${id}`)
  for (const id of ['sidewalk', 'bike_painted', 'bike_protected', 'planter']) expect(todo).toContain(`elements.${id}`)
  expect(todo).not.toContain('model.emissionFactorKgPerPkm')
  expect(todo).toContain('model.walkSpeedKph')
  expect(todo.filter((p) => p.startsWith('levels.'))).toEqual([])
  expect(listDesignChoices()).toContain('model.maxTotalShift')
  expect(ELEMENTS.bus_lane.minW).toBe(3.3)
})
