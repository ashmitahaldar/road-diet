import { expect, test } from 'vitest'
import { PLACEHOLDER_LEVEL, computeMetrics, fallbackResult, moodFor, type Metrics } from '../src'

const base = computeMetrics(PLACEHOLDER_LEVEL.corridor.baselineLayout, PLACEHOLDER_LEVEL)

test('moodFor uses a ±3 dead band around the baseline', () => {
  expect([moodFor(64, 60), moodFor(63, 60), moodFor(57, 60), moodFor(56, 60)]).toEqual(['up', 'flat', 'flat', 'down'])
})

test('fallback for the baseline street: four flat residents and a debrief with the mode-shift limitation', () => {
  const r = fallbackResult(base)
  expect(r.debriefSource).toBe('fallback')
  expect(r.reactions.every((x) => x.source === 'fallback')).toBe(true)
  expect(r.reactions.map((x) => x.mood)).toEqual(['flat', 'flat', 'flat', 'flat'])
  expect(r.debrief).toContain('stay about the same')
  expect(r.debrief).toContain('25% of trips switch mode')
})

test('fallback moods and emissions wording follow the numbers', () => {
  const m: Metrics = { ...base, emissionsReductionPct: 21.5, happiness: { ...base.happiness, student_cyclist: 90, driver_delivery: 50 } }
  const r = fallbackResult(m)
  expect(r.reactions.find((x) => x.personaId === 'student_cyclist')?.mood).toBe('up')
  expect(r.reactions.find((x) => x.personaId === 'driver_delivery')?.mood).toBe('down')
  expect(r.debrief).toContain('fall by 21.5%')
})
