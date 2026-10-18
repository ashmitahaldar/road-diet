// Cuts the take into scenes, cross-fades them with the title cards, and adds captions and an optional voiceover.
//   node docs/demo/build.mjs <out> [voiceover.m4a]   ->  <out>/road-diet-demo.mp4 and <out>/road-diet-demo.srt
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const [OUT = 'video-out', VOICE] = process.argv.slice(2)
const XF = 0.5
const MAX_SECONDS = 120

// One line per scene, read at about 140 words a minute. The captions are this text, timed to the cut.
const NARRATION = {
  intro: 'Every street has a budget: a fixed width that everyone has to share.',
  question: 'Bikes, cars, pedestrians: can Toronto streets work for everyone? Road Diet lets you learn by trying.',
  story: 'You start on a real Toronto street, built from City data, with four fictional neighbours who each need something different from it.',
  'lesson-budget': 'Lesson one: every metre comes from somewhere.',
  play: 'I swap two car lanes for a painted bike lane and parking. Pip spots a problem: the bike lane runs beside parked cars, right in the door zone.',
  run1: 'I run a day anyway. The goal is met, but only one star. The residents tell me how it went, and the scorecard says what to work on.',
  'lesson-door': 'Lesson two: keep riders out of the door zone.',
  fix: 'So I swap in a protected bike lane.',
  stars: 'Three stars, still with two car lanes.',
  'lesson-mode': 'Lesson three: mode shift.',
  why: 'Why did emissions fall? About 245 fewer people drive, because the other options got better.',
  quiz: 'A quick check at the end tests what stuck.',
  others: 'Then see how other players shared the same street.',
  data: 'Every number links to its source, and every estimate is labelled.',
  outro: 'Road Diet: learn how a street is shared, one design at a time. Play free at roaddiet.design.',
}

const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' })
const scenes = JSON.parse(readFileSync(`${OUT}/scenes.json`, 'utf8'))
const VF = 'scale=1920:1080:flags=lanczos,fps=30,format=yuv420p,setsar=1'

scenes.forEach((s, i) => {
  ff(['-ss', `${s.start}`, '-t', `${s.dur}`, '-i', `${OUT}/${s.file}`, '-vf', VF, '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', `${OUT}/seg-${i}.mp4`])
})

const starts = scenes.map((_, i) => scenes.slice(0, i).reduce((t, s) => t + s.dur, 0) - i * XF)
const total = starts.at(-1) + scenes.at(-1).dur
if (total > MAX_SECONDS) throw new Error(`video is ${total.toFixed(1)} s, over ${MAX_SECONDS}`)

// Each sentence gets a share of its scene's time by word count.
const stamp = (t) => new Date(t * 1000).toISOString().slice(11, 23).replace('.', ',')
const cues = scenes.flatMap((s, i) => {
  const lines = NARRATION[s.name]?.split(/(?<=[.?!])\s+/) ?? []
  const from = starts[i] + (i ? XF : 0.2)
  const span = starts[i] + s.dur - from - 0.1
  const words = lines.reduce((n, l) => n + l.split(/\s+/).length, 0)
  let t = from
  return lines.map((text) => {
    const end = t + (span * text.split(/\s+/).length) / words
    const cue = { start: t, end, text }
    t = end
    return cue
  })
})
const srt = `${OUT}/road-diet-demo.srt`
writeFileSync(srt, cues.map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n'))

const fades = scenes.slice(1).map((_, k) => `[${k ? `v${k}` : '0:v'}][${k + 1}:v]xfade=transition=fade:duration=${XF}:offset=${(starts[k + 1]).toFixed(3)}[v${k + 1}]`)
const audio = VOICE ? ['-i', VOICE] : ['-f', 'lavfi', '-t', `${total}`, '-i', 'anullsrc=r=48000:cl=stereo']
const n = scenes.length
ff([
  ...scenes.flatMap((_, i) => ['-i', `${OUT}/seg-${i}.mp4`]),
  ...audio,
  '-i', srt,
  '-filter_complex', `${fades.join(';')};[${n}:a]apad,atrim=0:${total}[a]`,
  '-map', `[v${n - 1}]`, '-map', '[a]', '-map', `${n + 1}:s`,
  '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '160k', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng',
  '-movflags', '+faststart', '-t', `${total}`,
  `${OUT}/road-diet-demo.mp4`,
])
console.log(`${OUT}/road-diet-demo.mp4  ${total.toFixed(1)} s, ${cues.length} captions${VOICE ? '' : ' (silent: pass a voiceover to add sound)'}`)
