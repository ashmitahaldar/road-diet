import type { CSSProperties } from 'react'
import { ElementIcon } from './editor/elementVisuals'
import type { ElementId } from '@road-diet/shared'

// Lane 0 drives right, lane 1 drives left. `at` is where it starts (0-1) so the scene is already busy on load.
const TRAFFIC: { id: ElementId; lane: 0 | 1 | 2; dur: number; at: number }[] = [
  { id: 'bus_lane', lane: 0, dur: 30, at: 0.15 },
  { id: 'car_lane', lane: 0, dur: 22, at: 0.6 },
  { id: 'bike_painted', lane: 1, dur: 38, at: 0.35 },
  { id: 'car_lane', lane: 1, dur: 24, at: 0.85 },
  { id: 'sidewalk', lane: 2, dur: 70, at: 0.5 },
  { id: 'sidewalk', lane: 2, dur: 80, at: 0.05 },
]
const CLOUDS = [
  { top: '8%', w: 140, dur: 90, at: 0.2 },
  { top: '18%', w: 90, dur: 120, at: 0.65 },
  { top: '4%', w: 110, dur: 105, at: 0.9 },
]
const BUILDINGS = [60, 110, 80, 140, 70, 100, 150, 90, 120, 65, 130, 85, 105, 75, 145, 95]

const moving = (dur: number, at: number, reverse = false): CSSProperties =>
  ({ '--dur': `${dur}s`, '--delay': `${-dur * at}s`, '--at': at, animationName: reverse ? 'bg-drive-back' : 'bg-drive' }) as CSSProperties

/** Decorative city scene behind every screen. Pure CSS animation; static under prefers-reduced-motion. */
export function Background({ subtle }: { subtle: boolean }) {
  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-opacity duration-500 ${subtle ? 'opacity-35' : 'opacity-100'}`}>
      {CLOUDS.map((c, i) => (
        <svg key={i} viewBox="0 0 100 40" width={c.w} className="bg-move absolute left-0" style={{ top: c.top, ...moving(c.dur, c.at) }}>
          <path d="M15 35 a12 12 0 0 1 4-23 a16 16 0 0 1 30-4 a14 14 0 0 1 26 6 a11 11 0 0 1 10 21 z" fill="var(--color-paper)" stroke="var(--color-ink)" strokeOpacity={0.25} strokeWidth={2} />
        </svg>
      ))}

      <svg viewBox="0 0 1600 160" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-[104px] h-40 w-full">
        {BUILDINGS.map((h, i) => (
          <g key={i} transform={`translate(${i * 100 + 8} ${160 - h})`}>
            <rect width={84} height={h} rx={6} fill="var(--color-grid)" stroke="var(--color-ink)" strokeOpacity={0.2} strokeWidth={2} />
            {Array.from({ length: Math.floor((h - 20) / 28) }, (_, r) => (
              <g key={r} fill="var(--color-paper)">
                <rect x={14} y={16 + r * 28} width={18} height={12} rx={2} />
                <rect x={52} y={16 + r * 28} width={18} height={12} rx={2} />
              </g>
            ))}
          </g>
        ))}
      </svg>

      <div className="absolute inset-x-0 bottom-[88px] h-4 border-y-2 border-ink/20 bg-sidewalk/60" />
      <div className="absolute inset-x-0 bottom-0 h-[88px] bg-car/25">
        <div className="absolute inset-x-0 top-1/2 border-t-[3px] border-dashed border-paper" />
      </div>

      {TRAFFIC.map((v, i) => (
        <div
          key={i}
          className="bg-move absolute left-0 grid size-11 place-items-center rounded-full border-2 border-ink/40 bg-paper"
          style={{ bottom: v.lane === 2 ? 82 : v.lane === 0 ? 48 : 4, ...moving(v.dur, v.at, v.lane === 1) }}
        >
          <ElementIcon id={v.id} size={28} />
        </div>
      ))}
    </div>
  )
}
