import {
  ELEMENTS,
  addElement,
  moveElement,
  moveElementTo,
  remainingWidth,
  removeElement,
  resizeElement,
  snap,
  type ElementId,
  type Layout,
  type Level,
} from '@road-diet/shared'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '../ui'
import { ElementIcon, SvgPatterns, VISUALS } from './elementVisuals'

const PX_PER_M = 48
const TOP = 20
const CURB = 12
const BASE = TOP + 150
const VIEW_H = BASE + 84
const STEP_M = 0.1
const DRAG_START_PX = 6

/** `slot` is the gap (0..n) the dragged item would drop into, or null when off the street. */
type Drag =
  | { kind: 'resize'; index: number; edge: -1 | 1; startX: number; start: Layout }
  | { kind: 'move'; index: number; startX: number; startY: number; x: number; y: number; active: boolean; slot: number | null }
  | { kind: 'add'; id: ElementId; startX: number; startY: number; x: number; y: number; active: boolean; slot: number | null }

type Props = { level: Level; layout: Layout; onChange: (layout: Layout) => void }

export function Editor({ level, layout, onChange }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const blockRefs = useRef<(SVGGElement | null)[]>([])
  const refocus = useRef(false)
  const reduceMotion = useReducedMotion()

  // Keep keyboard focus on the block after a keyboard move/resize/remove re-renders the strip.
  useEffect(() => {
    if (refocus.current && selected !== null) blockRefs.current[selected]?.focus()
    refocus.current = false
  })

  const W = level.corridor.widthM
  const free = remainingWidth(layout, level)
  const sel = selected === null ? undefined : layout.elements[selected]

  const starts: number[] = []
  layout.elements.reduce((offset, el) => (starts.push(offset), offset + el.widthM), 0)
  const used = snap(W - free)

  const apply = (next: Layout, nextSelected: number | null, focus = false) => {
    if (next === layout) return
    onChange(next)
    setSelected(nextSelected)
    refocus.current = focus
  }
  const resize = (i: number, deltaM: number, focus = false) => apply(resizeElement(layout, level, i, deltaM), i, focus)
  const move = (i: number, dir: -1 | 1, focus = false) => apply(moveElement(layout, i, dir), i + dir, focus)
  const remove = (i: number, focus = false) =>
    apply(removeElement(layout, i), layout.elements.length > 1 ? Math.max(0, i - 1) : null, focus)
  const add = (id: ElementId, at = selected === null ? layout.elements.length : selected + 1) =>
    apply(addElement(layout, level, id, at), at)

  const onKeyDown = (i: number) => (e: KeyboardEvent) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (dir && e.altKey) move(i, dir, true)
    else if (dir) resize(i, dir * STEP_M, true)
    else if (e.key === 'Delete' || e.key === 'Backspace') remove(i, true)
    else return
    e.preventDefault()
  }

  const slotAt = (clientX: number, clientY: number): number | null => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r || clientX < r.left || clientX > r.right || clientY < r.top - 40 || clientY > r.bottom + 40) return null
    const m = ((clientX - r.left) / r.width) * W
    return layout.elements.filter((el, i) => starts[i] + el.widthM / 2 < m).length
  }
  const moveTarget = (d: Extract<Drag, { kind: 'move' }>) =>
    d.slot === null ? null : d.slot > d.index ? d.slot - 1 : d.slot

  // Window listeners so a drag keeps tracking when the pointer leaves the element it started on.
  useEffect(() => {
    if (!drag) return
    const onMove = (e: PointerEvent) => {
      if (drag.kind === 'resize') {
        const pxPerM = (svgRef.current?.getBoundingClientRect().width ?? W * PX_PER_M) / W
        onChange(resizeElement(drag.start, level, drag.index, snap(((e.clientX - drag.startX) / pxPerM) * drag.edge)))
        return
      }
      const active = drag.active || Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > DRAG_START_PX
      setDrag({ ...drag, x: e.clientX, y: e.clientY, active, slot: active ? slotAt(e.clientX, e.clientY) : null })
    }
    const onUp = () => {
      setDrag(null)
      if (drag.kind === 'move' && drag.active) {
        const to = moveTarget(drag)
        if (to !== null) apply(moveElementTo(layout, drag.index, to), to)
      }
      if (drag.kind === 'add' && drag.active && drag.slot !== null) add(drag.id, drag.slot)
    }
    const onCancel = () => setDrag(null)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }
  })

  // Touch users must select a block before dragging it, so swiping across the street still scrolls.
  const startMove = (i: number) => (e: ReactPointerEvent) => {
    if (e.button !== 0 || (e.pointerType !== 'mouse' && i !== selected)) return
    setDrag({ kind: 'move', index: i, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY, active: false, slot: null })
  }
  const startResize = (i: number, edge: -1 | 1) => (e: ReactPointerEvent) => {
    e.stopPropagation()
    setSelected(i)
    setDrag({ kind: 'resize', index: i, edge, startX: e.clientX, start: layout })
  }
  const startAdd = (id: ElementId) => (e: ReactPointerEvent) => {
    if (e.button !== 0) return
    setDrag({ kind: 'add', id, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY, active: false, slot: null })
  }

  const transition = reduceMotion || drag?.kind === 'resize' ? { duration: 0 } : { type: 'spring' as const, stiffness: 600, damping: 42 }
  const dropSlot = drag?.kind === 'add' ? drag.slot : drag?.kind === 'move' && moveTarget(drag) !== drag.index ? drag.slot : null
  const carrying = drag !== null && drag.kind !== 'resize' && drag.active
  const ghost = carrying ? (drag.kind === 'add' ? drag.id : layout.elements[drag.index]?.id) : undefined
  const ghostFits = drag?.kind !== 'add' || addElement(layout, level, drag.id) !== layout
  const x = (m: number) => m * PX_PER_M

  return (
    <section aria-labelledby="editor-title" className={`flex flex-col gap-4 ${drag ? 'select-none' : ''}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="editor-title" className="font-display text-2xl font-semibold">
          Street cross-section
        </h2>
        <p className="text-sm">Drag cards onto the street. Drag a block to move it, or its handles to resize it.</p>
      </div>

      <BudgetBar layout={layout} W={W} used={used} free={free} />

      <p className="-mt-2 text-sm sm:hidden">Scroll sideways to see the whole street. Tap a block before dragging it.</p>
      <div className="overflow-x-auto rounded-2xl border-2 border-ink bg-paper px-3 pt-2 shadow-[4px_4px_0_var(--color-ink)]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${x(W)} ${VIEW_H}`}
          style={{ width: '100%', minWidth: W * 36 }}
          className="overflow-visible"
          role="group"
          aria-label={`Street cross-section, ${W} metres wide, ${layout.elements.length} elements`}
        >
          <SvgPatterns />
          <AnimatePresence initial={false}>
            {layout.elements.map((el, i) => {
              const key = `${el.id}-${layout.elements.slice(0, i).filter((e) => e.id === el.id).length}`
              const dragged = drag?.kind === 'move' && drag.active && drag.index === i
              return (
                <motion.g
                  key={key}
                  ref={(node: SVGGElement | null) => {
                    blockRefs.current[i] = node
                  }}
                  initial={{ opacity: 0, x: x(starts[i]), y: -24 }}
                  animate={{ opacity: dragged ? 0.35 : 1, x: x(starts[i]), y: i === selected ? -6 : 0 }}
                  exit={{ opacity: 0, y: 40, transition: { duration: reduceMotion ? 0 : 0.18 } }}
                  transition={transition}
                  tabIndex={0}
                  role="button"
                  aria-pressed={i === selected}
                  aria-label={`${ELEMENTS[el.id].label}, ${el.widthM.toFixed(1)} metres`}
                  aria-describedby="editor-keys"
                  onClick={() => setSelected(i)}
                  onFocus={() => setSelected(i)}
                  onKeyDown={onKeyDown(i)}
                  onPointerDown={startMove(i)}
                  style={{ touchAction: i === selected ? 'none' : 'auto' }}
                  className="cursor-grab outline-none"
                >
                  <Block id={el.id} w={x(el.widthM)} widthM={el.widthM} prev={layout.elements[i - 1]?.id} next={layout.elements[i + 1]?.id} lifted={i === selected} />
                </motion.g>
              )
            })}
          </AnimatePresence>

          {free > 0 && (
            <motion.g aria-hidden initial={false} animate={{ x: x(used) }} transition={transition}>
              <rect x={4} y={TOP + CURB} width={Math.max(0, x(free) - 8)} height={BASE - TOP - CURB} rx={10} fill="none" stroke="var(--color-ink)" strokeOpacity={0.55} strokeWidth={2} strokeDasharray="6 6" />
              {x(free) > 40 && (
                <>
                  <text x={x(free) / 2} y={BASE + 22} textAnchor="middle" fontSize={13} fill="var(--color-ink)">
                    Unused
                  </text>
                  <text x={x(free) / 2} y={BASE + 40} textAnchor="middle" fontSize={13} fill="var(--color-ink)" className="tabular-nums">
                    {free.toFixed(1)} m
                  </text>
                </>
              )}
            </motion.g>
          )}

          {sel && selected !== null && !carrying && (
            <motion.g aria-hidden initial={false} animate={{ x: x(starts[selected]), y: -6 }} transition={transition}>
              <rect x={-2} y={TOP - 4} width={x(sel.widthM) + 4} height={BASE - TOP + 8} rx={8} fill="none" stroke="var(--color-primary)" strokeWidth={4} pointerEvents="none" />
              <Handle cx={0} onPointerDown={startResize(selected, -1)} />
              <Handle cx={x(sel.widthM)} onPointerDown={startResize(selected, 1)} />
            </motion.g>
          )}

          {dropSlot !== null && dropSlot !== undefined && (
            <g aria-hidden pointerEvents="none">
              <rect x={x(starts[dropSlot] ?? used) - 3} y={TOP - 12} width={6} height={BASE - TOP + 20} rx={3} fill="var(--color-primary)" />
              <path d={`M${x(starts[dropSlot] ?? used) - 9} ${TOP - 18} h18 l-9 10 z`} fill="var(--color-primary)" />
            </g>
          )}

          <Ruler W={W} />
        </svg>
      </div>

      <div className="flex min-h-11 flex-wrap items-center gap-2">
        {sel && selected !== null ? (
          <>
            <span className="mr-2 font-semibold">
              {ELEMENTS[sel.id].label} · <span className="tabular-nums">{sel.widthM.toFixed(1)} m</span>
            </span>
            <Button aria-label="Narrower by 0.1 metres" disabled={resizeElement(layout, level, selected, -STEP_M) === layout} onClick={() => resize(selected, -STEP_M)}>
              −
            </Button>
            <Button aria-label="Wider by 0.1 metres" disabled={resizeElement(layout, level, selected, STEP_M) === layout} onClick={() => resize(selected, STEP_M)}>
              +
            </Button>
            <Button aria-label="Move left" disabled={moveElement(layout, selected, -1) === layout} onClick={() => move(selected, -1)}>
              ◀
            </Button>
            <Button aria-label="Move right" disabled={moveElement(layout, selected, 1) === layout} onClick={() => move(selected, 1)}>
              ▶
            </Button>
            <Button onClick={() => remove(selected)}>Remove</Button>
          </>
        ) : (
          <span>Select a block to resize, move or remove it.</span>
        )}
      </div>
      <p id="editor-keys" className="-mt-2 text-sm">
        Keyboard: Tab to a block, ← / → resize by 0.1 m, Alt + ← / → move it, Delete removes it.
      </p>

      <div>
        <h3 className="font-display text-lg font-semibold">Add to the street</h3>
        <p className="mb-3 text-sm">
          {free === 0
            ? 'The street is full. Make a block narrower or remove one to make room.'
            : `${free.toFixed(1)} m free. Drag a card to a spot on the street, or press it to add ${selected === null ? 'at the end' : 'after the selected block'}.`}
        </p>
        <div role="group" aria-label="Street elements" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {level.allowedElements.map((id) => {
            const def = ELEMENTS[id]
            const fits = addElement(layout, level, id) !== layout
            return (
              <button
                key={id}
                type="button"
                aria-disabled={!fits}
                aria-label={`Add ${def.label}, ${def.defaultW} metres${fits ? '' : `. Needs ${def.minW} metres, ${free.toFixed(1)} free`}`}
                onPointerDown={fits ? startAdd(id) : undefined}
                onClick={() => fits && add(id)}
                className={`flex min-h-11 min-w-0 touch-none flex-col items-start gap-1 rounded-2xl border-2 border-ink p-2 text-left sm:p-3 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  fits ? 'cursor-grab bg-paper shadow-[3px_3px_0_var(--color-ink)] hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none' : 'cursor-not-allowed border-dashed bg-grid'
                }`}
              >
                <span className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink" style={{ background: VISUALS[id].color }}>
                    <span className="grid size-8 place-items-center rounded-full bg-paper">
                      <ElementIcon id={id} size={24} />
                    </span>
                  </span>
                  <span className="min-w-0 font-semibold leading-tight break-words">{def.label}</span>
                </span>
                <span className="hidden text-sm tabular-nums sm:inline">
                  {def.defaultW} m · {def.minW}–{def.maxW} m
                </span>
                {!fits && (
                  <span className="text-sm font-medium tabular-nums">Needs {def.minW} m</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {ghost && drag && drag.kind !== 'resize' && (
        <div
          aria-hidden
          className={`pointer-events-none fixed z-50 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-2xl border-2 border-ink bg-paper px-3 py-2 font-semibold shadow-[4px_4px_0_var(--color-ink)] ${ghostFits ? '' : 'border-dashed'}`}
          style={{ left: drag.x, top: drag.y }}
        >
          <span className="grid size-8 place-items-center rounded-lg border-2 border-ink" style={{ background: VISUALS[ghost].color }}>
            <span className="grid size-6 place-items-center rounded-full bg-paper">
              <ElementIcon id={ghost} size={18} />
            </span>
          </span>
          {ELEMENTS[ghost].label}
        </div>
      )}
    </section>
  )
}

function BudgetBar({ layout, W, used, free }: { layout: Layout; W: number; used: number; free: number }) {
  return (
    <div>
      <div className="mb-1 flex flex-wrap justify-between gap-2">
        <span className="font-display text-lg font-semibold">{W} m budget</span>
        <span aria-live="polite" className="tabular-nums">
          <strong>{used.toFixed(1)} m</strong> used · <strong>{free.toFixed(1)} m</strong> unused
        </span>
      </div>
      <div aria-hidden className="flex h-7 overflow-hidden rounded-full border-2 border-ink bg-paper">
        {layout.elements.map((el, i) => (
          <div
            key={i}
            className="border-r-2 border-ink transition-[flex-basis] duration-150 last:border-r-0 motion-reduce:transition-none"
            style={{ flexBasis: `${(el.widthM / W) * 100}%`, background: VISUALS[el.id].color }}
          />
        ))}
        {free > 0 && <div className="flex-1 bg-[repeating-linear-gradient(45deg,transparent_0_6px,var(--color-grid)_6px_12px)]" />}
      </div>
    </div>
  )
}

/** One element drawn at local x = 0. Lane markings and curbs depend on the neighbours. */
function Block({ id, w, widthM, prev, next, lifted }: { id: ElementId; w: number; widthM: number; prev?: ElementId; next?: ElementId; lifted: boolean }) {
  const v = VISUALS[id]
  const top = v.raised ? TOP : TOP + CURB
  const mid = (top + BASE) / 2
  const prevTop = prev && VISUALS[prev].raised ? TOP : TOP + CURB
  const barrierRight = next === 'car_lane' || next === 'bus_lane'
  return (
    <>
      {lifted && <rect x={4} y={top + 8} width={w} height={BASE - top} fill="var(--color-ink)" opacity={0.18} />}
      <rect x={0} y={top} width={w} height={BASE - top} fill={v.color} />
      {v.pattern && <rect x={0} y={top} width={w} height={BASE - top} fill={`url(#${v.pattern})`} />}
      {v.edge === 'dashed' && (
        <path d={`M6 ${top + 6} V${BASE - 6} M${w - 6} ${top + 6} V${BASE - 6}`} stroke="var(--color-ink)" strokeWidth={2} strokeDasharray="8 6" />
      )}
      {v.edge === 'barrier' && (
        <g transform={`translate(${barrierRight ? w - 12 : 4} 0)`}>
          <rect y={top + 4} width={8} height={BASE - top - 8} rx={2} fill="var(--color-ink)" />
          <path d={`M4 ${top + 10} V${BASE - 10}`} stroke="var(--color-paper)" strokeWidth={2} strokeDasharray="6 10" />
        </g>
      )}
      <LeftEdge prev={prev} id={id} top={top} prevTop={prevTop} />
      {!next && <line x1={w} x2={w} y1={top} y2={BASE} stroke="var(--color-ink)" strokeWidth={2} />}
      <line x1={0} x2={w} y1={top} y2={top} stroke="var(--color-ink)" strokeWidth={2} />
      <line x1={0} x2={w} y1={BASE} y2={BASE} stroke="var(--color-ink)" strokeWidth={2} />
      <circle cx={w / 2} cy={mid} r={Math.min(21, w / 2 - 3)} fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth={2} />
      <ElementIcon id={id} size={Math.min(30, w - 12)} x={w / 2 - Math.min(15, w / 2 - 6)} y={mid - Math.min(15, w / 2 - 6)} />
      <text x={w / 2} y={BASE + 22} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--color-ink)">
        {v.short}
      </text>
      <text x={w / 2} y={BASE + 40} textAnchor="middle" fontSize={13} fill="var(--color-ink)" className="tabular-nums">
        {widthM.toFixed(1)} m
      </text>
    </>
  )
}

function LeftEdge({ prev, id, top, prevTop }: { prev?: ElementId; id: ElementId; top: number; prevTop: number }) {
  const lane = (a?: ElementId) => a === 'car_lane' || a === 'bus_lane'
  if (prev === 'car_lane' && id === 'car_lane')
    return <line x1={0} x2={0} y1={top + 10} y2={BASE - 10} stroke="var(--color-paper)" strokeWidth={3} strokeDasharray="16 12" />
  if (lane(prev) && lane(id)) return <line x1={0} x2={0} y1={top + 4} y2={BASE - 4} stroke="var(--color-paper)" strokeWidth={3} />
  return <line x1={0} x2={0} y1={Math.min(top, prevTop)} y2={BASE} stroke="var(--color-ink)" strokeWidth={prevTop !== top ? 3 : 2} />
}

function Handle({ cx, onPointerDown }: { cx: number; onPointerDown: (e: ReactPointerEvent) => void }) {
  return (
    <g onPointerDown={onPointerDown} style={{ touchAction: 'none' }} className="cursor-ew-resize">
      <rect x={cx - 16} y={TOP + 30} width={32} height={90} fill="transparent" />
      <rect x={cx - 6} y={TOP + 45} width={12} height={60} rx={6} fill="var(--color-paper)" stroke="var(--color-primary)" strokeWidth={3} />
      <path d={`M${cx - 2} ${TOP + 65} v20 M${cx + 2} ${TOP + 65} v20`} stroke="var(--color-primary)" strokeWidth={1.5} />
    </g>
  )
}

function Ruler({ W }: { W: number }) {
  const y = BASE + 54
  return (
    <g aria-hidden>
      <line x1={0} x2={W * PX_PER_M} y1={y} y2={y} stroke="var(--color-ink)" strokeWidth={1.5} />
      {Array.from({ length: Math.floor(W) + 1 }, (_, m) => (
        <g key={m}>
          <line x1={m * PX_PER_M} x2={m * PX_PER_M} y1={y} y2={y + (m % 5 === 0 ? 10 : 5)} stroke="var(--color-ink)" strokeWidth={1.5} />
          {m % 5 === 0 && (
            <text x={m * PX_PER_M} y={y + 24} textAnchor={m === 0 ? 'start' : m === W ? 'end' : 'middle'} fontSize={12} fill="var(--color-ink)" className="tabular-nums">
              {m} m
            </text>
          )}
        </g>
      ))}
    </g>
  )
}
