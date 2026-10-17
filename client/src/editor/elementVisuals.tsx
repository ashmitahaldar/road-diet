import type { ElementId } from '@road-diet/shared'
import type { ReactNode } from 'react'

// Colour + pattern + icon + text for every element, so nothing relies on colour alone (spec 8b).
// `raised` elements sit at curb height; the rest are at road level.
export const VISUALS: Record<
  ElementId,
  { color: string; short: string; raised: boolean; pattern?: 'hatch' | 'dots'; edge?: 'dashed' | 'barrier' }
> = {
  sidewalk: { color: 'var(--color-sidewalk)', short: 'Sidewalk', raised: true },
  bike_painted: { color: 'var(--color-bike-painted)', short: 'Painted bike', raised: false, edge: 'dashed' },
  bike_protected: { color: 'var(--color-bike-protected)', short: 'Protected', raised: false, edge: 'barrier' },
  bus_lane: { color: 'var(--color-bus)', short: 'Bus', raised: false },
  car_lane: { color: 'var(--color-car)', short: 'Car', raised: false },
  parking: { color: 'var(--color-parking)', short: 'Parking', raised: false, pattern: 'hatch' },
  loading: { color: 'var(--color-loading)', short: 'Loading', raised: false },
  planter: { color: 'var(--color-planter)', short: 'Trees', raised: true, pattern: 'dots' },
  patio: { color: 'var(--color-patio)', short: 'Patio', raised: true },
}

const stroke = { fill: 'none', stroke: 'var(--color-ink)', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const wheel = (cx: number, cy: number, r = 3) => <circle cx={cx} cy={cy} r={r} fill="var(--color-ink)" />

// Flat side-view icons on a 32x32 grid.
const ICONS: Record<ElementId, ReactNode> = {
  sidewalk: (
    <g {...stroke}>
      <circle cx={16} cy={6} r={3} fill="var(--color-ink)" />
      <path d="M16 10 L15 19 L11 28 M15 19 L20 28 M16 12 L11 17 M16 12 L21 16" />
    </g>
  ),
  bike_painted: <BikeIcon />,
  bike_protected: <BikeIcon />,
  bus_lane: (
    <g {...stroke}>
      <rect x={3} y={5} width={26} height={19} rx={3} fill="var(--color-paper)" />
      <rect x={6} y={8} width={20} height={6} rx={1} />
      <path d="M3 18 H29" />
      {wheel(9, 25)}
      {wheel(23, 25)}
    </g>
  ),
  car_lane: (
    <g {...stroke}>
      <path d="M3 22 V17 Q3 15 5 15 H8 L11 9 H21 L25 15 H27 Q29 15 29 17 V22 Z" fill="var(--color-paper)" />
      <path d="M12 15 L13.5 11 H19.5 L21.5 15 Z" />
      {wheel(9, 23)}
      {wheel(23, 23)}
    </g>
  ),
  parking: (
    <text x={16} y={17} textAnchor="middle" dominantBaseline="central" fontSize={24} fontWeight={800} fill="var(--color-ink)" fontFamily="var(--font-sans)">
      P
    </text>
  ),
  loading: (
    <g {...stroke}>
      <rect x={5} y={9} width={22} height={17} rx={1} fill="var(--color-paper)" />
      <path d="M5 14 H27 M16 9 V14" />
    </g>
  ),
  planter: (
    <g {...stroke}>
      <path d="M16 20 V29" strokeWidth={3.5} />
      <circle cx={16} cy={12} r={9} fill="var(--color-paper)" />
      <path d="M12 12 Q16 8 20 12" />
    </g>
  ),
  patio: (
    <g {...stroke}>
      <path d="M4 11 Q16 1 28 11 Z" fill="var(--color-paper)" />
      <path d="M16 11 V27 M8 18 H24 M11 27 H21" />
    </g>
  ),
}

function BikeIcon() {
  return (
    <g {...stroke}>
      <circle cx={8} cy={21} r={6} />
      <circle cx={24} cy={21} r={6} />
      <path d="M8 21 L13 12 H22 L24 21 M13 12 L17 21 L22 12 M11 9 H15 M21 8 L22 12" />
    </g>
  )
}

/** The element's icon as a standalone <svg>; works inside HTML or nested in another SVG. */
export function ElementIcon({ id, size = 32, x, y }: { id: ElementId; size?: number; x?: number; y?: number }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      {ICONS[id]}
    </svg>
  )
}

export function SvgPatterns() {
  return (
    <defs>
      <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="10" stroke="var(--color-ink)" strokeOpacity="0.25" strokeWidth="3" />
      </pattern>
      <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="7" cy="7" r="2.5" fill="var(--color-paper)" fillOpacity="0.5" />
      </pattern>
    </defs>
  )
}
