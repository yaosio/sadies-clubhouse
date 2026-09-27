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
const { barn, barnX, barnCover, BARN_HALF } = await import('../src/core/barn.js');
const { BURIED } = await import('../src/core/sadie/brain.js');
const { on } = await import('../src/core/events.js');

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

// 4. Two minutes of real play: Sadie, the dropper, hay and her barn, all together
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
    if (sadie.trip) lastMeal += dt; // fetching her barn isn't waiting for a snack
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

// 6. Sadie's barn: bury it, and she rushes back and drags it up to the top of the pile
{
  resetGame();
  let trips = 0, home = 0, buriedMax = 0, maxRise = 0, prevY = sadie.y, outside = 0, coverAfter = null, tripSecs = 0, floor0 = 0, roofGap = 0;
  on('homeRush', () => { trips++; floor0 = barn.piece.minY; });
  on('barnHome', () => { home++; });
  const dt = 1 / 60, bx0 = barnX();
  // the player keeps dropping right on top of the barn, then leaves the dropper there
  for (let f = 0; f < 150 * 60 && !home; f++) {
    if (f % 120 === 0) sendHeldTo(bx0 + (Math.random() - 0.5) * 3 * U);
    update(dt);
    if (!sadie.trip) buriedMax = Math.max(buriedMax, barnCover());
    else tripSecs += dt;
    maxRise = Math.max(maxRise, (sadie.y - prevY) / U); prevY = sadie.y;
    const B = barn.piece; if (B.minX < -0.01 || B.maxX > W + 0.01 || B.minY < -0.01) outside++;
    if (home && coverAfter === null) { // just got home: how does it sit compared to the pile around it?
      computeSurface(); coverAfter = barnCover();
      let top = 0; for (let x = barn.piece.minX - 3 * U; x <= barn.piece.maxX + 3 * U; x += U / 4) top = Math.max(top, surfAt(x));
      roofGap = top - barn.piece.maxY;
    }
  }
  const others = world.pieces.filter(p => p !== barn.piece);
  const pen = penetration([barn.piece, ...others.filter(p => p.maxX > barn.piece.minX - U && p.minX < barn.piece.maxX + U)]);
  check('a pile over the barn buries it', buriedMax >= BURIED, `pile ${(buriedMax / U).toFixed(1)} blocks over its roof`);
  check('Sadie rushes back and drags it home', trips === 1 && home === 1, `${trips} trip(s), ${home} finished, took ${tripSecs.toFixed(0)} s`);
  check('afterwards the barn is on top of the pile, not buried', coverAfter !== null && coverAfter < 0 && roofGap < 2 * U && barn.piece.minY - floor0 > 3 * U,
    `raised ${((barn.piece.minY - floor0) / U).toFixed(1)} blocks; ${roofGap > 0.01 ? `the pile beside it is ${(roofGap / U).toFixed(1)} blocks above its roof` : 'nothing near it is higher than its roof'}`);
  check('the barn stays inside the walls and above the ground', outside === 0);
  check('pieces never sink into the barn', pen < 2.5, `deepest ${pen.toFixed(2)} px`);
  check('no broken numbers while dragging it', !hasNaN(world.pieces) && isFinite(sadie.x) && isFinite(sadie.y));
  check('Sadie never teleports upward during the trip', maxRise < 0.1, `fastest rise ${(maxRise * 60).toFixed(1)} blocks/s`);
}

