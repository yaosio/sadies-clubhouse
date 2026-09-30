// Brickbuster '96's headless checks: the game (game.js), its sounds (sounds/) and its cracks, run
// in Node with pretend players, seeded so every run is the same. A few seconds.
//
//   node tests/brickbuster/run.mjs
import { makeGame, step, launch, movePaddle, pushPaddle, save, load, W, H, R, PADDLE, CRACKS, SPEED, ROWS, COLS } from '../../src/activities/brickbuster/game.js';
import { RATE } from '../../src/activities/brickbuster/sounds/retro.js';
import { crack, shatter, tink } from '../../src/activities/brickbuster/sounds/glass.js';
import { boing, blip, tock } from '../../src/activities/brickbuster/sounds/machine.js';
import { mute } from '../../src/activities/brickbuster/sounds/quiet.js';
import { pat, chirp, trill, meow, makeChatter, VARIANTS, CHATTER, LOUD } from '../../src/activities/brickbuster/sounds/sadie.js';
import { crackLines, pileSlots, heapZone } from '../../src/activities/brickbuster/room.js';
import { makeLoose, release, stepLoose, floorBelow, R as LR } from '../../src/activities/brickbuster/loose.js';

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
  // Sadie's: 8-bit too, short, softer than the case's sounds, and each version a bit different
  const cat = { pat, chirp, trill, meow }, versions = Object.entries(cat).flatMap(([k, f]) => [...Array(VARIANTS)].map((_, v) => ({ k, v, a: f(v), s: stats(f(v)) })));
  check("Sadie's sounds are 8-bit, never silent, short", versions.every(x => x.s.bits && x.s.peak > 0.2 && x.s.peak <= 1 && x.s.rms > 0.01 && x.s.secs < 1), versions.map(x => x.k + x.v + ' ' + x.s.secs.toFixed(2) + ' s').filter((_, i) => i % VARIANTS === 0).join(', '));
  check('...and as loud as they play, softer than the smallest crack even right next to her', versions.every(x => x.s.rms * LOUD[x.k] < c[0].rms), versions.map(x => (x.s.rms * LOUD[x.k]).toFixed(3)).filter((_, i) => i % VARIANTS === 0).join(' ') + ' < ' + c[0].rms.toFixed(3));
  check('...and each of her versions sounds a bit different', Object.keys(cat).every(k => new Set(versions.filter(x => x.k === k).map(x => x.a.join())).size === VARIANTS));
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

