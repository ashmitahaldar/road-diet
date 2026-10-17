import { BoxGeometry, CapsuleGeometry, ConeGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, type BufferGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { part, type Part } from './materials'

// Procedural, generic models (no assets, no brands). Metres; origin on the ground; the front faces +z.
// Every mode gets the same level of detail (spec 2.7).

export const at = (g: BufferGeometry, x: number, y: number, z: number, rot: [number, number, number] = [0, 0, 0]) =>
  g.rotateX(rot[0]).rotateY(rot[1]).rotateZ(rot[2]).translate(x, y, z)

const wheels = (xs: number[], zs: number[], r: number, w: number) =>
  xs.flatMap((x) => zs.map((z) => at(new CylinderGeometry(r, r, w, 8), x, r, z, [0, 0, Math.PI / 2])))

/** Body tinted per instance, so the street has a mix of car colours. */
export function car(): Part[] {
  return [
    part(null, [at(new RoundedBoxGeometry(1.8, 0.75, 4.2, 1, 0.25), 0, 0.68, 0)]),
    part('--color-sidewalk', [at(new RoundedBoxGeometry(1.5, 0.6, 2.1, 1, 0.2), 0, 1.3, -0.25)]),
    part('--color-ink', wheels([-0.82, 0.82], [-1.35, 1.35], 0.36, 0.3), 0),
  ]
}

/** Generic bus: one body colour, a window band, no livery. */
export function bus(): Part[] {
  return [
    part('--color-loading', [at(new RoundedBoxGeometry(2.5, 2.6, 11.5, 1, 0.35), 0, 1.65, 0)]),
    part('--color-sidewalk', [at(new BoxGeometry(2.56, 0.85, 10.2), 0, 2.2, -0.3), at(new BoxGeometry(2.2, 1.1, 0.1), 0, 2.05, 5.76)], 0),
    part('--color-ink', wheels([-1.1, 1.1], [-3.8, 3.6], 0.5, 0.35), 0),
  ]
}

/** Rider tinted per instance, on a bike with round wheels. */
export function bike(): Part[] {
  return [
    part('--color-ink', [
      at(new TorusGeometry(0.34, 0.05, 4, 12), 0, 0.36, 0.55, [0, Math.PI / 2, 0]),
      at(new TorusGeometry(0.34, 0.05, 4, 12), 0, 0.36, -0.55, [0, Math.PI / 2, 0]),
      at(new BoxGeometry(0.06, 0.06, 1.1), 0, 0.6, 0),
      at(new BoxGeometry(0.06, 0.5, 0.06), 0, 0.6, -0.15, [0.35, 0, 0]),
    ], 0),
    part(null, [at(new CapsuleGeometry(0.21, 0.5, 2, 8), 0, 1.25, -0.05, [0.35, 0, 0])]),
    part('--color-paper', [at(new SphereGeometry(0.17, 8, 6), 0, 1.72, 0.12)]),
  ]
}

/** Walker: clothes tinted per instance, a simple head; bobbing is done per frame. */
export function walker(): Part[] {
  return [
    part(null, [at(new CapsuleGeometry(0.24, 0.65, 2, 8), 0, 0.85, 0)]),
    part('--color-paper', [at(new SphereGeometry(0.19, 8, 6), 0, 1.6, 0)]),
  ]
}

export function tree(): Part[] {
  return [
    part('--color-ink', [at(new CylinderGeometry(0.13, 0.18, 2.2, 8), 0, 1.1, 0)], 0),
    part(null, [at(new SphereGeometry(1.2, 9, 6), 0, 2.9, 0), at(new SphereGeometry(0.85, 9, 6), 0.45, 3.7, 0.2)]),
  ]
}

export function bollard(): Part[] {
  return [part('--color-paper', [at(new CylinderGeometry(0.08, 0.08, 0.8, 8), 0, 0.4, 0)], 0.03)]
}

export function lamp(): Part[] {
  return [
    part('--color-ink', [at(new CylinderGeometry(0.06, 0.08, 5, 8), 0, 2.5, 0), at(new BoxGeometry(0.06, 0.06, 1), 0, 5, 0.45)], 0),
    part('--color-loading', [at(new SphereGeometry(0.18, 10, 6), 0, 4.85, 0.9)], 0.03),
  ]
}

/** Patio table with an umbrella; the umbrella is tinted per instance. */
export function patio(): Part[] {
  return [
    part('--color-paper', [at(new CylinderGeometry(0.45, 0.45, 0.06, 14), 0, 0.75, 0), at(new CylinderGeometry(0.04, 0.04, 2.3, 6), 0, 1.15, 0)], 0.03),
    part(null, [at(new ConeGeometry(1.2, 0.5, 10), 0, 2.4, 0)]),
  ]
}

/** Unit box standing on the ground, scaled per instance (buildings, awnings, windows). Null colour = tinted per instance. */
export function block(color: string | null = null, outline = 0.012): Part[] {
  return [part(color, [at(new BoxGeometry(1, 1, 1), 0, 0.5, 0)], outline)]
}
