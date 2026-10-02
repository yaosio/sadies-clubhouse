// Headless checks for the simulation. Runs the real game code in Node, no browser needed:
//
//   node tests/dropper-world/run.mjs                 all of them
//   node tests/dropper-world/run.mjs --section=14    just one numbered section (below)
//
// The simulation (src/activities/dropper-world/core) never touches the screen, which is what makes this possible.
//
// Each numbered section runs in its own Node process, several at once (one per processor), so the
// whole lot takes minutes less. That also means each section starts from a fresh game and its own
// fresh random numbers (seeded, so every run is the same), and nothing one section does can change
// another's numbers.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { cpus } from 'node:os';

const only = process.argv.find(a => a.startsWith('--section='));
const wanted = n => only && +only.slice(10) === n;

if (!only) {
  const me = new URL(import.meta.url).pathname;
  const sections = [...readFileSync(me, 'utf8').matchAll(/^\/\/ (\d+)\. (.*)$/gm)].map(m => ({ n: +m[1], title: m[2] }));
  // the long ones first, longest first, so none of them ends up last and alone (about how many
  // seconds each takes on Claude's cloud machine: 14 50, 7 45, 10 18, 1 13, 13 12, 8 12, 12 9, 5 7)
  const LONG = [14, 7, 10, 1, 13, 8, 12, 5];
  const queue = [...sections].sort((a, b) => (LONG.includes(b.n) ? LONG.length - LONG.indexOf(b.n) : 0) - (LONG.includes(a.n) ? LONG.length - LONG.indexOf(a.n) : 0));
  const results = new Map(), t0 = Date.now();
  const runOne = s => new Promise(done => {
    const t = Date.now(), c = spawn(process.execPath, [me, `--section=${s.n}`]);
    let text = '';
    c.stdout.on('data', d => text += d); c.stderr.on('data', d => text += d);
    c.on('close', code => { results.set(s.n, { text, code, secs: (Date.now() - t) / 1000 }); done(); });
  });
  const worker = async () => { while (queue.length) await runOne(queue.shift()); };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(cpus().length, sections.length)) }, worker));
  let bad = 0;
  for (const s of sections) {
    const r = results.get(s.n);
    console.log(`\n-- ${s.n}. ${s.title}  (${r.secs.toFixed(0)} s)`);
    process.stdout.write(r.text.replace(/\n?all checks passed\n?$|\n?\d+ check\(s\) failed\n?$/, '\n'));
    const fails = (r.text.match(/^FAIL/gm) || []).length;
    if (r.code !== 0) bad += Math.max(1, fails);
  }
  console.log(`\n${sections.length} sections in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  console.log(bad ? `${bad} check(s) failed` : 'all checks passed');
  process.exit(bad ? 1 : 0);
}

let seed = 20260926;
Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const { U, W, DEFAULTS, physParams } = await import('../../src/activities/dropper-world/config.js');
const { SHAPES } = await import('../../src/activities/dropper-world/core/physics/pieceTypes.js');
const { makePiece } = await import('../../src/activities/dropper-world/core/physics/body.js');
const { physicsStep } = await import('../../src/activities/dropper-world/core/physics/solver.js');
const { world } = await import('../../src/activities/dropper-world/core/world.js');
const { resetGame, update } = await import('../../src/activities/dropper-world/core/game.js');
const { groundAt } = await import('../../src/activities/dropper-world/core/surface.js');
const { sadie } = await import('../../src/activities/dropper-world/core/sadie/brain.js');
const { HAY_OUT, STEP_MIN, STEP_MAX, makeBundle } = await import('../../src/activities/dropper-world/core/hay.js');
const { drp } = await import('../../src/activities/dropper-world/core/dropper.js');
const { REACH } = await import('../../src/activities/dropper-world/core/sadie/brain.js');
const { computeSurface, surfAt } = await import('../../src/activities/dropper-world/core/surface.js');
const { updateFossils, FOSSIL_DEPTH } = await import('../../src/activities/dropper-world/core/fossil.js');
const { barn, barnX, barnCover, BARN_HALF } = await import('../../src/activities/dropper-world/core/barn.js');
const { BURIED } = await import('../../src/activities/dropper-world/core/sadie/brain.js');
const { on } = await import('../../src/activities/dropper-world/core/events.js');

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
if (wanted(1)) {
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
if (wanted(2)) {
  const pcs = [makePiece('ball', U, W / 2, 6 * U, 0)]; const peaks = []; let prev = 0;
  for (let f = 0; f < 400; f++) { physicsStep(pcs, P, 1 / 60); const v = pcs[0].y[0] - pcs[0].py[0]; if (prev > 0 && v <= 0) peaks.push(pcs[0].y[0] / U); prev = v; }
  check('ball dropped from 6 blocks bounces to about 3.4', peaks[0] > 3.0 && peaks[0] < 3.8, `first bounce ${peaks[0]?.toFixed(2)}`);
  check('its bounces shrink', peaks[1] < peaks[0] && peaks[2] < peaks[1], peaks.slice(0, 3).map(v => v.toFixed(2)).join(', '));
}

// 3. Pieces dropped on one spot make a mound (not a flat layer, not a spire)
if (wanted(3)) {
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

// 4. Two minutes of real play: Sadie, the mole, hay and her barn, all together (nobody steers the mole)
if (wanted(4)) {
  resetGame();
  let maxRise = 0, sunkFrames = 0, longestSunk = 0, hayBelowStart = 0, prevY = sadie.y;
  let lastMeal = 0, longestWait = 0, eaten = 0, badGap = 0, tooMany = 0, short = 0, longestShort = 0, firstThree = null, inReach = 0, flew = 0, bounced = 0, easy = 0;
  const seen = new Set(), floated = new Set(), placed = [], lastVy = new Map();
  // each bundle: where the mole aimed it, whether it bounced, and how high it floats once it settles
  const noteHay = () => { for (const h of world.hay) {
    if (!seen.has(h)) { seen.add(h); placed.push(h.aim); if (h.st === 'fly') flew++; }
    if (h.st === 'fly') { if (lastVy.get(h) < 0 && h.vy > 0) bounced++; lastVy.set(h, h.vy); }
    if (h.st && h.st !== 'fly' && !floated.has(h)) { floated.add(h); if (h.y0 - surfAt(h.x) <= REACH) inReach++; }
    if (h.eaten && h.st === 'lift' && !h.counted) { h.counted = true; easy++; }
  } };
  const dt = 1 / 60;
  for (let f = 0; f < 120 * 60; f++) {
    update(dt);
    maxRise = Math.max(maxRise, (sadie.y - prevY) / U); prevY = sadie.y;
    // buried inside the pile without climbing out (a single frame can happen as she steps onto a ledge)
    const sunk = sadie.state !== 'climb' && (groundAt(sadie.x, sadie.y) - sadie.y) / U > 0.6;
    sunkFrames = sunk ? sunkFrames + 1 : 0; longestSunk = Math.max(longestSunk, sunkFrames);
    for (const h of world.hay) if (!h.eaten && !h.st && h.y < h.y0 - 0.01) hayBelowStart++;
    noteHay();
    const out = world.hay.filter(h => !h.eaten).length + (drp.hay !== null ? 1 : 0);
    if (out > HAY_OUT) tooMany++;
    if (firstThree === null && world.hay.length === HAY_OUT) firstThree = f / 60;
    short = out < HAY_OUT ? short + dt : 0; if (firstThree !== null) longestShort = Math.max(longestShort, short);
    if (sadie.trip) lastMeal += dt; // fetching her barn isn't waiting for a snack
    if (world.hayEaten > eaten) { eaten = world.hayEaten; longestWait = Math.max(longestWait, f / 60 - lastMeal); lastMeal = f / 60; }
  }
  longestWait = Math.max(longestWait, 120 - lastMeal);
  for (let i = 1; i < placed.length; i++) { const d = Math.abs(placed[i] - placed[i - 1]); if (d < STEP_MIN - 0.01 || d > STEP_MAX + 0.01) badGap++; }
  const floats = [...floated].filter(h => !h.eaten || h.st === null).length;
  const got = world.hayEaten;
  check('game runs two minutes without broken numbers', !hasNaN(world.pieces) && isFinite(sadie.x) && isFinite(sadie.y));
  check('Sadie never teleports upward', maxRise < 0.1, `fastest rise ${(maxRise * 60).toFixed(1)} blocks/s`);
  check('Sadie never stays stuck inside the pile', longestSunk <= 3, `longest ${longestSunk} frame(s) inside before climbing out`);
  check('a new game starts with the mole flinging out the first 3 bundles of hay', firstThree !== null && firstThree < 10 && flew === placed.length, `all 3 out after ${firstThree?.toFixed(1)} s, ${flew} of ${placed.length} flung`);
  check('flung hay bounces before it settles', bounced >= placed.length, `${bounced} bounces for ${placed.length} bundles`);
  check('floating hay never drops below where it floated up to', hayBelowStart === 0);
  check('never more than 3 bundles about, and the mole soon turns up another', tooMany === 0 && longestShort < 20, `longest one short ${longestShort.toFixed(1)} s`);
  check('the mole aims each bundle 10-18 blocks from the last one', badGap === 0, `${placed.length} bundles flung, ${easy} eaten before they floated up`);
  check('settled hay always floats up out of reach, so Sadie needs help', inReach === 0 && floats > 0, `${floated.size} floated up`);
  check('with the mole burying her, Sadie eats hay', got >= 4, `${got} bundles, ${world.pieces.length} pieces`);
  check('Sadie never waits too long for her next snack', longestWait < 40, `longest wait ${longestWait.toFixed(0)} s`);
}

// 5. Deep in a tall pile, settled pieces become fossils: permanent ground that nothing wakes
if (wanted(5)) {
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
if (wanted(6)) {
  resetGame();
  let trips = 0, home = 0, buriedMax = 0, maxRise = 0, prevY = sadie.y, outside = 0, coverAfter = null, tripSecs = 0, floor0 = 0, roofGap = 0;
  on('homeRush', () => { trips++; floor0 = barn.piece.minY; });
  on('barnHome', () => { home++; });
  const dt = 1 / 60;
  // the mole buries the barn by itself
  for (let f = 0; f < 150 * 60 && !home; f++) {
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
  // (Sadie may climb far enough above it to go and fetch it just before it's fully buried: that's fine too)
  check('the mole piles pieces over the barn', buriedMax >= BURIED / 2, `pile ${(buriedMax / U).toFixed(1)} blocks over its roof before she went for it`);
  check('Sadie rushes back and drags it home', trips === 1 && home === 1, `${trips} trip(s), ${home} finished, took ${tripSecs.toFixed(0)} s`);
  check('afterwards the barn is on top of the pile, not buried', coverAfter !== null && coverAfter < 0 && roofGap < 2 * U && barn.piece.minY - floor0 > 3 * U,
    `raised ${((barn.piece.minY - floor0) / U).toFixed(1)} blocks; ${roofGap > 0.01 ? `the pile beside it is ${(roofGap / U).toFixed(1)} blocks above its roof` : 'nothing near it is higher than its roof'}`);
  check('the barn stays inside the walls and above the ground', outside === 0);
  check('pieces never sink into the barn', pen < 2.5, `deepest ${pen.toFixed(2)} px`);
  check('no broken numbers while dragging it', !hasNaN(world.pieces) && isFinite(sadie.x) && isFinite(sadie.y));
  check('Sadie never teleports upward during the trip', maxRise < 0.1, `fastest rise ${(maxRise * 60).toFixed(1)} blocks/s`);
}

// 7. Chooter: hears the noise and bursts in, meets Sadie, gets the zoomies, fetches a ball, goes home and comes back out
if (wanted(7)) {
  const { chooter, meetChooter, HEAR_FASTEST } = await import('../../src/activities/dropper-world/core/friends/chooter.js');
  const { toy, throwToy } = await import('../../src/activities/dropper-world/core/toys.js');
  const { drp } = await import('../../src/activities/dropper-world/core/dropper.js');
  const { snapshot, restore } = await import('../../src/activities/dropper-world/core/save.js');
  const dbg = await import('../../src/activities/dropper-world/core/debug.js');
  const { minds } = await import('../../src/activities/dropper-world/core/mind/thoughts.js');
  const dt = 1 / 60;
  // a new board: all the thudding winds him up next door; he peeks in, then bursts in
  chooter.met = false; chooter.heard = chooter.ringing = 0;
  resetGame();
  let met = 0, metAt = null, peekAt = null, tappable = false, nearSide = false, saved = null; on('friendMet', () => met++);
  for (let f = 0; f < 10 * 3600 && !chooter.met; f++) {
    update(dt);
    const t = (f + 1) * dt;
    if (peekAt === null && chooter.peek > 0.5) { peekAt = t; tappable = minds().some(m => m.who === chooter); nearSide = chooter.peekSide === (sadie.x < W / 2 ? -1 : 1); }
    if (f === 3 * 3600) saved = { heard: chooter.heard, s: JSON.parse(JSON.stringify(snapshot())) };
    if (chooter.met) metAt = t;
  }
  const mins = s => s === null ? 'never' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  check('a few minutes of just Sadie and the mole, then Chooter bursts in', met === 1 && metAt > 180 && metAt < 7 * 60, `in at ${mins(metAt)}`);
  check('he peeks in first, over the wall nearer Sadie, and you can tap him to see why', peekAt !== null && metAt - peekAt > 30 && tappable && nearSide, `first peek at ${mins(peekAt)}`);
  chooter.met = false; restore(saved.s);
  check('how wound up he is survives closing the page', Math.abs(chooter.heard - saved.heard) < 0.001, `${(saved.heard * 100).toFixed(1)}% before, ${(chooter.heard * 100).toFixed(1)}% after`);
  // however much noise there is (a downpour of pieces), he can only get so worked up so fast
  chooter.heard = chooter.ringing = 0; resetGame(); dbg.rainPieces(300, U, W - U, 0.05);
  for (let f = 0; f < 60 * 60; f++) update(dt);
  dbg.stopRain();
  check(`even in a downpour, he takes at least ${HEAR_FASTEST / 60} minutes to arrive`, !chooter.met && chooter.heard <= 60 / HEAR_FASTEST + 0.001, `${(chooter.heard * 100).toFixed(0)}% wound up after a minute of it`);
  chooter.met = false; chooter.heard = chooter.ringing = 0;
  resetGame();
  for (let f = 0; f < 90 * 60; f++) update(dt); // let the mole grow a pile first
  meetChooter();
  let greeted = null, zooms = 0, kicked = new Set(), balls = 0, back = 0, movedIn = 0, cameOut = false, sunk = 0, longestSunk = 0, outside = 0, stuckToy = 0;
  on('zoomies', () => zooms++); on('ballBack', () => back++); on('friendMovedIn', () => movedIn++);
  let wasHome = false, toyT = 0;
  for (let f = 0; f < 240 * 60; f++) {
    const t = f * dt;
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
if (wanted(8)) {
  const dbg = await import('../../src/activities/dropper-world/core/debug.js');
  const { chooter } = await import('../../src/activities/dropper-world/core/friends/chooter.js');
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
if (wanted(9)) {
  const { snapshot, restore, clearTower, startOver } = await import('../../src/activities/dropper-world/core/save.js');
  const { chooter, meetChooter } = await import('../../src/activities/dropper-world/core/friends/chooter.js');
  const { barn, barnX } = await import('../../src/activities/dropper-world/core/barn.js');
  const { drp } = await import('../../src/activities/dropper-world/core/dropper.js');
  const dt = 1 / 60;
  resetGame();
  for (let f = 0; f < 60 * 60; f++) update(dt);
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
  const { tuning, DEFAULTS } = await import('../../src/activities/dropper-world/config.js');
  tuning.set.gravity = 2;
  startOver();
  check('"Start over" forgets everything, Chooter and the dev sheet\'s physics included (as the pause menu\'s does)', world.pieces.filter(p => !p.fixed).length === 0 && !chooter.met && world.climbBest === 0 && tuning.set.gravity === DEFAULTS.gravity);
  const { SAVES } = await import('../../src/activities/dropper-world/core/saves.js');
  const { readFileSync, readdirSync } = await import('node:fs');
  const dir = new URL('../../src/activities/dropper-world/', import.meta.url).pathname;
  const keeps = JSON.parse(readFileSync(dir + 'card.js', 'utf8').match(/keeps: (\[[^\]]*\])/)[1].replace(/'/g, '"'));   // (the card itself imports its page)
  const outside = Object.values(SAVES).filter(k => !keeps.some(p => k.startsWith(p)));
  const named = readdirSync(dir, { recursive: true }).filter(f => f.endsWith('.js') && f !== 'core/saves.js')
    .filter(f => /store\.(get|set|remove)\(\s*['"`]/.test(readFileSync(dir + f, 'utf8')));
  check('its saves are named in one list (core/saves.js), which its card\'s `keeps` covers', !outside.length && !named.length, [...outside, ...named].join(', '));
}

