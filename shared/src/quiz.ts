import { factorPhrase, residentFactors, whyFacts } from './explain'
import { computeMetrics } from './model/metrics'
import { simulateTraffic } from './model/traffic'
import type { Layout, Level, PersonaId } from './model/types'
import { residentsOf } from './personas'
import type { TextSource } from './reactions'

/** A question the model can answer: `correct` is true of this design and each of `wrong` is false. */
export type QuizCandidate = { id: string; question: string; correct: string; wrong: [string, string]; explain: string; facts: string[] }
/** Response of POST /api/quiz. `answer` indexes `options`. */
export type Quiz = { id: string; question: string; options: string[]; answer: number; why: string; source: TextSource }

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

export function quizCandidates(layout: Layout, level: Level): QuizCandidate[] {
  const who = residentsOf(level)
  const m = computeMetrics(layout, level)
  const base = computeMetrics(level.corridor.baselineLayout, level)
  const out: QuizCandidate[] = []
  const byHappiness = (Object.entries(m.happiness) as [PersonaId, number][]).sort((a, b) => a[1] - b[1])
  const [low] = byHappiness[0]

  const factors = residentFactors(layout, level, low)
  if (factors.length >= 3 && Math.abs(factors[0][1]) >= 3 && Math.abs(factors[0][1]) - Math.abs(factors[1][1]) >= 1.5)
    out.push({
      id: 'top-factor',
      question: `What changed ${who[low].name}'s happiness the most?`,
      correct: cap(factorPhrase(factors[0][0], who[low])),
      wrong: [cap(factorPhrase(factors[1][0], who[low])), cap(factorPhrase(factors[2][0], who[low]))],
      explain: `${cap(factorPhrase(factors[0][0], who[low]))} ${factors[0][1] > 0 ? 'added' : 'took away'} about ${Math.abs(factors[0][1]).toFixed(0)} happiness points for ${who[low].name}, more than anything else.`,
      facts: whyFacts(layout, level, low).facts,
    })

  const { corridor } = level
  const drivers = Math.round(simulateTraffic(corridor.baselineLayout, corridor).demand.car - simulateTraffic(layout, corridor).demand.car)
  out.push({
    id: 'emissions-cause',
    question: drivers >= 5 || drivers <= -5 ? 'Why did emissions change on your street?' : 'Why did emissions barely change on your street?',
    correct: drivers >= 5 ? 'Some car trips switched to the bus, a bike or walking.' : drivers <= -5 ? 'More people chose to drive.' : 'Almost nobody switched out of a car.',
    // Both are false in the model: emission factors are fixed and the total number of trips is conserved.
    wrong: ['Cars got cleaner engines.', 'Fewer people needed to travel.'],
    explain: 'In the game, emissions change only when trips switch between driving, the bus, biking and walking. Engines and the number of trips stay the same.',
    facts: whyFacts(layout, level, 'emissions').facts,
  })

  const trips = (Object.keys(m.travelTimeMin) as PersonaId[]).map((id) => [id, m.travelTimeMin[id] - base.travelTimeMin[id]] as const).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
  if (Math.abs(trips[0][1]) >= 0.5 && Math.abs(trips[0][1]) - Math.abs(trips[1][1]) >= 0.3)
    out.push({
      id: 'trip-change',
      question: 'Whose trip time changed the most?',
      correct: who[trips[0][0]].name,
      wrong: [who[trips[1][0]].name, who[trips[2][0]].name],
      explain: `${who[trips[0][0]].name}'s trip changed by ${Math.abs(trips[0][1]).toFixed(1)} min, more than anyone else's.`,
      facts: whyFacts(layout, level, 'travel').facts,
    })

  if (byHappiness[1][1] - byHappiness[0][1] >= 2)
    out.push({
      id: 'least-happy',
      question: 'Who is the least happy resident on your street now?',
      correct: who[low].name,
      wrong: [who[byHappiness[3][0]].name, who[byHappiness[2][0]].name],
      explain: `${who[low].name} is at ${byHappiness[0][1].toFixed(0)}/100, the lowest on the street. In the game, a street is only as fair as its least happy resident.`,
      facts: whyFacts(layout, level, 'fairness').facts,
    })
  return out
}

/** Options in a fixed order per question, so the right answer isn't always first. */
export function toQuiz(c: QuizCandidate, question: string, why: string, source: TextSource): Quiz {
  const at = [...c.id, ...c.correct].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % 3
  const options = [...c.wrong]
  options.splice(at, 0, c.correct)
  return { id: c.id, question, options, answer: at, why, source }
}

export const fallbackQuiz = (c: QuizCandidate): Quiz => toQuiz(c, c.question, c.explain, 'fallback')
