// The canvas, the camera, and converting between world and screen positions.
import { U, W } from '../config.js';
import { world } from '../core/world.js';
import { emit } from '../core/events.js';
import { sadie } from '../core/sadie/brain.js';
import { drp, heldOffsets, NO_PIECE } from '../core/dropper.js';
import { rockInfo } from '../core/surface.js';

// The world is drawn small, on `ctx` (a hidden canvas with one pixel per big on-screen pixel), then
// dithered to a small 90s palette and blown up onto the real canvas with hard edges (`present`).
// Everything still draws in screen (CSS) pixels: `vp.k` scales that down to the small canvas.
// The dithering runs on the graphics chip (WebGL); without it, on the processor (much slower).
export const cv = document.getElementById('world');
const hctx = cv.getContext('2d');
const lo = document.createElement('canvas'), glc = document.createElement('canvas');
const gl = glc.getContext('webgl', { antialias: false, alpha: false, depth: false, premultipliedAlpha: false });
export const ctx = lo.getContext('2d', { willReadFrequently: !gl });
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
  lo.width = glc.width = Math.ceil(cv.width / Pd); lo.height = glc.height = Math.ceil(cv.height / Pd);
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

// Ordered dithering (a 4x4 Bayer pattern) down to 8 levels per color. Colors near a level snap to
// it and stay flat; only the ones in between (gradients, soft edges) turn into checkerboard and
// crosshatch dots. SPREAD is how much of the way between two levels gets dotted.
const LEVELS = 8, SPREAD = 0.6, BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const DITHER = new Uint8Array(16 * 256);
for (let b = 0; b < 16; b++) for (let c = 0; c < 256; c++) {
  const v = c / 255 * (LEVELS - 1), f = Math.floor(v);
  DITHER[b * 256 + c] = Math.round(Math.min(LEVELS - 1, f + (v - f > 0.5 + ((BAYER[b] + 0.5) / 16 - 0.5) * SPREAD ? 1 : 0)) * 255 / (LEVELS - 1));
}
// The same dithering as a WebGL shader (the Bayer pattern worked out from the pixel position).
let glDraw = null;
if (gl) {
  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `precision mediump float;
    uniform sampler2D img; uniform vec2 size;
    float b2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
    void main() {
      vec2 px = floor(gl_FragCoord.xy);
      float b = b2(0.5 * px) * 0.25 + b2(px);
      float thr = 0.5 + (b + 1.0 / 32.0 - 0.5) * ${SPREAD.toFixed(3)};
      vec3 v = texture2D(img, (px + 0.5) / size).rgb * ${(LEVELS - 1).toFixed(1)}, f = floor(v);
      gl_FragColor = vec4(min(f + step(vec3(thr), v - f), ${(LEVELS - 1).toFixed(1)}) / ${(LEVELS - 1).toFixed(1)}, 1.0);
    }`));
  gl.linkProgram(prog);
  if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const sizeAt = gl.getUniformLocation(prog, 'size');
    glDraw = () => {
      gl.viewport(0, 0, glc.width, glc.height); gl.uniform2f(sizeAt, glc.width, glc.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lo);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return glc;
    };
  }
}
function ditherHere() {
  const w = lo.width, h = lo.height, img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let y = 0, i = 0; y < h; y++) {
    const row = (y & 3) << 2;
    for (let x = 0; x < w; x++, i += 4) {
      const b = (row | (x & 3)) << 8;
      d[i] = DITHER[b | d[i]]; d[i + 1] = DITHER[b | d[i + 1]]; d[i + 2] = DITHER[b | d[i + 2]];
    }
  }
  ctx.putImageData(img, 0, 0);
  return lo;
}
// Things that must stay readable (numbers, emotes) are drawn sharp on top, after the pixels:
// `crisp(fn)` runs fn(context) then, in CSS pixels.
const later = [];
export const crisp = fn => { later.push(fn); };
export function present() {
  const out = glDraw && !gl.isContextLost() ? glDraw() : ditherHere();
  hctx.setTransform(1, 0, 0, 1, 0, 0); hctx.imageSmoothingEnabled = false;
  hctx.drawImage(out, 0, 0, lo.width * Pd, lo.height * Pd);
  hctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0);
  for (const fn of later) { hctx.save(); fn(hctx); hctx.restore(); }
  later.length = 0;
}
