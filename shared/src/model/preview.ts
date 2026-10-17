import { MODES, simulateTraffic } from './traffic'
import type { Corridor, ElementId, Layout, Mode } from './types'

// Illustrative only: one moving bus stands for a busload; every other object for one person or vehicle.
const PEOPLE_PER_OBJECT: Record<Mode, number> = { car: 1, bus: 30, bike: 1, walk: 1 }

/** Per mode: how many moving objects to draw, which elements (by index) they use, and their speed in m/s. */
export type Preview = Record<Mode, { count: number; lanes: number[]; speedMps: number }>

/** Buses use the bus lane, else car lanes; bikes use bike lanes, else the curbside car lanes. */
function lanesFor(mode: Mode, layout: Layout): number[] {
  const of = (...ids: ElementId[]) => layout.elements.flatMap((e, i) => (ids.includes(e.id) ? [i] : []))
  const cars = of('car_lane')
  const bikes = of('bike_protected', 'bike_painted')
  const pick: Record<Mode, number[]> = {
    car: cars,
    bus: of('bus_lane').length ? of('bus_lane') : cars,
    bike: bikes.length ? bikes : [...new Set([cars[0], cars[cars.length - 1]])].filter((i) => i !== undefined),
    walk: of('sidewalk'),
  }
  return pick[mode]
}

/**
 * The traffic preview behind the editor strip and the 3D street: objects per mode in proportion to people per
 * object (at least one for any mode with demand and a lane to use), at the model's speeds. Never feeds the score.
 */
export function previewTraffic(layout: Layout, corridor: Corridor, max = 80): Preview {
  const traffic = simulateTraffic(layout, corridor)
  const lanes = Object.fromEntries(MODES.map((m) => [m, lanesFor(m, layout)])) as Record<Mode, number[]>
  const units = MODES.map((m) => (lanes[m].length ? traffic.demand[m] / PEOPLE_PER_OBJECT[m] : 0))
  const total = units.reduce((a, b) => a + b, 0) || 1
  return Object.fromEntries(
    MODES.map((m, i) => [
      m,
      {
        count: units[i] > 0 ? Math.max(1, Math.round((max * units[i]) / total)) : 0,
        lanes: lanes[m],
        speedMps: Number.isFinite(traffic.minPerKm[m]) ? 1000 / 60 / traffic.minPerKm[m] : 0,
      },
    ]),
  ) as Preview
}
