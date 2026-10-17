import type { ElementId } from '@road-diet/shared'

// Colour + pattern + icon + text for every element, so nothing relies on colour alone (spec 8b).
export const VISUALS: Record<ElementId, { color: string; short: string; icon: string; pattern?: string; edge?: 'dashed' | 'barrier' }> = {
  sidewalk: { color: 'var(--color-sidewalk)', short: 'Sidewalk', icon: '🚶' },
  bike_painted: { color: 'var(--color-bike-painted)', short: 'Painted', icon: '🚲', edge: 'dashed' },
  bike_protected: { color: 'var(--color-bike-protected)', short: 'Protected', icon: '🚲', edge: 'barrier' },
  bus_lane: { color: 'var(--color-bus)', short: 'Bus', icon: '🚌' },
  car_lane: { color: 'var(--color-car)', short: 'Car', icon: '🚗' },
  parking: { color: 'var(--color-parking)', short: 'Parking', icon: 'P', pattern: 'hatch' },
  loading: { color: 'var(--color-loading)', short: 'Loading', icon: '📦' },
  planter: { color: 'var(--color-planter)', short: 'Trees', icon: '🌳', pattern: 'dots' },
  patio: { color: 'var(--color-patio)', short: 'Patio', icon: '☕' },
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
