import pg from 'pg'

export type Db = pg.Pool

/** Null when DATABASE_URL is unset: the game runs without stats. */
export function connect(url = process.env.DATABASE_URL, options: pg.PoolConfig = {}): Db | null {
  return url ? new pg.Pool({ connectionString: url, max: 5, connectionTimeoutMillis: 3000, ...options }) : null
}
