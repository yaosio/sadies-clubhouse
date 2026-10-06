// Chooter at the pool: full of energy. Most of the time he runs laps round it and every lap or two
// runs up the diving board and jumps off, swims to the ladder and climbs out. When you arrive at the
// pool he goes crazy for about 15 seconds: runs circles round you, charges and jumps at you, zooms
// about and bounces off whatever he hits. Then he gets bored, sits and pants, and goes back to his
// laps; if you leave and come back he goes crazy again. Plain numbers, no drawing (sim.js moves him,
// pool.js draws him). The 15 seconds, the speeds and the rest are Claude's numbers.
import { BOARD, DECK, LADDER, LAP, DIVE_AT, POOL, COPING, WATER_Y, keepOn, inWater, inRect, RECTS } from './layout.js';

const G = 9.8;
export const EXCITED = 15;                 // how long he stays crazy after you arrive (about, seconds)
const rand = (a, b) => a + Math.random() * (b - a);
const GAP = 0.3;                           // how much room he takes up

export function makeChooter() {
  return { x: LAP[0][0], z: LAP[0][1], y: 0, vx: 0, vz: 0, vy: 0, mode: 'lap', sub: null, pose: 'run0', i: 1, lapsToDive: 1, travelled: 0, pending: false, crazy: 0, timer: 0, theta: 0, bored: false };
}

// you have arrived at the pool (he'll go crazy as soon as he's on his feet)
export function arrive(c) { c.pending = true; }

const toward = (c, x, z, speed, dt, sharp = 8) => {
  const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz) || 1, k = Math.min(1, dt * sharp);
  c.vx += (dx / d * speed - c.vx) * k; c.vz += (dz / d * speed - c.vz) * k;
  return d;
};
// somewhere on dry deck he can run to
function anywhere() {
  for (let n = 0; n < 20; n++) {
    const x = rand(DECK.x0 + 1, DECK.x1 - 1), z = rand(DECK.z0 + 1, DECK.z1 - 1);
    if (!RECTS.some(r => inRect(x, z, r, 0.5))) return [x, z];
  }
  return [LAP[0][0], LAP[0][1]];
}

