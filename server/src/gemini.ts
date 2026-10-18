import {
  MODE_SHIFT_LIMITATION,
  residentsOf,
  fallbackResult,
  moodFor,
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
    'Use only the facts given. Do not invent numbers, places or people. Never mention real people, politicians, parties, elections or voting.',
    'Do not praise or criticise lane types as such; talk about the trip, safety, comfort or access the resident experiences.',
    'Also write "debrief": 2-3 plain-language sentences on the trade-offs of this design, including at least one limitation from modelLimitations.',
    'Reply with JSON only: {"reactions":[{"personaId":"...","line":"..."}],"debrief":"..."}',
  ].join('\n')
  return { system, user: JSON.stringify(facts) }
}

async function callGemini(prompt: { system: string; user: string }, cfg: Required<GeminiConfig>) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`
  const res = await cfg.fetch(url, {
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
  if (!res.ok) throw new Error(`gemini status ${res.status}`)
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('')
  if (!text) throw new Error('gemini empty response')
  return Output.parse(JSON.parse(text))
}

const acceptable = (line: string) => !OFF_LIMITS.test(line) && line.trim().split(/\s+/).length <= MAX_WORDS

/** Reactions + debrief for one run. Any Gemini problem falls back per line, never an error. */
export async function react(facts: RunFacts, config: GeminiConfig): Promise<ReactResult> {
  const fallback = fallbackResult(facts.metrics)
  if (!config.apiKey || !config.model) return fallback
  const cfg = { fetch, timeoutMs: 7000, ...config } as Required<GeminiConfig>
  try {
    const out = await callGemini(buildPrompt(facts), cfg)
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
