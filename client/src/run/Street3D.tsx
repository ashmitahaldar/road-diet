import { MODES, moveElementTo, previewTraffic, resizeElement, snap, type Layout, type Level, type Mode } from '@road-diet/shared'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import {
  BoxGeometry,
  Clock,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type InstancedMesh,
  type Material,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import { VISUALS } from '../editor/elementVisuals'
import { inkMaterial, instances, part, toon, tokenColor, type Part } from './street3d/materials'
import * as props from './street3d/props'
import { CAR_TINTS, CURB_M, LENGTH_M, PEOPLE_TINTS, ROAD, buildStreet, place, rng, tints, type Lane } from './street3d/street'

/** Movement runs faster than real time so a walker visibly moves. */
const TIME_SCALE = 2.5
/** previewTraffic never gives one mode more than its 80-object total. */
const CAPACITY = 80
const MODELS: Record<Mode, () => Part[]> = { car: props.car, bus: props.bus, bike: props.bike, walk: props.walker }
const TINTS: Record<Mode, string[] | undefined> = { car: CAR_TINTS, bus: undefined, bike: PEOPLE_TINTS, walk: PEOPLE_TINTS }
/** Per-frame bob: walkers step, cyclists pedal; vehicles ride level. [height m, rate rad/s] */
const BOB: Record<Mode, [number, number]> = { car: [0, 0], bus: [0, 0], bike: [0.04, 9], walk: [0.07, 7] }
/** A tap moves less than this; more is an orbit or a drag. */
const TAP_PX = 6
/** How close (m) to a selected element's edge, near the handles, a press starts a resize. */
const HANDLE_M = 0.7

/** One moving object. Targets change when the layout does; the frame loop eases x, y and scale towards them. */
type Slot = { x: number; tx: number; y: number; ty: number; z: number; v: number; s: number; ts: number; phase: number }
type Pool = { meshes: InstancedMesh[]; slots: Slot[] }
export type CameraApi = { view: (name: View) => void; orbit: (radians: number) => void; zoom: (factor: number) => void }
export type View = 'overview' | 'street' | 'above'

type Drag = { kind: 'resize'; index: number; edge: -1 | 1; startX: number; start: Layout } | { kind: 'move'; index: number; slot: number | null }

function lanesOf(layout: Layout, widthM: number): Lane[] {
  let x = -widthM / 2
  return layout.elements.map((e) => {
    const lane = { ...e, x: x + e.widthM / 2, top: VISUALS[e.id].raised ? CURB_M : 0 }
    x += e.widthM
    return lane
  })
}

/** Point the moving objects of one mode at their (new) lanes; new ones appear in place, surplus ones shrink away. */
function retarget(pool: Pool, mode: Mode, preview: ReturnType<typeof previewTraffic>, lanes: Lane[]) {
  const { count, speedMps } = preview[mode]
  const use = preview[mode].lanes.map((i) => lanes[i])
  pool.slots.forEach((s, i) => {
    if (i >= count) return void (s.ts = 0)
    // Objects in one lane share a speed and start evenly spaced, so they never overlap.
    const lane = use[i % use.length]
    const nth = Math.floor(i / use.length)
    const inLane = Math.ceil((count - (i % use.length)) / use.length)
    const shared = !ROAD.includes(lane.id) || mode === 'bike'
    const dir = shared ? (nth % 2 ? 1 : -1) : lane.x < 0 ? -1 : 1
    const x = lane.x + (shared ? (dir * lane.widthM) / 4 : 0)
    if (s.s < 0.01) Object.assign(s, { x, y: lane.top, z: (nth / inLane) * LENGTH_M - LENGTH_M / 2 })
    Object.assign(s, { tx: x, ty: lane.top, v: dir * speedMps * TIME_SCALE, ts: 1 })
  })
}

function disposeAll(root: Object3D) {
  root.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose()
      ;(o.material as Material).dispose()
    }
  })
}

/**
 * The street in 3D with traffic that keeps moving while you edit. Tap an element to select it, drag its handles to
 * resize it or drag it sideways to move it; the build tray uses the same edit ops as the 2D editor. Traffic here is a
 * preview only: Run a day still makes the scorecard.
 */
type Props = {
  level: Level
  layout: Layout
  onChange: (layout: Layout) => void
  selected: number | null
  onSelect: (i: number | null) => void
  onDragging: (dragging: boolean) => void
  onLook?: () => void
  camera: RefObject<CameraApi | null>
}

