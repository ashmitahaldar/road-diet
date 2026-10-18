import { expect, test } from 'vitest'
import { LEVELS, MOUNT_PLEASANT_LEVEL as MP, TOPICS, computeMetrics, fallbackQuiz, grounded, happinessFactors, quizCandidates, residentsOf, whyFacts, type ElementId, type Layout, type PersonaId } from '../src'

const S = (...xs: [ElementId, number][]): Layout => ({ elements: xs.map(([id, widthM]) => ({ id, widthM })) })
const bikeLanes = S(['sidewalk', 3.4], ['bike_protected', 2], ['car_lane', 3.3], ['car_lane', 3.3], ['parking', 2.6], ['bike_protected', 2], ['sidewalk', 3.4])
const designs = [MP.corridor.baselineLayout, bikeLanes]

test('every topic has facts on every street, and the fallback is grounded in them', () => {
  for (const level of Object.values(LEVELS))
    for (const topic of TOPICS) {
      const f = whyFacts(level.corridor.baselineLayout, level, topic)
      expect(f.facts.length).toBeGreaterThanOrEqual(2)
      expect(grounded(f.facts.join(' '), f.facts)).toBe(true)
    }
})

test('emissions facts follow the model: fewer drivers when emissions fall', () => {
  const m = computeMetrics(bikeLanes, MP)
  const facts = whyFacts(bikeLanes, MP, 'emissions').facts.join(' ')
  expect(m.emissionsReductionPct).toBeGreaterThan(0)
  expect(facts).toContain(`${m.emissionsReductionPct.toFixed(1)}% lower`)
  expect(facts).toMatch(/fewer people drive/)
})

test('happiness factors add up to the change in happiness', () => {
  const m = computeMetrics(bikeLanes, MP)
  const f = happinessFactors(bikeLanes, MP)
  for (const p of Object.values(residentsOf(MP))) {
    const sum = Object.values(f[p.id]).reduce((a, b) => a + b, 0)
    expect(Math.min(100, Math.max(0, p.baselineHappiness + sum))).toBeCloseTo(m.happiness[p.id], 6)
  }
})

test('grounded rejects a number the facts never gave', () => {
  const facts = ['Emissions are 9.6% lower than today.']
  expect(grounded('Emissions fell 9.6% because people switched.', facts)).toBe(true)
  expect(grounded('Emissions fell about 10%.', facts)).toBe(false)
})

test('quiz answers match the model and wrong options are never the answer', () => {
  for (const layout of designs) {
    const m = computeMetrics(layout, MP)
    const who = residentsOf(MP)
    const cs = quizCandidates(layout, MP)
    expect(cs.map((c) => c.id)).toContain('emissions-cause')
    for (const c of cs) {
      expect(c.wrong).not.toContain(c.correct)
      expect(new Set([c.correct, ...c.wrong]).size).toBe(3)
      const q = fallbackQuiz(c)
      expect(q.options[q.answer]).toBe(c.correct)
    }
    const low = (Object.entries(m.happiness) as [PersonaId, number][]).sort((a, b) => a[1] - b[1])[0][0]
    const least = cs.find((c) => c.id === 'least-happy')
    if (least) expect(least.correct).toBe(who[low].name)
  }
  expect(quizCandidates(bikeLanes, MP).find((c) => c.id === 'emissions-cause')?.correct).toMatch(/switched/)
})