// 10. Chooter teases Sadie: fed up with being ignored, he snatches her hay; she chases him for it
if (wanted(10)) {
  const { chooter, meetChooter } = await import('../../src/activities/dropper-world/core/friends/chooter.js');
  const dt = 1 / 60;
  resetGame();
  for (let f = 0; f < 90 * 60; f++) update(dt); // let the mole grow a pile
  meetChooter();
  let stolen = 0, caught = 0, dropped = 0, chaseSecs = 0, longest = 0, ranAfter = 0, tooMany = 0, short = 0, longestShort = 0, sunk = 0, longestSunk = 0;
  on('hayStolen', () => stolen++);
  let loot = null, t0 = 0, firstSteal = null, flips = 0, lastC = 0, lastS = 0;
  for (let f = 0; f < 240 * 60; f++) {
    const t = f * dt;
    update(dt);
    if (chooter.loot && !loot) { loot = chooter.loot; t0 = t; if (firstSteal === null) firstSteal = t; }
    if (loot) {
      chaseSecs += dt;
      if (sadie.target === loot && sadie.running) ranAfter++;
      if (chooter.dir !== lastC) flips++; if (sadie.dir !== lastS) flips++;
      if (!chooter.loot) { if (loot.eaten) caught++; else dropped++; longest = Math.max(longest, t - t0); loot = null; }
    }
    lastC = chooter.dir; lastS = sadie.dir;
    const out = world.hay.filter(h => !h.eaten).length + (drp.hay !== null ? 1 : 0);
    if (out > HAY_OUT) tooMany++;
    short = out < HAY_OUT ? short + dt : 0; longestShort = Math.max(longestShort, short);
    const inside = chooter.place === 'out' && !chooter.air && (groundAt(chooter.x, chooter.y) - chooter.y) / U > 0.6;
    sunk = inside ? sunk + 1 : 0; longestSunk = Math.max(longestSunk, sunk);
  }
  check('fed up with being ignored, Chooter snatches the hay Sadie is after', stolen >= 1, `${stolen} time(s) in 4 minutes, first after ${firstSteal === null ? '-' : firstSteal.toFixed(0)} s`);
  check('Sadie runs after her hay', ranAfter > 0, `running after it ${(ranAfter / 60).toFixed(0)} s of ${chaseSecs.toFixed(0)} s`);
  check('keep-away always ends: she catches him or he drops it', caught + dropped === stolen - (loot ? 1 : 0) && longest <= 21, `${caught} caught, ${dropped} dropped, longest ${longest.toFixed(0)} s`);
  check('nobody jitters back and forth during the chase', flips <= chaseSecs * 2, `${flips} turns in ${chaseSecs.toFixed(0)} s`);
  check('never more than 3 bundles about, stolen ones included, and never one short for long', tooMany === 0 && longestShort < 20, `longest one short ${longestShort.toFixed(1)} s`);
  check('Chooter never gets stuck in the pile while teasing', longestSunk <= 3, `longest ${longestSunk} frame(s)`);
}

