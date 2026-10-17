import { expect, test } from 'vitest'
import { PLACEHOLDER_LEVEL, computeMetrics, scoreRun, type Metrics } from '../src'

const level = PLACEHOLDER_LEVEL
const base = computeMetrics(level.corridor.baselineLayout, level)
const with_ = (patch: Partial<Metrics>) => scoreRun({ ...base, ...patch }, level)

test('the baseline street misses the emissions goal', () => {
  const s = scoreRun(base, level)
  expect(s.goalMet).toBe(false)
  expect(s.stars).toBe(0)
  expect(s.goals.map((g) => [g.kind, g.met])).toEqual([
    ['emissions', false],
    ['happiness', true],
  ])
})

test('stars follow spec 2.6', () => {
  const { safety, fairness } = level.stars
  const goal = { emissionsReductionPct: 25 }
  expect(with_({ ...goal, safetyScore: safety - 1, fairness: 90 }).stars).toBe(1)
  expect(with_({ ...goal, safetyScore: safety, fairness: fairness - 1 }).stars).toBe(2)
  expect(with_({ ...goal, safetyScore: safety, fairness }).stars).toBe(3)
  expect(with_({ ...goal, safetyScore: 100, fairness: 39 }).stars).toBe(0)
})
