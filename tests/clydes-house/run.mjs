// Clyde's house's headless checks: the Good Morning Machine's rules (machine.js), everything Clyde
// says (lines.js: it has to fit the speech bubble, in letters the mansion's font has), and every
// sound (sounds/). Run in Node, seeded, in well under a second.
//
//   node tests/clydes-house/run.mjs
import { makeMachine, missing, partIn, swap, run, won, works, saveOf, STEPS, GAPS, JUNK, NAMES, ROUNDS, OPTIONS, MOST } from '../../src/activities/clydes-house/machine.js';
import * as L from '../../src/activities/clydes-house/lines.js';
import { wrap, LINE } from '../../src/activities/clydes-house/art.js';
import { RATE } from '../../src/activities/clydes-house/sounds/synth.js';
import { ALL } from '../../src/activities/clydes-house/sounds/index.js';
import card from '../../src/activities/clydes-house/card.js';
import { REACT } from '../../src/activities/clydes-house/reactions.js';
import * as WX from '../../src/activities/clydes-house/weather.js';

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failed++;
}
const fill = (M, right = true) => { for (const g of missing(M)) { M.gaps[g].pick = right ? M.gaps[g].parts.indexOf(g) : M.gaps[g].parts.findIndex(p => p !== g); } };

// 1. the card: a house on the first plot outside the gate, not a door on the landing
check('the card puts the house on the first plot outside the gate, not on the landing', card.lot === 0 && card.slot === undefined && typeof card.room === 'function');
check('...and says what it keeps in the browser', card.keeps.every(k => k.startsWith('sadies-clubhouse.clydes-house.')));

// 2. a new machine: one gap, four parts in it (the right one and three different bits of junk), empty
{
  const M = makeMachine({}, 7);
  check('a new machine has just the dominoes missing', missing(M).join() === 'dominoes', missing(M).join());
  const x = M.gaps.dominoes;
  check(`...with ${OPTIONS} parts to choose from: the dominoes and three different bits of junk`,
    x.parts.length === OPTIONS && x.parts.includes('dominoes') && new Set(x.parts).size === OPTIONS && x.parts.filter(p => p !== 'dominoes').every(p => JUNK.includes(p)));
  check('...and nothing in the gap yet', partIn(M, 'dominoes') === null && partIn(M, 'fan') === 'fan');
  const seen = [swap(M, 'dominoes'), swap(M, 'dominoes'), swap(M, 'dominoes'), swap(M, 'dominoes'), swap(M, 'dominoes')];
  check('swapping goes through every part, then round again', seen.slice(0, 4).sort().join() === x.parts.slice().sort().join() && seen[4] === seen[0]);
  check('...and backwards too', swap(M, 'dominoes', -1) === seen[3]);
  check('a gap that isn\'t missing can\'t be swapped', swap(M, 'fan') === null && partIn(M, 'fan') === 'fan');
}

// 3. pulling the lever: it runs until the first gap with the wrong part (or nothing) in it
{
  const M = makeMachine({ round: 3 }, 3);
  let r = run(M);
  check('with every gap empty, it stops at the first (the seesaw), with nothing there', r.fail && r.fail.gap === 'seesaw' && r.fail.part === null && r.steps.join() === 'lever,ramp,dominoes', JSON.stringify(r));
  fill(M); M.gaps.funnel.pick = M.gaps.funnel.parts.findIndex(p => p !== 'funnel');
  r = run(M);
  check('with junk in the funnel\'s gap, it gets past the dominoes and the seesaw, and stops there', r.fail?.gap === 'funnel' && JUNK.includes(r.fail.part) && r.steps.at(-1) === 'seesaw', JSON.stringify(r.fail));
  fill(M); r = run(M);
  check('with every part right, it gets all the way to the bowl', !r.fail && r.steps.join() === STEPS.join());
  const D = makeMachine({ round: 2 }, 3); fill(D);
  D.gaps.boat.parts[D.gaps.boat.pick] = 'duck';
  r = run(D);
  check('the rubber duck floats: in the boat\'s gap it does the job', !r.fail && works('boat', 'duck') && !works('fan', 'duck'), JSON.stringify(r.fail));
}

// 4. each time it works, Clyde "improves" it: more gaps, then the finale, then any gaps at all
{
  const M = makeMachine({}, 11), whats = [], gaps = [];
  for (let i = 0; i < ROUNDS.length; i++) { gaps.push(missing(M).length); fill(M); whats.push(won(M)); }
  check('the first four times it works: one gap, then two, three, four', gaps.join() === '1,2,3,4', gaps.join());
  check('...Clyde improves it three times, then has the idea (the finale)', whats.join() === 'next,next,next,finale' && M.finale, whats.join());
  check('...and it\'s delivered four treats', M.treats === 4);
  check('every gap goes missing in some round before the finale', GAPS.every(g => ROUNDS.some(r => r.includes(g))));
  const after = [];
  for (let i = 0; i < 200; i++) { const n = missing(M); after.push(n.length); if (n.join() !== GAPS.filter(g => n.includes(g)).join()) after.push(99); fill(M); if (won(M) !== 'again') after.push(-1); }
  check(`after the finale: two to ${MOST} gaps each time, in order along the machine`,
    after.every(n => n >= 2 && n <= MOST) && [2, 3, 4].every(n => after.includes(n)), [...new Set(after)].join());
  check('...and there\'s always enough junk to go round', JUNK.length >= MOST * (OPTIONS - 1));
  const back = makeMachine(saveOf(M), 5);
  check('what it keeps (how far you got, the treats) comes back after a reload', back.treats === 204 && back.finale && back.round === ROUNDS.length - 1);
  const odd = makeMachine({ round: 'nonsense', treats: null }, 1);
  check('...and a broken save just starts it over', odd.round === 0 && odd.treats === 0 && missing(odd).length === 1);
}

