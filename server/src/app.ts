import { ELEMENTS, LEVELS, computeMetrics, fallbackResult, scoreRun, validateLayout, type ElementId } from '@road-diet/shared'
import express from 'express'
import { existsSync } from 'node:fs'
import { extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { connect, type Db } from './db'
import { react, type GeminiConfig } from './gemini'
import { getStats, insertRun } from './runs'

const CLIENT_DIST = fileURLToPath(new URL('../../client/dist', import.meta.url))

/** Own keys only, so ids like "constructor" or "__proto__" are not levels. */
export const findLevel = (id: string) => (Object.hasOwn(LEVELS, id) ? LEVELS[id] : undefined)

const RunInput = z.object({
  levelId: z.string().max(64),
  layout: z.object({
    elements: z
      .array(z.object({ id: z.enum(Object.keys(ELEMENTS) as [ElementId, ...ElementId[]]), widthM: z.number().finite() }))
      .max(20),
  }),
})

/** Body of /api/react and /api/runs: a level id plus a layout that passes validateLayout. */
function parseRun(body: unknown) {
  const input = RunInput.safeParse(body)
  if (!input.success) return { ok: false, status: 400, body: { error: 'invalid-request' } } as const
  const level = findLevel(input.data.levelId)
  if (!level) return { ok: false, status: 404, body: { error: 'not-found' } } as const
  const check = validateLayout(input.data.layout, level)
  if (!check.valid) return { ok: false, status: 400, body: { error: 'invalid-layout', errors: check.errors } } as const
  return { ok: true, level, layout: input.data.layout, metrics: computeMetrics(input.data.layout, level) } as const
}

/** True when this IP has made more than `perMinute` calls in the last minute. */
function rateLimiter(perMinute: number) {
  // ponytail: per-process map of request times per IP; fine on one box, swap for a shared store if we scale out.
  const hits = new Map<string, number[]>()
  return (ip = '') => {
    const now = Date.now()
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000)
    recent.push(now)
    hits.set(ip, recent)
    if (hits.size > 1000) for (const [k, times] of hits) if (now - times[times.length - 1] >= 60_000) hits.delete(k)
    return recent.length > perMinute
  }
}

type Options = { clientDist?: string; gemini?: GeminiConfig; db?: Db | null; reactPerMinute?: number; runsPerMinute?: number; statsPerMinute?: number }

export function createApp({
  clientDist = CLIENT_DIST,
  gemini = { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL },
  db = connect(),
  reactPerMinute = 20,
  runsPerMinute = 20,
  statsPerMinute = 60,
}: Options = {}) {
  const app = express()
  const reactLimited = rateLimiter(reactPerMinute)
  const runsLimited = rateLimiter(runsPerMinute)
  const statsLimited = rateLimiter(statsPerMinute)
  app.set('trust proxy', 'loopback')
  app.use(express.json({ limit: '16kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })
  app.get('/api/levels', (_req, res) => {
    res.json(Object.values(LEVELS).map(({ id, name, corridor }) => ({ id, name, widthM: corridor.widthM })))
  })
  app.get('/api/levels/:id', (req, res) => {
    const level = findLevel(req.params.id)
    if (level) res.json(level)
    else res.status(404).json({ error: 'not-found' })
  })
  // One Gemini call per run (spec 5.2). Metrics are recomputed here so the model only sees trusted numbers.
  app.post('/api/react', async (req, res) => {
    const run = parseRun(req.body)
    if (!run.ok) return void res.status(run.status).json(run.body)
    const { level, layout, metrics } = run
    if (reactLimited(req.ip)) return void res.status(429).json(fallbackResult(metrics))

    const base = computeMetrics(level.corridor.baselineLayout, level)
    res.json(await react({ level, layout, metrics, base, score: scoreRun(metrics, level) }, gemini))
  })

  // Run history for "how others solved this street" (#18). A missing or failing database never breaks play.
  app.post('/api/runs', async (req, res) => {
    const run = parseRun(req.body)
    if (!run.ok) return void res.status(run.status).json(run.body)
    if (!db) return void res.status(503).json({ error: 'no-db' })
    if (runsLimited(req.ip)) return void res.status(429).json({ error: 'rate-limited' })
    const score = scoreRun(run.metrics, run.level)
    try {
      await insertRun(db, { levelId: run.level.id, layout: run.layout, metrics: run.metrics, score })
      res.status(201).json({ stars: score.stars })
    } catch (err) {
      console.warn(`runs: insert failed (${(err as Error).message})`)
      res.status(503).json({ error: 'no-db' })
    }
  })
  app.get('/api/stats/:levelId', async (req, res) => {
    const level = findLevel(req.params.levelId)
    if (!level) return void res.status(404).json({ error: 'not-found' })
    if (!db) return void res.status(503).json({ error: 'no-db' })
    if (statsLimited(req.ip)) return void res.status(429).json({ error: 'rate-limited' })
    try {
      res.json(await getStats(db, level.id))
    } catch (err) {
      console.warn(`stats: query failed (${(err as Error).message})`)
      res.status(503).json({ error: 'no-db' })
    }
  })

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'not-found' })
  })
  // Body-parser failures (bad JSON, over 16 kB) answer in JSON like every other /api error.
  app.use('/api', (err: { status?: number; type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status && err.status < 500 ? err.status : 500
    res.status(status).json({ error: status === 413 ? 'too-large' : status < 500 ? 'invalid-request' : 'server-error' })
  })

  // The built game, with an SPA fallback so client-side paths such as /data load the app.
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist))
    // Paths with an extension are files: a missing one (e.g. an old hashed bundle after a redeploy) must 404, not get HTML.
    app.get('/{*splat}', (req, res, next) => (extname(req.path) ? next() : res.sendFile('index.html', { root: clientDist })))
  }
  return app
}
