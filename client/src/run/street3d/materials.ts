import {
  BackSide,
  Color,
  DataTexture,
  InstancedMesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  Vector3,
  type BufferGeometry,
  type Material,
  type Matrix4,
  type Object3D,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Flat toon shading with ink outlines, coloured only from the spec 8b tokens, to match the hand-drawn 2D style.

const css = () => getComputedStyle(document.documentElement)
export const tokenColor = (token: string) => new Color(css().getPropertyValue(token).trim())

let gradient: DataTexture | undefined
/** Three flat light bands instead of smooth shading. */
function bands() {
  if (!gradient) {
    gradient = new DataTexture(new Uint8Array([110, 190, 255]), 3, 1, RedFormat)
    gradient.minFilter = gradient.magFilter = NearestFilter
    gradient.needsUpdate = true
  }
  return gradient
}

/** A toon material in a token colour, or white for parts tinted per instance. */
export function toon(token: string | null) {
  return new MeshToonMaterial({ color: token ? tokenColor(token) : new Color(0xffffff), gradientMap: bands() })
}

export const inkMaterial = () => new MeshBasicMaterial({ color: tokenColor('--color-ink'), side: BackSide })

/** Inverted hull: the same shape grown by `t` metres on every side, drawn back faces only, reads as an ink outline. */
function hull(g: BufferGeometry, t: number) {
  const h = g.clone()
  h.computeBoundingBox()
  const size = h.boundingBox!.getSize(new Vector3())
  const c = h.boundingBox!.getCenter(new Vector3())
  const grow = (s: number) => (s > 0 ? (s + 2 * t) / s : 1)
  return h.translate(-c.x, -c.y, -c.z).scale(grow(size.x), grow(size.y), grow(size.z)).translate(c.x, c.y, c.z)
}

/** One colour of a model: its primitives merged, plus their outline. `color: null` means tinted per instance. */
export type Part = { geometry: BufferGeometry; outline: BufferGeometry | null; color: string | null }

export function part(color: string | null, primitives: BufferGeometry[], outline = 0.05): Part {
  const strip = (g: BufferGeometry) => (g.index ? g.toNonIndexed() : g)
  const geometry = mergeGeometries(primitives.map(strip))
  return { geometry, outline: outline > 0 ? mergeGeometries(primitives.map((g) => strip(hull(g, outline)))) : null, color }
}

/** Instanced copies of a model (every part plus its outline); returns the meshes so movers can update them. */
export function instances(parent: Object3D, model: Part[], matrices: Matrix4[], colors?: Color[]): InstancedMesh[] {
  const meshes: InstancedMesh[] = []
  const capacity = Math.max(1, matrices.length)
  for (const p of model) {
    const layers: [BufferGeometry, Material, boolean][] = [[p.geometry, toon(p.color), true]]
    if (p.outline) layers.push([p.outline, inkMaterial(), false])
    for (const [geometry, material, tinted] of layers) {
      const mesh = new InstancedMesh(geometry, material, capacity)
      mesh.count = matrices.length
      matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
      if (tinted && p.color === null && colors) colors.forEach((c, i) => mesh.setColorAt(i, c))
      mesh.frustumCulled = false
      parent.add(mesh)
      meshes.push(mesh)
    }
  }
  return meshes
}
