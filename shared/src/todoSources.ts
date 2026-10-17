import { LEVELS } from './levels'
import { DESIGN_CHOICE, ELEMENTS, MODEL, TODO_SOURCE } from './model/constants'

const ROOT = { elements: ELEMENTS, model: MODEL, levels: LEVELS }

/** Paths of every object whose `source` is `tag`, e.g. `elements.car_lane`. */
function listTagged(tag: string, root: object, path = ''): string[] {
  return Object.entries(root).flatMap(([key, value]) => {
    if (!value || typeof value !== 'object') return []
    const p = path ? `${path}.${key}` : key
    const self = (value as { source?: unknown }).source === tag ? [p] : []
    return [...self, ...listTagged(tag, value, p)]
  })
}

/** Values still waiting for a verified source. Feeds the limitations panel and /data. */
export const listTodoSources = (root: object = ROOT) => listTagged(TODO_SOURCE, root)

/** Game-balance parameters: chosen for play, not measured. Shown next to the unsourced list. */
export const listDesignChoices = (root: object = ROOT) => listTagged(DESIGN_CHOICE, root)
