import { CONCEPTS, type Lesson } from '@road-diet/shared'
import { useId, useState } from 'react'

/** Callers give the row `relative`: the definition opens as a bubble across it. */
export function LessonLine({ lesson }: { lesson: Lesson }) {
  const { name, definition } = CONCEPTS[lesson.concept]
  const [open, setOpen] = useState(false)
  const tip = useId()
  return (
    <>
      <span
        aria-hidden
        className={`grid size-6 shrink-0 place-items-center rounded-full border-2 border-ink text-xs font-bold ${lesson.good ? 'bg-ink text-paper' : 'bg-loading'}`}
      >
        {lesson.good ? '✓' : '!'}
      </span>
      <span>
        <strong className="font-display">{name}</strong>
        <span className="sr-only">{lesson.good ? ', went well' : ', to work on'}</span>. {lesson.text}{' '}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={tip}
          onClick={() => setOpen(!open)}
          onBlur={(e) => !e.currentTarget.parentElement?.contains(e.relatedTarget) && setOpen(false)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape' || !open) return
            e.stopPropagation()
            e.preventDefault()
            setOpen(false)
          }}
          className="font-semibold whitespace-nowrap text-primary underline decoration-dotted underline-offset-2 focus-visible:outline-4 focus-visible:outline-primary"
        >
          What’s {name.toLowerCase()}?
        </button>
        {open && (
          <span id={tip} role="note" className="absolute inset-x-2 top-full z-20 mt-1 block rounded-xl border-2 border-ink bg-paper p-3 text-sm shadow-[3px_3px_0_var(--color-ink)]">
            <strong className="font-display">{name}:</strong> {definition}{' '}
            <a href={`/about#${lesson.concept}`} target="_blank" className="font-semibold text-primary underline underline-offset-2">
              More on the About page
            </a>
          </span>
        )}
      </span>
    </>
  )
}
