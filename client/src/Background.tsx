import type { CSSProperties } from 'react'

const ink = { stroke: 'var(--color-ink)', strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

export function SideCar({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 30" className={className}>
      <path d="M4 23 V17 Q4 13 9 12 L17 11 L23 4 Q25 2 29 2 H42 Q46 2 48 5 L53 11 L58 12 Q62 13 62 18 V23 Z" fill={color} {...ink} />
      <path d="M25 5 H34 V11 H20 Z M37 5 H44 L49 11 H37 Z" fill="var(--color-paper)" {...ink} strokeWidth={1.5} />
      {[16, 50].map((x) => (
        <g key={x}>
          <circle cx={x} cy={23} r={5.5} fill="var(--color-ink)" />
          <circle cx={x} cy={23} r={2} fill="var(--color-grid)" />
        </g>
      ))}
    </svg>
  )
}

export function SideBus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 46" className={className}>
      <rect x={2} y={2} width={116} height={34} rx={7} fill="var(--color-bus)" {...ink} />
      {[10, 30, 50, 70, 90].map((x) => (
        <rect key={x} x={x} y={8} width={14} height={12} rx={2} fill="var(--color-paper)" {...ink} strokeWidth={1.5} />
      ))}
      <rect x={106} y={8} width={8} height={22} rx={2} fill="var(--color-paper)" {...ink} strokeWidth={1.5} />
      <path d="M2 26 H104" stroke="var(--color-paper)" strokeWidth={3} />
      {[26, 94].map((x) => (
        <g key={x}>
          <circle cx={x} cy={37} r={6.5} fill="var(--color-ink)" />
          <circle cx={x} cy={37} r={2.4} fill="var(--color-grid)" />
        </g>
      ))}
    </svg>
  )
}

export function SideBike({ shirt, className }: { shirt: string; className?: string }) {
  return (
    <svg viewBox="0 0 44 40" className={className}>
      <circle cx={10} cy={30} r={8} fill="none" {...ink} />
      <circle cx={34} cy={30} r={8} fill="none" {...ink} />
      <path d="M10 30 L19 18 H31 L34 30 M19 18 L22 30 L31 18 M29 13 H34" fill="none" {...ink} />
      <path d="M20 17 L23 8 L31 14" fill="none" stroke={shirt} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 17 L25 24 L22 30" fill="none" {...ink} strokeWidth={2.5} />
      <circle cx={24} cy={4.5} r={3.8} fill="var(--color-skin-2)" {...ink} strokeWidth={1.5} />
    </svg>
  )
}

export function Walker({ shirt, skin, className }: { shirt: string; skin: string; className?: string }) {
  return (
    <svg viewBox="0 0 20 38" className={className}>
      <g className="bg-bob">
        <path d="M8 24 L6 36 M12 24 L14 36" {...ink} strokeWidth={3} />
        <rect x={4.5} y={11} width={11} height={15} rx={5} fill={shirt} {...ink} strokeWidth={1.5} />
        <circle cx={10} cy={6} r={4.5} fill={skin} {...ink} strokeWidth={1.5} />
      </g>
    </svg>
  )
}

/** `lane` 0 drives right on the far side, 1 drives left on the near side, 2 walks the sidewalk. `at` staggers the start. */
const TRAFFIC: { kind: 'car' | 'bus' | 'bike' | 'walk'; color: string; lane: 0 | 1 | 2; dur: number; at: number }[] = [
  { kind: 'bus', color: '', lane: 0, dur: 34, at: 0.15 },
  { kind: 'car', color: 'var(--color-primary)', lane: 0, dur: 24, at: 0.62 },
  { kind: 'car', color: 'var(--color-patio)', lane: 1, dur: 26, at: 0.3 },
  { kind: 'bike', color: 'var(--color-meter-safety)', lane: 1, dur: 40, at: 0.82 },
  { kind: 'walk', color: 'var(--color-planter)', lane: 2, dur: 75, at: 0.45 },
  { kind: 'walk', color: 'var(--color-meter-travel)', lane: 2, dur: 90, at: 0.05 },
]
const SKINS = ['var(--color-skin-1)', 'var(--color-skin-3)']
const CLOUDS = [
  { top: '8%', w: 140, dur: 90, at: 0.2 },
  { top: '18%', w: 90, dur: 120, at: 0.65 },
  { top: '4%', w: 110, dur: 105, at: 0.9 },
]
/** [height, wall colour, awning colour] for each shopfront, left to right. */
const BUILDINGS: [number, string, string][] = [
  [96, 'var(--color-grid)', 'var(--color-patio)'],
  [128, 'var(--color-sidewalk)', 'var(--color-primary)'],
  [84, 'var(--color-grid)', 'var(--color-planter)'],
  [140, 'var(--color-grid)', 'var(--color-bus)'],
  [104, 'var(--color-sidewalk)', 'var(--color-loading)'],
  [120, 'var(--color-grid)', 'var(--color-meter-safety)'],
  [90, 'var(--color-grid)', 'var(--color-patio)'],
  [136, 'var(--color-sidewalk)', 'var(--color-planter)'],
  [100, 'var(--color-grid)', 'var(--color-primary)'],
  [124, 'var(--color-grid)', 'var(--color-loading)'],
  [88, 'var(--color-sidewalk)', 'var(--color-bus)'],
  [132, 'var(--color-grid)', 'var(--color-meter-travel)'],
  [98, 'var(--color-grid)', 'var(--color-patio)'],
  [116, 'var(--color-sidewalk)', 'var(--color-planter)'],
  [92, 'var(--color-grid)', 'var(--color-primary)'],
  [130, 'var(--color-grid)', 'var(--color-loading)'],
]
const soft = { stroke: 'var(--color-ink)', strokeOpacity: 0.25, strokeWidth: 2 } as const

