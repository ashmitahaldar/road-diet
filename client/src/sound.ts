// Short synthesized sounds (no audio files, so no asset licence). The AudioContext is created on the first sound,
// which always follows a press, so nothing plays before the player interacts. Adding and removing sound the same
// for every element (spec 2.7).

export type Sound = 'place' | 'remove' | 'run' | 'win' | 'done'

// [frequency Hz, start s, length s]; a pair of frequencies glides from the first to the second.
const NOTES: Record<Sound, [number | [number, number], number, number][]> = {
  place: [[[520, 780], 0, 0.09]],
  remove: [[[420, 260], 0, 0.11]],
  run: [[392, 0, 0.1], [523, 0.09, 0.14]],
  win: [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.12], [1047, 0.3, 0.3]],
  done: [[392, 0, 0.12], [523, 0.11, 0.22]],
}

const KEY = 'road-diet:muted'
let ctx: AudioContext | undefined

export function isMuted() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setMuted(muted: boolean) {
  try {
    sessionStorage.setItem(KEY, muted ? '1' : '0')
  } catch {
    // storage blocked: the toggle still works until reload
  }
  mutedNow = muted
}

let mutedNow = isMuted()

export function play(sound: Sound) {
  if (mutedNow || typeof AudioContext === 'undefined') return
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  const t0 = ctx.currentTime
  for (const [f, start, len] of NOTES[sound]) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const [from, to] = Array.isArray(f) ? f : [f, f]
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(from, t0 + start)
    osc.frequency.exponentialRampToValueAtTime(to, t0 + start + len)
    gain.gain.setValueAtTime(0.0001, t0 + start)
    gain.gain.exponentialRampToValueAtTime(0.15, t0 + start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + len)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t0 + start)
    osc.stop(t0 + start + len + 0.02)
  }
}
