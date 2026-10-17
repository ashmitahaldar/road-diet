import { PLACEHOLDER_LEVEL, type ReactResult } from '@road-diet/shared'
import type { AddressInfo } from 'node:net'
import { afterEach, expect, test, vi } from 'vitest'
import { createApp } from '../src/app'
import type { GeminiConfig } from '../src/gemini'

const baseline = PLACEHOLDER_LEVEL.corridor.baselineLayout
const KEY = 'test-key-not-real'
const servers: { close: () => void }[] = []
afterEach(() => servers.splice(0).forEach((s) => s.close()))

async function start(gemini: GeminiConfig, reactPerMinute = 20) {
  const server = createApp({ clientDist: '/nonexistent', gemini, reactPerMinute }).listen(0)
  servers.push(server)
  await new Promise((r) => server.once('listening', r))
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/react`
  return async (body: unknown = { levelId: 'placeholder', layout: baseline }) => {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const text = await res.text()
    return { status: res.status, text, json: JSON.parse(text) as ReactResult }
  }
}

const geminiReply = (payload: unknown) =>
  vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ text: typeof payload === 'string' ? payload : JSON.stringify(payload) }] } }] }))

const good = {
  reactions: [
    { personaId: 'driver_delivery', line: 'My six-kilometre route takes about the same time, so my deliveries stay on schedule.' },
    { personaId: 'student_cyclist', line: 'Nothing changed on my ride, so it still feels the same.' },
    { personaId: 'senior_walker', line: 'The sidewalk is as wide as before, so my walk feels unchanged.' },
    { personaId: 'shop_owner', line: 'Foot traffic past my shop looks about the same.' },
  ],
  debrief: 'This design keeps today’s street, so emissions and safety stay where they are. It is a simplified estimate that caps how many trips switch mode.',
}

test('no key: canned fallback, Gemini never called', async () => {
  const fake = geminiReply(good)
  const post = await start({ model: 'gemini-test', fetch: fake })
  const { status, json } = await post()
  expect(status).toBe(200)
  expect(json.source).toBe('fallback')
  expect(json.reactions).toHaveLength(4)
  expect(fake).not.toHaveBeenCalled()
})

test('good Gemini JSON: lines and debrief used, moods from the model numbers, key only in the header', async () => {
  const fake = geminiReply(good)
  const post = await start({ apiKey: KEY, model: 'gemini-test', fetch: fake })
  const { json, text } = await post()
  expect(json.source).toBe('gemini')
  expect(json.reactions.map((r) => r.line)).toEqual(good.reactions.map((r) => r.line))
  expect(json.reactions.map((r) => r.mood)).toEqual(['flat', 'flat', 'flat', 'flat'])
  expect(json.debrief).toBe(good.debrief)
  expect(text).not.toContain(KEY)
  const [url, init] = fake.mock.calls[0] as unknown as [string, RequestInit]
  expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent')
  expect(url).not.toContain(KEY)
  expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(KEY)
  expect(JSON.parse(init.body as string).contents[0].parts[0].text).toContain('"reductionPct":0')
})

test('timeout, HTTP error, malformed JSON and wrong shape all fall back', async () => {
  const hang: typeof fetch = (_u, init) => new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)))
  const cases: GeminiConfig['fetch'][] = [
    hang,
    vi.fn(async () => new Response('quota', { status: 429 })),
    geminiReply('not json {'),
    geminiReply({ lines: ['wrong shape'] }),
  ]
  for (const f of cases) {
    const post = await start({ apiKey: KEY, model: 'gemini-test', fetch: f, timeoutMs: 50 })
    const { status, json } = await post()
    expect(status).toBe(200)
    expect(json.source).toBe('fallback')
  }
})

test('off-limits or overlong lines are replaced; a debrief without a limitation gets one appended', async () => {
  const post = await start({
    apiKey: KEY,
    model: 'gemini-test',
    fetch: geminiReply({
      reactions: [
        { personaId: 'driver_delivery', line: 'Remember to vote in the next election.' },
        { personaId: 'student_cyclist', line: 'word '.repeat(40) },
        good.reactions[2],
        good.reactions[3],
      ],
      debrief: 'Emissions stay the same on this street.',
    }),
  })
  const { json } = await post()
  expect(json.source).toBe('gemini')
  expect(json.reactions[0].line).not.toMatch(/vote|election/i)
  expect(json.reactions[1].line).not.toContain('word word')
  expect(json.reactions[2].line).toBe(good.reactions[2].line)
  expect(json.debrief).toMatch(/^Emissions stay the same on this street\. This is a simplified estimate/)
})

test('a debrief mentioning a party is replaced by the fallback debrief', async () => {
  const post = await start({ apiKey: KEY, model: 'gemini-test', fetch: geminiReply({ ...good, debrief: 'Any party would like this street.' }) })
  const { json } = await post()
  expect(json.debrief).not.toMatch(/party/i)
  expect(json.debrief).toContain('switch mode')
})

test('bad input is rejected before any model call', async () => {
  const fake = geminiReply(good)
  const post = await start({ apiKey: KEY, model: 'gemini-test', fetch: fake })
  expect((await post({ levelId: 'placeholder', layout: { elements: [{ id: 'monorail', widthM: 3 }] } })).status).toBe(400)
  expect((await post({ levelId: 'placeholder', layout: { elements: [...baseline.elements, { id: 'planter', widthM: 2 }] } })).status).toBe(400)
  expect((await post({ levelId: 'nowhere', layout: baseline })).status).toBe(404)
  expect((await post('just a string')).status).toBe(400)
  expect((await post({ levelId: 'placeholder', layout: baseline, pad: 'x'.repeat(20_000) })).status).toBe(413)
  expect(fake).not.toHaveBeenCalled()
})

test('rate limit: extra requests get 429 with a usable fallback body', async () => {
  const post = await start({ model: 'gemini-test' }, 2)
  expect((await post()).status).toBe(200)
  expect((await post()).status).toBe(200)
  const third = await post()
  expect(third.status).toBe(429)
  expect(third.json.reactions).toHaveLength(4)
})
