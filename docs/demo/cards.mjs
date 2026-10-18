// Animated title and lesson cards for the demo video, drawn in SVG and HTML with the game's tokens (client/src/index.css).
// record.mjs loads each one, calls window.play() and records it. Colours and fonts are the game's; nothing here is a screenshot.

const PIP = `<svg viewBox="0 0 48 48" class="pip" aria-hidden="true">
  <path d="M5 29 L15 25 L15 34 Z" fill="var(--car)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>
  <path d="M21 38 V44 M27 38 V44 M18 44 H24 M24 44 H30" stroke="var(--patio)" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="24" cy="30" rx="13" ry="9.5" fill="var(--sidewalk)" stroke="var(--ink)" stroke-width="2"/>
  <path d="M15 28 Q23 21 31 29 Q23 34 15 28 Z" fill="var(--grid)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>
  <g class="head">
    <ellipse cx="32" cy="22" rx="6" ry="6.5" fill="var(--safety)" stroke="var(--ink)" stroke-width="2"/>
    <circle cx="34" cy="14" r="6.5" fill="var(--sidewalk)" stroke="var(--ink)" stroke-width="2"/>
    <circle cx="36" cy="13" r="2.6" fill="var(--patio)"/><circle cx="36" cy="13" r="1.4" fill="var(--ink)"/>
    <path d="M40 14 L45.5 16 L40 18 Z" fill="var(--ink)"/>
  </g>
</svg>`

const CSS = `
:root { --paper: #faf6ee; --grid: #e8e1d2; --ink: #1f2a37; --primary: #2b59c3; --sidewalk: #cbd2d9; --car: #4a5560;
  --bike-painted: #7cc576; --bike-protected: #2fa84f; --bus: #d64545; --parking: #5b8def; --loading: #f2c94c; --planter: #3e8e5a;
  --patio: #f2994a; --emissions: #1e9e8a; --safety: #5b5bd6; --fairness: #a24cb8; }
* { box-sizing: border-box; }
body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; display: grid; place-items: center; color: var(--ink); font: 500 40px Inter, sans-serif;
  background-color: var(--paper); background-size: 60px 60px;
  background-image: linear-gradient(var(--grid) 2px, transparent 2px), linear-gradient(90deg, var(--grid) 2px, transparent 2px); }
main { display: flex; flex-direction: column; align-items: center; gap: 40px; width: 1600px; text-align: center; }
h1 { margin: 0; font: 600 112px/1.05 Fredoka, sans-serif; letter-spacing: -0.02em; }
h2 { margin: 0; font: 600 76px/1.1 Fredoka, sans-serif; }
.kicker { margin: 0; font: 600 40px Fredoka, sans-serif; color: var(--primary); }
.pip { width: 200px; }
.pip .head { transform-origin: 32px 24px; }
body.go .pip .head { animation: nod 0.5s ease-in-out 3; }
@keyframes nod { 50% { transform: translateY(-1.5px) rotate(-6deg); } }
.in { opacity: 0; transform: translateY(30px); transition: opacity 0.5s, transform 0.5s cubic-bezier(.2,.9,.3,1.3); }
.in.on { opacity: 1; transform: none; }
.pop { opacity: 0; transform: scale(0.6); transition: opacity 0.35s, transform 0.45s cubic-bezier(.2,.9,.3,1.4); }
.pop.on { opacity: 1; transform: none; }
.street { display: flex; width: 1400px; height: 150px; border: 4px solid var(--ink); border-radius: 22px; overflow: hidden; box-shadow: 8px 8px 0 var(--ink); background: var(--paper); }
.seg { display: grid; place-items: center; overflow: hidden; white-space: nowrap; font: 600 26px Fredoka, sans-serif; color: var(--paper);
  text-overflow: ellipsis; padding: 0 6px; border-right: 3px solid var(--ink); transition: flex-grow 0.9s cubic-bezier(.6,0,.3,1), background 0.6s; flex: 0 0 0; }
.seg:last-child { border-right: 0; }
.seg.light { color: var(--ink); }
.measure { display: flex; align-items: center; gap: 16px; width: 1400px; font: 600 34px Fredoka, sans-serif; }
.measure i { flex: 1; height: 4px; background: var(--ink); transform: scaleX(0); transition: transform 1s; }
.measure.on i { transform: scaleX(1); }
.card { border: 4px solid var(--ink); border-radius: 28px; background: var(--paper); box-shadow: 8px 8px 0 var(--ink); padding: 28px 40px; }
.chips { display: flex; gap: 22px; justify-content: center; flex-wrap: wrap; }
.chip { display: inline-flex; align-items: center; gap: 14px; padding: 12px 26px; border: 4px solid var(--ink); border-radius: 999px; background: var(--paper); font: 600 34px Fredoka, sans-serif; box-shadow: 4px 4px 0 var(--ink); }
.chip b { width: 26px; height: 26px; border-radius: 50%; border: 3px solid var(--ink); }
.row { display: flex; align-items: center; gap: 48px; }
.list { display: flex; flex-direction: column; gap: 18px; text-align: left; font-size: 40px; }
.list .in { display: flex; gap: 18px; align-items: center; }
.tick { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; background: var(--ink); color: var(--paper); font-size: 30px; flex: none; }
.small { font-size: 32px; }
`

