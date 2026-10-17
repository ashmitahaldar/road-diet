import type { Persona, PersonaId } from './model/types'

// Fictional composites, never real people. Trips and weights are design choices, not data.
// Lean scope: 4 personas. The parent-with-stroller persona is Stretch (spec 2.3).
export const PERSONAS: Record<PersonaId, Persona> = {
  driver_delivery: {
    id: 'driver_delivery',
    name: 'Marco',
    blurb: 'Delivery driver who loads at shops along the street (fictional resident).',
    trip: { mode: 'car', distanceKm: 6 },
    weights: { travelTime: 3, safety: 1, comfort: 0, access: 3 },
    baselineHappiness: 60,
  },
  student_cyclist: {
    id: 'student_cyclist',
    name: 'Priya',
    blurb: 'Student who bikes to campus (fictional resident).',
    trip: { mode: 'bike', distanceKm: 4 },
    weights: { travelTime: 1, safety: 3, comfort: 2, access: 0 },
    baselineHappiness: 60,
  },
  senior_walker: {
    id: 'senior_walker',
    name: 'Mr. Okafor',
    blurb: 'Senior who walks to the pharmacy and grocery (fictional resident).',
    trip: { mode: 'walk', distanceKm: 0.8 },
    weights: { travelTime: 1, safety: 2, comfort: 3, access: 2 },
    baselineHappiness: 60,
  },
  shop_owner: {
    id: 'shop_owner',
    name: 'Lin',
    blurb: 'Runs a shop on the street and depends on foot traffic and deliveries (fictional resident).',
    trip: { mode: 'walk', distanceKm: 0.5 },
    weights: { travelTime: 0, safety: 1, comfort: 2, access: 3 },
    baselineHappiness: 60,
  },
}
