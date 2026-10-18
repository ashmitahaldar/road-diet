import { MODEL } from './model/constants'
import { computeMetrics, emptySpacePenalty, happinessFactors, hasBuffer, inDoorZone, safetyBreakdown, type Factor } from './model/metrics'
import { MODES, bikeFacility, has, simulateTraffic, widthOf } from './model/traffic'
import type { Layout, Level, Mode, Persona, PersonaId } from './model/types'
import { PERSONAS, residentsOf } from './personas'
import type { TextSource } from './reactions'

export const METER_TOPICS = ['emissions', 'safety', 'travel', 'fairness'] as const
export type Topic = (typeof METER_TOPICS)[number] | PersonaId
export const TOPICS: Topic[] = [...METER_TOPICS, ...(Object.keys(PERSONAS) as PersonaId[])]

/** True statements about one result, built from the model. Pip's explanations and the quiz may only use these. */
export type WhyFacts = { topic: Topic; question: string; facts: string[] }
export type Why = { text: string; source: TextSource }

const r1 = (x: number) => x.toFixed(1)
const r0 = (x: number) => x.toFixed(0)
const signed = (x: number, digits = 1) => `${x > 0 ? '+' : x < 0 ? '−' : '±'}${Math.abs(x).toFixed(digits)}`
const vsToday = (d: number) => (Math.abs(d) < 0.05 ? 'the same as today' : `${signed(d)} min vs today`)
const count = (layout: Layout, id: string) => layout.elements.filter((e) => e.id === id).length
const mean = (r: Record<PersonaId, number>) => Object.values(r).reduce((a, b) => a + b, 0) / Object.keys(r).length

const RIDERS: Record<Exclude<Mode, 'car'>, string> = { bus: 'take the bus', bike: 'bike', walk: 'walk' }
const GOES: Record<Mode, string> = { car: 'drive', bus: 'bus ride', bike: 'bike ride', walk: 'walk' }
const FACILITY = { none: 'no bike lane', painted: 'a painted bike lane', protected: 'a protected bike lane' }

export function factorPhrase(f: Factor, p: Persona): string {
  const mode = p.trip.mode
  return {
    travelTime: 'their trip time',
    safety: mode === 'bike' ? 'how safe riding feels' : mode === 'car' ? 'how safe the street feels' : 'how safe walking feels',
    comfort: mode === 'bike' ? 'how comfortable riding is' : 'room to walk on the sidewalk',
    access: p.id === 'shop_owner' ? 'customers and deliveries reaching the shop' : 'curb space to stop',
  }[f]
}

/** Factors that moved this resident's happiness, biggest first, in happiness points. */
export function residentFactors(layout: Layout, level: Level, id: PersonaId): [Factor, number][] {
  return (Object.entries(happinessFactors(layout, level)[id]) as [Factor, number][]).filter(([, v]) => Math.abs(v) >= 0.5).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
}

function residentFacts(layout: Layout, level: Level, id: PersonaId): string[] {
  const p = residentsOf(level)[id]
  const m = computeMetrics(layout, level)
  const base = computeMetrics(level.corridor.baselineLayout, level)
  const out = [
    `${p.name} is ${r0(m.happiness[id])}/100 happy, ${signed(m.happiness[id] - base.happiness[id], 0)} vs today.`,
    `${p.name} wants ${p.wants}.`,
    `${p.name}'s ${p.trip.distanceKm} km ${GOES[p.trip.mode]} takes ${r1(m.travelTimeMin[id])} min, ${vsToday(m.travelTimeMin[id] - base.travelTimeMin[id])}.`,
  ]
  for (const [f, v] of residentFactors(layout, level, id).slice(0, 3))
    out.push(`${v > 0 ? 'Better' : 'Worse'} ${factorPhrase(f, p)} ${v > 0 ? 'added' : 'took away'} about ${r0(Math.abs(v))} happiness points.`)
  if (m.happiness[id] >= 100) out.push('Happiness tops out at 100, so some of the gain does not show.')
  const penalty = emptySpacePenalty(layout, level)
  if (penalty > 0.5) out.push(`Empty space on the street took away about ${r0(penalty)} happiness points from every resident.`)
  return out
}

