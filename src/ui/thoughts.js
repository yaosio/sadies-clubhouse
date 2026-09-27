// The thought bubble: tap Sadie or Chooter to see what they're doing, why, and how they feel.
// It pops out above them and follows them around until you tap somewhere else (or tap them again).
// What they're thinking comes from the characters themselves (core/mind/thoughts.js).
import { U } from '../config.js';
import { minds } from '../core/mind/thoughts.js';
import { cam, vp, sxf, syf, camState } from '../render/view.js';

const el = document.getElementById('thought'), whoEl = document.getElementById('thoughtWho');
const doingEl = document.getElementById('thoughtDoing'), whyEl = document.getElementById('thoughtWhy'), feelsEl = document.getElementById('thoughtFeels');
const TOP_CLEAR = 66;  // screen px kept clear at the top for the map strip
const SLACK = 40;      // how far past the edge before the bubble swaps sides (so it doesn't flicker on the line)
const HOLD = 1000;     // ms it stays on a side after swapping
const MAX_BARS = 4;    // never more feelings than this in one bubble
let open = null, shownLabels = '', side = null, sideT = 0;

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
export function showThoughts(who) { open = who; shownLabels = ''; side = null; el.hidden = false; drawThoughts(); }
export function hideThoughts() { open = null; el.hidden = true; }

// Each frame: refresh the words and bars, and move the bubble to where the character is now.
export function drawThoughts() {
  if (!open) return;
  const m = minds().find(k => k.who === open);
  if (!m) { hideThoughts(); return; } // gone (a fresh board, or Start over)
  const t = m.think();
  if (t.feelings.length > MAX_BARS) t.feelings = t.feelings.slice(0, MAX_BARS);
  whoEl.textContent = m.name; doingEl.textContent = t.doing; whyEl.textContent = t.why;
  const labels = t.feelings.map(f => f.label).join('|');
  if (labels !== shownLabels) {
    shownLabels = labels;
    feelsEl.replaceChildren(...t.feelings.flatMap(f => { const s = document.createElement('span'), i = document.createElement('i'); s.textContent = f.label; i.append(document.createElement('b')); return [s, i]; }));
  }
  const bars = feelsEl.querySelectorAll('i b');
  t.feelings.forEach((f, k) => { bars[k].style.width = Math.round(Math.max(0, Math.min(1, f.value)) * 100) + '%'; });

  // Above their head if it fits, otherwise below their feet. It picks a side when it opens and
  // sticks to it: it only swaps once it's well past the edge, and not again for a second, so a
  // character hovering on the line (the mole bobs) doesn't make it flicker up and down.
  const w = el.offsetWidth, h = el.offsetHeight, sx = sxf(m.x), right = vp.vw - camState.insetR - 12, bottom = vp.vh - camState.insetB - 12;
  const x = Math.max(12, Math.min(right - w, sx - w / 2));
  const aboveY = syf(m.y + m.h) - h - 14, belowY = syf(m.y) + 14, now = performance.now();
  if (!side) { side = aboveY >= TOP_CLEAR ? 'above' : 'below'; sideT = now; }
  else if (now - sideT > HOLD) {
    const swap = side === 'above' ? aboveY < TOP_CLEAR - SLACK && belowY + h <= bottom
      : aboveY >= TOP_CLEAR + SLACK || belowY + h > bottom + SLACK;
    if (swap) { side = side === 'above' ? 'below' : 'above'; sideT = now; }
  }
  const below = side === 'below';
  const y = below ? Math.max(8, Math.min(belowY, bottom - h)) : Math.min(Math.max(8, aboveY), bottom - h);
  el.classList.toggle('below', below);
  el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  el.style.setProperty('--tail', Math.max(18, Math.min(w - 18, sx - x)) + 'px');
}
