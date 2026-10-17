import { LEVELS } from '@road-diet/shared'
import express from 'express'
import { existsSync } from 'node:fs'
import { extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const CLIENT_DIST = fileURLToPath(new URL('../../client/dist', import.meta.url))

/** Own keys only, so ids like "constructor" or "__proto__" are not levels. */
export const findLevel = (id: string) => (Object.hasOwn(LEVELS, id) ? LEVELS[id] : undefined)

export function createApp({ clientDist = CLIENT_DIST } = {}) {
  const app = express()
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
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'not-found' })
  })

  // The built game, with an SPA fallback so client-side paths such as /data load the app.
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist))
    // Paths with an extension are files: a missing one (e.g. an old hashed bundle after a redeploy) must 404, not get HTML.
    app.get('/{*splat}', (req, res, next) => (extname(req.path) ? next() : res.sendFile('index.html', { root: clientDist })))
  }
  return app
}
