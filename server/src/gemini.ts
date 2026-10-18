import {
  MODE_SHIFT_LIMITATION,
  residentsOf,
  describeLayout,
  fallbackResult,
  fallbackQuiz,
  fallbackStory,
  fallbackWhy,
  grounded,
  moodFor,
  toQuiz,
  type Quiz,
  type QuizCandidate,
  type Why,
  type WhyFacts,
  type DayStory,
  type Layout,
  type Level,
  type Metrics,
  type ReactResult,
  type Score,
} from '@road-diet/shared'
import { z } from 'zod'

export type GeminiConfig = { apiKey?: string; model?: string; fetch?: typeof fetch; timeoutMs?: number }

// Spec 2.7 / 5.1: residents never talk about elections or real politicians. A hit swaps in the canned text.
export const OFF_LIMITS =
  /\b(vot(e|es|ed|er|ers|ing)|elect(ion|ions|ed|oral)|part(y|ies)|candidates?|campaign\w*|ballots?|politic\w*|mayor|council\w*|premier|prime minister|MPPs?|MPs?)\b/i
const NAMES_A_LIMITATION = /assum|estimate|simplif|limit|cap(ped|s)?\b|uncertain/i
const MAX_WORDS = 30

const Output = z.object({
  reactions: z.array(z.object({ personaId: z.string(), line: z.string().min(1).max(300) })),
  debrief: z.string().min(1).max(1200),
})

export type RunFacts = { level: Level; layout: Layout; metrics: Metrics; base: Metrics; score: Score }

const r1 = (x: number) => Math.round(x * 10) / 10

/** Only numbers the server computed go to the model (spec 5.1: grounded). */
export function buildPrompt({ level, layout, metrics, base, score }: RunFacts) {
  const facts = {
    street: { name: level.name, widthM: level.corridor.widthM, lengthKm: level.corridor.lengthKm },
    todayLayout: level.corridor.baselineLayout.elements,
    newLayout: layout.elements,
    emissionsKgPerHour: { today: r1(base.emissionsKgPerHour), new: r1(metrics.emissionsKgPerHour), reductionPct: r1(metrics.emissionsReductionPct) },
    safetyScore0to100: { today: r1(base.safetyScore), new: r1(metrics.safetyScore) },
    lowestHappiness0to100: { today: r1(base.fairness), new: r1(metrics.fairness) },
    goal: { met: score.goalMet, stars: score.stars, checks: score.goals.map((g) => ({ kind: g.kind, target: g.target, value: r1(g.value), met: g.met })) },
    residents: Object.values(residentsOf(level)).map((p) => ({
      personaId: p.id,
      name: p.name,
      about: p.blurb,
      trip: p.trip,
      happiness: { today: r1(base.happiness[p.id]), new: r1(metrics.happiness[p.id]) },
      tripMinutes: { today: r1(base.travelTimeMin[p.id]), new: r1(metrics.travelTimeMin[p.id]) },
      mood: moodFor(metrics.happiness[p.id], p.baselineHappiness),
    })),
    modelLimitations: [MODE_SHIFT_LIMITATION, 'Safety is an index from the street layout, not a collision forecast.', 'Residents are fictional composites.'],
  }
  const system = [
    'You write short reactions for a street-design learning game set in Toronto.',
    'Each resident is fictional. Speak in first person, in character, at most 25 words, with one concrete reason taken from their numbers.',
    'Say how the trip feels; mention at most one number (trip minutes are best) and never quote happiness or mood scores.',
    'Use only the facts given. Do not invent numbers, places or people. Never mention real people, politicians, parties, elections or voting.',
    'Do not praise or criticise lane types as such; talk about the trip, safety, comfort or access the resident experiences.',
    'Also write "debrief": 2-3 plain-language sentences on the trade-offs of this design, including at least one limitation from modelLimitations.',
    'Reply with JSON only: {"reactions":[{"personaId":"...","line":"..."}],"debrief":"..."}',
  ].join('\n')
  return { system, user: JSON.stringify(facts) }
}

