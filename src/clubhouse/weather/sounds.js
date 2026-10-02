// Sadie's sounds on the gatepost when the weather comes: a "mew" for rain, a "mrrp" for anything
// else. Short and soft, plain numbers (the tests run them), 8-bit, 11 kHz, on the toolbox's kit.
// (The same two as Clyde's Sadie; a shared kit of Sadie's voice is for the sound tidy-up.)
import { RATE, TAU, blank, finish as gentle } from '../../shared/retro.js';
export { RATE };

// a tone from `at` seconds for `len`, its pitch sliding from f0 to f1 (or f0 a function of how far
// through it is, 0 to 1); o: gain, h2 (a bit of the octave, for a voice), wob and wobHz (a wobble)
function tone(a, at, len, f0, f1, env, o = {}) {
  const n = Math.round(len * RATE), s0 = Math.round(at * RATE), gain = o.gain ?? 0.3;
  let ph = 0;
  for (let i = 0; i < n && s0 + i < a.length; i++) {
    const t = i / RATE, k = i / n;
    let f = typeof f0 === 'function' ? f0(k) : f0 * Math.pow(f1 / f0, k);
    if (o.wob) f *= 1 + o.wob * Math.sin(TAU * (o.wobHz || 8) * t);
    ph += TAU * f / RATE;
    let w = Math.sin(ph);
    if (o.h2) w += o.h2 * Math.sin(2 * ph);
    a[s0 + i] += w * env(t, k) * gain;
  }
  return a;
}
const finish = a => gentle(a, 0, 0, 0.04);

// a little rolled chirp, going up
export const mrrp = () => finish(tone(blank(0.36), 0, 0.33, 420, 640,
  (t, k) => Math.sin(Math.PI * Math.min(1, k * 1.3)) * (0.6 + 0.4 * Math.sin(Math.PI * 2 * 28 * t)), { h2: 0.3, gain: 0.26 }));
// mew (up a little, then down)
export const mew = () => finish(tone(blank(0.45), 0, 0.42, k => (k < 0.3 ? 560 + 700 * k : 770 - 330 * (k - 0.3)),
  0, (t, k) => Math.sin(Math.PI * k) ** 0.7, { h2: 0.35, wob: 0.02, wobHz: 6, gain: 0.22 }));
export const ALL = { mrrp, mew };
