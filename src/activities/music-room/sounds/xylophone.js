// The xylophone, its bars shaped like fish: a warm wooden tok with a ring, gone in under a second.
// Eight bars, a scale from C an octave above middle C.
import { blank, ring, finish, hz } from './retro.js';

export const BARS = [72, 74, 76, 77, 79, 81, 83, 84];

export function bar(midi) {
  const f = hz(midi), a = blank(0.9);
  ring(a, f, 6, 0.55);
  ring(a, f * 3.93, 18, 0.14);
  ring(a, f * 9.2, 40, 0.04);
  return finish(a, 0.1);
}