const moving = (dur: number, at: number, reverse = false): CSSProperties =>
  ({ '--dur': `${dur}s`, '--delay': `${-dur * at}s`, '--at': at, '--flip': reverse ? -1 : 1, animationDirection: reverse ? 'reverse' : 'normal' }) as CSSProperties

export function Shopfront({ h, wall, awning }: { h: number; wall: string; awning: string }) {
  const floors = Math.floor((h - 50) / 26)
  return (
    <>
      <rect width={92} height={h} rx={4} fill={wall} {...soft} />
      <rect x={-3} width={98} height={8} rx={3} fill={wall} {...soft} />
      {Array.from({ length: floors }, (_, r) => (
        <g key={r} fill="var(--color-paper)" {...soft} strokeWidth={1.5}>
          <rect x={14} y={16 + r * 26} width={20} height={14} rx={2} />
          <rect x={58} y={16 + r * 26} width={20} height={14} rx={2} />
        </g>
      ))}
      <rect x={10} y={h - 32} width={44} height={26} rx={2} fill="var(--color-paper)" {...soft} />
      <rect x={62} y={h - 34} width={20} height={34} rx={2} fill="var(--color-paper)" {...soft} />
      <path d={`M6 ${h - 42} H86 L82 ${h - 34} H10 Z`} fill={awning} opacity={0.75} />
    </>
  )
}

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
        {BUILDINGS.map(([h, wall, awning], i) => (
          <g key={i} transform={`translate(${i * 100 + 4} ${160 - h})`}>
            <Shopfront h={h} wall={wall} awning={awning} />
          </g>
        ))}
        {[50, 250, 450, 650, 850, 1050, 1250, 1450].map((x, i) => (
          <g key={x} transform={`translate(${x} 0)`}>
            {i % 2 ? (
              <>
                <rect x={-2} y={70} width={4} height={90} fill="var(--color-ink)" opacity={0.35} />
                <path d="M0 72 Q0 64 10 64" fill="none" stroke="var(--color-ink)" strokeOpacity={0.35} strokeWidth={3} />
                <circle cx={12} cy={66} r={4} fill="var(--color-loading)" opacity={0.8} />
              </>
            ) : (
              <>
                <rect x={-3} y={120} width={6} height={40} rx={2} fill="var(--color-car)" opacity={0.5} />
                <circle cx={0} cy={108} r={20} fill="var(--color-planter)" opacity={0.7} />
                <circle cx={-12} cy={118} r={13} fill="var(--color-planter)" opacity={0.6} />
                <circle cx={13} cy={116} r={14} fill="var(--color-planter)" opacity={0.6} />
              </>
            )}
          </g>
        ))}
      </svg>

      <div className="absolute inset-x-0 bottom-[88px] h-4 border-y-2 border-ink/20 bg-sidewalk/60" />
      <div className="absolute inset-x-0 bottom-0 h-[88px] bg-car/25">
        <div className="absolute inset-x-0 top-1/2 border-t-[3px] border-dashed border-paper" />
      </div>

      {TRAFFIC.map((v, i) => (
        <div key={i} className="bg-move absolute left-0" style={{ bottom: v.lane === 2 ? 92 : v.lane === 0 ? 46 : 6, ...moving(v.dur, v.at, v.lane === 1) }}>
          {v.kind === 'car' && <SideCar color={v.color} className="h-8 w-auto" />}
          {v.kind === 'bus' && <SideBus className="h-10 w-auto" />}
          {v.kind === 'bike' && <SideBike shirt={v.color} className="h-9 w-auto" />}
          {v.kind === 'walk' && <Walker shirt={v.color} skin={SKINS[i % 2]} className="h-8 w-auto" />}
        </div>
      ))}
    </div>
  )
}
