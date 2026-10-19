// The speed readout's fatal-error checks (src/clubhouse/meter.js, run from tests/clubhouse/run.mjs): it
// works out frames a second and the slowest place from fake frames, ignores a page that was in the
// background, never calls a place with a handful of frames the slowest, and can be cleared. No
// drawing. (What the numbers mean for a phone isn't checked: docs/clubhouse/checks/fatal-only.md.)
import { makeMeter } from '../../src/clubhouse/meter.js';
import { makeLive } from '../../src/clubhouse/overlay.js';

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

  // the live stats strip's sums (src/clubhouse/overlay.js)
  const l = makeLive(), frame = (gap, o = {}) => l.add({ gap, work: 3, draw: 2, calls: 100, main: 80, tris: 5000, doors: 1, place: 'room:cats-only', built: 4, ...o });
  check('the strip says it is measuring before any frame', /MEASURING/.test(l.strip()));
  for (let i = 0; i < 60; i++) frame(6.9);   // (about a 144 Hz screen)
  check("the screen's own frame length comes from the quick frames, not a fixed 16.7 ms", Math.abs(l.guide() - 6.9) < 0.01, String(l.guide()));
  l.place('room:cats-only', 90); frame(6.9);
  l.refresh({ heap: 30e6, heapMax: 40e6, rooms: 4, slots: 14, ticking: 6, shapes: 100, pictures: 20 });
  check('the strip is one line: frames a second, work, calls, doorways, place', /^145 FPS · 3\.0 MS WORK · 100 CALLS · 1 DOORS · CATS ONLY$/.test(l.strip()), l.strip());
  const rows = Object.fromEntries(l.rows());
  check('the list splits calls into the room and the doorways, and names the slowest update', /80 ROOM, 20 DOORWAYS/.test(rows['DRAW CALLS']) && /CATS ONLY 1\.5/.test(rows['SLOWEST UPDATES']), JSON.stringify(rows));
  check('...and has no hitch yet', rows['LAST HITCH'] === 'NONE YET');
  frame(120, { built: 5 });
  l.refresh();
  check('a frame over 50 ms is kept as the last hitch, noting a room was built that frame', /120 MS IN CATS ONLY.*A ROOM WAS BUILT/.test(Object.fromEntries(l.rows())['LAST HITCH']), JSON.stringify(Object.fromEntries(l.rows())));
  l.clear();
  check('clearing it starts the strip over', /MEASURING/.test(l.strip()) && l.gaps().length === 0);
}
