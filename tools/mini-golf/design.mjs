// Works out a hole's pins and winning shots, the owner's way round: the shots first, then the pins
// put where they roll. `node tools/mini-golf/design.mjs [hole id]` prints what to put in the hole's
// file (holes/<id>.js: `pins` and `shots`); it doesn't change anything itself.
//
// 1. The trick shot: one shot from the tee whose path runs a long way round without coming near the
//    hole. Three pins go along it: far apart, each in a different part of the hole, and at least one
//    further from the tee than the hole is. (Best of all, after the third pin it rolls on into the
//    hole: a hole in one.)
// 2. The normal way round: shot by shot from the tee, each blasting exactly one of those pins and
//    stopping clear of the tentacles, then one into the hole.
//
// Every search is a fixed grid of aims, strengths and clocks, so it always finishes; if nothing on
// the grid works it says so (and the hole's shape or hills need a change).
import { HOLES } from '../../src/activities/mini-golf/holes/index.js';
import { newPlay, playShot, edge, height, pinsLeft, R } from '../../src/activities/mini-golf/course.js';

const only = process.argv[2];
const GAP = 20;          // pins at least this far apart (plan units)
const AREA = 450;        // and the triangle between them at least this big (square plan units)
const ANGLES = 240, POWERS = [...Array(15)].map((_, i) => 0.3 + i * 0.05), CLOCKS = [0, 2.5, 5, 7.5];

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// a shot from (x, y) on a copy of the hole with the given pins (standing as `standing` says)
function trial(hole, from, pins, standing, shot) {
  const h = { ...hole, pins };
  const pl = newPlay(h);
  pl.pins = standing.slice();
  Object.assign(pl.ball, { x: from[0], y: from[1] });
  const r = playShot(pl, shot);
  return { pl, ...r };
}

// where a pin can go: on the ground well inside the green, clear of the tee and the hole's reach
function pinSpot(hole, p) {
  if (!hole.zone(p[0], p[1])) return false;
  if (edge(hole, p[0], p[1]) > -5) return false;
  if (dist(p, hole.tee) < 16 || dist(p, hole.cup) < hole.reach + 4) return false;
  const b = hole.bridge;
  if (b && p[0] > b.x0 - 3 && p[0] < b.x1 + 3 && p[1] > b.yHigh - 3 && p[1] < b.yLow + 3) return false;
  return true;
}

function designTrick(hole) {
  const best = [];
  for (const clock of CLOCKS) for (let i = 0; i < ANGLES; i++) for (const power of POWERS) {
    const shot = [i / ANGLES * Math.PI * 2, power, clock];
    // (with pins nowhere near, standing: the tentacles grab, and the path is what the trick shot does)
    const { events, path, pl } = trial(hole, hole.tee, [[-99, -99]], [true], shot);
    const grabbed = events.some(e => e.type === 'grab');
    // the path up to the moment it'd come within the hole's reach
    let upto = path.length;
    for (let k = 0; k < path.length; k++) if (dist(path[k], hole.cup) < hole.reach + 1) { upto = k; break; }
    const pts = path.slice(0, upto).filter(p => pinSpot(hole, p) && !onDeck(hole, p, path, pl));
    if (pts.length < 3) continue;
    // three spots in order along the path, far apart, in different parts, one beyond the hole
    const pick = pickThree(hole, pts);
    if (pick) best.push({ shot, pins: pick, grabbed, length: upto });
  }
  // the ones that end up in the hole once the pins are gone (a hole in one) first, then the longest
  const scored = [];
  for (const c of best.sort((a, b) => b.length - a.length).slice(0, 400)) {
    const { events, pl } = trial(hole, hole.tee, c.pins, [true, true, true], c.shot);
    const blasted = events.filter(e => e.type === 'blast').length;
    if (blasted !== 3 || events.some(e => e.type === 'grab')) continue;
    // (a trick shot should be tricky: off a few walls on the way)
    const third = events.findIndex(e => e.type === 'blast' && e.trick);
    const bounces = events.slice(0, third).filter(e => e.type === 'wall').length;
    scored.push({ ...c, sunk: pl.sunk, bounces, rest: [pl.ball.x, pl.ball.y] });
  }
  scored.sort((a, b) => (b.sunk - a.sunk) || (Math.min(b.bounces, 4) - Math.min(a.bounces, 4)) || (b.length - a.length));
  return scored[0] || null;
}
// (a point on the bridge's deck isn't somewhere a pin can stand)
function onDeck(hole, p) {
  const b = hole.bridge;
  return b && p[0] > b.x0 - 2 && p[0] < b.x1 + 2 && p[1] > b.yHigh - 2 && p[1] < b.yLow + 2;
}
function pickThree(hole, pts) {
  const beyond = p => dist(p, hole.tee) > dist(hole.cup, hole.tee);
  // try spots spread along the path: the first good one, then the next far enough on, and so on
  for (let a = 0; a < pts.length; a += 2) for (let b = a + 1; b < pts.length; b += 2) {
    if (dist(pts[a], pts[b]) < GAP || hole.zone(...pts[a]) === hole.zone(...pts[b])) continue;
    for (let c = b + 1; c < pts.length; c += 2) {
      const t = [pts[a], pts[b], pts[c]];
      if (dist(t[0], t[2]) < GAP || dist(t[1], t[2]) < GAP) continue;
      if (new Set(t.map(p => hole.zone(...p))).size < 3) continue;
      if (!t.some(beyond)) continue;
      // (spread round the hole, not in a line along one side: a triangle with some room in it)
      if (Math.abs((t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) - (t[2][0] - t[0][0]) * (t[1][1] - t[0][1])) / 2 < AREA) continue;
      return t.map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]);
    }
  }
  return null;
}

