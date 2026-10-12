// Toots' House's headless checks: the card (the fourth plot outside the gate, nothing saved), that no
// picture of Toots ever has a front left leg (and her two side views are each drawn, not flipped), that
// fetch works in numbers on both floors (a throw comes back to your feet), that there's only ever one
// Toots (never at the window while you're in her house), her music, and that her roos decode to sound.
// Run in Node, in about a second.
//
//   node tests/toots-house/run.mjs
import { roomPoses, windowPoses, sideToots } from '../../src/activities/toots-house/toots-art.js';
import { makeBall, throwBall, stepBall, makeToots } from '../../src/activities/toots-house/fetch.js';
import { L2, ground } from '../../src/activities/toots-house/plan.js';
import { roo, CUTS } from '../../src/activities/toots-house/sounds/index.js';
import { makeWatcher } from '../../src/activities/toots-house/window.js';
import { makeComposer } from '../../src/activities/toots-house/music.js';
import card from '../../src/activities/toots-house/card.js';
import { checker } from '../shared/check.mjs';

const { check, finish } = checker();
function seeded(a) { return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// 1. the card
check("the card puts Toots' house on the fourth plot outside the gate, not on the landing", card.lot === 3 && card.slot === undefined && typeof card.room === 'function' && /Toots/.test(card.name));
check('...and keeps nothing (nothing is saved)', card.keeps === undefined);

// 2. her front left leg, never. Where her front legs go in each picture, counting the dots of each colour
// (her near legs are drawn in her black 'B', her far ones in the darker 'D').
const count = (pix, x0, x1, y0, y1, c) => { let n = 0; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (pix.d[y]?.[x] === c) n++; return n; };
const poses = roomPoses(), bad = [];
for (const [name, pix] of Object.entries(poses)) {
  // facing right you see her right side: the near front leg (black), and nothing behind it (no dark)
  if (name.startsWith('right') && (!count(pix, 40, 52, 37, 46, 'B') || count(pix, 40, 52, 37, 46, 'D'))) bad.push(name);
  // facing left you see her left side: no near front leg (black), just her right one behind (dark)
  if (name.startsWith('left') && (count(pix, 19, 31, 37, 46, 'B') || !count(pix, 19, 31, 37, 46, 'D'))) bad.push(name);
  // from the front: one leg on your left, nothing reaching the floor on your right
  if (name.startsWith('front') && (!count(pix, 15, 24, 56, 61, 'B') || count(pix, 26, 40, 56, 63, 'B') + count(pix, 26, 40, 56, 63, 'D'))) bad.push(name);
}
check('no picture of Toots inside has a front left leg (and each has her right one)', !bad.length && Object.keys(poses).length >= 20, bad.join(', ') || `${Object.keys(poses).length} pictures`);
const flip = sideToots(1).mirrored(), other = sideToots(-1);
check('...her two side views are each drawn, never one flipped (that would move the missing leg)', flip.d.some((r, y) => r.join('') !== other.d[y].join('')));
const win = windowPoses();
check('in the window, her one paw is on the sill, on your left', Object.values(win).every(p => count(p, 8, 20, 40, 47, 'B') > 10), `${Object.keys(win).length} pictures`);

// 3. fetch, in numbers: you throw, she chases it, picks it up and brings it to your feet
function fetch(you, dir, secs = 40) {
  const ball = makeBall(), dog = makeToots(), dt = 1 / 60;
  Object.assign(dog.t, { x: you.x + 1, y: you.y, z: you.z + 0.5 });
  ball.held = 'you';
  throwBall(ball, { x: you.x, y: you.y + 1.6, z: you.z }, dir);
  let far = 0;
  for (let i = 0; i < secs / dt; i++) {
    stepBall(ball, dt); dog.update(dt, you, ball);
    if (!ball.held) far = Math.max(far, Math.hypot(ball.x - you.x, ball.z - you.z));
    if (dog.t.fetched) break;
  }
  return { fetched: dog.t.fetched, back: Math.hypot(ball.x - you.x, ball.z - you.z), far, y: ball.y };
}
const down = fetch({ x: 2, y: 0, z: 3, yaw: Math.PI / 2 }, { x: 1, y: 0.1, z: 0 });
check('downstairs: a throw goes a good way, and Toots brings the ball back to your feet', down.fetched === 1 && down.far > 3 && down.back < 1.8, JSON.stringify(down));
const across = fetch({ x: 4, y: 0, z: -3, yaw: 0 }, { x: -0.6, y: 0.15, z: 0.8 });
check('...thrown across the room past the couch too', across.fetched === 1 && across.back < 1.8, JSON.stringify(across));
const up = fetch({ x: 2, y: L2, z: -1, yaw: -Math.PI / 2 }, { x: 1, y: 0.1, z: 0.2 });
check('upstairs too', up.fetched === 1 && up.back < 1.8 && up.y > L2, JSON.stringify(up));
check('the stairs join the floors: you can stand at the bottom, half way and the top', ground(-7.1, 3.0, 0.3) !== null && ground(-7.1, 0.5, L2 / 2) !== null && ground(-7.1, -2.2, L2) !== null);

// 4. only one Toots: inside her house she isn't at the window, and she comes back to it only once you've wandered off
{
  const w = makeWatcher(seeded(1)), dt = 1 / 30;
  let t = 0, pose;
  for (; t < 3; t += dt) pose = w(t, dt, { x: 0, z: 30 });
  const before = pose.sink;
  for (; t < 8; t += dt) pose = w(t, dt, { x: 0, z: 4 });
  const atDoor = pose.state;
  for (; t < 12; t += dt) pose = w(t, dt, { home: true });
  const inside = pose;
  for (; t < 13; t += dt) pose = w(t, dt, { x: 0, z: 5 });
  const outAgain = pose.state;
  for (; t < 20; t += dt) pose = w(t, dt, { x: 0, z: 30 });
  check('one Toots: walking up to her door she leaves the window, isn\'t in it while you\'re inside, and is back once you\'ve gone',
    before === 0 && atDoor === 'away' && inside.state === 'away' && inside.sink === 1 && outAgain === 'away' && pose.sink === 0, JSON.stringify({ before, atDoor, inside: inside.state, outAgain, last: pose.state }));
}

// 5. her music: an hour of it has barks in, rests between pieces, and never a note held on (nothing drones)
{
  const C = makeComposer(seeded(4)), notes = [];
  for (let n = C.next(); n.at < 3600; n = C.next()) notes.push(n);
  const barks = notes.filter(n => n.voice === 'bark'), pieces = new Set(notes.map(n => n.piece)).size;
  let rests = 0; for (let i = 1; i < notes.length; i++) if (notes[i].at - notes[i - 1].at > 5) rests++;
  check('her music: barks in every piece, a rest between pieces, every note short', barks.length >= pieces * 2 && rests >= pieces - 1 && notes.every(n => n.len <= 2.5) && barks.every(n => n.len < 0.3),
    `${pieces} pieces, ${barks.length} barks, ${rests} rests, ${notes.length} notes`);
}

// 6. her roos: real recordings, decoded to sound
const cuts = Array.from({ length: CUTS }, (_, i) => roo(i));
check('her roos decode to sound (a second or two each, not silent)', CUTS >= 1 && cuts.every(s => s.length > 11025 && s.length < 11025 * 4 && s.some(v => Math.abs(v) > 0.3)), cuts.map(s => s.length).join(', '));

finish();
