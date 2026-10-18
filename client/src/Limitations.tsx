import { MODEL, TODO_SOURCE, listDesignChoices, listTodoSources, type Level } from '@road-diet/shared'

const pct = (x: number) => `${Math.round(x * 100)}%`

/** What the model can't know (spec 2.7, 4.5, 8). One component so the scorecard and /data never drift apart. */
export function LimitationsList({ level }: { level: Level }) {
  const todo = listTodoSources()
  const design = listDesignChoices()
  return (
    <>
      <ul className="list-disc space-y-1 pl-5">
        <li>This is a simplified estimate, not a prediction.</li>
        <li>
          Some trips switch mode when the street changes, capped at {pct(MODEL.maxTotalShift.value)} of all trips and {pct(MODEL.maxShiftPerMode.value)} per
          mode. Emissions depend on that assumption.
        </li>
        <li>Safety is an index built from the street layout, not a forecast of collisions.</li>
        <li>The model has no lane directions: removing a car lane is not the same as making a street one-way.</li>
        <li>Residents are fictional. How much each one cares about time, safety, comfort and access is a design choice.</li>
        {level.corridor.source === TODO_SOURCE && <li>This street uses placeholder data until the real Toronto corridor is added.</li>}
      </ul>
      {!!level.corridor.estimates?.length && (
        <>
          <p className="mt-3 font-semibold">Estimates in {level.corridor.name}:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {level.corridor.estimates.map((e) => (
              <li key={e.field}>{e.note}</li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-3 font-semibold">Values still waiting for a source ({todo.length}):</p>
      <p className="mt-1 break-words font-mono text-xs">{todo.join(', ')}</p>
      <p className="mt-3 font-semibold">Game-design parameters, chosen for play and not measured ({design.length}):</p>
      <p className="mt-1 break-words font-mono text-xs">{design.join(', ')}</p>
    </>
  )
}
