import { MODEL } from './model/constants'
import { scoreRun } from './model/score'
import { bikeFacility, has, widthOf } from './model/traffic'
import type { Layout, Level, Metrics, PersonaId } from './model/types'
import { PERSONAS, residentsOf } from './personas'

/** Which goal or star a hint helps with. */
export type HintFor = 'emissions' | 'happiness' | 'safety'
export type Hint = { for: HintFor; text: string }

const beside = (layout: Layout, id: string, others: string[]) =>
  layout.elements.some((e, i) => e.id === id && [layout.elements[i - 1]?.id, layout.elements[i + 1]?.id].some((n) => n && others.includes(n)))

// What each weight in personaMetrics (model/metrics.ts) rewards, in words.
const NEEDS: Record<keyof (typeof PERSONAS)[PersonaId]['weights'], (id: PersonaId) => string> = {
  travelTime: () => 'a quicker trip',
  safety: (id) => (PERSONAS[id].trip.mode === 'bike' ? 'a safer bike route' : 'feeling safe beside traffic'),
  comfort: (id) => (PERSONAS[id].trip.mode === 'bike' ? 'a better bike lane' : 'room to walk: sidewalks, trees or patios'),
  access: (id) => (id === 'shop_owner' ? 'curb space for deliveries and more people walking or biking past' : 'curb space to stop and load'),
}

/**
 * Hints for whatever the run missed: unmet goals first, then the next star. Each restates a rule of the model,
 * so it never claims more than the model does. Spec 2.7: they explain trade-offs, never which lanes to pick.
 */
export function hints(layout: Layout, m: Metrics, level: Level): Hint[] {
  const score = scoreRun(m, level)
  const missed = new Set<HintFor>(score.goals.filter((g) => !g.met).map((g) => g.kind))
  if (score.goalMet) {
    if (m.safetyScore < level.stars.safety) missed.add('safety')
    if (m.fairness < level.stars.fairness) missed.add('happiness')
  }
  const out: Hint[] = []
  const add = (f: HintFor, when: boolean, text: string) => when && missed.has(f) && out.push({ for: f, text })
  const facility = bikeFacility(layout)
  const sidewalkM = widthOf(layout, 'sidewalk')

  add('emissions', true, 'Emissions fall only when fewer trips are made by car. That happens when the bus, biking or walking get better, or when driving gets slower.')
  add('emissions', sidewalkM < MODEL.walkComfortWidthM.value, `Sidewalks total ${sidewalkM.toFixed(1)} m. Below ${MODEL.walkComfortWidthM.value} m, walking feels worse and some walkers drive instead.`)
  add('emissions', facility !== 'protected', `With ${facility === 'none' ? 'no bike lane' : 'only a painted bike lane'}, biking feels worse and some riders drive instead.`)
  add('emissions', !has(layout, 'bus_lane'), 'Buses here share car traffic. A bus lane keeps bus trips quick, so more people ride.')
  add('emissions', m.unusedWidthM < 1, `The street is ${level.corridor.widthM} m wide and full, so space for any change has to come from another piece.`)

  const low = (Object.entries(m.happiness) as [PersonaId, number][]).sort((a, b) => a[1] - b[1])[0][0]
  const top = (Object.entries(PERSONAS[low].weights) as [keyof typeof NEEDS, number][]).filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1])
  add('happiness', true, `${residentsOf(level)[low].name} is least happy (${m.happiness[low].toFixed(0)}/100) and cares most about ${NEEDS[top[0][0]](low)} and ${NEEDS[top[1][0]](low)}.`)
  add('happiness', m.unusedWidthM > 0, `${m.unusedWidthM.toFixed(1)} m is unused. Empty space costs every resident some happiness.`)

  add('safety', facility === 'painted' && beside(layout, 'bike_painted', ['parking']), 'A painted bike lane beside parking puts riders in the door zone.')
  add('safety', has(layout, 'sidewalk') && !beside(layout, 'sidewalk', ['planter', 'parking']), 'Trees or parking between a sidewalk and traffic act as a buffer for people walking.')
  add('safety', facility !== 'protected', 'Riders are safest in a protected bike lane, less safe in a painted one and least safe with none.')
  add('safety', true, 'Each car lane adds speed risk for people walking and biking.')
  return out
}
