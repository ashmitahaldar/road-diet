import { ELEMENTS, LEVELS, computeMetrics, fallbackResult, scoreRun, validateLayout, type ElementId } from '@road-diet/shared'
import express from 'express'
import { existsSync } from 'node:fs'
import { extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { react, type GeminiConfig } from './gemini'

const CLIENT_DIST = fileURLToPath(new URL('../../client/dist', import.meta.url))

/** Own keys only, so ids like "constructor" or "__proto__" are not levels. */
export const findLevel = (id: string) => (Object.hasOwn(LEVELS, id) ? LEVELS[id] : undefined)

const ReactInput = z.object({
  levelId: z.string().max(64),
  layout: z.object({
    elements: z
      .array(z.object({ id: z.enum(Object.keys(ELEMENTS) as [ElementId, ...ElementId[]]), widthM: z.number().finite() }))
      .max(20),
  }),
})

type Options = { clientDist?: string; gemini?: GeminiConfig; reactPerMinute?: number }

export function createApp({
  clientDist = CLIENT_DIST,
  gemini = { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL },
  reactPerMinute = 20,
}: Options = {}) {
  const app = express()
  // ponytail: per-process map of request times per IP; fine on one box, swap for a shared store if we scale out.
  const reactHits = new Map<string, number[]>()
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
    const input = ReactInput.safeParse(req.body)
    if (!input.success) return void res.status(400).json({ error: 'invalid-request' })
    const level = findLevel(input.data.levelId)
    if (!level) return void res.status(404).json({ error: 'not-found' })
    const { layout } = input.data
    const check = validateLayout(layout, level)
    if (!check.valid) return void res.status(400).json({ error: 'invalid-layout', errors: check.errors })

    const metrics = computeMetrics(layout, level)
    const now = Date.now()
    const hits = (reactHits.get(req.ip ?? '') ?? []).filter((t) => now - t < 60_000)
    hits.push(now)
    reactHits.set(req.ip ?? '', hits)
    if (reactHits.size > 1000) for (const [ip, times] of reactHits) if (now - times[times.length - 1] >= 60_000) reactHits.delete(ip)
    if (hits.length > reactPerMinute) return void res.status(429).json(fallbackResult(metrics))

    const base = computeMetrics(level.corridor.baselineLayout, level)
    res.json(await react({ level, layout, metrics, base, score: scoreRun(metrics, level) }, gemini))
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
