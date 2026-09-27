// Drawing Sadie from her photo: white dilute calico, gray cap and back patch, gray patch over one
// eye, nose split gray and tan, and a permanently unimpressed half-lidded stare. Her head always
// faces the viewer so the markings read the same way whichever direction she walks.
import { U } from '../config.js';
import { world } from '../core/world.js';
import { sadie, REACH } from '../core/sadie/brain.js';
import { ctx, cam, vp, sxf, syf } from './view.js';

// Sadie: white dilute calico with a gray cap and back patch, a gray patch over one eye,
// a nose split gray and tan, and a permanently unimpressed half-lidded stare.
const CAT = { white: '#fffaf3', gray: '#8f8a9b', tan: '#e7b688', pink: '#f4a7b6', ink: '#3a2658', iris: '#c4c96a', pupil: '#2b2233', nose: '#4a3440' };
export function drawSadie(time) {
  const c = sadie, z = cam.z, S = U * z, X = sxf(c.x), Y = syf(c.y);
  if (Y < -S * 3 || Y > vp.vh + S * 2) return;
  const d = c.dir || 1, mood = c.mood || 'neutral', t = time / 1000;
  const walking = c.state === 'walk', climbing = c.state === 'climb';
  const puff = mood === 'scared' ? 1.12 : 1;
  let lift = c.cheer > 0 ? Math.sin(Math.min(1, (1.1 - c.cheer) / 0.6) * Math.PI) * 0.55 : 0;
  if (mood === 'excited' && c.cheer < 0.5) lift = Math.abs(Math.sin(t * 14)) * 0.12;
  const shake = mood === 'mad' ? Math.sin(t * 55) * 0.02 : mood === 'scared' ? Math.sin(t * 70) * 0.025 : 0;
  const crouch = mood === 'scared' ? -0.06 : 0;
  const run = walking ? (c.run || 0) : 0, gph = c.phase * Math.PI * 2;
  const a = climbing ? 1.0 : Math.sin(gph) * 0.1 * run; // rocking-horse gallop
  lift += Math.abs(Math.sin(gph)) * 0.1 * run;
  const fx = d * Math.cos(a), fy = -Math.sin(a), ux = -d * Math.sin(a), uy = -Math.cos(a);
  const ox = X + shake * S, oy = Y - lift * S;
  const P = (lx, ly) => [ox + (fx * lx + ux * ly) * S, oy + (fy * lx + uy * ly) * S];
  const lw = Math.max(1.4, 0.055 * S);

  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.translate(ox, oy); ctx.transform(fx * S, fy * S, ux * S, uy * S, 0, 0);
  const L = lw / S; // line width in local units

  // tail
  const swayRate = { happy: 7, mad: 16, scared: 30, excited: 10, lookup: 3 }[mood] || 2.5;
  const sway = Math.sin(t * swayRate);
  let ctrl, tip;
  if (mood === 'mad') { ctrl = [-0.95, 0.3]; tip = [-1.1, 0.5 + sway * 0.35]; }
  else if (mood === 'scared') { ctrl = [-0.62, 0.95]; tip = [-0.55 + sway * 0.02, 1.35]; }
  else if (mood === 'happy' || mood === 'excited') { ctrl = [-0.8, 0.85]; tip = [-0.62 + sway * 0.12, 1.22]; }
  else if (mood === 'lookup') { ctrl = [-0.85, 0.6]; tip = [-0.82, 1.0 + (Math.sin(t * 9) > 0.7 ? 0.08 : 0)]; }
  else if (mood === 'run') { ctrl = [-0.9, 0.62]; tip = [-1.25, 0.72 + Math.sin(gph * 2) * 0.06]; } // streaming out behind
  else { ctrl = [-0.85, 0.6]; tip = [-0.8 + sway * 0.07, 1.05]; }
  const tw = (mood === 'scared' ? 0.24 : mood === 'mad' ? 0.16 : 0.13);
  const tailPath = () => { ctx.beginPath(); ctx.moveTo(-0.48, 0.45 + crouch); ctx.quadraticCurveTo(ctrl[0], ctrl[1] + crouch, tip[0], tip[1] + crouch); };
  tailPath(); ctx.strokeStyle = CAT.ink; ctx.lineWidth = tw + 2 * L; ctx.stroke();
  tailPath(); ctx.strokeStyle = CAT.gray; ctx.lineWidth = tw; ctx.stroke();

  // legs (far pair behind the body, near pair in front)
  const ph = c.phase * Math.PI * 2 * (climbing ? 2.2 : 1);
  const swing = walking ? (mood === 'mad' ? 0.15 : 0.11 + run * 0.12) : climbing ? 0.14 : 0;
  const leg = (hx, off, far) => {
    const fxp = hx + Math.sin(ph + off) * swing, fyp = Math.max(0, Math.cos(ph + off)) * swing * 0.7;
    ctx.beginPath(); ctx.moveTo(hx, 0.32 + crouch); ctx.lineTo(fxp, fyp + 0.05);
    ctx.strokeStyle = CAT.ink; ctx.lineWidth = 0.15 + 2 * L; ctx.stroke();
    ctx.strokeStyle = far ? '#e9e3ec' : CAT.white; ctx.lineWidth = 0.15; ctx.stroke();
  };
  // walking uses diagonal pairs; running switches to a gallop (front legs together, back legs together)
  const gal = run > 0.5;
  leg(0.3, gal ? 0.35 : 0, true); leg(-0.3, gal ? Math.PI + 0.35 : Math.PI, true);

  // body (fur spikes out when scared)
  const bodyPath = () => {
    ctx.beginPath();
    const rx = 0.52 * puff, ry = 0.27 * puff, cx = -0.04, cy = 0.46 + crouch;
    if (puff > 1) {
      for (let i = 0; i <= 28; i++) { const th = i / 28 * Math.PI * 2, rr = i % 2 ? 1 : 1.09; ctx.lineTo(cx + Math.cos(th) * rx * rr, cy + Math.sin(th) * ry * rr); }
    } else ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.closePath();
  };
  bodyPath(); ctx.fillStyle = CAT.white; ctx.fill();
  ctx.save(); bodyPath(); ctx.clip();
  ctx.fillStyle = CAT.gray;
  ctx.beginPath(); ctx.ellipse(-0.22, 0.68 + crouch, 0.4, 0.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0.12, 0.72 + crouch, 0.22, 0.12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  bodyPath(); ctx.strokeStyle = CAT.ink; ctx.lineWidth = L; ctx.stroke();
  leg(0.2, gal ? 0 : Math.PI, false); leg(-0.4, gal ? Math.PI : 0, false);
  ctx.restore();

  // head stays upright and faces you so her markings always read the same way
  const [hx, hy] = P(0.46, 0.8 + crouch);
  const r = 0.34 * S * Math.sqrt(puff);
  let lookX = d * 0.35, lookY = 0.1;
  if (mood === 'lookup') { lookX = c.target ? Math.sign(c.target.x - c.x) * 0.25 : 0; lookY = -0.75; }
  if (climbing) lookY = -0.4;
  const tilt = mood === 'mad' ? Math.sin(t * 4) * 0.06 : mood === 'lookup' ? -d * 0.12 : climbing ? -d * 0.15 : 0;
  drawCatHead(hx, hy, r, mood, t, lookX, lookY, c.blinkT < 0, tilt);

  // mood marks drawn right on her
  if (mood === 'mad') { // anger mark
    const k = 1 + Math.sin(t * 10) * 0.12, mx = hx + d * 1.05 * r, my = hy - 1.15 * r, m = 0.28 * r * k;
    ctx.strokeStyle = '#ff3d67'; ctx.lineWidth = Math.max(1.8, 0.11 * r);
    for (let q = 0; q < 4; q++) {
      const ang = q * Math.PI / 2 + Math.PI / 4, cxm = mx + Math.cos(ang) * m * 0.9, cym = my + Math.sin(ang) * m * 0.9;
      ctx.beginPath(); ctx.arc(cxm, cym, m * 0.55, ang + Math.PI * 0.75, ang + Math.PI * 1.25); ctx.stroke();
    }
  } else if (mood === 'scared') { // sweat drop + shock lines
    const sx = hx - d * 1.1 * r, sy = hy - 0.5 * r + ((t * 2) % 1) * 0.4 * r;
    ctx.fillStyle = '#7fc8ff'; ctx.strokeStyle = CAT.ink; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(sx, sy - 0.32 * r); ctx.quadraticCurveTo(sx + 0.2 * r, sy, sx, sy + 0.14 * r); ctx.quadraticCurveTo(sx - 0.2 * r, sy, sx, sy - 0.32 * r); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = CAT.ink; ctx.lineWidth = Math.max(1.5, 0.08 * r * 1.5);
    for (let q = -1; q <= 1; q++) { ctx.beginPath(); ctx.moveTo(hx + q * 0.45 * r, hy - 1.55 * r); ctx.lineTo(hx + q * 0.6 * r, hy - 1.95 * r); ctx.stroke(); }
  } else if (mood === 'excited') { // sparkles
    ctx.fillStyle = '#ffd23f';
    for (let q = 0; q < 3; q++) {
      const ang = t * 3 + q * 2.1, sx = hx + Math.cos(ang) * 1.5 * r, sy = hy - 0.6 * r + Math.sin(ang) * 0.9 * r, m = 0.22 * r * (0.7 + 0.3 * Math.sin(t * 12 + q));
      ctx.beginPath(); ctx.moveTo(sx, sy - m); ctx.lineTo(sx + m * 0.3, sy - m * 0.3); ctx.lineTo(sx + m, sy); ctx.lineTo(sx + m * 0.3, sy + m * 0.3);
      ctx.lineTo(sx, sy + m); ctx.lineTo(sx - m * 0.3, sy + m * 0.3); ctx.lineTo(sx - m, sy); ctx.lineTo(sx - m * 0.3, sy - m * 0.3); ctx.closePath(); ctx.fill();
    }
  }

  // how much higher the pile needs to be, while she's stuck under a star
  if ((c.state === 'wait' || c.pace) && c.target && c.target.y > c.y + REACH) {
    const need = Math.max(0, (c.target.y - REACH - c.y) / U);
    const txt = '\u2191 ' + need.toFixed(1);
    ctx.font = `800 ${Math.max(12, 0.5 * S)}px "Baloo 2", ui-rounded, system-ui, sans-serif`;
    const twid = ctx.measureText(txt).width, bh = Math.max(20, 0.8 * S), bx = hx - twid / 2 - 8, by = hy - 2.3 * r - bh;
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.strokeStyle = CAT.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(bx, by, twid + 16, bh, bh / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CAT.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, hx, by + bh / 2 + 1);
  }
  ctx.restore();
}

function drawCatHead(hx, hy, r, mood, t, lookX, lookY, blink, tilt) {
  ctx.save();
  ctx.translate(hx, hy); ctx.rotate(tilt);
  const lw = Math.max(1.4, 0.13 * r);
  ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // ears: flatten sideways when mad or scared, perk up when excited
  const flat = mood === 'mad' || mood === 'scared' ? 0.6 : mood === 'excited' ? -0.08 : mood === 'run' ? 0.25 : 0;
  for (const side of [-1, 1]) {
    const th = -Math.PI / 2 + side * (0.62 + flat), b1 = th - 0.45, b2 = th + 0.45, len = 1.6 - Math.max(0, flat) * 0.25;
    const tx = Math.cos(th) * r * len, ty = Math.sin(th) * r * len;
    ctx.beginPath(); ctx.moveTo(Math.cos(b1) * r * 0.9, Math.sin(b1) * r * 0.9); ctx.lineTo(tx, ty); ctx.lineTo(Math.cos(b2) * r * 0.9, Math.sin(b2) * r * 0.9); ctx.closePath();
    ctx.fillStyle = side < 0 ? CAT.white : CAT.gray; ctx.fill(); ctx.strokeStyle = CAT.ink; ctx.stroke();
    const ix = tx * 0.78, iy = ty * 0.78;
    ctx.beginPath(); ctx.moveTo(Math.cos(b1 + 0.15) * r * 0.95, Math.sin(b1 + 0.15) * r * 0.95); ctx.lineTo(ix, iy); ctx.lineTo(Math.cos(b2 - 0.15) * r * 0.95, Math.sin(b2 - 0.15) * r * 0.95); ctx.closePath();
    ctx.fillStyle = side < 0 ? CAT.pink : '#d9a2b4'; ctx.fill();
  }
  // head shape and markings
  const headPath = () => { ctx.beginPath(); ctx.ellipse(0, 0, 1.1 * r, 0.95 * r, 0, 0, Math.PI * 2); };
  headPath(); ctx.fillStyle = CAT.white; ctx.fill();
  ctx.save(); headPath(); ctx.clip();
  ctx.fillStyle = CAT.gray;
  ctx.beginPath(); ctx.ellipse(-0.55 * r, -0.8 * r, 0.62 * r, 0.46 * r, 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0.58 * r, -0.76 * r, 0.62 * r, 0.46 * r, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-0.42 * r, 0.0, 0.33 * r, 0.29 * r, -0.2, 0, Math.PI * 2); ctx.fill();   // patch over her left eye
  ctx.beginPath(); ctx.moveTo(-0.16 * r, -0.28 * r); ctx.lineTo(0, -0.34 * r); ctx.lineTo(0, 0.3 * r); ctx.lineTo(-0.12 * r, 0.26 * r); ctx.closePath(); ctx.fill(); // gray half of the nose
  ctx.fillStyle = CAT.tan;
  ctx.beginPath(); ctx.moveTo(0, -0.34 * r); ctx.lineTo(0.17 * r, -0.28 * r); ctx.lineTo(0.13 * r, 0.26 * r); ctx.lineTo(0, 0.3 * r); ctx.closePath(); ctx.fill();   // tan half of the nose
  ctx.fillStyle = CAT.white;
  ctx.beginPath(); ctx.ellipse(0.02 * r, -0.72 * r, 0.15 * r, 0.36 * r, 0, 0, Math.PI * 2); ctx.fill();   // white blaze up the forehead
  ctx.fillStyle = CAT.tan;
  ctx.beginPath(); ctx.arc(0.04 * r, -0.86 * r, 0.09 * r, 0, Math.PI * 2); ctx.fill();
  if (mood === 'happy' || mood === 'excited') {
    ctx.fillStyle = 'rgba(255,130,160,0.35)';
    ctx.beginPath(); ctx.ellipse(-0.62 * r, 0.3 * r, 0.16 * r, 0.09 * r, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0.62 * r, 0.3 * r, 0.16 * r, 0.09 * r, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  headPath(); ctx.strokeStyle = CAT.ink; ctx.stroke();

  // eyes
  const lid = { neutral: 0.42, lookup: 0.18, mad: 0.55, scared: 0, excited: 0, happy: 0, run: 0.28 }[mood] ?? 0.4;
  for (const side of [-1, 1]) {
    const ex = side * 0.37 * r, ey = 0.0, er = 0.16 * r;
    if (mood === 'happy' || blink) { // closed: happy arcs or a quick blink
      ctx.strokeStyle = CAT.ink; ctx.lineWidth = lw;
      ctx.beginPath();
      if (mood === 'happy') ctx.arc(ex, ey + er * 0.5, er, Math.PI * 1.15, Math.PI * 1.85);
      else { ctx.moveTo(ex - er, ey); ctx.lineTo(ex + er, ey); }
      ctx.stroke(); continue;
    }
    const big = mood === 'scared' || mood === 'excited' ? 1.18 : 1;
    ctx.beginPath(); ctx.arc(ex, ey, er * big, 0, Math.PI * 2); ctx.fillStyle = CAT.iris; ctx.fill();
    const pw = mood === 'scared' ? 0.18 : mood === 'excited' ? 0.55 : 0.32;
    ctx.beginPath(); ctx.ellipse(ex + lookX * er * 0.4, ey + lookY * er * 0.4, er * pw, er * 0.8 * big, 0, 0, Math.PI * 2); ctx.fillStyle = CAT.pupil; ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex + er * 0.3, ey - er * 0.35, er * (mood === 'excited' ? 0.32 : 0.18), 0, Math.PI * 2); ctx.fill();
    if (lid > 0) { // eyelid over the top of the eye; slants inward when she's mad
      ctx.save(); ctx.beginPath(); ctx.arc(ex, ey, er * big + 0.5, 0, Math.PI * 2); ctx.clip();
      const slant = mood === 'mad' ? 0.7 : 0, yl = ey - er + 2 * er * lid;
      ctx.beginPath(); ctx.moveTo(ex - er * 1.3, ey - er * 1.4); ctx.lineTo(ex + er * 1.3, ey - er * 1.4);
      ctx.lineTo(ex + er * 1.3, yl + side * slant * er); ctx.lineTo(ex - er * 1.3, yl - side * slant * er); ctx.closePath();
      ctx.fillStyle = side < 0 ? CAT.gray : CAT.white; ctx.fill();
      ctx.restore();
      ctx.strokeStyle = CAT.ink; ctx.lineWidth = lw * 0.8;
      ctx.beginPath(); ctx.moveTo(ex - er * 1.05, yl - side * slant * er * 0.8); ctx.lineTo(ex + er * 1.05, yl + side * slant * er * 0.8); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(ex, ey, er * big, 0, Math.PI * 2); ctx.strokeStyle = CAT.ink; ctx.lineWidth = lw * 0.7; ctx.stroke();
  }
  if (mood === 'mad') { // furrowed brows
    ctx.strokeStyle = CAT.ink; ctx.lineWidth = lw;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 0.58 * r, -0.36 * r); ctx.lineTo(side * 0.18 * r, -0.2 * r); ctx.stroke(); }
  }
  // nose and mouth
  ctx.fillStyle = CAT.nose;
  ctx.beginPath(); ctx.moveTo(-0.11 * r, 0.26 * r); ctx.lineTo(0.11 * r, 0.26 * r); ctx.lineTo(0, 0.38 * r); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = CAT.ink; ctx.lineWidth = lw * 0.75;
  ctx.beginPath();
  if (mood === 'scared') { ctx.ellipse(0, 0.56 * r, 0.08 * r, 0.1 * r, 0, 0, Math.PI * 2); }
  else if (mood === 'mad') { ctx.moveTo(-0.14 * r, 0.56 * r); ctx.quadraticCurveTo(0, 0.48 * r, 0.14 * r, 0.56 * r); }
  else if (mood === 'excited' || mood === 'happy') {
    ctx.moveTo(-0.2 * r, 0.44 * r); ctx.quadraticCurveTo(-0.1 * r, 0.62 * r, 0, 0.42 * r); ctx.quadraticCurveTo(0.1 * r, 0.62 * r, 0.2 * r, 0.44 * r);
  } else { ctx.moveTo(-0.14 * r, 0.47 * r); ctx.quadraticCurveTo(-0.07 * r, 0.54 * r, 0, 0.42 * r); ctx.quadraticCurveTo(0.07 * r, 0.54 * r, 0.14 * r, 0.47 * r); }
  ctx.stroke();
  // whiskers
  ctx.strokeStyle = 'rgba(58,38,88,0.45)'; ctx.lineWidth = Math.max(1, lw * 0.45);
  for (const side of [-1, 1]) for (let q = -1; q <= 1; q++) {
    ctx.beginPath(); ctx.moveTo(side * 0.45 * r, 0.36 * r + q * 0.06 * r); ctx.lineTo(side * 1.35 * r, 0.3 * r + q * 0.16 * r); ctx.stroke();
  }
  ctx.restore();
}

export function drawEmotes() {
  if (!world.emotes.length) return;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.max(14, 0.6 * U * cam.z)}px "Baloo 2", ui-rounded, system-ui, sans-serif`;
  for (const e of world.emotes) {
    ctx.globalAlpha = Math.min(1, e.life * 1.5);
    ctx.fillStyle = e.color; ctx.fillText(e.glyph, sxf(e.x), syf(e.y));
  }
  ctx.globalAlpha = 1;
}
