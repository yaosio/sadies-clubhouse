// The clubhouse menu: a 3D room with a cubby shelf, one software box per activity. You walk and
// look around, tap a box to go and see it (the LED board says what it is), and PLAY! starts it.
//
// Every activity with a card gets a box, in folder order; the empty cubbies are filled with
// locked "under construction" boxes and the "coming soon" card, and a second shelf on the side
// wall (MORE SHELVES) takes the activities that don't fit on the first. The box's picture and the
// board's lines come from the card (box, blurb), so adding an activity never changes this file.
//
// Starting an activity takes the whole menu out of the page (its screen, its look, its listeners,
// its 3D drawing) before the activity's own screen goes in.
import { WebGLRenderer, PerspectiveCamera, Vector2, Vector3, Raycaster, LinearSRGBColorSpace } from 'three';
import { buildRoom, RW, ZB, ZF, DEP } from './room.js';
import P from './pictures.js';
import page from './menu.html';
import styles from './menu.css';

// which shelf slot gets what: activities first, then locked boxes to finish the top row, then the
// "coming soon" card; the second shelf gets any activities left over, then locked boxes
function stock(cards) {
  const a = cards.map(card => ({ kind: 'activity', card }));
  const one = a.slice(0, 6), two = a.slice(6, 12);
  while (one.length < 3) one.push({ kind: 'locked' });
  if (one.length < 6) one.push({ kind: 'card' });
  while (two.length < 3) two.push({ kind: 'locked' });
  const pad = s => [...s, null, null, null, null, null, null].slice(0, 6);
  return [pad(one), pad(two)];
}

