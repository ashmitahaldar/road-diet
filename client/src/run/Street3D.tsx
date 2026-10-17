import { MODES, simulateTraffic, type ElementId, type Layout, type Level, type Mode } from '@road-diet/shared'
import { useEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  Clock,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { VISUALS } from '../editor/elementVisuals'

const LENGTH_M = 260
const CURB_M = 0.15
const MAX_OBJECTS = 80
/** Movement runs faster than real time so a walker visibly moves. */
const TIME_SCALE = 2.5
// Illustrative only: one moving bus stands for a busload; every other object for one person or vehicle.
const PEOPLE_PER_OBJECT: Record<Mode, number> = { car: 1, bus: 30, bike: 1, walk: 1 }
const SIZE: Record<Mode, [number, number, number]> = { car: [1.8, 1.4, 4.4], bus: [2.6, 3.2, 12], bike: [0.6, 1.6, 1.8], walk: [0.6, 1.7, 0.6] }
const TOKEN: Record<Mode, string> = { car: '--color-paper', bus: '--color-loading', bike: '--color-ink', walk: '--color-patio' }
const ROAD: ElementId[] = ['car_lane', 'bus_lane']

type Lane = { id: ElementId; widthM: number; x: number; top: number }

/** Moving objects per mode, in proportion to people per object; a mode with no lane to use gets none. */
function objectCounts(demand: Record<Mode, number>, usable: Record<Mode, boolean>) {
  const units = MODES.map((m) => (usable[m] ? demand[m] / PEOPLE_PER_OBJECT[m] : 0))
  const total = units.reduce((a, b) => a + b, 0) || 1
  return Object.fromEntries(MODES.map((m, i) => [m, units[i] > 0 ? Math.max(1, Math.round((MAX_OBJECTS * units[i]) / total)) : 0])) as Record<Mode, number>
}

/** Buses use the bus lane, else car lanes; bikes use bike lanes, else the curbside car lanes. */
function lanesFor(mode: Mode, lanes: Lane[]): Lane[] {
  const of = (...ids: ElementId[]) => lanes.filter((l) => ids.includes(l.id))
  const cars = of('car_lane')
  const pick = {
    car: cars,
    bus: of('bus_lane').length ? of('bus_lane') : cars,
    bike: of('bike_protected', 'bike_painted').length ? of('bike_protected', 'bike_painted') : [...new Set([cars[0], cars[cars.length - 1]])].filter(Boolean),
    walk: of('sidewalk'),
  }
  return pick[mode]
}

export default function Street3D({ level, layout }: { level: Level; layout: Layout }) {
  const host = useRef<HTMLDivElement>(null)
  const { lanes, counts, speeds } = useMemo(() => {
    let x = -level.corridor.widthM / 2
    const lanes: Lane[] = layout.elements.map((e) => {
      const lane = { ...e, x: x + e.widthM / 2, top: VISUALS[e.id].raised ? CURB_M : 0 }
      x += e.widthM
      return lane
    })
    const traffic = simulateTraffic(layout, level.corridor)
    const usable = Object.fromEntries(MODES.map((m) => [m, lanesFor(m, lanes).length > 0])) as Record<Mode, boolean>
    const speeds = Object.fromEntries(MODES.map((m) => [m, Number.isFinite(traffic.minPerKm[m]) ? 1000 / 60 / traffic.minPerKm[m] : 0])) as Record<Mode, number>
    return { lanes, counts: objectCounts(traffic.demand, usable), speeds }
  }, [layout, level])

  useEffect(() => {
    const el = host.current!
    const css = getComputedStyle(document.documentElement)
    const color = (token: string) => new Color(css.getPropertyValue(token).trim())
    const renderer = new WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.domElement.setAttribute('aria-hidden', 'true')
    el.appendChild(renderer.domElement)

    const scene = new Scene()
    scene.background = color('--color-paper')
    scene.fog = new Fog(scene.background, 90, 200)
    scene.add(new HemisphereLight(0xffffff, color('--color-grid'), 2.2))
    const sun = new DirectionalLight(0xffffff, 1.6)
    sun.position.set(20, 40, 10)
    scene.add(sun)
    const mat = (c: Color | string) => new MeshStandardMaterial({ color: c instanceof Color ? c : color(c), roughness: 0.9 })
    const add = (geometry: BufferGeometry, material: Material, x: number, y: number, z = 0) => {
      const m = new Mesh(geometry, material)
      m.position.set(x, y, z)
      scene.add(m)
    }

    const ground = new Mesh(new PlaneGeometry(400, 400), mat('--color-grid'))
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.21
    scene.add(ground)
    for (const lane of lanes) add(new BoxGeometry(lane.widthM, lane.top + 0.2, LENGTH_M), mat(VISUALS[lane.id].color.slice(4, -1)), lane.x, (lane.top - 0.2) / 2)

    // Buildings either side, so the street reads as a street. Heights vary on a fixed pattern.
    const half = level.corridor.widthM / 2
    for (let z = -LENGTH_M / 2 + 6; z < LENGTH_M / 2; z += 13)
      for (const side of [-1, 1]) {
        const h = 4 + (Math.abs(z * 7 + side * 11) % 5) * 2
        add(new BoxGeometry(10, h, 11), mat(side * z > 0 ? '--color-sidewalk' : '--color-grid'), side * (half + 5.5), h / 2 - 0.2, z)
      }

    const dummy = new Object3D()
    const instanced = (geometry: BufferGeometry, material: Material, at: [number, number, number][]) => {
      const mesh = new InstancedMesh(geometry, material, at.length)
      at.forEach(([x, y, z], i) => {
        dummy.position.set(x, y, z)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })
      scene.add(mesh)
      return mesh
    }
    const dashes: [number, number, number][] = []
    lanes.forEach((lane, i) => {
      const next = lanes[i + 1]
      if (next && ROAD.includes(lane.id) && ROAD.includes(next.id))
        for (let z = -LENGTH_M / 2; z < LENGTH_M / 2; z += 9) dashes.push([lane.x + lane.widthM / 2, 0.01, z])
    })
    instanced(new BoxGeometry(0.15, 0.02, 3), mat('--color-paper'), dashes)
    const trees = lanes.filter((l) => l.id === 'planter').flatMap((l) => Array.from({ length: LENGTH_M / 8 }, (_, k): [number, number, number] => [l.x, CURB_M, k * 8 - LENGTH_M / 2 + 4]))
    instanced(new CylinderGeometry(0.15, 0.2, 2.4), mat('--color-ink'), trees.map(([x, y, z]) => [x, y + 1.2, z]))
    instanced(new SphereGeometry(1.4, 12, 8), mat('--color-planter'), trees.map(([x, y, z]) => [x, y + 3, z]))

    // Objects in one lane share a speed and start evenly spaced, so they never overlap.
    const movers = MODES.flatMap((mode) => {
      const use = lanesFor(mode, lanes)
      const [w, h, l] = SIZE[mode]
      const mesh = new InstancedMesh(new BoxGeometry(w, h, l), mat(TOKEN[mode]), Math.max(1, counts[mode]))
      mesh.count = counts[mode]
      scene.add(mesh)
      return Array.from({ length: counts[mode] }, (_, i) => {
        const lane = use[i % use.length]
        const nth = Math.floor(i / use.length)
        const inLane = Math.ceil((counts[mode] - (i % use.length)) / use.length)
        const shared = !ROAD.includes(lane.id) || mode === 'bike'
        const dir = shared ? (nth % 2 ? 1 : -1) : lane.x < 0 ? -1 : 1
        const x = lane.x + (shared ? (dir * lane.widthM) / 4 : 0)
        return { mesh, i, x, y: lane.top + h / 2, z: (nth / inLane) * LENGTH_M - LENGTH_M / 2, v: dir * speeds[mode] * TIME_SCALE }
      })
    })

    const camera = new PerspectiveCamera(45, 1, 0.5, 400)
    const s = Math.max(1, level.corridor.widthM / 20)
    camera.position.set(20 * s, 34 * s, 42 * s)
    const controls = new OrbitControls(camera, renderer.domElement)
    // Vertical swipes still scroll the page on phones; horizontal drags orbit.
    renderer.domElement.style.touchAction = 'pan-y'
    Object.assign(controls, { enablePan: false, enableDamping: true, autoRotate: true, autoRotateSpeed: 0.6, minDistance: 15, maxDistance: 110, minPolarAngle: 0.3, maxPolarAngle: 1.35 })

    const resize = () => {
      const { width, height } = el.getBoundingClientRect()
      renderer.setSize(width, height)
      camera.aspect = width / Math.max(1, height)
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    resize()

    const clock = new Clock()
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.1)
      for (const m of movers) {
        m.z = ((((m.z + m.v * dt + LENGTH_M / 2) % LENGTH_M) + LENGTH_M) % LENGTH_M) - LENGTH_M / 2
        dummy.position.set(m.x, m.y, m.z)
        dummy.updateMatrix()
        m.mesh.setMatrixAt(m.i, dummy.matrix)
        m.mesh.instanceMatrix.needsUpdate = true
      }
      controls.update()
      renderer.render(scene, camera)
    })

    return () => {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        if (o instanceof Mesh) {
          o.geometry.dispose()
          ;(o.material as Material).dispose()
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [lanes, counts, speeds, level])

  const label = `${counts.car} cars, ${counts.bus} buses, ${counts.bike} bikes and ${counts.walk} people walking, roughly in proportion to who uses the street.`
  return (
    <div
      ref={host}
      role="img"
      aria-label={`3D view of your street: ${label}`}
      data-objects={MODES.map((m) => `${m}:${counts[m]}`).join(' ')}
      className="h-[min(60dvh,34rem)] min-h-72 overflow-hidden rounded-2xl border-2 border-ink bg-paper"
    />
  )
}