// 11. Cornered: Chooter runs out of room against the wall with Sadie right behind him. Neither of
// them should flip back and forth; she gets her hay.
if (wanted(11)) {
  const { chooter, meetChooter, chooterDo } = await import('../../src/activities/dropper-world/core/friends/chooter.js');
  const { pickUpHay } = await import('../../src/activities/dropper-world/core/hay.js');
  const dt = 1 / 60;
  resetGame(); world.pieces = world.pieces.filter(p => p.fixed); world.held = null; world.supply = 0; // a flat, empty board
  chooter.met = false; meetChooter(); chooter.feel.missing = 0;
  const h = makeBundle(W - 2 * U, 0.7 * U); world.hay.push(h);
  chooter.x = W - 2.5 * U; chooter.y = 0; sadie.x = W - 5 * U; sadie.y = 0; sadie.target = h; sadie.doing = 'eat';
  chooter.feel.ignored = 1; chooterDo('tease'); pickUpHay(h); chooter.loot = h; chooter.actT = 20;
  let flipsC = 0, flipsS = 0, lastC = chooter.dir, lastS = sadie.dir, got = null;
  for (let f = 0; f < 15 * 60 && got === null; f++) {
    world.supply = 0; update(dt);
    if (chooter.dir !== lastC) { flipsC++; lastC = chooter.dir; }
    if (sadie.dir !== lastS) { flipsS++; lastS = sadie.dir; }
    if (h.eaten) got = f / 60;
  }
  check('cornered against the wall, neither of them jitters back and forth', flipsC <= 3 && flipsS <= 3, `Chooter turned ${flipsC} time(s), Sadie ${flipsS}`);
  check('...and Sadie gets her hay', got !== null, got === null ? 'never' : `after ${got.toFixed(1)} s`);
}

