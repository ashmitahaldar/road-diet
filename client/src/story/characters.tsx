import type { PersonaId } from '@road-diet/shared'
import { motion, useReducedMotion } from 'motion/react'
import { useId, type ReactNode } from 'react'

export const ACCENT: Record<PersonaId, string> = {
  driver_delivery: 'var(--color-loading)',
  student_cyclist: 'var(--color-bike-painted)',
  senior_walker: 'var(--color-sidewalk)',
  shop_owner: 'var(--color-patio)',
}

export function mood(h: number) {
  if (h >= 60) return { word: 'Happy', mouth: 'M20 28 Q24 32 28 28', brow: 0 }
  if (h >= 40) return { word: 'Okay', mouth: 'M20.5 29 H27.5', brow: 0 }
  return { word: 'Unhappy', mouth: 'M20 31 Q24 27.5 28 31', brow: 1.5 }
}

const ink = {
  stroke: 'var(--color-ink)',
  strokeWidth: 1.6,
  strokeLinejoin: 'round',
} as const

/** What makes each resident look like themselves: skin, shirt, and hair or headwear drawn behind and over the head. */
const LOOKS: Record<PersonaId, { skin: string; shirt: string; back?: ReactNode; front: ReactNode }> = {
  driver_delivery: {
    skin: 'var(--color-skin-2)',
    shirt: 'var(--color-primary)',
    // A cap with its brim to the side.
    front: (
      <>
        <path d="M14.6 19.5 Q14.5 10 24 10 Q33.5 10 33.4 19.5 Z" fill="var(--color-car)" {...ink} />
        <path d="M31 18.6 Q37.5 17.8 40 20.4 L31.5 20.8 Z" fill="var(--color-car)" {...ink} />
        <circle cx={24} cy={10.6} r={1.2} fill="var(--color-ink)" />
      </>
    ),
  },
  student_cyclist: {
    skin: 'var(--color-skin-3)',
    shirt: 'var(--color-meter-safety)',
    // Long hair with a side fringe.
    back: <path d="M13.5 25 Q12.5 10.5 24 10.5 Q35.5 10.5 34.5 25 L35 35 Q24 38 13 35 Z" fill="var(--color-ink)" />,
    front: <path d="M14.8 21 Q15.5 11.5 24 11.5 Q32.5 11.5 33.2 20 Q28 15.5 21 17.5 Q17.5 18.6 14.8 21 Z" fill="var(--color-ink)" />,
  },
  senior_walker: {
    skin: 'var(--color-skin-4)',
    shirt: 'var(--color-planter)',
    // Short grey hair, a grey beard and round glasses.
    front: (
      <>
        <path d="M15 19 Q15.5 10.8 24 10.8 Q32.5 10.8 33 19 Q29.5 14.5 24 14.8 Q18.5 14.5 15 19 Z" fill="var(--color-sidewalk)" {...ink} />
        <path d="M16.2 24.5 Q16.5 33.5 24 33.5 Q31.5 33.5 31.8 24.5 Q29 30.5 24 30.4 Q19 30.5 16.2 24.5 Z" fill="var(--color-sidewalk)" {...ink} />
        <circle cx={20.4} cy={22} r={3.1} fill="none" {...ink} />
        <circle cx={27.6} cy={22} r={3.1} fill="none" {...ink} />
        <path d="M23.5 22 H24.5" {...ink} />
      </>
    ),
  },
  shop_owner: {
    skin: 'var(--color-skin-1)',
    shirt: 'var(--color-meter-travel)',
    // A straight bob with a fringe, and small earrings.
    back: <path d="M13.6 27 Q12.5 10.5 24 10.5 Q35.5 10.5 34.4 27 L30.5 27 L30.5 19 L17.5 19 L17.5 27 Z" fill="var(--color-ink)" />,
    front: (
      <>
        <path d="M15.2 19.5 Q15.5 11.5 24 11.5 Q32.5 11.5 32.8 19.5 Z" fill="var(--color-ink)" />
        <circle cx={15.4} cy={26} r={1.3} fill="var(--color-loading)" {...ink} strokeWidth={1} />
        <circle cx={32.6} cy={26} r={1.3} fill="var(--color-loading)" {...ink} strokeWidth={1} />
      </>
    ),
  },
}

