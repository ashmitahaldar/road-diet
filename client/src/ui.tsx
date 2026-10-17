import type { ButtonHTMLAttributes } from 'react'

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border-2 border-ink bg-paper px-3 font-medium hover:bg-grid focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-paper ${className}`}
      {...props}
    />
  )
}

/** "+1.2", "−0.4" or "±0.0", signed after rounding so a tiny change never shows as "−0". */
export function signed(x: number, digits = 1) {
  const r = Number(x.toFixed(digits))
  return `${r > 0 ? '+' : r < 0 ? '−' : '±'}${Math.abs(r).toFixed(digits)}`
}
