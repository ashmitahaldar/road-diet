import type { Badge, Layout, Stars } from '@road-diet/shared'
import { VISUALS } from '../editor/elementVisuals'
import { signed } from '../ui'

export type CardData = {
  levelName: string
  stars: Stars
  badges: Badge[]
  emissionsDeltaKg: number
  emissionsChangePct: number
  layout: Layout
  widthM: number
  url: string
}

const W = 1200
const H = 630
const PAD = 60
const STAR = new Path2D('M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2 6.1 20.4l1.3-6.5L2.5 9.3l6.6-.8z')

/** 1200×630 (the usual link-preview size) PNG of a result, drawn with the page's own tokens and fonts. */
export async function drawCard(d: CardData): Promise<Blob> {
  await document.fonts.ready
  const css = getComputedStyle(document.documentElement)
  const token = (name: string) => css.getPropertyValue(name).trim()
  const ink = token('--color-ink')
  const paper = token('--color-paper')
  const canvas = Object.assign(document.createElement('canvas'), { width: W, height: H })
  const c = canvas.getContext('2d')!

  const text = (s: string, x: number, y: number, font: string, opts: { color?: string; align?: CanvasTextAlign; max?: number } = {}) => {
    c.font = font
    c.fillStyle = opts.color ?? ink
    c.textAlign = opts.align ?? 'left'
    c.fillText(s, x, y, opts.max)
    return c.measureText(s).width
  }
  const round = (x: number, y: number, w: number, h: number, r: number) => {
    c.beginPath()
    c.roundRect(x, y, w, h, r)
  }

  c.fillStyle = paper
  c.fillRect(0, 0, W, H)
  c.strokeStyle = token('--color-grid')
  c.lineWidth = 1
  for (let g = 24; g < Math.max(W, H); g += 24) {
    c.beginPath()
    c.moveTo(g, 0)
    c.lineTo(g, H)
    c.moveTo(0, g)
    c.lineTo(W, g)
    c.stroke()
  }
  c.fillStyle = ink
  round(PAD / 2 + 8, PAD / 2 + 8, W - PAD, H - PAD, 32)
  c.fill()
  c.fillStyle = paper
  c.strokeStyle = ink
  c.lineWidth = 4
  round(PAD / 2, PAD / 2, W - PAD, H - PAD, 32)
  c.fill()
  c.stroke()

  text('Road Diet', PAD, 100, '600 30px Fredoka, sans-serif', { color: token('--color-primary') })
  text(d.levelName, PAD, 152, '600 46px Fredoka, sans-serif', { max: W - 2 * PAD - 240 })

  for (let n = 0; n < 3; n++) {
    c.save()
    c.translate(W - PAD - 216 + n * 72, 62)
    c.scale(2.8, 2.8)
    c.lineJoin = 'round'
    c.lineWidth = 1.3
    c.setLineDash(n < d.stars ? [] : [3, 2])
    c.fillStyle = token('--color-loading')
    if (n < d.stars) c.fill(STAR)
    c.strokeStyle = ink
    c.stroke(STAR)
    c.restore()
  }
  text(`${d.stars} of 3 stars`, W - PAD, 160, '500 22px Inter, sans-serif', { align: 'right' })

  const kg = signed(d.emissionsDeltaKg, 0)
  const kgW = text(`${kg} kg CO₂e`, PAD, 240, '600 52px Fredoka, sans-serif')
  text(`per peak hour (${signed(d.emissionsChangePct, 1)}% vs today's street)`, PAD + kgW + 16, 240, '500 24px Inter, sans-serif')

  let bx = PAD
  for (const b of d.badges) {
    c.font = '600 22px Inter, sans-serif'
    const w = c.measureText(b.name).width + 32
    c.fillStyle = token('--color-loading')
    c.strokeStyle = ink
    c.lineWidth = 3
    round(bx, 268, w, 42, 14)
    c.fill()
    c.stroke()
    text(b.name, bx + 16, 296, '600 22px Inter, sans-serif')
    bx += w + 12
  }

  // Cross-section strip: colour plus pattern plus label per element, as in the editor (spec 8b).
  const top = 340
  const h = 110
  const scale = (W - 2 * PAD) / d.widthM
  let x = PAD
  for (const el of d.layout.elements) {
    const v = VISUALS[el.id]
    const w = el.widthM * scale
    c.fillStyle = token(v.color.slice(4, -1))
    c.fillRect(x, top, w, h)
    c.save()
    c.beginPath()
    c.rect(x, top, w, h)
    c.clip()
    c.strokeStyle = ink
    c.fillStyle = paper
    if (v.pattern === 'hatch') {
      c.globalAlpha = 0.25
      c.lineWidth = 3
      for (let k = -h; k < w; k += 10) {
        c.beginPath()
        c.moveTo(x + k, top + h)
        c.lineTo(x + k + h, top)
        c.stroke()
      }
    }
    if (v.pattern === 'dots') {
      c.globalAlpha = 0.5
      for (let i = x + 7; i < x + w; i += 14) for (let j = top + 7; j < top + h; j += 14) c.fillRect(i - 2, j - 2, 4, 4)
    }
    c.globalAlpha = 1
    if (v.edge === 'dashed') {
      c.lineWidth = 2
      c.setLineDash([8, 6])
      c.strokeRect(x + 6, top + 6, w - 12, h - 12)
    }
    c.fillStyle = ink
    if (v.edge === 'barrier') c.fillRect(x + w / 2 - 4, top + 6, 8, h - 12)
    c.restore()
    c.strokeStyle = ink
    c.lineWidth = 3
    c.strokeRect(x, top, w, h)
    text(v.short, x + w / 2, top + h + 30, '600 18px Inter, sans-serif', { align: 'center', max: w - 4 })
    text(`${el.widthM.toFixed(1)} m`, x + w / 2, top + h + 54, '500 18px Inter, sans-serif', { align: 'center', max: w - 4 })
    x += w
  }
  const free = W - PAD - x
  if (free > 1) {
    c.strokeStyle = ink
    c.lineWidth = 2
    c.setLineDash([6, 6])
    c.strokeRect(x + 4, top, free - 4, h)
    c.setLineDash([])
    text('Unused', x + free / 2, top + h + 30, '500 18px Inter, sans-serif', { align: 'center', max: free - 4 })
    text(`${(free / scale).toFixed(1)} m`, x + free / 2, top + h + 54, '500 18px Inter, sans-serif', { align: 'center', max: free - 4 })
  }

  text('A learning tool, not a forecast. Residents are fictional.', PAD, H - PAD + 4, '500 20px Inter, sans-serif')
  text(d.url.replace(/^https?:\/\//, ''), W - PAD, H - PAD + 4, '600 22px Inter, sans-serif', { align: 'right', color: token('--color-primary') })

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'))
}

/** Native share sheet with the image where the browser supports files (phones), else a download. */
export async function shareCard(d: CardData, text: string): Promise<'shared' | 'saved' | 'cancelled'> {
  const file = new File([await drawCard(d)], 'road-diet-result.png', { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
    }
  }
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: file.name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  return 'saved'
}
