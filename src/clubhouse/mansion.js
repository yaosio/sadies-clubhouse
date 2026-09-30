// Sadie's mansion: the clubhouse you walk around. You start at the front gate (the first time, Sadie's
// letter invites you in), walk through the front door into the entrance hall (the bottom of the cat
// tree), up the stairs to the landing where every activity has its door, and into its room, where
// you play it at the computer.
//
// Every place (outside, the hall, each activity's room) is its own separate scene, joined only by
// doorways. There are no loading screens: an open doorway shows the place on its other side (drawn
// from where you'd be standing if you'd already walked through), and walking through it just moves
// you there. Only the place you're in, and through the open doorways in front of you (the nearest
// three: two doors on the landing can be open at once), get drawn.
//
// Controls are a normal game's: WASD or the arrows and the mouse (click to look around), a thumb
// stick and dragging on a phone. E (or the button on a phone) uses what you're looking at. Esc or the
// pause button pauses; in the test version the pause menu can also start things over.
//
// Starting an activity takes the whole mansion out of the page before the activity goes in. When
// you come back (the page reloads), you're standing at that activity's computer.
//
// Some games live in their room instead of on a computer (Brickbuster '96): their card has a `room`
// that builds the whole room from the kit handed to it here, and something in it you can play (a
// use with `play`). Using it eases your view back until the whole game fits the screen, then the
// controls go to the game (steering with the keys, nudging with the mouse or a finger) until you
// step back.
import {
  WebGLRenderer, PerspectiveCamera, WebGLRenderTarget, NearestFilter, Matrix4, Vector3, Vector4, Plane, LinearSRGBColorSpace,
} from 'three';
import { res, light, drawTextures, disposeLook, loadImage, psx, keep, tex, words, C, picture, doorBack } from './look.js';
import { buildOutside } from './outside.js';
import { buildHall } from './hall.js';
import { buildRoom } from './room.js';
import { kit, wallGeometry, doorway } from './build.js';
import { store } from '../shared/storage.js';
import P from './pictures.js';
import page from './mansion.html';
import styles from './mansion.css';

const EYE = 1.6, SPEED = 3.2, TURN = 2.2, STICK = 40;   // STICK: how far the thumb stick's knob goes, in screen pixels
// things that happen once, remembered in the browser (the test version can undo each)
const INVITED = 'mansion.invited';
const BACK = 'mansion.back';          // which activity you left for (kept only until the page comes back)

