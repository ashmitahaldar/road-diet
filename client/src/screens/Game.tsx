import { computeMetrics, fallbackResult, type Layout, type Level, type LevelStats, type Metrics, type ReactResult } from '@road-diet/shared'
import { useReducedMotion } from 'motion/react'
import { Component, Suspense, lazy, useMemo, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { Editor } from '../editor/Editor'
import { RUN_MS, RunPanel, type Shown } from '../run/RunPanel'
import { Scorecard } from '../run/Scorecard'
import { Button } from '../ui'
import { goalSentence } from './Briefing'

const Street3D = lazy(() => import('../run/Street3D'))
const NO_3D = 'road-diet:no-3d'

/** WebGL present and the 3D view hasn't failed earlier this session. */
function can3d() {
  try {
    if (sessionStorage.getItem(NO_3D)) return false
  } catch {
    // storage blocked: just probe WebGL
  }
  const canvas = document.createElement('canvas')
  return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
}

/** Any 3D failure, including a chunk that won't load, drops back to the 2D editor for the rest of the session. */
class Fallback extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError = () => ({ failed: true })
  componentDidCatch() {
    try {
      sessionStorage.setItem(NO_3D, '1')
    } catch {
      // the in-memory flag below still covers this page
    }
    this.props.onError()
  }
  render = () => (this.state.failed ? null : this.props.children)
}

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

type Others = { stats: LevelStats | null; beats: number | null }

/** Save the run, then read stats, so the player's own run is counted. Null stats hide the section (no database). */
async function saveAndFetchStats(level: Level, layout: Layout): Promise<Others> {
  let beats: number | null = null
  try {
    const saved = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ levelId: level.id, layout }),
      signal: AbortSignal.timeout(5000),
    })
    const body = (await saved.json()) as { fairnessBeatsPct?: unknown }
    if (saved.ok && typeof body.fairnessBeatsPct === 'number') beats = body.fairnessBeatsPct
    const res = await fetch(`/api/stats/${encodeURIComponent(level.id)}`, { signal: AbortSignal.timeout(5000) })
    const stats = (await res.json()) as LevelStats
    return { stats: res.ok && Array.isArray(stats.starCounts) ? stats : null, beats }
  } catch {
    return { stats: null, beats }
  }
}

export function Game({ level }: { level: Level }) {
  const [layout, setLayout] = useState(level.corridor.baselineLayout)
  const [run, setRun] = useState<{ layout: Layout; metrics: Metrics; react: ReactResult | null; others?: Others } | null>(null)
  const [runId, setRunId] = useState(0)
  const [running, setRunning] = useState(false)
  const [scoreOpen, setScoreOpen] = useState(false)
  const [webgl, setWebgl] = useState(can3d)
  const [stage, setStage] = useState(false)
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
    saveAndFetchStats(level, layout).then((others) => setRun((cur) => (cur?.layout === layout ? { ...cur, others } : cur)))
    setRunId((n) => n + 1)
    setStage(webgl && !reduce)
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
        {stage && run ? (
          <section aria-labelledby="stage-title" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="stage-title" className="font-display text-2xl font-semibold">
                Your street in 3D
              </h2>
              <Button
                onClick={() => {
                  flushSync(() => setStage(false))
                  document.getElementById('editor-title')?.focus()
                }}
              >
                Edit street
              </Button>
            </div>
            <Fallback
              onError={() => {
                setWebgl(false)
                setStage(false)
              }}
            >
              <Suspense fallback={<div className="h-[min(60dvh,34rem)] min-h-72 animate-pulse rounded-2xl border-2 border-ink bg-grid motion-reduce:animate-none" />}>
                <Street3D level={level} layout={run.layout} />
              </Suspense>
            </Fallback>
          </section>
        ) : (
          <Editor level={level} layout={layout} onChange={setLayout} />
        )}
        <RunPanel level={level} base={base} shown={shown} running={running} runId={runId} onRun={runDay} onShowScore={() => setScoreOpen(true)} />
      </main>
      {run && (
        <Scorecard
          open={scoreOpen}
          onClose={() => setScoreOpen(false)}
          level={level}
          metrics={run.metrics}
          base={base}
          react={run.react}
          stats={run.others?.stats}
          fairnessBeatsPct={run.others?.beats ?? null}
          closeLabel={stage ? 'See it in 3D' : undefined}
        />
      )}
    </div>
  )
}