// 7. Chooter: meets Sadie, gets the zoomies, fetches a ball, goes home to the barn and comes back out
{
  const { chooter, meetChooter, updateChooter, MEET_AT } = await import('../src/core/friends/chooter.js');
  const { toy, throwToy } = await import('../src/core/toys.js');
  const { drp } = await import('../src/core/dropper.js');
  const dt = 1 / 60;
  chooter.met = false;
  resetGame();
  let met = 0; on('friendMet', () => met++);
  sadie.y = MEET_AT - U; sadie.state = 'walk'; updateChooter(dt); const early = met;
  sadie.y = MEET_AT; updateChooter(dt);
  check('Sadie meets Chooter the first time she stands 15 blocks up', early === 0 && met === 1 && chooter.met);
  chooter.met = false;
  resetGame();
  for (let f = 0; f < 90 * 60; f++) { if (f % 180 === 0) sendHeldTo(sadie.x + (Math.random() - 0.5) * 2 * U); update(dt); } // grow a pile first
  meetChooter();
  let greeted = null, zooms = 0, kicked = new Set(), balls = 0, back = 0, movedIn = 0, cameOut = false, sunk = 0, longestSunk = 0, outside = 0, stuckToy = 0;
  on('zoomies', () => zooms++); on('ballBack', () => back++); on('friendMovedIn', () => movedIn++);
  let wasHome = false, toyT = 0;
  for (let f = 0; f < 240 * 60; f++) {
    const t = f * dt;
    if (f % 180 === 0) sendHeldTo(sadie.x + (Math.random() - 0.5) * 2 * U);
    // throw him a ball a little way off, whenever there isn't one out
    if (t > 45 && f % 600 === 0 && toy.state === 'none' && chooter.place === 'out' && chooter.doing === 'play') {
      const x = Math.min(W - 2 * U, Math.max(2 * U, chooter.x + 4 * U * (chooter.x < W / 2 ? 1 : -1)));
      if (throwToy('ball', drp.x, drp.y, x, groundAt(x, 1e9) + U)) balls++;
    }
    update(dt);
    if (greeted === null && chooter.doing !== 'greet') greeted = t;
    for (const p of world.pieces) if (p.kickT !== undefined) kicked.add(p);
    if (chooter.place === 'home') wasHome = true; else if (wasHome && chooter.place === 'out') cameOut = true;
    const inside = chooter.place === 'out' && !chooter.air && (groundAt(chooter.x, chooter.y) - chooter.y) / U > 0.6;
    sunk = inside ? sunk + 1 : 0; longestSunk = Math.max(longestSunk, sunk);
    if (chooter.x < 0 || chooter.x > W || chooter.y < -0.01) outside++;
    toyT = toy.state === 'none' ? 0 : toyT + dt; if (toyT > 45) stuckToy++;
  }
  check('Chooter runs over and says hello to Sadie', greeted !== null && greeted < 20, greeted === null ? 'never' : `after ${greeted.toFixed(0)} s`);
  check('he gets the zoomies and knocks pieces about', zooms >= 2 && kicked.size >= 1, `${zooms} zoomies, ${kicked.size} pieces knocked`);
  check('he fetches the ball and brings it to Sadie', balls >= 1 && back >= 1, `${back} of ${balls} balls brought back`);
  check('he moves into the barn and comes back out', movedIn === 1 && cameOut);
  check('he never stays stuck inside the pile', longestSunk <= 3, `longest ${longestSunk} frame(s)`);
  check('he stays inside the walls and above the ground', outside === 0);
  check('a ball never hangs around forever', stuckToy === 0);
  check('no broken numbers with Chooter about', !hasNaN(world.pieces) && isFinite(chooter.x) && isFinite(chooter.y) && isFinite(toy.x) && isFinite(toy.y));
}