export async function open(cards, enter) {
  const style = document.createElement('style');
  style.textContent = styles;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML('afterbegin', page);
  const root = document.getElementById('mansion');
  const $ = s => root.querySelector(s);
  const off = new AbortController(), on = (el, ev, fn, o) => el.addEventListener(ev, fn, { signal: off.signal, ...o });
  const testVersion = !!root.querySelector('#testBadge');
  const touchy = matchMedia('(pointer: coarse)').matches;

  // ---------- the places, and the doorways between them ----------
  try { await Promise.race([document.fonts.load('8px Silkscreen'), new Promise(ok => setTimeout(ok, 1500))]); } catch {}
  const load = src => src ? loadImage(src) : null;
  const [awake, asleep, boxes, doorPics] = await Promise.all([load(P.sadie), load(P.sadieBlink),
    Promise.all(cards.map(c => load(c.box?.front))), Promise.all(cards.map(c => load(c.door)))]);
  const T = drawTextures(awake, asleep);
  const outside = buildOutside(T), hall = buildHall(T, cards, doorPics);
  // a game that lives in its room builds the room itself, from the mansion's building kit
  const rooms = await Promise.all(cards.map(async (c, i) => {
    if (!c.room) return buildRoom(T, c, boxes[i], doorPics[i]);
    const leaf = doorPics[i] ? { front: doorBack(doorPics[i]), back: picture(doorPics[i]) } : T.leafL;
    return (await c.room()).buildRoom({ T, C, psx, keep, tex, words, picture, loadImage, kit, wallGeometry, doorway, card: c, leaf,
      doorImage: doorPics[i], landingDoor: hall.doors[c.id], hall });
  }));
  const portals = [{ a: outside.doors.front, wa: outside, b: hall.doors.front, wb: hall, open: 0 }];
  for (const r of rooms) if (hall.doors[r.card.id]) portals.push({ a: hall.doors[r.card.id], wa: hall, b: r.doors.door, wb: r, open: 0 });
  // each doorway seen from its own side: where it is, and where it leads
  for (const p of portals) p.b.swing = -1;   // every door swings into the place further in
  const sides = portals.flatMap(p => [{ d: p.a, w: p.wa, to: p.b, tw: p.wb, p }, { d: p.b, w: p.wb, to: p.a, tw: p.wa, p }]);
  const places = [outside, hall, ...rooms];

  const canvas = $('#view');
  const renderer = new WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = LinearSRGBColorSpace;
  // a picture per open doorway in view (the nearest few): each doorway shows its own
  const throughs = [0, 1, 2].map(() => new WebGLRenderTarget(320, 240, { minFilter: NearestFilter, magFilter: NearestFilter }));
  const cam = new PerspectiveCamera(70, 1, 0.1, 300);   // not too near: phones' depth is coarse
  cam.rotation.order = 'YXZ';   // turn round the upright first, then look up or down: the view never tips over
  const vcam = new PerspectiveCamera(); vcam.matrixAutoUpdate = false; vcam.matrixWorldAutoUpdate = false;

  let drawnAt = '';
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const k = Math.max(1, Math.floor(Math.min(w, h) / 220));   // big chunky pixels, never under 220 across
    const iw = Math.ceil(w / k), ih = Math.ceil(h / k);
    if (drawnAt === iw + 'x' + ih) return;                      // resizing wipes the picture: only when it really changed
    drawnAt = iw + 'x' + ih;
    renderer.setSize(iw, ih, false); for (const t of throughs) t.setSize(iw, ih); res.set(iw, ih);
    cam.aspect = iw / ih;
    // a wide view on a wide screen; on a tall phone, not so tall that the walls lean when you look up or down
    cam.fov = Math.min(68, Math.max(55, 2 * Math.atan(Math.tan(80 * Math.PI / 360) / cam.aspect) * 180 / Math.PI));
    cam.updateProjectionMatrix();
    draw();
  }

  // ---------- you ----------
  const me = { world: outside, x: 0, y: 0, z: 0, yaw: 0, pitch: 0, eye: 0, bob: 0 };
  function place(world, spot) {
    me.world = world; me.x = spot.x; me.z = spot.z; me.yaw = spot.yaw; me.pitch = spot.pitch || 0;
    me.y = me.eye = spot.y ?? world.floor(spot.x, spot.z, 0) ?? 0;
  }
  let back = null;
  try { back = sessionStorage.getItem(BACK); sessionStorage.removeItem(BACK); } catch {}
  const backRoom = rooms.find(r => r.card.id === back);
  if (backRoom) place(backRoom, backRoom.spots.computer); else place(outside, outside.spots.start);

  // where you can stand: the place's own floor, or the threshold of an open doorway in it
  function floorAt(w, x, z, y) {
    for (const s of sides) if (s.w === w && s.p.open > 0.3 && Math.abs(y - s.d.pos.y) < 0.6) {
      const [lx, lz] = s.d.local(x, z);
      if (Math.abs(lx) < s.d.w / 2 - 0.3 && lz > -0.6 && lz < 0.8) return s.d.pos.y;
    }
    return w.floor(x, z, y);
  }
  // Walking: straight there if you can, else sliding along whatever's in the way. Crossing an open
  // doorway takes you to the same spot on its other side, turned round, in the other place.
  function move(dx, dz) {
    for (const [mx, mz] of [[dx, dz], [dx, 0], [0, dz]]) {
      if (!mx && !mz) continue;
      const nx = me.x + mx, nz = me.z + mz;
      for (const s of sides) if (s.w === me.world && s.p.open > 0.6 && Math.abs(me.y - s.d.pos.y) < 0.6) {
        const [, z0] = s.d.local(me.x, me.z), [lx, lz] = s.d.local(nx, nz);
        if (z0 >= 0 && lz < 0 && Math.abs(lx) < s.d.w / 2) { cross(s, lx, lz); return true; }
      }
      const h = floorAt(me.world, nx, nz, me.y);
      if (h !== null) { me.x = nx; me.z = nz; me.y = h; return true; }
    }
    return false;
  }
  let lastThrough = null;   // the doorway you walked through last
  function cross(s, lx, lz) {
    lastThrough = s.p;
    const t = s.to, c = Math.cos(t.yaw), sn = Math.sin(t.yaw), bx = -lx, bz = -lz;
    me.x = t.pos.x + bx * c + bz * sn; me.z = t.pos.z - bx * sn + bz * c;
    const rise = t.pos.y - s.d.pos.y;
    me.y += rise; me.eye += rise;
    me.yaw += t.yaw + Math.PI - s.d.yaw;
    me.world = s.tw;
  }

  // ---------- the camera through a doorway ----------
  // The place beyond is drawn from where you'd be if you'd already walked through, with everything
  // on the near side of its doorway cut away (the near plane tilted to lie in the doorway).
  const Fa = new Matrix4(), Fb = new Matrix4(), M = new Matrix4(), FLIP = new Matrix4().makeRotationY(Math.PI);
  const cut = new Plane(), clip = new Vector4(), q = new Vector4(), tmp = new Vector3();
  function lookThrough(s) {
    Fa.makeRotationY(s.d.yaw).setPosition(s.d.pos); Fb.makeRotationY(s.to.yaw).setPosition(s.to.pos);
    M.multiplyMatrices(Fb, FLIP).multiply(Fa.invert());
    vcam.matrixWorld.multiplyMatrices(M, cam.matrixWorld);
    vcam.matrixWorldInverse.copy(vcam.matrixWorld).invert();
    vcam.projectionMatrix.copy(cam.projectionMatrix);
    vcam.projectionMatrixInverse.copy(cam.projectionMatrixInverse);
    // Right at the doorway the tilted near plane would pass through your eye, and the maths falls
    // apart (a frame of black as you step through). So within 40 cm, don't tilt it: the far side's
    // own door bits are hidden anyway, and nothing else of that place is that close behind its wall.
    if (tmp.copy(cam.position).sub(s.d.pos).dot(s.d.normal) < 0.4) return;
    cut.setFromNormalAndCoplanarPoint(s.to.normal, tmp.copy(s.to.pos).addScaledVector(s.to.normal, -0.01));
    cut.applyMatrix4(vcam.matrixWorldInverse);
    clip.set(cut.normal.x, cut.normal.y, cut.normal.z, cut.constant);
    const e = vcam.projectionMatrix.elements;
    q.set((Math.sign(clip.x) + e[8]) / e[0], (Math.sign(clip.y) + e[9]) / e[5], -1, (1 + e[10]) / e[14]);
    clip.multiplyScalar(2 / clip.dot(q));
    e[2] = clip.x; e[6] = clip.y; e[10] = clip.z + 1; e[14] = clip.w;
    vcam.projectionMatrixInverse.copy(vcam.projectionMatrix).invert();
  }

  // the doorway you're walking up to: in this place, close, in front of you and roughly ahead
  function doorAhead() {
    let best = null, near = 1e9;
    const fx = -Math.sin(me.yaw), fz = -Math.cos(me.yaw);
    for (const s of sides) if (s.w === me.world && Math.abs(me.y - s.d.pos.y) < 1.5) {
      const [lx, lz] = s.d.local(me.x, me.z);
      if (lz < -0.6 || lz > 3.4 || Math.abs(lx) > 2.4) continue;
      // not facing it (and not in it, and not just through it: then it waits till you're out of its swing)
      if (lz > (s.p === lastThrough ? 2.4 : 0.8) && -(fx * s.d.normal.x + fz * s.d.normal.z) < 0.25) continue;
      const d = Math.hypot(lx, lz); if (d < near) { near = d; best = s; }
    }
    return best;
  }

  let viewing = null;   // the nearest doorway being looked through this frame
  function draw() {
    cam.position.set(me.x, me.eye + EYE + Math.sin(me.bob) * 0.03, me.z);
    // exactly on a doorway's line (to a tenth of a millimetre) the drawing maths has nothing to work
    // with, so draw from that far off it: far too little to see
    for (const s of sides) if (s.w === me.world) {
      const [lx, lz] = s.d.local(cam.position.x, cam.position.z);
      if (Math.abs(lx) < s.d.w / 2 + 0.5 && Math.abs(lz) < 1e-4) cam.position.addScaledVector(s.d.normal, (lz < 0 ? -1e-4 : 1e-4) - lz);
    }
    cam.rotation.set(me.pitch, me.yaw, 0);
    cam.updateMatrixWorld();
    for (const f of me.world.faces) f.rotation.y = Math.atan2(cam.position.x - f.position.x, cam.position.z - f.position.z);
    // each open doorway you're in front of (the nearest few) shows its other side, in its own picture
    const open = [];
    for (const s of sides) if (s.w === me.world && s.p.open > 0.02) {
      tmp.copy(cam.position).sub(s.d.pos);
      if (tmp.dot(s.d.normal) < -0.05) continue;
      const d = tmp.length(); if (d < 25) open.push([d, s]);
    }
    open.sort((a, b) => a[0] - b[0]);
    viewing = open.length ? open[0][1] : null;
    open.slice(0, throughs.length).forEach(([, s], i) => {
      lookThrough(s);
      light(s.tw.light);
      s.to.group.visible = false;   // the far side's frame, leaves and doorway box: never seen from behind
      renderer.setRenderTarget(throughs[i]); renderer.render(s.tw.scene, vcam); renderer.setRenderTarget(null);
      s.to.group.visible = true;
      s.d.see.material.uniforms.pic.value = throughs[i].texture;
      s.d.see.material.uniforms.uOn.value = 1;
    });
    light(me.world.light);
    renderer.render(me.world.scene, cam);
  }

  // ---------- controls ----------
  let mode = 'play';           // 'letter', 'play', 'menu', 'going' (into an activity), 'arcade' (playing a game in its room) or 'gliding' (stepping up to one or back)
  const held = new Set();
  const stick = { id: null, x0: 0, y0: 0, x: 0, y: 0 }, drag = { id: null, x: 0, y: 0 };
  let locked = false, moved = false;
  function turn(dx, dy) { if (me.world.watch) return; me.yaw -= dx; me.pitch = Math.max(-0.75, Math.min(0.75, me.pitch - dy)); }
  // held keys that steer a game you're playing in its room: -1 left, 1 right
  const steering = () => (held.has('r') || held.has('tr') ? 1 : 0) - (held.has('l') || held.has('tl') ? 1 : 0);
  const KEYS = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyD: 'r', ArrowLeft: 'tl', ArrowRight: 'tr' };
  on(window, 'keydown', e => {
    if (e.code === 'Escape' || e.key === 'Escape') { e.preventDefault(); if (mode === 'menu') resume(); else if (mode === 'play') pause(); else if (mode === 'arcade') stepBack(); return; }
    if (mode === 'arcade') {
      const k = KEYS[e.code];
      if (k === 'f' || k === 'b') { e.preventDefault(); stepBack(); } else if (k) { e.preventDefault(); held.add(k); }
      return;
    }
    if (mode === 'letter' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); closeLetter(); return; }
    if (mode !== 'play') return;
    const k = KEYS[e.code];
    if (k) { e.preventDefault(); held.add(k); return; }
    if (e.code === 'KeyE' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (target) use(target); }
  });
  on(window, 'keyup', e => { const k = KEYS[e.code]; if (k) held.delete(k); });
  on(window, 'blur', () => held.clear());
  // mouse: click to look around (the pointer locks to the view; Esc lets it go and pauses);
  // if the browser won't lock it, drag to look instead
  on(canvas, 'click', () => {
    if (mode !== 'play' || touchy || locked || !canvas.requestPointerLock) return;
    try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch {}
  });
  on(document, 'pointerlockchange', () => {
    const was = locked; locked = document.pointerLockElement === canvas;
    if (was && !locked && mode === 'play') pause();
    if (was && !locked && mode === 'arcade') stepBack();   // Esc, while the mouse was locked
  });
  on(window, 'mousemove', e => {
    if (locked && mode === 'play') turn(e.movementX * 0.0024, e.movementY * 0.0024);
    if (locked && mode === 'arcade') arcade.u.play.nudge(e.movementX * arcade.mpp);
  });
  on(canvas, 'pointerdown', e => {
    if (mode === 'arcade' && drag.id === null) { Object.assign(drag, { id: e.pointerId, x: e.clientX, y: e.clientY }); try { canvas.setPointerCapture(e.pointerId); } catch {} return; }
    if (mode !== 'play') return;
    // the thumb stick stays in its corner, and only a touch that starts on it (or just round it) walks;
    // anywhere else, dragging looks around
    const sr = $('#stick').getBoundingClientRect(), cx = sr.left + sr.width / 2, cy = sr.top + sr.height / 2;
    if (e.pointerType === 'touch' && touchy && stick.id === null && Math.hypot(e.clientX - cx, e.clientY - cy) < sr.width * 0.75) {
      Object.assign(stick, { id: e.pointerId, x0: cx, y0: cy, x: 0, y: 0 });
    } else if (drag.id === null && !locked) Object.assign(drag, { id: e.pointerId, x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  on(canvas, 'pointermove', e => {
    if (e.pointerId === stick.id) {
      // the knob follows your thumb to the stick's edge (and no further); full speed at the edge
      const dx = e.clientX - stick.x0, dy = e.clientY - stick.y0, m = Math.hypot(dx, dy), k = m > STICK ? STICK / m : 1;
      stick.x = dx * k / STICK; stick.y = dy * k / STICK;
      $('#stick i').style.transform = `translate(${dx * k}px,${dy * k}px)`;
    } else if (mode === 'arcade') {
      // playing a game in its room: the mouse (just moving it) or a finger (sliding it) moves along
      // with the game, as far on the screen as you moved
      if (e.pointerType === 'mouse' && !locked) arcade.u.play.nudge(e.movementX * arcade.mpp);
      else if (e.pointerId === drag.id) { arcade.u.play.nudge((e.clientX - drag.x) * arcade.mpp); drag.x = e.clientX; drag.y = e.clientY; }
    } else if (e.pointerId === drag.id && mode === 'play') {
      const k = (e.pointerType === 'touch' ? 4.2 : 3.2) / Math.max(canvas.clientWidth, 400);
      turn((e.clientX - drag.x) * k, (e.clientY - drag.y) * k * (e.pointerType === 'touch' ? 0.6 : 1)); drag.x = e.clientX; drag.y = e.clientY;
    }
  });
  const letGo = e => {
    if (e.pointerId === stick.id) { stick.id = null; stick.x = stick.y = 0; $('#stick i').style.transform = ''; }
    if (e.pointerId === drag.id) drag.id = null;
  };
  on(canvas, 'pointerup', letGo); on(canvas, 'pointercancel', letGo);
  if (touchy) { $('#keysHint').hidden = true; $('#stick').hidden = false; }

  // ---------- using things: the computer in an activity's room ----------
  let target = null;
  const fwd = new Vector3();
  function findTarget() {
    cam.getWorldDirection(fwd);
    for (const u of me.world.uses) {
      tmp.copy(u.pos).sub(cam.position); const d = tmp.length();
      if (d < u.reach && tmp.normalize().dot(fwd) > 0.7) return u;
    }
    return null;
  }
  function showTarget() {
    const hint = $('#useHint'), btn = $('#use'), inGame = mode === 'arcade';
    hint.hidden = !target || touchy || mode !== 'play';
    btn.hidden = !((target && mode === 'play') || inGame) || !touchy;
    $('#arcadeHint').hidden = !inGame;
    $('#stick').hidden = !touchy || inGame;
    if (inGame) $('#keysHint').hidden = true;
    if (inGame) btn.textContent = 'STEP BACK';
    else if (target) { hint.querySelector('span').textContent = target.label; btn.textContent = 'PLAY'; }
  }
  on($('#use'), 'click', () => { if (mode === 'arcade') stepBack(); else if (target && mode === 'play') use(target); });
  // Sit down at the computer: you lean in until the screen fills the view, then the program starts.
  let going = null;
  function use(u) {
    if (u.play) { stepUp(u); return; }
    mode = 'going'; held.clear(); showTarget();
    if (document.pointerLockElement) document.exitPointerLock();
    const d = tmp.copy(u.pos).sub(cam.position);
    going = { u, t: 0, from: { x: me.x, z: me.z, eye: me.eye, yaw: me.yaw, pitch: me.pitch },
      yaw: Math.atan2(-d.x, -d.z), pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
  }
  function lean(dt) {
    going.t += dt / 0.9;
    const k = Math.min(1, going.t), e = k * k * (3 - 2 * k), f = going.from, u = going.u;
    const tx = u.pos.x - Math.sin(going.yaw) * -0.32, tz = u.pos.z - Math.cos(going.yaw) * -0.32;   // just in front of the screen
    me.x = f.x + (tx - f.x) * e; me.z = f.z + (tz - f.z) * e;
    me.eye = f.eye + (u.pos.y - EYE - f.eye) * e;
    const dy = going.yaw - f.yaw; me.yaw = f.yaw + Math.atan2(Math.sin(dy), Math.cos(dy)) * e; me.pitch = f.pitch + (0 - f.pitch) * e;
    if (going.t >= 1 && !going.done) {
      going.done = true; $('#flash').hidden = false;
      try { sessionStorage.setItem(BACK, u.card.id); } catch {}
      setTimeout(() => { close(); enter(u.card); }, 120);
    }
  }

  // ---------- playing a game that lives in its room ----------
  // Stepping up: your view eases back (and up) until the whole game fits the screen, looking at it
  // square on. Stepping back: back to where you stood. The game is told when to start and stop.
  let arcade = null, glide = null;
  const TILT = 0.12;   // the view looks up at it a little, from a bit below its middle
  function arcadeView(u) {
    const v = u.play.view, tv = Math.tan(cam.fov * Math.PI / 360), th = tv * cam.aspect;
    const dist = Math.max(v.h / 2 / tv, v.w / 2 / th) * 1.04;
    const x = v.center.x + v.normal.x * dist * Math.cos(TILT), z = v.center.z + v.normal.z * dist * Math.cos(TILT);
    // metres along the game per pixel on the screen, so things move exactly as far as your finger
    if (arcade) arcade.mpp = 2 * dist * th / Math.max(1, canvas.clientWidth);
    return { x, z, eye: v.center.y - dist * Math.sin(TILT) - EYE, yaw: Math.atan2(v.normal.x, v.normal.z), pitch: TILT };
  }
  function stepUp(u) {
    held.clear();
    arcade = { u, from: { x: me.x, z: me.z, eye: me.eye, yaw: me.yaw, pitch: me.pitch }, mpp: 0.01 };
    u.play.start();   // now, while the key or the tap is still going on: browsers allow sound only then
    glideTo(arcadeView(u), 0.8, () => { mode = 'arcade'; showTarget(); });
  }
  function stepBack() {
    if (!arcade) return;
    arcade.u.play.stop(); held.clear(); drag.id = null;
    if (document.pointerLockElement) document.exitPointerLock();
    // back where you stood, or (the game's over) where it says to watch from; on the floor either way
    const after = arcade.u.play.over && arcade.u.play.after;
    const back = after ? { ...after, eye: me.y } : arcade.from;
    glideTo(back, 0.6, () => { arcade = null; mode = 'play'; showTarget(); });
  }
  function glideTo(to, secs, then) {
    mode = 'gliding'; showTarget();
    glide = { from: { x: me.x, z: me.z, eye: me.eye, yaw: me.yaw, pitch: me.pitch }, to, t: 0, secs, then };
  }
  function glideOn(dt) {
    glide.t += dt / glide.secs;
    const k = Math.min(1, glide.t), e = k * k * (3 - 2 * k), f = glide.from, to = glide.to;
    me.x = f.x + (to.x - f.x) * e; me.z = f.z + (to.z - f.z) * e; me.eye = f.eye + (to.eye - f.eye) * e;
    const dy = to.yaw - f.yaw; me.yaw = f.yaw + Math.atan2(Math.sin(dy), Math.cos(dy)) * e; me.pitch = f.pitch + (to.pitch - f.pitch) * e;
    if (k >= 1) { const then = glide.then; glide = null; then(); }
  }

  // ---------- Sadie's letter (the first time only), and the pause menu ----------
  function closeLetter() { store.set(INVITED, true); $('#letter').hidden = true; mode = 'play'; }
  on($('#ok'), 'click', closeLetter);
  if (!store.get(INVITED, false) && !backRoom) {
    mode = 'letter'; $('#letter').hidden = false;
    document.fonts.load('17px "Patrick Hand"').catch(() => {}).finally(() => drawLetter($('#letterArt')));
    drawLetter($('#letterArt'));
  }
  function pause() {
    if (mode === 'arcade') arcade.u.play.stop();
    mode = 'menu'; held.clear(); $('#menu').hidden = false; showTarget();
    if (document.pointerLockElement) document.exitPointerLock();
  }
  function resume() {
    $('#menu').hidden = true;
    if (arcade) { mode = 'arcade'; arcade.u.play.start(); } else mode = 'play';
    showTarget();
  }
  on($('#pause'), 'click', e => { e.stopPropagation(); if (mode === 'play' || mode === 'arcade') pause(); });
  on($('#resume'), 'click', resume);
  $('#how').innerHTML = touchy ? 'LEFT THUMB: WALK<br>RIGHT THUMB: LOOK AROUND<br>WALK INTO A DOOR TO GO IN'
    : 'W A S D: WALK &middot; ARROWS: WALK AND TURN<br>CLICK, THEN MOUSE: LOOK AROUND<br>E: USE &middot; ESC: PAUSE';
  $('#arcadeHint').innerHTML = touchy ? 'SLIDE A FINGER TO MOVE' : '<kbd>A D</kbd> OR <kbd>MOUSE</kbd> MOVE &nbsp; <kbd>ESC</kbd> STEP BACK';
  // The test version can start things over: everything at once, or one thing at a time.
  if (testVersion) {
    $('#dev').hidden = false;
    const resets = [
      ['EVERYTHING', () => { try { localStorage.clear(); sessionStorage.clear(); } catch {} }],
      ["SADIE'S INVITATION", () => store.remove(INVITED)],
      ...cards.filter(c => c.keeps).map(c => [c.name.toUpperCase(), () => forget(c.keeps)]),
    ];
    for (const [name, undo] of resets) {
      const b = document.createElement('button'); b.textContent = name;
      on(b, 'click', () => { undo(); location.reload(); });
      $('#resets').appendChild(b);
    }
  }
  function forget(prefixes) {
    try { for (const k of Object.keys(localStorage)) if (prefixes.some(p => k.startsWith(p))) localStorage.removeItem(k); } catch {}
  }

  // ---------- the loop ----------
  let raf = 0, last = performance.now(), frames = 0, blinkAt = 3, blinkOff = 0, hintGone = false;
  const born = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
    resize();
    if (mode === 'play' && me.world.watch) {
      // something in this place everyone has to watch (Brickbuster's yarn ball getting out): your
      // view follows it, and you can't walk or look away until it's gone
      const w = me.world.watch, dx = w.x - me.x, dz = w.z - me.z, dy = w.y - (me.eye + EYE);
      const yaw = Math.atan2(-dx, -dz), pitch = Math.max(-0.95, Math.min(0.95, Math.atan2(dy, Math.hypot(dx, dz))));   // (a bit further up or down than you can look yourself)
      const k = Math.min(1, dt * 10), dyaw = yaw - me.yaw;
      me.yaw += Math.atan2(Math.sin(dyaw), Math.cos(dyaw)) * k; me.pitch += (pitch - me.pitch) * k;
      me.bob *= 0.85;
    } else if (mode === 'play') {
      const tr = (held.has('tl') ? 1 : 0) - (held.has('tr') ? 1 : 0);
      me.yaw += tr * TURN * dt;
      let f = (held.has('f') ? 1 : 0) - (held.has('b') ? 1 : 0) - stick.y, st = (held.has('r') ? 1 : 0) - (held.has('l') ? 1 : 0) + stick.x;
      const m = Math.hypot(f, st); if (m > 1) { f /= m; st /= m; }
      let walked = false;
      if (m > 0.05) {
        const sy = Math.sin(me.yaw), cy = Math.cos(me.yaw);
        walked = move((-sy * f + cy * st) * SPEED * dt, (-cy * f - sy * st) * SPEED * dt);
        if (walked) moved = true;
      }
      me.bob = walked ? me.bob + dt * 10 : me.bob * 0.85;
      // walking with the thumb stick, your gaze drifts back to level (like any phone game)
      if (walked && stick.id !== null && drag.id === null) me.pitch *= Math.max(0, 1 - dt * 1.5);
    } else if (mode === 'going') lean(dt);
    else if (mode === 'gliding') glideOn(dt);
    else if (mode === 'arcade') {
      Object.assign(me, arcadeView(arcade.u));   // (again every frame: the screen might have turned)
      arcade.u.play.steer(steering(), dt);
      if (arcade.u.play.over) stepBack();         // the game's over (Brickbuster broke): step back and watch
    }
    if (mode !== 'going' && !arcade) me.eye += (me.y - me.eye) * Math.min(1, dt * 12);   // smooth over steps
    if (!hintGone && ((moved && now - born > 4000) || now - born > 15000)) { hintGone = true; $('#keysHint').style.opacity = 0; }
    // a door opens as you come up to it facing it (only one at a time), and closes behind you
    const opening = doorAhead();
    for (const p of portals) {
      // (or while something in the place on either side holds it open: an escaping yarn ball)
      const want = opening?.p === p || p.wa.holding === p.a || p.wb.holding === p.b;
      p.open += ((want ? 1 : 0) - p.open) * Math.min(1, dt * 5);
      p.a.setOpen(p.open); p.b.setOpen(p.open);
    }
    for (const w of places) w.update(t, dt);
    // Sadie on the gatepost blinks now and then
    if (t > blinkAt) { outside.sadie.material.uniforms.map.value = T.nap; blinkOff = t + 0.15; blinkAt = t + 2.5 + Math.random() * 3; }
    if (blinkOff && t > blinkOff) { outside.sadie.material.uniforms.map.value = T.sadie; blinkOff = 0; }
    draw();
    const was = target; target = mode === 'play' ? findTarget() : null;   // (nothing to use while playing a game in its room)
    if (was !== target) showTarget();
    frames++;
    raf = requestAnimationFrame(frame);
  }

  function close() {
    cancelAnimationFrame(raf); off.abort();
    if (document.pointerLockElement) document.exitPointerLock();
    for (const t of throughs) t.dispose(); disposeLook(); renderer.dispose(); renderer.forceContextLoss();
    root.remove(); style.remove();
    delete window.__mansion;
  }

  // for the checks (tests/clubhouse/browser.mjs): where you are, and a way to stand somewhere
  window.__mansion = {
    frames: () => frames,
    mode: () => mode,
    where: () => ({ place: me.world.name, x: me.x, y: me.y, z: me.z, yaw: me.yaw }),
    target: () => target?.label || null,
    looking: () => viewing ? viewing.tw.name : null,
    // how many doorways are showing what's through them right now (not black)
    showing: () => sides.filter(s => s.w === me.world && s.d.see.material.uniforms.uOn.value > 0.5).length,
    // hold a doorway open, as if something were going through it (null to let it go)
    holdOpen(name, door) { const w = places.find(p => p.name === name); if (w) w.holding = door ? w.doors[door] : null; },
    places: () => places.map(p => p.name),
    // stand at one of a place's spots (or at {x, z, yaw, y}), and look straight ahead
    put(name, spot) {
      const w = places.find(p => p.name === name); if (!w) return false;
      place(w, typeof spot === 'string' ? w.spots[spot] : spot); return true;
    },
    turnTo(yaw, pitch = 0) { me.yaw = yaw; me.pitch = pitch; },
    // take a step of d metres straight ahead (through a doorway, if there's one there), and draw
    step(d) { const r = move(-Math.sin(me.yaw) * d, -Math.cos(me.yaw) * d); draw(); return r; },
    // how far the view leans over sideways (0: not at all), and how open the last doorway walked through is
    tilt: () => Math.abs(new Vector3(1, 0, 0).applyQuaternion(cam.quaternion).y),
    lastDoorOpen: () => lastThrough ? lastThrough.open : null,
    doorAt: (name, door) => { const d = places.find(p => p.name === name)?.doors[door]; return d && { x: d.pos.x, z: d.pos.z }; },
    // stand in front of a doorway in this place, facing it (d metres out)
    faceDoor(name, door, d = 2) {
      const w = places.find(p => p.name === name), dd = w?.doors[door]; if (!dd) return false;
      place(w, { x: dd.pos.x + dd.normal.x * d, z: dd.pos.z + dd.normal.z * d, y: dd.pos.y, yaw: dd.yaw, pitch: 0 }); return true;
    },
  };

  resize();
  raf = requestAnimationFrame(frame);
}

// Sadie's letter: handwriting in hard pixels, big and bold enough to read easily.
function drawLetter(c) {
  const g = c.getContext('2d'), W = c.width, H = c.height;
  const px = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  px('#6a3a88', 0, 0, W, H); px('#fff4e4', 1, 1, W - 2, H - 2);
  for (let x = 3; x < W - 3; x++) { px(x % 6 < 3 ? '#ff8ec8' : '#8ad8ff', x, 3); px(x % 6 < 3 ? '#ff8ec8' : '#8ad8ff', x, H - 4); }
  for (let y = 26; y < H - 16; y += 26) for (let x = 14; x < W - 14; x += 2) px('#dccff4', x, y + 22);
  const t = document.createElement('canvas'); t.width = W; t.height = H; const k = t.getContext('2d');
  // written twice, a hair apart, so the strokes are thick enough to survive being made into pixels
  const write = (text, x, y) => { k.fillText(text, x, y); k.fillText(text, x + 0.7, y); k.fillText(text, x, y + 0.5); };
  k.font = '25px "Patrick Hand", "Comic Sans MS", "Trebuchet MS", sans-serif'; k.fillStyle = '#000'; k.textBaseline = 'top';
  ['Dear friend,', 'I have decided to share my', 'clubhouse with all my friends.', 'You are invited.', 'Come in. Wipe your paws.', 'Do not sit in my chair.']
    .forEach((l, i) => write(l, 18, 20 + i * 26));
  k.font = '32px "Patrick Hand", "Comic Sans MS", "Trebuchet MS", sans-serif'; write('Sadie', W - 130, 16 + 6 * 26);
  const d = k.getImageData(0, 0, W, H);
  for (let i = 0; i < d.data.length; i += 4) { const on = d.data[i + 3] > 80; d.data[i] = 42; d.data[i + 1] = 26; d.data[i + 2] = 110; d.data[i + 3] = on ? 255 : 0; }
  k.putImageData(d, 0, 0); g.drawImage(t, 0, 0);
  // her paw print, in pink ink, and a wax seal
  const pawX = W - 40, pawY = H - 36, pink = '#e0509a';
  px(pink, pawX, pawY + 7, 8, 6); px(pink, pawX + 1, pawY + 13, 6, 1);
  for (const [x, y] of [[-2, 3], [1, 0], [5, 0], [8, 3]]) px(pink, pawX + x, pawY + y, 3, 3);
  for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y < 40) px((x + y) % 3 ? '#e83a3a' : '#a02030', W - 20 + x, 16 + y);
  px('#ffb0b0', W - 22, 15, 4, 3);
}
