// The herd's voices: eight kinds of cat noise (each played at one of six pitches), a crowd of
// ninety of them yowling over each other, the rush of them piling out, and the button's quiet thump.
// The meows are made like a real cat's: a rough, wobbling buzz (a throat) with breath in it, sent
// through three mouth shapes that glide from "mm" to "ee" to "ow", at a higher quality than the rest of
// the game's sounds and without the 8-bit crunch, so they don't sound like an old arcade machine.
// The owner asked for this stampede to be loud and chaotic (once, only when the button's pressed):
// each meow is still short and nothing loops, drones or ticks.
import { RATE, TAU, rng, resonance, finish } from '../../../shared/retro.js';

export const SR = 22050;                          // the meows are made at twice the game's usual rate: clearer
export const LOUD = { meow: 0.32, press: 0.3, pile: 0.45, crowd: 0.55 };   // how loud each can be, at most, before distance

const lerp = (pts, k) => {   // a value along a few points, k from 0 to 1
  const x = Math.min(pts.length - 1.0001, Math.max(0, k * (pts.length - 1))), i = Math.floor(x);
  return pts[i] + (pts[i + 1] - pts[i]) * (x - i);
};
const mouth = bw => {        // a resonance at this width, at this sample rate
  let y1 = 0, y2 = 0; const r = Math.exp(-Math.PI * bw / SR);
  return (x, f) => { const y = (1 - r) * x + 2 * r * Math.cos(TAU * f / SR) * y1 - r * r * y2; y2 = y1; y1 = y; return y; };
};
// a soft limit and a fade at each end: no crunch
function soft(a, fade = 0.03) {
  const f = Math.max(1, Math.round(fade * SR));
  for (let i = 0; i < a.length; i++) { let v = Math.tanh(a[i]); if (i < f) v *= i / f; if (i > a.length - f) v *= (a.length - i) / f; a[i] = v; }
  return a;
}
const peakOf = a => { let m = 0; for (const v of a) m = Math.max(m, Math.abs(v)); return m; };
const scale = (a, to) => { const m = peakOf(a); if (m) for (let i = 0; i < a.length; i++) a[i] *= to / m; return a; };

export const TYPES = 8;   // kinds of meow
// How much faster each pitch plays (the sound system's `rate`): faster is higher and shorter, a kitten; slower is a big old tom
export const PITCHES = [0.72, 0.86, 1, 1.18, 1.4, 1.7];

// Eight cat noises: how long, the pitch of the throat along it, the three mouth shapes (Hz) along it,
// how rough the throat is (0 to 1), and how much breath is in it
const KINDS = [
  { len: 0.5,  pitch: [470, 650, 620, 450],      f1: [380, 820, 780, 560],  f2: [2100, 1500, 1200, 1000], rough: 0.25, breath: 0.25 },   // a plain "mi-aow"
  { len: 0.3,  pitch: [650, 800, 760],            f1: [500, 700, 600],      f2: [2400, 2000, 1800],       rough: 0.1,  breath: 0.2 },    // a short "mew"
  { len: 0.85, pitch: [380, 420, 600, 560, 330],  f1: [500, 900, 800, 600],  f2: [1500, 1300, 1100, 900], rough: 0.55, breath: 0.3 },    // a long wailing yowl
  { len: 0.36, pitch: [300, 420, 380, 280],       f1: [400, 650, 500, 380],  f2: [1200, 1100, 900, 800],  rough: 0.7,  breath: 0.3 },    // a low rolling, growly "mrrow"
  { len: 0.26, pitch: [800, 1100, 1000],          f1: [600, 900, 800],      f2: [2800, 2400, 2200],       rough: 0.15, breath: 0.15 },   // a high squeal
  { len: 0.7,  pitch: [620, 560, 500, 420, 360],  f1: [700, 600, 500, 450], f2: [1800, 1500, 1300, 1000], rough: 0.35, breath: 0.4 },    // a long sad whine, sinking
  { len: 0.4,  pitch: [750, 560, 380],            f1: [800, 700, 450],      f2: [1500, 1200, 900],        rough: 0.5,  breath: 0.3 },    // a quick "yeow", falling
  { len: 0.18, pitch: [520, 700, 820],            f1: [450, 650, 750],      f2: [2300, 2100, 2000],       rough: 0.05, breath: 0.2 },    // a tiny chirp
];

