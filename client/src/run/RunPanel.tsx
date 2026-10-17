import { PERSONAS, type ElementId, type Level, type Metrics, type Mode, type Persona, type PersonaId, type ReactResult, type Reaction } from '@road-diet/shared'
import { motion, useReducedMotion } from 'motion/react'
import { ElementIcon } from '../editor/elementVisuals'
import { Button, GeminiLabel, signed } from '../ui'

export const RUN_MS = 3200

const ACCENT: Record<PersonaId, string> = {
  driver_delivery: 'var(--color-loading)',
  student_cyclist: 'var(--color-bike-painted)',
  senior_walker: 'var(--color-sidewalk)',
  shop_owner: 'var(--color-patio)',
}
const MODE_ICON: Record<Mode, ElementId> = { car: 'car_lane', bus: 'bus_lane', bike: 'bike_painted', walk: 'sidewalk' }
const MODE_WORD: Record<Mode, string> = { car: 'drives', bus: 'rides the bus', bike: 'bikes', walk: 'walks' }

/** Shown state: today's street before the first run, then the latest run. `react` is null while /api/react is pending. */
export type Shown = { metrics: Metrics; kind: 'today' | 'run' | 'stale'; react?: ReactResult | null }

type Props = { level: Level; base: Metrics; shown: Shown; running: boolean; runId: number; onRun: () => void; onShowScore: () => void }

const mean = (r: Record<PersonaId, number>) => Object.values(r).reduce((a, b) => a + b, 0) / Object.keys(r).length

export function RunPanel({ level, base, shown, running, runId, onRun, onShowScore }: Props) {
  const m = shown.metrics
  const { goal } = level
  const travel = mean(m.travelTimeMin)
  const emissionsScale = Math.max(40, 2 * (goal.minEmissionsReductionPct ?? 0))
  const caption = {
    today: "Today's street. Change it, then press Run a day.",
    run: 'Your street after one day.',
    stale: 'You changed the street. Run a day again to update.',
  }[shown.kind]

  return (
    <aside aria-labelledby="run-title" className="flex flex-col gap-4">
      <Button
        onClick={onRun}
        disabled={running}
        className="fixed inset-x-4 bottom-3 z-10 min-h-14 bg-primary text-xl text-paper shadow-[4px_4px_0_var(--color-ink)] hover:bg-primary hover:brightness-110 disabled:hover:bg-primary xl:static"
      >
        {running ? 'Running…' : shown.kind === 'today' ? 'Run a day' : 'Run another day'}
      </Button>

      <section className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <h2 id="run-title" className="font-display text-xl font-semibold">
          Meters
        </h2>
        <p className={`mb-3 text-sm ${shown.kind === 'stale' ? 'font-semibold' : ''}`}>
          {caption}{' '}
          {shown.kind === 'run' && !running && (
            <button type="button" onClick={onShowScore} className="font-semibold text-primary underline underline-offset-2">
              See scorecard
            </button>
          )}
        </p>
        <div className={`flex flex-col gap-3 transition-opacity ${shown.kind === 'stale' ? 'opacity-60' : ''}`}>
          <Meter
            label="Emissions cut"
            color="var(--color-meter-emissions)"
            value={`${m.emissionsReductionPct.toFixed(1)}%`}
            detail={`${m.emissionsKgPerHour.toFixed(0)} kg CO₂e/h${goal.minEmissionsReductionPct ? ` · goal ${goal.minEmissionsReductionPct}%` : ''}`}
            fill={m.emissionsReductionPct / emissionsScale}
            mark={goal.minEmissionsReductionPct && goal.minEmissionsReductionPct / emissionsScale}
          />
          <Meter
            label="Safety"
            color="var(--color-meter-safety)"
            value={`${m.safetyScore.toFixed(0)}/100`}
            detail={`${signed(m.safetyScore - base.safetyScore, 0)} vs today`}
            fill={m.safetyScore / 100}
            mark={goal.minSafety && goal.minSafety / 100}
          />
          <Meter
            label="Travel time"
            color="var(--color-meter-travel)"
            value={`${travel.toFixed(1)} min`}
            detail={`average trip · ${signed(travel - mean(base.travelTimeMin))} min vs today`}
          />
          <Meter
            label="Fairness"
            color="var(--color-meter-fairness)"
            value={`${m.fairness.toFixed(0)}/100`}
            detail={`lowest resident happiness${goal.minHappiness ? ` · goal ${goal.minHappiness}` : ''}`}
            fill={m.fairness / 100}
            mark={goal.minHappiness && goal.minHappiness / 100}
          />
        </div>
      </section>

      <section aria-labelledby="residents-title">
        <h2 id="residents-title" className="font-display text-xl font-semibold">
          Residents
        </h2>
        <p className="mb-2 flex flex-wrap items-center gap-2 text-sm">
          Fictional residents who use this street.
          {shown.react?.reactions.every((r) => r.source === 'gemini') && !running && <GeminiLabel />}
        </p>
        <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 xl:mx-0 xl:flex-col xl:overflow-visible xl:px-0">
          {Object.values(PERSONAS).map((p) => (
            <PersonaCard
              key={p.id}
              p={p}
              m={m}
              base={base}
              running={running}
              runId={runId}
              reaction={shown.kind === 'today' ? undefined : (shown.react?.reactions.find((r) => r.personaId === p.id) ?? 'loading')}
            />
          ))}
        </ul>
      </section>

      <p aria-live="polite" className="sr-only">
        {shown.kind === 'run' && !running
          ? `Day complete. Emissions cut ${m.emissionsReductionPct.toFixed(1)} percent, safety ${m.safetyScore.toFixed(0)}, lowest happiness ${m.fairness.toFixed(0)}.`
          : ''}
      </p>
      <p aria-live="polite" className="sr-only">
        {shown.kind === 'run' && !running && shown.react
          ? shown.react.reactions.map((r) => `${PERSONAS[r.personaId].name} says: ${r.line}`).join(' ')
          : ''}
      </p>
    </aside>
  )
}

