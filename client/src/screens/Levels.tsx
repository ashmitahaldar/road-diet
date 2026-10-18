import type { Level } from '@road-diet/shared'
import { Button } from '../ui'
import { goalSentence } from './Briefing'

export function Levels({ levels, best, onPick, onBack }: { levels: Level[]; best: Record<string, number>; onPick: (level: Level) => void; onBack: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col justify-center gap-5">
      <h1 tabIndex={-1} className="font-display text-4xl font-semibold outline-none sm:text-5xl">
        Choose a street
      </h1>
      <ol className="flex flex-col gap-4">
        {levels.map((level, i) => (
          <li key={level.id} className="flex flex-col gap-3 rounded-3xl border-2 border-ink bg-paper p-5 shadow-[5px_5px_0_var(--color-ink)] sm:flex-row sm:items-center">
            <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-primary font-display text-2xl font-semibold text-paper">
              {i + 1}
            </span>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold">
                <span className="sr-only">Level {i + 1}: </span>
                {level.name}
              </h2>
              <p>{level.blurb}</p>
              <p className="mt-1 text-sm">
                <strong>Goal:</strong> {goalSentence(level)}
              </p>
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <span className="tabular-nums" aria-label={`Best: ${best[level.id] ?? 0} of 3 stars`}>
                {[1, 2, 3].map((n) => (n <= (best[level.id] ?? 0) ? '★' : '☆')).join('')}
              </span>
              <Button onClick={() => onPick(level)} className="bg-primary px-6 text-paper hover:bg-primary hover:brightness-110">
                Play
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <Button onClick={onBack} className="self-start px-6">
        Back
      </Button>
    </main>
  )
}
