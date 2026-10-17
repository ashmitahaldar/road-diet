import { LEVELS } from './levels'
import { ELEMENTS, MODEL, TODO_SOURCE } from './model/constants'

/** Paths of every object tagged `source: TODO-SOURCE`, e.g. `elements.car_lane`. Feeds the limitations panel. */
export function listTodoSources(root: object = { elements: ELEMENTS, model: MODEL, levels: LEVELS }, path = ''): string[] {
  return Object.entries(root).flatMap(([key, value]) => {
    if (!value || typeof value !== 'object') return []
    const p = path ? `${path}.${key}` : key
    const self = (value as { source?: unknown }).source === TODO_SOURCE ? [p] : []
    return [...self, ...listTodoSources(value, p)]
  })
}
