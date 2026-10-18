import { DESIGN_CHOICE } from './constants'
import type { Stars } from './score'
import type { Metrics } from './types'

export type BadgeId = 'fair_share' | 'low_carbon' | 'second_choice' | 'safe_streets'
export type Badge = { id: BadgeId; name: string; description: string }

// Spec 2.7: badges reward balance and goals, never a particular lane type.
export const BADGES = {
  fair_share: { name: 'Fair Share', minHappiness: 60, source: DESIGN_CHOICE },
  low_carbon: { name: 'Low-Carbon Street', minEmissionsReductionPct: 10, minHappiness: 40, source: DESIGN_CHOICE },
  second_choice: { name: "Everyone's Second Choice", maxSpread: 25, minHappiness: 40, source: DESIGN_CHOICE },
  safe_streets: { name: 'Safe Streets', minSafety: 60, minHappiness: 50, source: DESIGN_CHOICE },
}

const RULES: Record<BadgeId, { description: (t: typeof BADGES) => string; earned: (m: Metrics, t: typeof BADGES) => boolean }> = {
  fair_share: {
    description: (t) => `Every resident at least ${t.fair_share.minHappiness} happy.`,
    earned: (m, t) => m.fairness >= t.fair_share.minHappiness,
  },
  low_carbon: {
    description: (t) => `Emissions cut by at least ${t.low_carbon.minEmissionsReductionPct}% with every resident at least ${t.low_carbon.minHappiness} happy.`,
    earned: (m, t) => m.emissionsReductionPct >= t.low_carbon.minEmissionsReductionPct && m.fairness >= t.low_carbon.minHappiness,
  },
  second_choice: {
    description: (t) => `Residents within ${t.second_choice.maxSpread} happiness points of each other, all at least ${t.second_choice.minHappiness}.`,
    earned: (m, t) => m.fairnessSpread <= t.second_choice.maxSpread && m.fairness >= t.second_choice.minHappiness,
  },
  safe_streets: {
    description: (t) => `Safety at least ${t.safe_streets.minSafety} with every resident at least ${t.safe_streets.minHappiness} happy.`,
    earned: (m, t) => m.safetyScore >= t.safe_streets.minSafety && m.fairness >= t.safe_streets.minHappiness,
  },
}

/** Every badge, earned or not, for the collection. */
export const allBadges = (t = BADGES): Badge[] => (Object.keys(RULES) as BadgeId[]).map((id) => ({ id, name: t[id].name, description: RULES[id].description(t) }))

/** Only on top of a met goal: today's street scores 60 / spread 0 and would otherwise earn badges unchanged. */
export function earnedBadges(m: Metrics, goalMet: boolean, t = BADGES): Badge[] {
  if (!goalMet) return []
  return allBadges(t).filter((b) => RULES[b.id].earned(m, t))
}

/** The "Copy my result" text. */
export function resultText(r: { levelName: string; stars: Stars; badges: Badge[]; emissionsDeltaKg: number; url: string }) {
  const kg = Math.round(r.emissionsDeltaKg)
  return [
    `Road Diet · ${r.levelName}: ${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)} (${r.stars} of 3 stars)`,
    r.badges.length ? `Badges: ${r.badges.map((b) => b.name).join(', ')}` : null,
    `Emissions: ${kg > 0 ? '+' : kg < 0 ? '−' : '±'}${Math.abs(kg)} kg CO₂e per peak hour`,
    `Play: ${r.url}`,
  ]
    .filter(Boolean)
    .join('\n')
}
