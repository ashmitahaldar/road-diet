import { connect } from '../db'
import { refreshAggregate } from '../runs'

const db = connect()
if (!db) throw new Error('DATABASE_URL is not set')
try {
  console.log((await refreshAggregate(db)) ? 'runs_hourly refreshed' : 'runs_hourly is a plain view; nothing to refresh')
} finally {
  await db.end()
}
