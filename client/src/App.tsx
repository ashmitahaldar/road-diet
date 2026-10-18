import { BLOOR_LEVEL } from '@road-diet/shared'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { Background } from './Background'
import { AboutPage } from './AboutPage'
import { DataPage } from './DataPage'
import { Briefing } from './screens/Briefing'
import { Game } from './screens/Game'
import { Start } from './screens/Start'

type Screen = 'start' | 'briefing' | 'play'

export default function App() {
  const level = BLOOR_LEVEL
  const [screen, setScreen] = useState<Screen>('start')
  const view = useRef<HTMLDivElement>(null)
  const [footerHidden, setFooterHidden] = useState(false)
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
      <div
        className={`mx-auto flex min-h-dvh max-w-7xl flex-col px-4 ${screen === 'play' ? 'gap-3 pt-3 pb-24 fit:h-dvh fit:pb-3' : 'gap-6 pt-6 pb-6'}`}
      >
        {infoPage ? (
          <div className="flex-1">
            {page === 'data' ? <DataPage level={level} /> : <AboutPage level={level} />}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              ref={view}
              className="flex-1 fit:min-h-0"
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
        )}
        {/* Hideable on the game screen only: the scorecard repeats this disclaimer and the Data & Limitations link. */}
        {!(screen === 'play' && footerHidden && !infoPage) && (
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
              {screen === 'play' && !infoPage && (
                <button
                  type="button"
                  aria-label="Hide this bar"
                  onClick={() => {
                    view.current?.querySelector('h1')?.focus({ preventScroll: true })
                    setFooterHidden(true)
                  }}
                  className="grid size-11 place-items-center rounded-full text-lg hover:bg-grid focus-visible:outline-4 focus-visible:outline-primary"
                >
                  <span aria-hidden>✕</span>
                </button>
              )}
            </span>
          </footer>
        )}
      </div>
    </MotionConfig>
  )
}
