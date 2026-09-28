// Chooter: Sadie's first friend, a black lab/pitbull mix (see docs/CHARACTERS.md). Manic,
// energetic, and he loves absolutely everybody. Everything he does is play to him, even when
// it's annoying. Before they meet he's just next door, listening: every thud, squish and topple,
// and Sadie dragging her barn about, winds him up (it sounds like SO much fun), and once he can't
// stand it any longer he bursts in to meet her. Later he moves into her barn.
//
// What he does comes from how he feels, through the shared thinking in mind/think.js:
//   energy  - winds up on its own. Once he's full of it he gets the zoomies: he tears back and
//             forth across the pile, leaping over bumps and knocking pieces out of his way, until
//             it's all used up. How fast it winds back up changes a little each time.
//   tired   - creeps up while he's out and about (faster during the zoomies). Once he's worn out
//             he goes home to the barn for a rest and pokes his head out of the hayloft window.
//   missing - wanting to say hello to a friend. Full when he first meets Sadie.
//   ignored - builds while he plays next to Sadie and she pays him no attention (she's a cat; she
//             never does), and when she's unimpressed with the ball he brings her. Once he's had
//             enough, he snatches the hay she's going for and plays keep-away. To him it's a
//             game, and her chasing him is exactly the attention he wanted.
// Anything that says "chase me" (a thrown ball) beats everything but the zoomies: he chases it
// and proudly brings it to Sadie. Otherwise he plays near his friend.
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
import { pickUpHay, putDownHay } from '../hay.js';
import { drift, nudge } from '../mind/feelings.js';
import { offers, offersFrom } from '../mind/offers.js';
import { think, switchTo, done } from '../mind/think.js';
import { mindsFrom } from '../mind/thoughts.js';

const TROT = 2.2 * U, RUN = 4.2 * U, ZOOM = 6.5 * U;
const G = 1400, JUMP_MAX = 2.6 * U, ZOOM_JUMP_MAX = 3.2 * U; // he can leap up ledges this tall
const KICK = 5 * U, KICK_UP = 3.5 * U;           // how hard the zoomies knock a piece (px/s)
const DOOR_TIME = 0.7, DIG_TIME = 1.2;
const rnd = ([a, b]) => a + Math.random() * (b - a);

// ---------- feelings ----------
const WIND_UP = [40, 75];       // seconds for his energy to fill up again after the zoomies
const FIRST_ZOOM = 20;          // on a fresh board he's this close to his first zoomies (30 once just met)
const ZOOM_LEN = [7, 10];       // seconds his energy lasts once the zoomies start
const TIRED_OUT = [70, 120];    // seconds out and about before he's worn out (varies each outing)
const ZOOM_TIRES = 2;           // the zoomies tire him this many times faster
const REST = [25, 45];          // seconds of rest in the barn before he's ready to go again
const IGNORED_FILL = 75;        // seconds of playing next to Sadie, with no attention back, before he's had enough
const UNIMPRESSED = 0.25;       // how much it stings when she's not impressed with the ball
const freshFeelings = () => ({ energy: 0, tired: 0, missing: 0, ignored: 0 });

// ---------- before they meet: he can hear it all from next door ----------
export const HEAR_FULL = 3500;  // how much noise it takes to wind him all the way up (a new board makes about 850 a minute)
export const HEAR_FASTEST = 150; // he can't get worked up any faster than this many seconds, however loud it is
const HAUL_NOISE = 60;          // the barn scraping along behind Sadie, per second (as loud as a lot of thuds)
export const PEEK_AT = 0.6;     // this wound up, he can't help peeking in at the edge of the board

// place: out | home | door (going in or out through the cat flap) | dig (digging into a buried barn)
// doing: greet | play | zoom | fetch | tease | home (see think.js); carrying: he has the ball in his
// mouth; loot: the hay he's snatched
export const chooter = {
  met: !!store.get('sadie.chooter.met', false), movedIn: !!store.get('sadie.chooter.movedIn', false),
  heard: 0, ringing: 0, peek: 0, peekPhase: 0, peekSide: 1, // before they meet: how wound up he is by all the noise, and how far his head is poking in
  place: 'out', doing: null, x: 0, y: 0, vx: 0, vy: 0, air: false, dir: 1, phase: 0, mood: 'happy', carrying: false, loot: null, hay: null,
  feel: freshFeelings(), windUp: 1 / 55, outFor: 95, restFor: 35,
  actT: 0, spotT: 0, spot: 0, stuckT: 0, doorT: 0, doorIn: false, doorX: 0, barkT: 0, hopT: 0, pant: 0,
};
// once they've met, Chooter is a friend too; and wanting attention makes him restless
offersFrom(() => chooter.met && chooter.place === 'out' ? [{ kind: 'friend', thing: chooter, x: chooter.x, y: chooter.y },
  { kind: 'restless', thing: chooter, name: 'Chooter', x: chooter.x, y: chooter.y, how: chooter.feel.ignored }] : []);

