// Everything on screen that isn't the world or a button: the first-run tip and the pop-up for a
// new friend. Reacts to events from the simulation. (It's a toy, so there's no score, height or next-piece display.)
import { on } from '../core/events.js';
import { cv } from '../render/view.js';

const tipEl = document.getElementById('tip'), toastEl = document.getElementById('toast'), topBtn = document.getElementById('topBtn');
let toastTimer = null;
export function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600); }

let tipShown = true;
function hideTip() { if (tipShown) { tipShown = false; tipEl.classList.add('hide'); } }

// Only big news gets a pop-up: a new friend. Everything else, tap a character and read their
// thought bubble (ui/thoughts.js).
on('friendMet', name => toast(`Sadie made a friend: ${name}!`));
cv.addEventListener('pointerdown', hideTip); // the tip goes once they start poking around
on('followChanged', v => topBtn.classList.toggle('following', v));