export default function Street3D({ level, layout, onChange, selected, onSelect, onDragging, onLook, camera: cameraApi }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const lanes = useMemo(() => lanesOf(layout, level.corridor.widthM), [layout, level])
  const preview = useMemo(() => previewTraffic(layout, level.corridor), [layout, level])
  const counts = Object.fromEntries(MODES.map((m) => [m, preview[m].count])) as Record<Mode, number>

  // The scene lives as long as the component; event handlers read the latest props through this ref.
  const live = useRef({ layout, lanes, selected, onChange, level, select: onSelect, setDragging: onDragging, onLook })
  live.current = { layout, lanes, selected, onChange, level, select: onSelect, setDragging: onDragging, onLook }
  const world = useRef<{ street: Group; labels: Group; pools: Record<Mode, Pool>; mark: (lanes: Lane[], selected: number | null) => void } | null>(null)

  useEffect(() => {
    const el = host.current!
    const renderer = new WebGLRenderer({ antialias: true })
    // Phones: 1.5x keeps the toon edges crisp at a third fewer pixels than their usual 2-3x.
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 640 ? 1.5 : 2))
    const canvas = renderer.domElement
    canvas.setAttribute('aria-hidden', 'true')
    // The game screen has no page scroll, so every touch on the street is an orbit, a tap or a drag.
    canvas.style.touchAction = 'none'
    el.appendChild(canvas)
    const labelRenderer = new CSS2DRenderer()
    Object.assign(labelRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' })
    labelRenderer.domElement.setAttribute('aria-hidden', 'true')
    el.appendChild(labelRenderer.domElement)

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
    const street = new Group()
    const labels = new Group()
    scene.add(street, labels)

    const rand = rng(7)
    const pools = Object.fromEntries(
      MODES.map((mode) => {
        const tint = TINTS[mode]
        const meshes = instances(scene, MODELS[mode](), Array.from({ length: CAPACITY }, () => place(0, -10, 0)), tint && tints(CAPACITY, rand, tint))
        meshes.forEach((m) => (m.count = 0))
        const slots = Array.from({ length: CAPACITY }, () => ({ x: 0, tx: 0, y: 0, ty: 0, z: 0, v: 0, s: 0, ts: 0, phase: rand() * 6 }))
        return [mode, { meshes, slots }]
      }),
    ) as Record<Mode, Pool>

    // Selection: a tinted band with solid rails along the element, two outlined handles at its edges near the orbit
    // centre, and a drop marker while moving.
    const primary = tokenColor('--color-primary')
    const band = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: primary, transparent: true, opacity: 0.45, depthWrite: false }))
    const rails = [-1, 1].map(() => new Mesh(new BoxGeometry(0.16, 0.1, LENGTH_M), new MeshBasicMaterial({ color: primary })))
    const knob = part('--color-primary', [new BoxGeometry(0.5, 2.2, 5)], 0.06)
    const handles = [-1, 1].map(() => {
      const g = new Group()
      g.add(new Mesh(knob.geometry, toon('--color-primary')), new Mesh(knob.outline!, inkMaterial()))
      return g
    })
    const drop = new Mesh(new BoxGeometry(0.25, 2.4, LENGTH_M), new MeshBasicMaterial({ color: primary, transparent: true, opacity: 0.8 }))
    scene.add(band, drop, ...rails, ...handles)
    drop.visible = false
    const mark = (lanes: Lane[], sel: number | null) => {
      const lane = sel === null ? undefined : lanes[sel]
      labels.children.forEach((l, i) => ((l as CSS2DObject).element.dataset.on = String(i === sel)))
      for (const o of [band, ...rails, ...handles]) o.visible = !!lane
      if (!lane) return
      band.position.set(lane.x, lane.top + 0.04, 0)
      band.scale.set(lane.widthM, 0.06, LENGTH_M)
      const edge = (i: number) => lane.x + (i ? 1 : -1) * (lane.widthM / 2 - 0.08)
      rails.forEach((r, i) => r.position.set(edge(i), lane.top + 0.06, 0))
      handles.forEach((h, i) => h.position.set(edge(i), lane.top + 1.1, 0))
    }

    const camera = new PerspectiveCamera(45, 1, 0.5, 400)
    const s = Math.max(1, level.corridor.widthM / 20)
    const VIEWS: Record<View, Vector3> = {
      overview: new Vector3(13 * s, 22 * s, 27 * s),
      street: new Vector3(4 * s, 3.6, 17 * s),
      above: new Vector3(0, 46 * s, 15 * s),
    }
    // A tall, narrow window sees less of the street's width, so every view steps back.
    let back = 0
    const viewOf = (name: View) => VIEWS[name].clone().multiplyScalar(back)
    camera.position.copy(VIEWS.overview)
    const controls = new OrbitControls(camera, canvas)
    Object.assign(controls, { enablePan: false, enableDamping: true, autoRotate: true, autoRotateSpeed: 0.6, minDistance: 15, maxDistance: 110, minPolarAngle: 0.3, maxPolarAngle: 1.35 })
    let goal: Vector3 | null = null
    // A drag takes over from a button move; otherwise the move keeps pulling the camera back.
    controls.addEventListener('start', () => {
      goal = null
      live.current.onLook?.()
    })
    const go = (to: Vector3) => {
      controls.autoRotate = false
      goal = to.clampLength(controls.minDistance, controls.maxDistance)
    }
    cameraApi.current = {
      view: (name) => go(viewOf(name)),
      orbit: (a) => go((goal ?? camera.position).clone().applyAxisAngle(new Vector3(0, 1, 0), a)),
      zoom: (f) => go((goal ?? camera.position).clone().multiplyScalar(f)),
    }

    // Pointer → point on the ground → element under it.
    const ray = new Raycaster()
    const ndc = new Vector2()
    const groundPlane = new Plane(new Vector3(0, 1, 0), 0)
    const groundAt = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      return ray.ray.intersectPlane(groundPlane, new Vector3())
    }
    const laneAt = (x: number) => live.current.lanes.findIndex((l) => Math.abs(x - l.x) <= l.widthM / 2)
    const slotAt = (x: number) => live.current.lanes.filter((l) => l.x < x).length
    const slotX = (slot: number) => {
      const ls = live.current.lanes
      return slot < ls.length ? ls[slot].x - ls[slot].widthM / 2 : ls[ls.length - 1].x + ls[ls.length - 1].widthM / 2
    }

    let down: { x: number; y: number } | null = null
    let drag: Drag | null = null
    // Capture phase, so a drag on the street can switch the orbit controls off before they see the press.
    const onDown = (e: PointerEvent) => {
      controls.autoRotate = false
      if (e.button !== 0) return
      down = { x: e.clientX, y: e.clientY }
      const p = groundAt(e)
      const { selected: sel, lanes: ls, layout: lay } = live.current
      const lane = sel === null ? undefined : ls[sel]
      if (!p || !lane || sel === null) return
      const near = Math.abs(p.z) < 6
      const edge = near && Math.abs(p.x - (lane.x - lane.widthM / 2)) < HANDLE_M ? -1 : near && Math.abs(p.x - (lane.x + lane.widthM / 2)) < HANDLE_M ? 1 : 0
      if (edge) drag = { kind: 'resize', index: sel, edge, startX: p.x, start: lay }
      else if (laneAt(p.x) === sel) drag = { kind: 'move', index: sel, slot: null }
      if (drag) {
        controls.enabled = false
        canvas.setPointerCapture(e.pointerId)
        live.current.setDragging(true)
      }
    }
    const onMove = (e: PointerEvent) => {
      if (!drag) return
      const p = groundAt(e)
      if (!p) return
      const { level: lv, onChange: change } = live.current
      if (drag.kind === 'resize') change(resizeElement(drag.start, lv, drag.index, snap((p.x - drag.startX) * drag.edge)))
      else {
        drag.slot = slotAt(p.x)
        drop.visible = drag.slot !== drag.index && drag.slot !== drag.index + 1
        drop.position.set(slotX(drag.slot), 1.2, 0)
      }
    }
    const onUp = (e: PointerEvent) => {
      const { layout: lay, onChange: change, select, selected: current } = live.current
      // A cancelled press (the browser took the gesture, e.g. to scroll) is neither a tap nor a drop.
      if (e.type === 'pointercancel') {
        if (drag?.kind === 'resize') change(drag.start)
      } else if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < TAP_PX) {
        // A press that barely moved is a tap, even on the selected element: undo any jitter, then (de)select.
        if (drag?.kind === 'resize') change(drag.start)
        const p = groundAt(e)
        const i = p ? laneAt(p.x) : -1
        select(i >= 0 && i !== current ? i : null)
      } else if (drag?.kind === 'move' && drag.slot !== null) {
        const to = drag.slot > drag.index ? drag.slot - 1 : drag.slot
        const next = moveElementTo(lay, drag.index, to)
        if (next !== lay) {
          change(next)
          select(to)
        }
      }
      if (drag) live.current.setDragging(false)
      drag = null
      down = null
      drop.visible = false
      controls.enabled = true
    }
    canvas.addEventListener('pointerdown', onDown, { capture: true })
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)

    const resize = () => {
      const { width, height } = el.getBoundingClientRect()
      renderer.setSize(width, height)
      labelRenderer.setSize(width, height)
      camera.aspect = width / Math.max(1, height)
      camera.updateProjectionMatrix()
      const first = back === 0
      back = Math.min(1.8, 1 / Math.sqrt(Math.min(1, camera.aspect)))
      if (first) camera.position.copy(viewOf('overview'))
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    resize()

    const clock = new Clock()
    const dummy = new Object3D()
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.1)
      const t = clock.elapsedTime
      const ease = 1 - Math.exp(-dt * 6)
      for (const mode of MODES) {
        const { meshes, slots } = pools[mode]
        const [height, rate] = BOB[mode]
        let last = -1
        slots.forEach((m, i) => {
          m.s += (m.ts - m.s) * ease
          if (m.s < 0.01 && m.ts === 0) return
          last = i
          m.x += (m.tx - m.x) * ease
          m.y += (m.ty - m.y) * ease
          m.z = ((((m.z + m.v * dt + LENGTH_M / 2) % LENGTH_M) + LENGTH_M) % LENGTH_M) - LENGTH_M / 2
          dummy.position.set(m.x, m.y + height * Math.abs(Math.sin(t * rate + m.phase)), m.z)
          dummy.rotation.y = m.v < 0 ? Math.PI : 0
          dummy.scale.setScalar(m.s)
          dummy.updateMatrix()
          for (const mesh of meshes) mesh.setMatrixAt(i, dummy.matrix)
        })
        for (const mesh of meshes) {
          mesh.count = last + 1
          mesh.instanceMatrix.needsUpdate = true
        }
      }
      if (goal) {
        camera.position.lerp(goal, 1 - Math.exp(-dt * 5))
        // OrbitControls' angle limits can stop the camera short of a goal, so settle when close.
        if (camera.position.distanceTo(goal) < 0.3) goal = null
      }
      controls.update()
      renderer.render(scene, camera)
      labelRenderer.render(scene, camera)
    })

    world.current = { street, labels, pools, mark }
    return () => {
      world.current = null
      cameraApi.current = null
      labelRenderer.domElement.remove()
      renderer.setAnimationLoop(null)
      observer.disconnect()
      controls.dispose()
      disposeAll(scene)
      renderer.dispose()
      canvas.remove()
    }
  }, [level])

  // Each edit: rebuild only the still parts, and send the moving objects to their new lanes.
  useEffect(() => {
    const w = world.current
    if (!w) return
    disposeAll(w.street)
    w.street.clear()
    w.street.add(buildStreet(lanes, level.corridor.widthM))
    w.labels.clear()
    for (const lane of lanes) {
      const tag = document.createElement('span')
      tag.textContent = VISUALS[lane.id].short
      tag.className = 'rounded-full border-2 border-ink bg-paper px-1.5 text-xs font-semibold text-ink data-[on=true]:bg-primary data-[on=true]:text-paper'
      const label = new CSS2DObject(tag)
      label.position.set(lane.x, lane.top + 0.3, 8)
      w.labels.add(label)
    }
    for (const mode of MODES) retarget(w.pools[mode], mode, preview, lanes)
  }, [lanes, preview, level])

  const sel = selected !== null && selected < layout.elements.length ? selected : null
  useEffect(() => world.current?.mark(lanes, sel), [lanes, sel])

  const label = `${counts.car} cars, ${counts.bus} buses, ${counts.bike} bikes and ${counts.walk} people walking, roughly in proportion to who uses the street.`
  return (
    <div
      ref={host}
      role="img"
      aria-label={`3D view of your street: ${label}`}
      data-objects={MODES.map((m) => `${m}:${counts[m]}`).join(' ')}
      className={`absolute inset-0 isolate overflow-hidden bg-paper ${sel === null ? 'cursor-pointer' : 'cursor-grab'}`}
    />
  )
}
