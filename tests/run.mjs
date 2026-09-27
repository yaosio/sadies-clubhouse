// Headless checks for the simulation. Runs the real game code in Node, no browser needed:
//
//   node tests/run.mjs
//
// The simulation (src/core) never touches the screen, which is what makes this possible.
// Random numbers are seeded so every run is the same.
let seed = 20260926;
Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const { U, W, DEFAULTS, physParams } = await import('../src/config.js');
const { SHAPES } = await import('../src/core/physics/pieceTypes.js');
const { makePiece } = await import('../src/core/physics/body.js');
const { physicsStep } = await import('../src/core/physics/solver.js');
const { world } = await import('../src/core/world.js');
const { resetGame, update } = await import('../src/core/game.js');
const { groundAt } = await import('../src/core/surface.js');
const { sendHeldTo } = await import('../src/core/dropper.js');
const { sadie } = await import('../src/core/sadie/brain.js');
const { HAY_OUT, STEP_MIN, STEP_MAX } = await import('../src/core/hay.js');
const { REACH } = await import('../src/core/sadie/brain.js');
const { computeSurface, surfAt } = await import('../src/core/surface.js');
const { updateFossils, FOSSIL_DEPTH } = await import('../src/core/fossil.js');

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failed++;
}

function penetration(pieces) { // deepest any boundary point sits inside another piece, in px
  let worst = 0;
  for (const A of pieces) for (const B of pieces) {
    if (A === B) continue;
    for (const i of A.T.bnd) {
      const X = A.x[i], Y = A.y[i];
      if (X < B.minX || X > B.maxX || Y < B.minY || Y > B.maxY) continue;
      const poly = B.T.bnd, m = poly.length; let inside = false;
      for (let q = 0, j = m - 1; q < m; j = q++) {
        const yi = B.y[poly[q]], yj = B.y[poly[j]];
        if ((yi > Y) !== (yj > Y) && X < (B.x[poly[j]] - B.x[poly[q]]) * (Y - yi) / (yj - yi) + B.x[poly[q]]) inside = !inside;
      }
      if (!inside) continue;
      let best = Infinity;
      for (let q = 0; q < m; q++) {
        const a = poly[q], b = poly[(q + 1) % m], ax = B.x[a], ay = B.y[a], ex = B.x[b] - ax, ey = B.y[b] - ay;
        const t = Math.max(0, Math.min(1, ((X - ax) * ex + (Y - ay) * ey) / (ex * ex + ey * ey)));
        best = Math.min(best, Math.hypot(ax + ex * t - X, ay + ey * t - Y));
      }
      worst = Math.max(worst, best);
    }
  }
  return worst;
}
const hasNaN = pieces => pieces.some(p => { for (let i = 0; i < p.n; i++) if (!isFinite(p.x[i]) || !isFinite(p.y[i])) return true; return false; });
const P = physParams({ ...DEFAULTS });

// 1. A big mixed pile stays stable
{
  const types = Object.keys(SHAPES), pieces = [];
  for (let k = 0; k < 150; k++) {
    const x = W * 0.35 + Math.random() * W * 0.3;
    let top = 0; for (const p of pieces) if (p.maxX > x - 3 * U && p.minX < x + 3 * U) top = Math.max(top, p.maxY);
    pieces.push(makePiece(types[k % types.length], U, x, top + 3.5 * U, (k % 4) * Math.PI / 2));
    for (let f = 0; f < 60; f++) physicsStep(pieces, P, 1 / 60);
  }
  for (let f = 0; f < 300; f++) physicsStep(pieces, P, 1 / 60);
  const pen = penetration(pieces), asleep = pieces.filter(p => p.asleep).length;
  check('150-piece mixed pile has no broken numbers', !hasNaN(pieces));
  check('pieces barely overlap', pen < 2.5, `deepest overlap ${pen.toFixed(2)} px, limit 2.5`);
  check('the pile settles and sleeps', asleep > 120, `${asleep}/150 asleep`);
}

// 2. The bouncy ball bounces like it used to
{
  const pcs = [makePiece('ball', U, W / 2, 6 * U, 0)]; const peaks = []; let prev = 0;
  for (let f = 0; f < 400; f++) { physicsStep(pcs, P, 1 / 60); const v = pcs[0].y[0] - pcs[0].py[0]; if (prev > 0 && v <= 0) peaks.push(pcs[0].y[0] / U); prev = v; }
  check('ball dropped from 6 blocks bounces to about 3.4', peaks[0] > 3.0 && peaks[0] < 3.8, `first bounce ${peaks[0]?.toFixed(2)}`);
  check('its bounces shrink', peaks[1] < peaks[0] && peaks[2] < peaks[1], peaks.slice(0, 3).map(v => v.toFixed(2)).join(', '));
}

// 3. Pieces dropped on one spot make a mound (not a flat layer, not a spire)
{
  const types = Object.keys(SHAPES), pieces = [], cx = W / 2;
  for (let k = 0; k < 70; k++) {
    let top = 0; for (const p of pieces) if (p.maxX > cx - 2 * U && p.minX < cx + 2 * U) top = Math.max(top, p.maxY);
    pieces.push(makePiece(types[Math.floor(Math.random() * 7)], U, cx + (Math.random() - 0.5) * U, top + 3.5 * U, Math.floor(Math.random() * 4) * Math.PI / 2));
    for (let f = 0; f < 50; f++) physicsStep(pieces, P, 1 / 60);
  }
  for (let f = 0; f < 600; f++) physicsStep(pieces, P, 1 / 60);
  const peak = Math.max(...pieces.map(p => p.maxY)) / U;
  check('70 pieces on one spot form a mound', peak > 8 && peak < 17, `peak ${peak.toFixed(1)} blocks, expected about 12`);
}

