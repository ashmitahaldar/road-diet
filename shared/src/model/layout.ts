import { ELEMENTS } from './constants'
import type { ElementId, Layout, Level } from './types'

export type LayoutError =
  | { kind: 'over-width'; overByM: number }
  | { kind: 'out-of-range'; index: number; id: ElementId; widthM: number; minW: number; maxW: number }
  | { kind: 'not-allowed'; index: number; id: ElementId }

export type LayoutCheck = { valid: boolean; totalWidthM: number; unusedWidthM: number; errors: LayoutError[] }

// Widths snap to 0.1 m; rounding to 0.01 absorbs float error (2.5 + 2.4 + ... !== 20 exactly).
const round = (m: number) => Math.round(m * 100) / 100

/** Under-width is valid: the leftover is "unused space" (spec 2.1), penalized by the model, not blocked. */
export function validateLayout(layout: Layout, level: Level): LayoutCheck {
  const errors: LayoutError[] = []
  layout.elements.forEach(({ id, widthM }, index) => {
    if (!level.allowedElements.includes(id)) errors.push({ kind: 'not-allowed', index, id })
    const { minW, maxW } = ELEMENTS[id]
    if (!(widthM >= minW && widthM <= maxW)) errors.push({ kind: 'out-of-range', index, id, widthM, minW, maxW })
  })

  const totalWidthM = round(layout.elements.reduce((sum, e) => sum + e.widthM, 0))
  const unusedWidthM = round(level.corridor.widthM - totalWidthM)
  if (unusedWidthM < 0) errors.push({ kind: 'over-width', overByM: -unusedWidthM })

  return { valid: errors.length === 0, totalWidthM, unusedWidthM: Math.max(0, unusedWidthM), errors }
}