// The normal way round: a few at a time (the best few of each step tried in turn), so it always ends.
function designNormal(hole, pins) {
  const shots = [];
  function search(from, standing, depth) {
    if (depth > 6) return false;
    const left = standing.filter(Boolean).length;
    const found = [];
    for (const clock of [0, 5]) for (let i = 0; i < ANGLES; i++) for (const power of POWERS.concat([0.12, 0.18, 0.24])) {
      const shot = [i / ANGLES * Math.PI * 2, power, clock];
      const { events, pl } = trial(hole, from, pins, standing, shot);
      if (events.some(e => e.type === 'grab')) continue;
      const blasts = events.filter(e => e.type === 'blast').length;
      if (left && blasts !== 1) continue;
      if (!left && !pl.sunk) continue;
      if (left === 1 || !left) { if (pl.sunk) return shots.push(shot), true; if (!left) continue; }
      const rest = [pl.ball.x, pl.ball.y];
      if (dist(rest, hole.cup) < hole.reach + 3 || edge(hole, ...rest) > -R - 0.5) continue;
      found.push({ shot, standing: pl.pins.slice(), rest, power });
      if (found.length > 40) break;
    }
    // softer shots that leave the ball somewhere easy first
    found.sort((a, b) => a.power - b.power);
    for (const f of found.slice(0, 5)) {
      shots.push(f.shot);
      if (search(f.rest, f.standing, depth + 1)) return true;
      shots.pop();
    }
    return false;
  }
  return search(hole.tee, pins.map(() => true), 0) ? shots : null;
}

const r4 = x => +x.toFixed(4);
for (const hole of HOLES) {
  if (only && hole.id !== only) continue;
  const t0 = Date.now();
  const trick = designTrick(hole);
  if (!trick) { console.log(`${hole.id}: no trick shot found on the grid`); continue; }
  const normal = designNormal(hole, trick.pins);
  console.log(`\n${hole.id} (${((Date.now() - t0) / 1000).toFixed(1)} s): trick shot ${trick.sunk ? 'goes in (a hole in one)' : 'blasts all three, then stops'} after ${trick.bounces} walls; normal way round ${normal ? normal.length + ' shots' : 'NOT FOUND'}`);
  console.log(`  pins: ${JSON.stringify(trick.pins)},  // zones ${trick.pins.map(p => hole.zone(...p)).join(', ')}`);
  console.log(`  shots: { normal: ${JSON.stringify((normal || []).map(s => s.map(r4)))}, trick: ${JSON.stringify([trick.shot.map(r4)])} },`);
}
