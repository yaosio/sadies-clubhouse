// The toy box: a button in the corner that opens a little tray of toys for Sadie's friends. It
// only shows up once she has a friend, and each toy only once its friend has been met. Pick a
// toy, then tap the board where you want it thrown; the mole tosses it there
// (it doesn't mind: a ball isn't a creature). One toy
// out at a time.
import { on } from '../core/events.js';
import { drp } from '../core/dropper.js';
import { chooter } from '../core/friends/chooter.js';
import { toyOut, throwToy } from '../core/toys.js';

// Every toy: who it's for (it's hidden until they've been met) and what it says in the tray.
const TOYS = [
  { kind: 'ball', name: 'Ball', note: 'Chooter fetches it', unlocked: () => chooter.met },
];

const btn = document.getElementById('toyBtn'), tray = document.getElementById('toyTray'), aimTip = document.getElementById('aimTip');
let aiming = null; // the toy picked, waiting for a tap on the board

function anyUnlocked() { return TOYS.some(t => t.unlocked()); }
function refresh() {
  btn.hidden = !anyUnlocked();
  btn.classList.toggle('aiming', !!aiming);
  aimTip.classList.toggle('show', !!aiming);
}
function buildTray() {
  tray.textContent = '';
  for (const t of TOYS) {
    if (!t.unlocked()) continue;
    const b = document.createElement('button');
    b.className = 'toy'; b.disabled = toyOut();
    b.innerHTML = `<span class="toy-pic ${t.kind}"></span><span><b>${t.name}</b><small>${toyOut() ? 'Already out' : t.note}</small></span>`;
    b.addEventListener('click', () => { aiming = t.kind; closeTray(); refresh(); });
    tray.appendChild(b);
  }
}
function openTray() { buildTray(); tray.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
function closeTray() { tray.hidden = true; btn.setAttribute('aria-expanded', 'false'); }

// tapping anywhere else closes the tray
document.addEventListener('pointerdown', e => { if (!tray.hidden && !tray.contains(e.target) && !btn.contains(e.target)) closeTray(); });
btn.addEventListener('click', () => {
  if (aiming) { aiming = null; refresh(); return; } // tap again to put the toy back
  if (tray.hidden) openTray(); else closeTray();
});

// For the board's tap handling: is a toy waiting to be thrown? Then throw it at this world spot.
export const isAiming = () => !!aiming;
export function throwAt(x, y) {
  if (!aiming) return;
  throwToy(aiming, drp.x, drp.y, x, y);
  aiming = null; refresh();
}

on('friendMet', () => { refresh(); btn.classList.add('new'); setTimeout(() => btn.classList.remove('new'), 6000); });
on('reset', refresh);
refresh();
