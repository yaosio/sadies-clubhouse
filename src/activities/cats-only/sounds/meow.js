// The herd's voices: soft little meows in six slightly different versions (the pitch and the shape
// of each differ), and the button's one quiet click. The owner can't stand constant noise, so the
// herd's meows are rationed (herd.js: a handful in the whole stampede, never close together, never
// the same version twice running) and these are made gentle: nothing loud, nothing that repeats,
// no drone, no tick.
import { RATE, TAU, rng, resonance, finish } from '../../../shared/retro.js';

export const LOUD = { meow: 0.2, press: 0.3 };   // how loud each can be, at most, before distance

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

export const VARIANTS = 6;

// A small "mi-aow": up and then down, the mouth opening from "ee" to "ow". Each version is a
// different size of cat: higher and shorter, or lower and longer.
export function meow(variant = 0) {
  const up = variant * 38, len = 0.44 + (variant % 3) * 0.06, a = voice(len, [470 + up, 650 + up, 620 + up, 450 + up], [380, 820, 780, 560], [2100, 1500, 1200, 1000], 11 + variant);
  let m = 0; for (const v of a) m = Math.max(m, Math.abs(v));
  if (m) for (let i = 0; i < a.length; i++) a[i] *= 0.6 / m;
  return finish(a, 0.12, 0.1);
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
