export type ElementId =
  | 'sidewalk'
  | 'bike_painted'
  | 'bike_protected'
  | 'bus_lane'
  | 'car_lane'
  | 'parking'
  | 'loading'
  | 'planter'
  | 'patio'

export type Layout = { elements: { id: ElementId; widthM: number }[] }

export type Mode = 'car' | 'bus' | 'bike' | 'walk'

/** Persons/hour on the corridor at peak. */
export type Demand = Record<Mode, number>

export type PersonaId =
  | 'driver_delivery'
  | 'student_cyclist'
  | 'senior_walker'
  | 'parent_stroller'
  | 'shop_owner'

export type Metrics = {
  emissionsKgPerHour: number
  /** vs baseline layout */
  emissionsReductionPct: number
  /** 0-100 */
  safetyScore: number
  travelTimeMin: Record<PersonaId, number>
  /** 0-100 */
  happiness: Record<PersonaId, number>
  /** min happiness */
  fairness: number
  unusedWidthM: number
}

export type ElementDef = {
  id: ElementId
  label: string
  defaultW: number
  minW: number
  maxW: number
  modes: Mode[]
  /** Persons/hour at defaultW for the modes it serves. */
  capacityPph: number
  source: string
}

/** A model constant and where its value comes from (or TODO-SOURCE). */
export type Sourced<T> = { value: T; source: string }

export type BikeFacility = 'none' | 'painted' | 'protected'

export type Persona = {
  id: PersonaId
  name: string
  blurb: string
  trip: { mode: Mode; distanceKm: number }
  /** Relative weights over normalized 0-1 metrics (spec 3.7). */
  weights: { travelTime: number; safety: number; comfort: number; access: number }
  baselineHappiness: number
}

export type DataSource = { label: string; url: string; retrieved: string; note: string }

/** Matches the corridor JSON schema (spec 4.4). */
export type Corridor = {
  id: string
  name: string
  widthM: number
  lengthKm: number
  baselineLayout: Layout
  baselineDemand: Demand
  baselineSafety: { ksiCollisions5y: number; pedestrianInvolved: number; cyclistInvolved: number }
  freeFlowSpeedKph: number
  sources: DataSource[]
  mapSvg?: string
  source: string
}

export type Level = {
  id: string
  name: string
  corridor: Corridor
  allowedElements: ElementId[]
  goal: { minEmissionsReductionPct?: number; minHappiness?: number; minSafety?: number }
  /** 2 stars: goal + safetyScore >= safety; 3 stars: also fairness >= fairness (spec 2.6). */
  stars: { safety: number; fairness: number }
}
