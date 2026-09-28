// Drawing Chooter: a black lab/pitbull mix. Stocky body, broad blocky head, floppy lab ears, a
// white blaze on his chest, a big pink tongue, a whip of a tail that never stops wagging, and a
// blue collar with a gold tag. Drawn from the side, facing where he's going.
import { U, W } from '../config.js';
import { chooter, peekSpot } from '../core/friends/chooter.js';
import { toy, TOY_R } from '../core/toys.js';
import { barnX, barnFloor } from '../core/barn.js';
import { ctx, cam, vp, sxf, syf } from './view.js';
import { drawBall } from './toyView.js';

const DOG = { coat: '#2d2733', shine: '#4d4558', dark: '#1b1620', white: '#fffaf3', ink: '#1b1424', tongue: '#ff7a9a', tongueDark: '#d9546f',
  nose: '#120d16', collar: '#3fa9e8', tag: '#ffd23f', eye: '#5a3a22' };

export function drawChooter(time) {
  const c = chooter;
  if (!c.met || c.place === 'home') return;
  const S = U * cam.z, X = sxf(c.x), Y = syf(c.y);
  if (Y < -S * 3 || Y > vp.vh + S * 2 || X < -S * 3 || X > vp.vw + S * 3) return;
  const t = time / 1000, mood = c.mood, d = c.dir || 1;
  let alpha = 1, scale = 1;
  if (c.place === 'door') { // squeezing through the cat flap
    const k = Math.min(1, c.doorT / 0.7), e = c.doorIn ? k : 1 - k;
    alpha = 1 - e * e; scale = 1 - 0.35 * e;
  }
  const moving = c.moving || c.air, zoom = mood === 'zoom', dig = mood === 'dig';
  const run = zoom ? 1 : moving ? 0.55 : 0, ph = c.phase * Math.PI * 2;
  const bob = moving && !c.air ? Math.abs(Math.sin(ph)) * 0.06 * (0.6 + run) : 0;
  const lean = c.air ? Math.max(-0.35, Math.min(0.35, c.vy / 900)) : zoom ? 0.08 : dig ? -0.35 : 0;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(X, Y - bob * S);
  ctx.scale(d * S * scale, -S * scale); // from here on: blocks, y up, facing right, feet at 0,0
  ctx.rotate(lean);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const L = Math.max(1.3, 0.05 * S) / S;

  // speed lines behind him when he has the zoomies
  if (zoom && !c.air) {
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.05;
    for (let k = 0; k < 3; k++) { const y = 0.45 + k * 0.2, o = ((t * 6 + k * 0.37) % 1) * 0.3; ctx.beginPath(); ctx.moveTo(-0.8 - o, y); ctx.lineTo(-1.35 - o, y); ctx.stroke(); }
  }

  // tail: never stops wagging, a blur when he's overjoyed
  const wag = Math.sin(t * (zoom ? 30 : mood === 'pant' ? 12 : 22)) * (zoom ? 0.12 : 0.3);
  const tail = () => { ctx.beginPath(); ctx.moveTo(-0.52, 0.72); ctx.quadraticCurveTo(-0.85, 0.9 + wag * 0.5, -0.98, 1.12 + wag - (zoom ? 0.3 : 0)); };
  tail(); ctx.strokeStyle = DOG.ink; ctx.lineWidth = 0.13 + 2 * L; ctx.stroke();
  tail(); ctx.strokeStyle = DOG.coat; ctx.lineWidth = 0.13; ctx.stroke();

  // legs: far pair darker, behind the body
  const stride = moving ? (zoom ? 0.3 : 0.18) : 0;
  const leg = (hx, off, far, sock) => {
    const a = ph + off, fx = hx + Math.sin(a) * stride, fy = c.air ? 0.12 : Math.max(0, Math.cos(a)) * stride * 0.6;
    ctx.beginPath(); ctx.moveTo(hx, 0.5); ctx.lineTo(fx, fy + 0.06);
    ctx.strokeStyle = DOG.ink; ctx.lineWidth = 0.19 + 2 * L; ctx.stroke();
    ctx.strokeStyle = far ? DOG.dark : DOG.coat; ctx.lineWidth = 0.19; ctx.stroke();
    if (sock) { ctx.beginPath(); ctx.moveTo(fx, fy + 0.07); ctx.lineTo(fx + 0.02, fy + 0.13); ctx.strokeStyle = DOG.white; ctx.lineWidth = 0.17; ctx.stroke(); }
  };
  const gal = zoom ? 0.6 : Math.PI; // galloping: legs in pairs
  leg(0.34, 0.4, true, false); leg(-0.36, gal + 0.4, true, false);

  // body: deep chest, tucked waist
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(-0.55, 0.62);
    ctx.bezierCurveTo(-0.6, 0.95, -0.1, 0.98, 0.3, 0.95);
    ctx.bezierCurveTo(0.62, 0.93, 0.66, 0.5, 0.5, 0.42);
    ctx.bezierCurveTo(0.3, 0.33, 0.0, 0.46, -0.3, 0.44);
    ctx.bezierCurveTo(-0.5, 0.43, -0.56, 0.5, -0.55, 0.62);
    ctx.closePath();
  };
  bodyPath(); ctx.fillStyle = DOG.coat; ctx.fill();
  ctx.save(); bodyPath(); ctx.clip();
  ctx.fillStyle = DOG.shine; ctx.beginPath(); ctx.ellipse(-0.05, 0.95, 0.5, 0.09, 0, 0, Math.PI * 2); ctx.fill(); // shine along his back
  ctx.fillStyle = DOG.white; ctx.beginPath(); ctx.ellipse(0.5, 0.58, 0.14, 0.2, -0.3, 0, Math.PI * 2); ctx.fill(); // white chest blaze
  ctx.restore();
  bodyPath(); ctx.strokeStyle = DOG.ink; ctx.lineWidth = L; ctx.stroke();
  leg(0.22, 0.4 + (zoom ? 0.3 : Math.PI), false, true); leg(-0.24, (zoom ? gal + 0.9 : 0.4), false, false);

  // head: broad and blocky, up and forward
  ctx.save();
  const nod = dig ? -0.35 : mood === 'bark' ? 0.12 : moving ? Math.sin(ph) * 0.04 : Math.sin(t * 2.2) * 0.03;
  ctx.translate(0.5, 0.98); ctx.rotate(nod);
  // floppy ear on the far side, peeking out behind
  const flap = zoom ? 0.9 : c.air ? 0.5 : 0.1 * Math.sin(t * 5);
  ctx.save(); ctx.translate(0.02, 0.2); ctx.rotate(-0.35 + flap * 0.4);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-0.2, -0.1, -0.14, -0.3); ctx.quadraticCurveTo(0.02, -0.26, 0.08, -0.05); ctx.closePath();
  ctx.fillStyle = DOG.dark; ctx.fill(); ctx.strokeStyle = DOG.ink; ctx.lineWidth = L; ctx.stroke();
  ctx.restore();
  // skull and muzzle
  const head = () => {
    ctx.beginPath();
    ctx.moveTo(-0.2, 0.05);
    ctx.bezierCurveTo(-0.22, 0.32, 0.05, 0.38, 0.22, 0.3);   // top of the head
    ctx.bezierCurveTo(0.3, 0.26, 0.34, 0.2, 0.44, 0.18);      // stop, down to the muzzle
    ctx.bezierCurveTo(0.56, 0.17, 0.6, 0.12, 0.58, 0.02);     // blunt nose end
    ctx.bezierCurveTo(0.56, -0.08, 0.4, -0.1, 0.25, -0.1);   // jaw
    ctx.bezierCurveTo(0.05, -0.12, -0.18, -0.12, -0.2, 0.05); // big cheeks
    ctx.closePath();
  };
  head(); ctx.fillStyle = DOG.coat; ctx.fill();
  ctx.save(); head(); ctx.clip();
  ctx.fillStyle = DOG.shine; ctx.beginPath(); ctx.ellipse(0.02, 0.3, 0.2, 0.06, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = DOG.white; ctx.beginPath(); ctx.ellipse(0.34, 0.3, 0.035, 0.12, 1.1, 0, Math.PI * 2); ctx.fill(); // little white stripe up his nose
  ctx.restore();
  head(); ctx.strokeStyle = DOG.ink; ctx.lineWidth = L; ctx.stroke();
  // nose
  ctx.fillStyle = DOG.nose; ctx.beginPath(); ctx.ellipse(0.56, 0.12, 0.07, 0.055, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(0.55, 0.14, 0.018, 0, Math.PI * 2); ctx.fill();
  // mouth: a big open grin with the tongue flopping out, or a ball
  const open = mood === 'bark' ? 0.1 : mood === 'pant' ? 0.07 : 0.05;
  ctx.fillStyle = '#5a1f33'; ctx.beginPath(); ctx.moveTo(0.18, -0.02); ctx.quadraticCurveTo(0.4, -0.02 - open, 0.56, -0.02); ctx.quadraticCurveTo(0.4, 0.02, 0.18, -0.02); ctx.fill();
  if (mood !== 'fetch') {
    const tl = mood === 'pant' ? 0.3 + Math.sin(t * 16) * 0.03 : zoom ? 0.28 : 0.18, flop = zoom ? -0.5 : c.air ? -0.3 : 0;
    ctx.save(); ctx.translate(0.36, -0.05); ctx.rotate(flop);
    ctx.beginPath(); ctx.moveTo(-0.06, 0); ctx.lineTo(-0.06, -tl + 0.06); ctx.quadraticCurveTo(0, -tl - 0.02, 0.06, -tl + 0.06); ctx.lineTo(0.06, 0); ctx.closePath();
    ctx.fillStyle = DOG.tongue; ctx.fill(); ctx.strokeStyle = DOG.tongueDark; ctx.lineWidth = L * 0.8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -0.03); ctx.lineTo(0, -tl + 0.08); ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = DOG.ink; ctx.lineWidth = L * 0.9;
  ctx.beginPath(); ctx.moveTo(0.14, 0.0); ctx.quadraticCurveTo(0.3, -0.06 - open, 0.52, -0.02); ctx.stroke(); // smile
  // eye: big and bright, wide open and a bit wild with the zoomies, happy squint when panting
  const ex = 0.2, ey = 0.17;
  if (mood === 'pant' || mood === 'dig') {
    ctx.strokeStyle = DOG.ink; ctx.lineWidth = L * 1.1; ctx.beginPath(); ctx.arc(ex, ey - 0.03, 0.06, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  } else {
    const er = zoom ? 0.075 : 0.062;
    ctx.fillStyle = DOG.white; ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = DOG.eye; ctx.beginPath(); ctx.arc(ex + 0.015, ey, er * (zoom ? 0.5 : 0.72), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = DOG.nose; ctx.beginPath(); ctx.arc(ex + 0.02, ey, er * (zoom ? 0.28 : 0.42), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + 0.035, ey + 0.025, er * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = DOG.ink; ctx.lineWidth = L * 0.8; ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex - 0.07, ey + 0.1); ctx.quadraticCurveTo(ex, ey + 0.14 + (mood === 'bark' ? 0.03 : 0), ex + 0.08, ey + 0.1); ctx.stroke(); // eyebrow
  }
  // near ear: a soft floppy triangle, flying back when he runs
  ctx.save(); ctx.translate(-0.04, 0.24); ctx.rotate(-0.2 + flap);
  ctx.beginPath(); ctx.moveTo(0, 0.02); ctx.quadraticCurveTo(-0.26, -0.02, -0.2, -0.32); ctx.quadraticCurveTo(-0.02, -0.3, 0.1, -0.02); ctx.closePath();
  ctx.fillStyle = DOG.coat; ctx.fill(); ctx.strokeStyle = DOG.ink; ctx.lineWidth = L; ctx.stroke();
  ctx.restore();
  // the ball, when he's carrying it
  if (mood === 'fetch' && toy.state === 'held') {
    ctx.save(); ctx.translate(0.5, -0.04); ctx.scale(1 / U, 1 / U); drawBall(0, 0, TOY_R, toy.spin); ctx.restore();
  }
  ctx.restore();

  // collar with a gold tag
  ctx.save(); ctx.translate(0.46, 0.8); ctx.rotate(0.35);
  ctx.fillStyle = DOG.collar; ctx.strokeStyle = DOG.ink; ctx.lineWidth = L * 0.8;
  ctx.beginPath(); ctx.roundRect(-0.05, -0.2, 0.1, 0.36, 0.04); ctx.fill(); ctx.stroke();
  ctx.fillStyle = DOG.tag; ctx.beginPath(); ctx.arc(0.02, -0.26, 0.055, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// His face from the front, in blocks, y up, centered at 0,0 (the hayloft window and peeking in).
function face(t) {
  ctx.lineJoin = 'round';
  ctx.fillStyle = DOG.coat; ctx.strokeStyle = DOG.ink; ctx.lineWidth = 0.03;
  for (const sd of [-1, 1]) { // floppy ears
    ctx.beginPath(); ctx.moveTo(sd * 0.14, 0.18); ctx.quadraticCurveTo(sd * 0.34, 0.16, sd * 0.3, -0.08); ctx.quadraticCurveTo(sd * 0.2, -0.04, sd * 0.1, 0.1); ctx.closePath();
    ctx.fillStyle = DOG.dark; ctx.fill(); ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(0, 0.06, 0.2, 0.18, 0, 0, Math.PI * 2); ctx.fillStyle = DOG.coat; ctx.fill(); ctx.stroke();
  ctx.fillStyle = DOG.white; ctx.beginPath(); ctx.ellipse(0, 0.12, 0.025, 0.07, 0, 0, Math.PI * 2); ctx.fill();
  for (const sd of [-1, 1]) { ctx.fillStyle = DOG.white; ctx.beginPath(); ctx.arc(sd * 0.08, 0.08, 0.04, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = DOG.nose; ctx.beginPath(); ctx.arc(sd * 0.08, 0.08, 0.025, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = DOG.nose; ctx.beginPath(); ctx.ellipse(0, -0.02, 0.05, 0.035, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = DOG.tongue; ctx.beginPath(); ctx.ellipse(0.02, -0.12, 0.04, 0.06 + Math.sin(t * 14) * 0.01, 0, 0, Math.PI * 2); ctx.fill();
}

// Before they meet: his head poking in from behind the wall nearer Sadie, to see what all the noise is.
export function drawChooterPeek(time) {
  const c = chooter;
  if (c.met || c.peek <= 0) return;
  const at = peekSpot(), t = time / 1000, S = U * cam.z;
  const sd = c.peekSide, X = sxf(sd > 0 ? W : 0), Y = syf(at.y);
  if (Y < -S * 2 || Y > vp.vh + S * 2 || X < -S * 2 || X > vp.vw + S * 2) return;
  const e = c.peek * c.peek * (3 - 2 * c.peek); // ease in and out
  ctx.save();
  ctx.beginPath(); if (sd > 0) ctx.rect(0, 0, X, vp.vh); else ctx.rect(X, 0, vp.vw - X, vp.vh); ctx.clip(); // he's behind the wall: only what's poked past it shows
  ctx.translate(X, Y); ctx.scale(sd * S, -S); // drawn for the right-hand wall, mirrored for the left
  ctx.translate(0.45 - e * 0.95, Math.sin(t * 3) * 0.03); ctx.rotate(0.35 + Math.sin(t * 1.7) * 0.1); ctx.scale(1.6, 1.6);
  face(t);
  ctx.restore();
}

// His face in the barn's hayloft window while he's home (drawn in the barn's own coordinates:
// blocks, y up, the window centered at 0, 2.92).
export function drawChooterInWindow(time) {
  const c = chooter;
  if (!c.met || c.place !== 'home') return;
  const t = time / 1000;
  const peek = Math.max(0, Math.sin(t * 0.9 + 1)); // pops up now and then
  if (peek <= 0.05) return;
  const y = 2.55 + peek * 0.32, tilt = Math.sin(t * 2.3) * 0.12;
  ctx.save();
  ctx.translate(0, y); ctx.rotate(tilt); ctx.scale(1.2, 1.2);
  face(t);
  ctx.restore();
}

// Where he is, for the map strip (null while he's inside).
export function chooterMapSpot() {
  const c = chooter;
  if (!c.met) return c.peek > 0 ? { ...peekSpot(), home: false } : null; // peeking in over the wall
  if (c.place === 'home') return { x: barnX(), y: barnFloor(), home: true };
  return { x: c.x, y: c.y, home: false };
}
