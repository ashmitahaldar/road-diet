import { ELEMENTS, TODO_SOURCE, type Level } from '@road-diet/shared'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { ElementIcon, VISUALS } from '../editor/elementVisuals'
import { Button, StepNav } from '../ui'

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
    <>
      <img src={src} alt={corridor.mapAlt ?? ''} decoding="async" className="w-full rounded-xl border-2 border-ink" />
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
    </>
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
  const [step, setStep] = useState(0)
  const play: [string, string][] = [
    ['Build', `Fit sidewalks, lanes, parking and trees into ${corridor.widthM} m.`],
    ['Run a day', 'See emissions, safety and trip times, and hear from the residents.'],
    ['Earn stars', `★ goal · ★★ + safety ${level.stars.safety} · ★★★ + everyone ${level.stars.fairness} happy`],
  ]
  const steps: { title: string; body: ReactNode }[] = [
    {
      title: 'How to play',
      body: (
        <ol className="flex flex-col gap-3">
          {play.map(([title, text], i) => (
            <li key={title} className="flex items-center gap-3">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-semibold text-paper">
                {i + 1}
              </span>
              <span>
                <strong className="font-display text-xl">{title}</strong>
                <span className="block">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      ),
    },
    {
      title: 'The street today',
      body: (
        <>
          <div aria-label="Today's street" role="img" className="flex h-20 overflow-hidden rounded-2xl border-2 border-ink bg-paper">
            {corridor.baselineLayout.elements.map((el, i) => (
              <div
                key={i}
                title={`${ELEMENTS[el.id].label}, ${el.widthM} m`}
                className="flex flex-col items-center justify-center gap-0.5 border-r-2 border-ink last:border-r-0"
                style={{ flexBasis: `${(el.widthM / corridor.widthM) * 100}%`, background: VISUALS[el.id].color }}
              >
                <span className="grid size-9 place-items-center rounded-full border-2 border-ink bg-paper">
                  <ElementIcon id={el.id} size={24} />
                </span>
                <span className="rounded bg-paper px-1 text-xs font-semibold tabular-nums">{el.widthM}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-lg">
            {corridor.widthM} m wide and {corridor.lengthKm} km long. Every metre already has a job, so anything new has to fit inside.
          </p>
          <p className="mt-1 text-sm">{corridor.baselineLayout.elements.map((el) => `${VISUALS[el.id].short} ${el.widthM} m`).join(' · ')}</p>
          {corridor.source === TODO_SOURCE && <p className="mt-1 text-sm">Placeholder numbers until the real Toronto data is added.</p>}
        </>
      ),
    },
    ...(corridor.mapSvg ? [{ title: 'Where it is', body: <CorridorMap corridor={corridor} /> }] : []),
  ]
  const last = step === steps.length - 1

  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col justify-center gap-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-72">
          <p className="font-display text-lg font-semibold text-primary">Level 1</p>
          <h1 tabIndex={-1} className="font-display text-3xl font-semibold outline-none sm:text-4xl">
            {level.name}
          </h1>
        </div>
        <Button onClick={onStart} className="shrink-0">
          Skip to the street
        </Button>
      </div>

      <p className="rounded-2xl border-2 border-ink bg-loading/30 px-4 py-3 text-lg">
        <strong>Your goal:</strong> {goalSentence(level)}
      </p>

      <section aria-labelledby="step-title" className="rounded-3xl border-2 border-ink bg-paper p-5 shadow-[6px_6px_0_var(--color-ink)] sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
            <h2 id="step-title" className="mb-3 font-display text-2xl font-semibold">
              {steps[step].title}
            </h2>
            {steps[step].body}
          </motion.div>
        </AnimatePresence>
      </section>

      <StepNav step={step} count={steps.length} onBack={() => (step === 0 ? onBack() : setStep(step - 1))} onNext={() => (last ? onStart() : setStep(step + 1))} last="Start editing" />
    </main>
  )
}