// A cross-section of a 20 m street. Each layout is [element, metres]; the bar morphs between them.
const LOOK = {
  sidewalk: ['var(--sidewalk)', 'Sidewalk', true],
  car: ['var(--car)', 'Car lane'],
  bus: ['var(--bus)', 'Bus lane'],
  painted: ['var(--bike-painted)', 'Bike lane', true],
  protected: ['var(--bike-protected)', 'Protected'],
  parking: ['var(--parking)', 'Parking'],
  trees: ['var(--planter)', 'Trees'],
}
const street = (id) => `<div class="street" id="${id}">${Array.from({ length: 7 }, () => '<div class="seg"></div>').join('')}</div>`
const STREET_JS = `
const LOOK = ${JSON.stringify(LOOK)}
function lay(id, layout) {
  const segs = [...document.querySelectorAll('#' + id + ' .seg')]
  segs.forEach((s, i) => {
    const [el, m] = layout[i] ?? [null, 0]
    s.style.flexGrow = m
    s.style.borderRightWidth = m ? '' : '0'
    if (!el) return
    const [bg, label, light] = LOOK[el]
    s.style.background = bg
    s.classList.toggle('light', !!light)
    s.textContent = m >= 2 ? label : ''
  })
}
const at = (s, f) => setTimeout(f, s * 1000)
const on = (sel) => document.querySelectorAll(sel).forEach((e) => e.classList.add('on'))
`

const TODAY = [['sidewalk', 3.4], ['car', 3.3], ['car', 3.3], ['car', 3.3], ['car', 3.3], ['sidewalk', 3.4]]
const DESIGN_A = [['sidewalk', 3.4], ['protected', 2], ['parking', 2.4], ['car', 3.3], ['car', 3.3], ['sidewalk', 5.6]]
const DESIGN_B = [['sidewalk', 3.2], ['trees', 1.5], ['car', 3.3], ['bus', 3.5], ['car', 3.3], ['parking', 2.4], ['sidewalk', 2.8]]

