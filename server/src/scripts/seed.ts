import { addElement, computeMetrics, removeElement, resizeElement, scoreRun, type ElementId, type Layout } from '@road-diet/shared'
import { parseArgs } from 'node:util'
import { findLevel } from '../app'
import { connect } from '../db'
import { insertRun, refreshAggregate } from '../runs'

// Demo runs for an empty database. Rows are marked demo = true, and the chart says how many it includes.
const { values } = parseArgs({ options: { level: { type: 'string', default: 'placeholder' }, n: { type: 'string', default: '40' } } })
const level = findLevel(values.level!)
if (!level) throw new Error(`unknown level ${values.level}`)
const db = connect()
if (!db) throw new Error('DATABASE_URL is not set')

const pick = (n: number) => Math.floor(Math.random() * n)

/** A plausible redesign: swap 1-3 car lanes or parking for other allowed elements, then give spare width to sidewalks. */
function randomLayout(): Layout {
  let l = level!.corridor.baselineLayout
  for (let swaps = 1 + pick(3); swaps > 0; swaps--) {
    const swappable = l.elements.flatMap((e, i) => (e.id === 'car_lane' || e.id === 'parking' ? [i] : []))
    if (!swappable.length) break
    const i = swappable[pick(swappable.length)]
    l = removeElement(l, i)
    const options = level!.allowedElements.filter((id) => id !== 'car_lane' && id !== 'parking')
    for (let k = 0; k < 2; k++) l = addElement(l, level!, options[pick(options.length)], i)
  }
  for (const id of ['sidewalk', 'planter'] as ElementId[]) {
    l.elements.forEach((e, i) => {
      if (e.id === id) l = resizeElement(l, level!, i, 5)
    })
  }
  return l
}

try {
  for (let i = 0; i < Number(values.n); i++) {
    const layout = randomLayout()
    const metrics = computeMetrics(layout, level)
    const createdAt = new Date(Date.now() - pick(7 * 24 * 3600) * 1000)
    await insertRun(db, { levelId: level.id, layout, metrics, score: scoreRun(metrics, level), demo: true, createdAt })
  }
  await refreshAggregate(db)
  console.log(`seeded ${values.n} demo runs for ${level.id}`)
} finally {
  await db.end()
}
