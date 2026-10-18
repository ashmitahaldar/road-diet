import type { Level, Persona, PersonaId } from './model/types'

// Fictional composites, never real people. Trips and weights are design choices, not data.
// Lean scope: 4 personas. The parent-with-stroller persona is Stretch (spec 2.3).
export const PERSONAS: Record<PersonaId, Persona> = {
  driver_delivery: {
    id: 'driver_delivery',
    look: 'driver_delivery',
    name: 'Marco',
    blurb: 'Delivery driver who loads at shops along the street (fictional resident).',
    ask: 'I deliver to the shops on this block. I need to get across town on time, and somewhere at the curb to stop and unload.',
    wants: 'a quick drive and curb space to unload',
    trip: { mode: 'car', distanceKm: 6 },
    weights: { travelTime: 3, safety: 1, comfort: 0, access: 3 },
    baselineHappiness: 60,
  },
  student_cyclist: {
    id: 'student_cyclist',
    look: 'student_cyclist',
    name: 'Priya',
    blurb: 'Student who bikes to campus (fictional resident).',
    ask: 'I bike to campus every day. I want a ride where I feel safe and have room, not squeezed between traffic and car doors.',
    wants: 'a safe, roomy ride',
    trip: { mode: 'bike', distanceKm: 4 },
    weights: { travelTime: 1, safety: 3, comfort: 2, access: 0 },
    baselineHappiness: 60,
  },
  senior_walker: {
    id: 'senior_walker',
    look: 'senior_walker',
    name: 'Mr. Okafor',
    blurb: 'Senior who walks to the pharmacy and grocery (fictional resident).',
    ask: "I walk to the pharmacy and the grocery. I'd like room to walk, something between me and the traffic, and a spot where my daughter can drop me off.",
    wants: 'room to walk, a buffer and a drop-off spot',
    trip: { mode: 'walk', distanceKm: 0.8 },
    weights: { travelTime: 1, safety: 2, comfort: 3, access: 2 },
    baselineHappiness: 60,
  },
  shop_owner: {
    id: 'shop_owner',
    look: 'shop_owner',
    name: 'Lin',
    blurb: 'Runs a shop on the street and depends on foot traffic and deliveries (fictional resident).',
    ask: 'My shop lives on people walking past and deliveries reaching my door. Make this block a pleasant place to stop.',
    wants: 'foot traffic and deliveries at the door',
    trip: { mode: 'walk', distanceKm: 0.5 },
    weights: { travelTime: 0, safety: 1, comfort: 2, access: 3 },
    baselineHappiness: 60,
  },
}

/** The residents of one level: each role's defaults with that street's cast on top. */
export const residentsOf = (level: Level): Record<PersonaId, Persona> =>
  Object.fromEntries(Object.values(PERSONAS).map((p) => [p.id, { ...p, ...level.cast?.[p.id] }])) as Record<PersonaId, Persona>
