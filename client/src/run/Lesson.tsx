import { CONCEPTS, type Lesson } from '@road-diet/shared'

/** One concept applied to the player's street: a ✓ or ! badge, the concept's name, what happened and a link to learn more. */
export function LessonLine({ lesson }: { lesson: Lesson }) {
  const { name } = CONCEPTS[lesson.concept]
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
        <a href={`/about#${lesson.concept}`} target="_blank" className="font-semibold whitespace-nowrap text-primary underline underline-offset-2">
          What’s {name.toLowerCase()}?
        </a>
      </span>
    </>
  )
}
