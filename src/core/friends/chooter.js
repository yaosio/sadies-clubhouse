// Chooter: Sadie's first friend, a black lab/pitbull mix who loves everybody and everything.
// Sadie meets him the first time she climbs high enough, and he moves into her barn.
//
// Out of the barn he bounces around near Sadie. Every so often he gets the zoomies: he tears
// back and forth across the pile, leaping over bumps and knocking pieces out of his way. Throw
// him a ball (the toy box) and he chases it, unless he's in the middle of the zoomies, and
// proudly brings it to Sadie. Now and then he goes home to the barn for a rest, and pokes his
// head out of the hayloft window.
//
// He isn't a physics piece: like Sadie, he walks on top of the pile. The only way he touches the
// pieces is the zoomies kick.
import { U, W, SUBSTEPS } from '../../config.js';
import { store } from '../../platform/storage.js';
import { world } from '../world.js';
import { emit } from '../events.js';
import { emote, spark } from '../effects.js';
import { groundAt, STEP_UP } from '../surface.js';
import { wake } from '../physics/solver.js';
import { barn, barnX, barnFloor, BARN_HALF } from '../barn.js';
import { sadie } from '../sadie/brain.js';
import { toy, holdToy, dropToy, poofToy, toyResting } from '../toys.js';

export const MEET_AT = 15 * U;                   // Sadie meets him the first time she stands this high
const TROT = 2.2 * U, RUN = 4.2 * U, ZOOM = 6.5 * U;
const G = 1400, JUMP_MAX = 2.6 * U, ZOOM_JUMP_MAX = 3.2 * U; // he can leap up ledges this tall
const OUT = [70, 120], HOME = [25, 45];          // seconds out of the barn, then resting in it
const ZOOM_GAP = [40, 75], ZOOM_LEN = [7, 10], FIRST_ZOOM = 20;
const KICK = 5 * U, KICK_UP = 3.5 * U;           // how hard the zoomies knock a piece (px/s)
const DOOR_TIME = 0.7, DIG_TIME = 1.2;
const rnd = ([a, b]) => a + Math.random() * (b - a);

// place: out | home | door (going in or out through the cat flap) | dig (digging into a buried barn)
// act (while out): greet | play | zoom | fetch | bring | gohome
export const chooter = {
  met: !!store.get('sadie.chooter.met', false), movedIn: !!store.get('sadie.chooter.movedIn', false),
  place: 'out', act: 'play', x: 0, y: 0, vx: 0, vy: 0, air: false, dir: 1, phase: 0, mood: 'happy',
  outT: 0, homeT: 0, zoomT: 0, actT: 0, spotT: 0, spot: 0, stuckT: 0, doorT: 0, doorIn: false, doorX: 0, barkT: 0, hopT: 0, pant: 0,
};

function landDust(n) { for (let k = 0; k < n; k++) spark(chooter.x + (Math.random() - 0.5) * 0.8 * U, chooter.y + 0.05 * U, (Math.random() - 0.5) * 90, 20 + Math.random() * 40, 2 + Math.random() * 2.5, 0.6, 'rgba(210,190,170,0.8)'); }
function hearts(x, y, n) { for (let k = 0; k < n; k++) emote('♥', '#ff4f86', x + (Math.random() - 0.5) * U, y + 1.4 * U, (Math.random() - 0.5) * 50, 50 + Math.random() * 40); }
const wantsBall = () => toy.state === 'fly' && !toy.played;
function bark() { const c = chooter; emote('Woof!', '#3a2658', c.x + c.dir * 0.8 * U, c.y + 1.7 * U, c.dir * 12, 38); c.barkT = 0.5; }

// Start a fresh board: if Sadie already knows him, he's out playing beside the barn.
export function resetChooter() {
  const c = chooter;
  if (!c.met) return;
  Object.assign(c, { place: 'out', act: 'play', vx: 0, vy: 0, air: false, dir: -1, phase: 0, stuckT: 0, pant: 0, barkT: 0 });
  c.x = Math.min(W - 0.5 * U, barnX() + BARN_HALF + 1.2 * U); c.y = groundAt(c.x, 0);
  c.outT = rnd(OUT); c.zoomT = FIRST_ZOOM; c.spotT = 0;
}
export function meetChooter() {
  const c = chooter;
  c.met = true; store.set('sadie.chooter.met', true);
  // he comes bounding in from the far side of the board, along the top of the pile
  c.x = sadie.x > W / 2 ? 0.6 * U : W - 0.6 * U; c.y = groundAt(c.x, 1e9); c.dir = Math.sign(sadie.x - c.x) || 1;
  Object.assign(c, { place: 'out', act: 'greet', vx: 0, vy: 0, air: false, actT: 0, stuckT: 0, outT: rnd(OUT), zoomT: FIRST_ZOOM + 10 });
  emit('friendMet', 'Chooter');
}

