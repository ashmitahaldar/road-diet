import { ELEMENTS, addElement, moveElement, remainingWidth, resizeElement, snap, type ElementId, type Layout, type Level } from '@road-diet/shared'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '../ui'
import { ElementIcon, VISUALS } from './elementVisuals'

// Controls shared by the 2D editor and the 3D editor, so both edit through the same buttons and ops.

export const STEP_M = 0.1

export function BudgetBar({ layout, level, announce }: { layout: Layout; level: Level; announce: boolean }) {
  const W = level.corridor.widthM
  const free = remainingWidth(layout, level)
  const used = snap(W - free)
  return (
    <div className="relative">
      <div className="mb-1 flex flex-wrap justify-between gap-2">
        <span className="font-display text-lg font-semibold">{W} m budget</span>
        <span className="tabular-nums">
          <strong>{used.toFixed(1)} m</strong> used · <strong>{free.toFixed(1)} m</strong> unused
        </span>
      </div>
      {/* Silent while a resize drag is in progress, so screen readers hear the final width, not every 0.1 m step. */}
      <p aria-live="polite" className="sr-only">
        {announce ? `${used.toFixed(1)} metres used, ${free.toFixed(1)} unused` : ''}
      </p>
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

/** Cards that add an element after the selected one. `startAdd` (2D only) also lets a card be dragged onto the street. */
export function Palette({
  level,
  layout,
  selected,
  onAdd,
  startAdd,
}: {
  level: Level
  layout: Layout
  selected: number | null
  onAdd: (id: ElementId) => void
  startAdd?: (id: ElementId) => (e: ReactPointerEvent) => void
}) {
  const free = remainingWidth(layout, level)
  const where = selected === null ? 'at the end' : 'after the selected block'
  return (
    <div className="sm:order-1">
      <h3 className="font-display text-lg font-semibold">Add to the street</h3>
      <p className="mb-3 text-sm">
        {free === 0
          ? 'The street is full. Make a block narrower or remove one to make room.'
          : startAdd
            ? `${free.toFixed(1)} m free. Drag a card by its icon to a spot on the street, or press it to add ${where}.`
            : `${free.toFixed(1)} m free. Press a card to add it ${where}.`}
      </p>
      <div role="group" aria-label="Street elements" className="-mx-4 flex gap-3 overflow-x-auto px-4 pt-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:p-0">
        {level.allowedElements.map((id) => {
          const def = ELEMENTS[id]
          const fits = addElement(layout, level, id) !== layout
          return (
            <button
              key={id}
              type="button"
              aria-disabled={!fits}
              onPointerDown={fits ? startAdd?.(id) : undefined}
              onClick={() => fits && onAdd(id)}
              className={`relative flex min-h-11 w-32 min-w-0 shrink-0 flex-col items-start gap-1 rounded-2xl border-2 border-ink p-2 text-left sm:w-auto sm:p-3 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                fits ? `${startAdd ? 'cursor-grab' : 'cursor-pointer'} bg-paper shadow-[3px_3px_0_var(--color-ink)] hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none` : 'cursor-not-allowed border-dashed bg-grid'
              }`}
            >
              <span className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
                <span aria-hidden data-drag-handle className="grid size-10 shrink-0 touch-none place-items-center rounded-xl border-2 border-ink" style={{ background: VISUALS[id].color }}>
                  <span className="grid size-8 place-items-center rounded-full bg-paper">
                    <ElementIcon id={id} size={24} />
                  </span>
                </span>
                <span className="min-w-0 font-semibold leading-tight break-words"><span className="sr-only">Add </span>{def.label}</span>
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
  )
}

/** Resize, move and remove buttons for the selected element. */
export function SelectionBar({
  level,
  layout,
  selected,
  resize,
  move,
  remove,
  empty = 'Select a block to resize, move or remove it.',
}: {
  level: Level
  layout: Layout
  selected: number | null
  resize: (i: number, deltaM: number) => void
  move: (i: number, dir: -1 | 1) => void
  remove: (i: number) => void
  empty?: string
}) {
  const sel = selected === null ? undefined : layout.elements[selected]
  return (
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
        <span>{empty}</span>
      )}
    </div>
  )
}
