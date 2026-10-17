import { computeMetrics, type Layout, type Level, type Metrics } from '@road-diet/shared'
import { useReducedMotion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { Editor } from '../editor/Editor'
import { RUN_MS, RunPanel, type Shown } from '../run/RunPanel'
import { Scorecard } from '../run/Scorecard'
import { goalSentence } from './Briefing'

export function Game({ level }: { level: Level }) {
  const [layout, setLayout] = useState(level.corridor.baselineLayout)
  const [run, setRun] = useState<{ layout: Layout; metrics: Metrics } | null>(null)
  const [runId, setRunId] = useState(0)
  const [running, setRunning] = useState(false)
  const [scoreOpen, setScoreOpen] = useState(false)
  const timer = useRef<number>(undefined)
  const reduce = useReducedMotion()
  const base = useMemo(() => computeMetrics(level.corridor.baselineLayout, level), [level])

  const shown: Shown = !run
    ? { metrics: base, kind: 'today' }
    : { metrics: run.metrics, kind: JSON.stringify(run.layout) === JSON.stringify(layout) ? 'run' : 'stale' }

  const runDay = () => {
    setRun({ layout, metrics: computeMetrics(layout, level) })
    setRunId((n) => n + 1)
    setRunning(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setRunning(false)
      setScoreOpen(true)
    }, reduce ? 0 : RUN_MS)
  }

  return (
    <div className="flex flex-col gap-6 pb-20 xl:pb-0">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 rounded-2xl border-2 border-ink bg-paper px-4 py-3 shadow-[4px_4px_0_var(--color-ink)]">
        <div>
          <p className="font-display text-lg font-semibold text-primary">Road Diet</p>
          <h1 tabIndex={-1} className="font-display text-3xl font-semibold outline-none">{level.name}</h1>
        </div>
        <p className="max-w-xl">
          <strong>Goal:</strong> {goalSentence(level)}
        </p>
      </header>
      <main className="grid flex-1 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Editor level={level} layout={layout} onChange={setLayout} />
        <RunPanel level={level} base={base} shown={shown} running={running} runId={runId} onRun={runDay} onShowScore={() => setScoreOpen(true)} />
      </main>
      {run && <Scorecard open={scoreOpen} onClose={() => setScoreOpen(false)} level={level} metrics={run.metrics} base={base} />}
    </div>
  )
}