function landDust(n) { for (let k = 0; k < n; k++) spark(chooter.x + (Math.random() - 0.5) * 0.8 * U, chooter.y + 0.05 * U, (Math.random() - 0.5) * 90, 20 + Math.random() * 40, 2 + Math.random() * 2.5, 0.6, 'rgba(210,190,170,0.8)'); }
function hearts(x, y, n) { for (let k = 0; k < n; k++) emote('♥', '#ff4f86', x + (Math.random() - 0.5) * U, y + 1.4 * U, (Math.random() - 0.5) * 50, 50 + Math.random() * 40); }
function bark() { const c = chooter; emote('Woof!', '#3a2658', c.x + c.dir * 0.8 * U, c.y + 1.7 * U, c.dir * 12, 38); c.barkT = 0.5; }

// Start a fresh board: if Sadie already knows him, he's out playing beside the barn.
export function resetChooter() {
  const c = chooter;
  if (!c.met) return;
  Object.assign(c, { place: 'out', doing: null, carrying: false, loot: null, hay: null, vx: 0, vy: 0, air: false, dir: -1, phase: 0, stuckT: 0, pant: 0, barkT: 0, spotT: 0 });
  c.x = Math.min(W - 0.5 * U, barnX() + BARN_HALF + 1.2 * U); c.y = groundAt(c.x, 0);
  newOuting(); c.windUp = 1 / 55; c.feel.energy = 1 - FIRST_ZOOM * c.windUp;
}
export function meetChooter() {
  const c = chooter;
  if (c.heard < PEEK_AT) c.peekSide = sadie.x < W / 2 ? -1 : 1; // never peeked (the dev sheet): the side nearer her
  c.met = true; store.set('sadie.chooter.met', true); c.heard = 1; c.ringing = 0; c.peek = 0;
  // he bursts in over the wall where he's been peeking, with a big leap onto the pile
  c.dir = -c.peekSide; c.x = c.peekSide > 0 ? W - 0.6 * U : 0.6 * U; c.y = groundAt(c.x, 1e9);
  Object.assign(c, { place: 'out', doing: null, carrying: false, loot: null, hay: null, vx: 0, vy: 0, air: false, stuckT: 0 });
  jump(1.2 * U, c.dir * RUN); bark(); landDust(12);
  newOuting(); c.windUp = 1 / 55; c.feel.energy = 1 - (FIRST_ZOOM + 10) * c.windUp; c.feel.missing = 1;
  emit('friendMet', 'Chooter');
}
// Heading out of the barn (or onto a fresh board): rested, and how long he'll last this time.
function newOuting() { chooter.feel.tired = 0; chooter.outFor = rnd(TIRED_OUT); }

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
// ---------- the zoomies: knock pieces out of his way ----------
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
  newOuting(); c.spotT = 0; c.air = false; c.vx = c.vy = 0;
  if (groundAt(x, floor) > floor + STEP_UP) { // buried: he digs his way out on top of the pile
    c.place = 'out'; c.x = barnX(); c.y = groundAt(c.x, floor); landDust(14); done(c);
    return;
  }
  c.place = 'door'; c.doorIn = false; c.doorT = 0; c.doorX = x; c.x = barnX(); c.y = floor; c.dir = sd;
}

// ---------- what he does ----------
const wantsBall = () => offers('fetch').length > 0;

// Run over to his friend and say hello.
const greet = {
  want: c => c.feel.missing >= 1 ? 4 : 0,
  start: c => { c.actT = 0; },
  step(c, dt) {
    c.actT -= dt;
    const goal = sadie.x - Math.sign(sadie.x - c.x) * 1.1 * U;
    const res = walk(goal, RUN, JUMP_MAX, dt);
    if ((res === 'there' && Math.abs(sadie.y - c.y) < 1.5 * U) || c.actT < -15) {
      hearts(c.x, c.y, 6); hearts(sadie.x, sadie.y, 4); bark(); c.feel.missing = 0; c.spotT = 2; done(c);
    }
    return res;
  },
};

