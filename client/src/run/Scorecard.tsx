import { MODEL, TODO_SOURCE, listTodoSources, scoreRun, type GoalCheck, type Level, type Metrics, type ReactResult } from '@road-diet/shared'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Button, GeminiLabel, signed } from '../ui'

type Props = { open: boolean; onClose: () => void; level: Level; metrics: Metrics; base: Metrics; react: ReactResult | null }

const GOAL_TEXT: Record<GoalCheck['kind'], (g: GoalCheck) => [string, string]> = {
  emissions: (g) => [`Cut emissions by at least ${g.target}%`, `${g.value.toFixed(1)}%`],
  happiness: (g) => [`Every resident at least ${g.target} happy`, `lowest ${g.value.toFixed(0)}`],
  safety: (g) => [`Safety at least ${g.target}`, `${g.value.toFixed(0)}`],
}

const pct = (x: number) => `${Math.round(x * 100)}%`

export function Scorecard({ open, onClose, level, metrics, base, react }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const reduce = useReducedMotion()
  const score = scoreRun(metrics, level)
  const todo = listTodoSources()

  useEffect(() => {
    const d = ref.current
    if (open && !d?.open) {
      d?.showModal()
      title.current?.focus()
    }
    if (!open && d?.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="score-title"
      className="m-auto max-h-[90dvh] w-[min(40rem,calc(100%-2rem))] rounded-3xl border-2 border-ink bg-paper p-0 text-ink shadow-[6px_6px_0_var(--color-ink)] backdrop:bg-ink/50"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="score-title" ref={title} tabIndex={-1} className="font-display text-3xl font-semibold outline-none">
              {score.goalMet ? 'Goal met!' : 'Not there yet'}
            </h2>
            <p className="mt-1">
              {score.goalMet
                ? 'Your street went on a diet and kept its residents on board.'
                : 'Part of the goal is still open. Adjust the street and run another day.'}
            </p>
          </div>
          <div role="img" aria-label={`${score.stars} of 3 stars`} className="flex shrink-0 gap-1">
            {[1, 2, 3].map((n) => (
              <motion.svg
                key={`${open}-${n}`}
                viewBox="0 0 24 24"
                className="size-10"
                aria-hidden
                initial={reduce || n > score.stars ? false : { scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.25 + n * 0.3 }}
              >
                <path
                  d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2 6.1 20.4l1.3-6.5L2.5 9.3l6.6-.8z"
                  fill={n <= score.stars ? 'var(--color-loading)' : 'none'}
                  stroke="var(--color-ink)"
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                  strokeDasharray={n <= score.stars ? undefined : '3 2'}
                />
              </motion.svg>
            ))}
          </div>
        </div>

        <section aria-labelledby="goals-title">
          <h3 id="goals-title" className="font-display text-lg font-semibold">
            Goal checklist
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {score.goals.map((g) => {
              const [label, value] = GOAL_TEXT[g.kind](g)
              return (
                <li key={g.kind} className="flex items-center gap-3 rounded-xl border-2 border-ink px-3 py-2">
                  <span aria-hidden className={`grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink font-bold ${g.met ? 'bg-ink text-paper' : 'border-dashed'}`}>
                    {g.met ? '✓' : ''}
                  </span>
                  <span className="flex-1">
                    {label}
                    <span className="sr-only">{g.met ? ', met' : ', not met'}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{value}</span>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 text-sm">
            Stars: ★ goal met · ★★ also safety at least {level.stars.safety} · ★★★ also every resident at least {level.stars.fairness} happy.
          </p>
        </section>

        <section aria-labelledby="co2-title" className="rounded-2xl border-2 border-ink p-4">
          <h3 id="co2-title" className="font-display text-lg font-semibold">
            Emissions
          </h3>
          <p className="mt-1 tabular-nums">
            <strong className="font-display text-2xl">
              {signed(metrics.emissionsKgPerHour - base.emissionsKgPerHour, 0)} kg CO₂e
            </strong>{' '}
            per peak hour on this street ({signed(-metrics.emissionsReductionPct)}% vs today: {metrics.emissionsKgPerHour.toFixed(0)} kg instead of {base.emissionsKgPerHour.toFixed(0)} kg).
          </p>
        </section>

        <section aria-labelledby="debrief-title" aria-busy={!react}>
          <h3 id="debrief-title" className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold">
            Debrief {react?.source === 'gemini' && <GeminiLabel />}
          </h3>
          {react ? (
            <p className="mt-1">{react.debrief}</p>
          ) : (
            <div aria-label="Writing the debrief" className="mt-2 flex flex-col gap-2">
              {['w-full', 'w-11/12', 'w-2/3'].map((w) => (
                <div key={w} className={`h-3 animate-pulse rounded-full bg-grid motion-reduce:animate-none ${w}`} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="limits-title" className="rounded-2xl border-2 border-dashed border-ink bg-grid/40 p-4 text-sm">
          <h3 id="limits-title" className="font-display text-lg font-semibold">
            Limitations
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>This is a simplified estimate, not a prediction.</li>
            <li>
              Some trips switch mode when the street changes, capped at {pct(MODEL.maxTotalShift.value)} of all trips and{' '}
              {pct(MODEL.maxShiftPerMode.value)} per mode. Emissions depend on that assumption.
            </li>
            <li>Safety is an index built from the street layout, not a forecast of collisions.</li>
            <li>Residents are fictional. How much each one cares about time, safety, comfort and access is a design choice.</li>
            {level.corridor.source === TODO_SOURCE && <li>This street uses placeholder data until the real Toronto corridor is added.</li>}
          </ul>
          <p className="mt-3 font-semibold">Values still waiting for a source ({todo.length}):</p>
          <p className="mt-1 break-words font-mono text-xs">{todo.join(', ')}</p>
          <a href="/data" className="mt-3 inline-block font-semibold text-primary underline underline-offset-2">
            Data & Limitations
          </a>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">A learning tool, not a forecast. Residents are fictional.</p>
          <Button onClick={onClose} className="bg-primary px-5 text-paper hover:bg-primary hover:brightness-110">
            Keep editing
          </Button>
        </div>
      </div>
    </dialog>
  )
}
