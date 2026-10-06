// The pool's sounds: a soft splash (three a bit different), a soft boing for the beach ball, and a
// little squirt. Plain numbers, 8-bit 11 kHz like the rest (src/shared/retro.js), played through the
// sound system. None of them loops or ticks, and pool.js keeps each rare (a gap of several seconds
// between the same one): the owner's rule, docs/clubhouse/RULEBOOK.md section 4.
import { RATE, blank, tone, hush, pluck, dry } from '../../shared/retro.js';

export const POOL_RATE = RATE;

// a splash: a soft whoosh of water that dies away, and a bubbly "bloop" or two; `v` (0 to 2) makes each a bit different
export function splash(v = 0) {
  const a = blank(0.55);
  hush(a, 0, 0.5, (t, k) => Math.min(1, t / 0.02) * Math.pow(1 - k, 2), 0.7, 0.16 + v * 0.05, 11 + v * 7);
  tone(a, 0.03, 0.14, 380 + v * 90, 760 + v * 120, (t, k) => Math.sin(Math.PI * k) * 0.8, { gain: 0.18 });
  if (v !== 1) tone(a, 0.17, 0.1, 520 + v * 60, 900, (t, k) => Math.sin(Math.PI * k), { gain: 0.1 });
  return dry(a, 0.1);
}
// the beach ball: a rubbery boing, soft-edged
export function boing(pitch = 1) {
  const a = blank(0.3);
  tone(a, 0, 0.26, 300 * pitch, 120 * pitch, pluck(9), { tri: true, gain: 0.32 });
  return dry(a, 0.05);
}
// a squirt of the water pistol
export function squirt() {
  const a = blank(0.2);
  hush(a, 0, 0.17, (t, k) => Math.min(1, t / 0.01) * (1 - k), 0.5, 0.45, 5);
  return dry(a, 0.04);
}