// Hang around near his friend, trotting from spot to spot, hopping for joy.
const play = {
  want: () => 1,
  step(c, dt) {
    const friend = offers('friend').find(o => o.thing !== c) || { x: c.x };
    c.spotT -= dt;
    if (c.spotT <= 0) { c.spot = Math.min(W - U, Math.max(U, friend.x + (Math.random() < 0.5 ? -1 : 1) * (1.4 + Math.random() * 2.2) * U)); c.spotT = 2 + Math.random() * 2.5; }
    const far = Math.abs(c.spot - c.x) > 6 * U;
    const res = walk(c.spot, far ? RUN : TROT, JUMP_MAX, dt);
    if (res === 'blocked' && c.barkT <= 0 && Math.random() < dt * 0.8) bark(); // can't get up there: woof!
    if (res === 'there' && !c.air) {
      c.hopT -= dt;
      if (c.hopT <= 0) { if (Math.random() < 0.6) jump(0, 0); else if (Math.abs(sadie.x - c.x) < 3 * U) hearts(c.x, c.y, 1); c.hopT = 1.2 + Math.random() * 2.5; }
    }
    return res;
  },
};

// Full of energy: tear back and forth until it's used up. Too tired for it once he's worn out.
const zoom = {
  want: c => c.feel.energy >= 1 && c.feel.tired < 1 ? 2 : 0,
  busy: c => c.feel.energy > 0 || c.air,
  start(c) {
    c.zoomLen = rnd(ZOOM_LEN); c.spot = pickZoomSpot(c.dir); c.hopT = 0.5;
    emote('!', '#ff4f86', c.x, c.y + 1.6 * U, 0, 45);
    emit('zoomies');
  },
  step(c, dt) {
    kickAhead();
    let res = walk(c.spot, ZOOM, ZOOM_JUMP_MAX, dt);
    if (res === 'blocked') { kickAhead(); c.dir = -c.dir; c.spot = pickZoomSpot(c.dir); }
    else if (res === 'there') c.spot = pickZoomSpot(-c.dir);
    c.hopT -= dt;
    if (!c.air && c.hopT <= 0) { jump(0, c.dir * ZOOM); c.hopT = 0.6 + Math.random() * 1.2; } // bouncing with joy
    if (c.feel.energy <= 0 && !c.air) { c.windUp = 1 / rnd(WIND_UP); c.pant = 4; c.spotT = 1; done(c); }
    return res;
  },
};

// Something says "chase me": run after it, grab it, and carry it proudly to his friend.
const fetchBall = {
  want: () => wantsBall() ? 3 : 0,
  busy: c => c.carrying,
  start(c) { c.actT = 25; c.stuckT = 0; bark(); },
  step(c, dt) {
    c.actT -= dt;
    if (!c.carrying) {
      const res = walk(toy.x, RUN, JUMP_MAX, dt);
      const close = Math.abs(toy.x - c.x) < 0.6 * U && toy.y - c.y < 1.2 * U && toy.y - c.y > -0.3 * U;
      if (close && (toyResting() || toy.vy < 0)) { holdToy(); c.carrying = true; c.actT = 18; c.stuckT = 0; }
      c.stuckT = res === 'blocked' ? c.stuckT + dt : 0;
      if (c.actT <= 0 || c.stuckT > 5) { bark(); c.spotT = 1; toy.played = true; c.ballDone = 3; done(c); } // can't get to it: leave it
      return res;
    }
    // carry it to Sadie and drop it at her feet
    const goal = sadie.x - Math.sign(sadie.x - c.x || 1) * 1.0 * U;
    const res = walk(goal, TROT * 1.2, JUMP_MAX, dt);
    toy.x = c.x + c.dir * 0.95 * U; toy.y = c.y + 0.85 * U;
    const there = res === 'there' && Math.abs(sadie.y - c.y) < 1.2 * U;
    if (there || c.actT <= 0) {
      dropToy(toy.x, toy.y, c.dir * 20, 60); toy.played = true; c.carrying = false;
      if (there) { hearts(c.x, c.y, 5); emote('…', '#6d5a80', sadie.x, sadie.y + 1.6 * U, 0, 30); emit('ballBack'); nudge(c.feel, 'ignored', UNIMPRESSED); } // Sadie is not impressed
      c.spotT = 1.5; c.ballDone = 1.5; done(c);
    }
    return res;
  },
  stop: c => { if (c.carrying) { c.carrying = false; dropToy(toy.x, toy.y); } },
};