// 8. Debug tools (the dev sheet): raining pieces, a quick tall pile, and making things happen now
{
  const dbg = await import('../src/core/debug.js');
  const { chooter } = await import('../src/core/friends/chooter.js');
  const dt = 1 / 60;
  resetGame();
  dbg.rainPieces(100);
  let f = 0;
  while (dbg.debug.rain.length && f < 60 * 60) { update(dt); f++; }
  for (let k = 0; k < 5 * 60; k++) update(dt);
  const n = world.pieces.filter(p => !p.fixed).length;
  check('raining 100 pieces drops all of them', n >= 100 && dbg.debug.rain.length === 0, `${n} pieces in ${(f / 60).toFixed(0)} s`);
  check('rained pieces land without sinking into each other', !hasNaN(world.pieces) && penetration(world.pieces) < 3, `deepest ${penetration(world.pieces).toFixed(2)} px`);
  resetGame();
  dbg.buildPile(W / 2);
  const fast = dbg.gameSpeed();
  f = 0;
  while ((dbg.debug.rain.length || dbg.debug.boost) && f < 120 * 60) { update(dt); f++; }
  computeSurface();
  let peak = 0; for (let x = U; x < W; x += U / 2) peak = Math.max(peak, surfAt(x));
  check('"Build a tall pile" makes a tall mound, fast, then goes back to normal speed', fast === 8 && dbg.gameSpeed() === 1 && peak > 12 * U,
    `peak ${(peak / U).toFixed(1)} blocks after ${(f / 60).toFixed(0)} s of game time`);
  dbg.sadieToTop();
  check('"Put her on top" puts Sadie on the pile, standing on it', sadie.y > 12 * U && Math.abs(groundAt(sadie.x, sadie.y) - sadie.y) < 0.1 * U, `${(sadie.y / U).toFixed(1)} blocks up`);
  dbg.fetchBarnNow();
  check('"Fetch the barn now" sends her home for it', !!sadie.trip);
  chooter.met = false;
  dbg.meetChooterNow();
  update(dt);
  check('"Meet him now" brings Chooter over', chooter.met && chooter.doing === 'greet');
  chooter.feel.missing = 0; dbg.zoomiesNow();
  update(dt);
  check('"Zoomies" starts the zoomies', chooter.doing === 'zoom');
  resetGame();
  check('clearing the tower stops any rain', dbg.debug.rain.length === 0 && !dbg.debug.boost);
}

// 9. Saving: a game saved mid-play comes back exactly as it was, and carries on without trouble
{
  const { snapshot, restore, clearTower, startOver } = await import('../src/core/save.js');
  const { chooter, meetChooter } = await import('../src/core/friends/chooter.js');
  const { barn, barnX } = await import('../src/core/barn.js');
  const { drp } = await import('../src/core/dropper.js');
  const dt = 1 / 60;
  resetGame();
  for (let f = 0; f < 60 * 60; f++) { if (f % 180 === 0) sendHeldTo(sadie.x + (Math.random() - 0.5) * 2 * U); update(dt); }
  meetChooter();
  for (let f = 0; f < 10 * 60; f++) update(dt); // save with some pieces still moving
  const before = { n: world.pieces.length, awake: world.pieces.filter(p => !p.asleep).length, sx: sadie.x, sy: sadie.y, cx: chooter.x, bx: barnX(), by: barn.piece.minY,
    hay: world.hay.filter(h => !h.eaten).map(h => Math.round(h.x / 5)).join(), eaten: world.hayEaten, top: Math.max(...world.pieces.map(p => p.maxY)), dx: drp.x };
  const text = JSON.stringify(snapshot());
  resetGame(); // wipe the board, then load
  restore(JSON.parse(text));
  const after = { n: world.pieces.length, awake: world.pieces.filter(p => !p.asleep).length, sx: sadie.x, sy: sadie.y, cx: chooter.x, bx: barnX(), by: barn.piece.minY,
    hay: world.hay.map(h => Math.round(h.x / 5)).join(), eaten: world.hayEaten, top: Math.max(...world.pieces.map(p => p.maxY)), dx: drp.x };
  const same = before.n === after.n && before.awake === after.awake && Math.abs(before.sx - after.sx) < 0.1 && Math.abs(before.sy - after.sy) < 0.1 && Math.abs(before.cx - after.cx) < 0.1
    && Math.abs(before.bx - after.bx) < 0.1 && Math.abs(before.by - after.by) < 0.1 && before.hay === after.hay && before.eaten === after.eaten && Math.abs(before.top - after.top) < 0.1 && Math.abs(before.dx - after.dx) < 0.1;
  check('a saved game comes back as it was', same, `${after.n} pieces (${after.awake} moving), Sadie at ${(after.sy / U).toFixed(1)} blocks, save is ${(text.length / 1024).toFixed(0)} KB`);
  let maxRise = 0, prevY = sadie.y, sunk = 0, longest = 0;
  for (let f = 0; f < 20 * 60; f++) {
    update(dt);
    maxRise = Math.max(maxRise, (sadie.y - prevY) / U); prevY = sadie.y;
    sunk = sadie.state !== 'climb' && groundAt(sadie.x, sadie.y) - sadie.y > 0.6 * U ? sunk + 1 : 0; longest = Math.max(longest, sunk); // same as test 4
  }
  check('after loading, the game carries on without trouble', !hasNaN(world.pieces) && maxRise < 0.1 && longest <= 3 && penetration(world.pieces) < 3,
    `longest stuck in the pile ${longest} frames, fastest rise ${(maxRise * 60).toFixed(1)} blocks/s, deepest overlap ${penetration(world.pieces).toFixed(2)} px`);
  let threw = false; try { restore({ v: 999, pieces: [] }); } catch (e) { threw = true; }
  check('a save from a different version is refused, not half-loaded', threw);
  clearTower();
  check('"Clear tower" empties the board but Sadie keeps Chooter', world.pieces.filter(p => !p.fixed).length === 0 && chooter.met);
  startOver();
  check('"Start over" forgets everything, Chooter included', world.pieces.filter(p => !p.fixed).length === 0 && !chooter.met && world.climbBest === 0);
}

