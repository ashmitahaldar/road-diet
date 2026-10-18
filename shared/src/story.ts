import type { Layout, Level, Metrics, Mode, PersonaId } from './model/types'
import { residentsOf } from './personas'
import { moodFor, type TextSource } from './reactions'

/** Response of POST /api/story: a name for the design and each resident's day on it, in three short panels. */
export type DayStory = {
  name: string
  nameSource: TextSource
  days: { personaId: PersonaId; panels: [string, string, string]; source: TextSource }[]
}

export const PANELS = ['Morning', 'Midday', 'Evening'] as const

const GOES: Record<Mode, string> = { car: 'drives', bus: 'rides the bus', bike: 'bikes', walk: 'walks' }
const MIDDAY = { up: 'The street feels better than it used to.', flat: 'The street feels much the same as before.', down: 'The day feels harder than it used to.' }
const EVENING = {
  up: 'Heading home, it feels like the change was worth it.',
  flat: 'Heading home, it is an ordinary day.',
  down: 'Heading home, they hope the street keeps changing.',
}

/** Built only from the model's numbers, for when Gemini is off, slow or wrong. */
export function fallbackStory(level: Level, m: Metrics, base: Metrics): DayStory {
  return {
    name: `My ${level.name.split(' (')[0]}`,
    nameSource: 'fallback',
    days: Object.values(residentsOf(level)).map((p) => {
      const t = m.travelTimeMin[p.id]
      const d = t - base.travelTimeMin[p.id]
      const change = Math.abs(d) < 0.05 ? 'the same as before' : `${Math.abs(d).toFixed(1)} min ${d > 0 ? 'longer' : 'shorter'} than before`
      const mood = moodFor(m.happiness[p.id], p.baselineHappiness)
      return {
        personaId: p.id,
        panels: [`${p.name} ${GOES[p.trip.mode]} ${p.trip.distanceKm} km. It takes ${t.toFixed(1)} min, ${change}.`, MIDDAY[mood], EVENING[mood]],
        source: 'fallback',
      }
    }),
  }
}

/** A plain description of a layout for an illustration prompt: kinds of piece only, no place names. */
export const describeLayout = (layout: Layout) => layout.elements.map((e) => e.id.replace('_', ' ')).join(', ')
