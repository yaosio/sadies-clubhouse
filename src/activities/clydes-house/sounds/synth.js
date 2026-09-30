// The little toolkit every sound in Clyde's house is made with: a tone that slides, a soft hush, and
// the same ending for all of them (a gentle limit, a fade right down to nothing, 8 bits). Plain
// numbers, no browser: 8-bit, 11 kHz, like every sound on the 1996 CD (the toolbox's kit,
// src/shared/retro.js, with a tone and a hush of its own).
import { RATE, TAU, blank, finish as gentle } from '../../../shared/retro.js';
export { RATE, TAU, blank };
// how loud a sound is over time: a plucked one dies away (6 ms to come in, so no click); a swell
// comes up and goes down again
export const pluck = rate => t => Math.exp(-t * rate) * Math.min(1, t / 0.006);
export const swell = (t, k) => Math.sin(Math.PI * k);

// a tone from `at` seconds for `len`, its pitch sliding from f0 to f1 (or f0 can be a function of how
// far through it is, 0 to 1); o: gain, tri (softer-edged, like a wood block), h2 (a bit of the
// octave, for a voice), wob and wobHz (a wobble in the pitch)
export function tone(a, at, len, f0, f1, env, o = {}) {
  const n = Math.round(len * RATE), s0 = Math.round(at * RATE), gain = o.gain ?? 0.3;
  let ph = 0;
  for (let i = 0; i < n && s0 + i < a.length; i++) {
    const t = i / RATE, k = i / n;
    let f = typeof f0 === 'function' ? f0(k) : f0 * Math.pow(f1 / f0, k);
    if (o.wob) f *= 1 + o.wob * Math.sin(TAU * (o.wobHz || 8) * t);
    ph += TAU * f / RATE;
    let w = Math.sin(ph);
    if (o.tri) w = Math.asin(w) * 2 / Math.PI;
    if (o.h2) w += o.h2 * Math.sin(2 * ph);
    a[s0 + i] += w * env(t, k) * gain;
  }
  return a;
}
// a hush of air: noise smoothed right down, so it's more whoosh than hiss
export function hush(a, at, len, env, gain = 0.3, smooth = 0.08, seed = 7) {
  const n = Math.round(len * RATE), s0 = Math.round(at * RATE);
  let s = seed, y = 0;
  for (let i = 0; i < n && s0 + i < a.length; i++) {
    s = (s * 16807) % 2147483647;
    y += ((s / 2147483647) * 2 - 1 - y) * smooth;
    a[s0 + i] += y * env(i / RATE, i / n) * gain * 3;
  }
  return a;
}
// every sound ends the same way: rounded off, faded to nothing over its last bit, 8 bits (no echo)
export const finish = (a, fade = 0.04) => gentle(a, 0, 0, fade);
