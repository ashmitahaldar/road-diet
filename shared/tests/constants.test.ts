import { expect, test } from 'vitest'
import { ELEMENTS, listTodoSources } from '../src'

test('listTodoSources finds every placeholder constant', () => {
  const paths = listTodoSources()
  for (const id of Object.keys(ELEMENTS)) expect(paths).toContain(`elements.${id}`)
  expect(paths).toContain('levels.placeholder.corridor')
  expect(paths).toContain('model.walkSpeedKph')
  expect(paths).not.toContain('model.bprAlpha')
})
