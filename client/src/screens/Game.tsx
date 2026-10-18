import { addElement, computeMetrics, fallbackResult, lessons, moveElement, removeElement, resizeElement, scoreRun, type ElementId, type Layout, type Lesson, type Level, type LevelStats, type Metrics, type ReactResult } from '@road-diet/shared'
import { useReducedMotion } from 'motion/react'
import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BudgetBar, Palette, SelectionBar } from '../editor/controls'
import { Editor } from '../editor/Editor'
import { CameraBar } from '../run/CameraBar'
import { Guide } from '../run/Guide'
import { LessonLine } from '../run/Lesson'
import { MetersCard, RUN_MS, Residents, RunButton, type Shown } from '../run/RunPanel'
import { Scorecard } from '../run/Scorecard'
import type { CameraApi } from '../run/Street3D'
import { TOUR, TOUR_KEY, Tour, type TourStep } from '../run/Tour'
import { Pip } from '../story/characters'
import { isMuted, play, setMuted } from '../sound'
import { Button, Panel } from '../ui'
import { goalSentence } from './Briefing'

const Street3D = lazy(() => import('../run/Street3D'))
const NO_3D = 'road-diet:no-3d'
const WIDE = '(min-width: 64rem)'
type PanelId = 'build' | 'meters' | 'pip' | 'residents'
const TABS: [PanelId, string][] = [
  ['build', 'Build'],
  ['meters', 'Meters'],
  ['pip', 'Pip'],
  ['residents', 'Residents'],
]
const link = 'font-semibold text-primary underline underline-offset-2'

function useWide() {
  const [wide, setWide] = useState(() => matchMedia(WIDE).matches)
  useEffect(() => {
    const q = matchMedia(WIDE)
    const on = () => setWide(q.matches)
    q.addEventListener('change', on)
    return () => q.removeEventListener('change', on)
  }, [])
  return wide
}