// ---------- moving about ----------
function jump(rise, vx) {
  const c = chooter;
  c.air = true; c.vy = Math.sqrt(2 * G * (Math.max(0, rise) + 0.45 * U)); c.vx = vx;
}
// Gravity, landing, and getting out from under a piece that landed on him.
function body(dt) {
  const c = chooter;
  if (c.air) {
    const nx = c.x + c.vx * dt, sd = Math.sign(c.vx);
    if (!(sd && groundAt(nx + sd * 0.35 * U, c.y) > c.y + STEP_UP)) c.x = nx; // pressed against a ledge: keep rising until he clears it
    if (c.x < 0.4 * U || c.x > W - 0.4 * U) { c.x = Math.min(W - 0.4 * U, Math.max(0.4 * U, c.x)); c.vx = -c.vx * 0.3; }
    c.vy -= G * dt; c.y += c.vy * dt;
    const g = groundAt(c.x, c.y);
    if (c.vy <= 0 && c.y <= g) { c.y = g; c.air = false; c.vy = 0; c.vx = 0; landDust(4); }
    return;
  }
  const g = groundAt(c.x, c.y);
  if (g - c.y > STEP_UP) { c.y = g; landDust(6); } // something landed on him: he wriggles out on top
  else if (c.y > g + 0.5) { c.air = true; c.vy = 0; c.vx = c.dir * (c.speed || TROT) * 0.8; } // ran off a ledge
  else c.y = g;
}
// One step toward x = goal on the ground. Leaps up anything he can; returns 'there', 'blocked' or 'moving'.
function walk(goal, speed, jumpMax, dt) {
  const c = chooter;
  if (c.air) return 'moving';
  const dx = goal - c.x;
  if (Math.abs(dx) < 0.2 * U) return 'there';
  c.dir = Math.sign(dx);
  const rise = groundAt(c.x + c.dir * 0.45 * U, c.y) - c.y;
  if (rise > STEP_UP) {
    if (rise <= jumpMax) { jump(rise, c.dir * Math.max(speed, 2.5 * U)); return 'moving'; }
    return 'blocked';
  }
  const step = Math.min(Math.abs(dx), speed * dt);
  c.x = Math.min(W - 0.4 * U, Math.max(0.4 * U, c.x + c.dir * step));
  c.phase += step / (0.8 * U); c.speed = speed;
  return 'moving';
}

// ---------- the zoomies: knock pieces out of his way ----------
function kickAhead() {
  const c = chooter, x0 = Math.min(c.x + c.dir * 0.2 * U, c.x + c.dir * 0.95 * U), x1 = Math.max(c.x + c.dir * 0.2 * U, c.x + c.dir * 0.95 * U);
  const y0 = c.y + 0.2 * U, y1 = c.y + 1.1 * U, h = 1 / 60 / SUBSTEPS;
  let hit = false;
  for (const p of world.pieces) {
    if (p.fixed || p.fossil || p.maxX < x0 || p.minX > x1 || p.maxY < y0 || p.minY > y1) continue;
    if (world.gameTime - (p.kickT || -9) < 0.6) continue;
    let inside = false;
    for (const i of p.T.bnd) if (p.x[i] >= x0 && p.x[i] <= x1 && p.y[i] >= y0 && p.y[i] <= y1) { inside = true; break; }
    if (!inside) continue;
    // a shove forward and up; heavy pieces barely budge, light ones go flying
    const m = Math.min(1.5, p.mat.invMass), dx = c.dir * KICK * m * h, dy = KICK_UP * m * h;
    wake(p); p.rest = 0; p.kickT = world.gameTime;
    for (let i = 0; i < p.n; i++) { p.px[i] = p.x[i] - dx; p.py[i] = p.y[i] - dy; }
    hit = true;
  }
  if (hit) { for (let k = 0; k < 5; k++) spark(c.x + c.dir * 0.7 * U, c.y + 0.6 * U, c.dir * (40 + Math.random() * 80), (Math.random() - 0.3) * 90, 2 + Math.random() * 2, 0.6, '#fff4c2'); }
  return hit;
}
function startZoom() {
  const c = chooter;
  c.act = 'zoom'; c.actT = rnd(ZOOM_LEN); c.spot = pickZoomSpot(c.dir); c.hopT = 0.5;
  emote('!', '#ff4f86', c.x, c.y + 1.6 * U, 0, 45);
  emit('zoomies');
}
function pickZoomSpot(dir) {
  const c = chooter;
  let x = c.x + dir * (7 + Math.random() * 7) * U;
  if (x < U || x > W - U) x = c.x - dir * (7 + Math.random() * 7) * U;
  return Math.min(W - U, Math.max(U, x));
}

