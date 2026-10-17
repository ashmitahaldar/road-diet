import type { Level } from '../model/types'
import { BLOOR_LEVEL } from './bloor'

export { BLOOR_LEVEL } from './bloor'
export { PLACEHOLDER_LEVEL } from './placeholder'

/** Playable levels, in order. The placeholder stays importable for tests but is not a level. */
export const LEVELS: Record<string, Level> = { [BLOOR_LEVEL.id]: BLOOR_LEVEL }
