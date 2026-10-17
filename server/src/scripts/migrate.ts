import { connect } from '../db'
import { migrate } from '../migrate'

const db = connect()
if (!db) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}
try {
  console.log('migrate:', await migrate(db))
} finally {
  await db.end()
}
