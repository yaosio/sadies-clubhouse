// The piece the mole is carrying, and the supply. This is just the carrying: the mole (mole.js)
// decides where to fly and when to let go. It hovers a fixed height above the pile under it.
import { U, W, tuning } from '../config.js';
import { world } from './world.js';
import { SHAPES } from './physics/pieceTypes.js';
import { getTemplate } from './physics/templates.js';
import { makePiece } from './physics/body.js';
import { localTop } from './surface.js';

export const SUPPLY_MAX = 5, REGEN = 1.5;
// where the mole is (x, y: the middle of the piece it holds) and where it's flying to (tX); hay:
// seconds it's been holding a bundle of hay it dug up instead of a piece (null when it isn't)
export const drp = { x: W / 2, tX: W / 2, y: 3 * U, claw: 0, fly: 6 * U, hay: null };

export function drawFromBag() {
  if (!world.bag.length) { world.bag = Object.keys(SHAPES); for (let i = world.bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [world.bag[i], world.bag[j]] = [world.bag[j], world.bag[i]]; } }
  return world.bag.pop();
}

export function hoverTarget(h, x, ang) {
  const o = heldOffsets(h, ang);
  return localTop(x + o.x0 - U * 0.6, x + o.x1 + U * 0.6) + 2.5 * U - o.y0;
}
export function flyTo(x) { drp.tX = x; clampHeld(); }
export function heldOffsets(h, ang) {
  const T = h.T, c = Math.cos(ang), s = Math.sin(ang);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let q = 0; q < T.bnd.length; q++) { const i = T.bnd[q]; const x = c * T.rx[i] - s * T.ry[i], y = s * T.rx[i] + c * T.ry[i];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, x1, y0, y1 };
}
export const NO_PIECE = { x0: -U, x1: U, y0: -0.8 * U, y1: 0.8 * U };
export function clampHeld() {
  const o = world.held ? heldOffsets(world.held, world.held.tAng) : NO_PIECE;
  drp.tX = Math.min(W - o.x1, Math.max(-o.x0, drp.tX));
}
export function spawn() {
  const type = world.nextType; world.nextType = drawFromBag();
  const cs = U * tuning.set.size;
  const ang = Math.floor(Math.random() * 4) * Math.PI / 2;
  world.held = { type, cs, T: getTemplate(type, cs), ang, tAng: ang };
  clampHeld();
  drp.y = Math.max(drp.y, hoverTarget(world.held, drp.x, ang));
}
// Let go of the piece. The mole only does this with a full supply, so it's never faster than one
// piece every REGEN seconds.
export function dropHeld() {
  if (!world.held || world.supply < 1) return false;
  world.supply -= 1;
  const h = world.held;
  const y = Math.max(drp.y, hoverTarget(h, drp.x, h.tAng) - U);
  world.pieces.push(makePiece(h.type, h.cs, drp.x, y, h.tAng));
  world.held = null; world.spawnTimer = 0.35; drp.claw = 1;
  return true;
}
// Holding a piece with a full supply, within `tol` of where it's flying to, the piece turned straight.
export const readyToDrop = (tol = 0.15 * U) => !!world.held && world.supply >= SUPPLY_MAX - 1e-6
  && Math.abs(drp.x - drp.tX) < tol && Math.abs(world.held.ang - world.held.tAng) < 0.05;

export function updateDropper(dt) {
  world.supply = Math.min(SUPPLY_MAX, world.supply + dt / REGEN);
  // held piece hovers a few blocks above the pile
  {
    const o = world.held ? heldOffsets(world.held, world.held.tAng) : NO_PIECE;
    const target = localTop(drp.x + o.x0 - U * 0.6, drp.x + o.x1 + U * 0.6) + 2.5 * U - o.y0;
    drp.y += (target - drp.y) * Math.min(1, dt * (target > drp.y ? 10 : 2));
    const d = drp.tX - drp.x, v = Math.min(drp.fly, Math.abs(d) * 4); // flies over, slowing as it arrives
    drp.x += Math.sign(d) * Math.min(Math.abs(d), v * dt);
    drp.claw = Math.max(0, drp.claw - dt * 2.5);
  }
  if (world.held) world.held.ang += (world.held.tAng - world.held.ang) * Math.min(1, dt * 18);
  else if (drp.hay === null) {
    world.spawnTimer -= dt; if (world.spawnTimer <= 0) spawn();
  }
}
