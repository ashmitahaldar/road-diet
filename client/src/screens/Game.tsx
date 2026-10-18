import { computeMetrics, fallbackResult, scoreRun, type Layout, type Level, type LevelStats, type Metrics, type ReactResult } from '@road-diet/shared'
import { useReducedMotion } from 'motion/react'
import { Component, Suspense, lazy, useMemo, useRef, useState, type ReactNode } from 'react'
import { CANVAS_SIZE } from '../editor/controls'
import { Editor } from '../editor/Editor'
import { MetersCard, RUN_MS, Residents, RunButton, type Shown } from '../run/RunPanel'
import { Scorecard } from '../run/Scorecard'
import { Tips } from '../run/Tips'
import { isMuted, play, setMuted } from '../sound'
import { Button } from '../ui'
import { goalSentence } from './Briefing'

const Street3D = lazy(() => import('../run/Street3D'))
const NO_3D = 'road-diet:no-3d'
/** A side column: scrolls on its own when the game fits one screen. The padding keeps the card shadows inside the scroll box. */
const SIDE = 'relative flex flex-col gap-3 fit:row-start-1 fit:min-h-0 fit:overflow-y-auto fit:pr-1 fit:pb-1'

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
  // 3D is the default editor; the 2D one is the keyboard path and the fallback without WebGL or with reduced motion.
  const [want3d, setWant3d] = useState(true)
  const timer = useRef<number>(undefined)
  const reduce = useReducedMotion()
  const in3d = want3d && webgl && !reduce
  const base = useMemo(() => computeMetrics(level.corridor.baselineLayout, level), [level])
  // Tips follow the street as it is now, not the last run.
  const now = useMemo(() => computeMetrics(layout, level), [layout, level])
  const [muted, setMutedState] = useState(isMuted)

  // Every edit, 2D or 3D, comes through here. Resizes and moves keep the count and stay silent.
  const edit = (next: Layout) => {
    if (next.elements.length !== layout.elements.length) play(next.elements.length > layout.elements.length ? 'place' : 'remove')
    setLayout(next)
  }

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
    setRunning(true)
    if (!reduce) play('run')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      play(scoreRun(metrics, level).goalMet ? 'win' : 'done')
      setRunning(false)
      setScoreOpen(true)
    }, reduce ? 0 : RUN_MS)
  }

  return (
    <div className="flex flex-col gap-3 fit:h-full">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 rounded-2xl border-2 border-ink bg-paper px-4 py-2 shadow-[4px_4px_0_var(--color-ink)]">
        <div>
          <p className="font-display text-lg font-semibold text-primary">Road Diet</p>
          <h1 tabIndex={-1} className="font-display text-2xl font-semibold outline-none sm:text-3xl">{level.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="max-w-md">
            <strong>Goal:</strong> {goalSentence(level)}
          </p>
          <Button
            aria-pressed={!muted}
            onClick={() => {
              setMuted(!muted)
              setMutedState(!muted)
            }}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
              {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
            </svg>
            Sound
          </Button>
        </div>
      </header>
      {/* Stacked on small screens (street, meters, tips, residents); on one screen the info sits either side of the street. */}
      <main className="grid grid-cols-[minmax(0,1fr)] gap-4 fit:min-h-0 fit:flex-1 fit:grid-cols-[16rem_minmax(0,1fr)_19rem] fit:grid-rows-[minmax(0,1fr)]">
        <section aria-labelledby="street-title" className="relative flex flex-col gap-3 fit:col-start-2 fit:row-start-1 fit:min-h-0 fit:overflow-y-auto fit:pr-1 fit:pb-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="street-title" className="font-display text-2xl font-semibold">
              {in3d ? 'Your street in 3D' : 'Your street from above'}
            </h2>
            {webgl && !reduce && <Button onClick={() => setWant3d(!in3d)}>{in3d ? 'Edit in 2D' : 'Edit in 3D'}</Button>}
          </div>
          {in3d ? (
            <Fallback onError={() => setWebgl(false)}>
              <Suspense fallback={<div className={`${CANVAS_SIZE} animate-pulse rounded-2xl border-2 border-ink bg-grid motion-reduce:animate-none`} />}>
                <Street3D level={level} layout={layout} onChange={edit} />
              </Suspense>
            </Fallback>
          ) : (
            <Editor level={level} layout={layout} onChange={edit} />
          )}
        </section>
        <div className={`${SIDE} fit:col-start-1`}>
          <MetersCard level={level} base={base} shown={shown} running={running} onShowScore={() => setScoreOpen(true)} />
          <Tips layout={layout} metrics={now} />
        </div>
        <div className={`${SIDE} fit:col-start-3`}>
          <RunButton running={running} kind={shown.kind} onRun={runDay} />
          <Residents base={base} shown={shown} running={running} runId={runId} />
        </div>
      </main>
      {run && (
        <Scorecard
          open={scoreOpen}
          onClose={() => setScoreOpen(false)}
          level={level}
          layout={run.layout}
          metrics={run.metrics}
          base={base}
          react={run.react}
          stats={run.others?.stats}
          fairnessBeatsPct={run.others?.beats ?? null}
          closeLabel={in3d ? 'See it in 3D' : undefined}
        />
      )}
    </div>
  )
}
