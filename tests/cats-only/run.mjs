// Cats Only's headless checks: its card and door, the stampede in numbers (herd.js): every Sadie gets
// out of the front door by a way that never goes through the post or under the floor, the whole thing
// is over long before anyone could walk to the front door, nothing runs forever, and the meows are few,
// spaced out and never the same twice running (sounds/meow.js). Run in Node in a second or two.
//
//   node tests/cats-only/run.mjs
import card from '../../src/activities/cats-only/card.js';
import { COUNT, SPAWN, RUN, AFTER, LONGEST, MEOWS, MEOW_GAP, MEOW_VARIANTS, OUTSIDE_MAX, makeStampede, route, lengths, along, across } from '../../src/activities/cats-only/herd.js';
import { meow, press, VARIANTS, LOUD } from '../../src/activities/cats-only/sounds/meow.js';
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
const PLAYER = 3.2;   // how fast you walk (m a second)

// 3. the ways: for many lanes of each kind
let worst = { post: 9, below: 0, above: 0, end: 0 }, shortest = 1e9;
for (const kind of ['stairs', 'jump']) for (let i = 0; i < 200; i++) {
  const u = (i * 0.618) % 1, v = (i * 0.414) % 1, w = (i * 0.732) % 1, pts = route(geo, kind, u, v, w), cum = lengths(pts), len = cum[cum.length - 1];
  for (let s = 0; s <= len; s += 0.1) {
    const [x, y, z] = along(pts, cum, s);
    worst.post = Math.min(worst.post, Math.hypot(x, z) - shape.post);   // never closer to the post's middle than its radius
    if (!(y >= -0.001)) worst.below = Math.min(worst.below, y);
    if (!(y <= shape.landing.y + 1.3)) worst.above = Math.max(worst.above, y);
  }
  const end = pts[pts.length - 1]; worst.end = Math.max(worst.end, Math.abs(end[0] - geo.front.x) - 0.61, Math.abs(end[2] - geo.front.z), Math.abs(end[1]));
  if (kind === 'stairs') shortest = Math.min(shortest, len);
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
  check(`seed ${seed}: they pour out together (all within ${SPAWN} s, most in the first half), none waits`, first === 0 && last <= SPAWN && late < COUNT / 2);
  check(`seed ${seed}: each reaches the front door in ${RUN[0]} to ${RUN[1]} s: fast`, S.runners.every(u => u.time >= RUN[0] - 1e-9 && u.time <= RUN[1] + 1e-9 && u.speed > 8));
  // run it at a phone's frame rate and at a bad one, as the game would
  let all = true, why = '';
  for (const dt of [1 / 60, 1 / 20, 0.1]) {
    const T = makeStampede(geo, seed); let bad = 0, garden = 0, steps = 0, maxOn = 0, said = [];
    while (!T.over && steps++ < 2000) {
      said.push(...T.step(dt));
      for (const u of T.runners) if (u.on) {
        if (![u.x, u.y, u.z].every(Number.isFinite) || u.y < -0.001 || u.y > shape.landing.y + 1.5) bad++;
        if (u.where === 'garden') { garden++; if (Math.hypot(u.x - geo.out.x, u.z - geo.out.z) > OUTSIDE_MAX + 1) bad++; }
      }
      maxOn = Math.max(maxOn, T.runners.filter(u => u.on).length);
    }
    const ok1 = !bad && garden > 0 && T.over && steps < 2000 && maxOn > 40, ok2 = Math.abs(T.holdFor - (T.crossAt + AFTER)) < 1e-9 && T.holdFor + 1.2 <= LONGEST + 1e-9;
    if (!ok1 || !ok2) { all = false; why += ` [${Math.round(1 / dt)} fps: bad ${bad}, ${garden} in the garden, ${maxOn} at once, over ${T.over}]`; }
    // meows: few, spread out, a different one each time, one per cat
    const gaps = said.slice(1).map((m, i) => T.meows[i + 1].t - T.meows[i].t);
    if (!(T.meows.length <= MEOWS && T.meows.length >= 4 && gaps.every(g => g >= MEOW_GAP - 1e-9) && T.meows.every((m, i) => i === 0 || m.variant !== T.meows[i - 1].variant)
      && new Set(T.meows.map(m => m.who)).size === T.meows.length && said.length === T.meows.length && T.meows.every(m => m.variant < MEOW_VARIANTS))) { all = false; why += ` [meows: ${T.meows.length}]`; }
    T.hide(); if (!T.runners.every(u => !u.on)) { all = false; why += ' [hide]'; }
  }
  check(`seed ${seed}: at 60, 20 and 10 frames a second: every Sadie finite and in bounds, some run out into the garden, it all ends; the front door is let go ${AFTER} s after the last one is through; at most ${MEOWS} meows, ${MEOW_GAP} s or more apart, never the same twice running, one per cat; hiding them hides them all`, all, why);
}

// 5. nobody can walk to the front door before they've vanished: even the quickest way from the
// little room's door (the stairs) takes you much longer than the whole thing does, door shut and all
const walkSecs = shortest / PLAYER;
check(`the whole stampede (${LONGEST.toFixed(1)} s at most) is over long before the quickest walk to the front door (${walkSecs.toFixed(1)} s)`, LONGEST < walkSecs * 0.75, `${LONGEST.toFixed(1)} s against ${walkSecs.toFixed(1)} s`);

// 6. the doorway maths: out of the hall's front door and back again lands in the same place
{ const a = across(geo.front, geo.out, 0.7, -A + 3), b = across(geo.out, geo.front, a[0], a[1]);
  check('through the front door and back comes out where it started', Math.hypot(b[0] - 0.7, b[1] - (-A + 3)) < 1e-9);
  const t = across(geo.front, geo.out, 0.5, -A);   // on the threshold, half a metre across: the same spot on the garden's threshold
  check('the threshold is the same threshold on both sides', Math.hypot(t[0] - 0.5, t[1]) < 1e-9, t.map(n => n.toFixed(2)).join(', ')); }

// 7. the voices: six different small meows, short, never loud, never clipped; the button one quiet click
const meows = Array.from({ length: VARIANTS }, (_, i) => meow(i));
const peak = a => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
check('six different meows, each under a second, none clipped', VARIANTS === MEOW_VARIANTS && meows.every(a => a.length / RATE < 1 && peak(a) <= 1 && peak(a) > 0.1) && new Set(meows.map(a => a.length + ':' + a[2000])).size === VARIANTS);
check('they sit well below full volume (the game plays them at under a third)', LOUD.meow <= 0.3 && LOUD.press <= 0.35);
check('the button\'s sound is one short soft thump', press().length / RATE < 0.3 && peak(press()) <= 1);
finish();
