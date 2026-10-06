// Cats Only's sounds, by name. The sounds themselves are in meow.js; the clubhouse's sound system
// (src/shared/sound.js) plays them through the room's handle. The herd's meows are voices that fade
// with how far off they are; nothing here loops.
import { wrap } from '../../../shared/sound.js';
import { meow, press, pile, PITCHES, LOUD, SR } from './meow.js';
import { RATE } from '../../../shared/retro.js';

export { warmSteps } from './meow.js';

export function makeSounds(h) {
  const play = (key, make, loud, more) => h.play(key, make, { loud, rate: RATE, ...more });
  return wrap(h, {
    // one of the herd's meows (kind `type`, at one of the PITCHES), `at` where that cat is (or `dist`, how far off, when it's heard from another place)
    meow: (type, pitch, at, dist, ver = 0) => play('meow' + type + '.' + pitch + '.' + ver, () => meow(type, ver), LOUD.meow, { bus: 'voices', at, dist, rate: SR * PITCHES[pitch % PITCHES.length], gap: 0.02 }),
    press: () => play('press', press, LOUD.press, { gap: 0.4 }),
    // the whole herd piling out of the little room (`at` where, or `dist` how far off)
    pile: (at, dist) => play('pile', pile, LOUD.pile, { at, dist, gap: 2 }),
  });
}
