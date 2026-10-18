import { allBadges, type BadgeId, type Level } from '@road-diet/shared'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '../ui'

const ink = { stroke: 'var(--color-ink)', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const

const ART: Record<BadgeId, { color: string; icon: ReactNode }> = {
  fair_share: {
    color: 'var(--color-meter-fairness)',
    icon: (
      <>
        <path d="M32 30 V18 A12 12 0 0 1 44 30 Z" fill="var(--color-loading)" />
        <path d="M32 30 H44 A12 12 0 0 1 32 42 Z" fill="var(--color-bike-painted)" />
        <path d="M32 30 V42 A12 12 0 0 1 20 30 Z" fill="var(--color-patio)" />
        <path d="M32 30 H20 A12 12 0 0 1 32 18 Z" fill="var(--color-sidewalk)" />
        <circle cx={32} cy={30} r={12} {...ink} />
        <path d="M32 18 V42 M20 30 H44" {...ink} strokeWidth={1.8} />
      </>
    ),
  },
  low_carbon: {
    color: 'var(--color-meter-emissions)',
    icon: (
      <>
        <path d="M21 41 Q20 20 43 19 Q43 41 21 41 Z" {...ink} fill="var(--color-bike-painted)" />
        <path d="M21 41 L36 26" {...ink} />
      </>
    ),
  },
  second_choice: {
    color: 'var(--color-loading)',
    icon: (
      <>
        <path d="M32 17 V40 M21 23 H43 M26 42 H38" {...ink} />
        <path d="M21 23 L16 32 H26 Z M43 23 L38 32 H48 Z" {...ink} fill="var(--color-paper)" strokeWidth={2} />
      </>
    ),
  },
  safe_streets: {
    color: 'var(--color-meter-safety)',
    icon: (
      <>
        <path d="M32 16 L44 20.5 V30 Q44 39.5 32 44.5 Q20 39.5 20 30 V20.5 Z" {...ink} fill="var(--color-sidewalk)" />
        <path d="M26.5 30.5 L30.5 34.5 L38 26.5" {...ink} />
      </>
    ),
  },
}

/** A medal with ribbons. Locked badges are drawn grey. */
export function BadgeArt({ id, locked = false, className = 'size-16' }: { id: BadgeId; locked?: boolean; className?: string }) {
  const { color, icon } = ART[id]
  return (
    <svg viewBox="0 0 64 72" aria-hidden className={`shrink-0 ${locked ? 'opacity-40 grayscale' : ''} ${className}`}>
      <path d="M20 46 L12 68 L20 64 L25 70 L31 50 Z" fill="var(--color-primary)" stroke="var(--color-ink)" strokeWidth={2} strokeLinejoin="round" />
      <path d="M44 46 L52 68 L44 64 L39 70 L33 50 Z" fill="var(--color-bus)" stroke="var(--color-ink)" strokeWidth={2} strokeLinejoin="round" />
      <circle cx={32} cy={30} r={25} fill={color} stroke="var(--color-ink)" strokeWidth={2.5} />
      <circle cx={32} cy={30} r={18} fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth={2} />
      {icon}
      {locked && <path d="M27 31 V27 A5 5 0 0 1 37 27 V31 M25 31 H39 V40 H25 Z" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth={2.2} strokeLinejoin="round" />}
    </svg>
  )
}

/** Earned badges, by badge, with the streets each was earned on. */
export type Collection = Partial<Record<BadgeId, string[]>>

/** A "Badges" button that opens the collection: every badge, earned or locked, and how to earn it. */
export function BadgesButton({ collection, levels }: { collection: Collection; levels: Level[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (open && !d?.open) d?.showModal()
    if (!open && d?.open) d.close()
  }, [open])
  const count = Object.keys(collection).length
  const nameOf = (id: string) => levels.find((l) => l.id === id)?.name ?? id
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Badges <span className="tabular-nums">{count}/{allBadges().length}</span>
      </Button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        aria-labelledby="collection-title"
        className="m-auto max-h-[90dvh] w-[min(36rem,calc(100%-2rem))] rounded-3xl border-2 border-ink bg-paper p-5 text-ink shadow-[6px_6px_0_var(--color-ink)] backdrop:bg-ink/50"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="collection-title" className="font-display text-2xl font-semibold">
            Your badges
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="grid size-11 place-items-center rounded-full border-2 border-ink bg-paper text-lg hover:bg-grid focus-visible:outline-4 focus-visible:outline-primary"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>
        <p className="mt-1 text-sm">Earn them by meeting a street’s goal in a balanced way. None of them rewards a particular kind of lane.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {allBadges().map((b) => {
            const where = collection[b.id]
            return (
              <li key={b.id} className={`flex gap-3 rounded-2xl border-2 border-ink p-3 ${where ? 'bg-loading/20' : 'border-dashed'}`}>
                <BadgeArt id={b.id} locked={!where} className="size-14" />
                <div>
                  <p className="font-display font-semibold">
                    {b.name}
                    <span className="sr-only">{where ? ', earned' : ', locked'}</span>
                  </p>
                  <p className="text-sm">{b.description}</p>
                  {where && <p className="mt-1 text-xs">Earned on {where.map(nameOf).join(' and ')}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      </dialog>
    </>
  )
}