/** A resident's portrait on their accent colour. Brows and mouth follow their happiness. */
export function Face({ id, happiness, className = 'size-12' }: { id: PersonaId; happiness: number; className?: string }) {
  const look = LOOKS[id]
  const { mouth, brow } = mood(happiness)
  const clip = useId()
  return (
    <svg viewBox="0 0 48 48" className={`shrink-0 ${className}`} aria-hidden>
      <defs>
        <clipPath id={clip}>
          <circle cx={24} cy={24} r={22} />
        </clipPath>
      </defs>
      <circle cx={24} cy={24} r={22} fill={ACCENT[id]} />
      <g clipPath={`url(#${clip})`}>
        <g transform="translate(24 30) scale(1.2) translate(-24 -27)">
          {look.back}
          <path d="M7 50 Q7 35 24 35 Q41 35 41 50 Z" fill={look.shirt} {...ink} />
          <path d="M21 30 H27 V36 Q24 38 21 36 Z" fill={look.skin} {...ink} />
          <circle cx={14.8} cy={23} r={2.2} fill={look.skin} {...ink} />
          <circle cx={33.2} cy={23} r={2.2} fill={look.skin} {...ink} />
          <ellipse cx={24} cy={22} rx={9} ry={10.2} fill={look.skin} {...ink} />
          <circle cx={20.4} cy={22.2} r={1.4} fill="var(--color-ink)" />
          <circle cx={27.6} cy={22.2} r={1.4} fill="var(--color-ink)" />
          <path
            d={`M18.6 ${18.6 - brow} L22 ${18.4 + brow} M26 ${18.4 + brow} L29.4 ${18.6 - brow}`}
            stroke="var(--color-ink)"
            strokeWidth={1.4}
            strokeLinecap="round"
          />
          <circle cx={18.2} cy={26.4} r={1.8} fill="var(--color-patio)" opacity={0.45} />
          <circle cx={29.8} cy={26.4} r={1.8} fill="var(--color-patio)" opacity={0.45} />
          <path d={mouth} fill="none" stroke="var(--color-ink)" strokeWidth={1.6} strokeLinecap="round" />
          {look.front}
        </g>
      </g>
      <circle cx={24} cy={24} r={22} fill="none" stroke="var(--color-ink)" strokeWidth={2} />
    </svg>
  )
}

/** Pip, the pigeon who guides the player. Bobs while talking. */
export function Pip({ className = 'size-16', talking = false }: { className?: string; talking?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 48 48" className={`shrink-0 ${className}`} aria-hidden>
      <path d="M5 29 L15 25 L15 34 Z" fill="var(--color-car)" stroke="var(--color-ink)" strokeWidth={2} strokeLinejoin="round" />
      <path d="M21 38 V44 M27 38 V44 M18 44 H24 M24 44 H30" stroke="var(--color-patio)" strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={24} cy={30} rx={13} ry={9.5} fill="var(--color-sidewalk)" stroke="var(--color-ink)" strokeWidth={2} />
      <path d="M15 28 Q23 21 31 29 Q23 34 15 28 Z" fill="var(--color-grid)" stroke="var(--color-ink)" strokeWidth={2} strokeLinejoin="round" />
      <motion.g
        animate={talking && !reduce ? { y: [0, -1.5, 0], rotate: [0, -6, 0] } : { y: 0, rotate: 0 }}
        transition={{ duration: 0.5, repeat: talking ? 3 : 0 }}
        style={{ originX: '32px', originY: '24px' }}
      >
        <ellipse cx={32} cy={22} rx={6} ry={6.5} fill="var(--color-meter-safety)" stroke="var(--color-ink)" strokeWidth={2} />
        <circle cx={34} cy={14} r={6.5} fill="var(--color-sidewalk)" stroke="var(--color-ink)" strokeWidth={2} />
        <circle cx={36} cy={13} r={2.6} fill="var(--color-patio)" />
        <circle cx={36} cy={13} r={1.4} fill="var(--color-ink)" />
        <path d="M40 14 L45.5 16 L40 18 Z" fill="var(--color-ink)" strokeLinejoin="round" />
      </motion.g>
    </svg>
  )
}
