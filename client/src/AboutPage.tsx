import { CONCEPTS, type ConceptId, type Level } from '@road-diet/shared'
import { Section, link } from './DataPage'

const n = (x: number) => x.toLocaleString('en-CA')

function StreetFacts({ level }: { level: Level }) {
  const { corridor } = level
  const count = corridor.observed?.count
  const cycling = corridor.sources.find((s) => s.label === 'Cycling Network')?.note
  const bus = corridor.sources.find((s) => s.label.startsWith('TTC'))?.note ?? corridor.estimates?.find((e) => e.field === 'baselineDemand.bus')?.note
  const ksi = corridor.baselineSafety
  return (
    <Section title={`The real street: ${corridor.name}`}>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          It is {corridor.lengthKm} km long, and the City’s Official Plan gives it a {corridor.widthM} m planned right-of-way. That is the budget you build
          with.
        </li>
        {count && (
          <li>
            On {count.latest_count_date}, a {count.count_duration}-hour City count at {count.location_name} recorded {n(count.total_vehicle)} vehicles,{' '}
            {n(count.total_bike)} bikes and {n(count.total_pedestrian)} pedestrians.
          </li>
        )}
        {cycling && <li>City Cycling Network data: {cycling}</li>}
        <li>
          {ksi.ksiCollisions5y} collisions where someone was killed or seriously injured happened within 30 m of this stretch in the last five years.{' '}
          {ksi.pedestrianInvolved} involved a pedestrian and {ksi.cyclistInvolved} a cyclist (a collision can involve both).
        </li>
        {bus && <li>Buses: {bus}</li>}
      </ul>
      <p className="mt-3 text-sm">
        Lane widths are not in any open dataset, so today’s layout in the game is an estimate. See{' '}
        <a href="/data" className={link}>
          Data & Limitations
        </a>{' '}
        for every source and every estimate.
      </p>
    </Section>
  )
}

export function AboutPage({ levels }: { levels: Level[] }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5">
      <a href="/" className={`${link} inline-flex min-h-11 items-center`}>
        ← Back to the game
      </a>
      <div>
        <h1 tabIndex={-1} className="font-display text-5xl font-semibold tracking-tight outline-none">
          About Road Diet
        </h1>
        <p className="mt-3 text-lg">A short game about sharing a real Toronto street, and the ideas planners use to do it.</p>
      </div>

      <Section title="Why this game">
        <div className="flex flex-col gap-3">
          <p>
            A street is a fixed width, but the people who need it keep changing. Drivers, delivery trucks, bus riders, cyclists, people walking and local
            shops all want a share. Arguments about bike lanes, bus lanes and parking get heated fast, and the trade-offs are hard to see from a news
            story or a spreadsheet.
          </p>
          <p>
            Road Diet lets you try a redesign yourself. You move the pieces, run a day, and hear from the residents who use the street. The aim is not to
            find one right answer. It is to feel why every choice helps someone and costs someone else, and to learn the words planners use for it.
          </p>
        </div>
      </Section>

      <Section title="What is a road diet?">
        <blockquote className="border-l-4 border-primary pl-3 italic">
          “A technique in transportation planning whereby the number and/or the width of travel lanes of the road is reduced.”
        </blockquote>
        <p className="mt-1 text-sm">
          From{' '}
          <a href="https://en.wikipedia.org/wiki/Road_diet" className={link}>
            Wikipedia, “Road diet”
          </a>
          .
        </p>
        <p className="mt-3">
          The space that frees up can become wider sidewalks, bike lanes, a bus lane, trees or patios. Whether that is worth it depends on the street and
          the people on it. The game lets you test that on one block, including designs that add lanes back.
        </p>
      </Section>

      <Section title="Ideas you’ll meet">
        <dl className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(CONCEPTS) as ConceptId[]).map((id) => (
            <div key={id} id={id} className="scroll-mt-4 rounded-xl border-2 border-ink p-3 target:bg-loading/30">
              <dt className="font-display text-lg font-semibold">{CONCEPTS[id].name}</dt>
              <dd className="mt-1">{CONCEPTS[id].definition}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {levels.map((level) => (
        <StreetFacts key={level.id} level={level} />
      ))}

      <Section title="How the game decides">
        <div className="flex flex-col gap-3">
          <p>
            A small, open model written for this game turns your street into numbers: how many people each lane can carry, how many trips switch mode,
            emissions from car and bus trips, a safety index from the layout, travel times, and how happy each resident is. The same code runs in your
            browser and on the server, and it has tests.
          </p>
          <p>
            After each run, Google Gemini writes the residents’ reactions and a short debrief from those numbers. Gemini never decides a result. If it is
            unavailable, the game uses pre-written lines.
          </p>
          <p>
            The game does not take sides. No star or badge rewards adding or removing any kind of lane. Stars reward meeting the goal, safety and keeping
            every resident on board. The four residents are fictional.
          </p>
        </div>
      </Section>

      <Section title="Thanks">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <a href="https://open.toronto.ca/" className={link}>
              City of Toronto Open Data
            </a>{' '}
            and the City teams who publish it (Transportation Services, Information & Technology and City Planning).
          </li>
          <li>
            <a href="https://www.openstreetmap.org/copyright" className={link}>
              © OpenStreetMap contributors
            </a>{' '}
            for the streets and stations on the corridor map.
          </li>
          <li>UK Department for Energy Security and Net Zero, for emission factors, and NACTO, for lane capacities.</li>
          <li>Google Gemini for the residents’ words, Tiger Data for storing runs, and Vultr for hosting.</li>
          <li>The open-source projects it is built on: React, Three.js, Vite, Tailwind CSS, Motion, Express and node-postgres.</li>
        </ul>
        <p className="mt-3">
          Made solo in one weekend in October 2026.{' '}
          <a href="https://github.com/ashmitahaldar/road-diet" className={link}>
            Source code on GitHub
          </a>
          .
        </p>
      </Section>
    </main>
  )
}
