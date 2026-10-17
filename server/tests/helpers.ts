import { afterAll } from 'vitest'
import { connect, type Db } from '../src/db'

// Never DATABASE_URL: tests create and drop schemas, so they only run against a database meant for it.
export const url = process.env.TEST_DATABASE_URL
const pools: Db[] = []
const schemas: string[] = []

/** A pool confined to a fresh schema (public stays on the path for the timescaledb functions). */
export async function freshSchema() {
  const schema = `t_${Math.random().toString(36).slice(2, 10)}`
  const admin = connect(url)!
  await admin.query(`CREATE SCHEMA ${schema}`)
  schemas.push(schema)
  await admin.end()
  const db = connect(url, { options: `-c search_path=${schema},public` })!
  pools.push(db)
  return { db, schema }
}

/**
 * Dropping a schema while one of its policy jobs runs makes TimescaleDB 2.30 log "job was deleted during
 * execution", fail with "tuple concurrently updated" or "deadlock detected", and once crashed the server
 * (signal 11). So unschedule the schema's jobs, wait for running ones to finish, then drop.
 */
async function drop(admin: Db, schema: string) {
  // Refresh jobs list the aggregate's schema, compression jobs the hypertable's: both are this schema.
  const { rows } = await admin.query<{ job_id: number }>('SELECT job_id FROM timescaledb_information.jobs WHERE hypertable_schema = $1', [schema])
  const ids = rows.map((r) => r.job_id)
  for (const id of ids) await admin.query('SELECT alter_job($1, scheduled => false)', [id])
  // Background workers name themselves "<policy> [<job id>]".
  for (let wait = 0; ids.length && wait < 50; wait++) {
    const running = await admin.query("SELECT 1 FROM pg_stat_activity WHERE application_name ~ $1", [`\\[(${ids.join('|')})\\]$`])
    if (!running.rowCount) break
    await new Promise((r) => setTimeout(r, 100))
  }
  await admin.query(`DROP SCHEMA ${schema} CASCADE`)
}

afterAll(async () => {
  const admin = connect(url)
  for (const db of pools) await db.end()
  if (admin) {
    for (const schema of schemas) await drop(admin, schema)
    await admin.end()
  }
})

