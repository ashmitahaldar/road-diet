import { MODEL } from './model/constants'
import type { Metrics, PersonaId } from './model/types'
import { PERSONAS } from './personas'

export type Mood = 'up' | 'flat' | 'down'
export type Reaction = { personaId: PersonaId; mood: Mood; line: string }
/** Response of POST /api/react (spec 5.2). `source` drives the "Powered by Gemini" label. */
export type ReactResult = { reactions: Reaction[]; debrief: string; source: 'gemini' | 'fallback' }

/** Mood comes from the model's numbers, never from Gemini. */
export const moodFor = (happiness: number, baseline: number): Mood =>
  happiness - baseline > 3 ? 'up' : happiness - baseline < -3 ? 'down' : 'flat'

// Canned lines when Gemini is off, slow or wrong. Neutral: about the resident's trip, not about lane types.
export const FALLBACK_LINES: Record<PersonaId, Record<Mood, string>> = {
  driver_delivery: {
    up: 'My route and my stops at the shops both work better than before.',
    flat: 'Not much changes for my deliveries. I can work with this.',
    down: 'My route takes longer or loading got harder, and that adds up over a day.',
  },
  student_cyclist: {
    up: 'Getting to campus feels safer and calmer now.',
    flat: 'My ride to campus feels about the same.',
    down: 'My ride feels less safe or slower than it used to.',
  },
  senior_walker: {
    up: 'My walk to the pharmacy feels more comfortable and safer.',
    flat: 'My walk feels about the same as before.',
    down: 'Walking here feels less comfortable than it did.',
  },
  shop_owner: {
    up: 'More people pass my shop, and deliveries still reach me.',
    flat: 'Business on the street feels about the same.',
    down: 'I worry customers and deliveries will find my shop harder to reach.',
  },
}

/** The limitation every debrief must carry (spec 5.2). */
export const MODE_SHIFT_LIMITATION = `This is a simplified estimate: the model lets at most ${Math.round(
  MODEL.maxTotalShift.value * 100,
)}% of trips switch mode, so real changes could be larger or smaller.`

export function fallbackReaction(personaId: PersonaId, happiness: number): Reaction {
  const mood = moodFor(happiness, PERSONAS[personaId].baselineHappiness)
  return { personaId, mood, line: FALLBACK_LINES[personaId][mood] }
}

export function fallbackResult(m: Metrics): ReactResult {
  const pct = m.emissionsReductionPct
  const emissions = Math.abs(pct) < 0.05 ? 'stay about the same' : `${pct > 0 ? 'fall' : 'rise'} by ${Math.abs(pct).toFixed(1)}%`
  return {
    reactions: Object.values(PERSONAS).map((p) => fallbackReaction(p.id, m.happiness[p.id])),
    debrief: `With this design, estimated emissions ${emissions} and the least happy resident sits at ${m.fairness.toFixed(0)} out of 100. ${MODE_SHIFT_LIMITATION}`,
    source: 'fallback',
  }
}
