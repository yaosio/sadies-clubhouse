// TypeFitter Deluxe 3.1: loaded by the card's start(). The joke: a 1993 program made by someone who
// loved what their text engine could do and spent ten minutes on the box. The text never fits the
// box, Sadie (a flat scanned picture with strong opinions) gushes about every change with made-up
// facts, and once her TEXT LOVE meter is full, FIT IT! fails with a big show and you win anyway.
//
// Nothing is saved: each visit starts with a fresh sentence. Nothing keeps track of what the player
// has tried; the meter is a rigged dice roll (love.js).
import { makeMeter, FIT_SCORES } from './love.js';
import { reaction, pick, HELLO, NEW_SENTENCE, FITTING, WON, BRAGS, FIT_STEPS, SENTENCES, README, HELP } from './says.js';
import { FONTS, WEB_FONTS, freshStyle, apply, lit, describe, render, layout } from './text.js';
import { drawScan } from './scan.js';

const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, reduce ? Math.min(ms, 250) : ms));

const meter = makeMeter();
let st = freshStyle(), round = 0, busy = false, sizes = null;
const sentence = () => SENTENCES[round % SENTENCES.length];

function relayout() { sizes = layout(meter.love); }
function redraw() { render(st, sentence(), round); requestAnimationFrame(relayout); }
function say(html) { $('bubble').innerHTML = html; }

function drawMeter() {
  const h = $('hearts');
  if (!h.children.length) for (let i = 0; i < 10; i++) h.appendChild(document.createElement('i'));
  [...h.children].forEach((e, i) => e.classList.toggle('on', i < meter.love));
  $('loveNum').textContent = `${meter.love}/10`;
  h.classList.remove('bump'); void h.offsetWidth; h.classList.add('bump');
  const fit = $('fit');
  fit.disabled = !meter.full || busy; fit.classList.toggle('ready', meter.full && !busy);
  $('fitSub').textContent = meter.full ? 'SHE LOVES IT!' : "SADIE ISN'T READY";
}
function syncButtons() {
  const on = lit(st);
  document.querySelectorAll('#tools [data-fx]').forEach(b => { b.classList.toggle('on', !!on[b.dataset.fx]); b.disabled = busy; });
  $('fontName').textContent = FONTS[st.font].name;
}

function change(fx) {
  if (busy) return;
  apply(fx, st);
  syncButtons(); redraw();
  const wasFull = meter.full, up = meter.change();
  say(reaction(fx, describe(st), { up, nowFull: meter.full, wasFull }));
  $('stBrag').textContent = pick(BRAGS, Math.random);
  drawMeter();
}

function newRound(first) {
  if (!first) round++;
  st = freshStyle(); meter.reset();
  syncButtons(); redraw(); drawMeter();
  say(first ? HELLO : pick(NEW_SENTENCE, Math.random));
  $('stBrag').textContent = 'READY.';
}

