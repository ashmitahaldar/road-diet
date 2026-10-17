import { listCitedConstants, type Level } from '@road-diet/shared'
import type { ReactNode } from 'react'
import { LimitationsList } from './Limitations'

const link = 'font-semibold text-primary underline underline-offset-2 break-words'

/** Citations are plain strings; turn any URL in them into a link (trailing punctuation stays text). */
function linkify(text: string) {
  return text.split(/(https?:\/\/[^\s)]*[^\s).,])/).map((part, i) =>
    i % 2 ? (
      <a key={i} href={part} className={link}>
        {part}
      </a>
    ) : (
      part
    ),
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-ink bg-paper p-4 sm:p-5">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function DataPage({ level }: { level: Level }) {
  const { corridor } = level
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5">
      <a href="/" className={`${link} inline-flex min-h-11 items-center`}>
        ← Back to the game
      </a>
      <div>
        <h1 tabIndex={-1} className="font-display text-5xl font-semibold tracking-tight outline-none">
          Data & Limitations
        </h1>
        <p className="mt-3 text-lg">
          Road Diet is a simplified estimate, not a prediction. It is a learning tool for exploring how street space gets shared. Residents are
          fictional.
        </p>
      </div>

      <Section title={`${corridor.name}: where the numbers come from`}>
        <ul className="flex flex-col gap-3">
          {corridor.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} className={link}>
                {s.label}
              </a>
              <span className="text-sm"> · retrieved {s.retrieved}</span>
              {s.note && <p className="mt-0.5">{s.note}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Model constants with a source">
        <dl className="flex flex-col gap-3">
          {listCitedConstants().map(([path, citation]) => (
            <div key={path}>
              <dt className="font-mono text-sm font-semibold">{path}</dt>
              <dd className="break-words">{linkify(citation)}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Limitations">
        <LimitationsList level={level} />
      </Section>

      <Section title="Credits">
        <p>
          Street data: City of Toronto (Open Data portal datasets from Transportation Services and Information & Technology; Official Plan Map 3; Lane
          Widths Guideline). Emission factors: UK Department for Energy Security and Net Zero. Lane capacities: NACTO Transit Street Design Guide. Corridor map streets and subway stations:{' '}
          <a href="https://www.openstreetmap.org/copyright" className={link}>
            © OpenStreetMap contributors
          </a>{' '}
          (ODbL).
        </p>
      </Section>
    </main>
  )
}
