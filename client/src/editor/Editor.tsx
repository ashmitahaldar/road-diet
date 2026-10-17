import {
  ELEMENTS,
  addElement,
  moveElement,
  remainingWidth,
  removeElement,
  resizeElement,
  type ElementId,
  type Layout,
  type Level,
} from '@road-diet/shared'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '../ui'
import { SvgPatterns, VISUALS } from './elementVisuals'

const PX_PER_M = 48
const STRIP_H = 160
const LABEL_H = 48
const STEP_M = 0.1

export function Editor({ level }: { level: Level }) {
  const [layout, setLayout] = useState<Layout>(level.corridor.baselineLayout)
  const [selected, setSelected] = useState<number | null>(null)
  const blockRefs = useRef<(SVGGElement | null)[]>([])
  const refocus = useRef(false)

  // Keep keyboard focus on the block after a keyboard move/resize/remove re-renders the strip.
  useEffect(() => {
    if (refocus.current && selected !== null) blockRefs.current[selected]?.focus()
    refocus.current = false
  })

  const W = level.corridor.widthM
  const free = remainingWidth(layout, level)
  const sel = selected === null ? undefined : layout.elements[selected]

  const apply = (next: Layout, nextSelected: number | null, focus: boolean) => {
    if (next === layout) return
    setLayout(next)
    setSelected(nextSelected)
    refocus.current = focus
  }
  const resize = (i: number, deltaM: number, focus = false) => apply(resizeElement(layout, level, i, deltaM), i, focus)
  const move = (i: number, dir: -1 | 1, focus = false) => apply(moveElement(layout, i, dir), i + dir, focus)
  const remove = (i: number, focus = false) =>
    apply(removeElement(layout, i), layout.elements.length > 1 ? Math.max(0, i - 1) : null, focus)
  const add = (id: ElementId) => {
    const at = selected === null ? layout.elements.length : selected + 1
    apply(addElement(layout, level, id, at), at, false)
  }

  const onKeyDown = (i: number) => (e: KeyboardEvent) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (dir && e.altKey) move(i, dir, true)
    else if (dir) resize(i, dir * STEP_M, true)
    else if (e.key === 'Delete' || e.key === 'Backspace') remove(i, true)
    else return
    e.preventDefault()
  }

  let offsetM = 0
  const blocks = layout.elements.map((el, i) => {
    const block = { el, i, x: offsetM * PX_PER_M, w: el.widthM * PX_PER_M }
    offsetM += el.widthM
    return block
  })
  const selBlock = selected === null ? undefined : blocks[selected]

  return (
    <section aria-labelledby="editor-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="editor-title" className="font-display text-xl font-semibold">
          Street cross-section
        </h2>
        <p aria-live="polite" className="tabular-nums">
          Unused space: <strong>{free.toFixed(1)} m</strong> of {W} m
        </p>
      </div>

      <p className="-mt-2 text-sm sm:hidden">Scroll sideways to see the whole street.</p>
      <div className="overflow-x-auto rounded-2xl border-2 border-ink bg-paper p-3">
        <svg
          viewBox={`0 0 ${W * PX_PER_M} ${STRIP_H + LABEL_H}`}
          style={{ width: '100%', minWidth: W * PX_PER_M }}
          role="group"
          aria-label={`Street cross-section, ${W} metres wide, ${layout.elements.length} elements`}
        >
          <SvgPatterns />
          {blocks.map(({ el, i, x, w }) => {
            const v = VISUALS[el.id]
            return (
              <g
                key={i}
                ref={(node) => {
                  blockRefs.current[i] = node
                }}
                tabIndex={0}
                role="button"
                aria-pressed={i === selected}
                aria-label={`${ELEMENTS[el.id].label}, ${el.widthM.toFixed(1)} metres`}
                aria-describedby="editor-keys"
                onClick={() => setSelected(i)}
                onFocus={() => setSelected(i)}
                onKeyDown={onKeyDown(i)}
                className="cursor-pointer outline-none"
              >
                <rect x={x + 1} y={1} width={w - 2} height={STRIP_H - 2} rx={10} fill={v.color} />
                {v.pattern && <rect x={x + 1} y={1} width={w - 2} height={STRIP_H - 2} rx={10} fill={`url(#${v.pattern})`} />}
                {el.id === 'car_lane' && (
                  <line x1={x + w / 2} x2={x + w / 2} y1={14} y2={STRIP_H - 14} stroke="var(--color-paper)" strokeWidth={3} strokeDasharray="16 12" />
                )}
                {v.edge === 'barrier' && <rect x={x + 5} y={6} width={7} height={STRIP_H - 12} rx={2} fill="var(--color-ink)" />}
                <rect
                  x={x + 1}
                  y={1}
                  width={w - 2}
                  height={STRIP_H - 2}
                  rx={10}
                  fill="none"
                  stroke="var(--color-ink)"
                  strokeWidth={2}
                  strokeDasharray={v.edge === 'dashed' ? '8 6' : undefined}
                />
                <text x={x + w / 2} y={STRIP_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={30} fontWeight={700} fill="var(--color-ink)" aria-hidden>
                  {v.icon}
                </text>
                <text x={x + w / 2} y={STRIP_H + 20} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--color-ink)">
                  {v.short}
                </text>
                <text x={x + w / 2} y={STRIP_H + 38} textAnchor="middle" fontSize={13} fill="var(--color-ink)" className="tabular-nums">
                  {el.widthM.toFixed(1)} m
                </text>
              </g>
            )
          })}
          {free > 0 && (
            <g aria-hidden>
              <rect x={offsetM * PX_PER_M + 3} y={3} width={free * PX_PER_M - 6} height={STRIP_H - 6} rx={10} fill="none" stroke="var(--color-ink)" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="6 6" />
              <text x={(offsetM + free / 2) * PX_PER_M} y={STRIP_H + 20} textAnchor="middle" fontSize={13} fill="var(--color-ink)">
                Unused
              </text>
              <text x={(offsetM + free / 2) * PX_PER_M} y={STRIP_H + 38} textAnchor="middle" fontSize={13} fill="var(--color-ink)" className="tabular-nums">
                {free.toFixed(1)} m
              </text>
            </g>
          )}
          {selBlock && (
            <rect x={selBlock.x + 2} y={2} width={selBlock.w - 4} height={STRIP_H + LABEL_H - 4} rx={12} fill="none" stroke="var(--color-primary)" strokeWidth={4} pointerEvents="none" />
          )}
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
      <p id="editor-keys" className="text-sm">
        Keyboard: Tab to a block, ← / → resize by 0.1 m, Alt + ← / → move it, Delete removes it.
      </p>

      <div>
        <h3 className="font-semibold">Add to the street{selected !== null && ' (after the selected block)'}</h3>
        <p className="mb-2 text-sm">
          {free === 0 ? 'The street is full. Make a block narrower or remove one to make room.' : `${free.toFixed(1)} m free.`}
        </p>
        <div role="group" aria-label="Street elements" className="flex flex-wrap gap-2">
          {level.allowedElements.map((id) => {
            const def = ELEMENTS[id]
            const v = VISUALS[id]
            return (
              <Button key={id} disabled={addElement(layout, level, id) === layout} onClick={() => add(id)} aria-label={`Add ${def.label}, ${def.defaultW} metres`}>
                <span aria-hidden className="inline-block size-4 rounded border-2 border-ink" style={{ background: v.color }} />
                <span aria-hidden>{v.icon}</span>
                {def.label}
                <span className="text-sm tabular-nums">{def.defaultW} m</span>
              </Button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
