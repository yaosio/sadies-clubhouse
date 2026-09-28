// The toy box: a TOYS button on the key bar that opens a TOY BOX window of toys for Sadie's
// friends. It only shows up once she has a friend, and each toy only once its friend has been met.
// Pick a toy, then tap the board where you want it thrown; the mole tosses it there (it doesn't
// mind: a ball isn't a creature). One toy out at a time. The LED sign says what to do.
import { on } from '../core/events.js';
import { drp } from '../core/dropper.js';
import { chooter } from '../core/friends/chooter.js';
import { toyOut, throwToy } from '../core/toys.js';
import { say, hush } from './dashboard.js';

// Every toy: who it's for (it's hidden until they've been met) and what it says in the box.
const TOYS = [
  { kind: 'ball', name: 'Ball', note: 'Chooter fetches it', unlocked: () => chooter.met },
];

const btn = document.getElementById('toyBtn'), tray = document.getElementById('toyTray'), list = document.getElementById('toyList');
let aiming = null; // the toy picked, waiting for a tap on the board

function anyUnlocked() { return TOYS.some(t => t.unlocked()); }
function refresh() {
  btn.hidden = !anyUnlocked();
  btn.classList.toggle('aiming', !!aiming);
}
function buildTray() {
  list.textContent = '';
  for (const t of TOYS) {
    if (!t.unlocked()) continue;
    const b = document.createElement('button');
    b.className = 'toy'; b.type = 'button'; b.disabled = toyOut();
    b.innerHTML = `<span class="${t.kind}"></span><span>${t.name}<small>${toyOut() ? 'Already out' : t.note}</small></span>`;
    b.addEventListener('click', () => { aiming = t.kind; closeTray(); refresh(); say('TAP WHERE TO THROW IT', true); });
    list.appendChild(b);
  }
}
function openTray() { buildTray(); tray.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
export function closeTray() { tray.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
export const isTrayOpen = () => !tray.hidden;

// tapping anywhere else closes the box
document.addEventListener('pointerdown', e => { if (!tray.hidden && !tray.contains(e.target) && !btn.contains(e.target)) closeTray(); });
document.getElementById('toyX').addEventListener('click', closeTray);
btn.addEventListener('click', () => {
  if (aiming) { aiming = null; refresh(); hush(); return; } // tap again to put the toy back
  if (tray.hidden) openTray(); else closeTray();
});

// For the board's tap handling: is a toy waiting to be thrown? Then throw it at this world spot.
export const isAiming = () => !!aiming;
export function throwAt(x, y) {
  if (!aiming) return;
  throwToy(aiming, drp.x, drp.y, x, y);
  aiming = null; refresh(); hush();
}

on('friendMet', () => { refresh(); btn.classList.add('new'); setTimeout(() => btn.classList.remove('new'), 6000); });
on('reset', refresh);
refresh();
