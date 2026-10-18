import { LEVELS, type BadgeId, type Level } from '@road-diet/shared'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { Background } from './Background'
import { InfoButton } from './ui'
import { AboutPage } from './AboutPage'
import { DataPage } from './DataPage'
import type { Collection } from './run/Badges'
import { Briefing } from './screens/Briefing'
import { Game } from './screens/Game'
import { Levels } from './screens/Levels'
import { Start } from './screens/Start'
import { Story } from './screens/Story'

type Screen = 'start' | 'levels' | 'story' | 'briefing' | 'play'
const ORDER = Object.values(LEVELS)
const BEST = 'road-diet:best-stars'
const EARNED = 'road-diet:badges'
const FOOTER = 'road-diet:footer'

function read<T>(key: string): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}')
  } catch {
    return {} as T
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // progress just isn't remembered
  }
}

export default function App() {
  const [level, setLevel] = useState<Level>(ORDER[0])
  const [screen, setScreen] = useState<Screen>('start')
  const [best, setBest] = useState(() => read<Record<string, number>>(BEST))
  const [collection, setCollection] = useState(() => read<Collection>(EARNED))
  const [footer, setFooter] = useState(() => read<{ hidden?: boolean }>(FOOTER).hidden !== true)
  const toggleFooter = (show: boolean) => {
    setFooter(show)
    save(FOOTER, { hidden: !show })
  }
  const record = (id: string, stars: number, badges: BadgeId[]) => {
    if (stars > (best[id] ?? 0)) {
      const next = { ...best, [id]: stars }
      setBest(next)
      save(BEST, next)
    }
    const fresh = badges.filter((b) => !collection[b]?.includes(id))
    if (fresh.length) {
      const next = { ...collection, ...Object.fromEntries(fresh.map((b) => [b, [...(collection[b] ?? []), id]])) }
      setCollection(next)
      save(EARNED, next)
    }
  }
  const number = ORDER.indexOf(level) + 1
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
      <div className={screen === 'play' && !infoPage ? 'flex h-dvh flex-col' : 'mx-auto flex min-h-dvh max-w-7xl flex-col gap-6 px-4 py-6'}>
        {infoPage ? (
          <div className="flex-1">
            {page === 'data' ? <DataPage levels={ORDER} /> : <AboutPage levels={ORDER} />}
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
              {screen === 'start' && <Start onPlay={() => go('levels')} />}
              {screen === 'levels' && (
                <Levels
                  levels={ORDER}
                  best={best}
                  collection={collection}
                  onBack={() => go('start')}
                  onPick={(l) => {
                    setLevel(l)
                    go('story')
                  }}
                />
              )}
              {screen === 'story' && <Story level={level} number={number} onDone={() => go('briefing')} onBack={() => go('levels')} />}
              {screen === 'briefing' && <Briefing level={level} number={number} onStart={() => go('play')} onBack={() => go('story')} />}
              {screen === 'play' && <Game key={level.id} level={level} levels={ORDER} collection={collection} onResult={(s, b) => record(level.id, s, b)} onExit={() => go('levels')} />}
            </motion.div>
          </AnimatePresence>
        )}
        {!(screen === 'play' && !infoPage) && !footer && (
          <div className="fixed right-4 bottom-4 z-40">
            <InfoButton id="page-info" newTab={!infoPage} panelClassName="right-4 bottom-18">
              <button type="button" onClick={() => toggleFooter(true)} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2">
                Keep this on screen
              </button>
            </InfoButton>
          </div>
        )}
        {!(screen === 'play' && !infoPage) && footer && (
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
              <button
                type="button"
                aria-label="Hide footer"
                onClick={() => toggleFooter(false)}
                className="grid size-11 place-items-center rounded-full hover:bg-grid focus-visible:outline-4 focus-visible:outline-primary"
              >
                <span aria-hidden>✕</span>
              </button>
            </span>
          </footer>
        )}
      </div>
    </MotionConfig>
  )
}
