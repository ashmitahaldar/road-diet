import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { ELEMENTS, FALLBACK_LINES } from '@road-diet/shared'
import { OFF_LIMITS } from '../src/gemini'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const sources = (dir: string) =>
  readdirSync(join(repo, dir), { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => ({ file: `${dir}/${f}`, text: readFileSync(join(repo, dir, f), 'utf8') }))

test('spec 2.7: the Gemini off-limits words appear nowhere in client or shared source', () => {
  const hits = [...sources('client/src'), ...sources('shared/src')].flatMap(({ file, text }) =>
    text.split('\n').flatMap((line, i) => (OFF_LIMITS.test(line) ? [`${file}:${i + 1}: ${line.trim()}`] : [])),
  )
  expect(hits).toEqual([])
})

test('the neutrality footer is on every page and on the scorecard', () => {
  const footer = 'A learning tool, not a forecast. Residents are fictional.'
  expect(readFileSync(join(repo, 'client/src/App.tsx'), 'utf8')).toContain(footer)
  expect(readFileSync(join(repo, 'client/src/run/Scorecard.tsx'), 'utf8')).toContain(footer)
})

test('the story says the residents are fictional', () => {
  expect(readFileSync(join(repo, 'client/src/screens/Story.tsx'), 'utf8')).toContain('Everyone you’ll meet here is fictional.')
})

test('canned reactions talk about trips, not lane types', () => {
  const lines = Object.values(FALLBACK_LINES).flatMap((m) => Object.values(m)).join(' ').toLowerCase()
  for (const e of Object.values(ELEMENTS)) expect(lines).not.toContain(e.label.toLowerCase())
  expect(lines).not.toMatch(/\b(car|bike|bus|parking)\s+lanes?\b/)
})
