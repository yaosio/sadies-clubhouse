// The Good Morning Machine, as plain numbers (no browser: the tests run it in Node). It's a chain of
// steps that ends with one treat in Sadie's bowl. Three of the steps are pieces that can go missing
// (GAPS); you put a part from the spare-parts box in each gap, pull the lever, and the machine runs
// until it gets to a gap with the wrong part in it (or nothing).
//
// Each time it works, Claude "improves" it: more pieces go missing (ROUNDS). After the third, Claude
// has an idea (the finale, in room.js), and from then on each run has one to three gaps at random.

// every step, in the order the machine does them
export const STEPS = ['lever', 'ramp', 'dominoes', 'seesaw', 'funnel', 'wheel', 'fan', 'boat', 'cup', 'bowl'];
// the pieces that can go missing, in order along the machine
export const GAPS = ['dominoes', 'funnel', 'fan'];
// the rest of the spare-parts box: none of it is any use
export const JUNK = ['duck', 'banana', 'sock', 'cactus', 'floppy', 'toaster', 'trophy', 'bulb', 'sandwich', 'plant'];
export const NAMES = {
  dominoes: 'DOMINOES', funnel: 'FUNNEL', fan: 'FAN',
  duck: 'RUBBER DUCK', banana: 'BANANA', sock: 'ONE SOCK', cactus: 'CACTUS', floppy: 'FLOPPY DISK',
  toaster: 'TOASTER', trophy: 'TROPHY', bulb: 'AN IDEA', sandwich: 'SANDWICH', plant: 'HOUSEPLANT',
};
// which gaps are empty in each round, before the finale
export const ROUNDS = [['dominoes'], ['dominoes', 'funnel'], ['dominoes', 'funnel', 'fan']];
export const OPTIONS = 4;   // parts to choose from in each gap: the right one and three bits of junk

// the same numbers every time from a seed
export function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function makeMachine(saved = {}, seed = Date.now()) {
  const M = { round: saved.round | 0, treats: saved.treats | 0, finale: !!saved.finale, gaps: {}, rand: rng(seed) };
  newRound(M);
  return M;
}
// what's worth keeping in the browser
export const saveOf = M => ({ round: M.round, treats: M.treats, finale: M.finale });

// empty the gaps for this round, each with its own four parts to choose from (in a jumble)
export function newRound(M) {
  const r = M.rand;
  let gone;
  if (!M.finale) gone = ROUNDS[Math.min(M.round, ROUNDS.length - 1)];
  else {
    const pick = GAPS.slice().sort(() => r() - 0.5).slice(0, 1 + Math.floor(r() * 3));
    gone = GAPS.filter(g => pick.includes(g));   // (in order along the machine)
  }
  const junk = JUNK.slice().sort(() => r() - 0.5);
  M.gaps = {};
  for (const g of GAPS) {
    if (!gone.includes(g)) { M.gaps[g] = null; continue; }   // (this one's there, and right)
    const parts = [g, ...junk.splice(0, OPTIONS - 1)].sort(() => r() - 0.5);
    M.gaps[g] = { parts, pick: -1 };                           // -1: nothing in it yet
  }
  return M;
}
export const missing = M => GAPS.filter(g => M.gaps[g]);
// what's in a gap right now: its right part if it isn't missing, else the part picked (or null)
export function partIn(M, g) { const x = M.gaps[g]; return !x ? g : x.pick < 0 ? null : x.parts[x.pick]; }
// the next part in a gap (from empty, the first)
export function swap(M, g, by = 1) {
  const x = M.gaps[g]; if (!x) return null;
  x.pick = x.pick < 0 ? (by > 0 ? 0 : OPTIONS - 1) : (x.pick + by + OPTIONS) % OPTIONS;
  return x.parts[x.pick];
}

// Pull the lever: the steps it gets through, and where it stops if it does (the gap, and what's in it)
export function run(M) {
  const steps = [];
  for (const s of STEPS) {
    if (GAPS.includes(s) && partIn(M, s) !== s) return { steps, fail: { gap: s, part: partIn(M, s) } };
    steps.push(s);
  }
  return { steps, fail: null };
}

// The treat got there. Returns what happens next: 'next' (another round, now a bit "improved"),
// 'finale' (the first time the third round works) or 'again' (after the finale: any old gaps).
export function won(M) {
  M.treats++;
  let what;
  if (M.finale) what = 'again';
  else if (M.round >= ROUNDS.length - 1) { M.finale = true; what = 'finale'; }
  else { M.round++; what = 'next'; }
  newRound(M);
  return what;
}
