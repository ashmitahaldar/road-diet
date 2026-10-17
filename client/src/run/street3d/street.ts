import type { ElementId } from '@road-diet/shared'
import { BoxGeometry, Euler, Group, Matrix4, Quaternion, Vector3, type Color } from 'three'
import { VISUALS } from '../../editor/elementVisuals'
import { instances, part, tokenColor } from './materials'
import * as props from './props'

export const LENGTH_M = 260
export const CURB_M = 0.15
export const ROAD: ElementId[] = ['car_lane', 'bus_lane']
export type Lane = { id: ElementId; widthM: number; x: number; top: number }

export const CAR_TINTS = ['--color-paper', '--color-primary', '--color-patio', '--color-meter-safety', '--color-bus', '--color-meter-emissions']
export const PEOPLE_TINTS = ['--color-patio', '--color-primary', '--color-meter-fairness', '--color-bike-protected', '--color-loading', '--color-meter-safety']
const BUILDING_TINTS = ['--color-grid', '--color-paper', '--color-grid', '--color-patio', '--color-loading']
const AWNING_TINTS = ['--color-primary', '--color-bus', '--color-bike-protected', '--color-patio', '--color-meter-safety', '--color-meter-fairness']
const TREE_TINTS = ['--color-planter', '--color-bike-protected', '--color-planter']

/** Deterministic pseudo-random numbers, so the same street always looks the same. */
export function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}
export const pick = <T>(rand: () => number, xs: T[]) => xs[Math.floor(rand() * xs.length)]
export const tints = (n: number, rand: () => number, tokens: string[]): Color[] => Array.from({ length: n }, () => tokenColor(pick(rand, tokens)))

export const place = (x: number, y: number, z: number, rot: [number, number, number] = [0, 0, 0], s: [number, number, number] = [1, 1, 1]) =>
  new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(...rot)), new Vector3(...s))

const along = (step: number, from = -LENGTH_M / 2 + step / 2) => Array.from({ length: Math.floor((LENGTH_M / 2 - from) / step) + 1 }, (_, k) => from + k * step).filter((z) => z < LENGTH_M / 2)
const CROSSWALKS = [-45, 45]

