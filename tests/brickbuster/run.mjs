// Brickbuster '96's headless checks: the game (game.js), its sounds (sound.js) and its cracks, run
// in Node with pretend players, seeded so every run is the same. A few seconds.
//
//   node tests/brickbuster/run.mjs
import { makeGame, step, launch, movePaddle, pushPaddle, save, load, W, H, R, PADDLE, CRACKS, SPEED, ROWS, COLS } from '../../src/activities/brickbuster/game.js';
import { crack, boing, blip, tock, tink, shatter, mute, RATE } from '../../src/activities/brickbuster/sound.js';
import { crackLines, pileSlots, heapZone } from '../../src/activities/brickbuster/room.js';

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failed++;
}
const DT = 1 / 60;

// A pretend player: `skill` 1 follows the ball perfectly (aiming off-centre now and then, to get a
// way through the bricks), 0 leaves the paddle where it is.
function play(seed, skill, secs, until) {
  const g = makeGame(seed); launch(g);
  let t = 0, out = false, slow = 0, events = [], aim = 0;
  for (; t < secs; t += DT) {
    if (skill) {
      if (Math.floor(t * 0.5) !== Math.floor((t - DT) * 0.5)) aim = (((seed * 7 + Math.floor(t)) % 5) - 2) * 0.22;
      pushPaddle(g, Math.max(-1, Math.min(1, (g.ball.x - aim - g.paddle) * 8)) * skill, DT);
    }
    for (const e of step(g, DT)) events.push({ ...e, t });
    const b = g.ball;
    if (b.x < R - 1e-9 || b.x > W - R + 1e-9 || b.y < R - 1e-9 || b.y > H - R + 1e-9) out = true;
    if (Math.abs(b.vy) < 0.3 * g.speed) slow++;
    if (until && until(g)) break;
  }
  return { g, t, out, slow, events };
}

// 1. the ball stays in the glass, and never gets stuck going sideways
{
  let out = 0, slow = 0, secs = 0, fast = 0;
  for (let s = 1; s <= 12; s++) {
    const r = play(s * 101, s % 3 === 0 ? 0 : 0.6 + (s % 4) * 0.1, 600);
    out += r.out; slow += r.slow; secs += r.t;
    fast = Math.max(fast, r.g.speed);
  }
  check('the yarn ball never gets out of the glass (for now)', !out, `${Math.round(secs / 60)} minutes of play`);
  check('...never gets stuck bouncing sideways', !slow);
  check(`...and speeds up with the bricks, but never past ${SPEED.most} m/s`, fast > SPEED.start && fast <= SPEED.most + 1e-9, `fastest ${fast.toFixed(2)} m/s`);
}

// 2. the paddle: straight up from its middle, off at an angle from its ends; a ball coming back up
// from the bottom goes through it
{
  const g = makeGame(5); launch(g); movePaddle(g, 2);
  const hit = x => { Object.assign(g.ball, { x, y: PADDLE.y + PADDLE.h / 2 + R + 0.05, vx: 0, vy: -4 }); return step(g, 0.05).find(e => e.type === 'paddle') && Math.atan2(g.ball.vx, g.ball.vy); };
  const mid = hit(2), end = hit(2 + PADDLE.w / 2 - 0.02), other = hit(2 - PADDLE.w / 2 + 0.02);
  check('the paddle sends the ball straight up from its middle', Math.abs(mid) < 0.02, `${(mid * 57.3).toFixed(0)} degrees`);
  check('...and off at an angle from its ends', end > 0.8 && other < -0.8, `${(end * 57.3).toFixed(0)} and ${(other * 57.3).toFixed(0)} degrees`);
  Object.assign(g.ball, { x: 2, y: PADDLE.y - PADDLE.h / 2 - R - 0.02, vx: 0, vy: 4 });
  check('...and a ball coming back up from the bottom goes through it', !step(g, 0.3).some(e => e.type === 'paddle') && g.ball.y > PADDLE.y + PADDLE.h / 2);
}

