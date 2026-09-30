// Claude's house's headless checks: the Good Morning Machine's rules (machine.js), everything Claude
// says (lines.js: it has to fit the speech bubble, in letters the mansion's font has), and the one
// sound (sounds/chime.js). Run in Node, seeded, in well under a second.
//
//   node tests/claudes-house/run.mjs
import { makeMachine, newRound, missing, partIn, swap, run, won, saveOf, STEPS, GAPS, JUNK, NAMES, ROUNDS, OPTIONS } from '../../src/activities/claudes-house/machine.js';
import * as L from '../../src/activities/claudes-house/lines.js';
import { wrap, LINE } from '../../src/activities/claudes-house/art.js';
import { chime, RATE } from '../../src/activities/claudes-house/sounds/chime.js';
import card from '../../src/activities/claudes-house/card.js';

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failed++;
}
const fill = (M, right = true) => { for (const g of missing(M)) { M.gaps[g].pick = right ? M.gaps[g].parts.indexOf(g) : M.gaps[g].parts.findIndex(p => p !== g); } };

// 1. the card: a house on the first plot outside the gate, not a door on the landing
check('the card puts the house on the first plot outside the gate, not on the landing', card.lot === 0 && card.slot === undefined && typeof card.room === 'function');
check('...and says what it keeps in the browser', card.keeps.every(k => k.startsWith('sadies-clubhouse.claudes-house.')));

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
  const M = makeMachine({ round: 2 }, 3);
  let r = run(M);
  check('with every gap empty, it stops at the dominoes, with nothing there', r.fail && r.fail.gap === 'dominoes' && r.fail.part === null && r.steps.join() === 'lever,ramp', JSON.stringify(r));
  fill(M); M.gaps.funnel.pick = M.gaps.funnel.parts.findIndex(p => p !== 'funnel');
  r = run(M);
  check('with junk in the funnel\'s gap, it gets past the dominoes and the seesaw, and stops there', r.fail?.gap === 'funnel' && JUNK.includes(r.fail.part) && r.steps.at(-1) === 'seesaw', JSON.stringify(r.fail));
  fill(M); r = run(M);
  check('with every part right, it gets all the way to the bowl', !r.fail && r.steps.join() === STEPS.join());
}

// 4. each time it works, Claude "improves" it: more gaps, then the finale, then any gaps at all
{
  const M = makeMachine({}, 11), whats = [], gaps = [];
  for (let i = 0; i < 3; i++) { gaps.push(missing(M).length); fill(M); whats.push(won(M)); }
  check('the first three times it works: one gap, then two, then three', gaps.join() === '1,2,3', gaps.join());
  check('...Claude improves it twice, then has the idea (the finale)', whats.join() === 'next,next,finale' && M.finale, whats.join());
  check('...and it\'s delivered three treats', M.treats === 3);
  const after = [];
  for (let i = 0; i < 200; i++) { const n = missing(M); after.push(n.length); if (n.join() !== GAPS.filter(g => n.includes(g)).join()) after.push(99); fill(M); if (won(M) !== 'again') after.push(-1); }
  check('after the finale: one to three gaps each time, all of them sometimes, in order along the machine',
    after.every(n => n >= 1 && n <= 3) && [1, 2, 3].every(n => after.includes(n)), [...new Set(after)].join());
  const back = makeMachine(saveOf(M), 5);
  check('what it keeps (how far you got, the treats) comes back after a reload', back.treats === 203 && back.finale && back.round === ROUNDS.length - 1);
  const odd = makeMachine({ round: 'nonsense', treats: null }, 1);
  check('...and a broken save just starts it over', odd.round === 0 && odd.treats === 0 && missing(odd).length === 1);
}

// 5. everything Claude says fits the bubble, in letters the mansion's font has
{
  const all = [...L.HELLO, ...L.HELLO_AGAIN, L.PEEK, ...Object.values(L.HOWTO), ...L.NEXT.flat(), ...Object.values(L.FINALE), ...L.AGAIN, ...Object.values(L.FAIL), ...L.TRY_AGAIN, L.BUSY];
  const long = all.filter(l => wrap(l, LINE).length > 4 || wrap(l, LINE).some(w => w.length > LINE));
  check(`all ${all.length} of Claude's lines fit the speech bubble (four lines of ${LINE} letters)`, !long.length, long[0]);
  const odd = all.filter(l => /[^A-Z0-9 .,!'()\-$:?/&*\n]/.test(l));
  check('...in letters the mansion\'s font has (no lower case, no double quotes)', !odd.length, odd[0]);
  check('Claude has something to say about every bit of junk, and about an empty gap', JUNK.every(j => L.FAIL[j]) && L.FAIL[null]);
  check('...and a line for every round Claude improves it', L.NEXT.length === ROUNDS.length - 1 && [1, 2, 3].every(n => L.HOWTO[n]));
  check('every part\'s name fits its tag', Object.values(NAMES).every(n => n.length <= 14));
}

// 6. the one sound: soft, short, 8-bit, fading right down to nothing, no click
{
  const a = chime();
  let peak = 0; for (const v of a) peak = Math.max(peak, Math.abs(v));
  check('the chime is 8-bit', a.every(v => Math.abs(Math.round(v * 127) - v * 127) < 1e-3));
  check('...soft (never over half volume), and not silent', peak > 0.1 && peak <= 0.5, peak.toFixed(2));
  check('...under two seconds, fading right down to nothing, with no click at the start', a.length <= 2 * RATE && a.slice(-20).every(v => v === 0) && Math.abs(a[0]) < 0.05);
}

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
