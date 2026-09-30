// Brickbuster '96's room: a tall arcade room with the game built into it, not on a computer. The
// case fills the far wall (the glass is two storeys high), the paddle is a chunky plastic character
// with a face, the ball is a ball of yarn, and Sadie sits on a box beside it watching the ball.
//
// The mansion calls buildRoom(m) with its building kit (m: its shapes, its PS1 material, its
// textures and Sadie's sprite), so nothing here imports the clubhouse. It hands back a place like any
// room's, plus a `play` on the case: the mansion eases your view back until the whole glass fits,
// then passes the controls on to it (steer, nudge) until you step back.
import { Scene, Color, Mesh, Group, Vector2, Vector3, Shape, ExtrudeGeometry, ShapeGeometry, BoxGeometry, PlaneGeometry, SphereGeometry,
  DoubleSide, CanvasTexture, NearestFilter } from 'three';
import { makeGame, step, launch, serve, movePaddle, pushPaddle, save, load, W, H, R, PADDLE, CRACKS } from './game.js';
import { makeSounds } from './sounds/index.js';
import { makeChatter } from './sounds/sadie.js';
import { makeLoose, release, stepLoose, R as LR } from './loose.js';
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
  // (in two pieces along the front wall, either side of the door)
  const side = (RW - 0.9) / 2 + 0.9, sw = RW - 0.9;
  for (const [w, pos, rot] of [[sw, [-side, 0.55, -RD + 0.04], 0], [sw, [side, 0.55, -RD + 0.04], 0], [2 * RD, [-RW + 0.04, 0.55, 0], Math.PI / 2], [2 * RD, [RW - 0.04, 0.55, 0], -Math.PI / 2]]) {
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
  const POSTER = new Vector3(RW - 0.06, 2.4, -RD + 2.6);
  plane(1.4, 1.84, psx(pim ? m.picture(pim) : T.dark, { decal: true, unlit: 0.3 }), POSTER.toArray(), [0, -Math.PI / 2, 0], 2);

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
  const marquee = tex(192, 64, () => {}), mg = marquee.image.getContext('2d');
  cplane(W + 0.7, 1.55, psx(marquee, { unlit: 0.95 }), [0, H + 0.8, 0.96]);
  // the glass: a glint, and the cracks drawn on a see-through picture over it
  const glint = tex(32, 48, g => {
    g.fillStyle = '#e8f8ff';
    for (let i = 0; i < 9; i++) { g.fillRect(Math.round(7 - i * 0.6), 3 + i, 1, 1); if (i < 5) g.fillRect(Math.round(10 - i * 0.6), 3 + i, 1, 1); }
  });
  const glass = [cplane(W, H, psx(glint, { unlit: 1, fade: 0.4 }), [0, H / 2, Z.glass])];
  const CW = 84, CH = 132;   // the cracks' picture, in its chunky pixels (5 cm each)
  const cracksTex = tex(CW, CH, () => {}), cg = cracksTex.image.getContext('2d');
  glass.push(cplane(W, H, psx(cracksTex, { unlit: 0.95, decal: true }), [0, H / 2, Z.glass + 0.01]));

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

  // ---------- where the bricks end up: a heap on the floor ----------
  // A knocked-out brick falls to the bottom of the glass, down a slot, and pops out of the BRICK
  // RETURN hatch at the foot of the machine onto the heap: along the front of the machine and down
  // its right side, where nobody needs to walk. The heap fills from the floor up, nearest the hatch
  // first, so it's always a proper pile. (game.pile: which rows fell, in order.)
  const hatchTex = tex(32, 16, g => {
    g.fillStyle = '#c89018'; g.fillRect(0, 0, 32, 16); g.fillStyle = '#0a0628'; g.fillRect(2, 6, 28, 9);
    g.fillStyle = '#1c1238'; g.fillRect(1, 0, 30, 5); words(g, 'BRICK RETURN', 16, 0, 1, '#ffd23a', { align: 'center' });
  });
  cplane(0.8, 0.4, psx(hatchTex, { decal: true, unlit: 0.3 }), [1.6, -1.1, 1.11]);
  const HATCH = cab.localToWorld(new Vector3(1.6, -1.12, 1.2));
  const slots = pileSlots();
  const piled = [];   // the heap's bricks, in the order they fell
  const setPiled = (mesh, i) => { const s = slots[i]; mesh.position.set(s.x, s.y, s.z); mesh.rotation.set(s.tilt, s.yaw, s.roll); };
  function pileBrick(i, row) {
    const b = new Mesh(brickGeo, rowMats[row]); setPiled(b, i); scene.add(b); piled[i] = b; return b;
  }
  game.pile.forEach((row, i) => pileBrick(i, row));
  // things flying through the air on an arc (bricks to the heap, the paddle to the floor)
  const flights = [];
  function fly(mesh, to, { delay = 0, dur = 0.7, h = 0.8, spin = 8, land } = {}) {
    flights.push({ mesh, from: mesh.position.clone(), to, t: -delay, dur, h, spin: [(Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin], land });
  }
  // bits of brick falling down inside the glass, on their way to the slot
  const falling = [];

  // ---------- Sadie, on a box beside the machine, watching the ball ----------
  const SADIE = new Vector3(3.35, 0.9, CZ - 1.2);
  const perch = new Group(); perch.position.set(SADIE.x, 0, SADIE.z); perch.rotation.y = -0.25; scene.add(perch);
  const cardboard = psx(T.cardboard, { rx: 1, ry: 1 });
  { const b = new Mesh(keep(new BoxGeometry(0.9, 0.85, 0.75, 2, 2, 2)), cardboard); b.position.y = 0.465; perch.add(b); }   // (4 cm off the floor, so the floor never shows through its bottom)
  const sadie = new Mesh(keep(new PlaneGeometry(0.78, 0.63, 1, 1).translate(0, 0.31, 0)), psx(T.sadie, { unlit: 0.4 }));
  sadie.position.copy(SADIE); scene.add(sadie);

  // ---------- broken: the glass gone but for a jagged edge, and glitter all over the floor ----------
  const edgeTex = tex(CW, CH, g => {
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const tooth = (x, y, dx, dy, len) => { for (let i = 0; i < len; i++) { const w = Math.round((1 - i / len) * 3); for (let j = -w; j <= w; j++) { g.fillStyle = i < 2 || Math.abs(j) === w ? '#ffffff' : '#bfe8ff'; g.fillRect(x + dx * i + dy * j, y + dy * i + dx * j, 1, 1); } } };
    for (let x = 2; x < CW - 2; x += 3 + Math.floor(r() * 4)) { tooth(x, 0, 0, 1, 2 + Math.floor(r() * 9)); tooth(x, CH - 1, 0, -1, 2 + Math.floor(r() * 9)); }
    for (let y = 2; y < CH - 2; y += 3 + Math.floor(r() * 4)) { tooth(0, y, 1, 0, 2 + Math.floor(r() * 7)); tooth(CW - 1, y, -1, 0, 2 + Math.floor(r() * 7)); }
  });
  const edges = cplane(W, H, psx(edgeTex, { unlit: 0.9, decal: true, side: DoubleSide }), [0, H / 2, Z.glass]);
  const glitter = tex(32, 32, g => {
    let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.3 ? '#ffffff' : r() < 0.5 ? '#bfe8ff' : '#8ad8ff'; g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 1 + (r() < 0.2 ? 1 : 0), 1); }
  });
  const shardsOnFloor = plane(7, 3.2, psx(glitter, { rx: 7 / 1.2, ry: 3.2 / 1.2, onFloor: true, unlit: 0.7 }), [0, 0, CZ - 3.3], [-Math.PI / 2, 0, 0], 4);
  shardsOnFloor.renderOrder = -1;
  const shardGeo = keep(new ShapeGeometry(new Shape([new Vector2(0, 0), new Vector2(0.22, 0.05), new Vector2(0.06, 0.3)])));
  const shardMat = psx(null, { tint: 0xd8f6ff, unlit: 0.8, side: DoubleSide });
  const shards = [];
  // the landing's side of the door: Sadie's OUT OF ORDER sign, taped on crooked
  const signed = m.doorImage ? outOfOrder(m.doorImage, words) : null;

  // ---------- drawing the marquee and the cracks ----------
  let shownScore = -1;
  // (big letters: they have to read from where you play, across the room)
  const logo = document.createElement('canvas'); logo.width = 192; logo.height = 20;
  { const g = logo.getContext('2d');
    words(g, "BRICKBUSTER '96", 96, 3, 3, '#ffffff', { align: 'center' });
    g.globalCompositeOperation = 'source-atop';
    ['#fffbd0', '#fff27a', '#ffe23a', '#ffc81e', '#ffc81e', '#ffa41e', '#ff7a2a', '#ff7a2a', '#ff5446', '#ff3a78', '#ff3a78', '#f030a8', '#c830d0', '#c830d0', '#9a3ce8']
      .forEach((c, i) => { g.fillStyle = c; g.fillRect(0, 3 + i, 192, 1); }); }
  function drawMarquee() {
    shownScore = game.score;
    mg.clearRect(0, 0, 192, 64); mg.fillStyle = '#12082e'; mg.fillRect(0, 0, 192, 64);
    // the name in copper bars, a colour per scanline, with a hard shadow
    words(mg, "BRICKBUSTER '96", 98, 5, 3, '#5a2a78', { align: 'center' });
    mg.drawImage(logo, 0, 0);
    mg.fillStyle = '#ffffff'; mg.fillRect(0, 22, 192, 1);
    words(mg, 'SCORE ' + String(game.score).padStart(6, '0'), 96, 28, 2, '#3ae8ff', { align: 'center' });
    words(mg, game.broken ? 'OUT OF ORDER' : 'FULL VERSION 99 LEVELS', 96, 46, 2, game.broken ? '#e83a3a' : '#ff8ec8', { align: 'center' });
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
  let sound = null, showing = 'calm', lastTock = 0;
  const keep_ = () => { store.set(KEY, save(game)); dirty = false; };
  const leaving = new AbortController();
  addEventListener('pagehide', () => { if (dirty) keep_(); }, { signal: leaving.signal });
  function feel(name, secs) { mood = { name, until: now + secs }; }
  const clunk = () => { if (sound && now - lastTock > 0.07) { lastTock = now; sound.tock(); } };
  const play = {
    label: "PLAY BRICKBUSTER '96",
    // what the view has to fit: the glass, and a bit of the case round it
    // (the glass, the marquee, and the floor in front, where the bricks come out onto the heap; the
    // marquee's letters are big enough to read from there)
    view: { center: new Vector3(0, (-0.25 + FY + H + 1.75) / 2, CZ - Z.glass), normal: new Vector3(0, 0, -1), w: W + 0.9, h: FY + H + 1.75 + 0.25 },
    // where you watch from once it's broken: the middle of the room, on the floor, looking at it
    // (a corner well off the yarn ball's way out, and away from the door)
    after: { x: -3.4, z: 3.1, yaw: Math.PI + 0.5, pitch: 0.15 },
    over: false,   // broken: the mansion steps you back to watch
    start() {
      if (!sound) sound = makeSounds();
      sound.wake();
      if (!game.broken) { active = true; wait = game.serving ? 0.9 : 0.6; }
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
        falling.push({ mesh: bit, vx: (Math.random() - 0.5) * 1.2, vy: 1.2, spin: (Math.random() - 0.5) * 12, slot: e.slot, row: e.brick.row });
      } else if (e.type === 'crack') {
        if (!game.broken) sound.crack(e.level);
        feel('wince', 1.1); drawCracks(); keep_();
      } else if (e.type === 'break') smash(e.spilled);
    }
  }

  // ---------- the break ----------
  // All the glass goes at once. The bricks still up there tumble out onto the heap, the paddle drops
  // out into the rubble, and the yarn ball escapes: a few loud bounces round the room, smack into
  // Sadie's QUIET!! poster (after which it never makes another sound), then out through the door,
  // with Sadie bolting after it.
  let escape = null;        // the yarn ball's way out: { hops, i, t }, then 'gone'
  let run = null;           // Sadie chasing it
  let doneAt = 0;
  function brokenLook() {
    for (const p of glass) p.visible = false;
    edges.visible = true; shardsOnFloor.visible = true;
    place.uses = [];
    drawMarquee();
  }
  function smash(spilled) {
    active = false; play.over = true;
    sound.shatter(); feel('wince', 1.4);
    brokenLook(); keep_();
    // the glass flies out in bits
    for (let i = 0; i < 44; i++) {
      const s = new Mesh(shardGeo, shardMat);
      s.position.copy(cab.localToWorld(new Vector3((Math.random() - 0.5) * W, Math.random() * H, Z.glass)));
      s.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); scene.add(s);
      shards.push({ mesh: s, v: new Vector3((Math.random() - 0.5) * 3, Math.random() * 2, -1 - Math.random() * 3), spin: (Math.random() - 0.5) * 14, rest: 0 });
    }
    // the bricks left up there spill out onto the heap
    const first = game.pile.length - spilled.length;
    spilled.forEach((k, j) => {
      const src = bricks[game.bricks.indexOf(k)], b = new Mesh(brickGeo, rowMats[k.row]);
      b.position.copy(cab.localToWorld(src.position.clone())); scene.add(b);
      fly(b, slotPos(first + j), { delay: 0.05 + Math.random() * 0.5, dur: 0.8 + Math.random() * 0.4, h: 0.9, spin: 10, land: () => { setPiled(b, first + j); piled[first + j] = b; clunk(); } });
    });
    // the paddle drops out into the rubble
    scene.attach(paddle);
    fly(paddle, PADDLE_DOWN.clone(), { delay: 0.2, dur: 1.0, h: 0.6, spin: 4, land: () => { restPaddle(); clunk(); } });
    // the yarn ball gets out
    scene.attach(ball);
    const hops = [
      [new Vector3(-1.8, R, 2.6), 0.9, 'boing'], [new Vector3(-RW + R, 3.2, 0.6), 1.0, 'boing'], [new Vector3(1.2, R, -0.4), 1.4, 'boing'],
      [new Vector3(-RW + R, 6.4, -1.4), 0.8, 'boing'], [new Vector3(-0.5, R, -2.4), 0.3, 'boing'],
      [POSTER.clone().add(new Vector3(-R - 0.02, 0, 0)), 0.5, 'mute'],
      [new Vector3(1.6, R, -5.2), 0.6, null], [new Vector3(0.1, R, -6.2), 0.3, null], [new Vector3(0, R, -7.8), 0.2, null],
    ];
    escape = { hops, i: 0, t: 0, from: ball.position.clone() };
    place.watch = ball.position;   // everyone in the room watches it go
  }
  const PADDLE_DOWN = new Vector3(0.5, 0.66, CZ - 1.6);
  function restPaddle() { paddle.position.copy(PADDLE_DOWN); paddle.rotation.set(1.0, Math.PI, 0.14); paddle.scale.set(1, 1, 1); }
  function slotPos(i) { const s = slots[i]; return new Vector3(s.x, s.y, s.z); }
  function escapeOn(dt) {
    const e = escape, [to, h, noise] = e.hops[e.i];
    const dur = 0.25 + e.from.distanceTo(to) / 8.5;
    e.t += dt;
    const k = Math.min(1, e.t / dur);
    ball.position.lerpVectors(e.from, to, k); ball.position.y += 4 * h * k * (1 - k);
    ball.rotation.x += dt * 14; ball.rotation.z += dt * 9;
    if (k < 1) return;
    if (noise === 'boing') sound?.boing(Math.random() * 2 - 1);
    if (noise === 'mute') { sound?.mute(); place.holding = door; run = { t: 0, from: sadie.position.clone() }; }
    e.from = to.clone(); e.t = 0; e.i++;
    if (e.i >= e.hops.length) { escape = 'gone'; ball.visible = false; place.watch = null; outInTheHall(true); }
  }
  // Sadie: off her box and straight out the door after it
  function runOn(dt) {
    run.t += dt;
    const out = new Vector3(0, 0, -7.4), hop = 0.35, dist = run.from.distanceTo(out), dur = hop + dist / 5.5;
    if (run.t < hop) { const k = run.t / hop; sadie.position.lerpVectors(run.from, new Vector3(2.9, 0, CZ - 1.9), k); sadie.position.y = run.from.y * (1 - k) + 0.5 * Math.sin(k * Math.PI); }
    else { const k = Math.min(1, (run.t - hop) / (dur - hop)); sadie.position.lerpVectors(new Vector3(2.9, 0, CZ - 1.9), out, k); sadie.position.y = Math.abs(Math.sin(run.t * 16)) * 0.12; }
    if (run.t >= dur) { sadie.visible = false; run = 'gone'; doneAt = now + 0.5; }
  }
  // done: the door shuts, and the landing's side of it has her sign on
  let signUp = false;
  function putSignUp() { if (signed && m.landingDoor) { m.landingDoor.paint(signed); signUp = true; } }
  function finished() { place.holding = null; doneAt = 0; putSignUp(); }

  // ---------- out in the hall: the yarn ball loose for ever, and Sadie chasing it ----------
  // (loose.js has how; here they're drawn in the hall, which the mansion hands over as m.hall)
  const hall = m.hall, loose = hall?.shape ? makeLoose(hall.shape, Math.floor(Math.random() * 1e6) + 1) : null;
  let hallBall = null, hallCat = null;
  // Sadie's sounds while she plays (sounds/sadie.js: rare and soft, never two close together),
  // heard only in the hall, fading the further off she is. The ball itself stays silent.
  const chatter = makeChatter(Math.floor(Math.random() * 1e6) + 1);
  function sadieHeard(said) {
    const e = m.ears?.();
    if (!said || !e || e.place !== hall) return;
    if (!sound) sound = makeSounds();   // (it wakes on your next press or key, if the browser's still holding it back)
    sound.sadie(said, Math.hypot(loose.cat.x - e.x, loose.cat.y + 0.3 - e.y, loose.cat.z - e.z));
  }
  if (loose) {
    hallBall = new Mesh(ball.geometry, ball.material); hallBall.visible = false; hall.scene.add(hallBall);
    hallCat = new Mesh(sadie.geometry, psx(T.sadie, { unlit: 0.4 })); hallCat.visible = false; hall.scene.add(hallCat); hall.faces.push(hallCat);
  }
  // just now: bouncing out of the door onto the landing, Sadie a moment behind it; or (it got out
  // before) somewhere on the ground floor, Sadie beside it
  function outInTheHall(now) {
    if (!loose) return;
    if (hall.napping) hall.napping.visible = false;   // her box in the sunbeam is empty: she's busy
    const d = m.landingDoor, s = hall.shape;
    if (now && d) {
      const n = d.normal, y = d.pos.y;
      release(loose, [d.pos.x + n.x * 0.4, y + LR + 0.4, d.pos.z + n.z * 0.4], [n.x * 4.5 + n.z * 1.2, 2, n.z * 4.5 - n.x * 1.2], [d.pos.x + n.x * 0.3, y, d.pos.z + n.z * 0.3], 1.7);
    } else {
      const a = Math.random() * Math.PI * 2, r = s.post + 2.5;
      release(loose, [Math.sin(a) * r, 0.8, Math.cos(a) * r], [0, 0, 0], [Math.sin(a + 0.25) * r, 0, Math.cos(a + 0.25) * r], 0);
    }
    hallBall.visible = true;
  }

  const place = {
    name: 'room:' + card.id, card, scene, doors: { door }, faces: [sadie],
    uses: game.broken ? [] : [{ pos: new Vector3(0, FY + 1.6, CZ - Z.glass), reach: 8.5, label: play.label, play }],
    holding: null,   // a door being held open (the yarn ball and Sadie on their way out)
    // (the mansion puts the room away when you're far off, never mid-game or while the ball's getting
    // out; the yarn ball and Sadie leave the hall with it, and come back when it's built again)
    busy: () => active || (escape && escape !== 'gone') || (run && run !== 'gone') || !!doneAt || flights.length > 0 || falling.length > 0,
    putAway() {
      if (dirty) keep_();
      leaving.abort(); sound?.close();
      if (hallBall) { hall.scene.remove(hallBall, hallCat); hall.faces.splice(hall.faces.indexOf(hallCat), 1); }
      if (signUp) m.landingDoor.paint(null);
    },
    watch: null,     // what your view follows (the yarn ball, while it's getting out)
    light: { sun: 0.2, bulb: 0.8, lamp: [0, RH - 1.5, 0] },
    spots: { case: { x: 0, z: CZ - 7.5, yaw: Math.PI, pitch: 0.25, y: 0 } },
    floor(x, z) {
      const P = 0.35;
      if (Math.abs(x) > RW - P || z < -RD + P || z > RD - P) return null;
      if (heapZone(x, z, P)) return null;                                                   // the case, and the heap in front and down its side
      if (Math.abs(x - SADIE.x) < 0.5 + P && Math.abs(z - SADIE.z) < 0.45 + P) return null;   // Sadie's box
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
      if (!game.broken) {
        const [bx, by] = at(game.ball.x, game.ball.y);
        ball.position.set(bx, by, Z.play);
        ball.rotation.set(-game.ball.spin * Math.sign(game.ball.vy || 1) * 0.7, 0, -game.ball.spin * Math.sign(game.ball.vx || 1) * 0.7);
        paddle.position.x = at(game.paddle, 0)[0];
        pop = Math.max(0, pop - dt * 5);
        paddle.scale.set(1 + pop * 0.08, 1 - pop * 0.18, 1);
      }
      // bits of brick falling inside the glass: down the slot, out of the hatch, onto the heap
      for (let i = falling.length - 1; i >= 0; i--) {
        const f = falling[i]; f.vy -= 9 * dt;
        f.mesh.position.x += f.vx * dt; f.mesh.position.y += f.vy * dt; f.mesh.rotation.z += f.spin * dt;
        if (f.mesh.position.y > 0.1 && !game.broken) continue;
        cab.remove(f.mesh); falling.splice(i, 1);
        const b = new Mesh(brickGeo, rowMats[f.row]); b.position.copy(HATCH); scene.add(b);
        fly(b, slotPos(f.slot), { delay: game.broken ? Math.random() * 0.4 : 0.25, dur: 0.55, h: 0.35, land: () => { setPiled(b, f.slot); piled[f.slot] = b; clunk(); } });
      }
      for (let i = flights.length - 1; i >= 0; i--) {
        const f = flights[i]; f.t += dt;
        if (f.t < 0) continue;
        const k = Math.min(1, f.t / f.dur);
        f.mesh.position.lerpVectors(f.from, f.to, k); f.mesh.position.y += 4 * f.h * k * (1 - k);
        f.mesh.rotation.x += f.spin[0] * dt; f.mesh.rotation.y += f.spin[1] * dt; f.mesh.rotation.z += f.spin[2] * dt;
        if (k >= 1) { flights.splice(i, 1); f.land?.(); }
      }
      for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i];
        if (s.rest) { if (t > s.rest) { scene.remove(s.mesh); shards.splice(i, 1); } continue; }
        s.v.y -= 9 * dt; s.mesh.position.addScaledVector(s.v, dt); s.mesh.rotation.x += s.spin * dt; s.mesh.rotation.y += s.spin * 0.7 * dt;
        if (s.mesh.position.y < 0.02) { s.mesh.position.y = 0.02; s.mesh.rotation.set(-Math.PI / 2, 0, Math.random() * 6); s.rest = t + 1.5 + Math.random(); }
      }
      if (escape && escape !== 'gone') escapeOn(dt);
      if (run && run !== 'gone') runOn(dt);
      if (doneAt && t > doneAt) finished();
      if (loose?.ball) {
        for (const ev of stepLoose(loose, dt)) sadieHeard(chatter.heard(ev, t));
        const b = loose.ball, c = loose.cat;
        hallBall.position.set(b.x, b.y, b.z); hallBall.rotation.set(b.spin * 0.7, 0, b.spin * 0.5);
        hallCat.visible = c.mode !== 'coming'; hallCat.position.set(c.x, c.y, c.z);
        hallCat.scale.set(c.mode === 'whack' ? 1.15 : 1, c.mode === 'whack' ? 0.9 : 1, 1);   // (a crouch before the swat)
      }
      // the paddle's face: calm while nobody's playing, focused while you are (nervous once the
      // glass has cracked), happy for a moment when it hits the ball, wincing at a crack; its eyes
      // follow the ball. Once it's broken: lying in the rubble, sad, sighing now and then.
      const cracked = game.cracks.top.length + game.cracks.bottom.length;
      let name = t < mood.until ? mood.name : !active ? 'calm' : cracked ? 'nervous' : 'focus';
      if (game.broken && t >= mood.until) {
        const sigh = (t % 7) > 5.6;
        name = sigh ? 'sigh' : 'sad';
        if (!flights.some(f => f.mesh === paddle)) paddle.scale.set(1, sigh ? 1 + 0.12 * Math.sin((t % 7 - 5.6) / 1.4 * Math.PI) : 1, 1);
      }
      const look = game.broken ? 1 : game.ball.x < game.paddle - 0.3 ? 0 : game.ball.x > game.paddle + 0.3 ? 2 : 1;
      faceMat.uniforms.map.value = faces[name][look]; showing = name;
      if (shownScore !== game.score) drawMarquee();
      // Sadie cranes up after the ball, and blinks now and then when nobody's playing
      if (!run) {
        sadie.scale.y = 1 + 0.07 * (game.ball.y / H);
        sadie.rotation.z = Math.sin(t * 0.7) * 0.03;
        sadie.material.uniforms.map.value = !active && (t % 4.2) < 0.15 ? T.nap : T.sadie;
      } else { sadie.scale.y = 1; sadie.rotation.z = 0; sadie.material.uniforms.map.value = T.sadie; }
    },
  };

  if (game.broken) {   // it broke before: how it's been left
    brokenLook(); scene.attach(paddle); restPaddle(); ball.visible = false; sadie.visible = false;
    escape = 'gone'; run = 'gone';
    putSignUp(); outInTheHall(false);
  }
  else edges.visible = shardsOnFloor.visible = false;

  // for the checks (tests/brickbuster/browser.mjs)
  window.__brickbuster = {
    state: () => ({ active, serving: game.serving, score: game.score, paddle: game.paddle, ball: { ...game.ball },
      bricks: game.bricks.filter(k => k.alive).length, pile: piled.filter(Boolean).length, broken: game.broken,
      cracks: { top: game.cracks.top.length, bottom: game.cracks.bottom.length },
      escape: escape === 'gone' ? 'gone' : escape ? 'hop ' + escape.i : null, sadie: sadie.visible, doorHeld: !!place.holding, sign: signUp,
      yarn: ball.getWorldPosition(new Vector3()).toArray(), watched: !!place.watch,
      hall: loose?.ball ? { ball: [loose.ball.x, loose.ball.y, loose.ball.z], cat: [loose.cat.x, loose.cat.y, loose.cat.z], mode: loose.cat.mode,
        whacks: loose.whacks, pops: loose.pops, shown: hallBall.visible && hallCat.visible, napping: !!hall.napping?.visible } : null,
      sounds: sound ? sound.played : 0, lastSound: sound ? sound.last : null, heard: sound ? sound.log.slice() : [], face: showing }),
    // put the ball back on the paddle (it stays there till it's thrown)
    catchBall() { serve(game); wait = 0; },
    // Sadie makes one of her sounds right now, wherever she is (as if the chatter had picked it)
    sadieSays(name) { if (loose?.ball) sadieHeard({ name, variant: 0 }); },
    // send the ball somewhere (x, y along the glass, and which way)
    throwBall(x, y, vx, vy) { Object.assign(game.ball, { x, y, vx, vy }); game.serving = false; wait = 0; },
    // knock out bricks (all but `leave` of them) without playing, for checking the heap
    knockOut(leave = 0) {
      for (const k of game.bricks) if (k.alive && game.bricks.filter(b => b.alive).length > leave) {
        k.alive = false; game.pile.push(k.row); pileBrick(game.pile.length - 1, k.row);
      }
      keep_();
    },
  };
  return place;
}

