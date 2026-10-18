import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border-2 border-ink bg-paper px-3 font-medium hover:bg-grid focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-paper ${className}`}
      {...props}
    />
  )
}

/** Shown only when the text really came from Gemini (spec 1.7b, #15). */
export function GeminiLabel() {
  return <span className="inline-block rounded-full border-2 border-ink bg-paper px-2 text-xs font-semibold">Powered by Gemini</span>
}

/** "+1.2", "−0.4" or "±0.0", signed after rounding so a tiny change never shows as "−0". */
export function signed(x: number, digits = 1) {
  const r = Number(x.toFixed(digits))
  return `${r > 0 ? '+' : r < 0 ? '−' : '±'}${Math.abs(r).toFixed(digits)}`
}

export function Panel({ id, title, open, onToggle, children, className = '' }: { id: string; title: ReactNode; open: boolean; onToggle: () => void; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={`${id}-title`} className={`pointer-events-auto flex min-h-0 flex-col rounded-2xl border-2 border-ink bg-paper shadow-[3px_3px_0_var(--color-ink)] ${className}`}>
      <h2 className="font-display font-semibold">
        <button
          type="button"
          id={`${id}-title`}
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={onToggle}
          className="flex min-h-10 w-full items-center gap-2 rounded-2xl px-3 text-left hover:bg-grid focus-visible:outline-4 focus-visible:outline-primary"
        >
          <span className="flex flex-1 items-center gap-2">{title}</span>
          <span aria-hidden className={`text-base transition-transform motion-reduce:transition-none ${open ? '' : '-rotate-90'}`}>
            ▾
          </span>
        </button>
      </h2>
      {open && (
        // Focusable so keyboard users can scroll a long panel.
        <div id={`${id}-body`} tabIndex={0} className="min-h-0 overflow-y-auto rounded-b-2xl px-3 pb-3 text-sm focus-visible:outline-4 focus-visible:outline-primary">
          {children}
        </div>
      )}
    </section>
  )
}

export function StepNav({ step, count, onBack, onNext, last }: { step: number; count: number; onBack: () => void; onNext: () => void; last: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button onClick={onBack} className="min-h-14 px-6">
        Back
      </Button>
      <span aria-hidden className="flex gap-1.5">
        {Array.from({ length: count }, (_, n) => (
          <span key={n} className={`size-2.5 rounded-full border-2 border-ink ${n <= step ? 'bg-ink' : ''}`} />
        ))}
      </span>
      <span className="sr-only">
        Step {step + 1} of {count}
      </span>
      <Button onClick={onNext} className="min-h-14 bg-primary px-8 text-xl text-paper shadow-[4px_4px_0_var(--color-ink)] hover:bg-primary hover:brightness-110">
        {step === count - 1 ? last : 'Next'}
      </Button>
    </div>
  )
}

const infoLink = 'inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-2'

/** An "i" button that opens the disclaimer and info links in a native popover (Escape and outside clicks close it). */
export function InfoButton({ id, newTab = false, square = false, panelClassName = '', children }: { id: string; newTab?: boolean; square?: boolean; panelClassName?: string; children?: ReactNode }) {
  const target = newTab ? '_blank' : undefined
  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        aria-label="About this game"
        className={`grid size-11 shrink-0 place-items-center border-2 border-ink bg-paper font-display text-xl font-semibold hover:bg-grid focus-visible:outline-4 focus-visible:outline-primary ${square ? 'rounded-xl' : 'rounded-full shadow-[2px_2px_0_var(--color-ink)]'}`}
      >
        i
      </button>
      <div id={id} popover="auto" className={`inset-auto m-0 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-ink bg-paper p-4 text-sm text-ink shadow-[4px_4px_0_var(--color-ink)] ${panelClassName}`}>
        <p>A learning tool, not a forecast. Residents are fictional.</p>
        <p className="mt-1">Hosted on Vultr.</p>
        <p className="flex gap-4">
          <a href="/about" target={target} className={infoLink}>
            About
          </a>
          <a href="/data" target={target} className={infoLink}>
            Data & Limitations
          </a>
        </p>
        {children}
      </div>
    </>
  )
}
