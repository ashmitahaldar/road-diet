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

afterAll(async () => {
  const admin = connect(url)
  for (const db of pools) await db.end()
  if (admin) {
    for (const schema of schemas) await admin.query(`DROP SCHEMA ${schema} CASCADE`)
    await admin.end()
  }
})

