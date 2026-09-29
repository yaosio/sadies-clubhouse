// Brickbuster '96's room: a tall arcade room with the game built into it, not on a computer. The
// case fills the far wall (the glass is two storeys high), the paddle is a chunky plastic character
// with a face, the ball is a ball of yarn, and Sadie sits on a box beside it watching the ball.
//
// The mansion calls buildRoom(m) with its building kit (m: its shapes, its PS1 material, its
// textures and Sadie's sprite), so nothing here imports the clubhouse. It hands back a place like any
// room's, plus a `play` on the case: the mansion eases your view back until the whole glass fits,
// then passes the controls on to it (steer, nudge) until you step back.
import { Scene, Color, Mesh, Group, Vector3, Shape, ExtrudeGeometry, BoxGeometry, PlaneGeometry, SphereGeometry } from 'three';
import { makeGame, step, launch, movePaddle, pushPaddle, save, load, W, H, R, PADDLE, CRACKS } from './game.js';
import { makePlayer } from './sound.js';
import { store } from '../../shared/storage.js';
import posterPic from './poster.js';

const KEY = 'sadies-clubhouse.brickbuster.game';
const RW = 5, RD = 6.5, RH = 11;     // the room: half its width and depth, and its height
const FY = 1.4, CZ = RD - 0.6;       // the glass's bottom edge above the floor, and the case's back
const Z = { play: 0.25, glass: 0.55 };   // in the case: where the game is, and the glass (towards you)
const ROW_COLS = [0xff3a3a, 0xff7a2a, 0xffa41e, 0xffe23a, 0x58d04a, 0x3ac8f0, 0x5a6af0, 0xb04af0];

