import { residentsOf, type ElementId, type Layout, type Level, type Topic, type Metrics, type Mode, type Persona, type PersonaId, type ReactResult, type Reaction } from '@road-diet/shared'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { ElementIcon } from '../editor/elementVisuals'
import { Face, mood } from '../story/characters'
import { Button, GeminiLabel, signed } from '../ui'
import { WhyButton } from './Why'

export const RUN_MS = 3200

const MODE_ICON: Record<Mode, ElementId> = { car: 'car_lane', bus: 'bus_lane', bike: 'bike_painted', walk: 'sidewalk' }
const MODE_WORD: Record<Mode, string> = { car: 'drives', bus: 'rides the bus', bike: 'bikes', walk: 'walks' }

/** Shown state: today's street before the first run, then the latest run. `react` is null while /api/react is pending. */
export type Shown = { metrics: Metrics; layout: Layout; kind: 'today' | 'run' | 'stale'; react?: ReactResult | null }

const mean = (r: Record<PersonaId, number>) => Object.values(r).reduce((a, b) => a + b, 0) / Object.keys(r).length

export function RunButton({ running, kind, onRun }: { running: boolean; kind: Shown['kind']; onRun: () => void }) {
  return (
    <Button
      onClick={running ? undefined : onRun}
      // aria-disabled, not disabled: a disabled button drops keyboard focus, and the scorecard would hand it back to <body>.
      aria-disabled={running}
      className="min-h-12 w-full bg-primary text-lg text-paper shadow-[4px_4px_0_var(--color-ink)] hover:bg-primary hover:brightness-110 aria-disabled:cursor-wait aria-disabled:opacity-70"
    >
      {running ? 'Running…' : kind === 'today' ? 'Run a day' : 'Run another day'}
    </Button>
  )
}

export function MetersCard({ level, base, shown, running, onShowScore }: { level: Level; base: Metrics; shown: Shown; running: boolean; onShowScore: () => void }) {
  const m = shown.metrics
  const { goal } = level
  const travel = mean(m.travelTimeMin)
  const emissionsScale = Math.max(40, 2 * (goal.minEmissionsReductionPct ?? 0))
  const caption = { today: "Today's street.", run: 'After one day.', stale: 'Street changed. Run again to update.' }[shown.kind]
  const why = (topic: Topic, label: string) => shown.kind === 'run' && !running && <WhyButton level={level} layout={shown.layout} topic={topic} label={label} />

  return (
    <div>
      <p className={`mb-2 text-sm ${shown.kind === 'stale' ? 'font-semibold' : ''}`}>
        {caption}{' '}
        {shown.kind === 'run' && !running && (
          <button type="button" onClick={onShowScore} className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-2">
            See scorecard
          </button>
        )}
      </p>
      <div className={`flex flex-col gap-2 transition-opacity ${shown.kind === 'stale' ? 'opacity-60' : ''}`}>
        <Meter
          label="Emissions cut"
          color="var(--color-meter-emissions)"
          value={`${m.emissionsReductionPct.toFixed(1)}%`}
          detail={goal.minEmissionsReductionPct ? `goal ${goal.minEmissionsReductionPct}%` : `${m.emissionsKgPerHour.toFixed(0)} kg CO₂e/h`}
          fill={m.emissionsReductionPct / emissionsScale}
          mark={goal.minEmissionsReductionPct && goal.minEmissionsReductionPct / emissionsScale}
          why={why('emissions', 'Emissions cut')}
        />
        <Meter
          label="Safety"
          color="var(--color-meter-safety)"
          value={`${m.safetyScore.toFixed(0)}/100`}
          detail={`${signed(m.safetyScore - base.safetyScore, 0)} vs today`}
          fill={m.safetyScore / 100}
          mark={goal.minSafety && goal.minSafety / 100}
          why={why('safety', 'Safety')}
        />
        <Meter label="Average trip" color="var(--color-meter-travel)" value={`${travel.toFixed(1)} min`} detail={`${signed(travel - mean(base.travelTimeMin))} min vs today`} why={why('travel', 'Average trip')} />
        <Meter
          label="Fairness"
          color="var(--color-meter-fairness)"
          value={`${m.fairness.toFixed(0)}/100`}
          detail={`least happy resident${goal.minHappiness ? ` · goal ${goal.minHappiness}` : ''}`}
          fill={m.fairness / 100}
          mark={goal.minHappiness && goal.minHappiness / 100}
          why={why('fairness', 'Fairness')}
        />
      </div>
      <p aria-live="polite" className="sr-only">
        {shown.kind === 'run' && !running
          ? `Day complete. Emissions cut ${m.emissionsReductionPct.toFixed(1)} percent, safety ${m.safetyScore.toFixed(0)}, lowest happiness ${m.fairness.toFixed(0)}.`
          : ''}
      </p>
    </div>
  )
}

