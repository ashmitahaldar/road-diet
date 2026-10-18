import { PERSONAS, type Level, type PersonaId } from '@road-diet/shared'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Face, Pip } from '../story/characters'
import { Button } from '../ui'
import { goalSentence } from './Briefing'

type Who = 'pip' | PersonaId
const CAST: Who[] = ['pip', ...(Object.keys(PERSONAS) as PersonaId[])]
const nameOf = (who: Who) => (who === 'pip' ? 'Pip' : PERSONAS[who].name)

/** The opening conversation: Pip introduces the street, each resident asks for help, Pip sets the goal. */
function script(level: Level): { who: Who; text: string }[] {
  const { corridor } = level
  const goal = goalSentence(level)
  return [
    { who: 'pip', text: `Coo! Hi, I’m Pip. I live on a lamppost on ${corridor.name}. From up there I see everyone who comes by.` },
    { who: 'pip', text: `This block is ${corridor.widthM} m wide, and every metre already has a job. My neighbours all want something different from it. Can you help them?` },
    ...(Object.keys(PERSONAS) as PersonaId[]).map((id) => ({ who: id as Who, text: PERSONAS[id].ask })),
    {
      who: 'pip',
      text: 'They can’t all get everything. Space you give one of them comes from someone else. Planners call reshaping a street’s lanes like this a road diet. You can narrow lanes, swap them or add them back.',
    },
    { who: 'pip', text: `Here’s the challenge. ${goal} Emissions only fall when some car trips switch to the bus, a bike or walking.` },
    { who: 'pip', text: 'Build a design, then run a day to see how everyone gets on. I’ll sit beside the street with ideas if you get stuck. Ready?' },
  ]
}

export function Story({ level, onDone, onBack }: { level: Level; onDone: () => void; onBack: () => void }) {
  const lines = script(level)
  const [i, setI] = useState(0)
  const line = lines[i]
  const last = i === lines.length - 1
  const resident = line.who !== 'pip' ? PERSONAS[line.who] : null

  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col justify-center gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-lg font-semibold text-primary">Level 1</p>
          <h1 tabIndex={-1} className="font-display text-4xl font-semibold outline-none sm:text-5xl">
            {level.name}
          </h1>
        </div>
        <Button onClick={onDone} className="shrink-0">
          Skip story
        </Button>
      </div>

      {/* Everyone in the story; whoever is talking steps forward. */}
      <ul aria-label="Who you’ll meet" className="flex flex-wrap items-end justify-center gap-3 sm:gap-5">
        {CAST.map((who) => {
          const on = who === line.who
          return (
            <li key={who} className="flex flex-col items-center gap-1">
              <motion.div animate={{ scale: on ? 1.15 : 0.9, opacity: on ? 1 : 0.55 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
                {who === 'pip' ? <Pip className="size-16 sm:size-20" talking={on} /> : <Face id={who} happiness={50} className="size-14 sm:size-16" />}
              </motion.div>
              <span className={`text-sm ${on ? 'font-semibold' : ''}`}>{nameOf(who)}</span>
            </li>
          )
        })}
      </ul>

      <section aria-label="Story" className="relative min-h-44 rounded-3xl border-2 border-ink bg-paper p-5 shadow-[6px_6px_0_var(--color-ink)] sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <p className="font-display text-xl font-semibold">
              {nameOf(line.who)}
              {resident && <span className="ml-2 font-sans text-sm font-normal">{resident.blurb}</span>}
            </p>
            <p aria-live="polite" className="mt-2 text-lg sm:text-xl">
              {line.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button onClick={() => (i === 0 ? onBack() : setI(i - 1))} className="min-h-14 px-6">
          Back
        </Button>
        <span aria-hidden className="flex gap-1.5">
          {lines.map((_, n) => (
            <span key={n} className={`size-2.5 rounded-full border-2 border-ink ${n <= i ? 'bg-ink' : ''}`} />
          ))}
        </span>
        <span className="sr-only">
          Line {i + 1} of {lines.length}
        </span>
        <Button
          onClick={() => (last ? onDone() : setI(i + 1))}
          className="min-h-14 bg-primary px-8 text-xl text-paper shadow-[4px_4px_0_var(--color-ink)] hover:bg-primary hover:brightness-110"
        >
          {last ? 'Let’s go' : 'Next'}
        </Button>
      </div>
    </main>
  )
}
