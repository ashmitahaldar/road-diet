import { expect, test } from 'vitest'
import { BADGES, BLOOR_LEVEL, ELEMENTS, PLACEHOLDER_LEVEL, computeMetrics, earnedBadges, listDesignChoices, resultText, scoreRun, type Metrics } from '../src'

const base = computeMetrics(PLACEHOLDER_LEVEL.corridor.baselineLayout, PLACEHOLDER_LEVEL)
const ids = (patch: Partial<Metrics>) => earnedBadges({ ...base, ...patch }, true).map((b) => b.id)

test('Fair Share: lowest happiness at least 60', () => {
  expect(ids({ fairness: 60, fairnessSpread: 99, emissionsReductionPct: 0 })).toEqual(['fair_share'])
  expect(ids({ fairness: 59.9, fairnessSpread: 99, emissionsReductionPct: 0 })).toEqual([])
})

test('Low-Carbon Street: 30% cut and lowest happiness at least 40', () => {
  const p = { fairnessSpread: 99 }
  expect(ids({ ...p, emissionsReductionPct: 30, fairness: 40 })).toEqual(['low_carbon'])
  expect(ids({ ...p, emissionsReductionPct: 29.9, fairness: 40 })).toEqual([])
  expect(ids({ ...p, emissionsReductionPct: 50, fairness: 39.9 })).toEqual([])
})

test("Everyone's Second Choice: spread at most 25 and lowest at least 40", () => {
  const p = { emissionsReductionPct: 0 }
  expect(ids({ ...p, fairnessSpread: 25, fairness: 40 })).toEqual(['second_choice'])
  expect(ids({ ...p, fairnessSpread: 25.1, fairness: 40 })).toEqual([])
  expect(ids({ ...p, fairnessSpread: 0, fairness: 39.9 })).toEqual([])
  expect(ids({ fairnessSpread: 10, fairness: 70, emissionsReductionPct: 40 })).toEqual(['fair_share', 'low_carbon', 'second_choice'])
})

test('no badges without a met goal, so leaving the street unchanged earns none', () => {
  const today = computeMetrics(BLOOR_LEVEL.corridor.baselineLayout, BLOOR_LEVEL)
  expect(earnedBadges(today, scoreRun(today, BLOOR_LEVEL).goalMet)).toEqual([])
  expect(earnedBadges({ ...today, emissionsReductionPct: 50 }, false)).toEqual([])
})

test('thresholds are configurable and listed as design choices', () => {
  const t = { ...BADGES, fair_share: { ...BADGES.fair_share, minHappiness: 80 } }
  expect(earnedBadges({ ...base, fairness: 70, fairnessSpread: 99, emissionsReductionPct: 0 }, true, t)).toEqual([])
  expect(listDesignChoices()).toEqual(expect.arrayContaining(['badges.fair_share', 'badges.low_carbon', 'badges.second_choice']))
})

test('copy text', () => {
  const badges = earnedBadges({ ...base, fairness: 70, fairnessSpread: 10, emissionsReductionPct: 0 }, true)
  expect(resultText({ levelName: 'Bloor St W', stars: 2, badges, emissionsDeltaKg: -120.4, url: 'https://example.test' })).toBe(
    "Road Diet · Bloor St W: ★★☆ (2 of 3 stars)\nBadges: Fair Share, Everyone's Second Choice\nEmissions: −120 kg CO₂e per peak hour\nPlay: https://example.test",
  )
  expect(resultText({ levelName: 'X', stars: 0, badges: [], emissionsDeltaKg: 0.2, url: 'u' })).not.toContain('Badges')
})

test('neutrality (spec 2.7): no election words, no lane types', () => {
  const all = earnedBadges({ ...base, fairness: 100, fairnessSpread: 0, emissionsReductionPct: 100 }, true)
  expect(all).toHaveLength(3)
  const copy = [...all.flatMap((b) => [b.name, b.description]), resultText({ levelName: 'L', stars: 3, badges: all, emissionsDeltaKg: -1, url: 'u' })].join(' ')
  expect(copy).not.toMatch(/\b(vote|voting|election|party|candidate)/i)
  for (const e of Object.values(ELEMENTS)) expect(copy.toLowerCase()).not.toContain(e.label.toLowerCase())
  expect(copy).not.toMatch(/\b(car|bike|parking|lane)s?\b/i)
})
