// The KEYCAT 3000, a cheap 90s keyboard with four silly sounds: CAT (every key a tiny mew), BIRD (a
// chirp), BELL (a doorbell's ding) and CAN (a tin can, plinked). Its keys are laid out like the toy
// piano's: middle C up to the E an octave and a bit above.
// Its DEMO button plays three notes and then the screen says the rest is in the full version.
import { RATE, TAU, blank, ring, finish, hz, resonance } from './retro.js';

export const VOICES = ['CAT', 'BIRD', 'BELL', 'CAN'];
export const DEMO = [60, 64, 67];   // the notes the demo plays (then: FULL VERSION 1997!)

export function synthNote(voice, midi) {
  const f = hz(midi);
  if (voice === 'CAT') {
    // a tiny mew: a buzz through a mouth that opens and closes, the pitch bending up a little
    const a = blank(0.36), m1 = resonance(160), m2 = resonance(260);
    let ph = 0;
    for (let i = 0; i < a.length; i++) {
      const t = i / a.length, env = Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 1.5;
      ph += (f * (1 + 0.12 * Math.sin(Math.PI * t))) / RATE; ph -= Math.floor(ph);
      const buzz = ph * 2 - 1, open = Math.sin(Math.PI * t);
      a[i] = (m1(buzz, 600 + 500 * open) * 0.9 + m2(buzz, 1800 + 700 * open) * 0.4) * env * 1.5;
    }
    return finish(a, 0.1);
  }
  if (voice === 'BIRD') {
    // a chirp that swoops up, twice
    const a = blank(0.34);
    for (const at of [0, 0.17]) {
      let ph = 0; const s0 = Math.round(at * RATE), n = Math.round(0.11 * RATE);
      for (let i = 0; i < n && s0 + i < a.length; i++) {
        const t = i / n; ph += TAU * f * 2 * (1 + 0.5 * t) / RATE;
        a[s0 + i] += Math.sin(ph) * Math.sin(Math.PI * t) * 0.35;
      }
    }
    return finish(a, 0.1);
  }
  if (voice === 'BELL') {
    // a doorbell's ding: a bell made by wobbling one tone with another
    const a = blank(1.3);
    for (let i = 0; i < a.length; i++) {
      const t = i / RATE, e = Math.exp(-t * 3.2), idx = 2.2 * Math.exp(-t * 5);
      a[i] = Math.sin(TAU * f * t + idx * Math.sin(TAU * f * 3.5 * t)) * e * 0.4 * Math.min(1, t / 0.004);
    }
    return finish(a, 0.12);
  }
  // CAN: a tin can plinked with a fingernail
  const a = blank(0.4);
  ring(a, f, 16, 0.4); ring(a, f * 2.41, 20, 0.2); ring(a, f * 4.13, 30, 0.1);
  return finish(a, 0.06);
}