function emissionsFacts(layout: Layout, level: Level): string[] {
  const { corridor } = level
  const now = simulateTraffic(layout, corridor)
  const today = simulateTraffic(corridor.baselineLayout, corridor)
  const pct = computeMetrics(layout, level).emissionsReductionPct
  const out = [
    Math.abs(pct) < 0.05 ? 'Emissions are the same as today.' : `Emissions are ${r1(Math.abs(pct))}% ${pct > 0 ? 'lower' : 'higher'} than today.`,
    'In the game, emissions change only when trips switch between driving, the bus, biking and walking. The total number of trips stays the same.',
  ]
  const drivers = Math.round(today.demand.car - now.demand.car)
  out.push(
    drivers >= 5
      ? `About ${drivers} fewer people drive in the peak hour.`
      : drivers <= -5
        ? `About ${-drivers} more people drive in the peak hour.`
        : 'Almost nobody changed how they travel.',
  )
  for (const m of ['bus', 'bike', 'walk'] as const) {
    const d = Math.round(now.demand[m] - today.demand[m])
    if (Math.abs(d) >= 5) out.push(`About ${Math.abs(d)} ${d > 0 ? 'more' : 'fewer'} people ${RIDERS[m]}.`)
  }
  const dq = (m: Mode) => now.quality[m] - today.quality[m]
  if (dq('car') < -0.02) out.push('Driving got slower because the car lanes are more crowded, which nudges some drivers to switch.')
  if (dq('car') > 0.02) out.push('Driving got quicker because the car lanes are less crowded, which draws more people into cars.')
  if (dq('bus') > 0.02) out.push(has(layout, 'bus_lane') ? 'Buses got more reliable because they skip the car traffic in their own lane.' : 'Buses got more reliable.')
  if (dq('bus') < -0.02) out.push('Buses got slower because they sit in more crowded traffic.')
  if (dq('bike') > 0.02) out.push(`Biking feels safer with ${FACILITY[bikeFacility(layout)]}, so more people ride.`)
  if (dq('bike') < -0.02) out.push(`Biking feels less safe with ${FACILITY[bikeFacility(layout)]}, so fewer people ride.`)
  if (dq('walk') > 0.02) out.push('Wider sidewalks make walking more pleasant.')
  if (dq('walk') < -0.02) out.push('Narrower sidewalks make walking less pleasant.')
  const total = MODES.reduce((s, m) => s + today.demand[m], 0)
  const shifted = MODES.reduce((s, m) => s + Math.abs(now.demand[m] - today.demand[m]), 0) / 2 / total
  if (shifted >= MODEL.maxTotalShift.value - 0.001) out.push(`The game caps how many trips can switch at ${r0(100 * MODEL.maxTotalShift.value)}%, and this design reached the cap.`)
  return out
}

function safetyFacts(layout: Layout, level: Level): string[] {
  const s = safetyBreakdown(layout)
  const s0 = safetyBreakdown(level.corridor.baselineLayout)
  const lanes = count(layout, 'car_lane')
  const lanes0 = count(level.corridor.baselineLayout, 'car_lane')
  const out = [
    `Safety is ${r0(s.overall)}/100, ${signed(s.overall - s0.overall, 0)} vs today.`,
    `There ${lanes === 1 ? 'is 1 car lane' : `are ${lanes} car lanes`}${lanes !== lanes0 ? ` instead of ${lanes0}` : ''}. In the game, each car lane adds speed risk for people walking and biking.`,
    `People biking have ${FACILITY[bikeFacility(layout)]}. Safety for people biking is ${r0(s.cyclist)}/100 (today ${r0(s0.cyclist)}).`,
  ]
  if (inDoorZone(layout)) out.push('The painted bike lane runs beside parked cars, so riders are in the door zone.')
  out.push(
    hasBuffer(layout)
      ? `Trees or parked cars sit between a sidewalk and traffic. Safety for people walking is ${r0(s.pedestrian)}/100 (today ${r0(s0.pedestrian)}).`
      : `No sidewalk has a buffer from traffic. Safety for people walking is ${r0(s.pedestrian)}/100 (today ${r0(s0.pedestrian)}).`,
  )
  out.push('Safety is an index from the street layout, not a collision forecast.')
  return out
}