function stored(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

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
  // Pip's guide follows the street as it is now, not the last run.
  const now = useMemo(() => computeMetrics(layout, level), [layout, level])
  const [muted, setMutedState] = useState(isMuted)
  // When an edit flips a concept (a buffer appears, riders enter the door zone), Pip points it out for a few seconds.
  const learned = useMemo(() => lessons(layout, now, level), [layout, now, level])
  const verdicts = useRef<Map<string, boolean> | null>(null)
  const [noticed, setNoticed] = useState<Lesson[]>([])
  useEffect(() => {
    const before = verdicts.current
    verdicts.current = new Map(learned.map((l) => [l.concept, l.good]))
    const flipped = before ? learned.filter((l) => before.get(l.concept) !== l.good).slice(0, 3) : []
    if (!flipped.length) return
    setNoticed(flipped)
    const t = window.setTimeout(() => setNoticed([]), 8000)
    return () => window.clearTimeout(t)
  }, [learned])
  const [selected, setSelected] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const camera = useRef<CameraApi | null>(null)
  const wide = useWide()
  // Wide screens float every panel at once; phones show one at a time above a tab bar.
  // Meters start folded: Pip already shows live goal progress, and the meters matter most after a run.
  const [open, setOpen] = useState<Record<PanelId, boolean>>({ build: true, meters: false, pip: true, residents: true })
  const [sheet, setSheet] = useState<PanelId | null>(null)
  const isOpen = (id: PanelId) => (wide ? open[id] : sheet === id)
  const toggle = (id: PanelId) => (wide ? setOpen({ ...open, [id]: !open[id] }) : setSheet(sheet === id ? null : id))
  const [tour, setTour] = useState<number | null>(() => (stored(TOUR_KEY) ? null : 0))
  const endTour = () => {
    setTour(null)
    try {
      localStorage.setItem(TOUR_KEY, '1')
    } catch {
      // the tour just shows again next visit
    }
  }
  /** Doing a step (or a later one) moves the tour past it. */
  const reach = (id: TourStep) => {
    const k = TOUR.findIndex((t) => t.id === id)
    if (tour === null || k < tour) return
    if (k + 1 < TOUR.length) setTour(k + 1)
    else endTour()
  }

  // Every edit, 2D or 3D, comes through here. Resizes and moves keep the count and stay silent.
  const edit = (next: Layout) => {
    if (next.elements.length !== layout.elements.length) play(next.elements.length > layout.elements.length ? 'place' : 'remove')
    reach(next.elements.length > layout.elements.length ? 'add' : 'edit')
    setLayout(next)
  }
  const select = (i: number | null) => {
    if (i !== null) reach('select')
    setSelected(i)
  }
  const apply = (next: Layout, nextSelected: number | null) => {
    if (next === layout) return
    edit(next)
    setSelected(nextSelected)
  }
  const sel = selected !== null && selected < layout.elements.length ? selected : null

  const shown: Shown = !run
    ? { metrics: base, kind: 'today' }
    : { metrics: run.metrics, react: run.react, kind: JSON.stringify(run.layout) === JSON.stringify(layout) ? 'run' : 'stale' }

  const runDay = () => {
    reach('run')
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
      setOpen((o) => ({ ...o, meters: true }))
    }, reduce ? 0 : RUN_MS)
  }

  const panels: Record<PanelId, { title: ReactNode; body: ReactNode }> = {
    build: {
      title: 'Build',
      body: (
        <div className="flex flex-col gap-2">
          <BudgetBar layout={layout} level={level} announce={!dragging} />
          <SelectionBar
            level={level}
            layout={layout}
            selected={sel}
            resize={(i, d) => apply(resizeElement(layout, level, i, d), i)}
            move={(i, dir) => apply(moveElement(layout, i, dir), i + dir)}
            remove={(i) => apply(removeElement(layout, i), layout.elements.length > 1 ? Math.max(0, i - 1) : null)}
            empty="Tap a piece of the street, then drag its blue handles. Keyboard: switch to 2D."
          />
          <Palette
            level={level}
            layout={layout}
            selected={sel}
            onAdd={(id: ElementId) => {
              const at = sel === null ? layout.elements.length : sel + 1
              apply(addElement(layout, level, id, at), at)
            }}
          />
        </div>
      ),
    },
    meters: { title: 'Meters', body: <MetersCard level={level} base={base} shown={shown} running={running} onShowScore={() => setScoreOpen(true)} /> },
    pip: {
      title: (
        <>
          <Pip className="size-8" /> Pip says
        </>
      ),
      body: <Guide level={level} layout={layout} metrics={now} />,
    },
    residents: { title: 'Residents', body: <Residents base={base} shown={shown} running={running} runId={runId} /> },
  }
  const panel = (id: PanelId, className = '') => (
    <Panel id={id} title={panels[id].title} open={isOpen(id)} onToggle={() => toggle(id)} className={className}>
      {panels[id].body}
    </Panel>
  )

  const header = (
    <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl border-2 border-ink bg-paper px-3 py-1 shadow-[3px_3px_0_var(--color-ink)]">
      <div className="min-w-0">
        <h1 tabIndex={-1} className="font-display text-lg font-semibold outline-none lg:text-xl">
          {level.name}
        </h1>
        <p className="text-sm">
          <strong>Goal:</strong> {goalSentence(level)}
        </p>
        <p className="text-xs">
          A learning tool, not a forecast. Residents are fictional. Hosted on Vultr.{' '}
          <a href="/about" target="_blank" className={link}>
            About
          </a>{' '}
          ·{' '}
          <a href="/data" target="_blank" className={link}>
            Data & Limitations
          </a>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {webgl && !reduce && <Button onClick={() => setWant3d(!in3d)}>{in3d ? 'Edit in 2D' : 'Edit in 3D'}</Button>}
        {in3d && tour === null && <Button onClick={() => setTour(0)}>Tour</Button>}
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
          <span className="sr-only lg:not-sr-only">Sound</span>
        </Button>
      </div>
    </header>
  )

  // Top of the street: camera buttons and the tour over the 3D view, and Pip pointing out a concept in either view.
  const guides = (
    <div className="flex flex-col items-center gap-2">
      {/* On a phone an open panel needs the room more than the camera buttons do. */}
      {in3d && (wide || !sheet) && <CameraBar camera={camera} onUse={() => reach('look')} />}
      {in3d && tour !== null && <Tour step={tour} onNext={() => (tour + 1 < TOUR.length ? setTour(tour + 1) : endTour())} onSkip={endTour} />}
      <div aria-live="polite" className="flex w-full justify-center">
        {noticed.length > 0 && tour === null && (
          <div className="pointer-events-auto flex max-w-md gap-2 rounded-2xl border-2 border-ink bg-paper p-2 text-sm shadow-[3px_3px_0_var(--color-ink)]">
            <Pip className="size-8" />
            <div>
              <p className="font-display font-semibold">Pip noticed</p>
              <ul className="flex flex-col gap-1.5">
                {noticed.map((l) => (
                  <li key={l.concept} className="flex gap-2">
                    <LessonLine lesson={l} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
  const editor2d = !in3d && (
    <div className="pointer-events-auto min-h-0 flex-1 overflow-y-auto rounded-2xl border-2 border-ink bg-paper/95 p-3 shadow-[4px_4px_0_var(--color-ink)]">
      <h2 className="mb-2 font-display text-xl font-semibold">Your street from above</h2>
      <Editor level={level} layout={layout} onChange={edit} />
    </div>
  )

  return (
    <div className="relative h-full overflow-hidden">
      {in3d && (
        <section aria-label="Your street in 3D" className="absolute inset-0">
        <Fallback onError={() => setWebgl(false)}>
          <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-grid motion-reduce:animate-none" />}>
            <Street3D level={level} layout={layout} onChange={edit} selected={sel} onSelect={select} onDragging={setDragging} onLook={() => reach('look')} camera={camera} />
          </Suspense>
        </Fallback>
        </section>
      )}
      {/* The panels float over the street; empty space lets drags through to it. */}
      {wide ? (
        <div className="pointer-events-none absolute inset-0 grid grid-cols-[15rem_minmax(0,1fr)_16rem] grid-rows-[auto_minmax(0,1fr)] gap-2 p-2">
          <div className="col-span-3">{header}</div>
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto pr-1 pb-1">
            {panel('meters')}
            {panel('pip')}
          </div>
          <main className="flex min-h-0 flex-col justify-between gap-2">
            {guides}
            {editor2d}
            {in3d && panel('build', 'max-h-[45%] self-center w-full max-w-2xl')}
          </main>
          <div className="flex min-h-0 flex-col gap-2 pb-1">
            <div className="pointer-events-auto">
              <RunButton running={running} kind={shown.kind} onRun={runDay} />
            </div>
            {panel('residents', 'max-h-full')}
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 flex flex-col gap-2 p-2">
          {header}
          <main className="flex min-h-0 flex-1 flex-col gap-2">
            {guides}
            {editor2d}
            {in3d && <div className="flex-1" />}
            {sheet && panel(sheet, 'max-h-[50dvh]')}
          </main>
          <div className="pointer-events-auto flex flex-col gap-2">
            <RunButton running={running} kind={shown.kind} onRun={runDay} />
            <nav aria-label="Panels" className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl border-2 border-ink bg-paper p-1">
              {TABS.filter(([id]) => in3d || id !== 'build').map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={sheet === id}
                  onClick={() => setSheet(sheet === id ? null : id)}
                  className="min-h-11 rounded-xl text-sm font-semibold aria-pressed:bg-ink aria-pressed:text-paper focus-visible:outline-4 focus-visible:outline-primary"
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
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
