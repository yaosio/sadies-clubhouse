// The music room's sounds: every instrument, by name, and how loud. The sounds themselves are made
// in their own files (one per instrument), with the kit in retro.js; player.js plays them through
// the volume dial, on the clubhouse's sound system (src/shared/sound.js). A new instrument gets its own file and a line here.
import { makePlayer } from './player.js';
import { toyPiano } from './piano.js';
import { bar } from './xylophone.js';
import { drum } from './drums.js';
import { synthNote } from './synth.js';
import { chime } from './chimes.js';

export const LOUD = { piano: 0.8, xylophone: 0.7, drums: 0.8, synth: 0.6, chimes: 0.35, theremin: 0.3 };

export function makeSounds(h, volume) {
  const p = makePlayer(h, volume);
  return Object.assign(p, {
    // `loud` (0 to 1) on top: Sadie's paws are softer than your fingers
    piano: (midi, loud = 1) => p.play('piano' + midi, () => toyPiano(midi), LOUD.piano * loud),
    xylophone: (midi, loud = 1) => p.play('xylo' + midi, () => bar(midi), LOUD.xylophone * loud),
    drums: (name, loud = 1) => p.play('drum-' + name, () => drum(name), LOUD.drums * loud),
    synth: (voice, midi, loud = 1) => p.play(`synth-${voice}${midi}`, () => synthNote(voice, midi), LOUD.synth * loud),
    chimes: (i, loud = 1) => p.play('chime' + i, () => chime(i), LOUD.chimes * loud),
  });
}
