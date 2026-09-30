// The sound each find makes when you pick it up, once: soft and short, never sharp or clicky (the
// owner has misophonia). The bottle bloops, the hat goes bom-bom, the duck gives a muffled squeak,
// the floppy disk whirrs in a drive for a moment, the coconut knocks like hollow wood, and the
// mountain (the last one) gets a little chime. `reef` is the gentle swell when the reef sinks.
import { RATE, TAU, rng, hz, blank, ring, resonance, finish } from '../../../shared/retro.js';

// a note that slides from f0 to f1 over its length, fading in and out: a bloop or a squeak
function slide(a, f0, f1, amp, at = 0, len = a.length / RATE - at) {
  const s0 = Math.round(at * RATE), n = Math.round(len * RATE);
  let ph = 0;
  for (let i = 0; i < n && s0 + i < a.length; i++) {
    const k = i / n, env = Math.sin(Math.PI * Math.min(1, k * 1.6)) * (1 - k);
    ph += TAU * (f0 + (f1 - f0) * k) / RATE;
    a[s0 + i] += Math.sin(ph) * env * amp;
  }
}
// soft noise, low and muffled (for the disk drive's heads)
function puff(a, at, len, amp, seed, low = 0.9) {
  const r = rng(seed), s0 = Math.round(at * RATE), n = Math.round(len * RATE);
  let y = 0;
  for (let i = 0; i < n && s0 + i < a.length; i++) {
    y += (r() * 2 - 1 - y) * (1 - low);
    a[s0 + i] += y * amp * Math.sin(Math.PI * i / n);
  }
}

export function bottle() {
  const a = blank(0.5);
  slide(a, 260, 560, 0.5, 0, 0.18); slide(a, 330, 700, 0.25, 0.16, 0.14);
  return finish(a);
}

export function hat() {
  const a = blank(0.9);
  ring(a, hz(55), 9, 0.45); ring(a, hz(67), 14, 0.1);
  ring(a, hz(60), 8, 0.45, 0.2); ring(a, hz(72), 14, 0.1, 0.2);
  return finish(a);
}

// a rubber squeak, through a soft filter so it's round, not shrill
export function duck() {
  const a = blank(0.45), f = resonance(160);
  let ph = 0;
  for (let i = 0; i < a.length; i++) {
    const t = i / RATE, k = t / 0.4;
    if (k > 1) break;
    const pitch = 330 + 120 * Math.sin(Math.PI * k) + 8 * Math.sin(TAU * 7 * t);
    ph += pitch / RATE;
    const buzz = (ph % 1) * 2 - 1, env = Math.sin(Math.PI * k) ** 1.5;
    a[i] = f(buzz * env, pitch * 2.2) * 0.9;
  }
  return finish(a);
}

// a floppy in a drive: two soft head knocks, a short hum, and a little two-note done
export function floppy() {
  const a = blank(1.1);
  puff(a, 0, 0.05, 0.9, 7); puff(a, 0.12, 0.05, 0.8, 8);
  for (let i = Math.round(0.2 * RATE); i < 0.62 * RATE; i++) {
    const t = i / RATE, k = (t - 0.2) / 0.42;
    a[i] += Math.sin(TAU * 110 * t) * Math.sin(Math.PI * k) * 0.12;
  }
  ring(a, hz(76), 7, 0.22, 0.66); ring(a, hz(83), 6, 0.22, 0.8);
  return finish(a);
}

// hollow wood: a low knock with a woody ring over it
export function coconut() {
  const a = blank(0.5);
  ring(a, 390, 28, 0.6); ring(a, 1040, 45, 0.18); ring(a, 620, 36, 0.2);
  ring(a, 410, 30, 0.35, 0.16); ring(a, 1090, 50, 0.1, 0.16);
  return finish(a);
}

// a little chime going up (the last find)
export function mountain() {
  const a = blank(2.2);
  [72, 76, 79, 84].forEach((m, i) => { ring(a, hz(m), 3, 0.2, i * 0.14); ring(a, hz(m) * 2, 7, 0.04, i * 0.14); });
  return finish(a, 0.15);
}

// the reef sinking: a soft low swell with a gentle chord in it
export function reef() {
  const a = blank(2.6), r = rng(3);
  let y = 0;
  for (let i = 0; i < a.length; i++) {
    const k = i / a.length;
    y += (r() * 2 - 1 - y) * 0.03;
    a[i] = y * Math.sin(Math.PI * k) * 1.4;
  }
  [55, 62, 67].forEach((m, i) => ring(a, hz(m), 1.4, 0.12, 0.3 + i * 0.2));
  return finish(a);
}

export const FIND_SOUNDS = { bottle, hat, duck, floppy, coconut, mountain };
