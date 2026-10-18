import { hasBuffer, inDoorZone } from './model/metrics'
import { bikeFacility, simulateTraffic, widthOf } from './model/traffic'
import type { Layout, Level, Metrics, PersonaId } from './model/types'
import { residentsOf } from './personas'

export const CONCEPTS = {
  'right-of-way': {
    name: 'Right-of-way',
    definition:
      'The full width of a street, from property line to property line. Everything (sidewalks, lanes, parking, trees) has to fit inside it, so giving a metre to one use takes it from another.',
  },
  'mode-shift': {
    name: 'Mode shift',
    definition:
      'When a street changes, some people change how they travel: a better bus lane or bike lane draws some drivers out of their cars, and a slower drive does too. In the game, emissions fall only through mode shift, and the shift is capped.',
  },
  'door-zone': {
    name: 'Door zone',
    definition: 'The strip beside parked cars where an opening door can hit someone riding past. A painted bike lane next to parking puts riders in it.',
  },
  buffer: {
    name: 'Buffer',
    definition: 'Something between people walking and moving traffic, such as trees or a row of parked cars. Buffers make walking feel and be safer.',
  },
  'curb-access': {
    name: 'Curb access',
    definition: 'Space at the curb to stop, load and unload. Deliveries, shops and people who can’t walk far depend on it.',
  },
  fairness: {
    name: 'Fairness',
    definition: 'In the game, a street is only as fair as its least happy resident. A design that delights three people and fails one is not a fair design.',
  },
} as const
export type ConceptId = keyof typeof CONCEPTS

export type Lesson = { concept: ConceptId; good: boolean; text: string }

/**
 * How a design does on each concept, worst first. Each lesson restates a rule of the model (shared/src/model).
 * Spec 2.7: they judge outcomes such as safety, fairness and trips switching, never which lanes a design has.
 */
export function lessons(layout: Layout, m: Metrics, level: Level): Lesson[] {
  const { corridor, goal } = level
  const who = residentsOf(level)
  const out: Lesson[] = []
  const add = (concept: ConceptId, good: boolean, text: string) => out.push({ concept, good, text })

  add(
    'right-of-way',
    m.unusedWidthM === 0,
    m.unusedWidthM === 0
      ? `You used all ${corridor.widthM} m of the right-of-way. Every metre has a job.`
      : `${m.unusedWidthM.toFixed(1)} m of the ${corridor.widthM} m right-of-way sits empty, and every resident loses a little happiness for it.`,
  )

  const fewerDrivers = Math.round(corridor.baselineDemand.car - simulateTraffic(layout, corridor).demand.car)
  const target = goal.minEmissionsReductionPct ?? 0
  const pct = m.emissionsReductionPct.toFixed(1)
  add(
    'mode-shift',
    m.emissionsReductionPct >= target && fewerDrivers > 0,
    fewerDrivers < 0
      ? `About ${-fewerDrivers} more people drive in the peak hour than today, so emissions went up.`
      : fewerDrivers < 5
        ? 'Almost nobody switched out of a car, so emissions barely moved. People switch when the bus, biking or walking get better, or when driving gets slower.'
        : m.emissionsReductionPct >= target
          ? `About ${fewerDrivers} fewer people drive in the peak hour because other ways of getting around got better. That cut emissions ${pct}%.`
          : `About ${fewerDrivers} fewer people drive in the peak hour, cutting emissions ${pct}%. The goal is ${target}%, so more trips need to switch.`,
  )

  const facility = bikeFacility(layout)
  if (facility !== 'none')
    add(
      'door-zone',
      !inDoorZone(layout),
      inDoorZone(layout)
        ? 'Riders are in the door zone: the painted bike lane runs right beside parked cars. Cyclist safety drops.'
        : 'Riders stay out of the door zone: no painted bike lane runs beside parked cars.',
    )

  if (widthOf(layout, 'sidewalk') > 0)
    add(
      'buffer',
      hasBuffer(layout),
      hasBuffer(layout)
        ? 'Trees or parked cars sit between a sidewalk and moving traffic. That buffer makes walking safer.'
        : 'Every sidewalk sits right beside traffic, with nothing in between. People walking get no buffer.',
    )

  const curb = widthOf(layout, 'parking') + widthOf(layout, 'loading')
  add(
    'curb-access',
    curb > 0,
    curb > 0
      ? `There are ${curb.toFixed(1)} m of curb space to stop and unload, which ${who.driver_delivery.name}, ${who.shop_owner.name} and ${who.senior_walker.name} all count on.`
      : `There is no curb space, so deliveries can’t stop and ${who.senior_walker.name} can’t be dropped off. ${who.driver_delivery.name} and ${who.shop_owner.name} feel it most.`,
  )

  const [low, value] = (Object.entries(m.happiness) as [PersonaId, number][]).sort((a, b) => a[1] - b[1])[0]
  const floor = goal.minHappiness ?? 0
  add(
    'fairness',
    value >= floor,
    value >= floor
      ? `Everyone stays at least ${floor} happy. The least happy is ${who[low].name}, at ${value.toFixed(0)}.`
      : `${who[low].name} is at ${value.toFixed(0)}, below ${floor}. A street is only as fair as its least happy resident.`,
  )

  return out.sort((a, b) => Number(a.good) - Number(b.good))
}
