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

/** A floating card whose body folds away under its title. The title is a real heading with a toggle inside it. */
export function Panel({ id, title, open, onToggle, children, className = '' }: { id: string; title: ReactNode; open: boolean; onToggle: () => void; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={`${id}-title`} className={`pointer-events-auto flex min-h-0 flex-col rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] ${className}`}>
      <h2 className="font-display text-lg font-semibold">
        <button
          type="button"
          id={`${id}-title`}
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={onToggle}
          className="flex min-h-11 w-full items-center gap-2 rounded-2xl px-3 text-left hover:bg-grid focus-visible:outline-4 focus-visible:outline-primary"
        >
          <span className="flex flex-1 items-center gap-2">{title}</span>
          <span aria-hidden className={`text-base transition-transform motion-reduce:transition-none ${open ? '' : '-rotate-90'}`}>
            ▾
          </span>
        </button>
      </h2>
      {open && (
        // Focusable so keyboard users can scroll a long panel.
        <div id={`${id}-body`} tabIndex={0} className="min-h-0 overflow-y-auto rounded-b-2xl px-3 pb-3 focus-visible:outline-4 focus-visible:outline-primary">
          {children}
        </div>
      )}
    </section>
  )
}
