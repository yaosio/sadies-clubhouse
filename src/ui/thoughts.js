// The thought bubble: tap Sadie or Chooter to see what they're doing, why, and how they feel.
// It pops out above them and follows them around until you tap somewhere else (or tap them again).
// What they're thinking comes from the characters themselves (core/mind/thoughts.js).
import { U } from '../config.js';
import { minds } from '../core/mind/thoughts.js';
import { cam, vp, sxf, syf, camState } from '../render/view.js';

const el = document.getElementById('thought'), whoEl = document.getElementById('thoughtWho');
const doingEl = document.getElementById('thoughtDoing'), whyEl = document.getElementById('thoughtWhy'), feelsEl = document.getElementById('thoughtFeels');
const TOP_CLEAR = 66;  // screen px kept clear at the top for the map strip
let open = null, shownLabels = '';

// The character at a spot on the board (world px), or null. At small zooms the target stays
// big enough for a finger.
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
export const thoughtsFor = () => open; // who the bubble is showing, or null
export function showThoughts(who) { open = who; shownLabels = ''; el.hidden = false; drawThoughts(); }
export function hideThoughts() { open = null; el.hidden = true; }

// Each frame: refresh the words and bars, and move the bubble to where the character is now.
export function drawThoughts() {
  if (!open) return;
  const m = minds().find(k => k.who === open);
  if (!m) { hideThoughts(); return; } // gone (a fresh board, or Start over)
  const t = m.think();
  whoEl.textContent = m.name; doingEl.textContent = t.doing; whyEl.textContent = t.why;
  const labels = t.feelings.map(f => f.label).join('|');
  if (labels !== shownLabels) {
    shownLabels = labels;
    feelsEl.replaceChildren(...t.feelings.flatMap(f => { const s = document.createElement('span'), i = document.createElement('i'); s.textContent = f.label; i.append(document.createElement('b')); return [s, i]; }));
  }
  const bars = feelsEl.querySelectorAll('i b');
  t.feelings.forEach((f, k) => { bars[k].style.width = Math.round(Math.max(0, Math.min(1, f.value)) * 100) + '%'; });

  // above their head if it fits, otherwise below their feet; kept on screen
  const w = el.offsetWidth, h = el.offsetHeight, sx = sxf(m.x), right = vp.vw - camState.insetR - 12;
  const x = Math.max(12, Math.min(right - w, sx - w / 2));
  let y = syf(m.y + m.h) - h - 14;
  const below = y < TOP_CLEAR;
  if (below) y = Math.min(syf(m.y) + 14, vp.vh - camState.insetB - h - 12);
  el.classList.toggle('below', below);
  el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  el.style.setProperty('--tail', Math.max(18, Math.min(w - 18, sx - x)) + 'px');
}
