// The Good Morning Machine's sounds, one for each thing it does (and a few for you): each plays once
// when that step happens, is short, soft and rounded (no hiss, no rattle), and nothing loops or
// hums. No rolling marble, no whirring wheel: those would go on and on.
import { blank, pluck, swell, tone, hush, dry } from '../../../shared/retro.js';

// the lever going down: a soft wooden clunk
export const clunk = () => dry(tone(blank(0.22), 0, 0.2, 150, 75, pluck(22), { gain: 0.5 }));
// the dominoes going over: one little clatter, four ticks stepping down
export function clatter() {
  const a = blank(0.36);
  for (let i = 0; i < 4; i++) tone(a, i * 0.07, 0.07, 820 - i * 70, 640 - i * 70, pluck(70), { gain: 0.16, tri: true });
  return dry(a);
}
// the seesaw flinging the yarn: boing
export const boing = () => dry(tone(blank(0.4), 0, 0.38, 180, 420, pluck(7), { wob: 0.06, wobHz: 14, gain: 0.3 }));
// the yarn down the funnel: fwoop
export const fwoop = () => dry(tone(blank(0.3), 0, 0.28, 700, 220, swell, { gain: 0.22 }));
// the fan starting: one soft whoosh
export const whoosh = () => dry(hush(blank(0.6), 0, 0.6, (t, k) => Math.sin(Math.PI * k) ** 2, 0.3));
// the boat setting off: bloop
export const bloop = () => dry(tone(blank(0.15), 0, 0.12, 300, 900, pluck(20), { gain: 0.3 }));
// the teacup tipping: a little clink (not too high)
export function clink() {
  const a = blank(0.35);
  tone(a, 0, 0.35, 1320, 1320, pluck(14), { gain: 0.16 });
  tone(a, 0, 0.35, 1980, 1980, pluck(24), { gain: 0.05 });
  return dry(a, 0.08);
}
// swapping the part in a gap: a soft pop
export const pop = () => dry(tone(blank(0.07), 0, 0.06, 520, 260, pluck(40), { gain: 0.3 }), 0.01);
// it stopped at a gap: bonk
export const bonk = () => dry(tone(blank(0.25), 0, 0.22, 220, 150, pluck(18), { gain: 0.4, tri: true }));
// the rubber duck, whenever it's picked or bumped: squeak
export const squeak = () => dry(tone(blank(0.2), 0, 0.18, 900, 1300, swell, { wob: 0.08, wobHz: 25, gain: 0.18 }));
// the toaster popping: a little bell ding (it's done!)
export function ding() {
  const a = blank(0.5);
  tone(a, 0, 0.5, 988, 988, pluck(8), { gain: 0.16 });
  tone(a, 0, 0.5, 1976, 1976, pluck(18), { gain: 0.04 });
  return dry(a, 0.1);
}
// the yo-yo: down and up (zip-zip)
export function zip() {
  const a = blank(0.4);
  tone(a, 0, 0.17, 700, 300, swell, { gain: 0.2 });
  tone(a, 0.2, 0.17, 300, 700, swell, { gain: 0.2 });
  return dry(a);
}
// the bulb lighting up: one soft plink, high then settling
export const plink = () => dry(tone(blank(0.4), 0, 0.38, 1200, 900, pluck(12), { gain: 0.16 }), 0.08);
