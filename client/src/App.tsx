import { BLOOR_LEVEL } from '@road-diet/shared'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { Background } from './Background'
import { AboutPage } from './AboutPage'
import { DataPage } from './DataPage'
import { Briefing } from './screens/Briefing'
import { Game } from './screens/Game'
import { Start } from './screens/Start'
import { Story } from './screens/Story'

type Screen = 'start' | 'story' | 'briefing' | 'play'

export default function App() {
  const level = BLOOR_LEVEL
  const [screen, setScreen] = useState<Screen>('start')
  const view = useRef<HTMLDivElement>(null)
  const go = (next: Screen) => {
    setScreen(next)
    window.scrollTo(0, 0)
  }

  const page = ({ '/data': 'data', '/about': 'about' } as const)[location.pathname]
  const infoPage = !!page
  if (page) document.title = `${page === 'data' ? 'Data & Limitations' : 'About'} · Road Diet`

  return (
    <MotionConfig reducedMotion="user">
      <Background subtle={screen === 'play'} />
      {/* The game screen is the whole window: the street fills it and the panels float on top. */}
      <div className={screen === 'play' && !infoPage ? 'flex h-dvh flex-col' : 'mx-auto flex min-h-dvh max-w-7xl flex-col gap-6 px-4 py-6'}>
        {infoPage ? (
          <div className="flex-1">
            {page === 'data' ? <DataPage level={level} /> : <AboutPage level={level} />}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              ref={view}
              className="min-h-0 flex-1"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.25 }}
              onAnimationComplete={() => view.current?.querySelector('h1')?.focus({ preventScroll: true })}
            >
              {screen === 'start' && <Start onPlay={() => go('story')} />}
              {screen === 'story' && <Story level={level} onDone={() => go('briefing')} onBack={() => go('start')} />}
              {screen === 'briefing' && <Briefing level={level} onStart={() => go('play')} onBack={() => go('story')} />}
              {screen === 'play' && <Game level={level} />}
            </motion.div>
          </AnimatePresence>
        )}
        {/* The game screen carries this line in its header; the scorecard repeats it too. */}
        {!(screen === 'play' && !infoPage) && (
          <footer className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm">
            <span>A learning tool, not a forecast. Residents are fictional.</span>
            <span className="flex flex-wrap items-center gap-x-4">
              <span>Hosted on Vultr</span>
              <a href="/about" target={infoPage ? undefined : '_blank'} className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-2">
                About
              </a>
              <a href="/data" target={infoPage ? undefined : '_blank'} className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-2">
                Data & Limitations
              </a>
            </span>
          </footer>
        )}
      </div>
    </MotionConfig>
  )
}