// 4. Two minutes of real play: Sadie, the dropper, stars, all together
{
  resetGame();
  let maxRise = 0, sunkFrames = 0, longestSunk = 0, hayBelowStart = 0, prevY = sadie.y;
  let lastMeal = 0, longestWait = 0, eaten = 0, badGap = 0, hayOut = true, inReach = 0;
  const seen = new Set(), placed = [];
  const noteHay = () => { for (const h of world.hay) if (!seen.has(h)) { seen.add(h); placed.push(h.x); if (h.y0 - surfAt(h.x) <= REACH) inReach++; } };
  noteHay();
  const dt = 1 / 60;
  for (let f = 0; f < 120 * 60; f++) {
    if (f % 180 === 0) sendHeldTo(sadie.x + (Math.random() - 0.5) * 2 * U); // a helpful player nudging the dropper
    update(dt);
    maxRise = Math.max(maxRise, (sadie.y - prevY) / U); prevY = sadie.y;
    // buried inside the pile without climbing out (a single frame can happen as she steps onto a ledge)
    const sunk = sadie.state !== 'climb' && (groundAt(sadie.x, sadie.y) - sadie.y) / U > 0.6;
    sunkFrames = sunk ? sunkFrames + 1 : 0; longestSunk = Math.max(longestSunk, sunkFrames);
    for (const h of world.hay) if (!h.eaten && h.y < h.y0 - 0.01) hayBelowStart++;
    noteHay();
    if (world.hay.filter(h => !h.eaten).length !== HAY_OUT) hayOut = false;
    if (world.hayEaten > eaten) { eaten = world.hayEaten; longestWait = Math.max(longestWait, f / 60 - lastMeal); lastMeal = f / 60; }
  }
  longestWait = Math.max(longestWait, 120 - lastMeal);
  for (let i = 1; i < placed.length; i++) { const d = Math.abs(placed[i] - placed[i - 1]); if (d < STEP_MIN - 0.01 || d > STEP_MAX + 0.01) badGap++; }
  const got = world.hayEaten;
  check('game runs two minutes without broken numbers', !hasNaN(world.pieces) && isFinite(sadie.x) && isFinite(sadie.y));
  check('Sadie never teleports upward', maxRise < 0.1, `fastest rise ${(maxRise * 60).toFixed(1)} blocks/s`);
  check('Sadie never stays stuck inside the pile', longestSunk <= 3, `longest ${longestSunk} frame(s) inside before climbing out`);
  check('hay never drops below where it appeared', hayBelowStart === 0);
  check('there are always 3 hay bundles out', hayOut);
  check('each new bundle is 10-18 blocks from the last one', badGap === 0, `${placed.length} bundles placed`);
  check('new hay always starts out of reach, so Sadie needs help', inReach === 0);
  check('with a little help, Sadie eats hay', got >= 4, `${got} bundles, ${world.pieces.length} pieces`);
  check('Sadie never waits too long for her next snack', longestWait < 40, `longest wait ${longestWait.toFixed(0)} s`);
}

// 5. Deep in a tall pile, settled pieces become fossils: permanent ground that nothing wakes
{
  const types = Object.keys(SHAPES), pieces = [], cx = W / 2;
  for (let k = 0; k < 110; k++) {
    let top = 0; for (const p of pieces) if (p.maxX > cx - 2 * U && p.minX < cx + 2 * U) top = Math.max(top, p.maxY);
    pieces.push(makePiece(types[Math.floor(Math.random() * 7)], U, cx + (Math.random() - 0.5) * 2 * U, top + 3.5 * U, Math.floor(Math.random() * 4) * Math.PI / 2));
    for (let f = 0; f < 50; f++) physicsStep(pieces, P, 1 / 60);
  }
  for (let f = 0; f < 600; f++) physicsStep(pieces, P, 1 / 60);
  world.pieces = pieces;
  for (const p of pieces) { p.rest = p.asleep ? 10 : 0; p.age = 99; p.avgSpeed = p.speed; }
  computeSurface(); updateFossils(0, true);
  const fossils = pieces.filter(p => p.fossil);
  const deepEnough = fossils.every(p => surfAt((p.minX + p.maxX) / 2) - p.maxY >= FOSSIL_DEPTH - 0.01);
  check('deep settled pieces turn into fossils', fossils.length >= 5, `${fossils.length} of ${pieces.length} pieces, pile peak ${(Math.max(...pieces.map(p => p.maxY)) / U).toFixed(1)} blocks`);
  check('only pieces buried at least 8 blocks become fossils', deepEnough);
  const peak = pieces.reduce((a, p) => p.maxY > a.maxY ? p : a);
  pieces.push(makePiece('boulder', U, (peak.minX + peak.maxX) / 2, peak.maxY + 6 * U, 0)); // a boulder lands on top
  let woke = 0;
  for (let f = 0; f < 240; f++) { physicsStep(pieces, P, 1 / 60); woke += fossils.filter(p => !p.asleep).length; }
  check('a boulder landing on top never wakes a fossil', woke === 0);
  world.pieces = [];
}

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