export function Residents({ level, base, shown, running, runId }: { level: Level; base: Metrics; shown: Shown; running: boolean; runId: number }) {
  const who = residentsOf(level)
  return (
    <div>
      {shown.react?.reactions.every((r) => r.source === 'gemini') && !running && <GeminiLabel />}
      <ul aria-labelledby="residents-title" className="mt-1 flex flex-col gap-2">
        {Object.values(who).map((p) => (
          <PersonaCard
            key={p.id}
            p={p}
            m={shown.metrics}
            base={base}
            running={running}
            runId={runId}
            reaction={shown.kind === 'today' ? undefined : (shown.react?.reactions.find((r) => r.personaId === p.id) ?? 'loading')}
            why={shown.kind === 'run' && !running && <WhyButton level={level} layout={shown.layout} topic={p.id} label={p.name} />}
          />
        ))}
      </ul>
      <p aria-live="polite" className="sr-only">
        {shown.kind === 'run' && !running && shown.react
          ? shown.react.reactions.map((r) => `${who[r.personaId].name} says: ${r.line}`).join(' ')
          : ''}
      </p>
    </div>
  )
}

function Meter({ label, color, value, detail, fill, mark, why }: { label: string; color: string; value: string; detail: string; fill?: number; mark?: number; why?: ReactNode }) {
  const reduce = useReducedMotion()
  const pct = (x: number) => `${Math.max(0, Math.min(1, x)) * 100}%`
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <span className="font-display font-semibold tabular-nums">{value}</span>
      </div>
      {fill !== undefined && (
      <div className="relative h-3 overflow-hidden rounded-full border-2 border-ink bg-grid">
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
      <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-2">
        <p className="text-xs tabular-nums">{detail}</p>
        {why}
      </div>
    </div>
  )
}

type CardProps = { p: Persona; m: Metrics; base: Metrics; running: boolean; runId: number; reaction?: Reaction | 'loading'; why?: ReactNode }

function PersonaCard({ p, m, base, running, runId, reaction, why }: CardProps) {
  const reduce = useReducedMotion()
  const h = m.happiness[p.id]
  const t = m.travelTimeMin[p.id]
  const { word } = mood(h)
  const tripMs = (RUN_MS - 400) * Math.min(1, t / Math.max(...Object.values(m.travelTimeMin)))
  return (
    <li className="relative rounded-xl border-2 border-ink bg-paper p-2">
      <div className="flex items-center gap-2">
        <motion.div
          key={`${runId}-${word}`}
          initial={reduce || runId === 0 ? false : { scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 12, delay: reduce ? 0 : RUN_MS / 1000 - 0.3 }}
        >
          <Face id={p.id} look={p.look} happiness={h} className="size-10" />
        </motion.div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{p.name}</p>
          <p className="text-xs tabular-nums">
            {word} · {h.toFixed(0)}/100 <span className="sr-only">happiness</span>
            {h.toFixed(0) !== base.happiness[p.id].toFixed(0) && ` (${signed(h - base.happiness[p.id], 0)})`}
          </p>
        </div>
      </div>
      <p className="mt-1 text-xs">
        <strong>Wants</strong> {p.wants}.
      </p>
      {reaction && !running && <SpeechBubble key={runId} reaction={reaction} />}
      <p className="mt-1 text-xs tabular-nums">
        {MODE_WORD[p.trip.mode]} {p.trip.distanceKm} km · <strong>{t.toFixed(1)} min</strong>
        {Math.abs(t - base.travelTimeMin[p.id]) >= 0.05 && ` (${signed(t - base.travelTimeMin[p.id])})`}
      </p>
      <div aria-hidden className="relative mt-1 h-5 rounded-full border-2 border-ink bg-grid">
        <motion.div
          key={runId}
          className="absolute top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-paper"
          initial={{ left: runId === 0 || reduce ? 'calc(100% - 1.25rem)' : '0%' }}
          animate={{ left: 'calc(100% - 1.25rem)' }}
          transition={{ duration: running && !reduce ? tripMs / 1000 : 0, ease: 'easeInOut' }}
        >
          <ElementIcon id={MODE_ICON[p.trip.mode]} size={13} />
        </motion.div>
      </div>
      {why && <div className="mt-1.5 flex flex-wrap justify-end">{why}</div>}
    </li>
  )
}

function SpeechBubble({ reaction }: { reaction: Reaction | 'loading' }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative mt-2.5 rounded-xl border-2 border-ink bg-paper px-2.5 py-1.5 text-sm font-medium shadow-[2px_2px_0_var(--color-ink)] before:absolute before:-top-2 before:left-5 before:size-3 before:rotate-45 before:border-t-2 before:border-l-2 before:border-ink before:bg-paper"
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
