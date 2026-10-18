import type { RefObject } from 'react'
import { Button } from '../ui'
import type { CameraApi, View } from './Street3D'

const VIEWS: [View, string][] = [
  ['overview', 'Overview'],
  ['street', 'Street'],
  ['above', 'Above'],
]

export function CameraBar({ camera, onUse }: { camera: RefObject<CameraApi | null>; onUse: () => void }) {
  const act = (f: (c: CameraApi) => void) => () => {
    if (camera.current) f(camera.current)
    onUse()
  }
  const small = 'min-h-8 min-w-8 px-2 text-sm'
  return (
    <div role="toolbar" aria-label="Camera" className="pointer-events-auto flex items-center justify-center gap-1 rounded-xl border-2 border-ink bg-paper p-1 shadow-[2px_2px_0_var(--color-ink)]">
      {VIEWS.map(([v, label]) => (
        <Button key={v} className={small} onClick={act((c) => c.view(v))}>
          {label}
        </Button>
      ))}
      <span aria-hidden className="mx-0.5 h-6 w-0.5 bg-grid" />
      {/* Hidden on phones, where they would wrap the bar onto two rows. */}
      <Button className={`${small} text-lg max-sm:hidden`} aria-label="Turn left" onClick={act((c) => c.orbit(-Math.PI / 6))}>
        ↺
      </Button>
      <Button className={`${small} text-lg max-sm:hidden`} aria-label="Turn right" onClick={act((c) => c.orbit(Math.PI / 6))}>
        ↻
      </Button>
      <Button className={small} aria-label="Zoom in" onClick={act((c) => c.zoom(0.75))}>
        +
      </Button>
      <Button className={small} aria-label="Zoom out" onClick={act((c) => c.zoom(1.33))}>
        −
      </Button>
    </div>
  )
}
