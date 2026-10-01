// Sadie's Mini Golf's headless checks: the engine (course.js) on every hole (holes/), replaying the
// recorded winning shots, plus the rules, the sounds and the card. Run in Node, in a few seconds.
//
//   node tests/mini-golf/run.mjs
import { HOLES } from '../../src/activities/mini-golf/holes/index.js';
import { newPlay, playShot, playRoute, edge, inside, height, pinsLeft, R, VMAX } from '../../src/activities/mini-golf/course.js';
import { ALL } from '../../src/activities/mini-golf/sounds.js';
import { scoreName, withScore, KEY } from '../../src/activities/mini-golf/room.js';
import card from '../../src/activities/mini-golf/card.js';
import { GROUNDS } from '../../src/clubhouse/outside.js';

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failed++;
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const blasts = log => log.events.filter(e => e.type === 'blast');
const grabbed = log => log.events.some(e => e.type === 'grab');

for (const hole of HOLES) {
  const h = hole.id;
  // the way round: one pin a shot, then in, never grabbed
  const normal = playRoute(hole, hole.shots.normal);
  const perShot = normal.log.map(l => blasts(l).length);
  check(`${h}: the recorded way round wins (one pin a shot, then in)`, normal.pl.sunk && !pinsLeft(normal.pl) && normal.log.every(l => !grabbed(l)) && perShot.slice(0, -1).every(n => n === 1),
    `${normal.pl.strokes} strokes, pins per shot ${perShot.join(' ')}, par ${hole.par}`);
  check(`${h}: ...in no more than par`, normal.pl.sunk && normal.pl.strokes <= hole.par, `${normal.pl.strokes} strokes, par ${hole.par}`);
  // Sadie's trick shot: all three pins in one shot, and in (a hole in one)
  const trick = playRoute(hole, hole.shots.trick), first = trick.log[0];
  check(`${h}: the trick shot blasts all three pins in one go`, blasts(first).length === 3 && blasts(first).some(e => e.trick) && !grabbed(first));
  check(`${h}: ...and goes in: a hole in one`, trick.pl.sunk && trick.pl.strokes === 1);
  check(`${h}: ...off at least one wall on the way (it's a trick shot)`, first.events.some(e => e.type === 'wall'));

  // the pins: spread round the hole (the owner's rules), clear of the tentacles
  const p = hole.pins, zones = p.map(q => hole.zone(...q));
  const gaps = [dist(p[0], p[1]), dist(p[0], p[2]), dist(p[1], p[2])];
  check(`${h}: three pins, far apart`, p.length === 3 && Math.min(...gaps) >= 20, gaps.map(g => g.toFixed(0)).join(', '));
  check(`${h}: ...each in a different part of the hole`, zones.every(Boolean) && new Set(zones).size === 3, zones.join(', '));
  check(`${h}: ...at least one beyond the hole`, p.some(q => dist(q, hole.tee) > dist(hole.cup, hole.tee)));
  check(`${h}: ...all on the green, out of the tentacles' reach`, p.every(q => edge(hole, ...q) < -3 && dist(q, hole.cup) > hole.reach + 2));

  // a pin never changes the ball's path: the trick shot with its pins, and with none anywhere, go
  // exactly the same way (up to the hole's reach, where the tentacles do as the pins say)
  const withPins = newPlay(hole), noPins = newPlay({ ...hole, pins: [[-99, -99], [-99, -99], [-99, -99]] });
  const a = playShot(withPins, hole.shots.trick[0]).path, b = playShot(noPins, hole.shots.trick[0]).path;
  let same = true;
  for (let k = 0; k < Math.min(a.length, b.length); k++) {
    if (dist(a[k], hole.cup) < hole.reach + 1) break;
    if (dist(a[k], b[k]) > 1e-9) { same = false; break; }
  }
  check(`${h}: a pin never changes where the ball goes (it's BLASTED)`, same);

  // the tentacles: a ball rolled at the hole while a pin's up is grabbed and goes back to the tee, a
  // stroke more; with every pin down it's pulled in
  let grab = null, pull = null;
  for (let k = 0; k < 16 && !(grab && pull); k++) {
    const ang = k / 16 * Math.PI * 2, from = [hole.cup[0] + Math.cos(ang) * (hole.reach + 3), hole.cup[1] + Math.sin(ang) * (hole.reach + 3)];
    if (edge(hole, ...from) > -R - 1) continue;
    const toward = Math.atan2(hole.cup[1] - from[1], hole.cup[0] - from[0]);
    const g = newPlay(hole); Object.assign(g.ball, { x: from[0], y: from[1] });
    const ge = playShot(g, [toward, 0.12, 0]).events;
    if (!grab && ge.some(e => e.type === 'grab')) grab = { strokes: g.strokes, at: [g.ball.x, g.ball.y], sunk: g.sunk };
    const f = newPlay(hole); f.pins = f.pins.map(() => false); Object.assign(f.ball, { x: from[0], y: from[1] });
    const fe = playShot(f, [toward, 0.12, 0]).events;
    if (!pull && f.sunk) pull = { pulled: fe.some(e => e.type === 'pull') };
  }
  check(`${h}: while a pin's up, the tentacles grab the ball: back to the tee, a stroke more`, grab && grab.strokes === 2 && dist(grab.at, hole.tee) < 1e-9 && !grab.sunk, JSON.stringify(grab));
  check(`${h}: ...once they're all down, they pull it in`, pull && pull.pulled, JSON.stringify(pull));

  // every shot ends (a ball can't roll forever), from anywhere, however hard
  let longest = 0, n = 0, r = 7;
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  while (n < 150) {
    const x = rnd() * 100, y = rnd() * 140;
    if (!inside(hole, x, y) || edge(hole, x, y) > -R - 0.5) continue;
    const pl = newPlay(hole); Object.assign(pl.ball, { x, y });
    playShot(pl, [rnd() * Math.PI * 2, rnd(), rnd() * 10]);
    longest = Math.max(longest, pl.shotTime); n++;
  }
  check(`${h}: every shot ends, wherever it's hit from and however hard`, longest <= 30.01, `longest ${longest.toFixed(1)} s of 150`);
}

