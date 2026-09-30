// The drum kit, which is really Sadie's bed: a blanket stuffed in the bass drum, fur all over the
// snare. So everything is muffled and soft, which suits it (the owner can't stand sharp, clicky
// noise). The kick, the furry snare, two toms, the floor tom, the hi-hat and the cymbal.
import { RATE, TAU, rng, blank, finish } from './retro.js';

export const DRUMS = ['kick', 'snare', 'tom1', 'tom2', 'floor', 'hat', 'cymbal'];

// a drum's body: a thump that bends down in pitch as it dies away
function body(a, f0, f1, dec, amp) {
  let ph = 0;
  for (let i = 0; i < a.length; i++) {
    const t = i / RATE, e = Math.exp(-t * dec);
    if (e < 0.002) break;
    ph += TAU * (f1 + (f0 - f1) * Math.exp(-t * 18)) / RATE;
    a[i] += Math.sin(ph) * e * amp * Math.min(1, t / 0.003);
  }
}
// a puff of noise, softened (low: how much of the top is taken off, 0 to 1)
function hiss(a, dec, amp, low, seed, high = false) {
  const r = rng(seed); let y = 0, prev = 0;
  for (let i = 0; i < a.length; i++) {
    const t = i / RATE, e = Math.exp(-t * dec);
    if (e < 0.002) break;
    const n = r() * 2 - 1;
    y += (n - y) * (1 - low);
    const v = high ? y - prev : y; prev = y;
    a[i] += v * e * amp * Math.min(1, t / 0.002);
  }
}

export function drum(name) {
  const a = blank({ kick: 0.5, snare: 0.35, tom1: 0.5, tom2: 0.55, floor: 0.7, hat: 0.12, cymbal: 1.6 }[name] ?? 0.4);
  if (name === 'kick') { body(a, 95, 48, 9, 0.8); hiss(a, 60, 0.08, 0.9, 3); }             // (the blanket takes the click off)
  else if (name === 'snare') { body(a, 210, 180, 30, 0.35); hiss(a, 22, 0.3, 0.75, 5); }    // (the fur: a soft "thff")
  else if (name === 'tom1') body(a, 200, 165, 9, 0.6);
  else if (name === 'tom2') body(a, 160, 128, 8, 0.6);
  else if (name === 'floor') body(a, 115, 88, 6.5, 0.65);
  else if (name === 'hat') hiss(a, 70, 0.22, 0.3, 7, true);
  else if (name === 'cymbal') hiss(a, 2.4, 0.16, 0.35, 11, true);
  return finish(a, 0.08);
}