// ---------- pop-ups: candy panels over the frame ----------
function dialog(title, inner) {
  const v = $('veil');
  v.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-label="${title}"><i class="rivet a"></i><i class="rivet b"></i><i class="rivet c"></i><i class="rivet d"></i>` +
    `<div class="title">${title}</div><div class="body">${inner}</div></div>`;
  v.hidden = false;
  return v.querySelector('.body');
}
function closeDialog() { $('veil').hidden = true; $('veil').innerHTML = ''; }
function info(title, text) {
  if (busy) return;
  dialog(title, `<pre class="readme">${text}</pre><div class="row"><button type="button" id="okBtn"><kbd>ENTER</kbd>OK</button></div>`);
  $('okBtn').onclick = closeDialog; $('okBtn').focus();
}

// ---------- FIT IT!: a big show, it doesn't fit, you win ----------
async function fitIt() {
  if (busy || !meter.full) return;
  busy = true; syncButtons(); drawMeter();
  say(FITTING);
  const b = dialog('FITTING TEXT...', `<div class="step" id="step"></div><div class="bar"><i id="barFill"></i></div>`);
  $('txt').classList.add('push');
  for (let i = 0; i < FIT_STEPS.length; i++) { $('step').textContent = FIT_STEPS[i]; $('barFill').style.width = ((i + 1) / FIT_STEPS.length * 100) + '%'; await wait(650); }
  $('txt').classList.remove('push');
  $('step').textContent = 'RESULT: The text does not fit.';
  await wait(1300);
  const pct = pick(FIT_SCORES, Math.random);
  document.querySelector('#veil .title').textContent = 'CONGRATULATIONS!';
  b.innerHTML = `<div class="big">TEXT FIT: ${pct}%!</div><div class="mid">That's ${pct - 100}% MORE fit than fit!</div><div class="big" style="font-size:34px">YOU WIN!!</div>` +
    `<div class="paper" id="paper" aria-live="polite"></div><div class="row"><button type="button" id="nextBtn" hidden><kbd>ENTER</kbd>NEXT SENTENCE</button></div>`;
  say(pick(WON, Math.random));
  const lines = ['** CERTIFICATE OF FITNESS **', '', 'This certifies that the text', `"${sentence()}"`, `was fitted to ${pct}%.`, '', 'Signed,', 'SADIE', '🐾'];
  for (const l of lines) {
    const dv = document.createElement('div'); dv.textContent = l || ' '; if (l === '🐾') dv.className = 'paw';
    $('paper').appendChild(dv); await wait(380);
  }
  const nb = $('nextBtn'); nb.hidden = false; nb.focus();
  nb.onclick = () => { closeDialog(); busy = false; newRound(false); };
}

// ---------- wiring ----------
$('tools').addEventListener('click', e => { const b = e.target.closest('[data-fx]'); if (b) change(b.dataset.fx); });
$('fit').addEventListener('click', fitIt);
$('helpKey').addEventListener('click', () => info('HELP', HELP));
$('readmeKey').addEventListener('click', () => info('README.TXT', README));
const KEYS = { F2: 'font', b: 'bold', i: 'italic', u: 'underline', o: 'outline', s: 'shadow', w: 'warp', '+': 'bigger', '=': 'bigger', '-': 'smaller', k: 'squeeze', c: 'color', y: 'symbols' };
addEventListener('keydown', e => {
  const open = !$('veil').hidden;
  if (open && $('okBtn') && (e.key === 'Escape' || e.key === 'Enter')) { e.preventDefault(); closeDialog(); return; }
  if (open && e.key === 'Enter' && $('nextBtn') && !$('nextBtn').hidden) { e.preventDefault(); $('nextBtn').click(); return; }
  if (open) { if (e.key === 'Escape') e.preventDefault(); return; } // Escape doesn't leave in the middle of a win
  if (e.key === 'F1') { e.preventDefault(); $('helpKey').click(); return; }
  if (e.key === 'F5') { e.preventDefault(); $('readmeKey').click(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const fx = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (fx) { e.preventDefault(); change(fx); }
  if (e.key === ' ' && meter.full && !e.target.closest?.('button')) { e.preventDefault(); fitIt(); }
});
new ResizeObserver(() => requestAnimationFrame(relayout)).observe($('doc'));

// the top strip leaves room for the clubhouse's ESC BACK key (it sits over the strip's left end)
const back = $('clubBack'), top = document.querySelector('#tf .top');
if (back) new ResizeObserver(() => $('tf').style.setProperty('--back-w',
  Math.max(0, Math.ceil(back.getBoundingClientRect().right - top.getBoundingClientRect().left)) + 'px')).observe(back);

drawScan($('scan'));
newRound(true);
// every font loaded up front, so switching never shows a stand-in; measured again once they're in
if (document.fonts) Promise.all(WEB_FONTS.flatMap(f => ['400', '700', 'italic 400'].map(w => document.fonts.load(`${w} 40px "${f}"`).catch(() => {}))))
  .then(() => redraw());

// for the browser checks
window.__typefitter = () => ({ love: meter.love, goal: meter.goal, changes: meter.changes, full: meter.full, busy, round,
  text: sizes?.text, box: sizes?.box, zoom: sizes?.zoom, dialog: $('veil').hidden ? null : document.querySelector('#veil .title')?.textContent,
  bubble: $('bubble').textContent, scanDrawn: (() => { const d = $('scan').getContext('2d').getImageData(0, 0, 128, 109).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i] + d[i + 1] + d[i + 2] > 30) n++; return n / (128 * 109); })() });
