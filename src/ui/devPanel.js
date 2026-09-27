// The dev sheet (for us, not for players), in three tabs:
//   Debug: game speed, raining lots of pieces, making Sadie and Chooter do things now, clear tower, start over.
//   Physics: the feel sliders and restore defaults.
//   Info: the performance-stats toggle (wired up in perf.js), piece count, keys.
// On a phone it's a short bottom sheet that can shrink to its title bar; on a wide screen it sits
// down the right side. Either way the camera shifts so Sadie stays in the part you can see.
import { U, DEFAULTS, tuning, applyTuning } from '../config.js';
import { world } from '../core/world.js';
import { wake } from '../core/physics/solver.js';
import { drp } from '../core/dropper.js';
import { chooter } from '../core/friends/chooter.js';
import { sadie } from '../core/sadie/brain.js';
import { debug, SPEEDS, rainPieces, buildPile, stopRain, sadieToTop, fetchBarnNow, meetChooterNow, zoomiesNow, goHomeNow, comeOutNow, teaseNow } from '../core/debug.js';
import { camState } from '../render/view.js';
import { clearTower, startOver } from '../core/save.js';

const sheet = document.getElementById('sheet');
const SLIDERS = [
  ['stiffness', 'Stiffness', 'How firmly each block holds its shape.', 0, 1, 0.01],
  ['bendy', 'Bendiness', 'How easily whole pieces bend at the joints.', 0, 1, 0.01],
  ['jiggle', 'Jiggle', 'How long wobbles last before settling.', 0, 1, 0.01],
  ['gravity', 'Gravity', '', 0.3, 2, 0.01],
  ['friction', 'Grip', 'How much pieces stick instead of sliding.', 0, 1, 0.01],
  ['size', 'Piece size', 'Applies to new pieces.', 0.6, 1.5, 0.05],
];
const sliderBox = document.getElementById('sliders');
const outs = {};
for (const [key, label, hint, min, max, step] of SLIDERS) {
  const row = document.createElement('div'); row.className = 'row';
  const id = 's_' + key;
  row.innerHTML = `<label for="${id}">${label}</label><output id="o_${key}"></output><input id="${id}" type="range" min="${min}" max="${max}" step="${step}">${hint ? `<small>${hint}</small>` : ''}`;
  sliderBox.appendChild(row);
  const inp = row.querySelector('input'); outs[key] = row.querySelector('output');
  inp.value = tuning.set[key];
  inp.addEventListener('input', () => { tuning.set[key] = +inp.value; applySettings(); world.pieces.forEach(wake); });
}
export function applySettings() {
  applyTuning();
  const set = tuning.set;
  for (const [key] of SLIDERS) { outs[key].textContent = key === 'gravity' || key === 'size' ? set[key].toFixed(2) + '×' : Math.round(set[key] * 100); document.getElementById('s_' + key).value = set[key]; }
}
const $ = id => document.getElementById(id);

// ---------- open, close, shrink, tabs ----------
// Tell the camera how much of the board the sheet covers, and move the on-screen buttons out
// of its way (on a phone only while it's shrunk to its title bar, so you can keep playing).
function fitCamera() {
  const open = sheet.classList.contains('open'), side = matchMedia('(min-width: 900px)').matches;
  camState.insetB = open && !side ? sheet.offsetHeight : 0;
  camState.insetR = open && side ? sheet.offsetWidth : 0;
  const app = document.getElementById('app').style;
  app.setProperty('--dev-b', (open && !side && sheet.classList.contains('shrunk') ? sheet.offsetHeight : 0) + 'px');
  app.setProperty('--dev-r', camState.insetR + 'px');
}
function openSheet() { sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false'); refresh(); fitCamera(); }
export function closeSheet() { sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); fitCamera(); }
$('settingsBtn').addEventListener('click', () => sheet.classList.contains('open') ? closeSheet() : openSheet());
$('closeSheet').addEventListener('click', closeSheet);
$('shrinkSheet').addEventListener('click', () => {
  const shrunk = sheet.classList.toggle('shrunk');
  $('shrinkSheet').setAttribute('aria-expanded', String(!shrunk));
  $('shrinkSheet').setAttribute('aria-label', shrunk ? 'Expand the panel' : 'Shrink the panel');
  fitCamera();
});
for (const tab of sheet.querySelectorAll('.tab')) tab.addEventListener('click', () => {
  for (const t of sheet.querySelectorAll('.tab')) t.setAttribute('aria-selected', String(t === tab));
  for (const p of sheet.querySelectorAll('.pane')) p.hidden = p.dataset.pane !== tab.dataset.tab;
  sheet.querySelector('.sheet-body').scrollTop = 0;
  if (sheet.classList.contains('shrunk')) $('shrinkSheet').click();
  refresh(); fitCamera();
});
window.addEventListener('resize', fitCamera);
export const isSheetOpen = () => sheet.classList.contains('open');