export function open(cards, enter) {
  const style = document.createElement('style');
  style.textContent = styles;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML('afterbegin', page);
  const root = document.getElementById('clubhouse');
  const $ = s => root.querySelector(s);
  const off = new AbortController(), on = (el, ev, fn, o) => el.addEventListener(ev, fn, { signal: off.signal, ...o });
  root.style.setProperty('--weave', `url(${P.weave})`);
  root.style.setProperty('--hand', `url(${P.hand}) 6 0`);

  // ---------- the frame: logo at a whole-number size, LED board that types ----------
  const logo = $('#logo');
  function fitLogo() {
    const narrow = innerWidth < 560;
    logo.src = narrow ? P.logo2 : P.logo;
    const w = narrow ? 82 : 150, h = narrow ? 38 : 20;
    const room = $('header').clientWidth - (narrow ? 0 : $('.tag').offsetWidth + 16);
    const k = Math.max(1, Math.min(narrow ? 3 : 4, Math.floor(room / w)));
    logo.width = w * k; logo.height = h * k;
  }
  let typing = 0;
  function say(lines) {
    const led = $('#led'); clearInterval(typing);
    led.innerHTML = lines.map((l, i) => `<div class="${i ? '' : 't'}"></div>`).join('');
    const rows = [...led.children]; let r = 0, c = 0;
    typing = setInterval(() => {
      if (r >= lines.length) return clearInterval(typing);
      rows[r].textContent = lines[r].slice(0, ++c);
      if (c >= lines[r].length) { r++; c = 0; }
    }, 14);
  }

  // ---------- the room, and you standing in it ----------
  const shelves = stock(cards);
  const room = buildRoom(shelves);
  const { scene, res, pickable } = room;
  const renderer = new WebGLRenderer({ canvas: $('#room'), antialias: false });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = LinearSRGBColorSpace;

  const EYE = 1.35;
  const cam = new PerspectiveCamera(60, 1, 0.1, 20);
  cam.position.set(0.15, EYE, -0.2); cam.rotation.order = 'YXZ';
  const look = { yaw: Math.PI, pitch: -0.2, toYaw: null, toPitch: null, drag: null, touched: false };
  const walk = { to: null, held: { f: 0, b: 0, l: 0, r: 0 }, bob: 0, moved: false };
  // where you're allowed to stand: inside the walls, not inside a shelf
  function spot(x, z) {
    x = Math.max(-RW + 0.3, Math.min(RW - 0.3, x));
    z = Math.max(ZF + 0.3, Math.min(ZB - DEP - 0.9, z));   // keep a step back from the shelves, so you can see them
    if (z > -0.5 && z < 2.9) x = Math.max(x, -RW + DEP + 0.9);
    return [x, z];
  }
  const shortWay = (from, to) => from + ((to - from) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  // which way to face to look at a spot on the floor plan (the camera looks down -z at yaw 0)
  const aim = (x, z) => Math.atan2(-(x - cam.position.x), -(z - cam.position.z));
  const SHELF1 = () => aim(-0.2, ZB), SHELF2 = () => aim(-RW, 1.2);

  let drawnAt = '';  // the drawing size last set
  function resize() {
    fitLogo();
    const v = $('#view'), w = v.clientWidth, h = v.clientHeight;
    if (!w || !h) return;
    const k = Math.max(1, Math.floor(Math.min(w, h) / 200)); // big chunky pixels, but never under 200 across
    const iw = Math.ceil(w / k), ih = Math.ceil(h / k);
    // resizing wipes the picture, so only when the size really changed, and then draw it again
    // straight away (otherwise that frame shows black)
    if (drawnAt === iw + 'x' + ih) return;
    drawnAt = iw + 'x' + ih;
    renderer.setSize(iw, ih, false); res.set(iw, ih);
    cam.aspect = iw / ih;
    const hfov = 78 * Math.PI / 180;
    cam.fov = Math.min(88, Math.max(52, 2 * Math.atan(Math.tan(hfov / 2) / cam.aspect) * 180 / Math.PI));
    const tall = cam.aspect < 0.8;                        // on a tall phone screen, start nearer the shelf
    if (!walk.moved) cam.position.set(tall ? -0.2 : 0.15, EYE, tall ? 1.55 : -0.2);
    cam.updateProjectionMatrix();
    if (!look.touched && look.toYaw === null) look.yaw = SHELF1();
    renderer.render(scene, cam);
  }
  const sizer = new ResizeObserver(resize);
  sizer.observe($('#view'));

  // ---------- picking boxes, and what the LED board says about them ----------
  const TEXT = {
    locked: () => ['UNDER CONSTRUCTION', "THIS ONE ISN'T BUILT YET.", 'CHECK BACK IN 1996!'],
    card: () => ['** CHAPTER 2 **', 'COMING SOON 1996!', 'MORE FRIENDS! MORE ACTIVITIES!'],
    sadie: () => ['SADIE', 'MOOD: UNIMPRESSED.', 'SHE WAS HERE FIRST.'],
    activity: u => [u.card.name, ...(u.card.blurb || [])],
  };
  let chosen = null, chosenAt = 0, starting = false;
  function choose(m) {
    chosen = m; chosenAt = performance.now() / 1000;
    if (m) say(TEXT[m.userData.kind](m.userData));
    $('#play').disabled = !m || m.userData.kind !== 'activity';
  }
  const ray = new Raycaster(), ndc = new Vector2();
  function pick(ev) {
    const r = $('#room').getBoundingClientRect();
    ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects([...pickable, ...room.walkable], false)[0];
    if (!hit) return;
    if (room.walkable.includes(hit.object)) walkTo(hit.point.x, hit.point.z);
    else { choose(hit.object); goSee(hit.object); }
  }
  function walkTo(x, z) { walk.to = spot(x, z); walk.moved = true; hideHint(); }
  // walk up to something and look at it (nearer on a phone)
  function goSee(m) {
    const p = m.getWorldPosition(new Vector3()), n = m.userData.normal;
    if (m.userData.kind === 'sadie') p.y += 0.2;
    const d = cam.aspect < 0.8 ? 1.05 : 1.45;
    const [x, z] = spot(p.x + n.x * d, p.z + n.z * d);
    walk.to = [x, z]; walk.moved = true;
    look.toYaw = shortWay(look.yaw, Math.atan2(-(p.x - x), -(p.z - z)));
    look.toPitch = Math.max(-0.7, Math.min(0.5, Math.atan2(p.y - EYE, Math.hypot(p.x - x, p.z - z))));
    hideHint();
  }
  function hideHint() { if (!look.touched) { look.touched = true; $('#hint').style.opacity = 0; } }
  const view = $('#view');
  on(view, 'pointerdown', e => { view.setPointerCapture(e.pointerId); look.drag = { x: e.clientX, y: e.clientY, moved: 0 }; });
  on(view, 'pointermove', e => {
    if (!look.drag) return;
    const dx = e.clientX - look.drag.x, dy = e.clientY - look.drag.y;
    look.drag.x = e.clientX; look.drag.y = e.clientY; look.drag.moved += Math.abs(dx) + Math.abs(dy);
    const k = 3.2 / Math.max(view.clientWidth, 400);
    look.yaw += dx * k; look.pitch = Math.max(-0.75, Math.min(0.55, look.pitch + dy * k));
    look.toYaw = look.toPitch = null;
    if (look.drag.moved > 6) hideHint();
  });
  on(view, 'pointerup', e => { if (look.drag && look.drag.moved < 8) pick(e); look.drag = null; });
  on(view, 'pointercancel', () => { look.drag = null; });

  // ---------- the F-keys, walking, and PLAY! ----------
  let sound = false;
  const n = cards.length;
  const actions = {
    F1: () => say(['HELP', 'TAP FLOOR: WALK. DRAG: LOOK.', 'TAP A BOX OR SADIE: GO SEE.', 'ARROWS: WALK. PGDN: NEXT SHELF.']),
    F3: () => { sound = !sound; say(['SOUND', sound ? 'SOUND: ON (THERE IS NO SOUND YET)' : 'SOUND: OFF', 'SOUNDBLASTER 16 NOT DETECTED.']); },
    F5: () => say(["SADIE'S PLAY PLACE V0.9 BETA", '(C) 1995-ISH. PLEASE COPY & SHARE!', `${n} ${n === 1 ? 'ACTIVITY' : 'ACTIVITIES'} INSIDE. MORE SOON!`]),
    PageDown: () => {
      const away = y => Math.abs(((look.yaw - y) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
      const near1 = away(SHELF1()) < away(SHELF2());
      look.toYaw = shortWay(look.yaw, near1 ? SHELF2() : SHELF1()); look.toPitch = -0.2;
      say(near1 ? ['SHELF 2 OF 2', n > 6 ? 'EVEN MORE ACTIVITIES.' : 'ALL UNDER CONSTRUCTION.', 'NEW ACTIVITIES GO HERE.'] : ['SHELF 1 OF 2', "SADIE'S FAVORITES.", 'TAP A BOX TO PICK IT.']);
    },
    Escape: () => say(['QUIT?', "THERE'S NOWHERE TO GO.", 'SADIE WOULD LIKE YOU TO STAY.']),
    Enter: () => play(),
  };
  for (const b of root.querySelectorAll('.key')) on(b, 'click', () => actions[b.dataset.k]());
  for (const b of root.querySelectorAll('#pad button')) {
    const d = b.dataset.d, set = v => { walk.held[d] = v; b.classList.toggle('down', !!v); };
    on(b, 'pointerdown', e => { e.stopPropagation(); b.setPointerCapture(e.pointerId); set(1); walk.to = null; walk.moved = true; hideHint(); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) on(b, ev, () => set(0));
  }
  const MOVE = { ArrowUp: 'f', w: 'f', W: 'f', ArrowDown: 'b', s: 'b', S: 'b', ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };
  on(window, 'keydown', e => {
    const d = MOVE[e.key];
    if (d) { e.preventDefault(); walk.held[d] = 1; walk.to = null; walk.moved = true; hideHint(); return; }
    const a = actions[e.key]; if (!a) return;
    e.preventDefault(); a();
    const b = root.querySelector(`.key[data-k="${e.key}"]`);
    if (b) { b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 120); }
  });
  on(window, 'keyup', e => { const d = MOVE[e.key]; if (d) walk.held[d] = 0; });
  on(window, 'blur', () => { for (const k in walk.held) walk.held[k] = 0; });

  // a 90s loading bar, then the menu leaves and the activity comes in
  function play() {
    if (starting || !chosen || chosen.userData.kind !== 'activity') return;
    starting = true; $('#play').disabled = true;
    const card = chosen.userData.card;
    const bar = i => 'LOADING [' + '#'.repeat(i) + '.'.repeat(12 - i) + ']';
    let i = 0; say([card.name, bar(0)]);
    const t = setInterval(() => {
      i++;
      const row = $('#led').children[1];
      if (row) row.textContent = bar(Math.min(i, 12));
      if (i < 13) return;
      clearInterval(t);
      close();
      enter(card);
    }, 90);
  }
  on($('#play'), 'click', play);

  // ---------- the loop ----------
  let raf = 0, last = performance.now(), blinkAt = 2.5, blinkOff = 0, frames = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
    if (look.toYaw !== null) {
      look.yaw += (look.toYaw - look.yaw) * Math.min(1, dt * 3);
      if (Math.abs(look.toYaw - look.yaw) < 0.002) look.toYaw = null;
    }
    if (look.toPitch !== null) {
      look.pitch += (look.toPitch - look.pitch) * Math.min(1, dt * 3);
      if (Math.abs(look.toPitch - look.pitch) < 0.002) look.toPitch = null;
    }
    const h = walk.held, turn = h.l - h.r, go = h.f - h.b;
    if (turn) { look.yaw += turn * 1.7 * dt; look.toYaw = null; }
    let moving = false;
    if (go) {
      const [x, z] = spot(cam.position.x - Math.sin(look.yaw) * go * 1.4 * dt, cam.position.z - Math.cos(look.yaw) * go * 1.4 * dt);
      moving = Math.hypot(x - cam.position.x, z - cam.position.z) > 1e-4;
      cam.position.x = x; cam.position.z = z;
    } else if (walk.to) {
      const dx = walk.to[0] - cam.position.x, dz = walk.to[1] - cam.position.z, dist = Math.hypot(dx, dz), step = 1.5 * dt;
      if (dist <= step) { cam.position.x = walk.to[0]; cam.position.z = walk.to[1]; walk.to = null; }
      else { cam.position.x += dx / dist * step; cam.position.z += dz / dist * step; moving = true; }
    }
    walk.bob = moving ? walk.bob + dt * 9 : walk.bob * 0.85;   // a little 90s head bob while walking
    cam.position.y = EYE + Math.sin(walk.bob) * 0.022;
    const drift = look.touched ? 0 : Math.sin(t * 0.35) * 0.05;       // gentle, and gone once you've looked around
    cam.rotation.y = look.yaw + drift; cam.rotation.x = look.pitch;
    room.blades.rotation.y += dt * 1.6;
    const sadie = room.sadie;
    sadie.rotation.y = Math.atan2(cam.position.x - sadie.position.x, cam.position.z - sadie.position.z);
    if (t > blinkAt) { room.blink(true); blinkOff = t + 0.14; blinkAt = t + 2.5 + Math.random() * 3; }
    if (blinkOff && t > blinkOff) { room.blink(false); blinkOff = 0; }
    for (const m of pickable) {  // the chosen one slides out and glows
      const picked = m === chosen, u = m.userData;
      if (u.home !== undefined) {
        u.out += ((picked ? u.slide : 0) - u.out) * Math.min(1, dt * 8); m.position.z = u.home + u.out;
        m.rotation.z = picked && !u.slide ? Math.sin(t * 30) * 0.02 * Math.max(0, 1 - (t - chosenAt) * 2) : 0;  // taped shut: it just rattles
      }
      const glow = picked ? 0.1 + 0.08 * Math.sin(t * 6) : 0;
      for (const mat of u.mats) mat.uniforms.uGlow.value = glow;
    }
    renderer.render(scene, cam);
    frames++;
    raf = requestAnimationFrame(frame);
  }

  function close() {
    cancelAnimationFrame(raf); clearInterval(typing);
    off.abort(); sizer.disconnect();
    room.dispose(); renderer.dispose(); renderer.forceContextLoss();
    root.remove(); style.remove();
    delete window.__clubhouse;
  }

  // for the checks (tests/clubhouse/browser.mjs): what's chosen, where things are on screen
  window.__clubhouse = {
    frames: () => frames,
    led: () => $('#led').innerText,
    camera: () => ({ x: cam.position.x, z: cam.position.z, yaw: look.yaw }),
    // where on the page a shelf item is (kind: 'activity', 'locked', 'card' or 'sadie'; the nth of them)
    where(kind, nth = 0) {
      const m = pickable.filter(p => p.userData.kind === kind)[nth];
      if (!m) return null;
      const p = m.getWorldPosition(new Vector3());
      if (kind === 'sadie') p.y += 0.2;
      p.project(cam);
      const r = $('#room').getBoundingClientRect();
      return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height, visible: Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && p.z < 1 };
    },
  };

  resize();
  choose(pickable.find(m => m.userData.kind === 'activity'));
  raf = requestAnimationFrame(frame);
}
