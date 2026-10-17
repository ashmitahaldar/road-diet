import { Button } from '../ui'

export function Start({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-2xl flex-col items-center justify-center gap-6 text-center">
      <h1 tabIndex={-1} className="font-display text-7xl font-semibold tracking-tight outline-none sm:text-8xl">
        Road Diet
      </h1>
      <p className="font-display text-2xl sm:text-3xl">Every street has a budget. How would you spend it?</p>
      <p className="max-w-xl text-lg">
        Redesign a Toronto street. Run a day. See how residents feel.
      </p>
      <Button onClick={onPlay} className="min-h-16 bg-primary px-14 font-display text-3xl text-paper shadow-[5px_5px_0_var(--color-ink)] hover:bg-primary hover:brightness-110">
        Play
      </Button>
      <a href="/data" className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-2">
        Data & Limitations
      </a>
    </div>
  )
}
