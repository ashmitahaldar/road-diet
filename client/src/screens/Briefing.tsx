import { ELEMENTS, PERSONAS, TODO_SOURCE, type Level } from '@road-diet/shared'
import { ElementIcon, VISUALS } from '../editor/elementVisuals'
import { Button } from '../ui'

const MAPS = import.meta.glob<string>('../../../data/corridors/*.map.svg', { query: '?url', import: 'default', eager: true })
const MAP_SOURCES = /Centreline|Cycling|Killed|OpenStreetMap/

/** Legend swatches drawn with the same strokes as prep.py render_map, so the key matches the map. */
const LEGEND: [string, { stroke: string; width: number; dash?: string; casing?: boolean }?][] = [
  ['This level’s street', { stroke: 'var(--color-primary)', width: 6, casing: true }],
  ['Protected bike lane', { stroke: 'var(--color-bike-protected)', width: 3 }],
  ['Painted bike lane', { stroke: 'var(--color-bike-painted)', width: 3, dash: '6 4' }],
  ['Other cycling route', { stroke: 'var(--color-planter)', width: 3, dash: '1 4' }],
  ['Other streets', { stroke: 'var(--color-sidewalk)', width: 3 }],
  ['Subway station'],
]

function CorridorMap({ corridor }: { corridor: Level['corridor'] }) {
  const src = corridor.mapSvg && MAPS[`../../../${corridor.mapSvg}`]
  if (!src) return null
  return (
    <section aria-labelledby="map-title" className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
      <h2 id="map-title" className="font-display text-2xl font-semibold">
        Where it is
      </h2>
      <img src={src} alt={corridor.mapAlt ?? ''} loading="lazy" decoding="async" className="mt-3 w-full rounded-xl border-2 border-ink" />
      <ul aria-label="Map legend" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {LEGEND.map(([label, line]) => (
          <li key={label} className="flex items-center gap-2">
            <svg aria-hidden width="28" height="14" viewBox="0 0 28 14">
              {line ? (
                <>
                  {line.casing && <path d="M3 7h22" stroke="var(--color-ink)" strokeWidth={line.width + 3} strokeLinecap="round" />}
                  <path d="M3 7h22" stroke={line.stroke} strokeWidth={line.width} strokeDasharray={line.dash} strokeLinecap="round" />
                </>
              ) : (
                <circle cx="14" cy="7" r="5" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth={2.5} />
              )}
            </svg>
            {label}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm">
        Collisions are a total for the whole stretch, not individual incidents. Map data:{' '}
        {corridor.sources
          .filter((s) => MAP_SOURCES.test(s.label))
          .map((s, i, all) => (
            <span key={s.url}>
              <a href={s.url} className="font-semibold text-primary underline underline-offset-2">
                {s.label === 'OpenStreetMap contributors' ? '© OpenStreetMap contributors' : s.label}
              </a>
              {i < all.length - 1 ? ', ' : '.'}
            </span>
          ))}
      </p>
    </section>
  )
}

export function goalSentence(level: Level) {
  const { minEmissionsReductionPct, minHappiness, minSafety } = level.goal
  const parts = [
    minEmissionsReductionPct !== undefined && `cut emissions by at least ${minEmissionsReductionPct}%`,
    minSafety !== undefined && `reach a safety score of ${minSafety}`,
    minHappiness !== undefined && `keep every resident at least ${minHappiness} happy`,
  ].filter(Boolean) as string[]
  const s = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : (parts[0] ?? 'design the street you want')
  return `${s[0].toUpperCase()}${s.slice(1)}.`
}

export function Briefing({ level, onStart, onBack }: { level: Level; onStart: () => void; onBack: () => void }) {
  const { corridor } = level
  const steps: [string, string][] = [
    ['Build', `Fit sidewalks, lanes, parking and trees into ${corridor.widthM} m. Add, resize, move or remove pieces.`],
    ['Run a day', 'See emissions, safety, trip times and how four residents feel.'],
    ['Earn stars', `★ meet the goal · ★★ + safety ${level.stars.safety} · ★★★ + everyone ${level.stars.fairness} happy`],
  ]
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <p className="font-display text-lg font-semibold text-primary">Level 1</p>
        <h1 tabIndex={-1} className="font-display text-4xl font-semibold outline-none sm:text-5xl">
          {level.name}
        </h1>
      </div>

      <section aria-labelledby="how-title">
        <h2 id="how-title" className="font-display text-2xl font-semibold">
          How to play
        </h2>
        <ol className="mt-2 grid gap-3 sm:grid-cols-3">
          {steps.map(([title, text], i) => (
            <li key={title} className="flex gap-3 rounded-2xl border-2 border-ink bg-paper p-3 shadow-[4px_4px_0_var(--color-ink)] sm:flex-col sm:gap-1">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-semibold text-paper">
                {i + 1}
              </span>
              <span>
                <strong className="font-display text-lg">{title}</strong>
                <span className="block text-sm">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border-2 border-ink bg-loading/30 p-4">
        <h2 className="font-display text-xl font-semibold">Your goal</h2>
        <p className="text-lg">{goalSentence(level)}</p>
      </section>

      <section aria-labelledby="today-title">
        <h2 id="today-title" className="font-display text-xl font-semibold">
          The street today
        </h2>
        <div aria-label="Today's street" role="img" className="mt-2 flex h-16 overflow-hidden rounded-2xl border-2 border-ink bg-paper">
          {corridor.baselineLayout.elements.map((el, i) => (
            <div
              key={i}
              title={`${ELEMENTS[el.id].label}, ${el.widthM} m`}
              className="grid place-items-center border-r-2 border-ink last:border-r-0"
              style={{ flexBasis: `${(el.widthM / corridor.widthM) * 100}%`, background: VISUALS[el.id].color }}
            >
              <span className="grid size-9 place-items-center rounded-full border-2 border-ink bg-paper">
                <ElementIcon id={el.id} size={24} />
              </span>
            </div>
          ))}
        </div>
        <p className="mt-1 text-sm">
          {corridor.widthM} m wide, {corridor.lengthKm} km long: {corridor.baselineLayout.elements.map((el) => `${VISUALS[el.id].short} ${el.widthM} m`).join(' · ')}
        </p>
        {corridor.source === TODO_SOURCE && <p className="mt-1 text-sm">Placeholder numbers until the real Toronto data is added.</p>}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onStart} className="min-h-14 bg-primary px-8 text-xl text-paper shadow-[4px_4px_0_var(--color-ink)] hover:bg-primary hover:brightness-110">
          Start editing
        </Button>
        <Button onClick={onBack} className="min-h-14 px-6">
          Back
        </Button>
      </div>

      <CorridorMap corridor={corridor} />

      <section>
        <h2 className="font-display text-2xl font-semibold">Who uses this street</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {Object.values(PERSONAS).map((p) => (
            <li key={p.id} className="rounded-xl border-2 border-ink bg-paper px-3 py-2">
              <strong>{p.name}</strong>. {p.blurb}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
