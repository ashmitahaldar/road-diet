import type { Quiz } from '@road-diet/shared'
import { useState } from 'react'
import { Pip } from '../story/characters'
import { GeminiLabel } from '../ui'

/** One question about the player's own design. The right answer always comes from the model. */
export function QuickCheck({ quiz }: { quiz: Quiz | null }) {
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <section aria-labelledby="check-title" aria-busy={!quiz} className="rounded-2xl border-2 border-ink p-4">
      <h3 id="check-title" className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold">
        Quick check {quiz?.source === 'gemini' && <GeminiLabel />}
      </h3>
      {quiz ? (
        <>
          <p id="check-question" className="mt-1 font-medium">
            {quiz.question}
          </p>
          <div role="group" aria-labelledby="check-question" className="mt-2 flex flex-col gap-2">
            {quiz.options.map((o, i) => {
              const right = picked !== null && i === quiz.answer
              const wrong = picked === i && i !== quiz.answer
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={picked === i}
                  // aria-disabled, not disabled, so focus stays on the button that was picked.
                  aria-disabled={picked !== null}
                  onClick={() => picked === null && setPicked(i)}
                  className={`flex min-h-11 items-center gap-2 rounded-xl border-2 border-ink px-3 text-left font-medium aria-[disabled=false]:hover:bg-grid focus-visible:outline-4 focus-visible:outline-primary ${right ? 'bg-meter-safety/25' : wrong ? 'border-dashed' : 'bg-paper'}`}
                >
                  <span aria-hidden className="w-4 font-bold">
                    {right ? '✓' : wrong ? '✗' : ''}
                  </span>
                  {o}
                  {right && <span className="sr-only"> (correct answer)</span>}
                </button>
              )
            })}
          </div>
          <div aria-live="polite">
            {picked !== null && (
              <div className="mt-3 flex gap-2 rounded-xl bg-loading/20 p-2">
                <Pip className="size-9 shrink-0" />
                <p>
                  <strong>{picked === quiz.answer ? 'Right!' : 'Not quite.'}</strong> {quiz.why}
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div aria-label="Writing a question" className="mt-2 h-24 animate-pulse rounded-xl bg-grid motion-reduce:animate-none" />
      )}
    </section>
  )
}
