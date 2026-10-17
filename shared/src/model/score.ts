import type { Level, Metrics } from './types'

export type GoalCheck = { kind: 'emissions' | 'happiness' | 'safety'; target: number; value: number; met: boolean }
export type Stars = 0 | 1 | 2 | 3
export type Score = { goals: GoalCheck[]; goalMet: boolean; stars: Stars }

/** Goal checklist and stars (spec 2.6): 1 = goal met, 2 = also safety, 3 = also fairness. */
export function scoreRun(m: Metrics, level: Level): Score {
  const { minEmissionsReductionPct, minHappiness, minSafety } = level.goal
  const check = (kind: GoalCheck['kind'], target: number | undefined, value: number): GoalCheck[] =>
    target === undefined ? [] : [{ kind, target, value, met: value >= target }]
  const goals = [
    ...check('emissions', minEmissionsReductionPct, m.emissionsReductionPct),
    ...check('happiness', minHappiness, m.fairness),
    ...check('safety', minSafety, m.safetyScore),
  ]
  const goalMet = goals.every((g) => g.met)
  const safe = m.safetyScore >= level.stars.safety
  const fair = m.fairness >= level.stars.fairness
  const stars: Stars = !goalMet ? 0 : !safe ? 1 : !fair ? 2 : 3
  return { goals, goalMet, stars }
}
