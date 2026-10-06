// Cats Only's headless checks: its card and door, the stampede in numbers (herd.js): every Sadie gets
// out of the front door by a way that never goes through the post or under the floor, the whole thing
// is over long before anyone could walk to the front door, nothing runs forever, and the meows are few,
// spaced out and never the same twice running (sounds/meow.js). Run in Node in a second or two.
//
//   node tests/cats-only/run.mjs
import card from '../../src/activities/cats-only/card.js';
import { COUNT, SPAWN, RUN, AFTER, LONGEST, MEOWS, MEOW_GAP, MEOW_TYPES, MEOW_PITCHES, POP, OUTSIDE_MAX, makeStampede, route, lengths, along, across } from '../../src/activities/cats-only/herd.js';
import { meow, press, pile, TYPES, PITCHES, LOUD } from '../../src/activities/cats-only/sounds/meow.js';
import { RATE } from '../../src/shared/retro.js';
import { checker } from '../shared/check.mjs';

const { check, finish } = checker();

// 1. the card: a room in the clubhouse, behind the seventh door, with its own door picture
check('the card is a room in the clubhouse', card.id === 'cats-only' && typeof card.room === 'function' && !card.start && !card.page);
const png = Buffer.from(card.door.split(',')[1] || '', 'base64');
const w = png.length > 24 ? png.readUInt32BE(16) : 0, h = png.length > 24 ? png.readUInt32BE(20) : 0;
check('its door is a 40 x 64 picture, like every door', card.door.startsWith('data:image/png;base64,') && w === 40 && h === 64, `${w} x ${h}`);
check('its door is the seventh on the landing (the room checker sees no other activity has it)', card.slot === 6);

// 2. the hall's numbers as hall.js makes them (its walls' distance, the post, the landing, the stairs),
// the door on the first landing's wall over the front door (wall 8), and the garden's side of the front door
const A = 8 * Math.cos(Math.PI / 16), STEPS = 22;
const shape = { wall: A, post: 1.16, landing: { inner: 5.7, y: 4.6, thick: 0.18, rail: 1 }, top: 9.2, stairs: { r0: 1.45, r1: 3.05, th0: -2.1, turn: 0.29, rise: 4.6 / STEPS, treads: 2 * STEPS } };
const geo = { shape, door: { x: 0, y: 4.6, z: -A, nx: 0, nz: 1 }, front: { x: 0, y: 0, z: -A, yaw: 0 }, out: { x: 0, y: 0.45, z: 0, yaw: Math.PI } };

// 3. the ways: for many lanes of each kind
let worst = { post: 9, below: 0, above: 0, end: 0 };
for (const kind of ['stairs', 'jump']) for (let i = 0; i < 200; i++) {
  const u = (i * 0.618) % 1, v = (i * 0.414) % 1, w = (i * 0.732) % 1, pts = route(geo, kind, u, v, w), cum = lengths(pts), len = cum[cum.length - 1];
  for (let s = 0; s <= len; s += 0.1) {
    const [x, y, z] = along(pts, cum, s);
    worst.post = Math.min(worst.post, Math.hypot(x, z) - shape.post);   // never closer to the post's middle than its radius
    if (!(y >= -0.001)) worst.below = Math.min(worst.below, y);
    if (!(y <= shape.landing.y + 1.3)) worst.above = Math.max(worst.above, y);
  }
  const end = pts[pts.length - 1]; worst.end = Math.max(worst.end, Math.abs(end[0] - geo.front.x) - 0.61, Math.abs(end[2] - geo.front.z), Math.abs(end[1]));
}
check('no Sadie ever runs through the scratching post', worst.post > 0.2, `closest ${worst.post.toFixed(2)} m outside it`);
check('nor under the floor or higher than a leap off the landing', worst.below >= -0.001 && worst.above === 0);
check('every way ends on the front door\'s threshold, on the floor, in the doorway\'s width', worst.end <= 0.01, `${worst.end.toFixed(2)} off`);