function Meter({ label, color, value, detail, fill, mark }: { label: string; color: string; value: string; detail: string; fill?: number; mark?: number }) {
  const reduce = useReducedMotion()
  const pct = (x: number) => `${Math.max(0, Math.min(1, x)) * 100}%`
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{label}</span>
        <span className="font-display text-lg font-semibold tabular-nums">{value}</span>
      </div>
      {fill !== undefined && (
      <div className="relative h-4 overflow-hidden rounded-full border-2 border-ink bg-grid">
        <motion.div
          className="h-full rounded-r-full"
          style={{ background: color }}
          initial={false}
          animate={{ width: pct(fill) }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
        />
        {mark !== undefined && mark > 0 && <div aria-hidden className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: pct(mark) }} />}
      </div>
      )}
      <p className="mt-0.5 text-sm tabular-nums">{detail}</p>
    </div>
  )
}

function mood(h: number) {
  if (h >= 60) return { word: 'Happy', mouth: 'M10 19 Q16 24 22 19' }
  if (h >= 40) return { word: 'Okay', mouth: 'M10 20 H22' }
  return { word: 'Unhappy', mouth: 'M10 22 Q16 17 22 22' }
}

type CardProps = { p: Persona; m: Metrics; base: Metrics; running: boolean; runId: number; reaction?: Reaction | 'loading' }

function PersonaCard({ p, m, base, running, runId, reaction }: CardProps) {
  const reduce = useReducedMotion()
  const h = m.happiness[p.id]
  const t = m.travelTimeMin[p.id]
  const { word, mouth } = mood(h)
  const tripMs = (RUN_MS - 400) * Math.min(1, t / Math.max(...Object.values(m.travelTimeMin)))
  return (
    <li className="relative w-64 shrink-0 snap-start rounded-2xl border-2 border-ink bg-paper p-3 xl:w-auto">
      <div className="flex items-center gap-3">
        <motion.svg
          key={`${runId}-${word}`}
          viewBox="0 0 32 32"
          className="size-12 shrink-0"
          aria-hidden
          initial={reduce || runId === 0 ? false : { scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 12, delay: reduce ? 0 : RUN_MS / 1000 - 0.3 }}
        >
          <circle cx={16} cy={16} r={14} fill={ACCENT[p.id]} stroke="var(--color-ink)" strokeWidth={2} />
          <circle cx={11.5} cy={13} r={1.8} fill="var(--color-ink)" />
          <circle cx={20.5} cy={13} r={1.8} fill="var(--color-ink)" />
          <path d={mouth} fill="none" stroke="var(--color-ink)" strokeWidth={2} strokeLinecap="round" />
        </motion.svg>
        <div className="min-w-0">
          <p className="font-semibold">{p.name}</p>
          <p className="text-sm tabular-nums">
            {word} · {h.toFixed(0)}/100 <span className="sr-only">happiness</span>
            {h.toFixed(0) !== base.happiness[p.id].toFixed(0) && ` (${signed(h - base.happiness[p.id], 0)})`}
          </p>
        </div>
      </div>
      {reaction && !running && <SpeechBubble key={runId} reaction={reaction} />}
      <p className="mt-2 text-sm">{p.blurb}</p>
      <p className="mt-1 text-sm tabular-nums">
        {MODE_WORD[p.trip.mode]} {p.trip.distanceKm} km · <strong>{t.toFixed(1)} min</strong>
        {Math.abs(t - base.travelTimeMin[p.id]) >= 0.05 && ` (${signed(t - base.travelTimeMin[p.id])})`}
      </p>
      <div aria-hidden className="relative mt-2 h-8 rounded-full border-2 border-ink bg-grid">
        <motion.div
          key={runId}
          className="absolute top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-paper"
          initial={{ left: runId === 0 || reduce ? 'calc(100% - 1.75rem)' : '0%' }}
          animate={{ left: 'calc(100% - 1.75rem)' }}
          transition={{ duration: running && !reduce ? tripMs / 1000 : 0, ease: 'easeInOut' }}
        >
          <ElementIcon id={MODE_ICON[p.trip.mode]} size={18} />
        </motion.div>
      </div>
    </li>
  )
}

function SpeechBubble({ reaction }: { reaction: Reaction | 'loading' }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative mt-3 rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm before:absolute before:-top-2 before:left-5 before:size-3 before:rotate-45 before:border-t-2 before:border-l-2 before:border-ink before:bg-paper"
    >
      {reaction === 'loading' ? (
        <span aria-label="Waiting for a reaction" className="inline-flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 animate-pulse rounded-full bg-ink motion-reduce:animate-none" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </span>
      ) : (
        <q>{reaction.line}</q>
      )}
    </motion.div>
  )
}
