// Cuts the take into scenes, cross-fades them with the title cards, and adds captions and an optional voiceover.
//   node docs/demo/build.mjs <out> [voiceover.m4a]   ->  <out>/road-diet-demo.mp4 and <out>/road-diet-demo.srt
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const [OUT = 'video-out', VOICE] = process.argv.slice(2)
const XF = 0.5
const MAX_SECONDS = 120

// One line per scene, read at about 140 words a minute. The captions are this text, timed to the cut.
const NARRATION = {
  'card-hook': 'Every street has a budget. Mount Pleasant Road has twenty metres.',
  start: 'Today, four lanes of it go to cars. Road Diet is about sharing it.',
  'card-question': 'The School of Cities asks what changing how we use road space would actually do.',
  story:
    'Road Diet lets students, teachers and neighbours find out. Pip and four fictional residents each want something different. The street is real, built from City of Toronto traffic counts, collisions, bike routes and bus schedules.',
  play: 'I take out two car lanes and add a protected bike lane and parking. Pip points out the planning idea behind each change, and the traffic follows the lanes I build. Then I run a day.',
  results:
    "The goal is met. Each resident reacts in their own words, written by Gemini from the model's numbers, and I can read about their day. A quick check tests what I learned.",
  why: 'Why did emissions fall? About 245 fewer people drive. That’s mode shift.',
  move: 'Pip suggests parking as a buffer.',
  stars: 'One move: three stars, still with two car lanes.',
  others: 'No star rewards any lane type. Tiger Data shows how others solved it.',
  data: 'Every source and every estimate is listed in the game.',
  'card-close': 'Road Diet is live at roaddiet.design. Built solo for Hack The Valley.',
}

const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' })
const scenes = JSON.parse(readFileSync(`${OUT}/scenes.json`, 'utf8'))
const VF = 'scale=1920:1080:flags=lanczos,fps=30,format=yuv420p,setsar=1'

scenes.forEach((s, i) => {
  const input = s.kind === 'card' ? ['-loop', '1', '-t', `${s.dur}`, '-i', `${OUT}/${s.name}.png`] : ['-ss', `${s.start}`, '-t', `${s.dur}`, '-i', `${OUT}/take.webm`]
  ff([...input, '-vf', VF, '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', `${OUT}/seg-${i}.mp4`])
})

const starts = scenes.map((_, i) => scenes.slice(0, i).reduce((t, s) => t + s.dur, 0) - i * XF)
const total = starts.at(-1) + scenes.at(-1).dur
if (total > MAX_SECONDS) throw new Error(`video is ${total.toFixed(1)} s, over ${MAX_SECONDS}`)

// Each sentence gets a share of its scene's time by word count.
const stamp = (t) => new Date(t * 1000).toISOString().slice(11, 23).replace('.', ',')
const cues = scenes.flatMap((s, i) => {
  const lines = NARRATION[s.name]?.split(/(?<=[.?!:])\s+/) ?? []
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