// 12. Thought bubbles: tapping Sadie, Chooter or the mole always has something sensible to say, and
// reading their thoughts never changes the game.
if (wanted(12)) {
  const { chooter, meetChooter } = await import('../../src/activities/dropper-world/core/friends/chooter.js');
  const { minds } = await import('../../src/activities/dropper-world/core/mind/thoughts.js');
  const dt = 1 / 60;
  resetGame(); chooter.met = false; meetChooter();
  let bad = null, reads = 0; const said = new Set();
  for (let f = 0; f < 240 * 60 && !bad; f++) {
    update(dt);
    if (f % 30) continue;
    for (const m of minds()) {
      const before = Math.random; Math.random = () => { bad = `${m.name}'s thoughts used a random number`; return before(); };
      const t = m.think(); Math.random = before; reads++;
      said.add(m.name + ': ' + t.doing);
      if (!t.doing || !t.why) bad = `${m.name} had nothing to say`;
      if (t.feelings.length > 4) bad = `${m.name} has ${t.feelings.length} feeling bars (4 at most)`;
      for (const x of t.feelings) if (!(x.value >= 0 && x.value <= 1)) bad = `${m.name}'s "${x.label}" is ${x.value}`;
      if (!isFinite(m.x) || !isFinite(m.y)) bad = `${m.name} is nowhere`;
    }
  }
  check('Sadie, Chooter and the mole always have a thought, with feelings from 0 to 1', !bad && reads > 0, bad || `${said.size} different things over 4 minutes`);
  check('all three can be tapped once Chooter is met', minds().length === 3);
}

