import { fallbackWhy, whyFacts, type Layout, type Level, type Topic, type Why } from '@road-diet/shared'
import { useId, useState } from 'react'
import { Pip } from '../story/characters'
import { GeminiLabel } from '../ui'

const cache = new Map<string, Promise<Why>>()

function fetchWhy(level: Level, layout: Layout, topic: Topic): Promise<Why> {
  const key = `${level.id}|${topic}|${JSON.stringify(layout)}`
  if (!cache.has(key))
    cache.set(
      key,
      fetch('/api/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ levelId: level.id, layout, topic }),
        signal: AbortSignal.timeout(9000),
      })
        .then(async (res) => {
          const body = (await res.json()) as Partial<Why>
          if (!res.ok || typeof body.text !== 'string') throw new Error('no explanation')
          return body as Why
        })
        .catch(() => fallbackWhy(whyFacts(layout, level, topic))),
    )
  return cache.get(key)!
}

/** "Why?" next to a result: Pip explains the cause, from the model's facts. */
export function WhyButton({ level, layout, topic, label }: { level: Level; layout: Layout; topic: Topic; label: string }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [why, setWhy] = useState<Why | null>(null)
  const toggle = () => {
    setOpen(!open)
    if (!open && !why) fetchWhy(level, layout, topic).then(setWhy)
  }
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Why? ${label}`}
        onClick={toggle}
        className="inline-flex min-h-6 shrink-0 items-center rounded-full border-2 border-ink bg-paper px-2 text-xs font-semibold hover:bg-grid focus-visible:outline-4 focus-visible:outline-primary aria-expanded:bg-loading/40"
      >
        Why?
      </button>
      <div id={id} hidden={!open} aria-live="polite" className="mt-1.5 basis-full rounded-xl border-2 border-ink bg-loading/20 p-2 text-sm">
        {open && (
          <div className="flex gap-2">
            <Pip className="size-8 shrink-0" />
            {why ? (
              <p>
                {why.text} {why.source === 'gemini' && <GeminiLabel />}
              </p>
            ) : (
              <p className="animate-pulse motion-reduce:animate-none">Pip is thinking…</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
