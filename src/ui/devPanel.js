// The Dev tuning sheet: physics sliders (for us, not for players), restore defaults, clear the
// tower, and the performance-stats toggle (wired up in perf.js).
import { DEFAULTS, tuning, applyTuning } from '../config.js';
import { world } from '../core/world.js';
import { wake } from '../core/physics/solver.js';
import { resetGame } from '../core/game.js';

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
function openSheet() { sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false'); document.getElementById('pieceCount').textContent = `${world.pieces.length} pieces on the board.`; }
export function closeSheet() { sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); }
document.getElementById('settingsBtn').addEventListener('click', () => sheet.classList.contains('open') ? closeSheet() : openSheet());
document.getElementById('closeSheet').addEventListener('click', closeSheet);
document.getElementById('resetSettings').addEventListener('click', () => { Object.assign(tuning.set, DEFAULTS); applySettings(); world.pieces.forEach(wake); });
document.getElementById('clearTower').addEventListener('click', () => { resetGame(); closeSheet(); });
export const isSheetOpen = () => sheet.classList.contains('open');