// 13. The mole decides where pieces go: on anyone restless (it thinks they want to be buried),
// otherwise on the barn. Never faster than one piece every 1.5 s, and a struggling game tires it:
// slower, then a nap with no pieces at all, then back to work once things calm down.
if (wanted(13)) {
  const { mole } = await import('../../src/activities/dropper-world/core/mole.js');
  const { REGEN } = await import('../../src/activities/dropper-world/core/dropper.js');
  const { chooter } = await import('../../src/activities/dropper-world/core/friends/chooter.js');
  const dt = 1 / 60;
  chooter.met = false; resetGame();
  let n = world.pieces.length, last = -9, minGap = Infinity, onSadie = 0, onChooter = 0, onBarn = 0, stray = 0, drops = 0, ignored = 0;
  const dropped = t => { const g = t - last; last = t; drops++; return g; };
  for (let f = 0; f < 180 * 60; f++) {
    const was = { doing: mole.doing, who: mole.who, wx: mole.who && mole.who.x, bx: barnX() };
    update(dt);
    if (sadie.feel.impatient >= 0.5 && mole.doing !== 'bury') ignored++; // she's restless: it should be on its way
    if (world.pieces.length > n) {
      const p = world.pieces[world.pieces.length - 1], x = (p.minX + p.maxX) / 2;
      minGap = Math.min(minGap, dropped(f * dt));
      if (was.doing === 'bury' && Math.abs(x - was.wx) < 1.5 * U) { if (was.who === sadie) onSadie++; else onChooter++; }
      else if (was.doing === 'barn' && Math.abs(x - was.bx) < BARN_HALF + 1.5 * U) onBarn++;
      else stray++;
    }
    n = world.pieces.length;
  }
  check('the mole drops pieces on whoever is restless, and on the barn otherwise', onSadie > 5 && onBarn > 5 && stray === 0 && ignored === 0,
    `${drops} pieces in 3 minutes: ${onSadie} on Sadie, ${onChooter} on Chooter once he came, ${onBarn} on the barn, ${stray} elsewhere`);
  check('never faster than one piece every 1.5 s', minGap >= REGEN - 0.02, `closest two ${minGap.toFixed(2)} s apart`);
  // a struggling game: the simulation takes 80% of every second
  let napAt = null, dropsTired = 0, slowGap = 0, dropsNapping = 0, wokeAt = null, after = 0;
  last = -9;
  for (let f = 0; f < 60 * 60; f++) {
    const t = f * dt, strained = t < 25;
    mole.strain = strained ? 0.8 : 0;
    update(dt);
    // the quiet stretch just before it nods off counts as slowing down too (it may only get one
    // piece out once it's tired, so there'd be no gap between two to measure)
    if (mole.napping && napAt === null) { napAt = t; slowGap = Math.max(slowGap, t - Math.max(0, last)); }
    if (!mole.napping && napAt !== null && wokeAt === null) wokeAt = t;
    if (world.pieces.length > n) {
      const g = dropped(t);
      if (napAt === null) { dropsTired++; if (dropsTired > 1) slowGap = Math.max(slowGap, g); }
      else if (wokeAt === null) dropsNapping++;
      else after++;
    }
    n = world.pieces.length;
  }
  check('a struggling game wears the mole out: it slows down, then naps', napAt !== null && napAt < 10 && slowGap > 2 * REGEN && dropsNapping === 0,
    `slowest gap ${slowGap.toFixed(1)} s, napping after ${napAt === null ? '-' : napAt.toFixed(0)} s, ${dropsNapping} pieces while napping`);
  check('...and gets back to work once things calm down', wokeAt !== null && after >= 5, `awake again ${wokeAt === null ? 'never' : (wokeAt - 25).toFixed(0) + ' s after'}, ${after} pieces since`);
  mole.strain = 0; mole.feel.tired = 0; mole.napping = false;
}

