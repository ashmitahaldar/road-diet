import { ELEMENTS, type ElementId, type LevelStats, type Stars } from '@road-diet/shared'
import { ElementIcon, VISUALS } from '../editor/elementVisuals'

const BAR_W = 56
const CHART_H = 120
const TOP = 24

/** "How others solved this street" (#19). `stats` undefined = loading; the parent hides it on null. */
export function Others({ stats, yourStars }: { stats?: LevelStats; yourStars: Stars }) {
  if (!stats)
    return (
      <section aria-labelledby="others-title" aria-busy>
        <h3 id="others-title" className="font-display text-lg font-semibold">
          How others solved this street
        </h3>
        <div className="mt-2 h-24 animate-pulse rounded-xl bg-grid motion-reduce:animate-none" />
      </section>
    )

  const { plays, demoPlays, starCounts, avgStars, avgEmissionsReductionPct, topMix } = stats
  const max = Math.max(1, ...starCounts)
  const summary =
    plays === 0
      ? 'No runs yet. Yours will be the first.'
      : `${plays} ${plays === 1 ? 'run' : 'runs'} so far, averaging ${avgStars?.toFixed(1)} stars and a ${avgEmissionsReductionPct?.toFixed(1)}% emissions cut.`
  const mix = topMix ? (Object.entries(topMix.elements) as [ElementId, number][]).sort((a, b) => b[1] - a[1]) : []

  return (
    <section aria-labelledby="others-title">
      <h3 id="others-title" className="font-display text-lg font-semibold">
        How others solved this street
      </h3>
      <p className="mt-1">
        {summary}
        {demoPlays > 0 && ` Includes ${demoPlays} demo ${demoPlays === 1 ? 'run' : 'runs'}.`}
      </p>
      {plays > 0 && (
        <div className="mt-3 flex flex-wrap items-end gap-6">
          <svg
            viewBox={`0 0 ${BAR_W * 4 + 24} ${TOP + CHART_H + 32}`}
            className="w-64 max-w-full"
            role="img"
            aria-label={`Runs by stars: ${starCounts.map((n, s) => `${s} ${s === 1 ? 'star' : 'stars'}: ${n}`).join(', ')}. You got ${yourStars}.`}
          >
            {starCounts.map((n, s) => {
              const h = Math.max(2, (n / max) * CHART_H)
              const x = 8 + s * (BAR_W + 2)
              const you = s === yourStars
              return (
                <g key={s}>
                  <rect x={x} y={TOP + CHART_H - h} width={BAR_W - 8} height={h} rx={6} fill={you ? 'var(--color-primary)' : 'var(--color-grid)'} stroke="var(--color-ink)" strokeWidth={2} />
                  <text x={x + (BAR_W - 8) / 2} y={TOP + CHART_H - h - 6} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--color-ink)" className="tabular-nums">
                    {n}
                  </text>
                  <text x={x + (BAR_W - 8) / 2} y={TOP + CHART_H + 22} textAnchor="middle" fontSize={13} fill="var(--color-ink)">
                    {s}★{you ? ' (you)' : ''}
                  </text>
                </g>
              )
            })}
          </svg>
          <table className="sr-only">
            <caption>Runs by number of stars</caption>
            <tbody>
              {starCounts.map((n, s) => (
                <tr key={s}>
                  <th scope="row">{s} {s === 1 ? 'star' : 'stars'}</th>
                  <td>{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {topMix && (
            <div className="min-w-56 flex-1">
              <p className="text-sm font-semibold">
                Most common street ({topMix.plays} {topMix.plays === 1 ? 'run' : 'runs'})
              </p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {mix.map(([id, n]) => (
                  <li key={id} className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-paper py-0.5 pr-2 pl-1 text-sm">
                    <span aria-hidden className="grid size-6 place-items-center rounded-md border-2 border-ink" style={{ background: VISUALS[id].color }}>
                      <span className="grid size-4 place-items-center rounded-full bg-paper">
                        <ElementIcon id={id} size={12} />
                      </span>
                    </span>
                    <span className="tabular-nums">
                      {n} × {ELEMENTS[id].label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