// The machine and the heap of bricks round it, where nobody walks (with `pad` to spare round it).
export function heapZone(x, z, pad = 0) {
  return (z > CZ - 1.75 - pad && Math.abs(x) < W / 2 + 0.5 + pad) || (x < -W / 2 - 0.35 + pad && x > -3.75 - pad && z > CZ - 1.75 - pad);
}

// Where the heap's bricks go on the floor, nearest the hatch first, a layer at a time: 80 spots
// along the front of the machine and down its right side (as you look at it).
export function pileSlots() {
  let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out = [], front = CZ - 1.1;
  const add = (x, z, layer) => out.push({ x: x + (r() - 0.5) * 0.08, y: 0.11 + layer * 0.21, z: z + (r() - 0.5) * 0.08, layer,
    yaw: (r() - 0.5) * 0.7, tilt: (r() - 0.5) * 0.12, roll: (r() - 0.5) * 0.14 });
  for (let L = 0; L < 3; L++) for (const z of L < 2 ? [front - 0.2, front - 0.52] : [front - 0.36]) for (let x = -2.4 + 0.2 * L; x <= 2.4 - 0.2 * L + 1e-6; x += 0.4) add(x, z, L);
  for (let L = 0; L < 3; L++) for (const x of L === 0 ? [-2.95, -3.35] : [-3.15]) for (let i = 0; i < [6, 5, 2][L]; i++) add(x, 6.25 - 0.18 * L - i * 0.36, L);
  const hx = -1.6, hz = front;
  return out.map((p, i) => ({ ...p, k: p.layer * 100 + Math.hypot(p.x - hx, p.z - hz) + i * 1e-6 })).sort((a, b) => a.k - b.k).slice(0, 80);
}

