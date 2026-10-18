import { PERSONAS, has, hints, scoreRun, widthOf, type ElementId, type GoalCheck, type Layout, type Level, type Metrics } from '@road-diet/shared'
import { useState } from 'react'
import { Button } from '../ui'

const beside = (layout: Layout, id: ElementId, others: ElementId[]) =>
  layout.elements.some((e, i) => e.id === id && [layout.elements[i - 1]?.id, layout.elements[i + 1]?.id].some((n) => n && others.includes(n)))

/**
 * Each tip restates a rule of the game's model (shared/src/model), so it never claims more than the model does.
 * Tips that apply to the current street come first. Spec 2.7: they describe trade-offs, not which lanes to keep.
 */
const TIPS: { text: (m: Metrics) => string; applies?: (layout: Layout, m: Metrics) => boolean }[] = [
  { applies: (_, m) => m.unusedWidthM > 0, text: (m) => `${m.unusedWidthM.toFixed(1)} m is unused. Empty space costs every resident some happiness.` },
  {
    applies: (l) => beside(l, 'bike_painted', ['parking']) && !has(l, 'bike_protected'),
    text: () => 'A painted bike lane beside parking puts riders in the door zone. That lowers safety.',
  },
  {
    applies: (l) => has(l, 'sidewalk') && !beside(l, 'sidewalk', ['planter', 'parking']),
    text: () => 'Trees or parking between a sidewalk and traffic act as a buffer. Walking gets safer.',
  },
  { applies: (l) => widthOf(l, 'parking') + widthOf(l, 'loading') === 0, text: () => 'No curb space: deliveries, shops and older residents need somewhere to stop.' },
  {
    text: (m) => {
      const low = Object.entries(m.happiness).sort((a, b) => a[1] - b[1])[0][0] as keyof typeof PERSONAS
      return `Fairness is your least happy resident, now ${PERSONAS[low].name}. Their card shows what they need.`
    },
  },
  { text: () => 'Each car lane moves more drivers, but adds speed risk for people walking and biking.' },
  { text: () => 'A bus lane keeps buses out of car traffic, so bus trips stay quick.' },
  { text: () => 'Protected bike lanes feel safer than painted ones, so more people ride.' },
  { text: () => 'Wider sidewalks, trees and patios make walking more pleasant.' },
]

const GOAL: Record<GoalCheck['kind'], (g: GoalCheck) => string> = {
  emissions: (g) => `Emissions cut ${g.value.toFixed(1)}% / ${g.target}%`,
  happiness: (g) => `Least happy ${g.value.toFixed(0)} / ${g.target}`,
  safety: (g) => `Safety ${g.value.toFixed(0)} / ${g.target}`,
}

/**
 * Pip, beside the street: live progress on the goal for the street as it is now, then ideas. Ideas for what this
 * street misses (shared hints) come first, then general tips, skipping any that repeat a hint.
 */
export function Guide({ level, layout, metrics }: { level: Level; layout: Layout; metrics: Metrics }) {
  const [n, setN] = useState(0)
  const score = scoreRun(metrics, level)
  const ideas = hints(layout, metrics, level).map((h) => h.text)
  const said = (t: string) => ideas.some((h) => h.slice(0, 24) === t.slice(0, 24))
  const tips = [...TIPS.filter((t) => t.applies?.(layout, metrics)), ...TIPS.filter((t) => !t.applies)].map((t) => t.text(metrics)).filter((t) => !said(t))
  const all = [...ideas, ...tips]
  const i = n % all.length
  const more = !score.goalMet || score.stars < 3
  const status = !score.goalMet
    ? 'Not there yet. Here’s an idea:'
    : score.stars === 3
      ? 'This design meets the goal and earns every star. Run a day to see how everyone gets on!'
      : 'This meets the goal! Run a day, or try for more stars:'
  return (
    <div>
      <ul className="flex flex-col gap-1 text-sm tabular-nums">
        {score.goals.map((g) => (
          <li key={g.kind} className="flex items-center gap-2">
            <span aria-hidden className={`grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink text-xs font-bold ${g.met ? 'bg-ink text-paper' : 'border-dashed'}`}>
              {g.met ? '✓' : ''}
            </span>
            {GOAL[g.kind](g)}
            <span className="sr-only">{g.met ? ', met' : ', not met'}</span>
          </li>
        ))}
      </ul>
      <div aria-live="polite" className="relative mt-2 rounded-xl border-2 border-ink bg-loading/20 px-2.5 py-2 text-sm">
        <p className="font-semibold">{status}</p>
        {more && <p className="mt-1">{all[i]}</p>}
      </div>
      {more && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button onClick={() => setN(i + 1)} className="min-h-9 text-sm">
            Another idea
          </Button>
          <span className="text-sm tabular-nums">
            {i + 1}/{all.length}
          </span>
        </div>
      )}
    </div>
  )
}
