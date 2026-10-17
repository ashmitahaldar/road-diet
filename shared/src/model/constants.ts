import type { ElementDef, ElementId } from './types'

/** Marks a number with no verified source yet; listed in the in-app limitations. */
export const TODO_SOURCE = 'TODO-SOURCE'

// Widths from spec 2.2 (placeholders).
export const ELEMENTS: Record<ElementId, ElementDef> = {
  sidewalk: { id: 'sidewalk', label: 'Sidewalk', defaultW: 2.5, minW: 1.5, maxW: 6, modes: ['walk'], source: TODO_SOURCE },
  bike_painted: { id: 'bike_painted', label: 'Painted bike lane', defaultW: 1.5, minW: 1.2, maxW: 2, modes: ['bike'], source: TODO_SOURCE },
  bike_protected: { id: 'bike_protected', label: 'Protected bike lane', defaultW: 2.0, minW: 1.8, maxW: 3, modes: ['bike'], source: TODO_SOURCE },
  bus_lane: { id: 'bus_lane', label: 'Bus lane', defaultW: 3.3, minW: 3, maxW: 3.7, modes: ['bus'], source: TODO_SOURCE },
  car_lane: { id: 'car_lane', label: 'Car lane', defaultW: 3.3, minW: 3, maxW: 3.7, modes: ['car'], source: TODO_SOURCE },
  parking: { id: 'parking', label: 'On-street parking', defaultW: 2.4, minW: 2, maxW: 2.7, modes: [], source: TODO_SOURCE },
  loading: { id: 'loading', label: 'Loading zone', defaultW: 3.0, minW: 2.5, maxW: 3.5, modes: [], source: TODO_SOURCE },
  planter: { id: 'planter', label: 'Trees/planting strip', defaultW: 1.5, minW: 1, maxW: 3, modes: [], source: TODO_SOURCE },
  patio: { id: 'patio', label: 'Patio/public space', defaultW: 2.0, minW: 1.5, maxW: 4, modes: [], source: TODO_SOURCE },
}
