import corridor from '../../../data/corridors/mount-pleasant-eglinton-blythwood.json'
import type { Corridor, ElementId, Level } from '../model/types'

// Level 1: a four-lane street that hasn't had a road diet, so there are many ways to share it.
export const MOUNT_PLEASANT_LEVEL: Level = {
  id: corridor.id,
  name: corridor.name,
  blurb: 'Four car lanes and no bike lanes yet. Lots of ways to share it.',
  corridor: { ...corridor, baselineLayout: { elements: corridor.baselineLayout.elements.map((e) => ({ ...e, id: e.id as ElementId })) } } as Corridor,
  allowedElements: ['sidewalk', 'car_lane', 'bus_lane', 'bike_painted', 'bike_protected', 'parking', 'planter'],
  goal: { minEmissionsReductionPct: 5, minHappiness: 50 },
  stars: { safety: 55, fairness: 60 },
}
