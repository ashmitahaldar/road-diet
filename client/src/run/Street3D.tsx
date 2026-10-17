import { MODES, previewTraffic, type Layout, type Level, type Mode } from '@road-diet/shared'
import { useEffect, useMemo, useRef } from 'react'
import { Clock, DirectionalLight, Fog, HemisphereLight, Mesh, Object3D, PerspectiveCamera, PlaneGeometry, Scene, WebGLRenderer, type InstancedMesh, type Material } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { VISUALS } from '../editor/elementVisuals'
import { instances, toon, tokenColor, type Part } from './street3d/materials'
import * as props from './street3d/props'
import { CAR_TINTS, CURB_M, LENGTH_M, PEOPLE_TINTS, ROAD, buildStreet, place, rng, tints, type Lane } from './street3d/street'

/** Movement runs faster than real time so a walker visibly moves. */
const TIME_SCALE = 2.5
const MODELS: Record<Mode, () => Part[]> = { car: props.car, bus: props.bus, bike: props.bike, walk: props.walker }
const TINTS: Record<Mode, string[] | undefined> = { car: CAR_TINTS, bus: undefined, bike: PEOPLE_TINTS, walk: PEOPLE_TINTS }
/** Per-frame bob: walkers step, cyclists pedal; vehicles ride level. [height m, rate rad/s] */
const BOB: Record<Mode, [number, number]> = { car: [0, 0], bus: [0, 0], bike: [0.04, 9], walk: [0.07, 7] }

export default function Street3D({ level, layout }: { level: Level; layout: Layout }) {
  const host = useRef<HTMLDivElement>(null)
  const { lanes, preview } = useMemo(() => {
    let x = -level.corridor.widthM / 2
    const lanes: Lane[] = layout.elements.map((e) => {
      const lane = { ...e, x: x + e.widthM / 2, top: VISUALS[e.id].raised ? CURB_M : 0 }
      x += e.widthM
      return lane
    })
    return { lanes, preview: previewTraffic(layout, level.corridor) }
  }, [layout, level])
  const counts = Object.fromEntries(MODES.map((m) => [m, preview[m].count])) as Record<Mode, number>

  useEffect(() => {
    const el = host.current!
    const renderer = new WebGLRenderer({ antialias: true })
    // Phones: 1.5x keeps the toon edges crisp at a third fewer pixels than their usual 2-3x.
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 640 ? 1.5 : 2))
    renderer.domElement.setAttribute('aria-hidden', 'true')
    el.appendChild(renderer.domElement)

    const scene = new Scene()
    const paper = tokenColor('--color-paper')
    scene.background = paper
    scene.fog = new Fog(paper, 90, 200)
    scene.add(new HemisphereLight(0xffffff, tokenColor('--color-grid'), 2.2))
    const sun = new DirectionalLight(0xffffff, 1.8)
    sun.position.set(20, 40, 10)
    scene.add(sun)

    const ground = new Mesh(new PlaneGeometry(400, 400), toon('--color-grid'))
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.21
    scene.add(ground)
    scene.add(buildStreet(lanes, level.corridor.widthM))

    // Objects in one lane share a speed and start evenly spaced, so they never overlap.
    const rand = rng(7)
    const movers = MODES.flatMap((mode) => {
      const { count, speedMps } = preview[mode]
      const use = preview[mode].lanes.map((i) => lanes[i])
      const tint = TINTS[mode]
      const meshes = instances(scene, MODELS[mode](), Array.from({ length: count }, () => place(0, -10, 0)), tint && tints(count, rand, tint))
      return Array.from({ length: count }, (_, i) => {
        const lane = use[i % use.length]
        const nth = Math.floor(i / use.length)
        const inLane = Math.ceil((count - (i % use.length)) / use.length)
        const shared = !ROAD.includes(lane.id) || mode === 'bike'
        const dir = shared ? (nth % 2 ? 1 : -1) : lane.x < 0 ? -1 : 1
        const x = lane.x + (shared ? (dir * lane.widthM) / 4 : 0)
        return { mode, meshes, i, x, y: lane.top, z: (nth / inLane) * LENGTH_M - LENGTH_M / 2, v: dir * speedMps * TIME_SCALE, phase: rand() * 6 }
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
    const touched = new Set<InstancedMesh>()
    const dummy = new Object3D()
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.1)
      const t = clock.elapsedTime
      for (const m of movers) {
        m.z = ((((m.z + m.v * dt + LENGTH_M / 2) % LENGTH_M) + LENGTH_M) % LENGTH_M) - LENGTH_M / 2
        const [height, rate] = BOB[m.mode]
        dummy.position.set(m.x, m.y + height * Math.abs(Math.sin(t * rate + m.phase)), m.z)
        dummy.rotation.y = m.v < 0 ? Math.PI : 0
        dummy.updateMatrix()
        for (const mesh of m.meshes) {
          mesh.setMatrixAt(m.i, dummy.matrix)
          touched.add(mesh)
        }
      }
      for (const mesh of touched) mesh.instanceMatrix.needsUpdate = true
      touched.clear()
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
  }, [lanes, preview, level])

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
