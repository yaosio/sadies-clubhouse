// The paint shop's sounds: each one short and soft, once, when something happens. Painting itself
// makes no sound at all (a brush going back and forth would be the same noise over and over), and the
// dynamite is a soft fwump, not a bang.
import { blank, pluck, tone, hush, finish } from './synth.js';

// dipping the brush in a pot: plip
export const plip = () => finish(tone(blank(0.14), 0, 0.12, 520, 860, pluck(30), { gain: 0.26 }));
// taking a tool off the pegboard: a little wooden tok
export const tok = () => finish(tone(blank(0.12), 0, 0.1, 340, 240, pluck(38), { gain: 0.32, tri: true }));
// a stamp going down: pup
export const pup = () => finish(tone(blank(0.1), 0, 0.09, 230, 150, pluck(34), { gain: 0.38, tri: true }));
// the paint bucket: a soft glug (two little bloops going down)
export function glug() {
  const a = blank(0.3);
  tone(a, 0, 0.12, 420, 260, pluck(22), { gain: 0.26 });
  tone(a, 0.12, 0.14, 330, 200, pluck(20), { gain: 0.22 });
  return finish(a);
}
// the dynamite: a soft, low fwump, and a breath of air
export function fwump() {
  const a = blank(0.5);
  tone(a, 0, 0.45, 110, 48, pluck(9), { gain: 0.5 });
  hush(a, 0, 0.4, (t, k) => Math.sin(Math.PI * Math.min(1, k * 2.2)) * Math.exp(-t * 6), 0.12);
  return finish(a, 0.08);
}
// the plunger, the first time: are you sure? (two notes, the second higher, like a question)
export function eh() {
  const a = blank(0.4);
  tone(a, 0, 0.16, 520, 520, pluck(16), { gain: 0.2 });
  tone(a, 0.17, 0.2, 700, 740, pluck(12), { gain: 0.2 });
  return finish(a);
}
// the plunger, the second time: a longer soft whump, then the room's clean (three music-box notes)
export function kaboom() {
  const a = blank(1.5);
  tone(a, 0, 0.7, 95, 40, pluck(6), { gain: 0.5 });
  hush(a, 0, 0.6, (t, k) => Math.sin(Math.PI * k) * Math.exp(-t * 4), 0.12);
  [988, 1319, 1568].forEach((f, i) => tone(a, 0.7 + i * 0.14, 0.6, f, f, pluck(7), { gain: 0.1 }));
  return finish(a, 0.15);
}
