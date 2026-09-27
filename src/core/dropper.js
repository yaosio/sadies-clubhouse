// The dropper drone and the piece supply. It stays where the player puts it, hovers a fixed height
// above the pile under it, and releases a piece by itself whenever the supply is full.
import { U, W, tuning } from '../config.js';
import { world } from './world.js';
import { emit } from './events.js';
import { SHAPES } from './physics/pieceTypes.js';
import { getTemplate } from './physics/templates.js';
import { makePiece } from './physics/body.js';
import { localTop } from './surface.js';

export const SUPPLY_MAX = 5, REGEN = 1.5, AUTO_IDLE = 1.2;
export function touchPiece() { world.lastInteract = world.gameTime; }
// the dropper: stays where the player puts it, hovers a fixed height above the pile below it
export const drp = { x: W / 2, tX: W / 2, y: 3 * U, claw: 0 };

export function drawFromBag() {
  if (!world.bag.length) { world.bag = Object.keys(SHAPES); for (let i = world.bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [world.bag[i], world.bag[j]] = [world.bag[j], world.bag[i]]; } }
  return world.bag.pop();
}

export function hoverTarget(h, x, ang) {
  const o = heldOffsets(h, ang);
  return localTop(x + o.x0 - U * 0.6, x + o.x1 + U * 0.6) + 2.5 * U - o.y0;
}
export function sendHeldTo(x) { drp.tX = x; clampHeld(); touchPiece(); emit('playerActed'); }
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
  const type = world.nextType; world.nextType = drawFromBag(); emit('nextChanged', world.nextType);
  const cs = U * tuning.set.size;
  const ang = Math.floor(Math.random() * 4) * Math.PI / 2;
  world.held = { type, cs, T: getTemplate(type, cs), ang, tAng: ang };
  clampHeld();
  drp.y = Math.max(drp.y, hoverTarget(world.held, drp.x, ang));
}
export function moveHeld(dx) { drp.tX += dx; clampHeld(); touchPiece(); }
export function rotateHeld(dir) { if (!world.held) return; world.held.tAng += dir * Math.PI / 2; clampHeld(); touchPiece(); }
export function dropHeld(auto) {
  if (!world.held || world.supply < 1) return;
  world.supply -= 1;
  if (!auto) world.lastInteract = world.gameTime;
  const h = world.held;
  const y = Math.max(drp.y, hoverTarget(h, drp.x, h.tAng) - U);
  world.pieces.push(makePiece(h.type, h.cs, drp.x, y, h.tAng));
  world.held = null; world.spawnTimer = 0.35; drp.claw = 1;
  emit('playerActed');
}

export function updateDropper(dt) {
  world.supply = Math.min(SUPPLY_MAX, world.supply + dt / REGEN);
  // held piece hovers a few blocks above the pile
  {
    const o = world.held ? heldOffsets(world.held, world.held.tAng) : NO_PIECE;
    const target = localTop(drp.x + o.x0 - U * 0.6, drp.x + o.x1 + U * 0.6) + 2.5 * U - o.y0;
    drp.y += (target - drp.y) * Math.min(1, dt * (target > drp.y ? 10 : 2));
    drp.x += (drp.tX - drp.x) * Math.min(1, dt * 20);
    drp.claw = Math.max(0, drp.claw - dt * 2.5);
  }
  if (world.held) {
    world.held.ang += (world.held.tAng - world.held.ang) * Math.min(1, dt * 18);
    // autopilot: once the supply is full and the player isn't handling the dropper, it drops where it is
    if (world.supply >= SUPPLY_MAX - 1e-6 && world.gameTime - world.lastInteract > AUTO_IDLE && !world.holdingDropper
        && Math.abs(drp.x - drp.tX) < 0.15 * U && Math.abs(world.held.ang - world.held.tAng) < 0.05) dropHeld(true);
  } else {
    world.spawnTimer -= dt; if (world.spawnTimer <= 0) spawn();
  }
}
