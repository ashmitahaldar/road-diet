import { computeMetrics, fallbackResult, type Layout, type Level, type LevelStats, type Metrics, type ReactResult } from '@road-diet/shared'
import { useReducedMotion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { Editor } from '../editor/Editor'
import { RUN_MS, RunPanel, type Shown } from '../run/RunPanel'
import { Scorecard } from '../run/Scorecard'
import { goalSentence } from './Briefing'

/** One /api/react call per run. Any failure, including no server at all, gives the shared canned result. */
async function fetchReactions(level: Level, layout: Layout, metrics: Metrics): Promise<ReactResult> {
  try {
    const res = await fetch('/api/react', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ levelId: level.id, layout }),
      signal: AbortSignal.timeout(8000),
    })
    const body = (await res.json()) as Partial<ReactResult>
    if ((res.ok || res.status === 429) && Array.isArray(body.reactions) && typeof body.debrief === 'string' && typeof body.debriefSource === 'string') return body as ReactResult
  } catch {
    // fall through to the canned result
  }
  return fallbackResult(metrics)
}

/** Save the run, then read stats, so the player's own run is counted. Null hides the section (no database). */
async function saveAndFetchStats(level: Level, layout: Layout): Promise<LevelStats | null> {
  try {
    await fetch('/api/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ levelId: level.id, layout }),
      signal: AbortSignal.timeout(5000),
    })
    const res = await fetch(`/api/stats/${encodeURIComponent(level.id)}`, { signal: AbortSignal.timeout(5000) })
    const stats = (await res.json()) as LevelStats
    return res.ok && Array.isArray(stats.starCounts) ? stats : null
  } catch {
    return null
  }
}

export function Game({ level }: { level: Level }) {
  const [layout, setLayout] = useState(level.corridor.baselineLayout)
  const [run, setRun] = useState<{ layout: Layout; metrics: Metrics; react: ReactResult | null; stats?: LevelStats | null } | null>(null)
  const [runId, setRunId] = useState(0)
  const [running, setRunning] = useState(false)
  const [scoreOpen, setScoreOpen] = useState(false)
  const timer = useRef<number>(undefined)
  const reduce = useReducedMotion()
  const base = useMemo(() => computeMetrics(level.corridor.baselineLayout, level), [level])

  const shown: Shown = !run
    ? { metrics: base, kind: 'today' }
    : { metrics: run.metrics, react: run.react, kind: JSON.stringify(run.layout) === JSON.stringify(layout) ? 'run' : 'stale' }

  const runDay = () => {
    const metrics = computeMetrics(layout, level)
    setRun({ layout, metrics, react: null })
    // A slow reply for an older run must not overwrite a newer one.
    fetchReactions(level, layout, metrics).then((react) => setRun((cur) => (cur?.layout === layout ? { ...cur, react } : cur)))
    saveAndFetchStats(level, layout).then((stats) => setRun((cur) => (cur?.layout === layout ? { ...cur, stats } : cur)))
    setRunId((n) => n + 1)
    setRunning(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setRunning(false)
      setScoreOpen(true)
    }, reduce ? 0 : RUN_MS)
  }

  return (
    <div className="flex flex-col gap-6">
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
      {run && <Scorecard open={scoreOpen} onClose={() => setScoreOpen(false)} level={level} metrics={run.metrics} base={base} react={run.react} stats={run.stats} />}
    </div>
  )
}
