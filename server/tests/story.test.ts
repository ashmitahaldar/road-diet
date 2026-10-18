import { MOUNT_PLEASANT_LEVEL, type DayStory } from '@road-diet/shared'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createApp } from '../src/app'
import type { GeminiConfig } from '../src/gemini'

const level = MOUNT_PLEASANT_LEVEL
const body = { levelId: level.id, layout: level.corridor.baselineLayout }
const KEY = 'test-key-not-real'
const servers: { close: () => void }[] = []
afterEach(() => servers.splice(0).forEach((s) => s.close()))
beforeEach(() => void vi.spyOn(console, 'warn').mockImplementation(() => {}))

async function start(gemini: GeminiConfig & { imageModel?: string }) {
  const server = createApp({ clientDist: '/nonexistent', gemini, db: null }).listen(0)
  servers.push(server)
  await new Promise((r) => server.once('listening', r))
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`
  return async (path: string, b: unknown = body) => {
    const res = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })
    return { status: res.status, json: await res.json() }
  }
}

const reply = (payload: unknown) => vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }))
const days = (panel: string) =>
  ['driver_delivery', 'student_cyclist', 'senior_walker', 'shop_owner'].map((personaId) => ({ personaId, panels: [panel, 'At lunch the street is busy.', 'Home by six.'] }))

test('no key: a story built from the numbers, using this street’s residents', async () => {
  const post = await start({ model: 'gemini-test', fetch: reply({}) })
  const { status, json } = await post('/story')
  const story = json as DayStory
  expect(status).toBe(200)
  expect(story.nameSource).toBe('fallback')
  expect(story.days.map((d) => d.source)).toEqual(['fallback', 'fallback', 'fallback', 'fallback'])
  expect(story.days[0].panels[0]).toMatch(/^Dev drives 6 km\. It takes [\d.]+ min, the same as before\.$/)
})

test('Gemini name and days come through when they pass the checks', async () => {
  const post = await start({ apiKey: KEY, model: 'gemini-test', fetch: reply({ name: 'Leafy Mount Pleasant', days: days('The morning trip feels the same as always.') }) })
  const story = (await post('/story')).json as DayStory
  expect(story.name).toBe('Leafy Mount Pleasant')
  expect(story.nameSource).toBe('gemini')
  expect(story.days.every((d) => d.source === 'gemini')).toBe(true)
})

test('a political or overlong panel falls back for that resident only; a long name falls back', async () => {
  const bad = days('Fine.')
  bad[1].panels[0] = 'She talks about the election on the way.'
  bad[2].panels[1] = Array(40).fill('word').join(' ')
  const post = await start({ apiKey: KEY, model: 'gemini-test', fetch: reply({ name: 'A very long name for a street design', days: bad }) })
  const story = (await post('/story')).json as DayStory
  expect(story.days.map((d) => d.source)).toEqual(['gemini', 'fallback', 'fallback', 'gemini'])
  expect(story.nameSource).toBe('fallback')
})

test('postcard: 503 without an image model, the image when one replies', async () => {
  expect((await (await start({ apiKey: KEY, model: 'gemini-test' }))('/postcard')).status).toBe(503)
  const img = vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } }] } }] }))
  const post = await start({ apiKey: KEY, model: 'gemini-test', imageModel: 'image-test', fetch: img })
  expect((await post('/postcard')).json).toEqual({ image: 'data:image/png;base64,iVBORw0KGgo=' })
})

test('a fast Gemini 503 is retried once', async () => {
  const ok = reply({ name: 'Second Try Street', days: days('Fine.') })
  const flaky = vi.fn(async () => (flaky.mock.calls.length === 1 ? new Response('', { status: 503 }) : ok()))
  const post = await start({ apiKey: KEY, model: 'gemini-test', fetch: flaky as unknown as typeof fetch })
  expect(((await post('/story')).json as DayStory).name).toBe('Second Try Street')
  expect(flaky).toHaveBeenCalledTimes(2)
})
