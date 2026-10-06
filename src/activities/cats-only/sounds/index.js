// Cats Only's sounds, by name. The sounds themselves are in meow.js; the clubhouse's sound system
// (src/shared/sound.js) plays them through the room's handle. The herd's meows are voices that fade
// with how far off they are; there is nothing else here and nothing loops.
import { RATE } from '../../../shared/retro.js';
import { wrap } from '../../../shared/sound.js';
import { meow, press, LOUD } from './meow.js';

export function makeSounds(h) {
  const play = (key, make, loud, more) => h.play(key, make, { loud, rate: RATE, ...more });
  return wrap(h, {
    // one of the herd's meows (version `variant`), `at` where that cat is (or `dist`, how far off, when it's heard from another place)
    meow: (variant, at, dist) => play('meow' + variant, () => meow(variant), LOUD.meow, { bus: 'voices', at, dist }),
    press: () => play('press', press, LOUD.press, { gap: 0.4 }),
  });
}