export async function buildRoom(m) {
  const { T, C, psx, keep, tex, words, kit, wallGeometry, doorway, card, leaf } = m;
  const scene = new Scene(); scene.background = new Color(0x0a0628);
  const { add, box, plane, cyl } = kit(scene);

  // ---------- the room: tall walls, arcade carpet, the door ----------
  const paper = psx(T.damask, { rx: 1 / 1.3, ry: 1 / 1.3, tint: 0xd8ccff });
  add(new Mesh(wallGeometry(2 * RW, RH, 1.5, 2.45), paper), [0, 0, -RD]);
  add(new Mesh(wallGeometry(2 * RW, RH), paper), [0, 0, RD], [0, Math.PI, 0]);
  add(new Mesh(wallGeometry(2 * RD, RH), paper), [-RW, 0, 0], [0, Math.PI / 2, 0]);
  add(new Mesh(wallGeometry(2 * RD, RH), paper), [RW, 0, 0], [0, -Math.PI / 2, 0]);
  // the wainscot and its gold rail, all the way round
  for (const [w, pos, rot] of [[2 * RW, [0, 0.55, -RD + 0.04], 0], [2 * RD, [-RW + 0.04, 0.55, 0], Math.PI / 2], [2 * RD, [RW - 0.04, 0.55, 0], -Math.PI / 2]]) {
    plane(w, 1.1, psx(T.wainscot, { rx: w / 0.9, decal: true }), pos, [0, rot, 0], 2);
    plane(w, 0.1, psx(null, { tint: 0xffd23a, decal: true }), [pos[0], 1.12, pos[2]], [0, rot, 0], 2);
  }
  // the carpet every arcade had: black, with neon squiggles
  const carpet = tex(32, 32, g => {
    g.fillStyle = '#120a24'; g.fillRect(0, 0, 32, 32);
    const dots = [['#ff3ab4', [[3, 4], [4, 5], [5, 4], [6, 5], [7, 4]]], ['#3ae8ff', [[18, 10], [19, 9], [20, 10], [21, 11], [22, 10]]],
      ['#ffe23a', [[10, 20], [11, 20], [11, 21], [12, 22]]], ['#7a52f4', [[25, 25], [26, 24], [27, 25], [28, 26]]], ['#58d04a', [[4, 27], [5, 26], [6, 27]]]];
    for (const [c, pts] of dots) { g.fillStyle = c; for (const [x, y] of pts) g.fillRect(x, y, 1, 1); }
    g.fillStyle = '#ffffff'; for (const [x, y] of [[14, 3], [28, 15], [8, 13], [21, 29]]) g.fillRect(x, y, 1, 1);
  });
  plane(2 * RW, 2 * RD, psx(carpet, { rx: 2 * RW / 1.6, ry: 2 * RD / 1.6 }), [0, 0, 0], [-Math.PI / 2, 0, 0], 8).renderOrder = -2;
  plane(2 * RW, 2 * RD, psx(null, { tint: 0x3a2a8e }), [0, RH, 0], [Math.PI / 2, 0, 0], 6);
  const door = doorway(scene, { pos: [0, 0, -RD], yaw: 0, w: 1.5, h: 2.45, leaves: [leaf], hinge: 1 });
  // the lamps: one high up, one lower over the door
  cyl(0.35, 0.5, 0.35, 8, psx(null, { tint: 0xfff08a, unlit: 0.85 }), [0, RH - 0.2, 0]);
  cyl(0.02, 0.02, 1.2, 3, psx(null, { tint: 0xffd23a }), [0, RH - 0.9, 0]);
  // Sadie's QUIET!! poster, on the wall by the door
  const pim = await m.loadImage(posterPic);
  plane(1.4, 1.84, psx(pim ? m.picture(pim) : T.dark, { decal: true, unlit: 0.3 }), [RW - 0.06, 2.4, -RD + 2.6], [0, -Math.PI / 2, 0], 2);

  // ---------- the case: Brickbuster '96, built into the far wall ----------
  // Its own group, turned to face you: x runs across the glass left to right as you look at it, y up,
  // z out towards you. The glass runs from x -W/2 to W/2 and y 0 to H.
  const cab = new Group(); cab.position.set(0, FY, CZ); cab.rotation.y = Math.PI; scene.add(cab);
  const part = (mesh, pos, rot) => { mesh.position.set(...pos); if (rot) mesh.rotation.set(...rot); cab.add(mesh); return mesh; };
  const cbox = (w, h, d, mat, pos) => part(new Mesh(keep(new BoxGeometry(w, h, d, 2, 2, 2)), mat), pos);
  const cplane = (w, h, mat, pos, seg = 2) => part(new Mesh(keep(new PlaneGeometry(w, h, seg, seg)), mat), pos);
  // behind the glass: deep space, dithered
  const space = tex(32, 48, g => {
    for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) {
      const t = y / 47, b = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(y % 4) * 4 + x % 4] / 16;
      g.fillStyle = t * 2 + b > 1.4 ? '#2a1766' : t * 2 + b > 0.7 ? '#1a0f40' : '#0a0628'; g.fillRect(x, y, 1, 1);
    }
    g.fillStyle = '#ffffff'; for (const [x, y] of [[3, 5], [20, 9], [11, 17], [27, 24], [6, 33], [17, 40], [29, 44]]) g.fillRect(x, y, 1, 1);
    g.fillStyle = '#ff8ec8'; for (const [x, y] of [[25, 3], [9, 26], [22, 36]]) g.fillRect(x, y, 1, 1);
  });
  cplane(W, H, psx(space, { rx: 2, ry: 2, unlit: 0.6 }), [0, H / 2, 0], 4);
  // the sides, the base with its coin door, and the marquee on top: loud 90s plastic
  const zig = tex(16, 16, g => {
    g.fillStyle = '#3a2a8e'; g.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) { const y = 3 + Math.abs((x % 8) - 4); g.fillStyle = '#3ae8ff'; g.fillRect(x, y, 1, 2); g.fillStyle = '#ff3ab4'; g.fillRect(x, y + 7, 1, 2); }
  });
  const plastic = psx(zig, { rx: 1, ry: 10 }), trim = psx(null, { tint: 0xffd23a });
  for (const s of [-1, 1]) {
    cbox(0.5, H + 3.0, 1.1, plastic, [s * (W / 2 + 0.25), H / 2 + 0.05, 0.4]);
    cbox(0.06, H + 3.0, 0.06, trim, [s * (W / 2 + 0.02), H / 2 + 0.05, 0.93]);
  }
  cbox(W + 1.0, FY, 1.3, psx(zig, { rx: 4, ry: 1 }), [0, -FY / 2, 0.45]);
  cbox(W + 1.0, 0.08, 1.34, trim, [0, 0, 0.45]);
  const coin = tex(72, 20, g => {
    g.fillStyle = '#1c1238'; g.fillRect(0, 0, 72, 20);
    for (const x of [24, 40]) { g.fillStyle = '#c89018'; g.fillRect(x, 3, 8, 12); g.fillStyle = '#1c1238'; g.fillRect(x + 3, 5, 2, 6); g.fillStyle = '#e83a3a'; g.fillRect(x + 1, 12, 6, 2); }
    // stickers, one peeling off
    g.fillStyle = '#fff4e4'; g.fillRect(2, 3, 20, 14); g.fillRect(51, 3, 19, 14);
    words(g, 'FREE', 12, 4, 1, '#e83a3a', { align: 'center' }); words(g, 'PLAY', 12, 11, 1, '#1c1238', { align: 'center' });
    words(g, 'NO', 61, 4, 1, '#e83a3a', { align: 'center' }); words(g, 'COINS', 61, 11, 1, '#1c1238', { align: 'center' });
    g.clearRect(66, 3, 4, 1); g.clearRect(68, 4, 2, 1);
  });
  cplane(2.9, 0.8, psx(coin, { decal: true, unlit: 0.2 }), [0, -0.65, 1.11]);
  cbox(W + 1.0, 1.6, 1.1, psx(null, { tint: 0x1c1238 }), [0, H + 0.8, 0.4]);
  const marquee = tex(128, 40, () => {}), mg = marquee.image.getContext('2d');
  cplane(W + 0.7, 1.4, psx(marquee, { unlit: 0.95 }), [0, H + 0.8, 0.96]);
  // the glass: a glint, and the cracks drawn on a see-through picture over it
  const glint = tex(32, 48, g => {
    g.fillStyle = '#e8f8ff';
    for (let i = 0; i < 9; i++) { g.fillRect(Math.round(7 - i * 0.6), 3 + i, 1, 1); if (i < 5) g.fillRect(Math.round(10 - i * 0.6), 3 + i, 1, 1); }
  });
  cplane(W, H, psx(glint, { unlit: 1, fade: 0.4 }), [0, H / 2, Z.glass]);
  const CW = 84, CH = 132;   // the cracks' picture, in its chunky pixels (5 cm each)
  const cracksTex = tex(CW, CH, () => {}), cg = cracksTex.image.getContext('2d');
  cplane(W, H, psx(cracksTex, { unlit: 0.95, decal: true }), [0, H / 2, Z.glass + 0.01]);

  // ---------- inside: the bricks, the yarn ball and the paddle ----------
  const bevelTex = tex(8, 6, g => {
    g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, 8, 6); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 8, 1); g.fillRect(0, 0, 1, 6);
    g.fillStyle = '#707070'; g.fillRect(0, 5, 8, 1); g.fillRect(7, 0, 1, 6); g.fillStyle = '#f0f0f0'; g.fillRect(1, 1, 2, 1);
  });
  const rowMats = ROW_COLS.map(c => psx(bevelTex, { tint: c, unlit: 0.45 }));
  const game = load(makeGame(Math.floor(Math.random() * 1e6) + 1), store.get(KEY, null));
  const brickGeo = keep(new BoxGeometry(0.36, 0.22, 0.3));
  const bricks = game.bricks.map(k => part(new Mesh(brickGeo, rowMats[k.row]), [k.x + k.w / 2 - W / 2, k.y + k.h / 2, Z.play]));
  const at = (x, y) => [x - W / 2, y];
  // the yarn ball: pink, wound round and round
  const yarn = tex(16, 16, g => {
    g.fillStyle = '#ff5ab4'; g.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 16; i++) { g.fillStyle = '#c02a80'; g.fillRect(i, (i * 2) % 16, 1, 1); g.fillRect((i * 3 + 5) % 16, i, 1, 1); g.fillStyle = '#ffb0dc'; g.fillRect((i + 8) % 16, (i * 2 + 3) % 16, 1, 1); }
  });
  const ball = part(new Mesh(keep(new SphereGeometry(R, 8, 6)), psx(yarn, { rx: 2, unlit: 0.35 })), [0, 0, Z.play]);
  // the paddle: a chunky shiny plastic slab (a real 3D one, not a picture), with a face
  const shape = new Shape(), pw = PADDLE.w / 2 - 0.04, ph = PADDLE.h / 2 - 0.04, pr = 0.1;
  shape.moveTo(-pw + pr, -ph); shape.lineTo(pw - pr, -ph); shape.quadraticCurveTo(pw, -ph, pw, -ph + pr); shape.lineTo(pw, ph - pr);
  shape.quadraticCurveTo(pw, ph, pw - pr, ph); shape.lineTo(-pw + pr, ph); shape.quadraticCurveTo(-pw, ph, -pw, ph - pr);
  shape.lineTo(-pw, -ph + pr); shape.quadraticCurveTo(-pw, -ph, -pw + pr, -ph);
  const pgeo = keep(new ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1, curveSegments: 3 }).translate(0, 0, -0.11));
  const paddle = new Group(); part(paddle, [0, PADDLE.y, Z.play]);
  paddle.add(new Mesh(pgeo, psx(null, { tint: 0x2ad0c8, unlit: 0.3 })));
  const faces = drawFaces(m);
  const faceMat = psx(faces.focus[1], { unlit: 0.7 });
  const face = new Mesh(keep(new PlaneGeometry(PADDLE.w - 0.16, (PADDLE.w - 0.16) * 10 / 32)), faceMat);
  face.position.set(0, 0, 0.16); paddle.add(face);
  // bits of brick that fall down inside the case when one's knocked out
  const falling = [];

  // ---------- Sadie, on a box beside the machine, watching the ball ----------
  const perch = new Group(); perch.position.set(3.35, 0, CZ - 1.2); perch.rotation.y = -0.25; scene.add(perch);
  const cardboard = psx(T.cardboard, { rx: 1, ry: 1 });
  { const b = new Mesh(keep(new BoxGeometry(0.9, 0.85, 0.75, 2, 2, 2)), cardboard); b.position.y = 0.425; perch.add(b); }
  const sadie = new Mesh(keep(new PlaneGeometry(0.78, 0.63, 1, 1).translate(0, 0.31, 0)), psx(T.sadie, { unlit: 0.4 }));
  sadie.position.set(3.35, 0.86, CZ - 1.2); scene.add(sadie);

  // ---------- drawing the marquee and the cracks ----------
  let shownScore = -1;
  const logo = document.createElement('canvas'); logo.width = 128; logo.height = 16;
  { const g = logo.getContext('2d');
    words(g, "BRICKBUSTER '96", 64, 4, 2, '#ffffff', { align: 'center' });
    g.globalCompositeOperation = 'source-atop';
    ['#fffbd0', '#fff27a', '#ffe23a', '#ffc81e', '#ffa41e', '#ff7a2a', '#ff5446', '#ff3a78', '#f030a8', '#c830d0'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, 4 + i, 128, 1); }); }
  function drawMarquee() {
    shownScore = game.score;
    mg.clearRect(0, 0, 128, 40); mg.fillStyle = '#12082e'; mg.fillRect(0, 0, 128, 40);
    // the name in copper bars, a colour per scanline, with a hard shadow
    words(mg, "BRICKBUSTER '96", 66, 6, 2, '#5a2a78', { align: 'center' });
    mg.drawImage(logo, 0, 0);
    mg.fillStyle = '#ffffff'; mg.fillRect(0, 17, 128, 1);
    words(mg, 'SCORE ' + String(game.score).padStart(6, '0'), 64, 22, 1, '#3ae8ff', { align: 'center' });
    words(mg, 'FULL VERSION: 99 LEVELS!', 64, 31, 1, '#ff8ec8', { align: 'center' });
    marquee.needsUpdate = true;
  }
  function drawCracks() {
    cg.clearRect(0, 0, CW, CH);
    for (const side of ['top', 'bottom']) game.cracks[side].forEach((c, i) => crackLines(cg, c, i + 1, side, CW, CH));
    cracksTex.needsUpdate = true;
  }
  drawMarquee(); drawCracks();

  // ---------- playing ----------
  let active = false, wait = 0, dirty = false, savedAt = 0, mood = { name: 'calm', until: 0 }, pop = 0, now = 0;
  let sound = null, showing = 'calm';
  const keep_ = () => { store.set(KEY, save(game)); dirty = false; };
  addEventListener('pagehide', () => { if (dirty) keep_(); });
  function feel(name, secs) { mood = { name, until: now + secs }; }
  const play = {
    label: "PLAY BRICKBUSTER '96",
    // what the view has to fit: the glass, and a bit of the case round it
    view: { center: new Vector3(0, FY + (H + 1.4) / 2, CZ - Z.glass), normal: new Vector3(0, 0, -1), w: W + 0.6, h: H + 1.7 },   // the glass and the marquee
    start() {
      if (!sound) sound = makePlayer();
      sound.wake();
      active = true; wait = game.serving ? 0.9 : 0.6;
    },
    stop() { active = false; if (dirty) keep_(); },
    steer(v, dt) { if (active && v) pushPaddle(game, v, dt); },
    nudge(dx) { if (active) movePaddle(game, game.paddle + dx); },
  };
  function happen(events) {
    for (const e of events) {
      if (e.type === 'paddle') { sound.boing(e.off); feel('happy', 0.35); pop = 1; }
      else if (e.type === 'wall') sound.tock();
      else if (e.type === 'glass') sound.tink();
      else if (e.type === 'brick') {
        sound.blip(e.brick.row); dirty = true;
        const i = game.bricks.indexOf(e.brick), src = bricks[i];
        const bit = part(new Mesh(brickGeo, rowMats[e.brick.row]), [src.position.x, src.position.y, Z.play]);
        falling.push({ mesh: bit, vx: (Math.random() - 0.5) * 1.2, vy: 1.2, spin: (Math.random() - 0.5) * 12 });
      } else if (e.type === 'crack') {
        sound.crack(e.level); feel('wince', 1.1); drawCracks(); keep_();
      } else if (e.type === 'cleared') dirty = true;
    }
  }

  const place = {
    name: 'room:' + card.id, card, scene, doors: { door }, faces: [sadie],
    uses: [{ pos: new Vector3(0, FY + 1.6, CZ - Z.glass), reach: 12, label: play.label, play }],
    light: { sun: 0.2, bulb: 0.8, lamp: [0, RH - 1.5, 0] },
    spots: { case: { x: 0, z: CZ - 7.5, yaw: Math.PI, pitch: 0.25, y: 0 } },
    floor(x, z) {
      const P = 0.35;
      if (Math.abs(x) > RW - P || z < -RD + P || z > RD - P) return null;
      if (z > CZ - 1.75 - P && Math.abs(x) < W / 2 + 0.5 + P) return null;              // the case
      if (Math.abs(x - 3.35) < 0.5 + P && Math.abs(z - (CZ - 1.2)) < 0.45 + P) return null;   // Sadie's box
      return 0;
    },
    update(t, dt = 0) {
      now = t;
      if (active) {
        if (wait > 0) { wait -= dt; if (wait <= 0) launch(game); }
        else happen(step(game, dt));
        if (dirty && t - savedAt > 2) { savedAt = t; keep_(); }
      }
      // the bricks, the ball and the paddle where the game has them
      game.bricks.forEach((k, i) => { bricks[i].visible = k.alive; });
      const [bx, by] = at(game.ball.x, game.ball.y);
      ball.position.set(bx, by, Z.play);
      ball.rotation.set(-game.ball.spin * Math.sign(game.ball.vy || 1) * 0.7, 0, -game.ball.spin * Math.sign(game.ball.vx || 1) * 0.7);
      paddle.position.x = at(game.paddle, 0)[0];
      pop = Math.max(0, pop - dt * 5);
      paddle.scale.set(1 + pop * 0.08, 1 - pop * 0.18, 1);
      for (let i = falling.length - 1; i >= 0; i--) {
        const f = falling[i]; f.vy -= 9 * dt;
        f.mesh.position.x += f.vx * dt; f.mesh.position.y += f.vy * dt; f.mesh.rotation.z += f.spin * dt;
        if (f.mesh.position.y < 0.1) { cab.remove(f.mesh); falling.splice(i, 1); }
      }
      // the paddle's face: calm while nobody's playing, focused while you are (nervous once the
      // glass has cracked), happy for a moment when it hits the ball, wincing at a crack; its eyes
      // follow the ball
      const cracked = game.cracks.top.length + game.cracks.bottom.length;
      const name = t < mood.until ? mood.name : !active ? 'calm' : cracked ? 'nervous' : 'focus';
      const look = game.ball.x < game.paddle - 0.3 ? 0 : game.ball.x > game.paddle + 0.3 ? 2 : 1;
      faceMat.uniforms.map.value = faces[name][look]; showing = name;
      if (shownScore !== game.score) drawMarquee();
      // Sadie cranes up after the ball, and blinks now and then when nobody's playing
      sadie.scale.y = 1 + 0.07 * (game.ball.y / H);
      sadie.rotation.z = Math.sin(t * 0.7) * 0.03;
      sadie.material.uniforms.map.value = !active && (t % 4.2) < 0.15 ? T.nap : T.sadie;
    },
  };

  // for the checks (tests/brickbuster/browser.mjs)
  window.__brickbuster = {
    state: () => ({ active, serving: game.serving, score: game.score, paddle: game.paddle, ball: { ...game.ball },
      bricks: game.bricks.filter(k => k.alive).length, cracks: { top: game.cracks.top.length, bottom: game.cracks.bottom.length },
      sounds: sound ? sound.played : 0, lastSound: sound ? sound.last : null, face: showing }),
    // send the ball somewhere (x, y along the glass, and which way)
    throwBall(x, y, vx, vy) { Object.assign(game.ball, { x, y, vx, vy }); game.serving = false; wait = 0; },
  };
  return place;
}

