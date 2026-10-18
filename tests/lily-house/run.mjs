// Lily's House's headless checks: the card (Lily's ledge on the hydrant, nothing saved), and Lily's
// Big Climb in numbers: it starts, she can jump up to a hammer and can't climb while she holds it,
// every ladder joins two girders, reaching her chicken wins (and the game ends after the fanfare),
// and a simple player wins a few games out of a small handful (so the level can be won). Her
// chicken thrown: she chases it, has her zoomies with it, and brings it back. The game's music: short
// notes only (nothing drones), with breaths between pieces.
// Run in Node, in about a second.
//
//   node tests/lily-house/run.mjs
import { makeClimb, GIRDERS, LADDERS, HAMMERS, CHICKEN, gy } from '../../src/activities/lily-house/climb.js';
import card from '../../src/activities/lily-house/card.js';
import { makeLily, makeChicken } from '../../src/activities/lily-house/moves.js';
import { makeComposer } from '../../src/activities/lily-house/music.js';
import { checker } from '../shared/check.mjs';

const { check, finish } = checker();
const none = { left: false, right: false, up: false, down: false, jump: false };
const run = (G, secs, input = none) => { for (let i = 0; i < secs * 60; i++) G.step(1 / 60, input); return G; };

// 1. the card
check("the card puts Lily's house on her ledge of the hydrant (lot 5)", card.lot === 5 && card.slot === undefined && typeof card.room === 'function' && /Lily/.test(card.name));
check('...and keeps nothing (nothing is saved)', card.keeps === undefined);

// 2. the level: every ladder stands on a girder and reaches the one above
const onG = (g, x) => x >= g.x0 && x <= g.x1;
check('every ladder joins its girder to the one above', LADDERS.every(l => GIRDERS[l.on + 1] && onG(GIRDERS[l.on], l.x) && onG(GIRDERS[l.on + 1], l.x)));
check('...and there is a way up that never needs a broken one', [0, 1, 2, 3, 4, 5].every(g => LADDERS.some(l => l.on === g && !l.broken)));

// 3. a game starts, and gets going
const G = makeClimb(7); G.start();
check('a game starts READY, then plays', G.state === 'ready' && run(G, 2).state === 'play');

// 4. each hammer: standing under it and jumping, she gets it; with it, she can't climb
for (const h of HAMMERS) {
  const T = makeClimb(3); T.start(); run(T, 2);
  Object.assign(T.lily, { g: h.on, x: h.x, y: gy(GIRDERS[h.on], h.x), air: false, climb: null });
  T.marbles.next = 99;   // (nothing thrown while she tries)
  T.step(1 / 60, { ...none, jump: true }); run(T, 1);
  check(`the hammer over girder ${h.on} can be reached with a jump`, T.lily.hammer > 0, `hammer ${T.lily.hammer.toFixed(1)}`);
  const ld = LADDERS.find(l => l.on === T.lily.g && !l.broken);
  Object.assign(T.lily, { x: ld.x, y: gy(GIRDERS[ld.on], ld.x) });
  run(T, 0.5, { ...none, up: true });
  check(`...and holding it she can't climb a ladder`, !T.lily.climb && T.lily.g === h.on);
}

// 5. reaching the chicken wins: the fanfare's cue, then the game's done
{
  const T = makeClimb(5); T.start(); run(T, 2);
  Object.assign(T.lily, { g: CHICKEN.on, x: CHICKEN.x, y: gy(GIRDERS[CHICKEN.on], CHICKEN.x), air: false, climb: null });
  T.step(1 / 60, none);
  const won = T.state === 'won' && T.events.includes('win');
  run(T, 5);
  check('reaching her chicken wins, then the game is done (and PLAY can start it again)', won && T.state === 'done' && T.score > 0, T.state);
}

// 6. a simple player, up the unbroken ladders, jumping anything coming at her, wins some of a few games
{
  let wins = 0;
  for (let s = 1; s <= 8; s++) {
    const T = makeClimb(s); T.start(); let cool = 0;
    for (let t = 0; t < 120 && T.state !== 'over' && T.state !== 'done'; t += 1 / 60) {
      const L = T.lily, input = { ...none };
      if (T.state === 'play' && !L.dying) {
        if (L.climb) input.up = true;
        else if (!L.air) {
          const goal = L.g === CHICKEN.on - 1 ? LADDERS.find(l => l.on === L.g) : L.g === CHICKEN.on ? { x: CHICKEN.x } : LADDERS.filter(l => l.on === L.g && !l.broken).sort((a, b) => Math.abs(a.x - L.x) - Math.abs(b.x - L.x))[0];
          if (Math.abs(goal.x - L.x) < 2 && L.g < CHICKEN.on) input.up = true; else if (goal.x > L.x) input.right = true; else input.left = true;
          const near = T.items.find(it => it.g === L.g && Math.abs(it.y - L.y) < 6 && Math.sign(L.x - it.x) === Math.sign(it.vx) && Math.abs(L.x - it.x) < 22 + Math.abs(it.vx) * 0.05);
          if (near && cool <= 0) { input.jump = true; cool = 0.1; }
        }
      }
      cool -= 1 / 60; T.step(1 / 60, input);
    }
    if (T.won) wins++;
  }
  check('a simple player wins some games out of eight (the level can be won)', wins >= 2, `${wins} of 8`);
}

// 7. the chicken, thrown across the living room: she chases it, zooms about with it, brings it back
{
  const L = makeLily(0, 2.5), C = makeChicken(), me = { x: 0, z: 3.5, yaw: 0, fx: 0, fz: -1 };
  L.mode = 'bounce';
  C.toss(me.x, 1.3, me.z - 0.5, 0, 0, -1); L.fetch();
  const seen = new Set(); let far = 0;
  for (let i = 0; i < 60 * 30 && !(seen.has('zoomies') && L.mode === 'bounce'); i++) {
    C.step(1 / 60); L.step(i / 60, 1 / 60, me, C); seen.add(L.mode);
    if (C.where === 'air') far = Math.max(far, Math.hypot(C.x - me.x, C.z - me.z));
  }
  check('a thrown chicken flies a good way; she chases it, has her zoomies, and brings it back to your feet',
    far > 3 && seen.has('chase') && seen.has('zoomies') && L.mode === 'bounce' && C.where === 'floor' && Math.hypot(C.x - me.x, C.z - me.z) < 1.3,
    JSON.stringify({ far: far.toFixed(1), modes: [...seen], now: L.mode, chicken: C.where }));
}

// 8. the game's music: every note short (nothing drones), a breath between pieces
{
  const M = makeComposer(() => 0.37), notes = [];
  for (let n = M.next(); n.at < 300; n = M.next()) notes.push(n);
  let breaths = 0; for (let i = 1; i < notes.length; i++) if (notes[i].at - notes[i - 1].at > 1.5) breaths++;
  const pieces = new Set(notes.map(n => n.piece)).size;
  check('the game\'s music: every note short, a breath between pieces', notes.every(n => n.len < 1) && breaths >= pieces - 1 && pieces > 1, `${pieces} pieces, ${notes.length} notes, ${breaths} breaths`);
}

finish();
