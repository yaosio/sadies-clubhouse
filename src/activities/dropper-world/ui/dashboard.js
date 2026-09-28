// The dashboard: it always shows someone (Sadie to start with) and what they're up to, in their own
// words: their face, name and mood, what they're doing, their strongest feeling right now as an LED
// meter, and why (on a phone that's one tap away: tap the strip). Tap a character on the board or
// their stamp to watch them instead; a gold arrow bobs over them on the board.
//
// Their faces are drawn by their own drawing code, with the camera pointed at their head for a
// moment (drawFace), so a face is the real thing, drawn bigger, moods and all.
//
// Also the LED sign: the first-time hint, a new friend, "tap where to throw it". On a phone it
// covers the strip for a few seconds and gets out of the way; on a wide screen it's always there,
// and when there's no news it cycles the shareware's promises.
// What they think comes from the characters themselves (core/mind/thoughts.js).
import { U } from '../config.js';
import { on } from '../core/events.js';
import { minds } from '../core/mind/thoughts.js';
import { sadie } from '../core/sadie/brain.js';
import { chooter, peekSpot } from '../core/friends/chooter.js';
import { mole } from '../core/mole.js';
import { world } from '../core/world.js';
import { drp, heldOffsets, NO_PIECE } from '../core/dropper.js';
import { barn, barnX, barnFloor } from '../core/barn.js';
import { cv, cam, vp, sxf, syf, drawFace } from '../render/view.js';
import { drawSadie } from '../render/sadieView.js';
import { drawChooter, drawChooterPeek } from '../render/chooterView.js';
import { drawMole } from '../render/moleView.js';
import { drawBarn } from '../render/barnView.js';

const $ = id => document.getElementById(id);
const dash = $('dash'), led = $('led'), arrow = $('arrow'), stamps = $('stamps');
const wide = matchMedia('(min-width:700px) and (orientation:landscape)');
const HINT = "TAP ANYONE TO SEE WHAT THEY'RE UP TO";
const PROMISES = [HINT, '** CHAPTER 2 COMING SOON 1996! **', 'MORE FRIENDS! MORE PIECES!'];
const SEGS = 10, SEG_COLORS = ['#39e85a', '#39e85a', '#39e85a', '#8fe83a', '#c9e83a', '#f5d63a', '#ffae3a', '#ff8a3a', '#ff5f7a', '#ff5fa8'];
const SKY = '#57c8ff';

// ---------- who's who ----------
const STAMP_OF = new Map([[sadie, 'sadie'], [chooter, 'chooter'], [mole, 'mole']]);
const WHO_OF = { sadie, chooter, mole };
const NAME = { Mole: 'THE MOLE' };
const SADIE_MOODS = { scared: 'SPOOKED', excited: 'THRILLED', haul: 'DETERMINED', mad: 'GRUMPY', happy: 'HAPPY', lookup: 'HOPEFUL', run: 'IN A HURRY' };
const CHOOTER_MOODS = { zoom: 'ZOOMIES!', fetch: 'PLAYFUL', pant: 'PUFFED OUT', bark: 'WOOF!', dig: 'DIGGING', home: 'SLEEPY' };
function moodWord(who) {
  if (who === sadie) return SADIE_MOODS[sadie.mood] || 'UNIMPRESSED';
  if (who === chooter) return !chooter.met ? 'CURIOUS' : chooter.place === 'home' ? 'SLEEPY' : CHOOTER_MOODS[chooter.mood] || 'WIGGLY';
  return drp.hay !== null ? 'DISGUSTED' : mole.napping ? 'ASLEEP' : mole.feel.tired > 0.6 ? 'WORN OUT' : 'BUSY';
}

