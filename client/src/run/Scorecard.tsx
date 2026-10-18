import { PANELS, earnedBadges, residentsOf, type BadgeId, type DayStory, hints, lessons, resultText, scoreRun, type GoalCheck, type Layout, type Level, type LevelStats, type Metrics, type ReactResult } from '@road-diet/shared'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { LimitationsList } from '../Limitations'
import { Face, Pip } from '../story/characters'
import { BadgeArt } from './Badges'
import { LessonLine } from './Lesson'
import { Button, GeminiLabel, signed } from '../ui'
import { Others } from './Others'

type Props = { fresh?: BadgeId[]; story?: DayStory | null; postcard?: string | null; open: boolean; onClose: () => void; level: Level; layout: Layout; metrics: Metrics; base: Metrics; react: ReactResult | null; stats?: LevelStats | null; fairnessBeatsPct?: number | null; closeLabel?: string }

const GOAL_TEXT: Record<GoalCheck['kind'], (g: GoalCheck) => [string, string]> = {
  emissions: (g) => [`Cut emissions by at least ${g.target}%`, `${g.value.toFixed(1)}%`],
  happiness: (g) => [`Every resident at least ${g.target} happy`, `lowest ${g.value.toFixed(0)}`],
  safety: (g) => [`Safety at least ${g.target}`, `${g.value.toFixed(0)}`],
}

/** Clipboard API first; the hidden-textarea fallback covers browsers without it (older iOS, plain http). */
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const t = Object.assign(document.createElement('textarea'), { value: text, readOnly: true })
    t.style.position = 'fixed'
    t.style.opacity = '0'
    document.body.appendChild(t)
    t.select()
    t.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    t.remove()
    return ok
  }
}