const page = (body, script) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><main>${body}</main>
<script>${STREET_JS}
window.play = () => { document.body.classList.add('go'); ${script} }</script></body></html>`

const lesson = (n, title, line, diagram, script) =>
  page(
    `<div class="row in" id="l"><span>${PIP}</span><div style="text-align:left"><p class="kicker">Lesson ${n}</p><h2>${title}</h2></div></div>
     ${diagram}<p class="in" id="line" style="margin:0">${line}</p>`,
    `on('#l'); ${script}; at(1.2, () => on('#line'))`,
  )

export const CARDS = [
  {
    name: 'intro',
    dur: 7,
    html: page(
      `<div class="row"><span class="pop" id="p">${PIP}</span><h1 class="in" id="t">Every street has a budget.</h1></div>
       ${street('s')}<div class="measure" id="m"><i></i>20 metres<i></i></div>
       <p class="in" id="q" style="margin:0">How would you spend it?</p>`,
      `on('#p'); at(0.3, () => on('#t'));
       at(0.5, () => lay('s', ${JSON.stringify(TODAY)})); at(0.9, () => on('#m'));
       at(2.6, () => lay('s', ${JSON.stringify(DESIGN_A)})); at(3, () => on('#q'));
       at(4.6, () => lay('s', ${JSON.stringify(DESIGN_B)}))`,
    ),
  },
  {
    name: 'question',
    dur: 8,
    html: page(
      `<p class="kicker in" id="k">Hack the Valley × School of Cities · Transit, Congestion and Access</p>
       <h1 class="in" id="q1" style="font-size:96px">Bikes vs. cars vs. pedestrians:<br>can Toronto streets work for everyone?</h1>
       <div class="chips">${[
         ['var(--sidewalk)', 'People walking'],
         ['var(--bike-protected)', 'Cyclists'],
         ['var(--bus)', 'Bus riders'],
         ['var(--car)', 'Drivers'],
         ['var(--patio)', 'Local shops'],
       ]
         .map(([c, t], i) => `<span class="chip pop" id="c${i}"><b style="background:${c}"></b>${t}</span>`)
         .join('')}</div>
       <p class="in" id="q2" style="margin:0">Road Diet: learn how a street gets shared, by redesigning a real one.</p>`,
      `on('#k'); at(0.4, () => on('#q1')); for (let i = 0; i < 5; i++) at(1.6 + i * 0.25, () => on('#c' + i)); at(3.4, () => on('#q2'))`,
    ),
  },
  {
    name: 'lesson-budget',
    dur: 3.5,
    html: lesson(
      1,
      'The street budget',
      'Every metre you give one use comes from another.',
      street('s'),
      `lay('s', ${JSON.stringify(TODAY)}); at(0.8, () => lay('s', [['sidewalk', 5.4], ['car', 3.3], ['car', 3.3], ['car', 3.3], ['car', 1.3], ['sidewalk', 3.4]])); at(1.9, () => lay('s', ${JSON.stringify(TODAY)}))`,
    ),
  },
  {
    name: 'lesson-door',
    dur: 4,
    html: lesson(
      2,
      'The door zone',
      'A painted lane beside parked cars puts riders where doors open. A buffer keeps them clear.',
      `<svg viewBox="0 0 900 260" width="1100" class="card" style="padding:0">
        <rect x="0" y="20" width="900" height="80" fill="var(--parking)"/>
        <rect x="0" y="100" width="900" height="60" fill="var(--bike-painted)" id="lane" style="transition: fill .5s"/>
        <rect x="0" y="160" width="900" height="80" fill="var(--car)"/>
        <rect x="0" y="100" width="900" height="0" fill="var(--grid)" id="buffer" style="transition: height .5s, y .5s"/>
        <g><rect x="380" y="34" width="190" height="56" rx="14" fill="var(--paper)" stroke="var(--ink)" stroke-width="5"/>
          <rect id="door" x="440" y="86" width="56" height="10" rx="4" fill="var(--paper)" stroke="var(--ink)" stroke-width="5"
            style="transform-origin: 444px 90px; transition: transform .45s cubic-bezier(.3,1.4,.5,1)"/></g>
        <g id="bike" style="transition: transform 1.6s linear"><circle cx="60" cy="130" r="18" fill="var(--paper)" stroke="var(--ink)" stroke-width="5"/>
          <circle cx="110" cy="130" r="18" fill="var(--paper)" stroke="var(--ink)" stroke-width="5"/></g>
      </svg>`,
      `const d = document.getElementById('door'), b = document.getElementById('bike'), buf = document.getElementById('buffer'), lane = document.getElementById('lane');
       at(0.2, () => (b.style.transform = 'translateX(220px)')); at(0.6, () => (d.style.transform = 'rotate(70deg)'));
       at(1.9, () => { d.style.transform = ''; buf.setAttribute('y', 100); buf.style.height = '24px'; lane.style.fill = 'var(--bike-protected)'; b.style.transform = 'translateX(0)'; b.querySelectorAll('circle').forEach((c) => c.setAttribute('cy', 142)) });
       at(2.2, () => (b.style.transform = 'translateX(720px)'))`,
    ),
  },
  {
    name: 'lesson-mode',
    dur: 3.5,
    html: lesson(
      3,
      'Mode shift',
      'Emissions fall only when some trips switch from driving to the bus, a bike or walking.',
      `<div class="chips" id="trips" style="gap:28px">${Array.from({ length: 10 }, () => `<b style="width:72px;height:72px;border-radius:50%;border:5px solid var(--ink);background:var(--car);transition:background .4s,transform .4s"></b>`).join('')}</div>`,
      `const dots = [...document.querySelectorAll('#trips b')];
       [['var(--bus)', 2], ['var(--bike-protected)', 5], ['var(--sidewalk)', 8]].forEach(([c, i], k) => at(0.6 + k * 0.4, () => ((dots[i].style.background = c), (dots[i].style.transform = 'scale(1.25)'))))`,
    ),
  },
  {
    name: 'outro',
    dur: 10,
    html: page(
      `<div class="row"><span class="pop" id="p">${PIP}</span><h2 class="in" id="t">After a few runs, you can:</h2></div>
       <div class="list">${[
         'Explain the street budget',
         'Predict mode shift',
         'Spot safer layouts: buffers and the door zone',
         'Judge a design by its least happy resident',
         'Tell measured data from estimates',
       ]
         .map((t, i) => `<div class="in" id="i${i}"><span class="tick">✓</span>${t}</div>`)
         .join('')}</div>
       <h1 class="pop" id="url" style="color:var(--primary)">roaddiet.design</h1>
       <p class="in small" id="cr" style="margin:0">Built solo for Hack The Valley 11 (2026) by @ashmitahaldar · A learning tool, not a forecast. Residents are fictional.</p>`,
      `on('#p'); at(0.2, () => on('#t')); for (let i = 0; i < 5; i++) at(0.8 + i * 0.55, () => on('#i' + i)); at(4.4, () => on('#url')); at(5, () => on('#cr'))`,
    ),
  },
]
