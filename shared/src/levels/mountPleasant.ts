import corridor from '../../../data/corridors/mount-pleasant-eglinton-blythwood.json'
import type { Corridor, ElementId, Level } from '../model/types'

// Level 1: a four-lane street that hasn't had a road diet, so there are many ways to share it.
export const MOUNT_PLEASANT_LEVEL: Level = {
  id: corridor.id,
  name: corridor.name,
  blurb: 'Four car lanes and no bike lanes yet. Lots of ways to share it.',
  learn: 'How a road diet frees up space, and why emissions only fall when some trips switch to the bus, a bike or walking (mode shift).',
  corridor: { ...corridor, baselineLayout: { elements: corridor.baselineLayout.elements.map((e) => ({ ...e, id: e.id as ElementId })) } } as Corridor,
  // Fictional residents, never real people.
  cast: {
    driver_delivery: {
      name: 'Dev',
      blurb: 'Courier who drops parcels at homes and shops along the street.',
      ask: 'I’m in and out of my van all day. I need to keep moving, and somewhere at the curb to pull over.',
      wants: 'a quick drive and a spot to pull over',
      look: 'dev',
    },
    student_cyclist: {
      name: 'Maya',
      blurb: 'High-school student who would bike to school if it felt safer.',
      ask: 'I’d love to bike to school, but riding right beside fast traffic is scary. Give me a ride where I feel safe.',
      wants: 'a ride that feels safe',
      look: 'maya',
    },
    senior_walker: {
      name: 'Mrs. Rossi',
      blurb: 'Retired teacher who walks to the pharmacy and the shops.',
      ask: 'I walk to the pharmacy and the shops most days. The cars go fast. I’d like room to walk and a spot where my son can drop me off.',
      wants: 'a calmer walk and a drop-off spot',
      look: 'rossi',
    },
    shop_owner: {
      name: 'Omar',
      blurb: 'Runs a bakery on the street and depends on walk-in customers and deliveries.',
      ask: 'My bakery needs people walking past and my flour deliveries reaching the door. Make it a street people want to stop on.',
      wants: 'walk-in customers and deliveries at the door',
      look: 'omar',
    },
  },
  allowedElements: ['sidewalk', 'car_lane', 'bus_lane', 'bike_painted', 'bike_protected', 'parking', 'planter'],
  goal: { minEmissionsReductionPct: 5, minHappiness: 50 },
  stars: { safety: 55, fairness: 60 },
}