// Where each face is (world px) and how much of the world a close-up shows, and what draws it.
function faceShot(who, time) {
  if (who === sadie) {
    const a = sadie.state === 'climb' ? 1 : 0, d = sadie.dir || 1; // she tips up when she climbs
    return { x: sadie.x + d * (Math.cos(a) * 0.46 - Math.sin(a) * 0.8) * U, y: sadie.y + (Math.sin(a) * 0.46 + Math.cos(a) * 0.8) * U, span: 1.5 * U, draw: () => drawSadie(time) };
  }
  if (who === chooter) {
    if (!chooter.met) { const at = peekSpot(); return { x: at.x, y: at.y, span: 1.6 * U, draw: () => drawChooterPeek(time) }; }
    if (chooter.place === 'home') return barn.piece ? { x: barnX(), y: barnFloor() + 2.8 * U, span: 1.8 * U, draw: () => drawBarn(time) } : null; // his face in the hayloft window
    return { x: chooter.x + (chooter.dir || 1) * 0.8 * U, y: chooter.y + 0.85 * U, span: 1.6 * U, draw: () => drawChooter(time) };
  }
  const o = world.held ? heldOffsets(world.held, world.held.ang) : NO_PIECE;
  return { x: drp.x, y: drp.y + o.y1 + 0.8 * U, span: 1.9 * U, draw: () => drawMole(time) };
}
function paintFace(canvas, who, time) {
  const shot = faceShot(who, time), g = canvas.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = SKY; g.fillRect(0, 0, canvas.width, canvas.height);
  if (!shot) return;
  drawFace(canvas, shot.x, shot.y, shot.span, () => shot.draw());
}

// ---------- tapping ----------
// The character at a spot on the board (world px), or null. At small zooms the target stays big
// enough for a finger.
export function mindAt(w) {
  const pad = Math.max(0.3 * U, 16 / cam.z);
  let best = null, bd = Infinity;
  for (const m of minds()) {
    const half = Math.max(0.7 * U, 22 / cam.z), d = Math.abs(w.x - m.x);
    if (d > half || w.y < m.y - pad || w.y > m.y + m.h + pad) continue;
    if (d < bd) { bd = d; best = m.who; }
  }
  return best;
}
let watched = sadie, shown = {};
export const watching = () => watched;
export function watch(who) {
  if (who === watched) return;
  watched = who; shown = {}; faceT = 0;
  for (const b of stamps.querySelectorAll('[data-who]')) b.setAttribute('aria-pressed', WHO_OF[b.dataset.who] === who);
}
export function closeWhy() { dash.classList.remove('open'); $('moreBtn').setAttribute('aria-expanded', 'false'); }
function toggleWhy() { const o = !dash.classList.contains('open'); dash.classList.toggle('open', o); $('moreBtn').setAttribute('aria-expanded', o); }

for (const b of stamps.querySelectorAll('[data-who]')) b.addEventListener('click', () => watch(WHO_OF[b.dataset.who]));
dash.addEventListener('click', e => {
  if (wide.matches || $('whyBox').contains(e.target)) return;
  if (dash.classList.contains('news') && !held) { hush(); return; } // tapping the sign clears it
  toggleWhy();
});
$('whyX').addEventListener('click', e => { e.stopPropagation(); closeWhy(); });

// The stamps sit in the key bar on a phone, at the top of the side column on a wide screen.
function placeStamps() {
  if (wide.matches) $('side').prepend(stamps); else $('keySpacer').before(stamps);
  closeWhy();
}

// ---------- the LED sign ----------
let newsT = null, held = false, newsUntil = 0, promise = 0;
// Put a message on the sign. `hold`: it stays until hush() (the hint, aiming a toy).
export function say(msg, hold = false) {
  led.textContent = msg; held = hold; newsUntil = performance.now() + 3500;
  led.classList.remove('flash'); void led.offsetWidth; led.classList.add('flash');
  dash.classList.add('news'); clearTimeout(newsT);
  if (!hold) newsT = setTimeout(() => dash.classList.remove('news'), 3500);
}
export function hush() { clearTimeout(newsT); held = false; newsUntil = 0; dash.classList.remove('news'); }
setInterval(() => { // no news: the wide screen's sign cycles the promises
  if (held || performance.now() < newsUntil) return;
  promise = (promise + 1) % PROMISES.length; led.textContent = PROMISES[promise];
}, 4000);
say(HINT, true); // the first-time hint, until they first touch the board
let hinted = true;
cv.addEventListener('pointerdown', () => { if (hinted) { hinted = false; if (held && led.textContent === HINT) hush(); } });
on('friendMet', name => say(`SADIE MADE A FRIEND: ${name.toUpperCase()}!`));

