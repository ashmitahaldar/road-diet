import type { Level } from '../model/types'
import { BLOOR_LEVEL } from './bloor'
import { MOUNT_PLEASANT_LEVEL } from './mountPleasant'

export { BLOOR_LEVEL } from './bloor'
export { MOUNT_PLEASANT_LEVEL } from './mountPleasant'
export { PLACEHOLDER_LEVEL } from './placeholder'

/** Playable levels, in order. The placeholder stays importable for tests but is not a level. */
export const LEVELS: Record<string, Level> = { [MOUNT_PLEASANT_LEVEL.id]: MOUNT_PLEASANT_LEVEL, [BLOOR_LEVEL.id]: BLOOR_LEVEL }