// 10. loose in the hall: the yarn ball bounces round for ever and Sadie keeps whacking it off again
{
  // the hall's shape, as hall.js hands it over (a copy: these tests don't load the mansion; the
  // browser checks use the real one)
  const A = 8 * Math.cos(Math.PI / 16);
  const shape = { wall: A, post: 1.16, landing: { inner: 8 - 2.3, y: 4.6, thick: 0.18, rail: 1.0 }, top: 9.2,
    stairs: { r0: 1.45, r1: 3.05, th0: -2.1, turn: 0.29, rise: 4.6 / 22, treads: 26 },
    blocks: [{ x: -2.4, z: -6.9, r: 0.8 }, { x: -5.4, z: -4.5, r: 0.35 }, { x: 5.3, z: 2.0, r: 0.65 }].map(b => ({ ...b, h: 1.0 })) };
  const chat = { pat: 0, chirp: 0, trill: 0, meow: 0 }, said = [];
  let catThrough = 0, lazy = 0, away = 0, outside = 0, inSlab = 0, catOff = 0, whacks = 0, pops = 0, longest = 0, ground = 0, landing = 0, frames = 0;
  for (const seed of [1, 7, 42]) {
    const L = makeLoose(shape, seed), th = 10 * Math.PI / 8, dx = Math.sin(th), dz = Math.cos(th);
    release(L, [dx * (A - 0.4), 4.6 + LR + 0.4, dz * (A - 0.4)], [-dx * 4.5, 2, -dz * 4.5], [dx * (A - 0.3), 4.6, dz * (A - 0.3)], 1.7);
    let last = 0, pc = null;
    const chatter = makeChatter(seed);
    for (let t = 0; t < 1800; t += 1 / 60) {
      for (const e of stepLoose(L, 1 / 60)) {
        const x = chatter.heard(e, t);
        if (x) { chat[x.name]++; said.push({ ...x, t: seed * 1e4 + t }); } if (e === 'whack' || e === 'mighty') { whacks++; longest = Math.max(longest, t - last); last = t; } if (e === 'pop') pops++; }
      const b = L.ball, r = Math.hypot(b.x, b.z), c = L.cat;
      if (r > A - LR + 1e-6 || b.y < LR - 1e-6 || b.y > shape.top) outside++;
      if (r > shape.landing.inner + 0.01 && b.y + LR > 4.6 - 0.18 + 0.01 && b.y - LR < 4.6 - 0.01) inSlab++;
      if (Math.hypot(c.x, c.z) > A || (!c.leap && c.mode !== 'coming' && Math.abs(c.y - floorBelow(shape, c.x, c.z, c.y + 0.05)) > 0.01)) catOff++;
      if (b.on) { frames++; if (b.y > 4) landing++; else ground++; }
      // Sadie never goes through the landing, or through its railing below its top
      const cr = Math.hypot(c.x, c.z);
      if (cr > shape.landing.inner + 0.02 && c.y > 4.6 - 0.18 + 0.02 && c.y < 4.6 - 0.02) catThrough++;
      if (pc && (pc.r - shape.landing.inner) * (cr - shape.landing.inner) < 0 && Math.max(pc.y, c.y) > 4.6 - 0.18 && Math.min(pc.y, c.y) < 4.6 + 1.0) catThrough++;
      // and she's not lazy: while the ball's rolling away from her, she's after it
      if (c.mode === 'watch' && Math.hypot(b.x - c.x, b.z - c.z) > 4) { away++; if (!c.leap && pc && pc.x === c.x && pc.z === c.z) lazy++; }
      pc = { r: cr, y: c.y, x: c.x, z: c.z };
    }
  }
  check('loose in the hall, the yarn ball never gets out of it, or through the landing', !outside && !inSlab, `${outside} outside, ${inSlab} in the landing, over 90 minutes`);
  check('...Sadie keeps whacking it off again', whacks / 90 > 3 && longest < 60, `${(whacks / 90).toFixed(1)} a minute, longest wait ${longest.toFixed(0)} s`);
  check('...it spends time both up on the landing and down below', landing / frames > 0.1 && ground / frames > 0.1, `${(landing / frames * 100).toFixed(0)}% on the landing`);
  check('...Sadie always lands on something, inside the hall', !catOff);
  check('...never going through the landing or its railing', !catThrough, `${catThrough} times`);
  check('...and never just stands about while it rolls off', lazy / away < 0.25, `${(lazy / away * 100).toFixed(0)}% of the time it's more than 4 m off`);
  check('...and it hardly ever needs popping back', pops <= 3, `${pops} times`);
  // Sadie's sounds while she plays: now and then, never close together, never the same twice running
  let close = 0, voiceClose = 0, again = 0, busiest = 0;
  for (let i = 1; i < said.length; i++) {
    const gap = said[i].t - said[i - 1].t;
    if (gap < CHATTER.gap) close++;
    if (said[i].name === said[i - 1].name && said[i].variant === said[i - 1].variant) again++;
  }
  const voiced = said.filter(x => x.name !== 'pat');
  for (let i = 1; i < voiced.length; i++) if (voiced[i].t - voiced[i - 1].t < CHATTER.voice) voiceClose++;
  for (const x of said) busiest = Math.max(busiest, said.filter(y => y.t >= x.t && y.t < x.t + 60).length);
  check("...Sadie makes her sounds now and then while she plays: pats, chirps, trills and the odd meow", Object.values(chat).every(n => n > 3) && said.length / 90 > 1.5 && said.length / 90 < 5, `${(said.length / 90).toFixed(1)} a minute: ${Object.entries(chat).map(([k, n]) => `${k} ${(n / 90).toFixed(2)}`).join(', ')} a minute`);
  check('...never two close together, and never more than 5 in any minute', !close && !voiceClose && busiest <= CHATTER.most, `${close} close, ${voiceClose} voices close, busiest minute ${busiest}`);
  check('...a meow at most once a minute, and never the same sound twice running', chat.meow / 90 <= 1 && !again, `${(chat.meow / 90).toFixed(2)} meows a minute, ${again} repeats`);
  const L = makeLoose(shape, 3);
  release(L, [NaN, 2, 0], [0, 0, 0], [0, 0, 3], 0);
  check('a ball somewhere impossible pops back into the hall', stepLoose(L, 1 / 60).includes('pop') && Math.hypot(L.ball.x, L.ball.z) < A);
}

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