// ---------- boxes that never change size ----------
// The dashboard is one size, like a 90s program's panel: when the words don't fit their box, they
// wait, then step up a whole line at a time like an old terminal (never half a line showing),
// wait at the end, and start again. Each box is a whole number of lines tall (styles.css).
const HOLD = 3000, STEP = 1600; // ms to wait at each end; ms per line
const rollers = [...document.querySelectorAll('.scroll')].map(box => ({ box, inner: box.firstElementChild, text: '', t0: 0, lines: 0, line: 20, checked: -1e9, y: 0, fit: box.id === 'dashWhyBox' }));
function rollText(now) {
  for (const r of rollers) {
    const text = r.inner.textContent;
    if (text !== r.text) { r.text = text; r.t0 = now; r.checked = -1e9; }
    if (now - r.checked > 1000) { // how many lines don't fit
      r.checked = now; r.line = parseFloat(getComputedStyle(r.box).lineHeight) || 20;
      if (r.fit) { // on a wide screen, "why" gets as many whole lines as its space holds (it depends on the screen, not the words)
        const h = wide.matches ? Math.max(1, Math.floor(r.box.parentElement.clientHeight / r.line)) * r.line + 'px' : '';
        if (r.box.style.height !== h) r.box.style.height = h;
      }
      r.lines = r.box.clientHeight ? Math.max(0, Math.ceil((r.inner.offsetHeight - r.box.clientHeight - 1) / r.line)) : 0;
    }
    let y = 0;
    if (r.lines > 0) {
      const k = (now - r.t0) % (HOLD + r.lines * STEP + HOLD);
      y = Math.min(r.lines, Math.max(0, Math.floor((k - HOLD) / STEP) + 1)) * r.line;
    }
    if (y !== r.y) { r.y = y; r.inner.style.transform = `translateY(${-y}px)`; }
  }
}

// ---------- each frame ----------
const faceEl = $('face'), meter = $('feelMeter');
for (let i = 0; i < SEGS; i++) meter.append(document.createElement('i'));
const segs = [...meter.children];
let faceT = 0, stampI = 0;
const set = (id, text) => { if (shown[id] !== text) { shown[id] = text; $(id).textContent = text; } };

export function drawDashboard(time) {
  let m = minds().find(k => k.who === watched);
  if (!m) { watch(sadie); m = minds().find(k => k.who === sadie); } // gone (a fresh board, Start over)
  const t = m.think();
  const top = t.feelings.reduce((a, b) => b.value > a.value ? b : a, t.feelings[0] || { label: '', value: 0 });
  const name = NAME[m.name] || m.name.toUpperCase();
  set('dashName', name); set('dashMood', moodWord(watched)); set('dashDoing', t.doing); set('dashWhy', t.why);
  set('whyTitle', `WHY, ${name}?`); set('feelLabel', top.label);
  const lit = Math.round(Math.max(0, Math.min(1, top.value)) * SEGS);
  if (shown.lit !== lit) { shown.lit = lit; segs.forEach((s, i) => { s.className = i < lit ? 'on' : ''; s.style.background = i < lit ? SEG_COLORS[i] : ''; }); }
  faceEl.setAttribute('aria-label', name + "'s face");
  rollText(time);
  stamps.querySelector('[data-who="chooter"]').hidden = !chooter.met;

  // faces: the big one every other frame, one stamp every few frames
  if (faceT++ % 2 === 0) paintFace(faceEl, watched, time);
  if (faceT % 4 === 1) {
    const list = [...stamps.querySelectorAll('[data-who]')].filter(b => !b.hidden);
    const b = list[stampI++ % list.length];
    if (b) paintFace(b.querySelector('canvas'), WHO_OF[b.dataset.who], time);
  }

  // the arrow over them on the board (hidden while they're off screen)
  const ax = sxf(m.x), ay = syf(m.y + m.h) - 26;
  const onBoard = ax > 8 && ax < vp.vw - 8 && ay > -4 && ay < vp.vh - 30;
  arrow.hidden = !onBoard;
  if (onBoard) arrow.style.transform = `translate(${Math.round(ax - 9)}px, ${Math.round(Math.max(2, ay))}px)`;
}

wide.addEventListener('change', placeStamps);
placeStamps();
watched = null; watch(sadie);
