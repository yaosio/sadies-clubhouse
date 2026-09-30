// The mock-up page around the aquarium room: computer or phone, the on-screen bits the game would
// show (the TAP THE GLASS prompt), the controls, and a switch to see the cabinet full of finds.
import { start } from './scene.js';

const $ = s => document.querySelector(s);
const stage = $('#stage'), canvas = $('#view');
const room = await start(canvas);
let device = 'computer', found = false, dived = false;

function show() {
  document.querySelectorAll('[data-device]').forEach(b => b.setAttribute('aria-pressed', b.dataset.device === device));
  $('#finds').setAttribute('aria-pressed', found);
  stage.dataset.device = device;
  room.showFinds(found);
  requestAnimationFrame(() => room.resize());
}
document.querySelectorAll('[data-device]').forEach(b => b.addEventListener('click', () => { device = b.dataset.device; show(); }));
$('#toLanding').addEventListener('click', () => room.use('out'));
$('#toRoom').addEventListener('click', () => room.use('in'));
$('#finds').addEventListener('click', () => { found = !found; show(); });
addEventListener('resize', () => room.resize());

// the prompt: only when you're at the glass and looking at it, so a swipe can never tap it
// (and at the door, the same kind of prompt goes in or out)
const SAY = { glass: ['TAP THE GLASS', 'TAP<br>THE<br>GLASS'], in: ['GO IN: AQUARIUM', 'GO IN'], out: ['GO OUT', 'GO OUT'] };
let near = null;
room.hooks.onNear = what => {
  what = dived ? null : what;
  if (what === near) return;
  near = what; stage.dataset.near = what || 'no';
  if (what) { $('#goText').textContent = SAY[what][0]; $('#tapBtn').innerHTML = SAY[what][1]; }
};
const tap = () => {
  if (near === 'glass') { stage.dataset.dived = 'going'; room.tapGlass(); }
  else if (near) room.use(near);
  room.hooks.onNear(null);
};
room.hooks.onDived = () => { dived = true; stage.dataset.dived = 'yes'; };
$('#tapBtn').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); tap(); });
$('#backBtn').addEventListener('click', () => { dived = false; stage.dataset.dived = 'no'; room.back(); });

// keys
const KEYS = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyD: 'r', ArrowLeft: 'tl', ArrowRight: 'tr' };
addEventListener('keydown', e => {
  if (e.target.closest?.('button') && (e.key === 'Enter' || e.key === ' ')) return;
  const k = KEYS[e.code];
  if (k) { e.preventDefault(); room.held.add(k); return; }
  if (e.code === 'KeyE') { e.preventDefault(); if (dived) $('#backBtn').click(); else tap(); }
});
addEventListener('keyup', e => { const k = KEYS[e.code]; if (k) room.held.delete(k); });
addEventListener('blur', () => room.held.clear());

// looking: drag anywhere; on a phone, a touch starting on the thumb stick walks instead
const stick = { id: null, x0: 0, y0: 0, x: 0, y: 0 }, drag = { id: null, x: 0, y: 0 };
const knob = $('#knob');
room.hooks.stick = () => stick.id === null ? { x: 0, y: 0 } : { x: stick.x, y: -stick.y };
canvas.addEventListener('pointerdown', e => {
  const r = stage.getBoundingClientRect();
  if (device === 'phone' && e.clientX - r.left < 150 && r.bottom - e.clientY < 170) {
    stick.id = e.pointerId; const s = $('#stick').getBoundingClientRect();
    stick.x0 = s.left + s.width / 2; stick.y0 = s.top + s.height / 2; moveStick(e);
  } else { drag.id = e.pointerId; drag.x = e.clientX; drag.y = e.clientY; }
  canvas.setPointerCapture(e.pointerId);
});
function moveStick(e) {
  let x = (e.clientX - stick.x0) / 40, y = (e.clientY - stick.y0) / 40; const l = Math.hypot(x, y);
  if (l > 1) { x /= l; y /= l; }
  stick.x = x; stick.y = y; knob.style.transform = `translate(${x * 26}px, ${y * 26}px)`;
}
canvas.addEventListener('pointermove', e => {
  if (e.pointerId === stick.id) moveStick(e);
  else if (e.pointerId === drag.id) {
    const k = device === 'phone' ? 0.006 : 0.005;
    room.turn((e.clientX - drag.x) * k, (e.clientY - drag.y) * k * (device === 'phone' ? 0.6 : 1));
    drag.x = e.clientX; drag.y = e.clientY;
  }
});
const up = e => {
  if (e.pointerId === stick.id) { stick.id = null; stick.x = stick.y = 0; knob.style.transform = ''; }
  if (e.pointerId === drag.id) drag.id = null;
};
canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

// for the pictures: #phone, #found, #glass (standing at the glass), #finds-view, #dive
const h = location.hash.slice(1).split('-');
if (h.includes('phone')) device = 'phone';
if (h.includes('found')) found = true;
if (h.includes('glass')) room.put(-0.9, 2.7, Math.PI + 0.15, 0.05);
if (h.includes('cabinet')) room.put(2.2, 0.6, -Math.PI / 2, 0.05);
if (h.includes('landing')) room.put(0.5, -10.6, Math.PI + 0.06, 0.05);
if (h.includes('ring')) room.put(-3.2, -1.2, Math.PI / 2 + 0.3, 0.2);
if (h.includes('overview')) room.put(-3.6, -4.8, Math.PI + 0.62, -0.12);
show();
if (h.includes('dive')) { room.put(-0.9, 2.7, Math.PI + 0.15, 0.05); setTimeout(() => { stage.dataset.near = 'yes'; tap(); }, 300); }
window.__aqReady = true;
