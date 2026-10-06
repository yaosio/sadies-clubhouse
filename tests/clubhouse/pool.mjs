// The pool's fatal-error checks (src/clubhouse/pool/, run from tests/clubhouse/run.mjs): nothing ever
// leaves the fenced pool area or ends up in the water by accident, you can't get stuck walking round it
// (or on the diving board), the ball can always be got back, Chooter goes crazy on every arrival and
// then stops, and Marbles never keeps the ball for good. The sim has no drawing, so ten minutes of
// it run in a moment. (How it looks and sounds isn't checked: docs/clubhouse/decisions/fatal-only.md.)
import { makePoolSim } from '../../src/clubhouse/pool/sim.js';
import { DECK, POOL, COPING, RECTS, inRect, inWater } from '../../src/clubhouse/pool/layout.js';
import { EXCITED } from '../../src/clubhouse/pool/dog.js';

const DT = 1 / 30;
const IN = [DECK.x0, DECK.x1, DECK.z0, DECK.z1];

export function checkPool(check) {
  // ---- ten minutes with you coming and going, and kicking the ball about ----
  const seen = { modes: new Set(), tricks: new Set(), splashes: 0, arrivals: 0, crazyStarts: 0, crazyLongest: 0, heldLongest: 0, loose: 0 };
  let bad = '', wetByAccident = 0;
  const sim = makePoolSim((type) => { if (type === 'splash') seen.splashes++; });
  let prevMode = '', crazyFor = 0, held = 0, here = false;
  for (let i = 0, t = 0; t < 600; i++, t += DT) {
    const phase = t % 120, you = phase < 60 ? { x: 0, z: 19 + Math.sin(t) * 4 } : null;   // a minute at the pool, a minute away
    if (!here && you) { seen.arrivals++; here = true; } else if (!you) here = false;
    if (i % 90 === 0 && you) sim.kick(you.x, you.z, 0);   // (a kick every few seconds: the ball goes anywhere)
    if (i === 3000) { sim.ball.x = 0; sim.ball.z = 22.7; sim.ball.y = 0.5; sim.ball.vx = sim.ball.vz = 0; }   // dropped in the middle of the pool
    sim.step(DT, you);
    const { ball: b, chooter: c, marbles: m } = sim;
    for (const [who, p] of [['ball', b], ['Chooter', c], ['Marbles', m]]) {
      if (!Number.isFinite(p.x + p.z + (p.y || 0))) bad ||= `${who} went missing at ${t.toFixed(0)} s`;
      if (!inRect(p.x, p.z, IN) && !bad) bad = `${who} left the pool area (${p.x.toFixed(1)}, ${p.z.toFixed(1)}) at ${t.toFixed(0)} s`;
    }
    if (inWater(c.x, c.z, -0.3) && !['swim', 'air', 'board', 'hopout'].includes(c.mode)) wetByAccident++;
    if (inRect(m.x, m.z, [COPING.x0 + 0.2, COPING.x1 - 0.2, COPING.z0 + 0.2, COPING.z1 - 0.2])) wetByAccident++;
    seen.modes.add(c.mode);
    if (m.plan && m.mode !== 'rest') seen.tricks.add(m.plan.kind);
    if (c.mode === 'crazy' && prevMode !== 'crazy') { seen.crazyStarts++; crazyFor = 0; }
    if (c.mode === 'crazy') { crazyFor += DT; seen.crazyLongest = Math.max(seen.crazyLongest, crazyFor); }
    prevMode = c.mode;
    held = b.held ? held + DT : 0; seen.heldLongest = Math.max(seen.heldLongest, held);
    if (!b.held) seen.loose += DT;
  }
  check('the beach ball, Chooter and Marbles never leave the fenced pool area or go missing (ten minutes of kicking and visiting)', !bad, bad);
  check('Chooter and Marbles never end up in the water by accident (only Chooter\'s dive and swim)', wetByAccident === 0, `${wetByAccident} steps`);
  check('Chooter runs, dives off the board, swims and climbs out, again and again', ['lap', 'board', 'air', 'swim', 'hopout'].every(k => seen.modes.has(k)) && seen.splashes >= 8, `${seen.splashes} splashes in ten minutes`);
  check('Chooter goes crazy at every arrival and gets bored in about 15 seconds', seen.crazyStarts >= seen.arrivals && seen.crazyLongest <= EXCITED + 4, `${seen.crazyStarts} crazy spells for ${seen.arrivals} arrivals, longest ${seen.crazyLongest.toFixed(1)} s`);
  check('Marbles tries all four ways of annoying Sadie', ['splash', 'ball', 'squirt', 'bucket'].every(k => seen.tricks.has(k)), [...seen.tricks].join(', '));
  check('the ball is never held for good (Marbles lets go), and it\'s on the deck or the water most of the time', seen.heldLongest < 25 && seen.loose > 400, `held at most ${seen.heldLongest.toFixed(0)} s`);
  check('a ball left in the middle of the pool drifts to an edge, where you can reach it', (() => {
    const s = makePoolSim(); s.marbles.timer = 1e9;
    s.ball.x = 0; s.ball.z = 22.7; s.ball.y = 0.5;
    for (let t = 0; t < 40; t += DT) s.step(DT, null);
    const b = s.ball, edge = Math.min(b.x - POOL.x0, POOL.x1 - b.x, b.z - POOL.z0, POOL.z1 - b.z);
    return edge < 0.5;
  })());

  // ---- you can't get stuck ----
  // every spot on the deck you could stand (0.35 m round, like the clubhouse's walking) joins up with
  // the way in at the gate: no pocket to be shut in, and the water and the board's edge are out of bounds
  const P = 0.35, STEP = 0.1, x0 = -9, z0 = 12, W = Math.round(18 / STEP), H = Math.round(18.2 / STEP);
  const rects = [...RECTS, [-29.05, 29.05, 29.95, 30.05], [-8.2, -2.6, 10, 11], [2.6, 8.2, 10, 11]];   // (and the yard's fence and the back wall)
  const free = (i, j) => { const x = x0 + i * STEP, z = z0 + j * STEP; return !rects.some(r => inRect(x, z, r, P)); };
  const seenCells = new Set(), todo = [[Math.round((0 - x0) / STEP), Math.round((13.5 - z0) / STEP)]];
  while (todo.length) {
    const [i, j] = todo.pop(), k = i * 1000 + j;
    if (i < 0 || j < 0 || i >= W || j >= H || seenCells.has(k) || !free(i, j)) continue;
    seenCells.add(k); todo.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);
  }
  let pockets = 0, total = 0;
  for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) { const x = x0 + i * STEP, z = z0 + j * STEP; if (inRect(x, z, IN) && free(i, j)) { total++; if (!seenCells.has(i * 1000 + j)) pockets++; } }
  check('every standing spot on the pool deck joins the gate: nowhere to get shut in', total > 2000 && pockets === 0, `${pockets} cut off of ${total}`);
  check('the water, its edge and the diving board are solid for you, so you can\'t walk in', [[0, 22.7], [3.8, 22.7], [0, 25.3], [0, 25], [0, 26]].every(([x, z]) => rects.some(r => inRect(x, z, r))));
  const gate = [[0, 16.5], [0.8, 16.5], [-0.8, 16.5]];
  check('the gate in the front fence is wide enough to walk through', gate.every(([x, z]) => free(Math.round((x - x0) / STEP), Math.round((z - z0) / STEP))));
}
