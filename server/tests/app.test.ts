import type { AddressInfo } from 'node:net'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../src/app'

const dist = mkdtempSync(join(tmpdir(), 'road-diet-dist-'))
writeFileSync(join(dist, 'index.html'), '<!doctype html><title>Road Diet</title>')

let base = ''
let server: ReturnType<ReturnType<typeof createApp>['listen']>
beforeAll(async () => {
  server = createApp({ clientDist: dist }).listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => server.close())

const get = (path: string) => fetch(base + path)

test('health', async () => {
  expect(await (await get('/api/health')).json()).toEqual({ ok: true })
})

test('levels list and detail', async () => {
  expect(await (await get('/api/levels')).json()).toEqual([{ id: 'bloor-christie-ossington', name: 'Bloor St W (Christie St to Ossington Ave)', widthM: 20 }])
  const level = await (await get('/api/levels/bloor-christie-ossington')).json()
  expect(level.corridor.baselineLayout.elements).toHaveLength(7)
})

test('unknown level and unknown API paths are JSON 404s', async () => {
  for (const path of ['/api/levels/nope', '/api/levels/constructor', '/api/levels/__proto__', '/api/nope']) {
    const res = await get(path)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'not-found' })
  }
})

test('missing files 404 instead of getting the game page', async () => {
  expect((await get('/assets/index-OLDHASH.js')).status).toBe(404)
})

test('client paths fall back to the game', async () => {
  for (const path of ['/', '/data']) {
    const res = await get(path)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<title>Road Diet</title>')
  }
})
