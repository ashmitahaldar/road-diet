import { TODO_SOURCE } from '../model/constants'
import type { Level } from '../model/types'

// Placeholder until a real corridor is built from Toronto data (#11).
export const PLACEHOLDER_LEVEL: Level = {
  id: 'placeholder',
  name: 'Placeholder St',
  corridor: {
    id: 'placeholder',
    name: 'Placeholder St',
    widthM: 20,
    lengthKm: 0.8,
    baselineLayout: {
      elements: [
        { id: 'sidewalk', widthM: 2.5 },
        { id: 'parking', widthM: 2.4 },
        { id: 'car_lane', widthM: 3.4 },
        { id: 'car_lane', widthM: 3.4 },
        { id: 'car_lane', widthM: 3.4 },
        { id: 'parking', widthM: 2.4 },
        { id: 'sidewalk', widthM: 2.5 },
      ],
    },
    baselineDemand: { car: 1200, bus: 600, bike: 100, walk: 800 },
    baselineSafety: { ksiCollisions5y: 0, pedestrianInvolved: 0, cyclistInvolved: 0 },
    freeFlowSpeedKph: 40,
    sources: [],
    source: TODO_SOURCE,
  },
  // Lean scope (spec 2.2): loading zone and patio are Stretch.
  allowedElements: ['sidewalk', 'car_lane', 'bus_lane', 'bike_painted', 'bike_protected', 'parking', 'planter'],
  goal: { minEmissionsReductionPct: 20, minHappiness: 40 },
  stars: { safety: 55, fairness: 55 },
}

export const LEVELS: Record<string, Level> = { placeholder: PLACEHOLDER_LEVEL }
