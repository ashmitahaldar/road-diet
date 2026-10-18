import { PERSONAS } from '../personas'
import { MODEL } from './constants'
import { validateLayout } from './layout'
import { MODES, bikeFacility, has, simulateTraffic, widthOf, type Traffic } from './traffic'
import type { Corridor, Layout, Level, Metrics, Persona, PersonaId } from './types'

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const count = (layout: Layout, id: string) => layout.elements.filter((e) => e.id === id).length
const neighbours = (layout: Layout, i: number) => [layout.elements[i - 1]?.id, layout.elements[i + 1]?.id]

export function emissionsKgPerHour(traffic: Traffic, corridor: Corridor): number {
  const ef = MODEL.emissionFactorKgPerPkm.value
  return MODES.reduce((kg, m) => kg + traffic.demand[m] * corridor.lengthKm * ef[m], 0)
}

export const inDoorZone = (layout: Layout) =>
  bikeFacility(layout) === 'painted' && layout.elements.some((e, i) => e.id === 'bike_painted' && neighbours(layout, i).includes('parking'))

export const hasBuffer = (layout: Layout) =>
  layout.elements.some((e, i) => e.id === 'sidewalk' && neighbours(layout, i).some((n) => n === 'planter' || n === 'parking'))

/** Simplified 0-100 index (higher is safer), not a prediction of collisions (spec 3.6). */
export function safetyBreakdown(layout: Layout) {
  // ponytail: corridor collision data (baselineSafety) does not scale risk yet; wire in with real data (#11/#13).
  const speedRisk = 1 + MODEL.carLaneRisk.value * count(layout, 'car_lane')
  const facility = bikeFacility(layout)
  const doorZone = inDoorZone(layout)
  const buffered = hasBuffer(layout)
  const cyclistRisk = MODEL.bikeFacilityRisk.value[facility] * speedRisk * (doorZone ? MODEL.doorZoneRisk.value : 1)
  const pedestrianRisk = speedRisk * (buffered ? MODEL.bufferRisk.value : 1)
  const cyclist = 100 / (1 + cyclistRisk)
  const pedestrian = 100 / (1 + pedestrianRisk)
  return { cyclist, pedestrian, overall: (cyclist + pedestrian) / 2 }
}

type Evaluation = {
  traffic: Traffic
  emissions: number
  safety: ReturnType<typeof safetyBreakdown>
  layout: Layout
}

function evaluate(layout: Layout, corridor: Corridor): Evaluation {
  const traffic = simulateTraffic(layout, corridor)
  return { traffic, emissions: emissionsKgPerHour(traffic, corridor), safety: safetyBreakdown(layout), layout }
}

/** Normalized 0-1-ish metrics a persona cares about (spec 3.7). */
function personaMetrics(p: Persona, e: Evaluation, base: Evaluation) {
  const { mode } = p.trip
  const curbAccess = Math.min(1, (widthOf(e.layout, 'parking') + 2 * widthOf(e.layout, 'loading')) / MODEL.curbRefWidthM.value)
  const footTraffic = (ev: Evaluation) => ev.traffic.demand.walk + ev.traffic.demand.bike
  const access =
    p.id === 'shop_owner'
      ? (curbAccess + Math.min(1, footTraffic(e) / footTraffic(base) / 2) + (has(e.layout, 'patio') ? 1 : 0)) / 3
      : curbAccess
  const streetComfort =
    (widthOf(e.layout, 'sidewalk') + widthOf(e.layout, 'planter') + widthOf(e.layout, 'patio')) / MODEL.comfortRefWidthM.value
  return {
    travelTime: base.traffic.travelTimeMin[p.id] / e.traffic.travelTimeMin[p.id],
    safety: (mode === 'bike' ? e.safety.cyclist : mode === 'car' ? e.safety.overall : e.safety.pedestrian) / 100,
    comfort: mode === 'bike' ? e.traffic.quality.bike : Math.min(1, streetComfort),
    access,
  }
}

export type Factor = keyof ReturnType<typeof personaMetrics>

/** Happiness points each factor added (or took away) vs today, before the empty-space penalty and the 0-100 clamp. */
function factorPoints(p: Persona, cur: Evaluation, base: Evaluation): Record<Factor, number> {
  const m = personaMetrics(p, cur, base)
  const m0 = personaMetrics(p, base, base)
  const weights = Object.entries(p.weights) as [Factor, number][]
  const totalW = weights.reduce((s, [, w]) => s + w, 0)
  const out = { travelTime: 0, safety: 0, comfort: 0, access: 0 }
  for (const [k, w] of weights) out[k] = (100 * w * (m[k] - m0[k])) / totalW
  return out
}

export function happinessFactors(layout: Layout, level: Level): Record<PersonaId, Record<Factor, number>> {
  const base = evaluate(level.corridor.baselineLayout, level.corridor)
  const cur = evaluate(layout, level.corridor)
  return Object.fromEntries(Object.values(PERSONAS).map((p) => [p.id, factorPoints(p, cur, base)])) as Record<PersonaId, Record<Factor, number>>
}

/** Happiness lost to width left empty beyond today's, per resident. */
export function emptySpacePenalty(layout: Layout, level: Level) {
  const extra = validateLayout(layout, level).unusedWidthM - validateLayout(level.corridor.baselineLayout, level).unusedWidthM
  return MODEL.unusedPenaltyPerM.value * extra
}

/** Single entry point: full Metrics for a layout on a level. Assumes the layout passed validateLayout. */
export function computeMetrics(layout: Layout, level: Level): Metrics {
  const { corridor } = level
  const base = evaluate(corridor.baselineLayout, corridor)
  const cur = evaluate(layout, corridor)
  const unusedWidthM = validateLayout(layout, level).unusedWidthM
  const penalty = emptySpacePenalty(layout, level)

  const happiness = {} as Record<PersonaId, number>
  for (const p of Object.values(PERSONAS)) {
    const points = Object.values(factorPoints(p, cur, base)).reduce((a, b) => a + b, 0)
    happiness[p.id] = clamp(p.baselineHappiness + points - penalty, 0, 100)
  }
  const values = Object.values(happiness)

  return {
    emissionsKgPerHour: cur.emissions,
    emissionsReductionPct: base.emissions > 0 ? (100 * (base.emissions - cur.emissions)) / base.emissions : 0,
    safetyScore: cur.safety.overall,
    travelTimeMin: cur.traffic.travelTimeMin,
    happiness,
    fairness: Math.min(...values),
    fairnessSpread: Math.max(...values) - Math.min(...values),
    unusedWidthM,
  }
}
