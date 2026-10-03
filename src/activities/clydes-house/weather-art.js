// The weather machine's pictures, drawn on little canvases when the clubhouse opens: the machine's
// enamel and its signs, a plate under each lever, the forecast screen (drawn again as the weather
// changes), and the puff out of its funnel. (The weather's own pictures are the world's: src/clubhouse/weather/.)
import { NAMES, FORECAST } from './weather.js';
import { rect, dith, disc, signs } from './art.js';

// the machine's own colours: mint enamel, brass, and Clyde's terracotta
export const W = { mint: '#6ee0c0', mint2: '#3aa88a', mint3: '#1e6a58', brass: '#ffd23a', brass2: '#c89018', edge: '#5a2414', body: '#d97757' };
// each lever's knob
export const KNOB = { rain: 0x2a78e8, snow: 0xffffff, sun: 0xffd23a, cats: 0xff8ec8 };

export function drawWeatherArt({ tex, words, C }) {
  const A = {};
  A.enamel = tex(16, 16, g => {
    rect(g, W.mint, 0, 0, 16, 16); dith(g, W.mint, W.mint2, 0, 10, 16, 6, 0.3);
    rect(g, W.mint3, 0, 15, 16, 1); rect(g, '#b8fff0', 0, 0, 16, 1);
    for (const x of [2, 13]) { rect(g, W.brass2, x, 2); rect(g, W.brass2, x, 12); rect(g, W.brass, x, 1); }
  });
  const board = signs({ tex, words, C }, W.edge, W.body, C.cream);
  A.title = board(100, 32, [["CLYDE'S", 1, W.edge], ['WEATHER MACHINE', 1, C.ink], ['MORE WEATHER IN THE', 1, W.mint3], ['FULL VERSION!', 1, W.mint3]], C.yellow);
  A.note = board(64, 30, [['PLEASE DO NOT', 1, C.ink], ['PULL THE LEVERS.', 1, C.ink], ['(THAT WAS A JOKE.', 1, W.edge], ['PLEASE DO.)', 1, W.edge]]);

  // the plate under each lever: a little picture of its weather, and its name
  const icon = {
    rain: g => { disc(g, C.grey, 7, 3, 3); disc(g, C.grey, 11, 3, 2); rect(g, C.tarp, 6, 7); rect(g, C.tarp, 9, 8); rect(g, C.tarp, 12, 7); },
    snow: g => { for (const [x, y] of [[6, 2], [11, 4], [8, 7]]) { rect(g, C.white, x - 1, y, 3, 1); rect(g, C.white, x, y - 1, 1, 3); } },
    sun: g => { disc(g, C.gold, 6, 5, 3); disc(g, C.gold, 12, 4, 2); rect(g, C.yellow, 5, 4); rect(g, C.yellow, 11, 3); },
    cats: g => { rect(g, C.pink, 6, 3, 6, 5); rect(g, C.pink, 6, 2); rect(g, C.pink, 11, 2); rect(g, C.ink, 7, 4); rect(g, C.ink, 10, 4); rect(g, C.ink, 8, 6, 2, 1); },
  };
  A.plate = {};
  for (const k of Object.keys(icon)) A.plate[k] = tex(32, 20, g => {
    rect(g, W.brass2, 0, 0, 32, 20); rect(g, W.brass, 1, 1, 30, 18); rect(g, C.ink, 7, 1, 18, 10);
    g.save(); g.translate(7, 1); icon[k](g); g.restore();
    words(g, NAMES[k], 16, 13, 1, C.ink, { align: 'center' });
  });

  // the forecast screen: green letters on black, drawn again when the weather changes
  A.screen = tex(76, 18, () => {});
  A.forecast = w => {
    const g = A.screen.image.getContext('2d');
    rect(g, C.ink, 0, 0, 76, 18); rect(g, '#062a18', 1, 1, 74, 16);
    FORECAST[w].forEach((l, i) => words(g, l, 38, 2 + i * 8, 1, i ? '#40c060' : '#80ff90', { align: 'center' }));
    A.screen.needsUpdate = true;
  };

  // a puff out of the machine's funnel
  A.puff = tex(16, 12, g => { disc(g, '#b8b8d0', 5, 7, 4); disc(g, '#b8b8d0', 10, 6, 5); disc(g, C.white, 5, 6, 3); disc(g, C.white, 10, 5, 4); });
  return A;
}
