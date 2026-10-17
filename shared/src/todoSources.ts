import { LEVELS } from './levels'
import { DESIGN_CHOICE, ELEMENTS, MODEL, TODO_SOURCE } from './model/constants'

const ROOT = { elements: ELEMENTS, model: MODEL, levels: LEVELS }

/** `[path, source]` for every object whose string `source` passes `keep`, e.g. `['elements.car_lane', '...']`. */
function listSources(keep: (source: string) => boolean, root: object, path = ''): [string, string][] {
  return Object.entries(root).flatMap(([key, value]) => {
    if (!value || typeof value !== 'object') return []
    const p = path ? `${path}.${key}` : key
    const { source } = value as { source?: unknown }
    const self: [string, string][] = typeof source === 'string' && keep(source) ? [[p, source]] : []
    return [...self, ...listSources(keep, value, p)]
  })
}

const paths = (rows: [string, string][]) => rows.map(([p]) => p)

/** Values still waiting for a verified source. Feeds the limitations panel and /data. */
export const listTodoSources = (root: object = ROOT) => paths(listSources((s) => s === TODO_SOURCE, root))

/** Game-balance parameters: chosen for play, not measured. Shown next to the unsourced list. */
export const listDesignChoices = (root: object = ROOT) => paths(listSources((s) => s === DESIGN_CHOICE, root))

/** Model constants with a real citation, as `[path, citation]`. Corridors cite their own `sources`. */
export const listCitedConstants = (root: object = { elements: ELEMENTS, model: MODEL }) =>
  listSources((s) => s !== TODO_SOURCE && s !== DESIGN_CHOICE, root)