// The paddle's faces, a few moods, each looking left, ahead or right: little pictures 32 x 10, big
// chunky pixels so they read from across the room.
function drawFaces(m) {
  const ink = '#1c1238', out = {};
  const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const draw = (name, look) => m.tex(32, 10, g => {
    px(g, '#ffffff', 2, 0, 6, 1); px(g, '#c8fff8', 1, 1, 2, 1);   // a glossy streak on the plastic
    const d = look - 1;
    for (const ex of [11, 20]) {
      const s = ex < 16 ? 1 : -1;
      if (name === 'happy') { px(g, ink, ex - 2, 3); px(g, ink, ex - 1, 2, 2, 1); px(g, ink, ex + 1, 3); }                 // ^ ^
      else if (name === 'wince') for (const [x, y] of [[-1, 1], [0, 2], [1, 3], [0, 4], [-1, 5]]) px(g, ink, ex + x * s, y);   // > <
      else if (name === 'calm') { px(g, ink, ex - 2, 3, 4, 1); px(g, '#ffffff', ex - 2, 4, 4, 1); px(g, ink, ex - 1 + d, 4, 2, 1); }   // sleepy
      else {                                                                                                                  // wide open, looking at the ball
        px(g, '#ffffff', ex - 2, 2, 4, 4);
        if (name === 'nervous') px(g, ink, ex - 1 + d + (d < 0 ? 0 : d > 0 ? 1 : 0), 3, 1, 2);
        else { px(g, ink, ex - 1 + d, 3, 2, 3); px(g, ink, ex - 2, s > 0 ? 1 : 0, 2, 1); px(g, ink, ex, s > 0 ? 0 : 1, 2, 1); }   // and cross determined brows
      }
    }
    if (name === 'happy') { px(g, ink, 13, 7, 6, 1); px(g, '#ff5a8a', 14, 8, 4, 1); px(g, ink, 13, 8); px(g, ink, 18, 8); }
    else if (name === 'wince') for (let x = 12; x < 20; x++) px(g, ink, x, 7 + (x % 2));
    else if (name === 'nervous') { for (let x = 13; x < 19; x++) px(g, ink, x, 7 + ((x >> 1) % 2)); px(g, '#8ad8ff', 27, 1, 1, 1); px(g, '#8ad8ff', 26, 2, 3, 2); }
    else if (name === 'calm') { px(g, ink, 14, 7); px(g, ink, 15, 8, 2, 1); px(g, ink, 17, 7); }
    else px(g, ink, 14, 8, 4, 1);
    if (name !== 'wince') { px(g, '#ff8ec8', 5, 6, 2, 1); px(g, '#ff8ec8', 25, 6, 2, 1); }   // rosy cheeks
  });
  for (const name of ['calm', 'focus', 'happy', 'wince', 'nervous']) out[name] = [0, 1, 2].map(l => draw(name, l));
  return out;
}

