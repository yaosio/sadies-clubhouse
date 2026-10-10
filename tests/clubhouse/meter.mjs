// The speed readout's fatal-error checks (src/clubhouse/meter.js, run from tests/clubhouse/run.mjs): it
// works out frames a second and the slowest place from fake frames, ignores a page that was in the
// background, never calls a place with a handful of frames the slowest, and can be cleared. No
// drawing. (What the numbers mean for a phone isn't checked: docs/clubhouse/checks/fatal-only.md.)
import { makeMeter } from '../../src/clubhouse/meter.js';

export function checkMeter(check) {
  const m = makeMeter();
  check('with nothing written down it says so instead of numbers', /NOTHING YET/.test(m.report('outside')[0]));
  for (let i = 0; i < 5; i++) m.frame('room:aquarium', 200, 50);   // (too few frames to call it the slowest)
  for (let i = 0; i < 100; i++) m.frame('room:cats-only', 40, 8);
  for (let i = 0; i < 200; i++) m.frame('outside', 16.7, 1);
  m.frame('outside', 5000, 1); m.frame('outside', 0, 1); m.frame('outside', NaN, 1);   // (background tab, nonsense)
  const text = m.report('outside', ['GRAPHICS: A CARD']).join('\n');
  check('it reports frames a second right now from the last 120 frames', /RIGHT NOW: 60 FRAMES A SECOND/.test(text), text);
  check('...names the slowest place in words, from places with enough frames', /SLOWEST PLACE: CATS ONLY, 25 A SECOND, WORST FRAME 40 MS/.test(text) && !/AQUARIUM/.test(text), text);
  check('...says how this place is doing, and a frame over 2 seconds is left out', /HERE \(OUTSIDE\): 60 A SECOND ON AVERAGE, 0% OF FRAMES SLOW/.test(text) && /OVER 305 FRAMES/.test(text), text);
  check('...and carries on what the page adds', /GRAPHICS: A CARD/.test(text));
  m.note('heap', 30e6); m.note('heap', 52e6); m.note('heap', 41e6);
  check('it remembers the highest the page memory has been', m.peak('heap') === 52e6);
  m.clear();
  check('...and clearing forgets it', m.peak('heap') === 0);
  check('clearing starts it over', /NOTHING YET/.test(m.report('outside')[0]));
}
