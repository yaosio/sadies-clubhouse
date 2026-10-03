// The controls: keys, the mouse and the thumb stick, turned into walking, looking and using. What a
// way of playing (src/clubhouse/play/) wants of them it takes first, through `g`, which the clubhouse
// fills in as it goes: the mode you're in (`mode()`), the ways of playing, and what pausing, resuming,
// using and closing the letter do. Never names a room.
import { Vector3 } from 'three';

export function controls({ $, on, canvas, cam, me, touchy, STICK }, g) {
  const held = new Set();
  const stick = { id: null, x0: 0, y0: 0, x: 0, y: 0 }, drag = { id: null, x: 0, y: 0 };
  let locked = false;
  function turn(dx, dy) { if (me.world.watch) return; me.yaw -= dx; me.pitch = Math.max(-0.75, Math.min(0.75, me.pitch - dy)); }
  const KEYS = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyD: 'r', ArrowLeft: 'tl', ArrowRight: 'tr' };
  on(window, 'keydown', e => {
    if (e.code === 'Escape' || e.key === 'Escape') { e.preventDefault(); if (g.mode() === 'menu') g.resume(); else if (g.mode() === 'play') g.pause(); else if (g.mode() === 'arcade') g.game().stepBack(); return; }
    if (g.ways().some(w => w.key?.(e))) return;
    if (g.mode() === 'letter' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); g.closeLetter(); return; }
    if (g.mode() !== 'play') return;
    const k = KEYS[e.code];
    if (k) { e.preventDefault(); held.add(k); return; }
    if (e.code === 'KeyE' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (g.target() && !e.repeat) g.use(g.target()); }   // (holding it down uses it once)
  });
  on(window, 'keyup', e => { const k = KEYS[e.code]; if (k) held.delete(k); for (const w of g.ways()) w.keyUp?.(e); });
  on(window, 'blur', () => held.clear());
  // mouse: click to look around (the pointer locks to the view; Esc lets it go and pauses);
  // if the browser won't lock it, drag to look instead
  on(canvas, 'click', () => {
    if (g.mode() !== 'play' || touchy || locked || !canvas.requestPointerLock || g.ways().some(w => w.keepsMouse?.())) return;
    try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch {}
  });
  on(document, 'pointerlockchange', () => {
    const was = locked; locked = document.pointerLockElement === canvas;
    if (was && !locked && g.mode() === 'play') g.pause();
    if (was && !locked && g.mode() === 'arcade') g.game().stepBack();   // Esc, while the mouse was locked
  });
  on(window, 'mousemove', e => {
    if (locked && g.mode() === 'play') turn(e.movementX * 0.0024, e.movementY * 0.0024);
    for (const w of g.ways()) w.mouse?.(e);
  });
  // where on the screen a press is, as a line out into the place (for a game that takes presses)
  const ndc = new Vector3();
  function pointAt(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1, 0.5).unproject(cam);
    return { origin: cam.position.clone(), dir: ndc.clone().sub(cam.position).normalize() };
  }
  function middle() { ndc.set(0, 0, 0.5).unproject(cam); return { origin: cam.position.clone(), dir: ndc.clone().sub(cam.position).normalize() }; }
  on(canvas, 'pointerdown', e => {
    if (g.mode() === 'arcade') { g.game().press(e); return; }
    if (g.mode() !== 'play') return;
    // the thumb stick stays in its corner, and only a touch that starts on it (or just round it) walks;
    // anywhere else, a way of playing can take the press (painting), or dragging looks around
    const sr = $('#stick').getBoundingClientRect(), cx = sr.left + sr.width / 2, cy = sr.top + sr.height / 2;
    if (e.pointerType === 'touch' && touchy && stick.id === null && Math.hypot(e.clientX - cx, e.clientY - cy) < sr.width * 0.75) {
      Object.assign(stick, { id: e.pointerId, x0: cx, y0: cy, x: 0, y: 0 });
    } else if (g.ways().some(w => w.press?.(e))) return;
    else if (drag.id === null && !locked) Object.assign(drag, { id: e.pointerId, x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  on(canvas, 'pointermove', e => {
    g.paint().move(e);
    if (e.pointerId === stick.id) {
      // the knob follows your thumb to the stick's edge (and no further); full speed at the edge
      const dx = e.clientX - stick.x0, dy = e.clientY - stick.y0, m = Math.hypot(dx, dy), k = m > STICK ? STICK / m : 1;
      stick.x = dx * k / STICK; stick.y = dy * k / STICK;
      $('#stick i').style.transform = `translate(${dx * k}px,${dy * k}px)`;
    } else if (g.game().move(e)) {
      // (playing a game in its room: it took it)
    } else if (e.pointerId === drag.id && g.mode() === 'play') {
      const k = (e.pointerType === 'touch' ? 4.2 : 3.2) / Math.max(canvas.clientWidth, 400);
      turn((e.clientX - drag.x) * k, (e.clientY - drag.y) * k * (e.pointerType === 'touch' ? 0.6 : 1)); drag.x = e.clientX; drag.y = e.clientY;
    }
  });
  const letGo = e => {
    if (e.pointerId === stick.id) { stick.id = null; stick.x = stick.y = 0; $('#stick i').style.transform = ''; }
    if (e.pointerId === drag.id) drag.id = null;
    for (const w of g.ways()) w.letGo?.(e);
  };
  on(canvas, 'pointerup', letGo); on(canvas, 'pointercancel', letGo);
  if (touchy) { $('#keysHint').hidden = true; $('#stick').hidden = false; }
  return { held, stick, drag, KEYS, pointAt, middle, locked: () => locked };
}