// Had enough of being ignored: snatch the hay Sadie's going for and play keep-away with it.
// He darts off when she gets close and waits, bouncing, when she falls behind. It ends when she
// catches him and eats it out of his mouth, or when he gets bored and drops it.
const HAY_REACH = JUMP_MAX + 1.3 * U; // how high above the pile he can snatch something with a leap
const KEEP_AWAY = 20;                // seconds before he gets bored and drops it
const herHay = () => { // the hay Sadie's after, if he could get it
  const h = sadie.doing === 'eat' ? sadie.target : null;
  return h && !h.eaten && !h.carried && h.y - groundAt(h.x, h.y) <= HAY_REACH ? h : null;
};
const tease = {
  want: c => c.feel.ignored >= 1 && herHay() ? 2.5 : 0,
  busy: c => !!c.loot,
  start(c) { c.hay = herHay(); c.actT = 12; c.stuckT = 0; c.flee = 0; },
  stop(c) { if (c.loot) putDownHay(c.loot); c.loot = c.hay = null; },
  step(c, dt) {
    c.actT -= dt;
    if (!c.loot) { // go and get it
      const h = c.hay, mouthY = c.y + 0.85 * U;
      if (!h || h.eaten || h.carried || c.actT <= 0) { c.hay = null; done(c); return 'there'; } // Sadie got there first, or he can't
      if (Math.abs(h.x - c.x) < 0.7 * U && Math.abs(h.y - mouthY) < 0.6 * U) { // got it!
        pickUpHay(h); c.loot = h; c.hay = null; c.actT = KEEP_AWAY; c.hopT = 0.3; bark(); emit('hayStolen', h);
        return 'there';
      }
      const res = walk(h.x, RUN, JUMP_MAX, dt);
      c.stuckT = res === 'blocked' ? c.stuckT + dt : 0;
      if (c.stuckT > 4) { c.hay = null; done(c); }
      else if (res === 'there' && !c.air && h.y > mouthY) jump(Math.min(JUMP_MAX, h.y - c.y - 1.3 * U), 0); // leap for it
      return res;
    }
    const h = c.loot;
    if (h.eaten) { c.loot = null; c.feel.ignored = 0; hearts(c.x, c.y, 4); c.spotT = 1; done(c); return 'there'; } // she got him! best game ever
    let res = 'there';
    const d = c.x - sadie.x;
    // She's close: pick a way to run and stick to it until he's well clear (deciding afresh every
    // moment makes him flip back and forth when she's right on top of him).
    if (!c.flee && Math.abs(d) < 3 * U) c.flee = Math.sign(d) || c.dir;
    else if (c.flee && Math.abs(d) > 4 * U) c.flee = 0;
    if (c.flee) {
      const goal = Math.min(W - U, Math.max(U, c.x + c.flee * 4 * U));
      if (Math.abs(goal - c.x) < 0.5 * U) { c.dir = -c.flee; c.phase += dt * 3; } // backed into the wall: caught! he turns to her, wagging
      else res = walk(goal, TROT * 1.4, JUMP_MAX, dt);
    } else if (!c.air) { // she's behind: face her and bounce, come on!
      c.dir = Math.sign(-d) || c.dir; c.hopT -= dt;
      if (c.hopT <= 0) { jump(0, 0); c.hopT = 0.7 + Math.random() * 0.8; }
    }
    h.x = c.x + c.dir * 0.95 * U; h.y = c.y + 0.85 * U;
    if (c.actT <= 0) { putDownHay(h); c.loot = null; c.feel.ignored = 0; c.spotT = 1; done(c); } // bored: drops it
    return res;
  },
};

