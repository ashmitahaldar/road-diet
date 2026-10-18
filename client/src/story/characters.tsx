import type { PersonaId } from '@road-diet/shared'
import { motion, useReducedMotion } from 'motion/react'

export const ACCENT: Record<PersonaId, string> = {
  driver_delivery: 'var(--color-loading)',
  student_cyclist: 'var(--color-bike-painted)',
  senior_walker: 'var(--color-sidewalk)',
  shop_owner: 'var(--color-patio)',
}

export function mood(h: number) {
  if (h >= 60) return { word: 'Happy', mouth: 'M10 19 Q16 24 22 19' }
  if (h >= 40) return { word: 'Okay', mouth: 'M10 20 H22' }
  return { word: 'Unhappy', mouth: 'M10 22 Q16 17 22 22' }
}

/** A resident's face: their accent colour, with a mouth that follows their happiness. */
export function Face({ id, happiness, className = 'size-12' }: { id: PersonaId; happiness: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`shrink-0 ${className}`} aria-hidden>
      <circle cx={16} cy={16} r={14} fill={ACCENT[id]} stroke="var(--color-ink)" strokeWidth={2} />
      <circle cx={11.5} cy={13} r={1.8} fill="var(--color-ink)" />
      <circle cx={20.5} cy={13} r={1.8} fill="var(--color-ink)" />
      <path d={mood(happiness).mouth} fill="none" stroke="var(--color-ink)" strokeWidth={2} strokeLinecap="round" />
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
      <motion.g animate={talking && !reduce ? { y: [0, -1.5, 0], rotate: [0, -6, 0] } : { y: 0, rotate: 0 }} transition={{ duration: 0.5, repeat: talking ? 3 : 0 }} style={{ originX: '32px', originY: '24px' }}>
        <ellipse cx={32} cy={22} rx={6} ry={6.5} fill="var(--color-meter-safety)" stroke="var(--color-ink)" strokeWidth={2} />
        <circle cx={34} cy={14} r={6.5} fill="var(--color-sidewalk)" stroke="var(--color-ink)" strokeWidth={2} />
        <circle cx={36} cy={13} r={2.6} fill="var(--color-patio)" />
        <circle cx={36} cy={13} r={1.4} fill="var(--color-ink)" />
        <path d="M40 14 L45.5 16 L40 18 Z" fill="var(--color-ink)" strokeLinejoin="round" />
      </motion.g>
    </svg>
  )
}
