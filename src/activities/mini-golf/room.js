// Sadie's Mini Golf: three holes out in the backyard. Walk up to a tee and press E (or PLAY) to
// play it: your view drops in behind the ball, you aim and pull back (Sadie's tail puffs up the
// harder you pull), and let go to putt. Knock down all three pins, then sink it. While a pin's still
// standing the hole's tentacles grab a ball that comes near and fling it back to the tee (a stroke
// more); once they're all down they're friendly and pull it in. After the hole Sadie shows off her
// trick shot (all three pins and in, in one): only the ball, never how she hit it. Step away and the
// hole starts over; only the best scores are kept, on the board by the patio.
//
// How a ball rolls is course.js (plain numbers, the same in the tests), each hole is a data file
// (holes/), and build.js makes each hole in 3D. This puts them in the backyard and plays them.
//
// The course is part of outside, so it's built there once and kept (the mansion hands it back as
// `m.house` when the room's built again). It has no doors, so the room itself is nothing but a
// name: putting it away and building it again changes nothing you can see.
import { Scene, Vector3, Mesh, PlaneGeometry, BoxGeometry, DoubleSide } from 'three';
import { HOLES } from './holes/index.js';
import { buildHole } from './build.js';
import { drawArt } from './art.js';
import { makeSounds } from './sounds.js';
import { newPlay, putt, hit, step, pinsLeft, ballHeight, moverAt, edge, height, DT, S, R } from './course.js';
import { soundsFor } from '../../shared/sound.js';
import { store } from '../../shared/storage.js';

export const KEY = 'sadies-clubhouse.mini-golf.best';
const BOARD = { x: -2.2, z: 16 };     // the score board, at the back of the patio
const PULL = 1.2;                     // metres of pull back (dragging) for the hardest putt
const CHARGE = 1.3;                   // seconds of holding Space for the hardest putt
const WAIT = 1.2;                     // seconds Sadie waits before her trick shot
const ASSIST = 'sadies-clubhouse.mini-golf.assist';   // (assist mode on or off: kept, it's how you like to play)
const AIM_DOTS = 14;                  // dots in the aim line (with assist, as many as the whole way needs)

export async function buildRoom(m) {
  const house = m.house || await buildCourse(m);
  return {
    name: 'room:' + m.card.id, card: m.card, scene: new Scene(), doors: {}, faces: [], uses: [], floor: () => null, spots: {},
    light: { sun: 0.5, bulb: 0, lamp: [0, 20, 0] }, house,
    update(t, dt) { house.update(t, dt, m.ears()); },
    busy: () => house.busy(),
  };
}

// a score's name, the 90s way
export function scoreName(strokes, par) {
  if (strokes === 1) return 'HOLE IN ONE!!!';
  return { [-3]: 'ALBATROSS!!', [-2]: 'EAGLE!!', [-1]: 'BIRDIE!', 0: 'PAR', 1: 'BOGEY', 2: 'DOUBLE BOGEY', 3: 'TRIPLE BOGEY' }[strokes - par] || `+${strokes - par}. OH DEAR`;
}
// the best scores (kept): each hole's fewest strokes, and whether the trick shot's ever been done
export function readBest() {
  const b = store.get(KEY, null);
  return b && typeof b === 'object' ? { holes: { ...(b.holes || {}) }, trick: !!b.trick } : { holes: {}, trick: false };
}
export function withScore(best, id, strokes) {
  const holes = { ...best.holes };
  if (!(holes[id] <= strokes)) holes[id] = strokes;
  return { ...best, holes };
}
const total = best => HOLES.every(h => best.holes[h.id]) ? HOLES.reduce((s, h) => s + best.holes[h.id], 0) : 0;

