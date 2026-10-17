import type { Db } from './db'

// Spec 7.1, plus `demo` (seeded runs are never shown as real players) and per-star counts and sums in
// the aggregate, so stats are exact averages across buckets rather than averages of averages.
const RUNS = `
CREATE TABLE IF NOT EXISTS runs (
  id                      BIGINT GENERATED ALWAYS AS IDENTITY,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  level_id                TEXT NOT NULL,
  layout                  JSONB NOT NULL,
  emissions_reduction_pct DOUBLE PRECISION NOT NULL,
  safety_score            DOUBLE PRECISION NOT NULL,
  fairness                DOUBLE PRECISION NOT NULL,
  stars                   SMALLINT NOT NULL CHECK (stars BETWEEN 0 AND 3),
  event_id                TEXT,
  demo                    BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (id, created_at)
)`

const HOURLY_SELECT = `
SELECT time_bucket('1 hour', created_at) AS bucket,
       level_id,
       count(*) AS plays,
       count(*) FILTER (WHERE demo) AS demo_plays,
       sum(stars) AS sum_stars,
       sum(emissions_reduction_pct) AS sum_emissions_reduction,
       count(*) FILTER (WHERE stars = 0) AS stars_0,
       count(*) FILTER (WHERE stars = 1) AS stars_1,
       count(*) FILTER (WHERE stars = 2) AS stars_2,
       count(*) FILTER (WHERE stars = 3) AS stars_3
FROM runs
GROUP BY bucket, level_id`

export type MigrateResult = { applied: boolean; timescale: boolean; compression?: boolean }

/** Idempotent. Continuous aggregates can't run in a transaction, so statements run one by one. */
export async function migrate(db: Db, { useTimescale = true } = {}): Promise<MigrateResult> {
  await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())')
  const done = await db.query("SELECT 1 FROM schema_migrations WHERE id = '001_runs'")
  const timescale = useTimescale && (await hasTimescale(db))
  if (done.rowCount) return { applied: false, timescale }

  await db.query(RUNS)
  let compression = false
  if (timescale) {
    await db.query("SELECT create_hypertable('runs', 'created_at', if_not_exists => TRUE)")
    await db.query(
      `CREATE MATERIALIZED VIEW IF NOT EXISTS runs_hourly WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS ${HOURLY_SELECT} WITH NO DATA`,
    )
    await db.query(
      "SELECT add_continuous_aggregate_policy('runs_hourly', start_offset => INTERVAL '30 days', end_offset => INTERVAL '1 hour', schedule_interval => INTERVAL '30 minutes', if_not_exists => TRUE)",
    )
    try {
      await db.query("ALTER TABLE runs SET (timescaledb.compress, timescaledb.compress_segmentby = 'level_id')")
      await db.query("SELECT add_compression_policy('runs', INTERVAL '30 days', if_not_exists => TRUE)")
      compression = true
    } catch (err) {
      console.warn(`migrate: compression not enabled (${(err as Error).message})`)
    }
  } else {
    // ponytail: plain view recomputed on every read; fine for hackathon volumes.
    console.warn('migrate: timescaledb not available; runs is a plain table and runs_hourly a normal view')
    await db.query(`CREATE OR REPLACE VIEW runs_hourly AS ${HOURLY_SELECT.replace("time_bucket('1 hour', created_at)", "date_trunc('hour', created_at)")}`)
  }
  await db.query("INSERT INTO schema_migrations (id) VALUES ('001_runs')")
  return { applied: true, timescale, compression }
}

async function hasTimescale(db: Db) {
  try {
    await db.query('CREATE EXTENSION IF NOT EXISTS timescaledb')
    return true
  } catch {
    return false
  }
}
