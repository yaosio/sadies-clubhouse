// Everything on screen that isn't the world: height and hay eaten, supply pips on the Drop button,
// the next-piece preview, the first-run tip, and toasts. Reacts to events from the simulation.
import { U } from '../config.js';
import { world } from '../core/world.js';
import { on } from '../core/events.js';
import { COLORS, NAMES } from '../core/physics/pieceTypes.js';
import { getTemplate } from '../core/physics/templates.js';
import { SUPPLY_MAX } from '../core/dropper.js';
import { sadie } from '../core/sadie/brain.js';
import { shade } from '../render/color.js';

// ---------- next preview ----------
const ncv = document.getElementById('nextCv'), nctx = ncv.getContext('2d');
function drawNext() {
  nctx.clearRect(0, 0, ncv.width, ncv.height);
  const T = getTemplate(world.nextType, 20);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const i of T.bnd) { x0 = Math.min(x0, T.rx[i]); x1 = Math.max(x1, T.rx[i]); y0 = Math.min(y0, T.ry[i]); y1 = Math.max(y1, T.ry[i]); }
  const s = Math.min(1.1, 112 / (x1 - x0), 64 / (y1 - y0));
  document.getElementById('nextName').textContent = NAMES[world.nextType] ? 'Next: ' + NAMES[world.nextType] : 'Next';
  nctx.save(); nctx.translate(ncv.width / 2 - (x0 + x1) / 2 * s, ncv.height / 2 + (y0 + y1) / 2 * s); nctx.scale(s, -s);
  const b = T.bnd; nctx.beginPath();
  for (let q = 0; q < b.length; q++) { const i = b[q]; q ? nctx.lineTo(T.rx[i], T.ry[i]) : nctx.moveTo(T.rx[i], T.ry[i]); }
  nctx.closePath(); nctx.fillStyle = COLORS[world.nextType]; nctx.fill();
  nctx.lineWidth = 2.5; nctx.lineJoin = 'round'; nctx.strokeStyle = shade(COLORS[world.nextType], -0.3); nctx.stroke();
  nctx.restore();
}

const tipEl = document.getElementById('tip'), toastEl = document.getElementById('toast'), topBtn = document.getElementById('topBtn');
const dropBtn = document.getElementById('dropBtn');
const hEl = document.getElementById('hVal'), bestEl = document.getElementById('bestVal'), hayEl = document.getElementById('hayVal');
let lastHud = '';
const pipBox = document.getElementById('pips');
const pipEls = Array.from({ length: SUPPLY_MAX }, () => { const d = document.createElement('span'); d.className = 'pip'; d.appendChild(document.createElement('i')); pipBox.appendChild(d); return d.firstChild; });
export function updateHud() {
  const h = sadie.y / U, got = world.hayEaten;
  const key = h.toFixed(1) + '|' + world.climbBest.toFixed(1) + '|' + got + '|' + Math.floor(world.supply * 20);
  if (key === lastHud) return; lastHud = key;
  hEl.textContent = h.toFixed(1);
  bestEl.textContent = 'Best ' + world.climbBest.toFixed(1);
  for (let i = 0; i < SUPPLY_MAX; i++) pipEls[i].style.setProperty('--f', Math.round(Math.min(1, Math.max(0, world.supply - i)) * 100) + '%');
  dropBtn.classList.toggle('empty', world.supply < 1);
  hayEl.textContent = `${got} hay eaten`;
}
let toastTimer = null;
export function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600); }

let tipShown = true;
function hideTip() { if (tipShown) { tipShown = false; tipEl.classList.add('hide'); } }

const MUNCH = ['Munch munch!', 'Nom nom!', 'Moo!', 'Tasty hay!'];
on('hayEaten', () => toast(MUNCH[Math.floor(Math.random() * MUNCH.length)]));
on('homeRush', () => toast('Sadie is off to fetch her barn!'));
on('barnHome', () => toast('Home sweet home!'));
on('nextChanged', () => drawNext());
on('playerActed', hideTip);
on('followChanged', v => topBtn.classList.toggle('following', v));