// ---------- going home ----------
const doorSide = () => Math.sign(chooter.x - barnX()) || 1;
const doorSpot = sd => Math.min(W - 0.5 * U, Math.max(0.5 * U, barnX() + sd * (BARN_HALF + 0.45 * U)));
function goIn(dig) {
  const c = chooter;
  if (!c.movedIn) { c.movedIn = true; store.set('sadie.chooter.movedIn', true); emit('friendMovedIn', 'Chooter'); }
  c.place = dig ? 'dig' : 'door'; c.doorIn = true; c.doorT = 0; c.doorX = c.x; c.air = false;
  c.dir = Math.sign(barnX() - c.x) || c.dir;
}
function comeOut() {
  const c = chooter, sd = Math.random() < 0.5 ? -1 : 1, x = doorSpot(sd), floor = barnFloor();
  c.outT = rnd(OUT); c.act = 'play'; c.spotT = 0; c.air = false; c.vx = c.vy = 0;
  if (groundAt(x, floor) > floor + STEP_UP) { // buried: he digs his way out on top of the pile
    c.place = 'out'; c.x = barnX(); c.y = groundAt(c.x, floor); landDust(14);
    return;
  }
  c.place = 'door'; c.doorIn = false; c.doorT = 0; c.doorX = x; c.x = barnX(); c.y = floor; c.dir = sd;
}

