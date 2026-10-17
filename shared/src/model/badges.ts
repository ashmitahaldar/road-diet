import { DESIGN_CHOICE } from './constants'
import type { Stars } from './score'
import type { Metrics } from './types'

export type BadgeId = 'fair_share' | 'low_carbon' | 'second_choice'
export type Badge = { id: BadgeId; name: string; description: string }

// Spec 2.7: badges reward balance and goals, never a particular lane type.
export const BADGES = {
  fair_share: { name: 'Fair Share', minHappiness: 60, source: DESIGN_CHOICE },
  low_carbon: { name: 'Low-Carbon Street', minEmissionsReductionPct: 30, minHappiness: 40, source: DESIGN_CHOICE },
  second_choice: { name: "Everyone's Second Choice", maxSpread: 25, minHappiness: 40, source: DESIGN_CHOICE },
}

/** Only on top of a met goal: today's street scores 60 / spread 0 and would otherwise earn badges unchanged. */
export function earnedBadges(m: Metrics, goalMet: boolean, t = BADGES): Badge[] {
  if (!goalMet) return []
  const all: (Badge & { earned: boolean })[] = [
    {
      id: 'fair_share',
      name: t.fair_share.name,
      description: `Every resident at least ${t.fair_share.minHappiness} happy.`,
      earned: m.fairness >= t.fair_share.minHappiness,
    },
    {
      id: 'low_carbon',
      name: t.low_carbon.name,
      description: `Emissions cut by at least ${t.low_carbon.minEmissionsReductionPct}% with every resident at least ${t.low_carbon.minHappiness} happy.`,
      earned: m.emissionsReductionPct >= t.low_carbon.minEmissionsReductionPct && m.fairness >= t.low_carbon.minHappiness,
    },
    {
      id: 'second_choice',
      name: t.second_choice.name,
      description: `Residents within ${t.second_choice.maxSpread} happiness points of each other, all at least ${t.second_choice.minHappiness}.`,
      earned: m.fairnessSpread <= t.second_choice.maxSpread && m.fairness >= t.second_choice.minHappiness,
    },
  ]
  return all.filter((b) => b.earned).map(({ earned: _, ...b }) => b)
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