async function buildCourse(m) {
  const { outside, T, psx, keep } = m;
  const A = drawArt(m);
  let sfxHandle = null, sfx = null;
  // (the room's handle: closed when the room's put away, so made again the next time one's needed)
  const sounds = () => { if (!sfxHandle || sfxHandle.closed) { sfxHandle = soundsFor('room:' + m.card.id); sfx = makeSounds(sfxHandle); } return sfx; };
  const ears = () => m.ears();

  // ---------- the score board by the patio ----------
  let onBoard = '';
  const drawBoard = () => { const b = readBest(), k = JSON.stringify(b); if (k !== onBoard) { onBoard = k; A.drawBoard(HOLES, { ...b, round: total(b) }); } };
  drawBoard();
  const wood = psx(T.wood, { tint: 0xffe0c0 });
  for (const s of [-1, 1]) { const p = new Mesh(keep(new BoxGeometry(0.1, 1.6, 0.1)), wood); p.position.set(BOARD.x + s * 0.62, 0.8, BOARD.z + 0.04); outside.scene.add(p); }
  const back = new Mesh(keep(new BoxGeometry(1.36, 1.02, 0.05)), wood); back.position.set(BOARD.x, 1.55, BOARD.z + 0.04); outside.scene.add(back);
  const board = new Mesh(keep(new PlaneGeometry(1.3, 0.975)), psx(A.board, { unlit: 0.4 })); board.position.set(BOARD.x, 1.55, BOARD.z); board.rotation.y = Math.PI; outside.scene.add(board);
  outside.blockRound(BOARD.x - 0.62, BOARD.z, 0.1); outside.blockRound(BOARD.x + 0.62, BOARD.z, 0.1); outside.block(BOARD.x - 0.62, BOARD.x + 0.62, BOARD.z - 0.02, BOARD.z + 0.1);

  // ---------- Sadie, at the tee while she shows off her trick shot ----------
  const sadie = new Mesh(keep(new PlaneGeometry(0.6, 0.49, 1, 1).translate(0, 0.245, 0)), psx(T.sadie, { unlit: 0.35 }));
  sadie.visible = false; outside.scene.add(sadie); outside.faces.push(sadie);

  // ---------- what's on the screen while you play: Sadie's tail (how hard), strokes, pins, words ----------
  // Assist mode (the owner's idea): the aim dots show the ball's whole way, not just the start, so
  // you can line them up with the pins and the hole. A button on the screen (or Q) turns it on and off.
  let assist = !!store.get(ASSIST, false);
  const setAssist = on => { assist = !!on; store.set(ASSIST, assist); hud.assist(assist); };
  const hud = makeHud();
  hud.assist(assist);

  // ---------- the holes ----------
  const games = [];
  for (const [i, hole] of HOLES.entries()) {
    const parts = buildHole(m, hole, A, i + 1);
    outside.scene.add(parts.g);
    // what's solid: the hole's green and the ground it stands on (round it, in the backyard)
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let v = 0; v <= 140; v += 1) for (let u = 0; u <= 100; u += 1) if (edge(hole, u, v) <= 0.6) {
      const x = parts.P.x(u), z = parts.P.z(v);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
    }
    outside.block(x0, x1, z0, z1);
    games.push(makeGame(i, hole, parts, parts.P.fz > 0 ? z1 : z0));
    await m.breathe?.();
  }

  // ---------- a hole being played ----------
  function makeGame(i, hole, parts, back) {
    const { P, ball, club, dots, pins, tentacles, ringMat, movers } = parts;
    const g = {
      i, hole, parts, pl: fresh(0), phase: 'idle', active: false, stopping: false, acc: 0,
      yaw: 0, power: 0, charging: false, turning: 0, turnFor: 0, drag: null,
      flyT: 0, from: null, swing: 0, banner: 0, rp: null, rpT: 0, sunkAt: 0, tricked: false,
      pinFly: pins.map(() => null), reach: 0, reachTo: new Vector3(), view: null,
    };
    function fresh(clock) { const pl = newPlay(hole); pl.clock = clock; return pl; }
    const seen = () => g.rp || g.pl;   // (Sadie's trick shot, while she's showing it; else yours)
    const world = (u, v, up = 0) => new Vector3(...P.at(u, v, up));
    const ballAt = pl => { const b = pl.ball; return new Vector3(P.x(b.x), P.y(ballHeight(pl)) + R * S, P.z(b.y)); };
    // which way you're aiming, in the plan (from the view's yaw: forward is (-sin, -cos))
    const planAngle = yaw => P.angle(-Math.sin(yaw), -Math.cos(yaw));
    const yawOf = a => { const [dx, dz] = P.dir(a); return Math.atan2(-dx, -dz); };
    const tee = world(...hole.tee);
    // where you stand to play it: behind the tee, off the green
    const stand = { x: tee.x, z: back + P.fz * 0.6, yaw: P.fz > 0 ? 0 : Math.PI, pitch: -0.45 };   // (looking down at it)

    // the view: drops in behind the ball, looking the way you aim (eased, so it never jumps)
    const view = { center: tee.clone(), normal: new Vector3(0, 0, 1), w: 2.4, h: 1.7, down: 0.5 };
    const want = { center: new Vector3(), normal: new Vector3(), w: 0, h: 0, down: 0 };
    g.view = view;
    function aimView(snap) {
      const pl = seen();
      if (g.phase === 'done' || g.phase === 'replay' || g.phase === 'ended') {
        // looking down over the whole hole, from the tee's end
        want.center.copy(world(50, 70)); want.center.y = P.lift + 0.3;
        want.normal.set(0, 0, P.fz); Object.assign(want, { w: 6.5, h: 6.5, down: 0.95 });
      } else {
        const bp = g.phase === 'fly' ? ball.position : ballAt(pl);
        const fw = new Vector3(-Math.sin(g.yaw), 0, -Math.cos(g.yaw));
        if (g.phase === 'aim' || g.phase === 'idle') {
          want.center.copy(bp).addScaledVector(fw, 1.1); want.normal.copy(fw).negate();
          Object.assign(want, { w: 3.2, h: 2.3, down: 0.55 });
        } else {
          // rolling: follow the ball, from where you were looking
          want.center.copy(bp); Object.assign(want, { w: 3.4, h: 2.5, down: 0.62 });
        }
      }
      if (g.drag) return;   // (dragging: the view stays put, so the drag means what it did when it started)
      const k = snap ? 1 : 0.08;
      view.center.lerp(want.center, k);
      if (want.normal.lengthSq() > 0) view.normal.lerp(want.normal, k).normalize();
      for (const f of ['w', 'h', 'down']) view[f] += (want[f] - view[f]) * k;
    }

    const play = {
      label: `PLAY HOLE ${i + 1}: ${hole.name.toUpperCase()}`, view, over: false,
      hint: {
        keys: '<kbd>A D</kbd> AIM &nbsp; HOLD <kbd>SPACE</kbd> PULL BACK, LET GO: PUTT &nbsp; (OR DRAG BACK) &nbsp; <kbd>Q</kbd> ASSIST &nbsp; <kbd>ESC</kbd> STEP BACK',
        touch: 'DRAG BACK FROM THE BALL, LET GO TO PUTT',
      },
      start() {
        g.stopping = false; g.active = true;
        if (g.phase === 'idle') begin();
        hud.show(g);
      },
      stop() {
        // (stepping back starts the hole over; the pause menu stops it too, and starts it again on
        // RESUME: which it was is known a moment later, so it's left till then: update())
        g.active = false; g.stopping = true; g.charging = false; g.drag = null; g.turning = 0;
        hud.hide();
      },
      key(code, down, repeat) {
        if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(code)) {
          const s = code === 'ArrowLeft' || code === 'KeyA' ? 1 : -1;
          if (down) { if (!repeat) { g.turning = s; g.turnFor = 0; } } else if (g.turning === s) g.turning = 0;
          return true;
        }
        if (code === 'KeyQ') { if (down && !repeat) setAssist(!assist); return true; }
        if (['Space', 'KeyW', 'ArrowUp', 'Enter', 'KeyE'].includes(code)) {
          if (down && !repeat) {
            if (g.phase === 'aim' && !g.drag) { g.charging = true; g.power = 0; }
            else if (g.phase === 'done' || g.phase === 'replay') skip();
          } else if (!down && g.charging) { g.charging = false; shoot(); }
          return true;
        }
        return false;
      },
      touch(id, ray, what) {
        if (what === 'down') {
          if (g.phase === 'done' || g.phase === 'replay') { skip(); return; }
          if (g.phase !== 'aim' || g.drag || g.charging) return;
          const p = onGround(ray);
          if (p) { g.drag = { id, from: p }; g.power = 0; }
        } else if (g.drag && id === g.drag.id) {
          if (what === 'move') {
            const p = onGround(ray); if (!p) return;
            const dx = p.x - g.drag.from.x, dz = p.z - g.drag.from.z, len = Math.hypot(dx, dz);
            g.power = Math.min(1, len / PULL);
            // (the ball goes the other way from your pull, like a slingshot)
            if (len > 0.04) g.yaw = Math.atan2(dx, dz);
          } else { g.drag = null; if (g.power > 0.03) shoot(); else g.power = 0; }
        }
      },
    };
    // where a press points to on the level of the ball
    function onGround(ray) {
      if (!ray) return null;
      const y = ballAt(g.pl).y, t = (y - ray.origin.y) / ray.dir.y;
      if (!(t > 0) || t > 60) return null;
      return ray.origin.clone().addScaledVector(ray.dir, t);
    }

    function begin() {
      reset();
      g.phase = 'aim'; play.over = false;
      g.yaw = yawOf(-Math.PI / 2);   // (up the hole, away from the tee)
      g.rpSeen = null;
      aimView(true);
      hud.message(`HOLE ${i + 1}: ${hole.name.toUpperCase()}`, 'KNOCK DOWN THE 3 PINS, THEN SINK IT', 3);
    }
    // everything back as it was: the pins up, the ball on the tee, no strokes
    function reset() {
      g.pl = fresh(g.pl.clock); g.rp = null; g.phase = 'idle'; g.power = 0; g.charging = false; g.drag = null; g.turning = 0;
      g.pinFly = pins.map(() => null); g.tricked = false; g.flyT = 0; g.swing = 0; g.rpEnd = 0;
      for (const p of pins) { p.position.copy(p.userData.home); p.rotation.set(0, 0, 0); p.visible = true; }
      sadie.visible = false;
    }
    function shoot(angle = planAngle(g.yaw)) {
      if (g.phase !== 'aim') return;
      for (const e of putt(g.pl, angle, Math.max(0.02, g.power))) happened(e, g.pl);
      g.phase = 'roll'; g.swing = 0.3;
    }
    // done looking at the score (or at Sadie's trick shot): on to the next thing
    function skip() {
      if (g.phase === 'done') startReplay();
      else if (g.phase === 'replay') finish();
    }
    function startReplay() {
      // Sadie's trick shot: the hole as it was, the ball from the tee (her aim and how hard: secret)
      const [a, power, clock] = hole.shots.trick[0];
      for (const p of pins) { p.position.copy(p.userData.home); p.rotation.set(0, 0, 0); p.visible = true; }
      g.pinFly = pins.map(() => null);
      // (her shot's clock is when it was recorded: the gnome, the sprinkler and her tail must be just
      // where they were then, or it goes another way. So the course's clock is set to it as she putts.)
      g.rp = fresh(clock - WAIT); g.rpT = 0; g.rpShot = [a, power, clock]; g.phase = 'replay'; g.rpSeen = { blasts: 0, sunk: false };
      sadie.position.copy(tee).add(new Vector3(P.f * -0.35, 0.02, P.fz * 0.05)); sadie.visible = true;
      hud.message("SADIE'S TRICK SHOT", 'WATCH CLOSELY...', 2.5);
    }
    // (all done: the mansion steps you back, and the hole's started over once it has: stop())
    function finish() { play.over = true; sadie.visible = false; g.rp = null; g.phase = 'ended'; }

    // what just happened to the ball: sounds, pins flying, the tentacles, the score
    function happened(e, pl) {
      const e2 = ears(), d = e2.place === outside ? Math.hypot(e2.x - ball.position.x, e2.z - ball.position.z) : 30;
      const near = g.active ? Math.min(d, 2) : d;
      const s = sounds();
      if (e.type === 'putt') s.putt(e.power, near);
      else if (e.type === 'wall') s.wall(e.speed, near);
      else if (e.type === 'bump') s.bump(near);
      else if (e.type === 'bat') s.bat(near);
      else if (e.type === 'tunnel') s.flap(near);
      else if (e.type === 'out') s.pop(near);
      else if (e.type === 'pull') s.pull(near);
      else if (e.type === 'blast') {
        s.blast(e.pin, near);
        if (pl === g.rp) g.rpSeen.blasts++;
        // BLASTED off the course, the way the ball was going
        const k = Math.min(1, 60 / Math.hypot(e.vx, e.vy)) * 0.9;
        g.pinFly[e.pin] = { t: 0, v: new Vector3(P.f * e.vx * S * k * 1.6, 3.2, P.fz * e.vy * S * k * 1.6), spin: (e.pin % 2 ? 1 : -1) * 12 };
        if (pl === g.pl) {
          if (e.trick && !g.tricked) {
            g.tricked = true; s.award();
            hud.message('TRICK SHOT!!!', 'ALL 3 PINS IN ONE GO. SADIE IS IMPRESSED', 4, true);
            const b = readBest(); if (!b.trick) store.set(KEY, { ...b, trick: true });
          } else if (e.last) hud.message('ALL THE PINS ARE DOWN!', 'THE TENTACLES ARE FRIENDLY NOW. SINK IT!', 3);
        }
      } else if (e.type === 'grab') {
        s.grab(near);
        // the tentacles grab it where it is, and fling it back to the tee
        g.from = world(e.x, e.y, R * S); g.flyT = 0; g.phase = pl === g.pl ? 'fly' : g.phase;
        if (pl === g.pl) hud.message('GRABBED!', `BACK TO THE TEE. +1 STROKE (${pinsLeft(pl)} PIN${pinsLeft(pl) === 1 ? '' : 'S'} STILL UP)`, 2.5);
      } else if (e.type === 'sunk') {
        s.sunk(near);
        if (pl === g.rp) g.rpSeen.sunk = true;
        if (pl === g.pl) {
          const strokes = pl.strokes;
          g.phase = 'done'; g.sunkAt = 0;
          setTimeout(() => sounds().result(strokes - hole.par), 600);
          hud.message(scoreName(strokes, hole.par), `${strokes} STROKE${strokes === 1 ? '' : 'S'}. PAR ${hole.par}`, 3, strokes < hole.par);
          store.set(KEY, withScore(readBest(), hole.id, strokes));
          drawBoard();
        }
      } else if (e.type === 'stop' && pl === g.pl && g.phase === 'roll') g.phase = 'aim';
    }

    // ---------- every frame ----------
    const tmp = new Vector3();
    function update(t, dt, paused, shown) {
      if (g.stopping && !paused) { g.stopping = false; reset(); }
      if (!paused) {
        // the ball (yours, or Sadie's), a fixed step at a time: always the same, however quick the screen
        g.acc = Math.min(g.acc + dt, 0.1);
        while (g.acc >= DT) {
          g.acc -= DT;
          if (g.phase === 'replay') {
            g.rpT += DT;
            if (g.rpT > WAIT && !g.rp.ball.moving && !g.rp.sunk && !g.rp.strokes) for (const e of hit(g.rp, g.rpShot)) happened(e, g.rp);
            for (const e of step(g.rp)) happened(e, g.rp);
            if ((g.rp.sunk || (g.rp.strokes && !g.rp.ball.moving)) && !g.rpEnd) g.rpEnd = g.rpT;
            if (g.rpEnd && g.rpT > g.rpEnd + 2) { g.rpEnd = 0; finish(); }
          } else if (g.phase === 'ended') break;
          else if (g.phase !== 'fly') for (const e of step(g.pl)) happened(e, g.pl);
          else g.pl.clock += DT;
        }
        if (g.phase === 'done' && (g.sunkAt += dt) > 3) startReplay();
        if (g.active && g.phase === 'aim') {
          if (g.turning) { g.turnFor += dt; g.yaw += g.turning * dt * Math.min(1.6, 0.35 + g.turnFor * 1.4); }
          if (g.charging) g.power = Math.min(1, g.power + dt / CHARGE);
        }
      }
      // (nothing to draw while the backyard can't be seen: from the front of the house, or indoors)
      parts.g.visible = shown;
      if (!shown) return;
      const pl = seen();
      // the ball: rolling, or flung back to the tee (an arc), or down the hole, or in the tunnel
      if (g.phase === 'fly') {
        g.flyT += dt / 0.9;
        const k = Math.min(1, g.flyT), to = ballAt(g.pl);
        ball.position.lerpVectors(g.from, to, k); ball.position.y += Math.sin(Math.PI * k) * 1.4;
        if (k >= 1) g.phase = 'aim';
      } else ball.position.copy(ballAt(pl));
      ball.visible = !pl.ball.tunnel && !pl.sunk;
      // the pins: standing, or flying off
      pins.forEach((p, n) => {
        const f = g.pinFly[n];
        if (!f) { p.visible = pl.pins[n]; return; }
        f.t += dt; f.v.y -= 9.8 * dt;
        p.position.addScaledVector(f.v, dt); p.rotation.x += f.spin * dt; p.rotation.z += f.spin * 0.6 * dt;
        p.visible = f.t < 1.6;
      });
      // what moves
      for (const mv of movers) {
        const at = moverAt(mv.mv, pl.clock);
        if (mv.mv.kind === 'gnome') {
          mv.o.position.set(...P.at(at.x, at.y)); mv.o.position.y += Math.abs(Math.sin(pl.clock * 6)) * 0.03;
          const sg = Math.sign(mv.mv.speed);   // (facing the way he's going)
          mv.o.rotation.y = Math.atan2(P.f * -Math.sin(at.a) * sg, P.fz * Math.cos(at.a) * sg);
        } else if (mv.mv.kind === 'sprinkler') {
          mv.o.rotation.y = Math.atan2(P.f * at.dx, P.fz * at.dy);
          mv.drops.forEach((q, n) => {
            const s = (pl.clock * 1.2 + n / mv.drops.length) % 1, u = at.x + at.dx * mv.mv.len * s, v = at.y + at.dy * mv.mv.len * s;
            q.position.set(P.x(u), P.y(Math.max(height(hole, at.x, at.y), height(hole, u, v))) + 0.08 + Math.sin(Math.PI * s) * 0.3, P.z(v));
          });
        } else if (mv.mv.kind === 'tail') {
          // from her bench, down over the wall and across the ramp (fluffy at the tip, which curls up)
          const n = mv.bits.length, seat = 0.62;
          mv.bits.forEach((q, k) => {
            const s = k / (n - 1), u = at.x + (at.tx - at.x) * s, v = at.y + (at.ty - at.y) * s;
            const ground = edge(hole, u, v) < 0 ? P.y(height(hole, u, v)) + 0.07 : 0;
            const y = Math.max(ground, seat * (1 - s * 3)) + (s > 0.85 ? (s - 0.85) * 1.2 : 0);
            q.position.set(P.x(u), y, P.z(v));
          });
        }
      }
      // the tentacles: up out of the hole, swaying; reaching for a ball that comes near while a pin's
      // up (and grabbing it); friendly once they're all down; gone once it's in
      const friendly = !pinsLeft(pl), cup = parts.cup, bp = ball.position;
      ringMat.uniforms.tint.value.setHex(friendly ? 0x5aff7a : 0xff3fd0);
      const dBall = Math.hypot(pl.ball.x - hole.cup[0], pl.ball.y - hole.cup[1]);
      let reach = 0;
      if (g.phase === 'fly') { reach = Math.max(0, 1 - g.flyT * 3); g.reachTo.copy(g.from); }
      else if (!pl.sunk && dBall < hole.reach + 6 && pl.ball.moving) { reach = Math.max(0, 1 - (dBall - hole.reach * 0.6) / (hole.reach * 0.4 + 6)) * (friendly ? 0.4 : 0.8); g.reachTo.copy(bp); }
      g.reach += (reach - g.reach) * Math.min(1, dt * 10);
      tentacles.forEach((beads, k) => {
        const a = k / tentacles.length * Math.PI * 2, bx = cup[0] + Math.cos(a) * 0.07, bz = cup[2] + Math.sin(a) * 0.07;
        beads.forEach((q, j) => {
          const s = (j + 1) / beads.length, sw = Math.sin(t * 2.2 + k * 1.7 + j * 0.7) * 0.03 * s * (friendly ? 1.6 : 1);
          const ix = bx + Math.cos(a) * s * 0.07 + sw, iy = cup[1] + s * (friendly ? 0.2 : 0.3), iz = bz + Math.sin(a) * s * 0.07 + Math.cos(t * 1.9 + k + j) * 0.03 * s;
          tmp.set(bx + (g.reachTo.x - bx) * s, cup[1] + (g.reachTo.y - cup[1]) * s + Math.sin(Math.PI * s) * 0.12, bz + (g.reachTo.z - bz) * s);
          q.position.set(ix + (tmp.x - ix) * g.reach, iy + (tmp.y - iy) * g.reach, iz + (tmp.z - iz) * g.reach);
          q.visible = !pl.sunk;
        });
      });
      // the club, held back behind the ball (further, the harder), and swung through
      const fw = tmp.set(-Math.sin(g.yaw), 0, -Math.cos(g.yaw));
      if (g.swing > 0) g.swing -= dt;
      club.visible = g.active && (g.phase === 'aim' || g.swing > 0);
      if (club.visible) {
        const backBy = g.swing > 0 ? Math.max(0, g.swing - 0.2) * 2 : 0.1 + g.power * 0.35;
        club.position.copy(ballAt(g.pl)).addScaledVector(fw, -backBy); club.position.y += 0.06;
        club.position.x += Math.cos(g.yaw) * 0.13; club.position.z -= Math.sin(g.yaw) * 0.13;
        club.rotation.set(0, g.yaw, -0.35);
      }
      // the aim: dots along where the ball will really go (round the slopes, off the walls) for the
      // first stretch of the shot, a bit further the harder you pull (worked out with the engine itself)
      const aiming = g.active && g.phase === 'aim';
      let dotsUp = 0;
      if (aiming) {
        const c = newPlay(hole), b = g.pl.ball;
        Object.assign(c.ball, { x: b.x, y: b.y, deck: b.deck }); c.pins = g.pl.pins.slice(); c.clock = g.pl.clock;
        putt(c, planAngle(g.yaw), Math.max(0.02, g.power));
        const far = assist ? Infinity : 14 + g.power * 26, gap = assist ? 3.5 : far / AIM_DOTS;
        let went = 0, next = gap, lx = b.x, ly = b.y;
        for (let k = 0; k < (assist ? 3600 : 900) && c.ball.moving && !c.sunk && dotsUp < dots.length && went < far; k++) {
          if (step(c).some(e => e.type === 'grab' || e.type === 'tunnel')) break;
          went += Math.hypot(c.ball.x - lx, c.ball.y - ly); lx = c.ball.x; ly = c.ball.y;
          if (went >= next) { next += gap; dots[dotsUp++].position.set(P.x(lx), P.y(ballHeight(c)) + 0.012, P.z(ly)); }
        }
      }
      dots.forEach((q, n) => { q.visible = n < dotsUp; });
      if (g.active || g.phase === 'replay') aimView(false);
      if (g.active) hud.update(g);
    }

    outside.uses.push({ pos: new Vector3(tee.x, tee.y + 0.15, tee.z), reach: 3, label: play.label, play });
    return Object.assign(g, { play, update, stand, reset, shoot, fresh, tee });
  }

  // ---------- the screen while you play: Sadie's tail (puffier the harder you pull), and words ----------
  function makeHud() {
    const root = document.getElementById('mansion') || document.body;
    const el = document.createElement('div');
    el.id = 'golfHud'; el.hidden = true;
    el.style.cssText = 'position:absolute;left:calc(14px + env(safe-area-inset-left));bottom:calc(14px + env(safe-area-inset-bottom));display:flex;gap:8px;align-items:flex-end;pointer-events:none;font-family:var(--px,monospace);font-size:11px;color:#fff;letter-spacing:.05em';
    el.innerHTML = '<canvas width="40" height="48" style="width:80px;height:96px;image-rendering:pixelated;background:#1c1238c0;border:2px solid #ffd23a"></canvas>'
      + '<div style="background:#1c1238c0;padding:6px 8px;line-height:1.6"><b data-k="hole"></b><br><span data-k="strokes"></span><br><span data-k="pins"></span><br><button data-k="assist" style="pointer-events:auto;margin-top:4px;font-family:inherit;font-size:11px;color:#1c1238;background:#ffd23a;border:0;padding:4px 8px"></button></div>';
    const msg = document.createElement('div');
    msg.id = 'golfMsg'; msg.hidden = true;
    msg.style.cssText = 'position:absolute;left:50%;top:32%;transform:translateX(-50%);text-align:center;pointer-events:none;font-family:var(--px,monospace);color:#fff;text-shadow:3px 3px 0 #1c1238;width:92%';
    msg.innerHTML = '<div data-k="big" style="font-size:30px;font-weight:700;color:#ffd23a"></div><div data-k="small" style="font-size:12px;margin-top:6px"></div>';
    root.append(el, msg);
    const q = (e, k) => e.querySelector(`[data-k="${k}"]`);
    const cv = el.querySelector('canvas'), cx = cv.getContext('2d');
    q(el, 'assist').addEventListener('click', e => { e.stopPropagation(); setAssist(!assist); });
    let drawn = -1, msgLeft = 0, last = '';
    // Sadie's tail, from her rump at the bottom: thin when relaxed, puffed right up for a big hit
    function tail(power) {
      const k = Math.round(power * 12);
      if (k === drawn) return; drawn = k;
      cx.clearRect(0, 0, 40, 48);
      const puff = k / 12, w = 1.5 + puff * 5.5;
      for (let s = 0; s <= 1; s += 0.02) {
        const x = 14 + Math.sin(s * 2.4) * 12 * (1 - puff * 0.3), y = 46 - s * 40, r = w * (0.6 + 0.4 * Math.sin(s * Math.PI * 0.9));
        cx.fillStyle = s > 0.82 ? '#f4ecff' : Math.floor(s * 10) % 3 === 0 ? '#c8a070' : '#9a94a8';
        cx.fillRect(Math.round(x - r), Math.round(y), Math.round(r * 2), 2);
        // (the fur standing up, the puffier it gets)
        if (puff > 0.3 && Math.floor(s * 50) % 4 === 0) { cx.fillStyle = '#c9b6f2'; cx.fillRect(Math.round(x - r - puff * 2), Math.round(y), 1, 1); cx.fillRect(Math.round(x + r + puff * 2), Math.round(y), 1, 1); }
      }
      if (k === 12) { cx.fillStyle = '#ff8ec8'; cx.fillRect(30, 2, 2, 6); cx.fillRect(30, 10, 2, 2); }   // (!)
    }
    tail(0);
    return {
      show(g) { el.hidden = false; drawn = -1; this.update(g); },
      hide() { el.hidden = true; msg.hidden = true; msgLeft = 0; },
      update(g) {
        tail(g.phase === 'aim' ? g.power : 0);
        const pl = g.pl, left = pinsLeft(pl);
        const now = `${g.i}|${pl.strokes}|${left}`;
        if (now !== last) {
          last = now;
          q(el, 'hole').textContent = `HOLE ${g.i + 1} · PAR ${g.hole.par}`;
          q(el, 'strokes').textContent = `STROKES: ${pl.strokes}`;
          q(el, 'pins').textContent = left ? `PINS LEFT: ${'■'.repeat(left)}${'□'.repeat(pl.pins.length - left)}` : 'PINS: ALL DOWN!';
        }
      },
      tick(dt) { if (msgLeft > 0 && (msgLeft -= dt) <= 0) msg.hidden = true; },
      message(big, small, secs, gold) {
        q(msg, 'big').textContent = big; q(msg, 'small').textContent = small;
        q(msg, 'big').style.color = gold ? '#ff8ec8' : '#ffd23a';
        msg.hidden = false; msgLeft = secs;
      },
      state: () => ({ shown: !el.hidden, message: msg.hidden ? null : q(msg, 'big').textContent }),
      assist(on) { q(el, 'assist').textContent = on ? 'ASSIST: ON' : 'ASSIST: OFF'; },
    };
  }

  let boardAt = 0;
  const house = {
    doors: {},   // (no doors: you play it where it stands)
    update(t, dt, e) {
      const paused = m.paused?.();
      // where outside's seen from (you, out there, or the door you're looking out of): the course can't
      // be seen from in front of the house (it's behind it) or with no door open to outside
      const from = e?.outside, seen = !!from && !(from.z < -1 && Math.abs(from.x) < 12);
      for (const g of games) g.update(t, dt, paused, seen || g.active);
      hud.tick(dt);
      if ((boardAt += dt) > 2) { boardAt = 0; drawBoard(); }   // (the pause menu can erase the scores)
    },
    busy: () => games.some(g => g.active || g.phase !== 'idle'),
  };

  // for the checks (tests/mini-golf/browser.mjs)
  window.__golf = {
    holes: () => games.map(g => ({ id: g.hole.id, phase: g.phase, active: g.active, strokes: g.pl.strokes, pins: g.pl.pins.slice(), sunk: g.pl.sunk,
      ball: { x: g.pl.ball.x, y: g.pl.ball.y, moving: g.pl.ball.moving }, replay: !!g.rp, over: g.play.over, sadie: g.rpSeen || null })),
    // where to stand to play a hole
    stand: i => games[i].stand,
    // putt now: which way (radians, in the plan), how hard, and the course's clock as it's hit (as
    // the hole's recorded shots say)
    shoot(i, angle, power, clock) {
      const g = games[i]; if (g.phase !== 'aim') return false;
      if (clock !== undefined) g.pl.clock = clock;
      const [dx, dz] = g.parts.P.dir(angle); g.yaw = Math.atan2(-dx, -dz); g.power = power; g.shoot(angle); return true;
    },
    best: () => readBest(),
    // assist mode (the whole way shown), and how many aim dots are showing on a hole
    assist: on => { if (on !== undefined) setAssist(on); return assist; },
    dots: i => games[i].parts.dots.filter(q => q.visible).length,
    hud: () => hud.state(),
  };
  return house;
}
