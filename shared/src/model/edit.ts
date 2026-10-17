import { ELEMENTS } from './constants'
import type { ElementId, Layout, Level } from './types'

// Editor operations. Each returns the same layout object when the change would be invalid,
// so callers can disable a control with `op(...) === layout`.

/** Widths snap to 0.1 m (spec 8). */
export const snap = (m: number) => Math.round(m * 10) / 10

export const remainingWidth = (layout: Layout, level: Level) =>
  snap(level.corridor.widthM - layout.elements.reduce((sum, e) => sum + e.widthM, 0))

export function addElement(layout: Layout, level: Level, id: ElementId, atIndex = layout.elements.length): Layout {
  const { minW, defaultW } = ELEMENTS[id]
  const free = remainingWidth(layout, level)
  if (!level.allowedElements.includes(id) || free < minW) return layout
  const elements = [...layout.elements]
  elements.splice(atIndex, 0, { id, widthM: Math.min(defaultW, free) })
  return { elements }
}

export function resizeElement(layout: Layout, level: Level, index: number, deltaM: number): Layout {
  const el = layout.elements[index]
  if (!el) return layout
  const { minW, maxW } = ELEMENTS[el.id]
  const widthM = snap(Math.min(maxW, el.widthM + remainingWidth(layout, level), Math.max(minW, el.widthM + deltaM)))
  if (widthM === el.widthM) return layout
  return { elements: layout.elements.map((e, i) => (i === index ? { ...e, widthM } : e)) }
}

export function removeElement(layout: Layout, index: number): Layout {
  if (!layout.elements[index]) return layout
  return { elements: layout.elements.filter((_, i) => i !== index) }
}

export function moveElement(layout: Layout, index: number, direction: -1 | 1): Layout {
  return moveElementTo(layout, index, index + direction)
}

/** Move the element at `from` so it ends up at index `to` (drag to reorder). */
export function moveElementTo(layout: Layout, from: number, to: number): Layout {
  if (from === to || !layout.elements[from] || !layout.elements[to]) return layout
  const elements = [...layout.elements]
  elements.splice(to, 0, ...elements.splice(from, 1))
  return { elements }
}
