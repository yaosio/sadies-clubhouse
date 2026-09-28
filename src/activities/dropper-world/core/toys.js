// Toys the player can throw for Sadie's friends (the first one: a ball for Chooter). Only one toy
// is out at a time, and it goes away once it's been played with, so the board never fills up
// with toys. A toy isn't a jelly piece: it bounces off the pile but never pushes it around.
import { U, W } from '../config.js';
import { emit } from './events.js';
import { groundAt } from './surface.js';
import { spark } from './effects.js';
import { offersFrom } from './mind/offers.js';

export const TOY_R = 0.26 * U;       // the ball's radius
const G = 1400, BOUNCE = 0.55, LIFE = 40; // gravity, how much of its speed it keeps per bounce, seconds before it vanishes by itself
// state: none | fly (in the air or rolling) | held (in someone's mouth) | poof (vanishing)
// played: it's been fetched (or given up on), so nobody chases it again; it vanishes soon
export const toy = { kind: null, state: 'none', x: 0, y: 0, vx: 0, vy: 0, t: 0, spin: 0, pop: 0, rest: 0 };

export const toyOut = () => toy.state !== 'none';
// A thrown ball that nobody's played with yet says "chase me".
offersFrom(() => toy.state === 'fly' && !toy.played ? [{ kind: 'fetch', thing: toy, x: toy.x, y: toy.y }] : []);

// Throw it from (fx, fy) so it comes down around (tx, ty). Returns false if one is already out.
export function throwToy(kind, fx, fy, tx, ty) {
  if (toyOut()) return false;
  const T = Math.min(1.3, Math.max(0.6, 0.55 + Math.hypot(tx - fx, ty - fy) / (30 * U))); // flight time
  Object.assign(toy, { kind, state: 'fly', x: fx, y: fy, vx: (tx - fx) / T, vy: (ty - fy) / T + 0.5 * G * T, t: 0, spin: 0, pop: 0, rest: 0, played: false });
  emit('toyThrown', kind);
  return true;
}
export function holdToy() { toy.state = 'held'; toy.vx = toy.vy = 0; }
// let go of it here (it drops and bounces)
export function dropToy(x, y, vx = 0, vy = 0) { Object.assign(toy, { state: 'fly', x, y, vx, vy, t: Math.min(toy.t, LIFE - 3) }); }
// done with it: it vanishes in a little puff
export function poofToy() {
  if (toy.state === 'none' || toy.state === 'poof') return;
  toy.state = 'poof'; toy.pop = 1;
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; spark(toy.x, toy.y, Math.cos(a) * 70, Math.sin(a) * 70, 2.5, 0.7, 'rgba(255,255,255,0.9)'); }
}
// true when it's lying still (or nearly) on something
export const toyResting = () => toy.state === 'fly' && toy.rest > 0.3;

export function updateToy(dt) {
  if (toy.state === 'none' || toy.state === 'held') return;
  if (toy.state === 'poof') { toy.pop -= dt * 3; if (toy.pop <= 0) toy.state = 'none'; return; }
  toy.t += dt;
  if (toy.t > LIFE) { poofToy(); return; }
  // sideways: bounce off walls of the pile and the board's walls
  const nx = toy.x + toy.vx * dt, side = Math.sign(toy.vx);
  if (side && groundAt(nx + side * TOY_R, toy.y - TOY_R) > toy.y) toy.vx = -toy.vx * 0.5;
  else toy.x = nx;
  if (toy.x < TOY_R) { toy.x = TOY_R; toy.vx = Math.abs(toy.vx) * 0.6; }
  if (toy.x > W - TOY_R) { toy.x = W - TOY_R; toy.vx = -Math.abs(toy.vx) * 0.6; }
  toy.vy -= G * dt; toy.y += toy.vy * dt;
  const g = groundAt(toy.x, toy.y - TOY_R) + TOY_R;
  if (toy.y <= g) {
    toy.y = g; // (if something landed on it, it pops out on top)
    if (toy.vy < -90) { toy.vy = -toy.vy * BOUNCE; toy.vx *= 0.8; }
    else {
      toy.vy = 0;
      // roll downhill a little, with friction
      const slope = (groundAt(toy.x - 0.3 * U, toy.y - TOY_R) - groundAt(toy.x + 0.3 * U, toy.y - TOY_R)) / (0.6 * U);
      toy.vx = (toy.vx + Math.max(-1, Math.min(1, slope)) * 500 * dt) * Math.max(0, 1 - 2.5 * dt);
    }
  }
  toy.spin += toy.vx * dt / TOY_R;
  toy.rest = Math.abs(toy.vx) < 0.4 * U && Math.abs(toy.vy) < 0.4 * U && toy.y - g < 2 ? (toy.rest || 0) + dt : 0;
}
