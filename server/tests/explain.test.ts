import { MOUNT_PLEASANT_LEVEL, type ElementId, type Quiz, type Why } from '@road-diet/shared'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createApp } from '../src/app'
import type { GeminiConfig } from '../src/gemini'

const level = MOUNT_PLEASANT_LEVEL
const S = (...xs: [ElementId, number][]) => ({ elements: xs.map(([id, widthM]) => ({ id, widthM })) })
const layout = S(['sidewalk', 3.4], ['bike_protected', 2], ['car_lane', 3.3], ['car_lane', 3.3], ['parking', 2.6], ['bike_protected', 2], ['sidewalk', 3.4])
const KEY = 'test-key-not-real'
const servers: { close: () => void }[] = []
afterEach(() => servers.splice(0).forEach((s) => s.close()))
beforeEach(() => void vi.spyOn(console, 'warn').mockImplementation(() => {}))

async function start(gemini: GeminiConfig) {
  const server = createApp({ clientDist: '/nonexistent', gemini, db: null }).listen(0)
  servers.push(server)
  await new Promise((r) => server.once('listening', r))
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`
  return async (path: string, b: unknown) => {
    const res = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })
    return { status: res.status, json: await res.json() }
  }
}
const reply = (payload: unknown) => vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }))

test('explain without a key returns the model facts', async () => {
  const post = await start({ model: 'gemini-test' })
  const { status, json } = await post('/explain', { levelId: level.id, layout, topic: 'emissions' })
  expect(status).toBe(200)
  expect((json as Why).source).toBe('fallback')
  expect((json as Why).text).toMatch(/lower than today/)
})

test('explain keeps a grounded Gemini answer and rejects an invented number', async () => {
  const good = await start({ apiKey: KEY, model: 'gemini-test', fetch: reply({ text: 'Some drivers switched to biking because riding felt safer, so emissions fell.' }) })
  expect(((await good('/explain', { levelId: level.id, layout, topic: 'emissions' })).json as Why).source).toBe('gemini')
  const bad = await start({ apiKey: KEY, model: 'gemini-test', fetch: reply({ text: 'Emissions fell 42% because everyone biked.' }) })
  expect(((await bad('/explain', { levelId: level.id, layout, topic: 'emissions' })).json as Why).source).toBe('fallback')
})

test('explain rejects an unknown topic', async () => {
  const post = await start({ model: 'gemini-test' })
  expect((await post('/explain', { levelId: level.id, layout, topic: 'mayor' })).status).toBe(400)
})

test('quiz: the answer comes from the model, Gemini only words it', async () => {
  const post = await start({ apiKey: KEY, model: 'gemini-test', fetch: reply({ id: 'emissions-cause', question: 'What made the air on your street cleaner?', why: 'Some trips moved out of cars, and only switching trips changes emissions here.' }) })
  const q = (await post('/quiz', { levelId: level.id, layout })).json as Quiz
  expect(q.source).toBe('gemini')
  expect(q.question).toBe('What made the air on your street cleaner?')
  expect(q.options[q.answer]).toBe('Some car trips switched to the bus, a bike or walking.')
})

test('quiz falls back when Gemini picks a question that does not exist', async () => {
  const post = await start({ apiKey: KEY, model: 'gemini-test', fetch: reply({ id: 'made-up', question: 'Anything?', why: 'Because.' }) })
  const q = (await post('/quiz', { levelId: level.id, layout })).json as Quiz
  expect(q.source).toBe('fallback')
  expect(q.options).toHaveLength(3)
})
