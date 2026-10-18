import { MODES, previewTraffic, type Corridor, type Layout, type Mode } from '@road-diet/shared'
import type { CSSProperties, ReactNode } from 'react'

const MAX_OBJECTS = 24
const SHARED = new Set(['sidewalk', 'bike_painted', 'bike_protected'])
/** Each shape's length plus a gap, so a full lane reads as bumper to bumper instead of overlapping. */
const SPACING: Record<Mode, number> = { car: 28, bus: 44, bike: 26, walk: 20 }
/** Off-strip run-up at each end; matches the 24px in the strip-drive keyframes. */
const LOOP_PAD = 24

// Top-down shapes, nose pointing down (the strip's direction of travel); CSS flips the ones going up.
const SHAPES: Record<Mode, ReactNode> = {
  car: (
    <>
      <rect x={-6} y={-10} width={12} height={20} rx={4} fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth={1.8} />
      <rect x={-4} y={2} width={8} height={4} rx={1} fill="var(--color-ink)" />
    </>
  ),
  bus: (
    <>
      <rect x={-6.5} y={-17} width={13} height={34} rx={3} fill="var(--color-loading)" stroke="var(--color-ink)" strokeWidth={1.8} />
      <rect x={-4.5} y={10} width={9} height={4} rx={1} fill="var(--color-ink)" />
    </>
  ),
  bike: (
    <>
      <path d="M0 -9 V9" stroke="var(--color-ink)" strokeWidth={2.4} strokeLinecap="round" />
      <ellipse cx={0} cy={-1} rx={4} ry={3} fill="var(--color-bike-painted)" stroke="var(--color-ink)" strokeWidth={1.5} />
    </>
  ),
  walk: (
    <>
      <ellipse cx={0} cy={0} rx={7} ry={4.5} fill="var(--color-patio)" stroke="var(--color-ink)" strokeWidth={1.5} />
      <circle cx={0} cy={0} r={3.2} fill="var(--color-ink)" />
    </>
  ),
}

/** One moving object inside a lane: `dxM` is its centre from the lane's left edge. */
export type Mover = { key: string; mode: Mode; dxM: number; up: boolean; style: CSSProperties }

/**
 * Live, illustrative traffic for each element of the editor: objects per mode and their speeds come from
 * previewTraffic, so removing a lane visibly changes who moves and how fast. Decorative; never feeds the score.
 */
export function laneTraffic(layout: Layout, corridor: Corridor, height: number): Mover[][] {
  const preview = previewTraffic(layout, corridor, MAX_OBJECTS)
  const starts: number[] = []
  layout.elements.reduce((offset, el) => (starts.push(offset), offset + el.widthM), 0)
  const mid = corridor.widthM / 2
  const byLane: Mover[][] = layout.elements.map(() => [])
  for (const mode of MODES) {
    const { count, lanes, speedMps } = preview[mode]
    // Not to scale: a 2.5 s floor keeps fast cars readable, a 22 s cap keeps walkers visibly moving.
    const dur = Math.min(22, Math.max(2.5, 30 / Math.max(speedMps, 0.1)))
    for (let k = 0; k < count; k++) {
      const lane = lanes[k % lanes.length]
      const el = layout.elements[lane]
      const nth = Math.floor(k / lanes.length)
      const shared = SHARED.has(el.id)
      const fits = Math.floor((height + 2 * LOOP_PAD) / SPACING[mode]) * (shared ? 2 : 1)
      if (nth >= fits) continue
      const inLane = Math.min(fits, Math.ceil((count - (k % lanes.length)) / lanes.length))
      const up = shared ? nth % 2 === 1 : starts[lane] + el.widthM / 2 > mid
      const at = (nth + 0.5) / inLane
      const style = { '--dur': `${dur}s`, '--delay': `${-dur * at}s`, '--at': at, '--h': `${height}px`, animationDirection: up ? 'reverse' : 'normal' } as CSSProperties
      byLane[lane].push({ key: `${mode}-${k}`, mode, dxM: el.widthM / 2 + (shared ? ((up ? 1 : -1) * el.widthM) / 4 : 0), up, style })
    }
  }
  return byLane
}

/** Draws one lane's movers, clipped to a `w` × `h` box at the origin. */
export function Movers({ movers, w, h, pxPerM }: { movers: Mover[]; w: number; h: number; pxPerM: number }) {
  return (
    <svg width={Math.max(0, w)} height={h} overflow="hidden" aria-hidden pointerEvents="none">
      {movers.map((m) => (
        <g key={m.key} transform={`translate(${m.dxM * pxPerM} 0)`}>
          <g className="strip-move" style={m.style}>
            <g transform={m.up ? 'rotate(180)' : undefined}>{SHAPES[m.mode]}</g>
          </g>
        </g>
      ))}
    </svg>
  )
}