async function callGemini<T>(prompt: { system: string; user: string }, cfg: Required<GeminiConfig>, schema: z.ZodType<T>) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`
  const started = Date.now()
  let res = await post(url, prompt, cfg)
  // Gemini answers "overloaded" (5xx) quickly; one retry fits in the time budget when the first try failed fast.
  if (res.status >= 500 && Date.now() - started < 2500) res = await post(url, prompt, cfg)
  if (!res.ok) throw new Error(`gemini status ${res.status}`)
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('')
  if (!text) throw new Error('gemini empty response')
  return schema.parse(JSON.parse(text))
}

function post(url: string, prompt: { system: string; user: string }, cfg: Required<GeminiConfig>) {
  return cfg.fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': cfg.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: prompt.system }] },
      contents: [{ role: 'user', parts: [{ text: prompt.user }] }],
      // Thinking pushed the full prompt past the timeout; short in-character lines don't need it.
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } },
    }),
    signal: AbortSignal.timeout(cfg.timeoutMs),
  })
}

const acceptable = (line: string) => !OFF_LIMITS.test(line) && line.trim().split(/\s+/).length <= MAX_WORDS

/** Reactions + debrief for one run. Any Gemini problem falls back per line, never an error. */
export async function react(facts: RunFacts, config: GeminiConfig): Promise<ReactResult> {
  const fallback = fallbackResult(facts.metrics)
  if (!config.apiKey || !config.model) return fallback
  const cfg = { fetch, timeoutMs: 7000, ...config } as Required<GeminiConfig>
  try {
    const out = await callGemini(buildPrompt(facts), cfg, Output)
    const reactions = fallback.reactions.map((fb) => {
      const line = out.reactions.find((r) => r.personaId === fb.personaId)?.line.trim()
      return line && acceptable(line) ? { ...fb, line, source: 'gemini' as const } : fb
    })
    const debriefOk = !OFF_LIMITS.test(out.debrief)
    const debrief = !debriefOk
      ? fallback.debrief
      : NAMES_A_LIMITATION.test(out.debrief)
        ? out.debrief.trim()
        : `${out.debrief.trim()} ${MODE_SHIFT_LIMITATION}`
    return { reactions, debrief, debriefSource: debriefOk ? 'gemini' : 'fallback' }
  } catch (err) {
    console.warn(`react: using fallback (${err instanceof Error ? err.name + ': ' + err.message : 'unknown error'})`)
    return fallback
  }
}

const StoryOutput = z.object({
  name: z.string().min(1).max(60),
  days: z.array(z.object({ personaId: z.string(), panels: z.array(z.string().min(1).max(240)).length(3) })),
})
const MAX_NAME_WORDS = 5
const MAX_PANEL_WORDS = 28

/** The same grounded facts as the reactions, asked for a design name and a three-panel day per resident. */
export function buildStoryPrompt(facts: RunFacts) {
  const { user } = buildPrompt(facts)
  const system = [
    'You write a tiny comic-strip story for a street-design learning game set in Toronto.',
    'For each fictional resident, write their day on the redesigned street in exactly 3 panels: morning, midday, evening. Each panel is one or two sentences, at most 25 words, in third person.',
    'Ground each day in that resident\'s numbers (trip minutes, happiness, mood). Show feelings rather than quoting scores: never write happiness or mood numbers, and use at most one number per resident: tripMinutes.new is the whole trip ("a 16-minute ride"), not a change.',
    'You may add small everyday details (coffee, rain, a neighbour waving) but never invent numbers, places, businesses or real people.',
    'Refer to each resident by name, not by he or she. Do not name lanes or other street pieces; describe what the resident sees and feels.',
    'Also give the design a short, warm, playful name of at most 4 words. No real business names.',
    'Never mention politicians, parties, elections or voting. Do not praise or criticise lane types as such; describe what the resident experiences.',
    'Reply with JSON only: {"name":"...","days":[{"personaId":"...","panels":["...","...","..."]}]}',
  ].join('\n')
  return { system, user }
}

const words = (s: string) => s.trim().split(/\s+/).length

/** Design name and residents' days. Each day, and the name, falls back on its own; never an error. */
export async function story(facts: RunFacts, config: GeminiConfig): Promise<DayStory> {
  const fallback = fallbackStory(facts.level, facts.metrics, facts.base)
  if (!config.apiKey || !config.model) return fallback
  const cfg = { fetch, timeoutMs: 9000, ...config } as Required<GeminiConfig>
  try {
    const out = await callGemini(buildStoryPrompt(facts), cfg, StoryOutput)
    const name = out.name.trim().replace(/^["“]|["”]$/g, '')
    const nameOk = !OFF_LIMITS.test(name) && words(name) <= MAX_NAME_WORDS
    const days = fallback.days.map((fb) => {
      const panels = out.days.find((d) => d.personaId === fb.personaId)?.panels.map((p) => p.trim())
      return panels && panels.every((p) => !OFF_LIMITS.test(p) && words(p) <= MAX_PANEL_WORDS)
        ? { ...fb, panels: panels as [string, string, string], source: 'gemini' as const }
        : fb
    })
    return { name: nameOk ? name : fallback.name, nameSource: nameOk ? 'gemini' : 'fallback', days }
  } catch (err) {
    console.warn(`story: using fallback (${err instanceof Error ? err.name + ': ' + err.message : 'unknown error'})`)
    return fallback
  }
}

/** A generated illustration of the design, or null when no image model is set up or it fails (the client draws its own). */
export async function postcard(layout: Layout, config: GeminiConfig & { imageModel?: string }): Promise<string | null> {
  if (!config.apiKey || !config.imageModel) return null
  const prompt = [
    'Flat vector postcard illustration on a warm cream background with thick dark outlines and soft muted colours. No text, letters, signs, logos or real people.',
    `A generic city main street seen from the sidewalk, with these pieces from one side to the other: ${describeLayout(layout)}.`,
    'A few small, friendly figures walking, biking and driving. Calm and uncluttered.',
  ].join(' ')
  try {
    const res = await (config.fetch ?? fetch)(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.imageModel)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': config.apiKey },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } } }),
      signal: AbortSignal.timeout(config.timeoutMs ?? 30000),
    })
    if (!res.ok) throw new Error(`gemini image status ${res.status}`)
    const body = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[] }
    const img = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData
    if (!img || !/^image\/(png|jpeg|webp)$/.test(img.mimeType)) throw new Error('gemini image missing')
    return `data:${img.mimeType};base64,${img.data}`
  } catch (err) {
    console.warn(`postcard: none (${err instanceof Error ? err.message : 'unknown error'})`)
    return null
  }
}

const WhyOutput = z.object({ text: z.string().min(1).max(500) })
const MAX_WHY_WORDS = 45

/** Pip explains one result in plain words, using only the facts the model produced. */
export function buildWhyPrompt(f: WhyFacts, level: Level) {
  const system = [
    'You are Pip, a friendly pigeon who helps players of a street-design learning game set in Toronto understand their results.',
    'Answer the question in 2 short sentences, at most 40 words, for a curious teenager. Explain the cause, not just the result.',
    'Use only the facts given. Copy any number exactly as written in the facts, and use at most two numbers. Do not invent numbers, places or people.',
    'Do not praise or criticise lane types as such; explain what changed for people. Never mention politicians, parties, elections or voting.',
    'Refer to residents by name, not by he or she. Do not repeat the street name.',
    'Reply with JSON only: {"text":"..."}',
  ].join('\n')
  return { system, user: JSON.stringify({ street: level.name, question: f.question, facts: f.facts }) }
}

export async function explain(f: WhyFacts, level: Level, config: GeminiConfig): Promise<Why> {
  const fallback = fallbackWhy(f)
  if (!config.apiKey || !config.model) return fallback
  const cfg = { fetch, timeoutMs: 6000, ...config } as Required<GeminiConfig>
  try {
    const text = (await callGemini(buildWhyPrompt(f, level), cfg, WhyOutput)).text.trim()
    if (OFF_LIMITS.test(text) || words(text) > MAX_WHY_WORDS || !grounded(text, f.facts)) throw new Error('why failed the checks')
    return { text, source: 'gemini' }
  } catch (err) {
    console.warn(`explain: using fallback (${err instanceof Error ? err.message : 'unknown error'})`)
    return fallback
  }
}

const QuizOutput = z.object({ id: z.string(), question: z.string().min(1).max(200), why: z.string().min(1).max(500) })

/** Gemini picks the most useful question and words it; the answer options always come from the model. */
export function buildQuizPrompt(candidates: QuizCandidate[], level: Level) {
  const system = [
    'You write one quick-check question for a street-design learning game set in Toronto, about the design the player just tested.',
    'Pick the candidate whose idea would teach this player the most. Reword its question to be friendly and clear, at most 20 words, without giving away the answer.',
    'Then write "why": 1-2 sentences, at most 40 words, explaining the correct answer using only that candidate\'s facts. Copy any number exactly as written.',
    'Do not praise or criticise lane types as such. Never mention politicians, parties, elections or voting. Refer to residents by name.',
    'Reply with JSON only: {"id":"<candidate id>","question":"...","why":"..."}',
  ].join('\n')
  const user = JSON.stringify({ street: level.name, candidates: candidates.map((c) => ({ id: c.id, question: c.question, correctAnswer: c.correct, facts: [c.explain, ...c.facts] })) })
  return { system, user }
}

export async function quiz(candidates: QuizCandidate[], level: Level, config: GeminiConfig): Promise<Quiz> {
  const fallback = fallbackQuiz(candidates[0])
  if (!config.apiKey || !config.model) return fallback
  const cfg = { fetch, timeoutMs: 7000, ...config } as Required<GeminiConfig>
  try {
    const out = await callGemini(buildQuizPrompt(candidates, level), cfg, QuizOutput)
    const c = candidates.find((x) => x.id === out.id)
    if (!c) throw new Error('quiz picked an unknown question')
    const question = out.question.trim()
    const why = out.why.trim()
    const facts = [c.explain, ...c.facts]
    const ok =
      !OFF_LIMITS.test(question + ' ' + why) &&
      words(question) <= 24 &&
      words(why) <= MAX_WHY_WORDS &&
      !question.toLowerCase().includes(c.correct.toLowerCase()) &&
      grounded(question, facts) &&
      grounded(why, facts)
    return ok ? toQuiz(c, question, why, 'gemini') : fallbackQuiz(c)
  } catch (err) {
    console.warn(`quiz: using fallback (${err instanceof Error ? err.message : 'unknown error'})`)
    return fallback
  }
}
