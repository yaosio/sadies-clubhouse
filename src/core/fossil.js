// Fossils: pieces buried deep inside the pile that have been asleep a while turn into
// permanent ground. They still hold the pile up and look the same, but nothing can wake them.
// That keeps a landing piece from waking a long chain of pieces deep in a tall tower: only the
// top few blocks of the pile stay alive and wobbly.
import { U } from '../config.js';
import { world } from './world.js';
import { surf, SURF_N, SURF_RES } from './surface.js';

export const FOSSIL_DEPTH = 8 * U;   // how far under the pile's surface a piece must be
export const FOSSIL_REST = 3;        // seconds it must have been at rest first
const CHECK_EVERY = 0.5;             // seconds between checks (nothing here needs to be instant)
let checkT = 0;

// Lowest point of the surface above this piece's width: it must be buried by at least FOSSIL_DEPTH
// everywhere across it, not just under the tallest part of the pile.
function coverAbove(p) {
  const i0 = Math.max(0, Math.floor(p.minX / SURF_RES)), i1 = Math.min(SURF_N - 1, Math.ceil(p.maxX / SURF_RES));
  let low = Infinity;
  for (let i = i0; i <= i1; i++) if (surf[i] < low) low = surf[i];
  return low;
}

// Nothing above a fixed piece (Sadie's barn) turns to fossil: she has to be able to drag it up
// through whatever has piled on top of it.
function overFixed(p, B) { return B && p.maxX > B.minX - 0.5 * U && p.minX < B.maxX + 0.5 * U && p.maxY > B.minY; }

export function updateFossils(dt, force = false) {
  checkT += dt;
  if (checkT < CHECK_EVERY && !force) return;
  checkT = 0;
  let n = 0;
  const B = world.pieces.find(p => p.fixed);
  for (const p of world.pieces) {
    if (p.fossil) { n++; continue; }
    if (p.fixed || !p.asleep || p.rest < FOSSIL_REST || overFixed(p, B)) continue;
    if (coverAbove(p) - p.maxY >= FOSSIL_DEPTH) { p.fossil = true; n++; }
  }
  world.fossils = n;
}
