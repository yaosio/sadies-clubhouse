// The canvas, the camera, and converting between world and screen positions.
import { U, W } from '../config.js';
import { world } from '../core/world.js';
import { sadie } from '../core/sadie/brain.js';
import { drp, heldOffsets, NO_PIECE } from '../core/dropper.js';
import { rockInfo } from '../core/surface.js';

// The world is drawn small, on `ctx` (a canvas with one pixel per big on-screen pixel), and the
// browser blows that canvas up to fill the screen with hard edges (CSS `image-rendering: pixelated`),
// so every pixel is a visible square. That scaling happens on the graphics chip for free: blowing it
// up ourselves every frame took over half of each frame's time. Everything still draws in screen
// (CSS) pixels: `vp.k` scales that down to the small canvas. The dotted 90s shading is part of each
// drawing (render/pixels.js), not an effect over the screen. `cv` (#world) is a sharp full-size
// canvas on top: it takes the touches, and holds the few things drawn sharp (`crisp`).
export const cv = document.getElementById('world');
const hctx = cv.getContext('2d');
const lo = document.getElementById('pixels');
const loCtx = lo.getContext('2d', { alpha: false });
export let ctx = loCtx; // what everything draws on: the board's small canvas, or for a moment a face in the dashboard (drawFace)
export const vp = { vw: 0, vh: 0, dpr: 1, k: 1, P: 1 };  // viewport size in CSS pixels, device pixel ratio (of the sharp canvas);
// k: small-canvas pixels per CSS pixel; P: CSS pixels per big pixel (use it for 1-pixel lines)
const BLOCK_PX = 11;                               // about this many big pixels per block at the usual zoom
export const camState = { follow: true, fitZ: 1, insetB: 0, insetR: 0 };  // following Sadie? default zoom for this screen;
// insetB/insetR: board px along the bottom/right covered by the dev sheet, so Sadie stays in view

export const cam = { x: W / 2, y: 6 * U, z: 1 };
// Resizing the canvases wipes them, so it only happens when the board's size really changed; it
// says whether it did, so the picture can be drawn again straight away (or that frame shows black).
export function resize() {
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  if (r.width === vp.vw && r.height === vp.vh && Math.min(2, dpr) === vp.dpr) return false;
  vp.vw = r.width; vp.vh = r.height;
  vp.dpr = Math.min(2, dpr);
  cv.width = Math.round(vp.vw * vp.dpr); cv.height = Math.round(vp.vh * vp.dpr);
  const oldFit = camState.fitZ;
  camState.fitZ = Math.min(vp.vw / (13 * U), vp.vh / (15 * U));
  // the pixel size is set by the screen, not the zoom, so pixels stay the same size whatever the camera does;
  // a whole number of the screen's own pixels, so they're all the same size
  const Pd = Math.max(2, Math.round(camState.fitZ * U * dpr / BLOCK_PX));
  vp.P = Pd / dpr; vp.k = 1 / vp.P;
  lo.width = Math.ceil(vp.vw / vp.P); lo.height = Math.ceil(vp.vh / vp.P);
  lo.style.width = lo.width * vp.P + 'px'; lo.style.height = lo.height * vp.P + 'px'; // a hair past the edge, never squeezed
  crispDirty = true;
  cam.z = cam.z === 1 && oldFit === 1 ? camState.fitZ : cam.z * (camState.fitZ / oldFit);
  return true;
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
// Looking around (drag, pinch, scroll) stops the camera following Sadie for good: from then on it
// only moves when the player moves it. (A new game starts following her again.)
export function setFollow(v) { camState.follow = v; }

// Camera follows Sadie (leaning toward her hay) unless the player has taken over. If the mole is
// nearby but up near the top edge, it looks up a little, as long as Sadie stays well in view.
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
    cam.y += (ty - cam.y) * Math.min(1, dt * 3);
    const T = sadie.target, lean = T ? Math.max(-half * 0.5, Math.min(half * 0.5, (T.x - sadie.x) * 0.5)) : 0;
    const r = camState.insetR / 2 / cam.z;
    const tx = W < 2 * half ? W / 2 : Math.min(W - half + U + 2 * r, Math.max(half - U, sadie.x + lean + r));
    cam.x += (tx - cam.x) * Math.min(1, dt * 4);
    cam.z += (camState.fitZ - cam.z) * Math.min(1, dt * 3);
  }
}

// Things that must stay readable (numbers, emotes) are drawn sharp on top, on the full-size canvas:
// `crisp(fn)` runs fn(context) at the end of the frame, in CSS pixels. That canvas is only cleared
// when something was on it.
const later = [];
let crispDirty = false;
export const crisp = fn => { later.push(fn); };
export function present() {
  if (!crispDirty && !later.length) return;
  hctx.setTransform(1, 0, 0, 1, 0, 0); hctx.clearRect(0, 0, cv.width, cv.height);
  hctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0);
  for (const fn of later) { hctx.save(); fn(hctx); hctx.restore(); }
  crispDirty = later.length > 0; later.length = 0;
}

// A close-up for the dashboard: draw(), run with the camera for a moment pointed at world spot
// (x, y) so that `span` px of the world fill `face`, a small canvas n big pixels across. The
// characters' own drawing code does the drawing, so their faces there are the real thing, moods
// and all, drawn bigger. Nothing else on the board is drawn into it.
export function drawFace(face, x, y, span, draw) {
  const fc = face.getContext('2d'), n = face.width;
  const was = { ...cam }, wasVp = { ...vp };
  ctx = fc;
  cam.x = x; cam.y = y; cam.z = n / span;
  vp.vw = n; vp.vh = n; vp.P = 1; vp.k = 1;
  try {
    fc.setTransform(1, 0, 0, 1, 0, 0); fc.imageSmoothingEnabled = false;
    draw();
  } finally {
    ctx = loCtx; Object.assign(cam, was); Object.assign(vp, wasVp);
  }
}