// Worn out: go home to the barn (in through the cat flap, or dig in if it's buried), rest, and
// come back out once rested, or straight away if someone throws a ball.
const home = {
  want: c => c.feel.tired >= 1 && toy.state === 'none' ? 1.5 : 0,
  busy: c => c.place !== 'out',
  start(c) { c.actT = 30; c.stuckT = 0; },
  step(c, dt) {
    if (c.place === 'home') {
      c.phase += dt; c.mood = 'home';
      if (c.feel.tired <= 0 || wantsBall()) comeOut(); // a thrown ball always gets him out
      return 'there';
    }
    if (c.place === 'door' || c.place === 'dig') { // walking in or out through the flap, or digging down
      c.doorT += dt;
      const T = c.place === 'dig' ? DIG_TIME : DOOR_TIME, k = Math.min(1, c.doorT / T), bx = barnX(), floor = barnFloor();
      if (c.place === 'door') {
        c.x = c.doorIn ? c.doorX + (bx - c.doorX) * k : bx + (c.doorX - bx) * k; c.y = floor; c.phase += dt * 2.5;
      } else if (Math.random() < 0.5) spark(c.x, c.y + 0.2 * U, (Math.random() - 0.5) * 160, 60 + Math.random() * 90, 2 + Math.random() * 2, 0.7, '#a8663f');
      c.mood = c.place === 'dig' ? 'dig' : 'happy';
      if (k >= 1) {
        if (c.doorIn) { c.place = 'home'; c.restFor = rnd(REST); }
        else { c.place = 'out'; c.y = groundAt(c.x, c.y); done(c); }
      }
      return 'there';
    }
    c.actT -= dt;
    const sd = doorSide(), spot = doorSpot(sd), floor = barnFloor(), B = barn.piece;
    const doorClear = groundAt(spot, floor) <= floor + STEP_UP;
    if (!doorClear && c.x > B.minX && c.x < B.maxX && c.y >= B.maxY - 0.3 * U && !c.air) { goIn(true); return 'there'; } // buried: dig in from on top
    if (doorClear && Math.abs(c.x - spot) < 0.3 * U && Math.abs(c.y - floor) < 0.4 * U && !c.air) { goIn(false); return 'there'; }
    const res = walk(doorClear ? spot : barnX(), RUN * 0.8, JUMP_MAX, dt);
    c.stuckT = res === 'blocked' ? c.stuckT + dt : 0;
    if (c.actT <= 0 || c.stuckT > 6) goIn(true); // can't get there: he digs a tunnel home right here
    return res;
  },
};

export const CHOOTER_DOES = { greet, play, zoom, fetch: fetchBall, tease, home };

// ---------- what he's thinking (the bubble you get by tapping him) ----------
function chooterThinks() {
  const c = chooter, f = c.feel;
  let doing, why;
  if (c.place === 'home') { doing = "I'm napping in the barn."; why = "I'm all worn out. I'll come out once I'm rested, or if someone throws a ball!"; }
  else if (c.place === 'dig') { doing = "I'm digging down into the barn!"; why = "The door's buried, so I'm making my own way in."; }
  else if (c.place === 'door') { doing = c.doorIn ? "I'm going in for a nap." : "I'm coming out to play!"; why = c.doorIn ? "I'm all worn out." : "I'm rested and ready for anything!"; }
  else if (c.doing === 'greet') { doing = "I'm running over to say hi to Sadie!"; why = 'I love absolutely everybody!'; }
  else if (c.doing === 'zoom') { doing = 'ZOOMIES!'; why = 'I have too much energy to hold in!'; }
  else if (c.doing === 'fetch') { doing = c.carrying ? "I'm bringing the ball to Sadie!" : "I'm chasing the ball!"; why = c.carrying ? 'I want to share it with my friend.' : 'Balls are the best thing ever!'; }
  else if (c.doing === 'tease') { doing = c.loot ? "I'm playing keep-away with Sadie's hay!" : "I'm going after Sadie's hay."; why = c.loot ? "It's a game! And now she's finally paying attention to me!" : "She's been ignoring me. This'll get her attention!"; }
  else if (c.doing === 'home') { doing = "I'm heading home for a nap."; why = "I'm all worn out."; }
  else if (c.doing === 'play') { doing = "I'm playing near Sadie!"; why = f.ignored > 0.6 ? "She hasn't paid me any attention. Not even a little." : 'I love being near my friend!'; }
  else { doing = "I'm sniffing around."; why = 'Everything is interesting!'; }
  const feelings = [
    { label: "I've got energy", value: f.energy },
    { label: "I'm tired", value: f.tired },
    { label: 'I want attention', value: f.ignored },
  ];
  if (f.missing > 0) feelings.push({ label: 'I want to say hi', value: f.missing });
  return { doing, why, feelings };
}
// While he's home, tap his face in the hayloft window.
mindsFrom(() => !chooter.met ? [] : chooter.place === 'home'
  ? [{ who: chooter, name: 'Chooter', x: barnX(), y: barnFloor() + 2.3 * U, h: 1.2 * U, think: chooterThinks }]
  : [{ who: chooter, name: 'Chooter', x: chooter.x, y: chooter.y, h: 1.2 * U, think: chooterThinks }]);
// Start an activity right now (the dev sheet's buttons).
export function chooterDo(name) { if (chooter.met && chooter.doing !== name) switchTo(chooter, CHOOTER_DOES, name); }

