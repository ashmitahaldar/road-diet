import { SideBike, SideBus, SideCar, Shopfront, Walker } from '../Background'
import { Pip } from '../story/characters'
import { Button } from '../ui'

const link = 'inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-2'

function Hero() {
  return (
    <div aria-hidden className="relative aspect-[3/2] w-full max-w-md overflow-hidden rounded-3xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)]">
      <svg viewBox="0 0 300 200" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <g transform="translate(96 22) scale(0.92)">
          <Shopfront h={106} wall="var(--color-grid)" awning="var(--color-patio)" />
        </g>
        <g transform="translate(190 8) scale(0.92)">
          <Shopfront h={122} wall="var(--color-sidewalk)" awning="var(--color-planter)" />
        </g>
        <rect x={-2} y={120} width={304} height={14} fill="var(--color-sidewalk)" stroke="var(--color-ink)" strokeWidth={2} />
        <rect x={-2} y={134} width={304} height={68} fill="var(--color-car)" opacity={0.85} />
        <path d="M0 167 H300" stroke="var(--color-paper)" strokeWidth={3} strokeDasharray="14 10" />
        <rect x={48} y={58} width={5} height={62} rx={2} fill="var(--color-ink)" />
        <path d="M50 60 Q50 50 64 50" fill="none" stroke="var(--color-ink)" strokeWidth={4} strokeLinecap="round" />
        <circle cx={66} cy={53} r={5} fill="var(--color-loading)" stroke="var(--color-ink)" strokeWidth={2} />
        <circle cx={28} cy={98} r={18} fill="var(--color-planter)" stroke="var(--color-ink)" strokeWidth={2} />
        <rect x={25} y={110} width={6} height={12} fill="var(--color-car)" stroke="var(--color-ink)" strokeWidth={1.5} />
      </svg>
      <div className="absolute top-[2%] left-[9%] w-[22%]">
        <Pip className="w-full" talking />
      </div>
      <p className="absolute top-[5%] left-[33%] max-w-[46%] rounded-2xl border-2 border-ink bg-paper px-3 py-1.5 text-left font-display text-sm leading-snug font-semibold shadow-[2px_2px_0_var(--color-ink)] sm:text-base">
        Coo! Can you help my neighbours share this street?
      </p>
      <Walker shirt="var(--color-meter-travel)" skin="var(--color-skin-3)" className="absolute bottom-[33%] left-[62%] h-[16%] w-auto" />
      <Walker shirt="var(--color-patio)" skin="var(--color-skin-1)" className="absolute bottom-[33%] left-[70%] h-[16%] w-auto" />
      <SideBus className="absolute bottom-[19%] left-[40%] h-[17%] w-auto" />
      <SideCar color="var(--color-primary)" className="absolute bottom-[3%] left-[58%] h-[13%] w-auto" />
      <SideBike shirt="var(--color-meter-safety)" className="absolute bottom-[3%] left-[14%] h-[15%] w-auto" />
    </div>
  )
}

export function Start({ onPlay }: { onPlay: () => void }) {
  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-5xl items-center gap-8 lg:grid-cols-2">
      <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
        <h1 tabIndex={-1} className="font-display text-7xl font-semibold tracking-tight outline-none sm:text-8xl">
          Road Diet
        </h1>
        <p className="font-display text-2xl sm:text-3xl">Every street has a budget. How would you spend it?</p>
        <p className="max-w-xl text-lg">Redesign a real Toronto street, run a day, and see how your neighbours feel about it.</p>
        <Button onClick={onPlay} className="min-h-16 bg-primary px-14 font-display text-3xl text-paper shadow-[5px_5px_0_var(--color-ink)] hover:bg-primary hover:brightness-110">
          Play
        </Button>
        <div className="flex flex-wrap justify-center gap-x-6">
          <a href="/about" className={link}>
            About the game
          </a>
          <a href="/data" className={link}>
            Data & Limitations
          </a>
        </div>
      </div>
      <div className="flex justify-center">
        <Hero />
      </div>
    </main>
  )
}
