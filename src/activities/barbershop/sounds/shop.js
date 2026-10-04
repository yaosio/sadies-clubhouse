// The shop's small sounds, each once, when something happens: a snip when you pick something, the
// cat tower's thumps, a poof for the magic trick, a whoosh and a thud for the superhero. Nothing loops.
import { blank, tone, hush, pluck, dry } from '../../../shared/retro.js';

// picking a hairdo, taildo or outfit: a tiny snip
export const snip = () => dry(hush(blank(0.07), 0, 0.06, (t, k) => Math.sin(Math.PI * k), 0.1, 0.5, 3), 0.02);
// the cat tower falling over: five soft thumps, one after another, each a little quieter
export function tumble() {
  const a = blank(1.1);
  [0, 0.17, 0.3, 0.52, 0.7].forEach((at, i) => {
    const g = 0.5 - i * 0.07;
    tone(a, at, 0.22, 130, 55, pluck(14), { gain: g });
    hush(a, at, 0.15, t => Math.exp(-t * 18), 0.09 * g * 2, 0.2, 5 + i);
  });
  return dry(a, 0.08);
}
// the magician's poof: a soft puff of air
export const poof = () => dry(hush(blank(0.5), 0, 0.45, (t, k) => Math.sin(Math.PI * Math.min(1, k * 2.5)) * Math.exp(-t * 5), 0.3, 0.06, 9), 0.1);
// the superhero's takeoff: air rushing up
export const whoosh = () => dry(hush(blank(0.75), 0, 0.7, (t, k) => Math.sin(Math.PI * k), 0.26, 0.03, 11), 0.12);
// ...and landing in the box
export function thud() {
  const a = blank(0.3);
  tone(a, 0, 0.25, 120, 60, pluck(12), { gain: 0.45 }); hush(a, 0, 0.12, t => Math.exp(-t * 20), 0.1, 0.2, 13);
  return dry(a, 0.06);
}