// 3. missing cracks the bottom of the glass: three cracks and it breaks, spilling every brick left
{
  const r = play(7, 0, 120);
  const cracks = r.events.filter(e => e.type === 'crack' && e.side === 'bottom'), br = r.events.filter(e => e.type === 'break');
  check('leaving the paddle alone cracks the bottom within a minute', cracks.length >= 1 && cracks[0].t < 60, cracks.length && `first after ${cracks[0].t.toFixed(1)} s`);
  check(`...${CRACKS} cracks, each worse than the last, and the glass breaks`, cracks.length === CRACKS && cracks.every((c, i) => c.level === i + 1) && br.length === 1 && br[0].why === 'bottom' && r.g.broken === 'bottom',
    `${cracks.length} cracks, levels ${cracks.map(c => c.level).join(' ')}, broke ${r.g.broken}`);
  const slots = r.events.filter(e => e.type === 'brick').map(e => e.slot).concat(br[0] ? br[0].spilled.map((k, j) => r.g.pile.length - br[0].spilled.length + j) : []);
  check('...each brick gets its own spot on the heap', new Set(slots).size === ROWS * COLS && slots.every(i => i >= 0 && i < ROWS * COLS));
  check('...every brick ends up on the floor, and nothing happens any more', r.g.bricks.every(k => !k.alive) && r.g.pile.length === ROWS * COLS && br[0].spilled.length > 0 && !step(r.g, 1).length,
    `${br[0]?.spilled.length} spilled out, ${r.g.pile.length} on the floor`);
}

// 4. playing well knocks a way through the bricks, and then the top cracks, three times
{
  const times = [], bottoms = [];
  for (const s of [3, 11, 29, 47, 83]) {
    const r = play(s, 1, 1800, g => g.broken);
    times.push(r.g.broken === 'top' ? r.t : Infinity);
    bottoms.push(r.g.cracks.bottom.length);
  }
  const worst = Math.max(...times);
  check('a good player breaks through the top: three cracks there, and it breaks', isFinite(worst), times.map(t => isFinite(t) ? (t / 60).toFixed(1) + ' min' : 'never').join(', '));
  // (this pretend player never misses and aims for the gaps: a person takes a good few minutes)
  check('...not in the first half minute, and within half an hour', Math.min(...times) > 30 && worst < 1800);
  check('...hardly ever missing on the way', Math.max(...bottoms) <= 1, `bottom cracks ${bottoms.join(' ')}`);
}

// 5. bricks: knocking one out scores it and drops it on the floor; the very last one breaks the glass
{
  const g = makeGame(9); launch(g);
  const k = g.bricks.find(b => b.row === ROWS - 1);
  Object.assign(g.ball, { x: k.x + k.w / 2, y: k.y - R - 0.02, vx: 0, vy: 4 });
  const ev = step(g, 0.05);
  check('knocking out a brick scores it, bounces the ball back and drops it on the floor', !k.alive && g.score > 0 && g.ball.vy < 0 && ev.some(e => e.type === 'brick' && e.brick === k) && g.pile.join() === String(k.row));
  const b5 = g.bricks.find(b => b.row === ROWS - 1 && b.col === 5);
  for (const b of g.bricks) b.alive = b === b5;
  Object.assign(g.ball, { x: b5.x + b5.w / 2, y: b5.y - R - 0.02, vx: 0, vy: 4 });
  const last = step(g, 0.05).find(e => e.type === 'break');
  check('...and knocking out the very last one breaks the glass (so it always breaks in the end)', last?.why === 'cleared' && g.broken === 'cleared' && !last.spilled.length && g.bricks.every(b => !b.alive));
}

// 6. what's kept between visits
{
  const r = play(13, 0.8, 200, g => g.pile.length >= 12);
  const copy = load(makeGame(99), JSON.parse(JSON.stringify(save(r.g))));
  check('the bricks, the heap on the floor, the cracks and the score are kept between visits',
    save(copy).bricks === save(r.g).bricks && copy.pile.join() === r.g.pile.join() && copy.pile.length > 0 && JSON.stringify(copy.cracks) === JSON.stringify(r.g.cracks) && copy.score === r.g.score && copy.serving && !copy.broken,
    `${copy.bricks.filter(b => b.alive).length} bricks, ${copy.cracks.top.length} + ${copy.cracks.bottom.length} cracks, score ${copy.score}`);
  let ok = true;
  for (const junk of [null, 5, 'x', {}, { bricks: 'short', cracks: { top: [{ x: 'no' }, 1] }, score: -3 }, { cracks: { bottom: Array(9).fill({ x: 1, seed: 2 }) } }]) {
    try { const g = load(makeGame(1), junk); if (g.cracks.bottom.length > CRACKS || g.score < 0 || g.bricks.length !== ROWS * COLS) ok = false; } catch { ok = false; }
  }
  check('...and a broken save never breaks the game', ok);
  const b = play(7, 0, 120).g, again = load(makeGame(3), JSON.parse(JSON.stringify(save(b))));
  check('once broken, it stays broken', again.broken === 'bottom' && again.bricks.every(k => !k.alive) && again.pile.length === ROWS * COLS && !step(again, 1).length);
}