// One cat noise, as plain numbers. `v` is which version of it (each version has its own wobble and breath).
const raws = new Map();
function raw(type, v = 0) {
  const key = type * 8 + v;
  if (raws.has(key)) return raws.get(key);
  const k = KINDS[type % TYPES], r = rng(101 + key * 7), n = Math.round(k.len * SR), a = new Float32Array(n);
  const m1 = mouth(110), m2 = mouth(160), m3 = mouth(260);
  const det = 0.93 + r() * 0.14, vib = 4 + r() * 3, vibAmt = 0.01 + r() * 0.02, wob = r() * TAU;
  let ph = 0, jit = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, u = t / k.len, edge = Math.min(1, t / 0.03, (k.len - t) / 0.07);
    jit = jit * 0.97 + (r() - 0.5) * 0.012;   // the throat never holds quite still
    ph += lerp(k.pitch, u) * det * (1 + jit + vibAmt * Math.sin(TAU * vib * t + wob) * Math.min(1, u * 3)) / SR;
    const x = ph % 1, buzz = Math.pow(1 - x, 2.2) * 2.2 - 0.7;                                       // a sharp-edged pulse: lots of overtones
    const grit = 1 - k.rough * (0.5 + 0.5 * Math.sin(TAU * (45 + 30 * r()) * t + 4 * r()));           // rough, growly throat
    const hush = k.breath * (0.5 + 0.5 * (1 - Math.min(1, 4 * Math.min(u, 1 - u))));                  // more breath at the ends
    const src = (buzz * grit * (1 - hush) + (r() * 2 - 1) * hush) ;
    a[i] = (m1(src, lerp(k.f1, u)) * 1.0 + m2(src, lerp(k.f2, u)) * 0.8 + m3(src, 3300 + 400 * Math.sin(u * 3)) * 0.35) * edge * (0.75 + 0.25 * Math.sin(Math.PI * u));
  }
  const out = scale(soft(a), 0.7);
  raws.set(key, out);
  return out;
}

// one of the herd's meows: the sound system plays it at the pitch it's asked for
export function meow(type = 0) { return raw(type, 0); }

// Ninety cats all yowling at once, over ten seconds: each of the versions of each kind, at every
// pitch, at uneven times, some near and some far. It swells up fast, carries on, and dies away. Made once.
let crowd = null;
export function chorus() {
  if (crowd) return crowd;
  const len = 10, a = new Float32Array(Math.round((len + 1) * SR)), r = rng(2024);
  for (let c = 0; c < 90; c++) {
    const t0 = Math.round((0.05 + Math.pow(r(), 1.1) * 7.8) * SR), src = raw(Math.floor(r() * TYPES), Math.floor(r() * 3)), sp = PITCHES[Math.floor(r() * PITCHES.length)], g = 0.2 + r() * 0.8;
    for (let i = 0; ; i++) {
      const p = i * sp, j = Math.floor(p); if (j + 1 >= src.length || t0 + i >= a.length) break;
      a[t0 + i] += (src[j] + (src[j + 1] - src[j]) * (p - j)) * g;
    }
  }
  for (let i = 0; i < a.length; i++) { const t = i / SR; a[i] *= Math.min(1, t / 0.6, (len + 1 - t) / 2.5); }
  crowd = scale(soft(a, 0.05), 0.85);
  return crowd;
}

// All of them piling out of the little room at once: a soft whoosh that swells and falls away over
// about two seconds, and a scatter of muffled thumps and scrabbles at uneven times inside it. It
// happens once, never repeats and has no steady tone.
let rushed = null;
export function pile() {
  if (rushed) return rushed;
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
  rushed = finish(scale(a, 0.7), 0.1, 0.4);
  return rushed;
}

// get the big sounds made now (when the button's pressed), so nothing stalls when the herd bursts out
// (in a few small steps, a frame or so apart, so the game never stalls)
export function warm() {
  const steps = [...Array(TYPES * 3)].map((_, i) => () => raw(Math.floor(i / 3), i % 3)).concat([pile, chorus]);
  const next = () => { steps.shift()?.(); if (steps.length) setTimeout(next, 16); };
  next();
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
