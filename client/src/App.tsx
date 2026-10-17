import { PLACEHOLDER_LEVEL } from '@road-diet/shared'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { Background } from './Background'
import { Briefing } from './screens/Briefing'
import { Game } from './screens/Game'
import { Start } from './screens/Start'

type Screen = 'start' | 'briefing' | 'play'

export default function App() {
  const level = PLACEHOLDER_LEVEL
  const [screen, setScreen] = useState<Screen>('start')
  const view = useRef<HTMLDivElement>(null)
  const go = (next: Screen) => {
    setScreen(next)
    window.scrollTo(0, 0)
  }

  return (
    <MotionConfig reducedMotion="user">
      <Background subtle={screen === 'play'} />
      <div className={`mx-auto flex min-h-dvh max-w-7xl flex-col gap-6 px-4 pt-6 ${screen === 'play' ? 'pb-24 xl:pb-6' : 'pb-6'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            ref={view}
            className="flex-1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.25 }}
            onAnimationComplete={() => view.current?.querySelector('h1')?.focus({ preventScroll: true })}
          >
            {screen === 'start' && <Start onPlay={() => go('briefing')} />}
            {screen === 'briefing' && <Briefing level={level} onStart={() => go('play')} onBack={() => go('start')} />}
            {screen === 'play' && <Game level={level} />}
          </motion.div>
        </AnimatePresence>
        <footer className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm">
          <span>A learning tool, not a forecast. Residents are fictional.</span>
          <span className="flex flex-wrap items-center gap-x-4">
            <span>Hosted on Vultr</span>
            <a href="/data" className="font-semibold text-primary underline underline-offset-2">
              Data & Limitations
            </a>
          </span>
        </footer>
      </div>
    </MotionConfig>
  )
}