// ---------- physics tab ----------
$('resetSettings').addEventListener('click', () => { Object.assign(tuning.set, DEFAULTS); applySettings(); world.pieces.forEach(wake); });

// ---------- debug tab ----------
const speedSeg = $('speedSeg');
for (const s of SPEEDS) {
  const b = document.createElement('button'); b.textContent = s + '×'; b.dataset.speed = s;
  b.addEventListener('click', () => { debug.speed = s; refresh(); });
  speedSeg.appendChild(b);
}
const act = (id, fn) => $(id).addEventListener('click', () => { fn(); refresh(); });
act('rain25', () => rainPieces(25, drp.x - 5 * U, drp.x + 5 * U));
act('rain100', () => rainPieces(100));
act('buildPile', () => buildPile(drp.x));
act('stopRain', stopRain);
act('sadieTop', sadieToTop);
act('fetchBarn', fetchBarnNow);
act('meetChooter', meetChooterNow);
act('zoomies', zoomiesNow);
act('goHome', goHomeNow);
act('comeOut', comeOutNow);
act('tease', teaseNow);
// These can't be undone, so each needs a second tap within a few seconds.
function confirmTap(id, label, fn) {
  const b = $(id); let armed = 0;
  b.addEventListener('click', () => {
    if (armed) { clearTimeout(armed); armed = 0; b.textContent = label; fn(); refresh(); return; }
    b.textContent = 'Tap again to ' + label.toLowerCase();
    armed = setTimeout(() => { armed = 0; b.textContent = label; }, 3000);
  });
}
confirmTap('clearTower', 'Clear tower', clearTower);
confirmTap('startOver', 'Start over', startOver);

// Keep the buttons' on/off states current while the sheet is open.
function refresh() {
  if (!isSheetOpen()) return;
  const sp = debug.boost ? Math.max(debug.speed, 8) : debug.speed;
  for (const b of speedSeg.children) b.setAttribute('aria-pressed', String(+b.dataset.speed === sp));
  $('stopRain').disabled = !debug.rain.length && !debug.boost;
  $('rainNote').textContent = debug.rain.length ? `${debug.rain.length} pieces still to come${debug.boost ? ', running at 8×' : ''}.`
    : debug.boost ? 'Letting the pile settle at 8×…' : '"Here" means around the dropper. A tall pile runs at 8× until it settles.';
  $('fetchBarn').disabled = !!sadie.trip;
  $('meetChooter').disabled = chooter.met;
  $('zoomies').disabled = !chooter.met || chooter.doing === 'zoom';
  $('goHome').disabled = !chooter.met || chooter.place !== 'out' || chooter.doing === 'home';
  $('comeOut').disabled = !chooter.met || chooter.place !== 'home';
  $('tease').disabled = !chooter.met || chooter.feel.ignored >= 1 || chooter.doing === 'tease';
  $('pieceCount').textContent = `${world.pieces.length} pieces on the board, ${world.fossils} of them fossils.`;
}
setInterval(refresh, 400);
