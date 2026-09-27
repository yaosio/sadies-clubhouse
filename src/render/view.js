// The canvas, the camera, and converting between world and screen positions.
import { U, W } from '../config.js';
import { world } from '../core/world.js';
import { emit } from '../core/events.js';
import { sadie } from '../core/sadie/brain.js';
import { drp, heldOffsets, NO_PIECE } from '../core/dropper.js';

export const cv = document.getElementById('world');
export const ctx = cv.getContext('2d');
export const vp = { vw: 0, vh: 0, dpr: 1 };        // viewport size in CSS pixels and device pixel ratio
export const camState = { follow: true, fitZ: 1, insetB: 0, insetR: 0 };  // following Sadie? default zoom for this screen;
// insetB/insetR: screen px along the bottom/right covered by the dev sheet, so Sadie stays in view

export const cam = { x: W / 2, y: 6 * U, z: 1 };
export function resize() {
  const r = cv.getBoundingClientRect(); vp.vw = r.width; vp.vh = r.height;
  vp.dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(vp.vw * vp.dpr); cv.height = Math.round(vp.vh * vp.dpr);
  const oldFit = camState.fitZ;
  camState.fitZ = Math.min(vp.vw / (13 * U), vp.vh / (15 * U));
  cam.z = cam.z === 1 && oldFit === 1 ? camState.fitZ : cam.z * (camState.fitZ / oldFit);
}
export const sxf = x => (x - cam.x) * cam.z + vp.vw / 2;
export const syf = y => vp.vh / 2 - (y - cam.y) * cam.z;
export const toWorld = (sx, sy) => ({ x: (sx - vp.vw / 2) / cam.z + cam.x, y: (vp.vh / 2 - sy) / cam.z + cam.y });
export function clampCam() {
  cam.z = Math.min(camState.fitZ * 3, Math.max(camState.fitZ * 0.3, cam.z));
  cam.x = Math.min(W + 3 * U, Math.max(-3 * U, cam.x));
  cam.y = Math.min(world.topAll + 60 * U, Math.max(-6 * U, cam.y));
}
export function setFollow(v) { camState.follow = v; emit('followChanged', v); }

// Camera follows Sadie (leaning toward her hay) unless the player has taken over. If the mole is
// nearby but up behind the map strip, it looks up a little, as long as Sadie stays well in view.
export function updateCamera(dt) {
  if (camState.follow) {
    const b = camState.insetB, minY = (vp.vh / 2 - 120 - b) / cam.z;
    let ty = Math.max(minY, sadie.y + (vp.vh * 0.1 - b / 2) / cam.z);
    const half = vp.vw / 2 / cam.z;
    if (Math.abs(drp.x - cam.x) < half) {
      const o = world.held ? heldOffsets(world.held, world.held.ang) : NO_PIECE;
      const moleTop = drp.y + o.y1 + 2 * U, show = moleTop - (vp.vh / 2 - 80) / cam.z, keepSadie = sadie.y + (vp.vh / 2 - 150 - b) / cam.z;
      ty = Math.max(ty, Math.min(show, keepSadie));
    }
    cam.y += (ty - cam.y) * Math.min(1, dt * 3);
    const T = sadie.target, lean = T ? Math.max(-half * 0.5, Math.min(half * 0.5, (T.x - sadie.x) * 0.5)) : 0;
    const r = camState.insetR / 2 / cam.z;
    const tx = W < 2 * half ? W / 2 : Math.min(W - half + U + 2 * r, Math.max(half - U, sadie.x + lean + r));
    cam.x += (tx - cam.x) * Math.min(1, dt * 4);
    cam.z += (camState.fitZ - cam.z) * Math.min(1, dt * 3);
  }
}