export function Scorecard({ fresh = [], story = null, postcard, open, onClose, level, layout, metrics, base, react, stats, fairnessBeatsPct = null, closeLabel = 'Keep editing' }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const reduce = useReducedMotion()
  const score = scoreRun(metrics, level)
  const badges = earnedBadges(metrics, score.goalMet)
  const ideas = hints(layout, metrics, level)
  const learned = lessons(layout, metrics, level)
  const who = residentsOf(level)
  const [status, setStatus] = useState('')
  useEffect(() => setStatus(''), [open, metrics])
  const emissionsDeltaKg = metrics.emissionsKgPerHour - base.emissionsKgPerHour
  const text = resultText({ levelName: level.name, stars: score.stars, badges, emissionsDeltaKg, url: location.origin })

  // Draw the share image as soon as the scorecard opens, so the tap can go straight to the share sheet.
  const card = useRef<Promise<{ png: Blob; share: typeof import('./shareCard').shareCard }> | null>(null)
  useEffect(() => {
    if (!open) return
    const s = scoreRun(metrics, level)
    const data = {
      levelName: level.name,
      stars: s.stars,
      badges: earnedBadges(metrics, s.goalMet),
      emissionsDeltaKg: metrics.emissionsKgPerHour - base.emissionsKgPerHour,
      emissionsChangePct: -metrics.emissionsReductionPct,
      layout,
      widthM: level.corridor.widthM,
      url: location.origin,
    }
    // Loaded on demand so the image code stays out of the main bundle.
    card.current = import('./shareCard').then(async (m) => ({ png: await m.drawCard(data), share: m.shareCard }))
    card.current.catch(() => {})
  }, [open, metrics, base, layout, level])

  // Without a generated postcard, show the drawn card of the design instead.
  const [drawn, setDrawn] = useState<string | null>(null)
  useEffect(() => {
    if (!open || postcard !== null) return
    let url: string | null = null
    card.current?.then(({ png }) => setDrawn((url = URL.createObjectURL(png)))).catch(() => {})
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [open, postcard, metrics])

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
      <div className="sticky top-0 z-30 flex h-0 justify-end">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="mt-3 mr-3 grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper text-lg shadow-[2px_2px_0_var(--color-ink)] hover:bg-grid focus-visible:outline-4 focus-visible:outline-primary"
        >
          <span aria-hidden>✕</span>
        </button>
      </div>
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pr-12">
          <div>
            <h2 id="score-title" ref={title} tabIndex={-1} className="font-display text-3xl font-semibold outline-none">
              {score.goalMet ? 'Goal met!' : 'Not there yet'}
            </h2>
            <p className="mt-1">
              {score.goalMet
                ? 'Your street went on a diet and kept its residents on board.'
                : 'Tweak the street and run another day.'}
            </p>
            <p className="mt-1 tabular-nums">
              Emissions <strong>{signed(emissionsDeltaKg, 0)} kg CO₂e</strong> per peak hour ({signed(-metrics.emissionsReductionPct)}% vs today)
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

        <section aria-labelledby="said-title" aria-busy={!react}>
          <h3 id="said-title" className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold">
            Your residents {react?.reactions.every((r) => r.source === 'gemini') && <GeminiLabel />}
          </h3>
          {story && (
            <p className="mt-1">
              Your design: <span className="font-display text-xl font-semibold">“{story.name}”</span>
              {story.nameSource === 'gemini' && <span className="sr-only"> (name by Gemini)</span>}
            </p>
          )}
          {react ? (
            <ul className="mt-2 grid items-start gap-2 sm:grid-cols-2">
              {react.reactions.map((r) => {
                const day = story?.days.find((d) => d.personaId === r.personaId)
                return (
                  <li key={r.personaId} className="rounded-xl border-2 border-ink px-3 py-2">
                    <div className="flex gap-3">
                      <Face id={r.personaId} look={who[r.personaId].look} happiness={metrics.happiness[r.personaId]} />
                      <span>
                        <span className="font-semibold">
                          {who[r.personaId].name} · <span className="tabular-nums">{metrics.happiness[r.personaId].toFixed(0)}/100</span>
                        </span>
                        <q className="mt-0.5 block font-medium">{r.line}</q>
                      </span>
                    </div>
                    {day && (
                      <details className="group">
                        <summary className="inline-flex min-h-11 cursor-pointer items-center gap-1 text-sm font-semibold focus-visible:outline-4 focus-visible:outline-primary">
                          <span aria-hidden className="transition-transform group-open:rotate-90 motion-reduce:transition-none">
                            ▸
                          </span>
                          {who[r.personaId].name}’s day
                        </summary>
                        <ol className="flex flex-col gap-1.5 pb-1 text-sm">
                          {day.panels.map((text, i) => (
                            <li key={i}>
                              <span className="font-semibold">{PANELS[i]}: </span>
                              {text}
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <div aria-label="Waiting for reactions" className="mt-2 h-16 animate-pulse rounded-xl bg-grid motion-reduce:animate-none" />
          )}
          {story && <p className="mt-2 text-xs">Each day is a story, not a prediction: the moments are made up; trip times and moods come from the model.</p>}
        </section>

        <section aria-labelledby="learned-title">
          <h3 id="learned-title" className="font-display text-lg font-semibold">
            What this street teaches
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {learned.map((l) => (
              <li key={l.concept} className={`relative flex gap-3 rounded-xl border-2 border-ink px-3 py-2 ${l.good ? '' : 'border-dashed'}`}>
                <LessonLine lesson={l} />
              </li>
            ))}
          </ul>
        </section>

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
            ★ goal · ★★ + safety {level.stars.safety} · ★★★ + everyone {level.stars.fairness} happy
          </p>
        </section>

        {ideas.length > 0 && (
          <section aria-labelledby="ideas-title" className="rounded-2xl border-2 border-ink bg-loading/20 p-4">
            <h3 id="ideas-title" className="flex items-center gap-2 font-display text-lg font-semibold">
              <Pip className="size-10" />
              {score.goalMet ? 'Pip’s ideas for more stars' : 'Pip’s ideas to try'}
            </h3>
            <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
              {ideas.map((h) => (
                <li key={h.text}>{h.text}</li>
              ))}
            </ul>
          </section>
        )}

        {badges.length > 0 && (
          <section aria-labelledby="badges-title">
            <h3 id="badges-title" className="font-display text-lg font-semibold">
              Badges
            </h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {badges.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-xl border-2 border-ink bg-loading/30 px-3 py-2">
                  <BadgeArt id={b.id} className="size-14" />
                  <span>
                    <strong className="font-display font-semibold">{b.name}</strong>
                    {fresh.includes(b.id) && <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-paper">New!</span>}
                    <span className="block text-sm">{b.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="postcard-title" aria-busy={postcard === undefined}>
          <h3 id="postcard-title" className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold">
            Postcard {postcard && <GeminiLabel />}
          </h3>
          {postcard || drawn ? (
            <figure className="mt-2">
              <img
                src={postcard ?? drawn!}
                alt={postcard ? 'Illustration of your street design, generated by Gemini.' : 'Your street design drawn as a cross-section, with your stars and emissions change.'}
                className="w-full rounded-xl border-2 border-ink"
              />
              <figcaption className="mt-1 text-xs">{postcard ? 'Generated illustration: not to scale and not a real place.' : 'Drawn from your design.'}</figcaption>
            </figure>
          ) : (
            <div aria-label="Making the postcard" className="mt-2 aspect-video animate-pulse rounded-xl bg-grid motion-reduce:animate-none" />
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button
              onClick={async () => {
                const done = await card.current!.then(({ png, share }) => share(png, text)).catch(() => 'failed' as const)
                setStatus({ shared: 'Shared!', saved: 'Image saved', cancelled: '', failed: 'Image failed' }[done])
              }}
            >
              Share image
            </Button>
            {postcard && (
              <a href={postcard} download="road-diet-postcard" className="inline-flex min-h-11 items-center rounded-xl border-2 border-ink px-3 font-medium hover:bg-grid focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Download postcard
              </a>
            )}
            <Button onClick={async () => setStatus((await copy(text)) ? 'Copied!' : 'Copy failed')}>Copy my result</Button>
            <span role="status" className="text-sm">
              {status}
            </span>
          </div>
        </section>

        <section aria-labelledby="debrief-title" aria-busy={!react}>
          <h3 id="debrief-title" className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold">
            Debrief {react?.debriefSource === 'gemini' && <GeminiLabel />}
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

        {stats !== null && <Others stats={stats} yourStars={score.stars} fairnessBeatsPct={fairnessBeatsPct} />}

        <section aria-labelledby="limits-title" className="rounded-2xl border-2 border-dashed border-ink bg-grid/40 p-4 text-sm">
          <h3 id="limits-title" className="font-display text-lg font-semibold">
            Limitations
          </h3>
          <p className="mt-1">This is a simplified estimate, not a prediction.</p>
          <details className="group mt-2">
            <summary className="inline-flex min-h-11 cursor-pointer items-center gap-1 font-semibold focus-visible:outline-4 focus-visible:outline-primary">
              <span aria-hidden className="transition-transform group-open:rotate-90 motion-reduce:transition-none">
                ▸
              </span>
              What the model can’t know
            </summary>
            <div className="mt-1">
              <LimitationsList level={level} />
            </div>
          </details>
          <a href="/data" target="_blank" className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-2">
            Data & Limitations
          </a>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">A learning tool, not a forecast. Residents are fictional.</p>
          <Button onClick={onClose} className="bg-primary px-5 text-paper hover:bg-primary hover:brightness-110">
            {closeLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
