// The aquarium's sounds, all out in the ocean: every sound it makes, by name, and how loud. The
// sounds themselves are made in their own files (the finds, the sea), with the kit in retro.js;
// player.js plays them. A new sound goes in the file it belongs with (or a new file), and gets a line
// here and in LIST (the test version's sound tester plays through LIST).
import { makePlayer } from './player.js';
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

export function makeSounds() {
  const p = makePlayer();
  return Object.assign(p, {
    find: name => p.play('find-' + name, FIND_SOUNDS[name], LOUD.find),
    reef: () => p.play('reef', reef, LOUD.reef),
    sea: ({ name, variant }) => p.play(`${name}${variant}`, () => (name === 'wave' ? wave(variant) : sail()), LOUD[name]),
  });
}