// the sounds: short, soft and finished (no clicks, nothing past full)
for (const [name, make] of Object.entries(ALL)) {
  const s = make();
  const ok = s.length > 0 && s.length < 2.2 * 11025 && s.every(v => Number.isFinite(v) && Math.abs(v) <= 1) && Math.abs(s[s.length - 1]) < 0.02;
  check(`sound ${name}: short and well-made`, ok, `${(s.length / 11025).toFixed(2)} s`);
}

// the scores: their names, and the best kept (never a worse one over a better)
check('a score has its 90s name', scoreName(1, 4) === 'HOLE IN ONE!!!' && scoreName(3, 4) === 'BIRDIE!' && scoreName(4, 4) === 'PAR' && scoreName(5, 4) === 'BOGEY');
const b1 = withScore({ holes: {}, trick: false }, 'doughnut', 5), b2 = withScore(b1, 'doughnut', 3), b3 = withScore(b2, 'doughnut', 6);
check('...and only the best one is kept', b1.holes.doughnut === 5 && b2.holes.doughnut === 3 && b3.holes.doughnut === 3);

// the card: in the backyard (the grounds' second spot), its save erased by the pause menu's START OVER
check('the card puts it in the backyard, and START OVER can erase its scores', card.grounds === 1 && GROUNDS[1] && card.keeps.some(k => KEY.startsWith(k)) && card.room);
// (each hole fits in the backyard: inside the fence, behind the house)
for (const hole of HOLES) {
  const f = hole.at.flip ? -1 : 1, xs = [hole.at.x, hole.at.x + f * 100 * 0.075], zs = [hole.at.z, hole.at.z + 140 * 0.075];
  check(`${hole.id}: fits in the backyard`, Math.min(...xs) > -28.5 && Math.max(...xs) < 28.5 && Math.min(...zs) > 10.5 && Math.max(...zs) < 43.5, `x ${xs.map(v => v.toFixed(1))}, z ${zs.map(v => v.toFixed(1))}`);
}

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
