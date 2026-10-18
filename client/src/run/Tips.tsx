import { PERSONAS, has, widthOf, type ElementId, type Layout, type Metrics } from '@road-diet/shared'
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

export function Tips({ layout, metrics }: { layout: Layout; metrics: Metrics }) {
  const [n, setN] = useState(0)
  const tips = [...TIPS.filter((t) => t.applies?.(layout, metrics)), ...TIPS.filter((t) => !t.applies)]
  const i = n % tips.length
  return (
    <section aria-labelledby="tips-title" className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
      <div className="flex items-center justify-between gap-2">
        <h2 id="tips-title" className="font-display text-xl font-semibold">
          Design tip
        </h2>
        <span className="text-sm tabular-nums">
          {i + 1}/{tips.length}
        </span>
      </div>
      <p aria-live="polite" className="mt-1 min-h-12">
        {tips[i].text(metrics)}
      </p>
      <Button onClick={() => setN(i + 1)} className="mt-2">
        Next tip
      </Button>
    </section>
  )
}
