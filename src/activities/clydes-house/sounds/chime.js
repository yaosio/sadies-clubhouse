// When the treat lands in Sadie's bowl: a soft music-box "ding-ding" (two notes going up). It plays
// once per breakfast and never repeats, rings for under two seconds and fades right down to nothing
// (RULEBOOK.md section 4). Plain numbers, no browser: 8-bit, 11 kHz.
import { RATE, TAU, hz } from '../../../shared/retro.js';
export { RATE };

export const NOTES = [76, 83];   // E and the B above it
export function chime() {
  const a = new Float32Array(Math.round(1.6 * RATE));
  NOTES.forEach((n, k) => {
    const s0 = Math.round(k * 0.16 * RATE), f = hz(n);
    for (let i = 0; s0 + i < a.length; i++) {
      const t = i / RATE, e = Math.exp(-t * 3.2) * Math.min(1, t / 0.006);   // (6 ms to come in: no click)
      a[s0 + i] += (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * f * 3 * t) * Math.exp(-t * 6)) * e * 0.28;
    }
  });
  const fade = Math.round(0.3 * RATE);
  for (let i = 0; i < a.length; i++) {
    let v = Math.tanh(a[i]);
    if (i > a.length - fade) v *= (a.length - i) / fade;
    a[i] = Math.round(v * 127) / 127;
  }
  return a;
}
