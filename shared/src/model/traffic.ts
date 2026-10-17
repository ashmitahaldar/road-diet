import { PERSONAS } from '../personas'
import { ELEMENTS, MODEL } from './constants'
import type { BikeFacility, Corridor, Demand, ElementId, Layout, Mode, PersonaId } from './types'

export const MODES: Mode[] = ['car', 'bus', 'bike', 'walk']

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const byMode = <T>(f: (m: Mode) => T) => Object.fromEntries(MODES.map((m) => [m, f(m)])) as Record<Mode, T>
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export const widthOf = (layout: Layout, id: ElementId) =>
  sum(layout.elements.filter((e) => e.id === id).map((e) => e.widthM))
export const has = (layout: Layout, id: ElementId) => layout.elements.some((e) => e.id === id)

export function bikeFacility(layout: Layout): BikeFacility {
  return has(layout, 'bike_protected') ? 'protected' : has(layout, 'bike_painted') ? 'painted' : 'none'
}

/** Spec 3.2: element capacity scaled linearly by width vs standard width, clamped. */
export function capacityByMode(layout: Layout): Record<Mode, number> {
  const cap = byMode(() => 0)
  for (const { id, widthM } of layout.elements) {
    const def = ELEMENTS[id]
    for (const m of def.modes) cap[m] += def.capacityPph * clamp(widthM / def.defaultW, 0.5, 1.5)
  }
  return cap
}

/** BPR volume-delay multiplier on free-flow time (spec 3.4). */
export function bpr(volume: number, capacity: number): number {
  // ponytail: v/c capped at maxVc so zero car lanes stays finite; a real model would reroute that traffic.
  const vc = capacity > 0 ? Math.min(volume / capacity, MODEL.maxVc.value) : MODEL.maxVc.value
  return 1 + MODEL.bprAlpha.value * vc ** MODEL.bprBeta.value
}

/** 0-1 quality per mode, from the layout alone (baseline demand). */
export function modeQuality(layout: Layout, corridor: Corridor): Record<Mode, number> {
  const car = 1 / bpr(corridor.baselineDemand.car, capacityByMode(layout).car)
  return {
    car,
    bus: has(layout, 'bus_lane') ? 1 : MODEL.busMixedQuality.value * car,
    bike: MODEL.bikeQuality.value[bikeFacility(layout)],
    walk: Math.min(1, widthOf(layout, 'sidewalk') / MODEL.walkComfortWidthM.value),
  }
}

/**
 * Spec 3.3 mode shift as a pivot-point logit: share_m ∝ share0_m · exp(k·Δquality_m), then pulled back toward
 * the baseline until both caps hold. Total demand is conserved and no share goes negative.
 */
export function shiftDemand(base: Demand, q0: Record<Mode, number>, q: Record<Mode, number>): Demand {
  const total = sum(MODES.map((m) => base[m]))
  if (total === 0) return base
  const s0 = byMode((m) => base[m] / total)
  const raw = byMode((m) => s0[m] * Math.exp(MODEL.shiftSensitivity.value * (q[m] - q0[m])))
  const rawTotal = sum(MODES.map((m) => raw[m]))
  const delta = byMode((m) => raw[m] / rawTotal - s0[m])

  const totalShift = sum(MODES.map((m) => Math.abs(delta[m]))) / 2
  const maxDelta = Math.max(...MODES.map((m) => Math.abs(delta[m])))
  const scale = Math.min(
    1,
    totalShift > 0 ? MODEL.maxTotalShift.value / totalShift : 1,
    maxDelta > 0 ? MODEL.maxShiftPerMode.value / maxDelta : 1,
  )
  return byMode((m) => (s0[m] + scale * delta[m]) * total)
}

export function minutesPerKm(layout: Layout, corridor: Corridor, demand: Demand): Record<Mode, number> {
  const congestion = bpr(demand.car, capacityByMode(layout).car)
  const q = modeQuality(layout, corridor)
  const slow = (quality: number) => 1 + MODEL.slowFacilityPenalty.value * (1 - quality)
  const busExposure = has(layout, 'bus_lane') ? MODEL.busLaneCongestionFactor.value : 1
  return {
    car: (60 / corridor.freeFlowSpeedKph) * congestion,
    bus: (60 / MODEL.busSpeedKph.value) * (1 + (congestion - 1) * busExposure),
    bike: (60 / MODEL.bikeSpeedKph.value) * slow(q.bike),
    walk: (60 / MODEL.walkSpeedKph.value) * slow(q.walk),
  }
}

export type Traffic = {
  capacity: Record<Mode, number>
  quality: Record<Mode, number>
  demand: Demand
  minPerKm: Record<Mode, number>
  travelTimeMin: Record<PersonaId, number>
}

export function simulateTraffic(layout: Layout, corridor: Corridor): Traffic {
  const quality = modeQuality(layout, corridor)
  const demand = shiftDemand(corridor.baselineDemand, modeQuality(corridor.baselineLayout, corridor), quality)
  const minPerKm = minutesPerKm(layout, corridor, demand)
  const travelTimeMin = Object.fromEntries(
    Object.values(PERSONAS).map((p) => [p.id, p.trip.distanceKm * minPerKm[p.trip.mode]]),
  ) as Record<PersonaId, number>
  return { capacity: capacityByMode(layout), quality, demand, minPerKm, travelTimeMin }
}