/** Everything that stands still: lanes, curbs, markings, street furniture and the buildings either side. */
export function buildStreet(lanes: Lane[], widthM: number): Group {
  const g = new Group()
  const add = (model: ReturnType<typeof props.block>, at: Matrix4[], colors?: Color[]) => at.length && instances(g, model, at, colors)
  const paint = (at: Matrix4[]) => add(props.block('--color-paper', 0), at)
  const crossing = (z: number) => CROSSWALKS.some((c) => Math.abs(z - c) < 3)

  for (const lane of lanes) {
    const token = VISUALS[lane.id].color.slice(4, -1)
    add([part(token, [props.at(new BoxGeometry(lane.widthM, lane.top + 0.2, LENGTH_M), 0, (lane.top - 0.2) / 2, 0)], 0)], [place(lane.x, 0, 0)])
  }

  lanes.forEach((lane, i) => {
    // Seeded by the element's kind and how many of that kind come before it, so its trees and parked cars stay put
    // when other elements are added, moved or resized.
    const nth = lanes.slice(0, i).filter((l) => l.id === lane.id).length
    const rand = rng([...lane.id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7) + nth * 101)
    const next = lanes[i + 1]
    const left = lane.x - lane.widthM / 2
    const right = lane.x + lane.widthM / 2
    const road = ROAD.includes(lane.id)
    // Lane edges: a dashed line between two car lanes, solid paint between other road lanes, an ink line elsewhere.
    if (next && road && ROAD.includes(next.id)) {
      const dashed = lane.id === 'car_lane' && next.id === 'car_lane'
      paint(along(dashed ? 9 : LENGTH_M).filter((z) => !crossing(z)).map((z) => place(right, 0, z, undefined, [0.15, 0.02, dashed ? 3 : LENGTH_M])))
    } else if (next) {
      add(props.block('--color-ink', 0), [place(right, Math.max(lane.top, next.top), 0, undefined, [0.08, 0.02, LENGTH_M])])
    }
    // Curb face where a raised element meets road level.
    for (const [side, edge] of [[lanes[i - 1], left], [next, right]] as const)
      if (lane.top > 0 && side && side.top === 0) add(props.block('--color-grid', 0.02), [place(edge + (edge === left ? 0.1 : -0.1), 0, 0, undefined, [0.2, lane.top + 0.02, LENGTH_M])])

    const toRoad = (n: Lane | undefined) => !!n && ROAD.includes(n.id)
    if (lane.id === 'bike_painted')
      paint(along(6).flatMap((z) => [place(left + 0.2, 0, z, undefined, [0.12, 0.02, 3]), place(right - 0.2, 0, z, undefined, [0.12, 0.02, 3])]))
    if (lane.id === 'bike_painted' || lane.id === 'bike_protected')
      paint(along(30).map((z) => place(lane.x, 0, z, [0, Math.PI / 4, 0], [0.7, 0.02, 0.7])))
    if (lane.id === 'bike_protected') {
      const edge = toRoad(next) ? right - 0.2 : toRoad(lanes[i - 1]) ? left + 0.2 : null
      if (edge !== null) add(props.bollard(), along(4).filter((z) => !crossing(z)).map((z) => place(edge, 0, z)))
    }
    if (lane.id === 'parking') {
      paint(along(6.5).map((z) => place(lane.x, 0, z - 3.25, undefined, [lane.widthM * 0.9, 0.02, 0.12])))
      const parked = along(6.5).filter((z) => !crossing(z) && rand() < 0.7)
      add(props.car(), parked.map((z) => place(lane.x, 0, z, [0, rand() < 0.5 ? 0 : Math.PI, 0])), tints(parked.length, rand, CAR_TINTS))
    }
    if (lane.id === 'loading') paint(along(4).map((z) => place(lane.x, 0, z, [0, Math.PI / 4, 0], [lane.widthM * 0.6, 0.02, 0.15])))
    if (lane.id === 'planter') {
      const zs = along(7)
      add(props.tree(), zs.map((z) => { const s = 0.8 + rand() * 0.45; return place(lane.x + (rand() - 0.5) * 0.3, lane.top, z + (rand() - 0.5) * 2, [0, rand() * 6, 0], [s, s, s]) }), tints(zs.length, rand, TREE_TINTS))
    }
    if (lane.id === 'patio') {
      const zs = along(4)
      add(props.patio(), zs.map((z) => place(lane.x, lane.top, z)), tints(zs.length, rand, AWNING_TINTS))
    }
    if (lane.id === 'sidewalk') {
      // Lamps on the street side of the sidewalk, arms reaching over the street.
      const inward = lane.x < 0 ? 1 : -1
      add(props.lamp(), along(26).map((z) => place(lane.x + inward * (lane.widthM / 2 - 0.4), lane.top, z, [0, (inward * Math.PI) / 2, 0])))
    }
  })

  // Zebra crosswalks across the road-level part of the street.
  const flat = lanes.filter((l) => l.top === 0)
  paint(CROSSWALKS.flatMap((z) => flat.flatMap((l) => Array.from({ length: Math.floor(l.widthM / 1) }, (_, k) => place(l.x - l.widthM / 2 + 0.5 + k, 0, z, undefined, [0.5, 0.02, 3.2])))))

  // Low-rise main-street fronts: shop windows, awnings, upper windows and a cornice. Generic, no names or logos.
  const half = widthM / 2
  const rand = rng(widthM * 1000)
  const bodies: Matrix4[] = []
  const shopfronts: Matrix4[] = []
  const awnings: Matrix4[] = []
  const windows: Matrix4[] = []
  const cornices: Matrix4[] = []
  const roofs: Matrix4[] = []
  for (const s of [-1, 1]) {
    for (let z = -LENGTH_M / 2; z < LENGTH_M / 2; ) {
      const w = 8 + Math.floor(rand() * 4) * 2
      const floors = 2 + Math.floor(rand() * 3)
      const h = floors * 3.2 + 0.6
      const zc = z + w / 2
      const front = s * half
      bodies.push(place(s * (half + 5), 0, zc, undefined, [10, h, w - 0.3]))
      shopfronts.push(place(front + s * 0.02, 0.5, zc, undefined, [0.12, 2.3, w - 1.6]))
      awnings.push(place(front - s * 0.6, 3.05, zc, [0, 0, s * -0.35], [1.4, 0.14, w - 1.2]))
      cornices.push(place(front - s * 0.1, h - 0.1, zc, undefined, [0.7, 0.45, w - 0.1]))
      roofs.push(place(s * (half + 5.3), h, zc, undefined, [9.2, 0.12, w - 0.9]))
      for (let f = 1; f < floors; f++)
        for (let k = 0; k < Math.floor((w - 1) / 2.6); k++)
          windows.push(place(front + s * 0.02, f * 3.2 + 1, zc - (w - 1) / 2 + 1.3 + k * 2.6, undefined, [0.1, 1.4, 1.1]))
      z += w
    }
  }
  add(props.block(), bodies, tints(bodies.length, rand, BUILDING_TINTS))
  add(props.block('--color-ink', 0), shopfronts)
  add(props.block(null, 0.02), awnings, tints(awnings.length, rand, AWNING_TINTS))
  add(props.block('--color-paper', 0.02), windows)
  add(props.block('--color-paper', 0.02), cornices)
  add(props.block('--color-sidewalk', 0), roofs)
  return g
}
