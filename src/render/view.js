// The canvas, the camera, and converting between world and screen positions.
import { U, W } from '../config.js';
import { world } from '../core/world.js';
import { emit } from '../core/events.js';
import { sadie } from '../core/sadie/brain.js';
import { drp, heldOffsets, NO_PIECE } from '../core/dropper.js';
import { rockInfo } from '../core/surface.js';

// The world is drawn small, on `ctx` (a hidden canvas with one pixel per big on-screen pixel), and
// blown up onto the real canvas with hard edges (`present`), so every pixel is a visible square.
// Everything still draws in screen (CSS) pixels: `vp.k` scales that down to the small canvas.
// The dotted 90s shading is part of each drawing (render/pixels.js), not an effect over the screen.
export const cv = document.getElementById('world');
const hctx = cv.getContext('2d');
const lo = document.createElement('canvas');
export const ctx = lo.getContext('2d');
export const vp = { vw: 0, vh: 0, dpr: 1, k: 1, P: 1 };  // viewport size in CSS pixels, device pixel ratio;
// k: small-canvas pixels per CSS pixel; P: CSS pixels per big pixel (use it for 1-pixel lines)
const BLOCK_PX = 11;                               // about this many big pixels per block at the usual zoom
let Pd = 1;                                        // device pixels per big pixel (a whole number, so they're all the same size)
export const camState = { follow: true, fitZ: 1, insetB: 0, insetR: 0, room: null };  // following Sadie? default zoom for this screen;
// insetB/insetR: screen px along the bottom/right covered by the dev sheet, so Sadie stays in view;
// room: { y, px } asks the camera to keep px of screen clear above world height y (a thought bubble)

export const cam = { x: W / 2, y: 6 * U, z: 1 };
export function resize() {
  const r = cv.getBoundingClientRect(); vp.vw = r.width; vp.vh = r.height;
  vp.dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(vp.vw * vp.dpr); cv.height = Math.round(vp.vh * vp.dpr);
  const oldFit = camState.fitZ;
  camState.fitZ = Math.min(vp.vw / (13 * U), vp.vh / (15 * U));
  // the pixel size is set by the screen, not the zoom, so pixels stay the same size whatever the camera does
  Pd = Math.max(2, Math.round(camState.fitZ * U * vp.dpr / BLOCK_PX));
  vp.P = Pd / vp.dpr; vp.k = 1 / vp.P;
  lo.width = Math.ceil(cv.width / Pd); lo.height = Math.ceil(cv.height / Pd);
  cam.z = cam.z === 1 && oldFit === 1 ? camState.fitZ : cam.z * (camState.fitZ / oldFit);
}
export const sxf = x => (x - cam.x) * cam.z + vp.vw / 2;
export const syf = y => vp.vh / 2 - (y - cam.y) * cam.z;
export const toWorld = (sx, sy) => ({ x: (sx - vp.vw / 2) / cam.z + cam.x, y: (vp.vh / 2 - sy) / cam.z + cam.y });
export function clampCam() {
  cam.z = Math.min(camState.fitZ * 3, Math.max(camState.fitZ * 0.3, cam.z));
  cam.x = Math.min(W + 3 * U, Math.max(-3 * U, cam.x));
  // no looking more than a couple of blocks below the bedrock (or below the ground before there is any)
  const floor = rockInfo.low > 0 ? rockInfo.low - 2 * U + vp.vh / 2 / cam.z : -6 * U;
  cam.y = Math.min(Math.max(world.topAll, floor) + 60 * U, Math.max(floor, cam.y));
}
export function setFollow(v) { camState.follow = v; emit('followChanged', v); }
// the highest the camera will look while following: Sadie always stays well up from the bottom
const sadieCap = () => sadie.y + (vp.vh / 2 - 150 - camState.insetB) / cam.z;
const roomY = (y, px) => y - (vp.vh / 2 - px) / cam.z;
// Could the camera (following Sadie) look up far enough to leave px of screen clear above world height y?
export const roomFor = (y, px) => camState.follow && roomY(y, px) <= sadieCap();

// Camera follows Sadie (leaning toward her hay) unless the player has taken over. If the mole is
// nearby but up behind the map strip, it looks up a little, as long as Sadie stays well in view.
export function updateCamera(dt) {
  if (camState.follow) {
    const b = camState.insetB, minY = rockInfo.low + (vp.vh / 2 - 120 - b) / cam.z;
    let ty = Math.max(minY, sadie.y + (vp.vh * 0.1 - b / 2) / cam.z);
    const half = vp.vw / 2 / cam.z;
    if (Math.abs(drp.x - cam.x) < half) {
      const o = world.held ? heldOffsets(world.held, world.held.ang) : NO_PIECE;
      const moleTop = drp.y + o.y1 + 2 * U, show = moleTop - (vp.vh / 2 - 80) / cam.z, keepSadie = sadie.y + (vp.vh / 2 - 150 - b) / cam.z;
      ty = Math.max(ty, Math.min(show, keepSadie));
    }
    if (camState.room) ty = Math.max(ty, Math.min(roomY(camState.room.y, camState.room.px), sadieCap())); // room for a thought bubble above someone
    cam.y += (ty - cam.y) * Math.min(1, dt * 3);
    const T = sadie.target, lean = T ? Math.max(-half * 0.5, Math.min(half * 0.5, (T.x - sadie.x) * 0.5)) : 0;
    const r = camState.insetR / 2 / cam.z;
    const tx = W < 2 * half ? W / 2 : Math.min(W - half + U + 2 * r, Math.max(half - U, sadie.x + lean + r));
    cam.x += (tx - cam.x) * Math.min(1, dt * 4);
    cam.z += (camState.fitZ - cam.z) * Math.min(1, dt * 3);
  }
}

// Things that must stay readable (numbers, emotes) are drawn sharp on top, after the pixels:
// `crisp(fn)` runs fn(context) then, in CSS pixels.
const later = [];
export const crisp = fn => { later.push(fn); };
export function present() {
  hctx.setTransform(1, 0, 0, 1, 0, 0); hctx.imageSmoothingEnabled = false;
  hctx.drawImage(lo, 0, 0, lo.width * Pd, lo.height * Pd);
  hctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0);
  for (const fn of later) { hctx.save(); fn(hctx); hctx.restore(); }
  later.length = 0;
}