function travelFacts(layout: Layout, level: Level): string[] {
  const { corridor } = level
  const m = computeMetrics(layout, level)
  const base = computeMetrics(corridor.baselineLayout, level)
  const now = simulateTraffic(layout, corridor)
  const today = simulateTraffic(corridor.baselineLayout, corridor)
  const out = [`The average resident's trip takes ${r1(mean(m.travelTimeMin))} min, ${signed(mean(m.travelTimeMin) - mean(base.travelTimeMin))} min vs today.`]
  for (const p of Object.values(residentsOf(level))) {
    const d = m.travelTimeMin[p.id] - base.travelTimeMin[p.id]
    if (Math.abs(d) >= 0.1) out.push(`${p.name}'s ${GOES[p.trip.mode]} takes ${r1(m.travelTimeMin[p.id])} min, ${signed(d)} min vs today.`)
  }
  const slower = (mode: Mode) => now.minPerKm[mode] - today.minPerKm[mode]
  if (Math.abs(slower('car')) > 0.01) out.push(`Driving is ${slower('car') > 0 ? 'slower' : 'quicker'} because the car lanes are ${slower('car') > 0 ? 'more' : 'less'} crowded.`)
  if (Math.abs(slower('bus')) > 0.01) out.push(has(layout, 'bus_lane') ? 'Buses skip most of the car traffic in their own lane.' : 'Buses sit in the same traffic as cars.')
  if (Math.abs(slower('bike')) > 0.01) out.push(`Riders go ${slower('bike') > 0 ? 'slower' : 'faster'} with ${FACILITY[bikeFacility(layout)]}, because riders slow down where riding feels unsafe.`)
  if (out.length === 1) out.push("No resident's trip time changed.")
  if (Math.abs(slower('walk')) > 0.01) out.push(`Walking is ${slower('walk') > 0 ? 'slower' : 'quicker'} with ${r1(widthOf(layout, 'sidewalk'))} m of sidewalk.`)
  return out
}

function fairnessFacts(layout: Layout, level: Level): string[] {
  const m = computeMetrics(layout, level)
  const [low] = (Object.entries(m.happiness) as [PersonaId, number][]).sort((a, b) => a[1] - b[1])[0]
  const name = residentsOf(level)[low].name
  return [
    `Fairness is the happiness of the least happy resident: ${name}, at ${r0(m.fairness)}/100.`,
    `The happiest and least happy residents are ${r0(m.fairnessSpread)} points apart.`,
    ...residentFacts(layout, level, low).slice(2),
  ]
}

export function whyFacts(layout: Layout, level: Level, topic: Topic): WhyFacts {
  const who = residentsOf(level)
  switch (topic) {
    case 'emissions':
      return { topic, question: 'Why did emissions change?', facts: emissionsFacts(layout, level) }
    case 'safety':
      return { topic, question: 'Why is the street this safe?', facts: safetyFacts(layout, level) }
    case 'travel':
      return { topic, question: 'Why did trip times change?', facts: travelFacts(layout, level) }
    case 'fairness':
      return { topic, question: 'Why is fairness at this level?', facts: fairnessFacts(layout, level) }
    default:
      return { topic, question: `Why does ${who[topic].name} feel this way?`, facts: residentFacts(layout, level, topic) }
  }
}

/** The first facts, verbatim: used when Gemini is off, slow or not grounded. */
export const fallbackWhy = ({ facts }: WhyFacts): Why => ({ text: facts.slice(0, 3).join(' '), source: 'fallback' })

/** Every number in `text` must appear in the facts, so Gemini can rephrase but not invent. */
export function grounded(text: string, facts: string[]): boolean {
  const known = new Set(facts.join(' ').match(/\d+(?:\.\d+)?/g) ?? [])
  return (text.match(/\d+(?:\.\d+)?/g) ?? []).every((n) => known.has(n))
}