// The landing's side of the door, with Sadie's sign taped on it: OUT OF ORDER in wobbly marker,
// crooked, signed with a paw print.
function outOfOrder(door, words) {
  const c = document.createElement('canvas'); c.width = door.width * 2; c.height = door.height * 2;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(door, 0, 0, c.width, c.height);
  const s = document.createElement('canvas'); s.width = 64; s.height = 38;
  const k = s.getContext('2d');
  k.fillStyle = '#b87838'; k.fillRect(0, 0, 64, 38); k.fillStyle = '#e8b070'; k.fillRect(1, 1, 62, 36);
  k.fillStyle = '#d8a060'; for (let x = 2; x < 62; x += 3) k.fillRect(x, 1, 1, 36);
  let wob = 5;
  const scrawl = (text, x, y, col) => { for (const ch of text) { wob = (wob * 7 + 3) % 11; words(k, ch, x, y + (wob % 3) - 1, 2, col); x += 8; } };
  scrawl('OUT OF', 8, 4, '#1c1238');
  scrawl('ORDER', 12, 17, '#e83a3a');
  k.fillStyle = '#e0509a';
  k.fillRect(50, 31, 5, 4); for (const [x, y] of [[48, 29], [50, 27], [53, 27], [55, 29]]) k.fillRect(x, y, 2, 2);
  g.save(); g.translate(c.width / 2, 40); g.rotate(-0.13); g.drawImage(s, -32, -19);
  g.fillStyle = '#f4f4e8cc'; g.fillRect(-36, -22, 10, 5); g.fillRect(26, 16, 10, 5);   // tape
  g.restore();
  const t = new CanvasTexture(c); t.magFilter = t.minFilter = NearestFilter; t.generateMipmaps = false;
  return t;
}

