import { afterAll, describe, expect, test } from 'vitest'
import { connect, type Db } from '../src/db'
import { migrate } from '../src/migrate'

// Never DATABASE_URL: tests create and drop schemas, so they only run against a database meant for it.
const url = process.env.TEST_DATABASE_URL
const pools: Db[] = []

/** A pool confined to a fresh schema (public stays on the path for the timescaledb functions). */
async function freshSchema() {
  const schema = `t_${Math.random().toString(36).slice(2, 10)}`
  const admin = connect(url)!
  await admin.query(`CREATE SCHEMA ${schema}`)
  await admin.end()
  const db = connect(url, { options: `-c search_path=${schema},public` })!
  pools.push(db)
  return { db, schema }
}

afterAll(async () => {
  const admin = connect(url)
  for (const db of pools) await db.end()
  if (admin) {
    const { rows } = await admin.query("SELECT nspname FROM pg_namespace WHERE nspname LIKE 't\\_%'")
    for (const { nspname } of rows) await admin.query(`DROP SCHEMA ${nspname} CASCADE`)
    await admin.end()
  }
})

describe.skipIf(!url)('migrate (needs TEST_DATABASE_URL)', () => {
  test('timescale: hypertable, continuous aggregate with real-time reads, idempotent', async () => {
    const { db, schema } = await freshSchema()
    expect(await migrate(db)).toMatchObject({ applied: true, timescale: true })
    expect(await migrate(db)).toMatchObject({ applied: false })
    const hyper = await db.query('SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_schema = $1 AND hypertable_name = $2', [schema, 'runs'])
    expect(hyper.rowCount).toBe(1)
    const cagg = await db.query('SELECT materialized_only FROM timescaledb_information.continuous_aggregates WHERE view_schema = $1', [schema])
    expect(cagg.rows).toEqual([{ materialized_only: false }])

    await db.query("INSERT INTO runs (level_id, layout, emissions_reduction_pct, safety_score, fairness, stars, demo) VALUES ('l', '{}', 20, 50, 60, 2, false), ('l', '{}', 10, 50, 60, 0, true)")
    const { rows } = await db.query('SELECT sum(plays)::int AS plays, sum(demo_plays)::int AS demo, sum(sum_stars)::int AS stars, sum(stars_2)::int AS two FROM runs_hourly')
    expect(rows[0]).toEqual({ plays: 2, demo: 1, stars: 2, two: 1 })
  })

  test('without timescaledb: plain table and a normal view with the same columns', async () => {
    const { db } = await freshSchema()
    expect(await migrate(db, { useTimescale: false })).toMatchObject({ applied: true, timescale: false })
    await db.query("INSERT INTO runs (level_id, layout, emissions_reduction_pct, safety_score, fairness, stars) VALUES ('l', '{}', 30, 50, 60, 3)")
    const { rows } = await db.query('SELECT plays::int, stars_3::int FROM runs_hourly')
    expect(rows).toEqual([{ plays: 1, stars_3: 1 }])
  })

  test('rejects stars outside 0-3', async () => {
    const { db } = await freshSchema()
    await migrate(db)
    await expect(db.query("INSERT INTO runs (level_id, layout, emissions_reduction_pct, safety_score, fairness, stars) VALUES ('l', '{}', 0, 0, 0, 4)")).rejects.toThrow()
  })
})