// 14. Bedrock: once the board has more than 400 pieces, fossils buried 12 blocks deep melt into the
// floor, so the tower can grow forever without the number of pieces growing with it. (Runs last, so no earlier numbers moved.)
if (wanted(14)) {
  const { rock, rockAt, rockInfo, surf, SURF_N, SURF_RES } = await import('../../src/activities/dropper-world/core/surface.js');
  const { bedrock, MELT_DEPTH, MAX_PIECES } = await import('../../src/activities/dropper-world/core/bedrock.js');
  const { rainPieces } = await import('../../src/activities/dropper-world/core/debug.js');
  const { snapshot, restore } = await import('../../src/activities/dropper-world/core/save.js');
  const { minds } = await import('../../src/activities/dropper-world/core/mind/thoughts.js');
  const dt = 1 / 60;
  resetGame();
  check('a fresh board has no bedrock (flat ground, the physics as before)', rockInfo.high === 0 && bedrock.melted === 0);
  rainPieces(700, U, W - U, 0.05);
  let early = 0, firstAt = 0, tooHigh = 0, sunk = 0, most = 0, heard = false, f = 0, uncovered = 0, maxOut = 0;
  const { debug } = await import('../../src/activities/dropper-world/core/debug.js');
  for (; f < 150 * 60 && (debug.rain.length || f < 100 * 60); f++) {
    const before = bedrock.melted, was = Array.from(rock), fossils = world.pieces.filter(p => p.fossil), count = world.pieces.length;
    update(dt);
    if (bedrock.melted > before) { if (count <= MAX_PIECES) early++; if (!firstAt) firstAt = count; }
    if (bedrock.melted > before) { // what melted is completely inside the rock now: whatever rested on it rests on the rock
      const left = new Set(world.pieces);
      // (compared with the rock's heights on either side of each point: it's kept one height every quarter block)
      const near = x => { const f = Math.max(0, Math.min(SURF_N - 1, x / SURF_RES)); return Math.max(rock[Math.floor(f)], rock[Math.ceil(f)]); };
      for (const p of fossils) if (!left.has(p)) { let out = 0; for (const i of p.T.bnd) out = Math.max(out, p.y[i] - near(p.x[i])); maxOut = Math.max(maxOut, out); if (out > 0.15 * U) uncovered++; }
    }
    most = Math.max(most, world.pieces.length);
    if (bedrock.melted > before) { // where it just rose, it's still at least 12 blocks under the pile
      for (let i = 0; i < SURF_N; i++) if (rock[i] > was[i] && rock[i] > surf[i] - MELT_DEPTH + 0.05 * U) { tooHigh++; if (tooHigh < 4) console.log('   rose to', (rock[i] / U).toFixed(2), 'under a surface at', (surf[i] / U).toFixed(2), 'at x', (i * SURF_RES / U).toFixed(2)); }
      heard = heard || minds().some(m => m.name === 'Mole' && m.think().why.includes('bedrock'));
    }
    if (f % 30 === 0) for (const p of world.pieces) if (!p.fixed && !p.fossil) for (const i of p.T.bnd) if (p.y[i] < rockAt(p.x[i]) - 2) sunk++;
  }
  const buried = world.pieces.filter(p => !p.fixed && Array.from(p.T.bnd).every(i => p.y[i] < rockAt(p.x[i]))).length;
  check('deep fossils melt into bedrock, and the board keeps fewer pieces', bedrock.melted > 50 && world.pieces.length < most,
    `${bedrock.melted} melted, ${world.pieces.length} pieces left (${most} at most), bedrock ${(rockInfo.low / U).toFixed(1)}-${(rockInfo.high / U).toFixed(1)} blocks up`);
  check('nothing melts until the board has more than 400 pieces', early === 0 && firstAt > MAX_PIECES, `first melt with ${firstAt} pieces on the board`);
  check('...and then it stays around 400', world.pieces.length <= MAX_PIECES + 20, `${world.pieces.length} at the end`);
  check('only pieces at least 12 blocks under the pile melt', tooHigh === 0);
  check('the rock rises right up to the top of whatever melts, so nothing is left hanging over a gap', uncovered === 0, `${uncovered} melted pieces stuck out of the rock, at most ${(maxOut / U).toFixed(2)} blocks`);
  check('no piece is left inside the bedrock', buried === 0);
  check('nothing that can move sinks into the bedrock', sunk === 0, `${sunk} points found under it`);
  check('the mole notices', heard);
  // a steep step in the bedrock: a piece slid into its side is stopped by it, not popped up on top
  {
    const { setBedrock } = await import('../../src/activities/dropper-world/core/bedrock.js');
    const h = new Array(SURF_N).fill(0).map((_, i) => i * SURF_RES > 24 * U ? 5 * U : 0);
    setBedrock(h, 1, []);
    const box = makePiece('O', U, 20 * U, U, 0);
    for (let i = 0; i < box.n; i++) box.px[i] = box.x[i] - 0.3 * U; // sliding right, toward the step
    let top = 0, into = 0;
    for (let k = 0; k < 120; k++) { physicsStep([box], P, 1 / 60, rock, SURF_RES); top = Math.max(top, box.maxY); into = Math.max(into, box.maxX - 24 * U); }
    check('a piece sliding into a step in the bedrock stops against it', top < 4.5 * U && into < 0.4 * U,
      `highest it got ${(top / U).toFixed(2)} blocks (the step is 5), ${(Math.max(0, into) / U).toFixed(2)} blocks into it`);
  }
  // saving: the bedrock comes back exactly, and a save from before bedrock loads with none
  const s = JSON.parse(JSON.stringify(snapshot())), was = Array.from(rock), melted = bedrock.melted;
  restore(s);
  const same = was.every((v, i) => Math.abs(v - rock[i]) < 0.01) && bedrock.melted === melted;
  check('the bedrock is saved and comes back', same, `save is ${(JSON.stringify(s).length / 1024).toFixed(0)} KB`);
  restore({ ...s, bedrock: null });
  check('a save from before bedrock loads with flat ground', rockInfo.high === 0);
  resetGame();
}

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
