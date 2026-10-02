// Brickbuster's own ending for its sounds, harder than the toolbox's gentle one (src/shared/retro.js).
import { RATE } from '../../../shared/retro.js';

// the arcade version: a slapback echo, a hard limit, 8 bits
export function crunch(a, echo = 0.3, delay = 0.085) {
  const d = Math.round(delay * RATE);
  if (echo) for (let i = a.length - 1; i >= d; i--) a[i] += a[i - d] * echo;
  for (let i = 0; i < a.length; i++) {
    const v = Math.tanh(a[i] * 1.3);
    a[i] = Math.round(v * 127) / 127;
  }
  return a;
}
