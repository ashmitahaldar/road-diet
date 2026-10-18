import type { RefObject } from 'react'
import { Button } from '../ui'
import type { CameraApi, View } from './Street3D'

const VIEWS: [View, string][] = [
  ['overview', 'Overview'],
  ['street', 'Street'],
  ['above', 'Above'],
]

/** Buttons for the 3D camera, for anyone who'd rather not drag, and on phones where pinching is fiddly. */
export function CameraBar({ camera, onUse }: { camera: RefObject<CameraApi | null>; onUse: () => void }) {
  const act = (f: (c: CameraApi) => void) => () => {
    if (camera.current) f(camera.current)
    onUse()
  }
  const small = 'min-h-9 min-w-9 px-2 text-sm'
  return (
    <div role="toolbar" aria-label="Camera" className="pointer-events-auto flex items-center justify-center gap-1 rounded-2xl border-2 border-ink bg-paper p-1 shadow-[3px_3px_0_var(--color-ink)]">
      {VIEWS.map(([v, label]) => (
        <Button key={v} className={small} onClick={act((c) => c.view(v))}>
          {label}
        </Button>
      ))}
      <span aria-hidden className="mx-0.5 h-6 w-0.5 bg-grid" />
      {/* Phones turn the view with a drag; the buttons would wrap the bar onto two rows. */}
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