// 7. the sounds: 8-bit, 11 kHz, never silent, never past full volume; the cracks get worse
{
  const stats = a => {
    let peak = 0, sum = 0, bits = true;
    for (const v of a) { peak = Math.max(peak, Math.abs(v)); sum += v * v; if (Math.abs(v * 127 - Math.round(v * 127)) > 1e-4) bits = false; }
    return { peak, rms: Math.sqrt(sum / a.length), bits, secs: a.length / RATE };
  };
  const c = [1, 2, 3].map(l => stats(crack(l)));
  const sh = stats(shatter()), mu = stats(mute());
  const all = [...c, stats(boing(0)), stats(boing(1)), stats(blip(0)), stats(blip(5)), stats(tock()), stats(tink()), sh, mu];
  check('every sound is 8-bit, loud enough, and never past full volume', all.every(s => s.bits && s.peak > 0.2 && s.peak <= 1 && s.rms > 0.01), all.map(s => s.peak.toFixed(2)).join(' '));
  check('each crack is longer than the one before, the third a big one', c[0].secs < c[1].secs && c[1].secs < c[2].secs && c[2].secs > 1.5, c.map(s => s.secs.toFixed(2) + ' s').join(', '));
  check('...and louder', c[0].rms < c[2].rms, c.map(s => s.rms.toFixed(3)).join(' < '));
  check('the glass breaking is the biggest sound of all', sh.secs > c[2].secs && sh.rms > c[2].rms, `${sh.secs.toFixed(2)} s, ${sh.rms.toFixed(3)}`);
  check('the same crack sounds the same every time', crack(2).every((v, i) => v === crack(2)[i]));
}

// 8. the cracks' drawing: inside the glass, bigger each time, the same every time from its seed
{
  const dots = (level, side, seed = 42) => {
    const pts = [];
    crackLines({ set fillStyle(c) {}, fillRect: (x, y) => pts.push([x, y]) }, { x: 1.3, seed }, level, side, 84, 132);
    return pts;
  };
  const n = [1, 2, 3].map(l => new Set(dots(l, 'top').map(p => p.join())).size);
  const inside = [1, 2, 3].every(l => ['top', 'bottom'].every(s => dots(l, s).every(([x, y]) => x >= -1 && x <= 85 && y >= -1 && y <= 133)));
  check('each crack drawn is bigger than the last', n[0] < n[1] && n[1] < n[2], n.join(' < ') + ' dots');
  check('...stays on the glass, and draws the same from its seed', inside && dots(3, 'bottom').join() === dots(3, 'bottom').join() && dots(3, 'bottom', 7).join() !== dots(3, 'bottom').join());
}

// 9. the heap on the floor: a spot for every brick, where nobody walks, filled from the floor up
{
  const spots = pileSlots();
  const apart = spots.every((a, i) => spots.every((b, j) => i === j || a.layer !== b.layer || Math.hypot(a.x - b.x, a.z - b.z) > 0.25));
  check(`the heap has a spot for every brick (${ROWS * COLS}), none on top of another`, spots.length === ROWS * COLS && apart);
  check('...all where nobody needs to walk', spots.every(p => heapZone(p.x, p.z)));
  const held = spots.every((p, i) => p.layer === 0 || spots.slice(0, i).some(q => q.layer === p.layer - 1 && Math.hypot(p.x - q.x, p.z - q.z) < 0.45));
  check('...and filled from the floor up: no brick lands on thin air', held);
}

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
