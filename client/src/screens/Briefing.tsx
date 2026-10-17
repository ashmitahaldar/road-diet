import { ELEMENTS, PERSONAS, TODO_SOURCE, type Level } from '@road-diet/shared'
import { ElementIcon, VISUALS } from '../editor/elementVisuals'
import { Button } from '../ui'

export function goalSentence(level: Level) {
  const { minEmissionsReductionPct, minHappiness, minSafety } = level.goal
  const parts = [
    minEmissionsReductionPct !== undefined && `cut emissions by at least ${minEmissionsReductionPct}%`,
    minSafety !== undefined && `reach a safety score of ${minSafety}`,
    minHappiness !== undefined && `keep every resident at least ${minHappiness} happy`,
  ].filter(Boolean) as string[]
  const s = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : (parts[0] ?? 'design the street you want')
  return `${s[0].toUpperCase()}${s.slice(1)}.`
}

export function Briefing({ level, onStart, onBack }: { level: Level; onStart: () => void; onBack: () => void }) {
  const { corridor } = level
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <p className="font-display text-lg font-semibold text-primary">Level 1 briefing</p>
        <h1 tabIndex={-1} className="font-display text-4xl font-semibold outline-none sm:text-5xl">
          {level.name}
        </h1>
        <p className="mt-2 text-lg">
          {corridor.widthM} m from building to building, {corridor.lengthKm} km long. This is how the space is split today:
        </p>
      </div>

      <div aria-label="Today's street" role="img" className="flex h-20 overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)]">
        {corridor.baselineLayout.elements.map((el, i) => (
          <div
            key={i}
            title={`${ELEMENTS[el.id].label}, ${el.widthM} m`}
            className="grid place-items-center border-r-2 border-ink last:border-r-0"
            style={{ flexBasis: `${(el.widthM / corridor.widthM) * 100}%`, background: VISUALS[el.id].color }}
          >
            <span className="grid size-9 place-items-center rounded-full border-2 border-ink bg-paper">
              <ElementIcon id={el.id} size={24} />
            </span>
          </div>
        ))}
      </div>
      <p className="-mt-2 text-sm">
        {corridor.baselineLayout.elements.map((el) => `${VISUALS[el.id].short} ${el.widthM} m`).join(' · ')}
      </p>

      <section className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <h2 className="font-display text-2xl font-semibold">Your goal</h2>
        <p className="mt-1 text-lg">{goalSentence(level)}</p>
        <p className="mt-2 text-sm">
          ★ goal met · ★★ also safety at least {level.stars.safety} · ★★★ also every resident at least {level.stars.fairness} happy
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Who uses this street</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {Object.values(PERSONAS).map((p) => (
            <li key={p.id} className="rounded-xl border-2 border-ink bg-paper px-3 py-2">
              <strong>{p.name}</strong>. {p.blurb}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">How to play</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-6">
          <li>Drag pieces of street in, move them, resize them or remove them. The width can't go over {corridor.widthM} m.</li>
          <li>Press Run a day to see emissions, safety, travel times and how each resident feels.</li>
          <li>Meet the goal to earn stars, then try for a fairer street.</li>
        </ol>
        {corridor.source === TODO_SOURCE && <p className="mt-2 text-sm">This level uses placeholder numbers until the real Toronto data is added.</p>}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onStart} className="min-h-14 bg-primary px-8 text-xl text-paper shadow-[4px_4px_0_var(--color-ink)] hover:bg-primary hover:brightness-110">
          Start editing
        </Button>
        <Button onClick={onBack} className="min-h-14 px-6">
          Back
        </Button>
      </div>
    </div>
  )
}