// 5. everything Clyde says fits the bubble, in letters the mansion's font has
{
  const all = [...L.HELLO, ...L.HELLO_AGAIN, L.PEEK, ...Object.values(L.HOWTO), ...L.NEXT.flat(), ...Object.values(L.FINALE), ...L.AGAIN, ...Object.values(L.FAIL), ...L.TRY_AGAIN, ...L.DUCK, L.BUSY];
  const long = all.filter(l => wrap(l, LINE).length > 4 || wrap(l, LINE).some(w => w.length > LINE));
  check(`all ${all.length} of Clyde's lines fit the speech bubble (four lines of ${LINE} letters)`, !long.length, long[0]);
  const odd = all.filter(l => /[^A-Z0-9 .,!'()\-$:?/&*\n]/.test(l));
  check('...in letters the mansion\'s font has (no lower case, no double quotes)', !odd.length, odd[0]);
  check('Clyde has something to say about every bit of junk, and about an empty gap', JUNK.every(j => L.FAIL[j]) && L.FAIL[null]);
  check('...and a line for every round Clyde improves it', L.NEXT.length === ROUNDS.length - 1 && [1, 2, 3, 4].every(n => L.HOWTO[n]));
  check('every part\'s name fits its tag', Object.values(NAMES).every(n => n.length <= 14));
}

// 5b. every bit of junk does its own thing when the machine bumps into it
{
  const odd = JUNK.filter(j => !REACT[j] || !(REACT[j].dur > 0 && REACT[j].dur <= 2) || (REACT[j].sound && !ALL[REACT[j].sound]));
  check('every bit of junk has its own reaction, under two seconds, with a sound that exists', !odd.length, odd.join());
  const look = j => [0.1, 0.3, 0.5, 0.7, 1].map(k => Object.values(REACT[j].pose(k)).map(v => v.toFixed(2)).join()).join('|') + (REACT[j].toast ? 'toast' : '') + (REACT[j].lit ? 'lit' : '') + (REACT[j].sadie ? 'sadie' : '');
  check('...and no two do the same thing', new Set(JUNK.map(look)).size === JUNK.length);
  const far = JUNK.filter(j => [0, 0.25, 0.5, 0.75, 1].some(k => { const p = REACT[j].pose(k); return Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || p.sx <= 0 || p.sy <= 0; }));
  check('...and they all stay near their gap', !far.length, far.join());
}

// 5c. the weather machine: one weather at a time, a lever again clears it, and each has its forecast
// (the weather itself, its look and Sadie's words, is the world's: tests/clubhouse/run.mjs)
{
  check('the weather machine has four levers: rain, snow, a second sun, cats', WX.KINDS.join() === 'rain,snow,sun,cats');
  check('pulling a lever brings its weather; pulling it again clears the sky', WX.pull('clear', 'rain') === 'rain' && WX.pull('rain', 'snow') === 'snow' && WX.pull('snow', 'snow') === 'clear');
  check('...and a weather from its old save is brought in (anything odd isn\'t)', WX.loaded('cats') === 'cats' && WX.loaded('clear') === 'clear' && WX.loaded('hail') === null && WX.loaded(null) === null);
  const all = ['clear', ...WX.KINDS];
  check('every weather has a forecast', all.every(k => WX.FORECAST[k]?.length === 2));
  const words = all.flatMap(k => WX.FORECAST[k]).concat(Object.values(WX.NAMES));
  check('the forecasts fit the screen (18 letters), in letters the mansion\'s font has', all.every(k => WX.FORECAST[k].every(l => l.length <= 18)) && words.every(l => !/[^A-Z0-9 .,!'()\-$:?/&*]/.test(l)), words.find(l => l.length > 18));
  check('every weather has its own soft jingle', all.every(k => ALL[k + 'In']));
}

// 6. every sound: soft, short, 8-bit, fading right down to nothing, no click (the owner can't
// stand harsh, droning or repetitive noise)
for (const [name, make] of Object.entries(ALL)) {
  const a = make();
  let peak = 0; for (const v of a) peak = Math.max(peak, Math.abs(v));
  const most = name === 'chime' || name.endsWith('In') ? 2 : 1;   // (the chime, and the weather's jingles)
  check(`the ${name}: 8-bit, soft (never over half volume, not silent), under ${most} s, fading to nothing, no click`,
    a.every(v => Math.abs(Math.round(v * 127) - v * 127) < 1e-3) && peak > 0.08 && peak <= 0.5 && a.length <= most * RATE &&
    a.slice(-5).every(v => Math.abs(v) < 0.02) && Math.abs(a[0]) < 0.05, `peak ${peak.toFixed(2)}, ${(a.length / RATE).toFixed(2)} s`);
}

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
