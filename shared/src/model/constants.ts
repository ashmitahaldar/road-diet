import type { BikeFacility, ElementDef, ElementId, Mode, Sourced } from './types'

/** Marks a number with no verified source yet; listed in the in-app limitations. */
export const TODO_SOURCE = 'TODO-SOURCE'

// Widths from spec 2.2 (placeholders). Capacities are placeholders in the range NACTO publishes; verify before use.
export const ELEMENTS: Record<ElementId, ElementDef> = {
  sidewalk: { id: 'sidewalk', label: 'Sidewalk', defaultW: 2.5, minW: 1.5, maxW: 6, modes: ['walk'], capacityPph: 3000, source: TODO_SOURCE },
  bike_painted: { id: 'bike_painted', label: 'Painted bike lane', defaultW: 1.5, minW: 1.2, maxW: 2, modes: ['bike'], capacityPph: 1500, source: TODO_SOURCE },
  bike_protected: { id: 'bike_protected', label: 'Protected bike lane', defaultW: 2.0, minW: 1.8, maxW: 3, modes: ['bike'], capacityPph: 3000, source: TODO_SOURCE },
  bus_lane: { id: 'bus_lane', label: 'Bus lane', defaultW: 3.3, minW: 3, maxW: 3.7, modes: ['bus'], capacityPph: 4000, source: TODO_SOURCE },
  car_lane: { id: 'car_lane', label: 'Car lane', defaultW: 3.3, minW: 3, maxW: 3.7, modes: ['car'], capacityPph: 600, source: TODO_SOURCE },
  parking: { id: 'parking', label: 'On-street parking', defaultW: 2.4, minW: 2, maxW: 2.7, modes: [], capacityPph: 0, source: TODO_SOURCE },
  loading: { id: 'loading', label: 'Loading zone', defaultW: 3.0, minW: 2.5, maxW: 3.5, modes: [], capacityPph: 0, source: TODO_SOURCE },
  planter: { id: 'planter', label: 'Trees/planting strip', defaultW: 1.5, minW: 1, maxW: 3, modes: [], capacityPph: 0, source: TODO_SOURCE },
  patio: { id: 'patio', label: 'Patio/public space', defaultW: 2.0, minW: 1.5, maxW: 4, modes: [], capacityPph: 0, source: TODO_SOURCE },
}

const BPR = 'U.S. Bureau of Public Roads, Traffic Assignment Manual (1964)'

/** Tunable model constants (spec 3.2-3.4). */
export const MODEL = {
  bprAlpha: { value: 0.15, source: BPR },
  bprBeta: { value: 4, source: BPR },
  /** v/c cap so a street with no car lanes stays finite. */
  maxVc: { value: 3, source: TODO_SOURCE },
  walkSpeedKph: { value: 4.8, source: TODO_SOURCE },
  bikeSpeedKph: { value: 15, source: TODO_SOURCE },
  busSpeedKph: { value: 18, source: TODO_SOURCE },
  /** Share of car congestion delay a bus still sees in its own lane. */
  busLaneCongestionFactor: { value: 0.1, source: TODO_SOURCE },
  /** Bus quality without a bus lane, as a fraction of car quality. */
  busMixedQuality: { value: 0.5, source: TODO_SOURCE },
  bikeQuality: { value: { none: 0.1, painted: 0.5, protected: 1 }, source: TODO_SOURCE } as Sourced<Record<BikeFacility, number>>,
  /** Total sidewalk width at which walking quality maxes out. */
  walkComfortWidthM: { value: 6, source: TODO_SOURCE },
  /** Extra bike/walk time at zero facility quality (0.2 = 20% slower). */
  slowFacilityPenalty: { value: 0.2, source: TODO_SOURCE },
  /** Logit sensitivity of mode share to quality change. */
  shiftSensitivity: { value: 2, source: TODO_SOURCE },
  maxShiftPerMode: { value: 0.15, source: TODO_SOURCE },
  maxTotalShift: { value: 0.25, source: TODO_SOURCE },

  // Spec 3.5-3.7
  emissionFactorKgPerPkm: { value: { car: 0.17, bus: 0.08, bike: 0, walk: 0 }, source: TODO_SOURCE } as Sourced<Record<Mode, number>>,
  bikeFacilityRisk: { value: { none: 1, painted: 0.7, protected: 0.4 }, source: TODO_SOURCE } as Sourced<Record<BikeFacility, number>>,
  /** Added risk per car lane (more lanes, higher speeds). */
  carLaneRisk: { value: 0.15, source: TODO_SOURCE },
  /** Painted bike lane next to parking with no buffer. */
  doorZoneRisk: { value: 1.3, source: TODO_SOURCE },
  /** Planter or parking between a sidewalk and traffic. */
  bufferRisk: { value: 0.85, source: TODO_SOURCE },
  /** Sidewalk + planter + patio width at which comfort maxes out. */
  comfortRefWidthM: { value: 8, source: TODO_SOURCE },
  /** Parking + 2 x loading width at which curb access maxes out. */
  curbRefWidthM: { value: 4.8, source: TODO_SOURCE },
  /** Happiness points lost per metre of unused width. */
  unusedPenaltyPerM: { value: 2, source: TODO_SOURCE },
} satisfies Record<string, Sourced<unknown>>
