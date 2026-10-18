import { Pip } from '../story/characters'
import { Button } from '../ui'

export const TOUR = [
  { id: 'look', text: 'Welcome to the block! Drag on the street to look around, and scroll or pinch to zoom. The camera buttons do the same.' },
  { id: 'select', text: 'Tap any piece of the street to pick it. Its name tag turns blue.' },
  { id: 'edit', text: 'Drag a blue handle to make it narrower or wider, or drag the piece sideways to move it. The Build tray has buttons for the same moves.' },
  { id: 'add', text: 'Now add something from the Build tray. The street is full, so narrow a piece first to free some space. Traffic follows whatever you build.' },
  { id: 'run', text: 'When you’re happy, press Run a day. Your residents will tell you how it went.' },
] as const
export type TourStep = (typeof TOUR)[number]['id']
export const TOUR_KEY = 'road-diet:tour-done'

export function Tour({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  const last = step === TOUR.length - 1
  return (
    <section aria-labelledby="tour-title" className="pointer-events-auto flex max-w-md gap-2 rounded-2xl border-2 border-ink bg-paper p-2 shadow-[3px_3px_0_var(--color-ink)]">
      <Pip key={step} className="size-10" talking />
      <div className="flex-1">
        <h2 id="tour-title" className="font-display text-sm font-semibold">
          Pip’s tour · {step + 1} of {TOUR.length}
        </h2>
        <p aria-live="polite" className="text-sm">
          {TOUR[step].text}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <Button onClick={onNext} className="min-h-9 text-sm">
            {last ? 'Got it' : 'Next'}
          </Button>
          {!last && (
            <Button onClick={onSkip} className="min-h-9 text-sm">
              Skip tour
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
