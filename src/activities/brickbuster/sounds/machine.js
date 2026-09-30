// Brickbuster '96's machine: the paddle's BOING, the bricks' blips (higher rows, higher notes), and
// the low wooden tock of the sides of the case (and of bricks landing on the heap).
import { RATE, TAU, finish } from './retro.js';

// The paddle: a springy square-wave BOING, the pitch wobbling up.
export function boing(off = 0) {
  const n = Math.round(0.34 * RATE), a = new Float32Array(n + Math.round(0.2 * RATE));
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE, f = (150 + off * 25) + 230 * (1 - Math.exp(-t * 11)) + 40 * Math.sin(TAU * 16 * t) * Math.exp(-t * 5);
    ph += f / RATE;
    a[i] = (ph % 1 < 0.5 ? 0.42 : -0.42) * Math.exp(-t * 7);
  }
  return finish(a, 0.25);
}

// A brick: a short blip, higher for the rows further up.
export function blip(row = 0) {
  const n = Math.round(0.09 * RATE), a = new Float32Array(n + Math.round(0.2 * RATE)), f = 523 * Math.pow(2, (5 - row) / 5);
  let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / RATE; ph += (t < 0.03 ? f : f * 1.5) / RATE; a[i] = (ph % 1 < 0.5 ? 0.3 : -0.3) * (1 - t / 0.09); }
  return finish(a, 0.2);
}

// The sides of the case: a low wooden tock.
export function tock() {
  const n = Math.round(0.05 * RATE), a = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / RATE; a[i] = Math.sin(TAU * 190 * t) * Math.exp(-t * 70) * 0.45; }
  return finish(a, 0);
}