// The paddle's faces, a few moods (and once it's broken: sad, and sighing), each looking left, ahead or right: little pictures 32 x 10, big
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
      else if (name === 'sad') { px(g, ink, ex - 2 * s, 3); px(g, ink, ex - s, 2); px(g, ink, ex, 1); px(g, '#ffffff', ex - 1, 4, 3, 2); px(g, ink, ex, 5, 1, 1); }   // brows up in the middle, looking down
      else if (name === 'sigh') { px(g, ink, ex - 2, 4); px(g, ink, ex - 1, 5, 2, 1); px(g, ink, ex + 1, 4); }        // shut
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
    else if (name === 'sad') { px(g, ink, 14, 7, 4, 1); px(g, ink, 13, 8); px(g, ink, 18, 8); px(g, '#8ad8ff', 8, 6, 1, 2); px(g, '#8ad8ff', 8, 8); }   // a frown, and a tear
    else if (name === 'sigh') { px(g, ink, 15, 7, 2, 1); px(g, ink, 14, 8); px(g, ink, 17, 8); px(g, ink, 15, 9, 2, 1); }
    else px(g, ink, 14, 8, 4, 1);
    if (name !== 'wince') { px(g, '#ff8ec8', 5, 6, 2, 1); px(g, '#ff8ec8', 25, 6, 2, 1); }   // rosy cheeks
  });
  for (const name of ['calm', 'focus', 'happy', 'wince', 'nervous', 'sad', 'sigh']) out[name] = [0, 1, 2].map(l => draw(name, l));
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
