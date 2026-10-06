// The herd's voices: eight kinds of soft cat noise (the sound system plays each at one of six
// pitches), the soft rush of them all piling out, and the button's quiet thump. The owner can't
// stand constant noise: each meow is short, never loud, and nothing here loops, drones or ticks (the
// stampede is a caterwaul on purpose, and herd.js caps it and never says one thing twice running).
import { RATE, TAU, rng, resonance, finish } from '../../../shared/retro.js';

export const LOUD = { meow: 0.2, press: 0.3, pile: 0.4 };   // how loud each can be, at most, before distance

const ease = (t, a, d, len) => Math.min(1, t / a, (len - t) / d);   // fade in over a, out over d
const lerp = (pts, k) => {   // a value along a few points, k from 0 to 1
  const x = Math.min(pts.length - 1.0001, Math.max(0, k * (pts.length - 1))), i = Math.floor(x);
  return pts[i] + (pts[i + 1] - pts[i]) * (x - i);
};

// A mouth: a buzz at a pitch that follows `pitch` (Hz, points along its length) through two
// resonances that follow f1 and f2, with a little breath. Plain numbers.
function voice(len, pitch, f1, f2, seed) {
  const r = rng(seed), n = Math.round(len * RATE), a = new Float32Array(n + Math.round(0.15 * RATE));
  const m1 = resonance(120), m2 = resonance(200);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE, k = t / len;
    ph += lerp(pitch, k) * (1 + 0.012 * Math.sin(TAU * 6 * t)) / RATE;
    const buzz = (ph % 1) * 2 - 1 + (r() * 2 - 1) * 0.15;
    a[i] = (m1(buzz, lerp(f1, k)) + 0.6 * m2(buzz, lerp(f2, k))) * ease(t, 0.05, 0.14, len);
  }
  return a;
}

export const TYPES = 8;   // kinds of meow
// How much faster each pitch plays (the sound system's `rate`): faster is higher and shorter, a kitten; slower is a big old tom
export const PITCHES = [0.72, 0.86, 1, 1.18, 1.4, 1.7];

// Eight different cat noises, each a little different shape: the pitch going up and down, the mouth
// opening and closing, how long it goes on. (The sound system plays each at one of the pitches above.)
const KINDS = [
  { len: 0.5,  pitch: [470, 650, 620, 450],      f1: [380, 820, 780, 560],  f2: [2100, 1500, 1200, 1000] },   // a plain "mi-aow"
  { len: 0.3,  pitch: [650, 800, 760],            f1: [500, 700, 600],      f2: [2400, 2000, 1800] },          // a short "mew"
  { len: 0.85, pitch: [380, 420, 600, 560, 330],  f1: [500, 900, 800, 600],  f2: [1500, 1300, 1100, 900] },     // a long wailing yowl
  { len: 0.36, pitch: [300, 420, 380, 280],       f1: [400, 650, 500, 380],  f2: [1200, 1100, 900, 800] },      // a low rolling "mrow"
  { len: 0.26, pitch: [800, 1100, 1000],          f1: [600, 900, 800],      f2: [2800, 2400, 2200] },          // a high squeal
  { len: 0.7,  pitch: [620, 560, 500, 420, 360],  f1: [700, 600, 500, 450], f2: [1800, 1500, 1300, 1000] },    // a long sad whine, sinking
  { len: 0.4,  pitch: [750, 560, 380],            f1: [800, 700, 450],      f2: [1500, 1200, 900] },           // a quick "yeow", falling
  { len: 0.18, pitch: [520, 700, 820],            f1: [450, 650, 750],      f2: [2300, 2100, 2000] },          // a tiny chirp
];

export function meow(type = 0) {
  const k = KINDS[type % TYPES], a = voice(k.len, k.pitch, k.f1, k.f2, 11 + type);
  let m = 0; for (const v of a) m = Math.max(m, Math.abs(v));
  if (m) for (let i = 0; i < a.length; i++) a[i] *= 0.6 / m;
  return finish(a, 0.12, 0.1);
}

// All of them piling out of the little room at once: a soft whoosh that swells and falls away over
// about two seconds, and a scatter of muffled thumps and scrabbles at uneven times inside it. It
// happens once, never repeats and has no steady tone.
export function pile() {
  const r = rng(77), len = 2.4, n = Math.round(len * RATE), a = new Float32Array(n), rush = resonance(400);
  const thumps = Array.from({ length: 34 }, () => ({ t: 0.05 + Math.pow(r(), 1.3) * 1.9, f: 90 + r() * 170, g: 0.25 + r() * 0.5 }));
  for (let i = 0; i < n; i++) {
    const t = i / RATE, k = t / len, swell = Math.sin(Math.PI * Math.pow(k, 0.7)) ** 2;
    a[i] = rush(r() * 2 - 1, 500 + 900 * swell) * 0.9 * swell;
  }
  for (const th of thumps) {
    const s0 = Math.round(th.t * RATE), dur = Math.round(0.09 * RATE);
    for (let j = 0; j < dur && s0 + j < n; j++) { const t = j / RATE; a[s0 + j] += Math.sin(TAU * th.f * t) * Math.exp(-t * 45) * th.g * 0.5 * Math.min(1, t / 0.004); }
  }
  let m = 0; for (const v of a) m = Math.max(m, Math.abs(v));
  if (m) for (let i = 0; i < n; i++) a[i] *= 0.7 / m;
  return finish(a, 0.1, 0.4);
}

// The red button going in: a soft low "bwup", no click at the end.
export function press() {
  const r = rng(5), n = Math.round(0.16 * RATE), a = new Float32Array(n), body = resonance(250);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    a[i] = Math.sin(TAU * (150 - 60 * t / 0.16) * t) * Math.exp(-t * 22) * Math.min(1, t / 0.008) + body(r() * 2 - 1, 500) * 0.25 * Math.exp(-t * 40);
  }
  return finish(a, 0, 0, 0.05);
}