// ---------- each tick ----------
export function updateChooter(dt) {
  const c = chooter;
  if (!c.met) { if (sadie.state !== 'climb' && sadie.y >= MEET_AT) meetChooter(); return; }
  c.barkT = Math.max(0, c.barkT - dt); c.pant = Math.max(0, c.pant - dt);

  if (c.place === 'home') {
    c.homeT -= dt; c.phase += dt;
    if (c.homeT <= 0 || wantsBall()) comeOut(); // a thrown ball always gets him out
    c.mood = 'home';
    return;
  }
  if (c.place === 'door' || c.place === 'dig') { // walking in or out through the flap, or digging down
    c.doorT += dt;
    const T = c.place === 'dig' ? DIG_TIME : DOOR_TIME, k = Math.min(1, c.doorT / T), bx = barnX(), floor = barnFloor();
    if (c.place === 'door') {
      c.x = c.doorIn ? c.doorX + (bx - c.doorX) * k : bx + (c.doorX - bx) * k; c.y = floor; c.phase += dt * 2.5;
    } else if (Math.random() < 0.5) spark(c.x, c.y + 0.2 * U, (Math.random() - 0.5) * 160, 60 + Math.random() * 90, 2 + Math.random() * 2, 0.7, '#a8663f');
    c.mood = c.place === 'dig' ? 'dig' : 'happy';
    if (k >= 1) {
      if (c.doorIn) { c.place = 'home'; c.homeT = rnd(HOME); }
      else { c.place = 'out'; c.y = groundAt(c.x, c.y); }
    }
    return;
  }

  // ---- out and about ----
  body(dt);
  c.outT -= dt; c.zoomT -= dt; c.actT -= dt;
  // what to do next
  if (wantsBall() && c.act !== 'zoom' && c.act !== 'fetch' && c.act !== 'bring') { c.act = 'fetch'; c.actT = 25; c.stuckT = 0; bark(); }
  if (c.act === 'play' && c.zoomT <= 0) startZoom();
  if (c.act === 'play' && c.outT <= 0 && toy.state === 'none') { c.act = 'gohome'; c.actT = 30; }

  let res = 'there', speed = TROT;
  if (c.act === 'greet') { // run to Sadie and say hello
    const goal = sadie.x - Math.sign(sadie.x - c.x) * 1.1 * U;
    speed = RUN; res = walk(goal, speed, JUMP_MAX, dt);
    if ((res === 'there' && Math.abs(sadie.y - c.y) < 1.5 * U) || c.actT < -15) { hearts(c.x, c.y, 6); hearts(sadie.x, sadie.y, 4); bark(); c.act = 'play'; c.spotT = 2; }
  } else if (c.act === 'zoom') {
    speed = ZOOM;
    kickAhead();
    res = walk(c.spot, speed, ZOOM_JUMP_MAX, dt);
    if (res === 'blocked') { kickAhead(); c.dir = -c.dir; c.spot = pickZoomSpot(c.dir); }
    else if (res === 'there') c.spot = pickZoomSpot(-c.dir);
    c.hopT -= dt;
    if (!c.air && c.hopT <= 0) { jump(0, c.dir * speed); c.hopT = 0.6 + Math.random() * 1.2; } // bouncing with joy
    if (c.actT <= 0 && !c.air) { c.act = 'play'; c.zoomT = rnd(ZOOM_GAP); c.pant = 4; c.spotT = 1; }
  } else if (c.act === 'fetch') {
    speed = RUN;
    if (toy.state !== 'fly' || toy.played) c.act = 'play';
    else {
      res = walk(toy.x, speed, JUMP_MAX, dt);
      const close = Math.abs(toy.x - c.x) < 0.6 * U && toy.y - c.y < 1.2 * U && toy.y - c.y > -0.3 * U;
      if (close && (toyResting() || toy.vy < 0)) { holdToy(); c.act = 'bring'; c.actT = 18; c.stuckT = 0; }
      c.stuckT = res === 'blocked' ? c.stuckT + dt : 0;
      if (c.actT <= 0 || c.stuckT > 5) { bark(); c.act = 'play'; c.spotT = 1; toy.played = true; c.ballDone = 3; } // can't get to it: leave it
    }
  } else if (c.act === 'bring') { // carry it proudly to Sadie and drop it at her feet
    speed = TROT * 1.2;
    const goal = sadie.x - Math.sign(sadie.x - c.x || 1) * 1.0 * U;
    res = walk(goal, speed, JUMP_MAX, dt);
    toy.x = c.x + c.dir * 0.95 * U; toy.y = c.y + 0.85 * U;
    const there = res === 'there' && Math.abs(sadie.y - c.y) < 1.2 * U;
    if (there || c.actT <= 0) {
      dropToy(toy.x, toy.y, c.dir * 20, 60); toy.played = true;
      if (there) { hearts(c.x, c.y, 5); emote('…', '#6d5a80', sadie.x, sadie.y + 1.6 * U, 0, 30); emit('ballBack'); } // Sadie is not impressed
      c.act = 'play'; c.spotT = 1.5; c.ballDone = 1.5;
    }
  } else if (c.act === 'gohome') {
    const sd = doorSide(), spot = doorSpot(sd), floor = barnFloor(), B = barn.piece;
    const doorClear = groundAt(spot, floor) <= floor + STEP_UP;
    if (!doorClear && c.x > B.minX && c.x < B.maxX && c.y >= B.maxY - 0.3 * U && !c.air) goIn(true); // buried: dig in from on top
    else if (doorClear && Math.abs(c.x - spot) < 0.3 * U && Math.abs(c.y - floor) < 0.4 * U && !c.air) goIn(false);
    else {
      speed = RUN * 0.8; res = walk(doorClear ? spot : barnX(), speed, JUMP_MAX, dt);
      c.stuckT = res === 'blocked' ? c.stuckT + dt : 0;
      if (c.actT <= 0 || c.stuckT > 6) goIn(true); // can't get there: he digs a tunnel home right here
    }
  } else { // play: hang around near Sadie, trotting from spot to spot
    c.spotT -= dt;
    if (c.spotT <= 0) { c.spot = Math.min(W - U, Math.max(U, sadie.x + (Math.random() < 0.5 ? -1 : 1) * (1.4 + Math.random() * 2.2) * U)); c.spotT = 2 + Math.random() * 2.5; }
    const far = Math.abs(c.spot - c.x) > 6 * U;
    speed = far ? RUN : TROT; res = walk(c.spot, speed, JUMP_MAX, dt);
    if (res === 'blocked' && c.barkT <= 0 && Math.random() < dt * 0.8) bark(); // can't get up there: woof!
    if (res === 'there' && !c.air) {
      c.hopT -= dt;
      if (c.hopT <= 0) { if (Math.random() < 0.6) jump(0, 0); else if (Math.abs(sadie.x - c.x) < 3 * U) hearts(c.x, c.y, 1); c.hopT = 1.2 + Math.random() * 2.5; }
    }
  }
  if (c.ballDone !== undefined) { c.ballDone -= dt; if (c.ballDone <= 0) { c.ballDone = undefined; if (toy.state === 'fly') poofToy(); } } // the ball's been played with
  c.moving = res === 'moving';
  c.mood = c.act === 'zoom' ? 'zoom' : c.act === 'bring' ? 'fetch' : c.pant > 0 ? 'pant' : c.barkT > 0 ? 'bark' : 'happy';
}
