// Brickbuster '96's sounds: every sound it makes, by name, and how loud. The sounds themselves are
// made in their own files (the glass, the machine, the poster, Sadie), with the kit in retro.js;
// player.js plays them. A new sound goes in the file it belongs with (or a new file), and gets a
// line here.
import { makePlayer, nearness } from './player.js';
import { crack, shatter, tink } from './glass.js';
import { boing, blip, tock } from './machine.js';
import { mute } from './quiet.js';
import * as sadie from './sadie.js';

export function makeSounds() {
  const p = makePlayer();
  return Object.assign(p, {
    crack: level => p.play('crack' + level, () => crack(level)),
    boing: off => p.play('boing' + Math.round(off * 2), () => boing(Math.round(off * 2) / 2), 0.8),
    blip: row => p.play('blip' + row, () => blip(row), 0.7),
    tock: () => p.play('tock', tock, 0.6),
    tink: () => p.play('tink', tink, 0.7),
    shatter: () => p.play('shatter', shatter),
    mute: () => p.play('mute', mute, 0.9),
    // Sadie (a sound makeChatter picked), `d` metres from you. Too far off to hear: nothing.
    sadie({ name, variant }, d) {
      const loud = sadie.LOUD[name] * nearness(d);
      if (loud > 0.01) p.play(`sadie-${name}${variant}`, () => sadie[name](variant), loud);
    },
  });
}