// ---------- before they meet: listening from next door ----------
// How much noise there was this tick: every piece that suddenly slows down (landing, squishing into
// the pile, a topple coming to a stop) makes a thud, heavier ones louder; and the barn scrapes
// along while Sadie drags it. No random numbers here, so nothing before he arrives changes.
export function listen(dt) {
  let noise = 0;
  for (const p of world.pieces) {
    if (p.fixed || p.asleep) { p.hearSpeed = 0; continue; }
    const drop = (p.hearSpeed || 0) - p.speed;
    if (drop > 0) noise += drop / p.mat.invMass;
    p.hearSpeed = p.speed;
  }
  if (sadie.trip && sadie.trip.phase === 'haul' && sadie.heave) noise += HAUL_NOISE * dt;
  return noise;
}
// Winding up, peeking in once he's close, and bursting in once he can't stand it any longer.
function wait(dt) {
  const c = chooter;
  // what he hears rings in his ears and winds him up from there, only so fast however loud it is
  c.ringing += listen(dt) / HEAR_FULL;
  const take = Math.min(c.ringing, dt / HEAR_FASTEST);
  c.ringing -= take; c.heard = Math.min(1, c.heard + take);
  if (c.heard >= 1) { meetChooter(); return; }
  // peeking: his head pops in for a few seconds now and then, more often the more wound up he is
  const close = c.heard >= PEEK_AT, k = (c.heard - PEEK_AT) / (1 - PEEK_AT);
  if (close) c.peekPhase = (c.peekPhase + dt / (22 - 14 * k)) % 1; else c.peekPhase = 0.6; // first peek a few seconds after he's wound up enough
  const out = close && c.peekPhase > 0.72;
  if (out && c.peek === 0) { // he's run round to the side nearer Sadie, where the noise is
    c.peekSide = sadie.x < W / 2 ? -1 : 1;
    const at = peekSpot(); emote('?!', '#3a2658', at.x - c.peekSide * 0.6 * U, at.y + 0.9 * U, -c.peekSide * 10, 30); // what WAS that?!
  }
  c.peek = Math.max(0, Math.min(1, c.peek + (out ? dt : -dt) * 3));
}
export const peekSpot = () => { // the middle of his head, peeking in over the wall on his side
  const sd = chooter.peekSide, x = sd > 0 ? W - 0.35 * U : 0.35 * U;
  return { x, y: groundAt(sd > 0 ? W - 0.3 * U : 0.3 * U, 1e9) + 0.5 * U };
};
function waitingThinks() {
  const c = chooter;
  return { doing: c.peek > 0 ? "I'm peeking in to see what all the noise is!" : "I'm listening at the wall.", why: 'Thuds! Squishes! Things falling over! It sounds like SO much fun in there!',
    feelings: [{ label: "I'm getting excited", value: c.heard }] };
}
mindsFrom(() => { // tap his head where it pokes in (he's just behind the wall between peeks, so the bubble stays)
  if (chooter.met || chooter.heard < PEEK_AT) return [];
  const at = peekSpot();
  return [{ who: chooter, name: 'Chooter', x: at.x, y: at.y - 0.5 * U, h: U, think: waitingThinks }];
});

// ---------- each tick ----------
export function updateChooter(dt) {
  const c = chooter;
  if (!c.met) { wait(dt); return; }
  c.barkT = Math.max(0, c.barkT - dt); c.pant = Math.max(0, c.pant - dt);
  const f = c.feel;
  if (c.place === 'home') drift(f, { tired: -1 / c.restFor }, dt);
  else if (c.place === 'out') drift(f, c.doing === 'zoom' ? { energy: -1 / c.zoomLen, tired: ZOOM_TIRES / c.outFor } : { energy: c.windUp, tired: 1 / c.outFor }, dt);
  if (c.doing === 'play') drift(f, { ignored: 1 / IGNORED_FILL }, dt); // playing next to Sadie, who pays him no attention
  if (c.place === 'out') body(dt);
  const res = think(c, CHOOTER_DOES, dt);
  if (c.place !== 'out') return;
  if (c.ballDone !== undefined) { c.ballDone -= dt; if (c.ballDone <= 0) { c.ballDone = undefined; if (toy.state === 'fly') poofToy(); } } // the ball's been played with
  c.moving = res === 'moving';
  c.mood = c.doing === 'zoom' ? 'zoom' : c.carrying || c.loot ? 'fetch' : c.pant > 0 ? 'pant' : c.barkT > 0 ? 'bark' : 'happy';
}
