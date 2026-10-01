// The aquarium's sounds, all out in the ocean: every sound it makes, by name, and how loud. The
// sounds themselves are made in their own files (the finds, the sea), with the kit in retro.js;
// the clubhouse's sound system (src/shared/sound.js) plays them, through the room's handle. A new sound goes in the file it belongs with (or a new file), and gets a line
// here and in LIST (the test version's sound tester plays through LIST).
import { RATE } from '../../../shared/retro.js';
import { FIND_SOUNDS, reef } from './finds.js';
import { wave, sail } from './sea.js';

export const LOUD = { find: 0.55, reef: 0.45, wave: 0.3, sail: 0.25 };

// every sound, for the sound tester: its name on the sign, and how to play it
export const LIST = [
  ...Object.keys(FIND_SOUNDS).map(k => [k.toUpperCase(), s => s.find(k)]),
  ['REEF SINKING', s => s.reef()],
  ...[0, 1, 2].map(v => [`WAVE ${v + 1}`, s => s.sea({ name: 'wave', variant: v })]),
  ['SAIL', s => s.sea({ name: 'sail', variant: 0 })],
];

// `h`: the room's handle (soundsFor). 11 kHz samples, each held 4 times over (its crunch), at half volume.
export function makeSounds(h) {
  const play = (key, make, loud) => h.play(key, make, { loud: loud * 0.5, rate: RATE, hold: 4 });
  return Object.assign(h, {
    find: name => play('find-' + name, FIND_SOUNDS[name], LOUD.find),
    reef: () => play('reef', reef, LOUD.reef),
    sea: ({ name, variant }) => play(`${name}${variant}`, () => (name === 'wave' ? wave(variant) : sail()), LOUD[name]),
  });
}