// A crack in the glass where the ball hit: jagged lines running out from the spot, more and longer
// for each crack on that side (the third is a whole web). Drawn the same every time from its seed.
export function crackLines(g, c, level, side, w, h) {
  let s = c.seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const x0 = Math.round(c.x / W * (w - 1)), y0 = side === 'top' ? 0 : h - 1, dir = side === 'top' ? 1 : -1;
  const branches = [5, 8, 13][level - 1], reach = [16, 30, 62][level - 1];
  const dot = (x, y, col) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < w && y >= 0 && y < h) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } };
  const ends = [];
  function line(x, y, a, len, depth) {
    for (let i = 0; i < len; i++) {
      a += (r() - 0.5) * 0.7;
      x += Math.cos(a); y += Math.sin(a) * dir;
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      dot(x, y, '#ffffff'); if (r() < 0.5) dot(x + 1, y, '#9ad8ff');
      if (depth < 2 && r() < 0.06) line(x, y, a + (r() < 0.5 ? -0.8 : 0.8), len * 0.45, depth + 1);
    }
    ends.push([x, y]);
  }
  for (let b = 0; b < branches; b++) {
    const a = 0.15 + (b + r() * 0.8) / branches * (Math.PI - 0.3);
    line(x0, y0, a, reach * (0.55 + r() * 0.6), 0);
  }
  // rings joining the lines, like a real star crack
  if (level >= 2) for (const k of level === 3 ? [0.3, 0.55, 0.8] : [0.45]) {
    for (let a = 0.1; a < Math.PI - 0.1; a += 0.04) if (r() < 0.8) dot(x0 + Math.cos(a) * reach * k, y0 + Math.sin(a) * reach * k * dir, '#d8f4ff');
  }
  // the spot it hit: a white star
  for (const [x, y] of [[0, 0], [1, 0], [-1, 0], [0, dir], [0, 2 * dir]]) dot(x0 + x, y0 + y, '#ffffff');
}