// 10. Chooter teases Sadie: fed up with being ignored, he snatches her hay; she chases him for it
{
  const { chooter, meetChooter } = await import('../src/core/friends/chooter.js');
  const dt = 1 / 60;
  resetGame();
  for (let f = 0; f < 90 * 60; f++) { if (f % 180 === 0) sendHeldTo(sadie.x + (Math.random() - 0.5) * 2 * U); update(dt); } // grow a pile
  meetChooter();
  let stolen = 0, caught = 0, dropped = 0, chaseSecs = 0, longest = 0, ranAfter = 0, hayOut = true, sunk = 0, longestSunk = 0;
  on('hayStolen', () => stolen++);
  let loot = null, t0 = 0, firstSteal = null;
  for (let f = 0; f < 240 * 60; f++) {
    const t = f * dt;
    if (f % 180 === 0) sendHeldTo(sadie.x + (Math.random() - 0.5) * 2 * U);
    update(dt);
    if (chooter.loot && !loot) { loot = chooter.loot; t0 = t; if (firstSteal === null) firstSteal = t; }
    if (loot) {
      chaseSecs += dt;
      if (sadie.target === loot && sadie.running) ranAfter++;
      if (!chooter.loot) { if (loot.eaten) caught++; else dropped++; longest = Math.max(longest, t - t0); loot = null; }
    }
    if (world.hay.filter(h => !h.eaten).length !== 3) hayOut = false;
    const inside = chooter.place === 'out' && !chooter.air && (groundAt(chooter.x, chooter.y) - chooter.y) / U > 0.6;
    sunk = inside ? sunk + 1 : 0; longestSunk = Math.max(longestSunk, sunk);
  }
  check('fed up with being ignored, Chooter snatches the hay Sadie is after', stolen >= 1, `${stolen} time(s) in 4 minutes, first after ${firstSteal === null ? '-' : firstSteal.toFixed(0)} s`);
  check('Sadie runs after her hay', ranAfter > 0, `running after it ${(ranAfter / 60).toFixed(0)} s of ${chaseSecs.toFixed(0)} s`);
  check('keep-away always ends: she catches him or he drops it', caught + dropped === stolen - (loot ? 1 : 0) && longest <= 21, `${caught} caught, ${dropped} dropped, longest ${longest.toFixed(0)} s`);
  check('there are always 3 hay bundles out, stolen ones included', hayOut);
  check('Chooter never gets stuck in the pile while teasing', longestSunk <= 3, `longest ${longestSunk} frame(s)`);
}

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
