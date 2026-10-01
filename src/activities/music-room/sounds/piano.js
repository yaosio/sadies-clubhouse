// The toy piano, the TINKLE-TONE JR.: little metal rods struck by hammers, so a bright plink with
// a hollow ring under it, that dies away by itself. Ten white keys and seven black ones, middle C up
// to E an octave and a bit above. The third white key is out of tune (Sadie's favourite): a bit
// sharp, and it wobbles.
import { blank, ring, finish, hz } from '../../../shared/retro.js';

// the notes, left to right: white keys, then the black keys between them (and which white key each
// sits after)
export const WHITE = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76];
export const BLACK = [[61, 0], [63, 1], [66, 3], [68, 4], [70, 5], [73, 7], [75, 8]];
export const OUT_OF_TUNE = 64;   // the E: the one with the ? sticker

export function toyPiano(midi) {
  const off = midi === OUT_OF_TUNE, f = hz(midi) * (off ? 1.027 : 1), a = blank(1.5);
  ring(a, f, 2.6, 0.5);
  if (off) ring(a, f * 1.006, 2.6, 0.3);     // a second rod a hair apart: the wobble
  ring(a, f * 3.01, 6, 0.16);                // the hollow tine-y ring
  ring(a, f * 5.4, 14, 0.07);                // the plink
  return finish(a);
}
