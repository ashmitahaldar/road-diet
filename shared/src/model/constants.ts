import type { BikeFacility, ElementDef, ElementId, Mode, Sourced } from './types'

/** Marks a number with no verified source yet; listed in the in-app limitations. */
export const TODO_SOURCE = 'TODO-SOURCE'
/** Marks a game-balance parameter: chosen for play, not measured, so no source will exist. Listed separately. */
export const DESIGN_CHOICE = 'DESIGN-CHOICE'

const LANE_WIDTHS =
  'City of Toronto Lane Widths Guideline v3.0 (2025), Table 15: https://www.toronto.ca/wp-content/uploads/2025/11/96f7-Lane-Widths-Guideline-Version-3.0.pdf'
const NACTO =
  'NACTO Transit Street Design Guide, "Designing to Move People" (as excerpted at https://archive.strongtowns.org/journal/2016/5/23/excerpt-from-nacto-transit-street-design-guide)'
const DESNZ =
  'UK DESNZ Greenhouse gas reporting: conversion factors 2024, condensed set, "Business travel- land": https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024'

// Widths from spec 2.2 unless a row cites a source. Maximum widths are game bounds.
export const ELEMENTS: Record<ElementId, ElementDef> = {
  sidewalk: { id: 'sidewalk', label: 'Sidewalk', defaultW: 2.5, minW: 1.5, maxW: 6, modes: ['walk'], capacityPph: 3000, source: TODO_SOURCE },
  bike_painted: { id: 'bike_painted', label: 'Painted bike lane', defaultW: 1.5, minW: 1.2, maxW: 2, modes: ['bike'], capacityPph: 1500, source: TODO_SOURCE },
  bike_protected: { id: 'bike_protected', label: 'Protected bike lane', defaultW: 2.0, minW: 1.8, maxW: 3, modes: ['bike'], capacityPph: 3000, source: TODO_SOURCE },
  bus_lane: {
    id: 'bus_lane',
    label: 'Bus lane',
    defaultW: 3.5,
    minW: 3.3,
    maxW: 3.7,
    modes: ['bus'],
    capacityPph: 8000,
    source: `Widths: priority bus lane min 3.3 m, target 3.5 m, ${LANE_WIDTHS}. Capacity: "up to 8,000 passengers per hour", ${NACTO}. Max width is a game bound.`,
  },
  car_lane: {
    id: 'car_lane',
    label: 'Car lane',
    defaultW: 3.3,
    minW: 3,
    maxW: 3.7,
    modes: ['car'],
    capacityPph: 600,
    source: `Widths: through lane min 3.0 m, curb lane target 3.3 m, ${LANE_WIDTHS}. Capacity: low end of "600 to 1,600 people per hour" (600-800 vehicles/h, 1-2 per vehicle), matching 1 person per vehicle, ${NACTO}. Max width is a game bound.`,
  },
  parking: {
    id: 'parking',
    label: 'On-street parking',
    defaultW: 2.4,
    minW: 2,
    maxW: 2.7,
    modes: [],
    capacityPph: 0,
    source: `Widths: dedicated parking lane min 2.0 m, target 2.4 m, ${LANE_WIDTHS}. Max width is a game bound.`,
  },
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
  maxVc: { value: 3, source: DESIGN_CHOICE },
  walkSpeedKph: { value: 4.8, source: TODO_SOURCE },
  bikeSpeedKph: { value: 15, source: TODO_SOURCE },
  busSpeedKph: { value: 18, source: TODO_SOURCE },
  /** Share of car congestion delay a bus still sees in its own lane. */
  busLaneCongestionFactor: { value: 0.1, source: DESIGN_CHOICE },
  /** Bus quality without a bus lane, as a fraction of car quality. */
  busMixedQuality: { value: 0.5, source: DESIGN_CHOICE },
  bikeQuality: { value: { none: 0.1, painted: 0.5, protected: 1 }, source: DESIGN_CHOICE } as Sourced<Record<BikeFacility, number>>,
  /** Total sidewalk width at which walking quality maxes out. */
  walkComfortWidthM: { value: 6, source: DESIGN_CHOICE },
  /** Extra bike/walk time at zero facility quality (0.2 = 20% slower). */
  slowFacilityPenalty: { value: 0.2, source: DESIGN_CHOICE },
  /** Logit sensitivity of mode share to quality change. */
  shiftSensitivity: { value: 2, source: DESIGN_CHOICE },
  maxShiftPerMode: { value: 0.15, source: DESIGN_CHOICE },
  maxTotalShift: { value: 0.25, source: DESIGN_CHOICE },

  // Spec 3.5-3.7
  /** Car: per vehicle-km divided by occupancy (1.0 until sourced; see the corridor's estimates). UK fleet averages. */
  emissionFactorKgPerPkm: {
    value: { car: 0.16691, bus: 0.10846, bike: 0, walk: 0 },
    source: `Car: "Average car", unknown fuel, 0.16691 kg CO2e/km; bus: "Average local bus", 0.10846 kg CO2e/passenger.km. ${DESNZ}. UK fleet averages; Toronto's may differ.`,
  } as Sourced<Record<Mode, number>>,
  bikeFacilityRisk: { value: { none: 1, painted: 0.7, protected: 0.4 }, source: TODO_SOURCE } as Sourced<Record<BikeFacility, number>>,
  /** Added risk per car lane (more lanes, higher speeds). */
  carLaneRisk: { value: 0.15, source: TODO_SOURCE },
  /** Painted bike lane next to parking with no buffer. */
  doorZoneRisk: { value: 1.3, source: TODO_SOURCE },
  /** Planter or parking between a sidewalk and traffic. */
  bufferRisk: { value: 0.85, source: TODO_SOURCE },
  /** Sidewalk + planter + patio width at which comfort maxes out. */
  comfortRefWidthM: { value: 8, source: DESIGN_CHOICE },
  /** Parking + 2 x loading width at which curb access maxes out. */
  curbRefWidthM: { value: 4.8, source: DESIGN_CHOICE },
  /** Happiness points lost per metre of unused width. */
  unusedPenaltyPerM: { value: 2, source: DESIGN_CHOICE },
} satisfies Record<string, Sourced<unknown>>
