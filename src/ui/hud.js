// Everything on screen that isn't the world or a button: the first-run tip and toasts. Reacts to
// events from the simulation. (It's a toy, so there's no score, height or next-piece display.)
import { on } from '../core/events.js';

const tipEl = document.getElementById('tip'), toastEl = document.getElementById('toast'), topBtn = document.getElementById('topBtn');
let toastTimer = null;
export function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600); }

let tipShown = true;
function hideTip() { if (tipShown) { tipShown = false; tipEl.classList.add('hide'); } }

const MUNCH = ['Munch munch!', 'Nom nom!', 'Moo!', 'Tasty hay!'];
on('hayEaten', () => toast(MUNCH[Math.floor(Math.random() * MUNCH.length)]));
on('homeRush', () => toast('Sadie is off to fetch her barn!'));
on('barnHome', () => toast('Home sweet home!'));
on('friendMet', name => toast(`Sadie made a friend: ${name}!`));
on('friendMovedIn', name => toast(`${name} moved into the barn!`));
on('zoomies', () => toast('Zoomies!'));
on('ballBack', () => toast('Good boy, Chooter!'));
on('hayStolen', () => toast('Chooter took the hay!'));
on('playerActed', hideTip);
on('followChanged', v => topBtn.classList.toggle('following', v));
