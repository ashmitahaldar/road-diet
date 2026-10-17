import type { Layout, LevelStats, Metrics, Score } from '@road-diet/shared'
import type { Db } from './db'

export type RunRow = { levelId: string; layout: Layout; metrics: Metrics; score: Score; demo?: boolean; createdAt?: Date }

export async function insertRun(db: Db, r: RunRow) {
  await db.query(
    `INSERT INTO runs (level_id, layout, emissions_reduction_pct, safety_score, fairness, stars, demo, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, coalesce($8, now()))`,
    [r.levelId, JSON.stringify(r.layout), r.metrics.emissionsReductionPct, r.metrics.safetyScore, r.metrics.fairness, r.score.stars, r.demo ?? false, r.createdAt ?? null],
  )
}

export async function getStats(db: Db, levelId: string): Promise<LevelStats> {
  const [agg, mix] = await Promise.all([
    db.query(
      `SELECT coalesce(sum(plays), 0)::int AS plays, coalesce(sum(demo_plays), 0)::int AS demo_plays,
              sum(sum_stars)::float8 / nullif(sum(plays), 0) AS avg_stars,
              sum(sum_emissions_reduction)::float8 / nullif(sum(plays), 0) AS avg_er,
              coalesce(sum(stars_0), 0)::int AS s0, coalesce(sum(stars_1), 0)::int AS s1,
              coalesce(sum(stars_2), 0)::int AS s2, coalesce(sum(stars_3), 0)::int AS s3
       FROM runs_hourly WHERE level_id = $1`,
      [levelId],
    ),
    // Element counts per run, grouped; jsonb keys are normalized so equal mixes compare equal.
    db.query(
      `WITH recent AS (SELECT layout FROM runs WHERE level_id = $1 ORDER BY created_at DESC LIMIT 500)
       SELECT (SELECT jsonb_object_agg(id, n) FROM (SELECT e->>'id' AS id, count(*) AS n
                 FROM jsonb_array_elements(layout->'elements') e GROUP BY 1) x) AS mix,
              count(*)::int AS plays
       FROM recent GROUP BY 1 ORDER BY plays DESC LIMIT 1`,
      [levelId],
    ),
  ])
  const a = agg.rows[0]
  const top = mix.rows[0]
  return {
    plays: a.plays,
    demoPlays: a.demo_plays,
    avgStars: a.avg_stars,
    avgEmissionsReductionPct: a.avg_er,
    starCounts: [a.s0, a.s1, a.s2, a.s3],
    topMix: top?.mix ? { elements: top.mix, plays: top.plays } : null,
  }
}

/**
 * Materialize runs_hourly up to an hour ago, like the policy. Rows backdated into already-materialized
 * buckets (the seed script) only appear after a refresh. Stopping short matters: materializing the
 * current hour would move the watermark past now, and new runs would vanish from real-time reads.
 * Returns false on a plain-Postgres database, where runs_hourly is a normal view.
 */
export async function refreshAggregate(db: Db) {
  try {
    await db.query("CALL refresh_continuous_aggregate('runs_hourly', NULL, now() - INTERVAL '1 hour')")
    return true
  } catch {
    return false
  }
}
