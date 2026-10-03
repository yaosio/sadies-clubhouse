// A way of playing: painting a place with a `brush` (the paint shop). You walk about as normal, and
// pressing paints the place itself. With the mouse locked, holding its button paints where the dot in
// the middle of the view is (and walking or looking about while you hold it paints a stroke). On a
// phone, or with the mouse free, the LOOK and PAINT buttons say what pressing does: look around, or
// paint wherever you press (the thumb stick still walks). Tapping one turns it on (tapping it again
// leaves it on). Picking something up leaves them as they are (so you can look about for the next
// thing), and only flashes the YOU'RE HOLDING box.
//
// The place is told each press as a line out into it, every frame while it's held:
// brush(id, ray, 'down' | 'move' | 'up'). Its `brushLook()` says what you're holding, for the
// YOU'RE HOLDING box, the buttons and the dot: { color, tool, icon (a little picture), paint (its
// name, or none), verb (what pressing does: PAINT, STAMP...), drags (painting a line as you drag),
// picks (a count, up one each time something's picked up) }.
//
// Any place, inside or out, can have a brush: nothing here knows which one it is.
// `you` is what the clubhouse lends a way of playing (see clubhouse.js, "ways of playing").
import html from './paint.html';
import css from './paint.css';

export function painting(you) {
  const { $, canvas, touchy, on, me } = you;
  $('#flash').insertAdjacentHTML('beforebegin', html);
  const style = document.createElement('style'); style.textContent = css; $('#flash').before(style);

  let painting = false, brushPlace = null, brushShown = '', picks = null;
  const brushes = new Map();   // each press that's painting: where it is on the screen (null: the middle)
  const here = () => you.mode === 'play' && me.world.brush;
  function brushDown(id, at) {
    brushPlace = me.world; brushes.set(id, at);
    brushPlace.brush(id, at ? you.pointAt(at) : you.middle(), 'down');
    try { if (at) canvas.setPointerCapture(id); } catch {}
  }
  function brushUp(id) { if (brushes.delete(id)) brushPlace?.brush(id, null, 'up'); }
  function brushOn() {
    if (!brushes.size) return;
    if (you.mode !== 'play' || me.world !== brushPlace) { for (const id of [...brushes.keys()]) brushUp(id); return; }
    for (const [id, at] of brushes) brushPlace.brush(id, at ? you.pointAt(at) : you.middle(), 'move');
  }
  // how to paint, in a line: what pressing does, with the mouse locked, on PAINT or on LOOK
  function howTo(b) {
    const press = touchy ? 'TAP' : 'CLICK', it = b.verb === 'PAINT' || b.verb === 'SPRAY' || b.verb === 'STAMP' || b.verb === 'FILL' ? ' IT' : '';
    if (you.locked()) return b.drags ? `HOLD THE MOUSE BUTTON TO ${b.verb} WHERE THE DOT IS` : `CLICK TO ${b.verb} WHERE THE DOT IS`;
    if (!painting) return `${press} PAINT (BOTTOM RIGHT), THEN ${press} ANYTHING TO ${b.verb}${it}`;
    return `${press} ANYTHING TO ${b.verb}${it}${b.drags ? ` (OR ${touchy ? 'SLIDE YOUR FINGER' : 'DRAG'} ACROSS IT)` : ''}. ${press} LOOK TO LOOK AROUND`;
  }
  const cursor = c => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='12' cy='12' r='7' fill='none' stroke='#1c1238' stroke-width='5'/><circle cx='12' cy='12' r='7' fill='none' stroke='${c}' stroke-width='3'/><rect x='11' y='11' width='2' height='2' fill='#1c1238'/></svg>`)}") 12 12, crosshair`;
  function show() {
    const locked = you.locked(), b = here() ? me.world.brushLook?.() || {} : null;
    if (!b) painting = false;   // (left the place, or paused: back to looking)
    // (picking something up: the box flashes)
    const picked = b && picks !== null && b.picks !== picks;
    picks = b ? b.picks ?? 0 : null;
    const key = b ? [locked, painting, b.color, b.tool, b.paint, b.verb].join('|') : '';
    const box = $('#holding');
    if (picked) { box.classList.remove('new'); void box.offsetWidth; box.classList.add('new'); }
    canvas.classList.toggle('painting', !!b && painting && !locked);
    if (key === brushShown) return;
    brushShown = key;
    const btn = $('#paint'), aim = $('#aim');
    btn.hidden = !b || locked; aim.hidden = !b || !locked; box.hidden = !b;
    if (!b) return;
    for (const el of btn.children) el.setAttribute('aria-pressed', String((el.dataset.to === 'paint') === painting));
    for (const el of [btn, aim, box]) el.style.setProperty('--paint', b.color || '#fff');
    canvas.style.setProperty('--brush', cursor(b.color || '#fff'));
    const g = box.querySelector('canvas').getContext('2d');
    g.clearRect(0, 0, 16, 16); if (b.icon) g.drawImage(b.icon, 0, 0, 16, 16);
    box.querySelector('b').textContent = b.tool || '';
    box.querySelector('span').hidden = !b.paint;
    box.querySelector('em').textContent = b.paint || '';
    box.querySelector('p').textContent = howTo(b);
  }
  for (const el of $('#paint').children) on(el, 'click', e => { e.stopPropagation(); if (here()) painting = el.dataset.to === 'paint'; show(); });

  return {
    // a click mustn't lock the mouse while it's on PAINT (it paints where you click)
    keepsMouse: () => painting && !!me.world.brush,
    // a press (not on the thumb stick): painting takes it if it's for painting
    press(e) {
      if (you.mode !== 'play' || !me.world.brush) return false;
      if (you.locked()) { if (e.pointerType !== 'mouse') return false; if (e.button === 0) brushDown(e.pointerId, null); return true; }
      if (!painting) return false;
      brushDown(e.pointerId, { clientX: e.clientX, clientY: e.clientY }); return true;
    },
    move(e) { if (brushes.get(e.pointerId)) Object.assign(brushes.get(e.pointerId), { clientX: e.clientX, clientY: e.clientY }); },
    letGo(e) { brushUp(e.pointerId); },
    frame() { brushOn(); show(); },
    // for the checks: on PAINT, and how many presses are painting
    on: () => painting,
    presses: () => brushes.size,
  };
}
