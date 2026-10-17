import { BLOOR_LEVEL, type LevelStats } from '@road-diet/shared'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createApp } from '../src/app'
import { connect, type Db } from '../src/db'
import { migrate } from '../src/migrate'
import { refreshAggregate } from '../src/runs'
import { freshSchema, url } from './helpers'

const baseline = BLOOR_LEVEL.corridor.baselineLayout
// Bloor with one car lane turned into trees and a wider bike lane.
const redesign = {
  elements: [
    { id: 'sidewalk', widthM: 3.7 },
    { id: 'bike_protected', widthM: 1.8 },
    { id: 'parking', widthM: 2.4 },
    { id: 'car_lane', widthM: 3.3 },
    { id: 'planter', widthM: 3 },
    { id: 'bike_protected', widthM: 2.1 },
    { id: 'sidewalk', widthM: 3.7 },
  ],
}
const servers: { close: () => void }[] = []
afterEach(() => servers.splice(0).forEach((s) => s.close()))
beforeEach(() => void vi.spyOn(console, 'warn').mockImplementation(() => {}))

async function start(db: Db | null, runsPerMinute = 20, statsPerMinute = 60) {
  const server = createApp({ clientDist: '/nonexistent', gemini: {}, db, runsPerMinute, statsPerMinute }).listen(0)
  servers.push(server)
  await new Promise((r) => server.once('listening', r))
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`
  return {
    save: (layout: unknown, levelId = BLOOR_LEVEL.id) =>
      fetch(`${base}/runs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ levelId, layout }) }),
    stats: (levelId = BLOOR_LEVEL.id) => fetch(`${base}/stats/${levelId}`),
  }
}

test('no database: both endpoints answer 503, bad input is still rejected first', async () => {
  const api = await start(null)
  expect((await api.save(baseline)).status).toBe(503)
  expect((await api.stats()).status).toBe(503)
  expect((await api.save({ elements: [{ id: 'monorail', widthM: 3 }] })).status).toBe(400)
  expect((await api.stats('nowhere')).status).toBe(404)
})

test('database unreachable: 503, no crash', async () => {
  const dead = connect('postgres://nobody:x@127.0.0.1:1/none', { connectionTimeoutMillis: 300 })
  const api = await start(dead)
  expect((await api.save(baseline)).status).toBe(503)
  expect((await api.stats()).status).toBe(503)
  await dead!.end()
})

describe.skipIf(!url)('with a database (needs TEST_DATABASE_URL)', () => {
  test('a saved run shows up in stats right away, with stars from the server', async () => {
    const { db } = await freshSchema()
    await migrate(db)
    const api = await start(db)
    const empty = (await (await api.stats()).json()) as LevelStats
    expect(empty).toEqual({ plays: 0, demoPlays: 0, avgStars: null, avgEmissionsReductionPct: null, starCounts: [0, 0, 0, 0], topMix: null })

    const saved = await api.save(redesign)
    expect(saved.status).toBe(201)
    const { stars } = await saved.json()
    await api.save(redesign)
    await api.save(baseline)

    const s = (await (await api.stats()).json()) as LevelStats
    expect(s.plays).toBe(3)
    expect(s.demoPlays).toBe(0)
    expect(s.starCounts.reduce((a, b) => a + b, 0)).toBe(3)
    expect(s.starCounts[stars]).toBeGreaterThanOrEqual(2)
    expect(s.topMix).toEqual({ elements: { sidewalk: 2, bike_protected: 2, parking: 1, car_lane: 1, planter: 1 }, plays: 2 })
    expect(s.avgEmissionsReductionPct).toBeGreaterThan(0)
  })

  test('a run saved after a manual refresh still shows up immediately', async () => {
    const { db } = await freshSchema()
    await migrate(db)
    const api = await start(db)
    await api.save(baseline)
    expect(await refreshAggregate(db)).toBe(true)
    await api.save(redesign)
    expect(((await (await api.stats()).json()) as LevelStats).plays).toBe(2)
  })

  test('concurrent refreshes wait for each other instead of failing', async () => {
    const { db } = await freshSchema()
    await migrate(db)
    await db.query(
      "INSERT INTO runs (level_id, layout, emissions_reduction_pct, safety_score, fairness, stars, created_at) SELECT 'l', '{}', 1, 1, 1, 1, now() - (g || ' hours')::interval FROM generate_series(2, 2000) g",
    )
    expect(await Promise.all([refreshAggregate(db), refreshAggregate(db), refreshAggregate(db)])).toEqual([true, true, true])
  })

  test('refresh is a no-op on a plain view and throws on a real error', async () => {
    const { db } = await freshSchema()
    await migrate(db, { useTimescale: false })
    expect(await refreshAggregate(db)).toBe(false)
    const dead = connect('postgres://nobody:x@127.0.0.1:1/none', { connectionTimeoutMillis: 300 })!
    await expect(refreshAggregate(dead)).rejects.toThrow()
    await dead.end()
  })

  test('writes and stats reads are rate limited', async () => {
    const { db } = await freshSchema()
    await migrate(db)
    const api = await start(db, 2, 2)
    expect((await api.save(baseline)).status).toBe(201)
    expect((await api.save(baseline)).status).toBe(201)
    expect((await api.save(baseline)).status).toBe(429)
    expect((await api.stats()).status).toBe(200)
    expect((await api.stats()).status).toBe(200)
    expect((await api.stats()).status).toBe(429)
  })
})