// 4. the stampede itself
for (const seed of [1, 2, 3, 7, 99]) {
  const S = makeStampede(geo, seed);
  check(`seed ${seed}: ${COUNT} Sadies, a whole herd`, S.runners.length === COUNT && COUNT >= 40);
  const first = Math.min(...S.runners.map(u => u.delay)), last = Math.max(...S.runners.map(u => u.delay));
  const late = S.runners.filter(u => u.delay > SPAWN / 2).length;
  check(`seed ${seed}: they pour out together (all within ${SPAWN} s, most in the first half), the front of the pile first`, first < 0.3 && last <= SPAWN && late < COUNT / 2);
  check(`seed ${seed}: each reaches the front door in ${RUN[0]} to ${RUN[1]} s: slow enough to see`, S.runners.every(u => u.time >= RUN[0] - 1e-9 && u.time <= RUN[1] + 1e-9 && u.speed > 3 && u.speed < 12));
  // run it at a phone's frame rate and at a bad one, as the game would
  let all = true, why = '';
  for (const dt of [1 / 60, 1 / 20, 0.1]) {
    const T = makeStampede(geo, seed); T.start(); let bad = 0, garden = 0, steps = 0, maxOn = 0, said = [];
    while (!T.over && steps++ < 2000) {
      said.push(...T.step(dt));
      for (const u of T.runners) if (u.on) {
        if (![u.x, u.y, u.z].every(Number.isFinite) || u.y < -0.001 || u.y > shape.landing.y + 2.2) bad++;
        if (u.where === 'garden') { garden++; if (Math.hypot(u.x - geo.out.x, u.z - geo.out.z) > OUTSIDE_MAX + 1) bad++; }
      }
      maxOn = Math.max(maxOn, T.runners.filter(u => u.on).length);
    }
    const ok1 = !bad && garden > 0 && T.over && steps < 2000 && maxOn >= COUNT - 5, ok2 = Math.abs(T.holdFor - (T.crossAt + AFTER)) < 1e-9 && T.holdFor + 1.2 <= LONGEST + 1e-9;
    if (!ok1 || !ok2) { all = false; why += ` [${Math.round(1 / dt)} fps: bad ${bad}, ${garden} in the garden, ${maxOn} at once, over ${T.over}]`; }
    // meows: few, spread out, a different one each time, one per cat
    const gaps = said.slice(1).map((m, i) => T.meows[i + 1].t - T.meows[i].t);
    if (!(T.meows.length <= MEOWS && T.meows.length >= 40 && gaps.every(g => g >= MEOW_GAP - 1e-9) && T.meows.every((m, i) => i === 0 || m.variant !== T.meows[i - 1].variant || m.pitch !== T.meows[i - 1].pitch)
      && new Set(T.meows.map(m => m.who)).size === T.meows.length && said.length === T.meows.length && T.meows.every(m => m.variant < MEOW_TYPES && m.pitch < MEOW_PITCHES) && new Set(T.meows.map(m => m.variant)).size === MEOW_TYPES && new Set(T.meows.map(m => m.pitch)).size === MEOW_PITCHES)) { all = false; why += ` [meows: ${T.meows.length}]`; }
    { const P = makeStampede(geo, seed); P.step(0.05);   // the pile: all of them in the little room, up to the ceiling, before anything is let go
      const hs = P.runners.map(u => u.pile[1] - geo.door.y);
      if (!(P.runners.every(u => u.on && u.where === 'hall') && Math.max(...hs) > 1.7 && Math.min(...hs) >= 0 && Math.max(...hs) < 2.1 && P.runners.every(u => Math.abs(u.pile[2] - geo.door.z) < 1.7 && Math.abs(u.pile[0] - geo.door.x) < 0.8))) { all = false; why += ' [pile]'; }
      // the end: every one still about puffs away over POP s, and none is left
      const E = makeStampede(geo, seed); E.start(); let st = 0; while (!E.over && st++ < 3000) E.step(dt);
      E.vanishAll(); const popping = E.runners.filter(u => u.on).every(u => u.dying > 0); let k = 0; while (E.left && k++ < 400) E.step(dt);
      if (!(popping && !E.left && k * dt <= POP + 0.2)) { all = false; why += ` [puff: ${popping}, ${k * dt} s]`; } }
    T.hide(); if (!T.runners.every(u => !u.on)) { all = false; why += ' [hide]'; }
  }
  check(`seed ${seed}: at 60, 20 and 10 frames a second: every Sadie finite and in bounds, some run out into the garden, it all ends; the front door is let go ${AFTER} s after the last one is through; a caterwaul of up to ${MEOWS} meows in every kind and pitch, ${MEOW_GAP} s or more apart, never the same one twice running, one per cat; the pile fills the closet before they go; hiding them hides them all`, all, why);
}

// 5. the whole thing is over in a bounded time (it no longer has to beat anyone to the front door: you may watch them go)
check(`the whole stampede takes at most ${LONGEST.toFixed(1)} s, door opening to the last puff`, LONGEST > SPAWN + RUN[1] && LONGEST < 15);

// 6. the doorway maths: out of the hall's front door and back again lands in the same place
{ const a = across(geo.front, geo.out, 0.7, -A + 3), b = across(geo.out, geo.front, a[0], a[1]);
  check('through the front door and back comes out where it started', Math.hypot(b[0] - 0.7, b[1] - (-A + 3)) < 1e-9);
  const t = across(geo.front, geo.out, 0.5, -A);   // on the threshold, half a metre across: the same spot on the garden's threshold
  check('the threshold is the same threshold on both sides', Math.hypot(t[0] - 0.5, t[1]) < 1e-9, t.map(n => n.toFixed(2)).join(', ')); }

// 7. the voices: eight different kinds of cat noise at six pitches, short, never loud, never clipped; the pile-up rush; the button one quiet thump
const meows = Array.from({ length: TYPES }, (_, i) => meow(i));
const peak = a => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
check('eight different meows, each under a second and a half even at the lowest pitch, none clipped', TYPES === MEOW_TYPES && PITCHES.length === MEOW_PITCHES && meows.every(a => a.length / RATE / Math.min(...PITCHES) < 1.6 && peak(a) <= 1 && peak(a) > 0.1) && new Set(meows.map(a => a.length + ':' + a[2000])).size === TYPES);
check('the pitches spread wide (a kitten to a tom), none the same', PITCHES.every((p, i) => i === 0 || p > PITCHES[i - 1]) && PITCHES[PITCHES.length - 1] / PITCHES[0] > 2);
check('they sit well below full volume (the game plays them at under a third)', LOUD.meow <= 0.3 && LOUD.press <= 0.35 && LOUD.pile <= 0.5);
const rush = pile();
check('the pile-out rush is one soft sound of a couple of seconds, not clipped', rush.length / RATE > 1.5 && rush.length / RATE < 3.5 && peak(rush) <= 1 && peak(rush) > 0.1);
check('the button\'s sound is one short soft thump', press().length / RATE < 0.3 && peak(press()) <= 1);
finish();
