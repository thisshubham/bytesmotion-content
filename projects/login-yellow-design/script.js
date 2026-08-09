/* ==========================================================================
   Animated Login / Sign Up  ·  behaviour
   1 ring construction · 2 scene switching · 3 password reveal · 4 auto demo
   ========================================================================== */

/* 1 ── build the segmented ring ────────────────────────────────────────── */

const SEGMENTS = 48;   // number of bars around the circle
const LOOP     = 8;    // seconds, must match --loop in style.css
const PEAK     = 228;  // degrees clockwise from top: centre of the warm arc

/* base colour ramp of the ring, keyed by angular distance from PEAK */
const STOPS = [
  [0,   '#FBB03B'],
  [20,  '#F7C766'],
  [45,  '#F1DCB0'],
  [70,  '#EDEAE3'],
  [95,  '#C6CCD6'],
  [125, '#8D96A8'],
  [180, '#565F76']
];

const toRgb = h => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16)
];

function colorAt(dist) {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [a, ca] = STOPS[i], [b, cb] = STOPS[i + 1];
    if (dist <= b) {
      const t = (dist - a) / (b - a);
      const A = toRgb(ca), B = toRgb(cb);
      return `rgb(${A.map((v, k) => Math.round(v + (B[k] - v) * t)).join(',')})`;
    }
  }
  return STOPS[STOPS.length - 1][1];
}

const boost = document.getElementById('boost');
const frag  = document.createDocumentFragment();

for (let i = 0; i < SEGMENTS; i++) {
  const angle = i * 360 / SEGMENTS;

  let dist = Math.abs(angle - PEAK);
  if (dist > 180) dist = 360 - dist;

  const seg = document.createElement('i');
  seg.className = 'seg';
  seg.style.transform = `rotate(${angle}deg)`;
  seg.innerHTML = '<b></b>';

  const bar = seg.firstChild;
  bar.style.setProperty('--c', colorAt(dist));
  // negative delay offsets each bar so the highlight reads as one comet
  bar.style.setProperty('--d', `${-(i / SEGMENTS) * LOOP}s`);

  frag.appendChild(seg);
}
boost.appendChild(frag);

/* 2 ── scene switching (login ⇄ sign up) ───────────────────────────────── */

const card   = document.getElementById('card');
const flash  = document.getElementById('flash');
const panels = {
  login:  document.getElementById('p-login'),
  signup: document.getElementById('p-signup')
};

let current = 'login';
let spin    = 0;      // accumulated nudge on the ring's boost layer

const fit = name => { card.style.height = panels[name].offsetHeight + 'px'; };

function show(name) {
  if (name === current) return;

  const from = panels[current];
  const to   = panels[name];
  current = name;

  /* ring reacts: extra rotation + one-shot sweep around the circumference */
  spin += 26;
  boost.style.transform = `rotate(${spin}deg)`;
  flash.classList.remove('go');
  void flash.offsetWidth;              // force reflow to restart the animation
  flash.classList.add('go');

  /* outgoing panel */
  from.dataset.state = 'hidden';
  from.setAttribute('inert', '');      // keeps it out of the tab order
  from.classList.remove('enter');

  /* incoming panel */
  to.removeAttribute('inert');
  to.dataset.state = 'idle';
  to.classList.remove('enter');
  void to.offsetWidth;
  to.classList.add('enter');

  /* restart the sequential field-highlight beats from the first field */
  to.querySelectorAll('.field').forEach(f => {
    f.style.animation = 'none';
    void f.offsetWidth;
    f.style.animation = '';
  });

  fit(name);
}

document.querySelectorAll('.swap').forEach(btn => {
  btn.addEventListener('click', () => {
    stopAuto();
    show(btn.dataset.go);
  });
});

/* 3 ── password reveal ─────────────────────────────────────────────────── */

document.querySelectorAll('.eye').forEach(btn => {
  const input = document.getElementById(btn.dataset.target);
  btn.addEventListener('click', () => {
    const shown = input.type === 'text';
    input.type = shown ? 'password' : 'text';
    btn.setAttribute('aria-pressed', String(!shown));
    btn.setAttribute('aria-label', shown ? 'Show password' : 'Hide password');
    input.focus();
  });
});

/* 4 ── auto demo: login → sign up → login, ~11s cycle ──────────────────── */

let auto = true;
let timer;

function loopDemo() {
  timer = setTimeout(() => {
    if (!auto) return;
    show('signup');
    timer = setTimeout(() => {
      if (!auto) return;
      show('login');
      loopDemo();
    }, 5600);
  }, 5200);
}

function stopAuto() {
  auto = false;
  clearTimeout(timer);
}

/* the first real interaction hands control to the user */
['pointerdown', 'keydown', 'focusin'].forEach(evt =>
  card.addEventListener(evt, stopAuto, { once: true })
);

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

fit('login');
addEventListener('load', () => {
  fit('login');                       // re-measure once webfonts have landed
  if (!reduceMotion) loopDemo();
});
