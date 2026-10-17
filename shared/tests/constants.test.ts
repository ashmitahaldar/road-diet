import { expect, test } from 'vitest'
import { ELEMENTS, listTodoSources } from '../src'

test('listTodoSources finds every unsourced constant; the Bloor corridor is sourced', () => {
  const paths = listTodoSources()
  for (const id of Object.keys(ELEMENTS)) expect(paths).toContain(`elements.${id}`)
  expect(paths.filter((p) => p.startsWith('levels.'))).toEqual([])
  expect(paths).toContain('model.walkSpeedKph')
  expect(paths).not.toContain('model.bprAlpha')
})