// one step: `ctx.you` is where you are on the deck ({x, z}) or null; `ctx.emit(type, x, z, strength)`:
// 'splash' (he went in) and 'bump' (he bounced off something)
export function stepChooter(c, dt, { you, emit }) {
  const run = () => {   // moving: his feet go (two pictures)
    c.travelled += Math.hypot(c.vx, c.vz) * dt;
    c.pose = c.y > 0.05 ? 'air' : Math.floor(c.travelled * 1.8) % 2 ? 'run1' : 'run0';
  };
  const walk = () => { c.x += c.vx * dt; c.z += c.vz * dt; };
  // moving about on the deck: stays out of the water and bounces off what he hits (the harder he's going, the more)
  const bounce = () => {
    const n = keepOn(c, GAP);
    if (!n) return;
    const vn = c.vx * n.x + c.vz * n.z;
    if (vn < 0) { c.vx -= 2 * vn * n.x; c.vz -= 2 * vn * n.z; if (c.mode === 'crazy' && c.y < 0.05) { c.vy = 2.3; emit('bump', c.x, c.z, Math.min(1, -vn / 6)); } }
  };
  const fall = () => { c.y += c.vy * dt; c.vy -= G * dt; };

  if (c.pending && !you) c.pending = false;   // (you've gone already)
  if (c.pending && (c.mode === 'lap' || c.mode === 'sit')) {
    c.pending = false; c.mode = 'crazy'; c.crazy = EXCITED + rand(-1, 1); c.sub = 'orbit'; c.timer = rand(2.5, 3.5);
    c.theta = Math.atan2(c.z - you.z, c.x - you.x);
  }

  switch (c.mode) {
    case 'lap': {
      const [tx, tz] = LAP[c.i];
      if (toward(c, tx, tz, 3.8, dt) < 0.5) {
        if (c.i === DIVE_AT && c.lapsToDive <= 0) { c.mode = 'board'; c.lapsToDive = 1 + Math.floor(Math.random() * 2); break; }
        c.i = (c.i + 1) % LAP.length;
        if (c.i === 1) c.lapsToDive--;
      }
      walk(); bounce(); run();
      break;
    }
    case 'board': {   // up and along the board, no stopping
      c.vx = 0; c.vz = -3.2; c.z += c.vz * dt;
      c.x += (BOARD.x - c.x) * Math.min(1, dt * 6);
      c.y = BOARD.y * Math.max(0, Math.min(1, (BOARD.base + 0.9 - c.z) / 1.3));
      c.travelled += 3.2 * dt; c.pose = Math.floor(c.travelled * 1.8) % 2 ? 'run1' : 'run0';
      if (c.z <= BOARD.tip + 0.15) { c.mode = 'air'; c.vy = 4.2; c.vz = -3.2; c.vx = rand(-0.4, 0.4); c.pose = 'air'; }
      break;
    }
    case 'air': {   // the dive
      c.x += c.vx * dt; c.z += c.vz * dt; fall();
      if (c.y <= WATER_Y && inWater(c.x, c.z)) { c.y = WATER_Y; c.vy = 0; c.mode = 'swim'; c.pose = 'swim'; emit('splash', c.x, c.z, 1); }
      else if (c.y <= 0) { c.y = 0; c.vy = 0; c.mode = 'lap'; c.i = 0; }   // (landed on the deck, somehow: carry on)
      break;
    }
    case 'swim': {
      const tx = POOL.x0 + 0.3, tz = LADDER.z;
      const dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz);
      if (d < 0.4) { c.mode = 'hopout'; c.x = COPING.x0 - 0.35; c.z = LADDER.z; c.vx = -1.2; c.vz = 0; c.vy = 3; c.pose = 'air'; break; }
      c.vx = dx / d * 1.8; c.vz = dz / d * 1.8;   // (a doggy paddle)
      c.x += c.vx * dt; c.z += c.vz * dt;
      c.pose = 'swim';
      break;
    }
    case 'hopout': {
      c.x += c.vx * dt; fall(); c.pose = 'air';
      if (c.y <= 0) { c.y = 0; c.vy = 0; c.mode = 'lap'; c.i = 0; }
      break;
    }
    case 'sit': {
      c.vx = c.vz = 0; c.pose = 'sit'; c.timer -= dt;
      if (c.timer <= 0) { c.mode = 'lap'; c.i = 1; }
      break;
    }
    case 'crazy': {
      c.crazy -= dt; c.timer -= dt;
      if (!you) c.crazy = Math.min(c.crazy, 0);   // (nobody's watching any more)
      if (c.crazy <= 0 && c.y <= 0.05) { c.mode = you ? 'sit' : 'lap'; c.timer = 2.5; c.vx *= 0.3; c.vz *= 0.3; if (!you) c.i = 1; break; }
      const nextSub = () => { c.sub = ({ orbit: 'charge', charge: 'zoom', zoom: 'orbit', rebound: 'zoom' })[c.sub] || 'orbit'; c.timer = c.sub === 'zoom' ? rand(1.6, 2.2) : rand(2.5, 3.5); c.target = null; c.theta = Math.atan2(c.z - (you?.z ?? c.z), c.x - (you?.x ?? c.x)); };
      const at = you || { x: c.x, z: c.z };
      if (c.sub === 'orbit') {   // circles round you
        c.theta += 2.3 * dt;
        toward(c, at.x + Math.cos(c.theta) * 2.3, at.z + Math.sin(c.theta) * 2.3, 6, dt, 10);
        if (c.timer <= 0) { c.sub = 'charge'; c.windup = 0.5; c.timer = 4; }
      } else if (c.sub === 'charge') {   // a play-bow, then straight at you, and a jump when he's close
        if (c.windup > 0) { c.windup -= dt; c.vx *= 0.8; c.vz *= 0.8; c.pose = 'bow'; }
        else {
          const d = toward(c, at.x, at.z, 6.5, dt, 12);
          if (d < 2.4 && c.y <= 0.05) {
            const k = (d - 1.2) / 0.82 / (d || 1);
            c.vx = (at.x - c.x) * k; c.vz = (at.z - c.z) * k; c.vy = 4; c.sub = 'jump';
          } else if (c.timer <= 0) nextSub();
        }
      } else if (c.sub === 'jump') {   // in the air at you, and then off away from you
        if (c.y <= 0 && c.vy <= 0) {
          c.y = 0; c.vy = 0;
          const dx = c.x - at.x, dz = c.z - at.z, d = Math.hypot(dx, dz) || 1;
          c.vx = dx / d * 5; c.vz = dz / d * 5; c.sub = 'rebound'; c.timer = 0.7;
        }
      } else if (c.sub === 'rebound') {
        if (c.timer <= 0) nextSub();
      } else {   // zoom: somewhere else, bouncing off whatever's in the way
        if (!c.target) c.target = anywhere();
        if (toward(c, c.target[0], c.target[1], 7, dt, 5) < 0.7) c.target = anywhere();
        if (c.timer <= 0) nextSub();
      }
      walk(); bounce();
      if (c.vy !== 0 || c.y > 0) { fall(); if (c.y <= 0) { c.y = 0; c.vy = 0; } }
      if (c.sub === 'charge' && c.windup > 0) c.pose = 'bow'; else run();
      break;
    }
  }
  // the very start: if he ever ends up in the water by some accident, he swims out
  if (c.mode !== 'swim' && c.mode !== 'air' && c.mode !== 'board' && c.mode !== 'hopout' && inWater(c.x, c.z)) { c.mode = 'swim'; c.y = WATER_Y; }
}
