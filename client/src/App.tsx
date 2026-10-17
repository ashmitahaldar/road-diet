import { PLACEHOLDER_LEVEL, computeMetrics, type Layout, type Metrics } from '@road-diet/shared'
import { useReducedMotion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { Editor } from './editor/Editor'
import { RUN_MS, RunPanel, type Shown } from './run/RunPanel'

export default function App() {
  const level = PLACEHOLDER_LEVEL
  const [layout, setLayout] = useState(level.corridor.baselineLayout)
  const [run, setRun] = useState<{ layout: Layout; metrics: Metrics } | null>(null)
  const [runId, setRunId] = useState(0)
  const [running, setRunning] = useState(false)
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
    timer.current = window.setTimeout(() => setRunning(false), reduce ? 0 : RUN_MS)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 pt-6 pb-24 xl:pb-6">
      <header>
        <h1 className="font-display text-4xl font-semibold">Road Diet</h1>
        <p className="mt-1 text-lg">Every street has a budget. How would you spend it?</p>
        <p className="mt-2">
          <strong>{level.name}</strong> · {level.corridor.widthM} m wide · placeholder data
        </p>
      </header>
      <main className="grid flex-1 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Editor level={level} layout={layout} onChange={setLayout} />
        <RunPanel level={level} base={base} shown={shown} running={running} runId={runId} onRun={runDay} />
      </main>
      <footer className="text-sm">A learning tool, not a forecast. Residents are fictional.</footer>
    </div>
  )
}
