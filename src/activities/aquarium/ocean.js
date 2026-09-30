// The ocean behind the aquarium's glass: its own scene, which the room swaps in (room.js) while
// you're looking at nothing but the sand at the bottom of the tank. It has an exact copy of the
// tank's floor in it (`copy`, put right under wherever the boat is), so the swap can't be seen.
//
// Out here you're in a little sailboat: the deck and the bow in front of you, the mast and the sail,
// and a dashboard with an LED sign (how many finds, and what to do next), a radar with a blip for
// each spot you haven't found yet, and the BACK TO AQUARIUM button. There are six spots (chart.js),
// each with something to find. Five of them leave trails of their own little things drifting out
// across the sea, and a twinkle hangs over each until you've found its thing. The sixth is the
// mountain, which looms over the whole sea (it's drawn scaled up with distance, so it looks the same
// size from anywhere) and turns out to be tiny. A reef keeps you away from it until you have the
// other five; then the reef sinks and the sign says GO TO THE MOUNTAIN!
//
// Everything in the sea is in sea coordinates (chart.js), inside `sea`, a group the room puts where
// this trip's boat lines up with the tank. Heights in the room's terms: the surface is SURFACE.
import { Scene, Color, Mesh, Group, PlaneGeometry, DoubleSide, BackSide, SphereGeometry } from 'three';
import { SPOTS, START, REEF_R, SEA_R, DECK, loom, reefOpen, sailable, findHere, MT } from './chart.js';
import { T0 } from './tank.js';
import { px, dot, oval, findPics } from './pictures.js';

export const SURFACE = 4.6;                 // the sea's surface, in the room's terms (above the tank's top)
export const SEABED = T0 - 0.04 - SURFACE;  // the seabed, a little under the copy of the tank's sand
const UNDERWATER = 0x1a4ab0;

export function buildOcean(m, copyOf) {
  const { T, C, psx, keep, tex, words, kit } = m;
  const scene = new Scene(); scene.background = new Color(UNDERWATER);
  const faces = [];   // (flat things that turn to face you: turned here, not by the mansion, since the sea moves about)
  const sea = new Group(); scene.add(sea);
  const { add, box, plane, cyl, ball, cone } = kit(sea);
  const solid = (tint, o = {}) => psx(null, { tint, ...o });
  const pics = findPics(tex, C);

  // ---------- the sky, the water and the seabed ----------
  const skyPic = tex(4, 64, g => {
    const bands = ['#1a1a80', '#2a3ab0', '#2a60e0', '#3a8af0', '#58b8f8', '#8ad8ff', '#ffb0d8', '#ffd0e8'];
    for (let y = 0; y < 32; y++) { const f = y / 31 * (bands.length - 1), k = Math.min(bands.length - 2, Math.floor(f)); for (let x = 0; x < 4; x++) px(g, dot(x, y) < f - k ? bands[k + 1] : bands[k], x, y); }
    px(g, '#1a5ab0', 0, 32, 4, 32);
  });
  const sky = new Mesh(keep(new SphereGeometry(800, 16, 12)), psx(skyPic, { unlit: 1, side: BackSide }));
  sky.material.depthTest = false; sky.material.depthWrite = false; sky.renderOrder = -10; scene.add(sky);
  // a few flat 90s clouds, far off round the edge
  const cloudPic = tex(32, 12, g => { oval(g, 10, 7, 8, 4.5, C.white); oval(g, 19, 5, 8, 5, C.white); oval(g, 25, 8, 6, 3.5, C.white); px(g, '#d8e8ff', 3, 10, 27, 2); });
  const clouds = new Group(); scene.add(clouds);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + 0.3, c = new Mesh(keep(new PlaneGeometry(90, 34)), psx(cloudPic, { unlit: 1 }));
    c.position.set(Math.sin(a) * 700, 80 + (i % 3) * 45, Math.cos(a) * 700); c.rotation.y = a + Math.PI;
    c.material.depthTest = false; c.material.depthWrite = false; c.renderOrder = -9; clouds.add(c);
  }
  const ripples = tex(16, 16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(g, Math.sin(x / 2.5 + Math.sin(y / 3) * 2) > 0.7 ? '#dff6ff' : (x + y) % 7 ? '#2a8ad0' : '#58c8f0', x, y); });
  const water = plane(2400, 2400, psx(ripples, { rx: 800, ry: 800, fade: 0.28, unlit: 0.35, side: DoubleSide }), [0, 0, 0], [-Math.PI / 2, 0, 0], 24);
  const bed = tex(32, 32, g => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) px(g, dot(x, y) < 0.3 ? '#1a3a90' : '#123080', x, y);
    for (const [x, y] of [[4, 6], [20, 3], [12, 22], [27, 17]]) px(g, '#2a5ab0', x, y, 2, 1);
  });
  plane(2400, 2400, psx(bed, { rx: 300, ry: 300 }), [0, SEABED - 0.5, 0], [-Math.PI / 2, 0, 0], 24);   // (well under the sand, so they never flicker)
  // sand under the shallows: round each spot, and round where the boat comes up
  const sand = tex(16, 16, g => { px(g, '#f0d890', 0, 0, 16, 16); for (let i = 0; i < 40; i++) px(g, i % 3 ? '#d8b868' : '#fff0c0', (i * 7) % 16, (i * 11) % 16); });
  for (const s of SPOTS) {
    const r = s.id === 'mountain' ? 9 : s.r + 18;
    cyl(r, r, 0.6, 16, psx(sand, { rx: r / 2, ry: r / 2 }), [s.x, SEABED - 0.29, s.z]);   // (its top just under the copy's sand)
  }

  // ---------- the copy of the tank's floor (the room hands over what to copy), and its swaying weed ----------
  const copy = new Group(); scene.add(copy);
  const pairs = copyOf.map(o => { const c = o.clone(); copy.add(c); return [o, c]; });
  // round it, a patch of sand just under the copy's own, so it sits in the sea like it belongs there
  { const k = kit(copy); k.cyl(16, 16, 0.02, 20, psx(sand, { rx: 12, ry: 12, tint: 0xd8f0ff }), [0, T0 + 0.005, 4.9]); }

  // ---------- the spots ----------
  const bob = [];    // things that float: [mesh, how high, phase]
  const floaty = (mesh, y, ph) => { bob.push([mesh, y, ph]); return mesh; };
  const findMesh = {};
  // a find floating on the water: its picture on a little raft, turning to face you
  function floating(id, x, z, size = 1.6) {
    const f = new Mesh(keep(new PlaneGeometry(size, size)), psx(pics[id], { unlit: 0.3, side: DoubleSide }));
    f.position.set(x, size / 2 + 0.1, z); sea.add(f); faces.push(f);
    return floaty(f, size / 2 + 0.1, x * 0.1);
  }
  const at = id => SPOTS.find(s => s.id === id);

  // the message in a bottle, bobbing all on its own
  { const s = at('bottle');
    const b = new Group(); b.position.set(s.x, 0, s.z); sea.add(b);
    const glass = solid(0x3fbf6a, { unlit: 0.3 });
    const kitB = kit(b);
    kitB.cyl(0.45, 0.45, 1.6, 8, glass, [0, 0.1, 0], [0, 0, Math.PI / 2]);
    kitB.cyl(0.18, 0.2, 0.6, 6, glass, [1.05, 0.1, 0], [0, 0, Math.PI / 2]);
    kitB.cyl(0.19, 0.19, 0.2, 6, solid(0xb07a44), [1.42, 0.1, 0], [0, 0, Math.PI / 2]);
    kitB.box(1.0, 0.35, 0.36, solid(0xfff4e4), [-0.05, 0.1, 0]);
    b.rotation.y = 0.6; floaty(b, 0, 1.3); findMesh.bottle = b;
  }
  // the shipwreck, down on the seabed through the clear water, its mast sticking out; the hat floats over it
  { const s = at('hat'), w = new Group(); w.position.set(s.x, SEABED, s.z); w.rotation.set(0.12, 0.7, 0.25); sea.add(w);
    const k = kit(w), hull = psx(T.wood, { rx: 3, tint: 0x6a5a8a });
    k.box(3.2, 1.6, 12, hull, [0, 0.8, 0]); k.cone(1.6, 3, 4, hull, [0, 0.8, -7.4], [-Math.PI / 2, Math.PI / 4, 0]);
    k.box(2.4, 1.2, 3, hull, [0, 2.0, 4]);
    k.cyl(0.14, 0.18, 7.5, 6, psx(T.wood, { tint: 0x8a6a4a }), [0, 4.4, -1.5]);
    k.box(3.2, 0.14, 0.14, psx(T.wood, { tint: 0x8a6a4a }), [0, 6.8, -1.5]);
    const flag = tex(16, 10, g => { px(g, C.ink, 0, 0, 16, 10); for (let y = 0; y < 10; y++) px(g, C.black, 0, y, 16 - (y % 3) * 2, 1); px(g, C.white, 5, 3, 4, 3); px(g, C.black, 6, 4, 1, 1); px(g, C.black, 8, 4, 1, 1); });
    k.plane(1.4, 0.9, psx(flag, { side: DoubleSide }), [0.75, 7.3, -1.5], [0, 0, 0], 2);
    findMesh.hat = floating('hat', s.x + 9, s.z + 5);
  }
  // the giant rubber duck, as big as a house; a normal one floats beside it
  { const s = at('duck'), d = new Group(); d.position.set(s.x, 0, s.z); d.rotation.y = -2.2; sea.add(d);
    const k = kit(d), yellow = solid(0xffd23a), orange = solid(0xff7a1a);
    const body = k.ball(6.5, yellow, [0, 1.8, 0], 0.62); body.scale.z = 1.25;
    k.ball(3.8, yellow, [0, 7.4, -4.2]);
    k.box(2.6, 1.0, 2.6, orange, [0, 7.0, -8.0]);
    for (const x of [-1.6, 1.6]) { k.ball(0.55, solid(0xffffff, { unlit: 0.4 }), [x, 8.4, -7.2]); k.ball(0.3, solid(0x120a24), [x, 8.45, -7.65]); }
    k.cone(2.2, 3, 5, yellow, [0, 4.8, 7.4], [-1.2, 0, 0]);
    findMesh.duck = floating('duck', s.x - 12, s.z - 3, 1.2);
  }
  // the lighthouse on its rock, its lamp sweeping slowly round; the floppy disk sits on the rock
  let beam = null;
  { const s = at('floppy'), l = new Group(); l.position.set(s.x, 0, s.z); sea.add(l);
    const k = kit(l), rock = psx(T.stone, { rx: 3, ry: 2, tint: 0xe0d8ff, unlit: 0.25 });
    k.cyl(8, 10.5, 3, 9, rock, [0, 0.5, 0]); k.cone(5, 3, 7, rock, [3, 3.5, 2]);
    for (let i = 0; i < 6; i++) k.cyl(2.2 - i * 0.18, 2.4 - i * 0.18, 2.2, 10, solid(i % 2 ? 0xe83a3a : 0xffffff), [0, 3.1 + i * 2.2, 0]);
    k.cyl(1.6, 1.6, 1.8, 8, solid(0xfff08a, { unlit: 1 }), [0, 17.2, 0]);
    k.cone(2.0, 1.8, 8, solid(0xe83a3a), [0, 19.0, 0]);
    k.cyl(2.3, 2.3, 0.2, 10, solid(0x1c1238), [0, 16.2, 0]);
    const beamPic = tex(32, 8, g => { for (let y = 0; y < 8; y++) for (let x = 0; x < 32; x++) if (Math.abs(y - 3.5) < 1 + x / 10 && dot(x, y) < 0.8 - x / 45) px(g, '#fff3a0', x, y); });
    beam = new Group(); beam.position.set(0, 17.2, 0); l.add(beam);
    for (const r of [0, Math.PI]) { const b = new Mesh(keep(new PlaneGeometry(40, 8)), psx(beamPic, { unlit: 1, side: DoubleSide })); b.position.set(Math.cos(r) * 21, 0, -Math.sin(r) * 21); b.rotation.y = r; beam.add(b); }
    const disk = new Mesh(keep(new PlaneGeometry(1.4, 1.4)), psx(pics.floppy, { unlit: 0.3, side: DoubleSide }));
    disk.position.set(s.x + 6, 2.9, s.z - 6.5); sea.add(disk); faces.push(disk); findMesh.floppy = disk;
  }
  // the palm tree island, a desert-island joke: one tree, and a coconut with a face
  { const s = at('coconut'), p = new Group(); p.position.set(s.x, 0, s.z); sea.add(p);
    const k = kit(p), sandy = psx(sand, { rx: 4, ry: 4 });
    k.ball(10, sandy, [0, -3.2, 0], 0.45);
    for (let i = 0; i < 7; i++) k.cyl(0.42 - i * 0.03, 0.46 - i * 0.03, 1.3, 6, psx(T.wood, { tint: 0xb87848 }), [i * 0.35, 1.5 + i * 1.2, 0], [0, 0, -0.25]);
    const frond = tex(16, 4, g => { for (let x = 0; x < 16; x++) px(g, x % 3 ? C.green : C.green2, x, 1 + Math.round(Math.sin(x / 5)), 1, 2); });
    for (let i = 0; i < 6; i++) { const f = k.plane(5, 1.4, psx(frond, { side: DoubleSide }), [2.4, 9.8, 0], [0, i * Math.PI / 3, -0.35], 2); f.geometry.translate(2.5, 0, 0); }
    for (const [x, z] of [[1.8, 0.4], [2.6, -0.4], [2.2, 0.6]]) k.ball(0.35, solid(0x7a4a2a), [x, 9.2, z]);
    const c = new Mesh(keep(new PlaneGeometry(1.2, 1.2)), psx(pics.coconut, { unlit: 0.3, side: DoubleSide }));
    c.position.set(s.x - 5, 1.9, s.z + 7); sea.add(c); faces.push(c); findMesh.coconut = c;
  }
  // the mountain: really about as big as a sandcastle, on its own sandbar, with Sadie sitting on top
  const mountain = new Group(); sea.add(mountain);
  cyl(2.3, 2.6, 0.3, 12, psx(sand, { rx: 2 }), [0, 0.05, 0]);   // the sandbar (not looming: it stays when the mountain's taken)
  // (its foot is a little under the water, so however big it's drawn it stands in the sea; each snowy
  // top is the same cone as its peak, a size bigger, so the two never flicker through each other)
  { const k = kit(mountain), stone = psx(T.stone, { rx: 1, ry: 1, tint: 0xb8a8e8 }), snow = solid(0xffffff, { unlit: 0.2 });
    const FOOT = -0.05;
    const peak = (r, h, n, x, z, cap) => {
      k.cone(r, h, n, stone, [x, FOOT + h / 2, z]);
      if (cap) { const hc = h * cap * 1.12; k.cone(r * cap * 1.12, hc, n, snow, [x, FOOT + h + h * cap * 0.05 - hc / 2, z]); }
    };
    peak(1.15, MT, 7, 0, 0, 0.3);
    peak(0.6, MT * 0.62, 6, 0.75, 0.3, 0.28);
    peak(0.55, MT * 0.55, 6, -0.7, -0.25, 0);
  }
  findMesh.mountain = mountain;
  const sadie = new Mesh(keep(new PlaneGeometry(0.62, 0.56)), psx(T.sadie, { unlit: 0.25 }));
  sadie.geometry.translate(0, 0.28, 0); sea.add(sadie); faces.push(sadie);
  // once all six are found, she holds up a sign over her head about the full game (it's lost
  // shareware: there is no full game)
  const placard = new Group(); placard.visible = false; placard.position.set(0, 0.2, 0); sea.add(placard); faces.push(placard);
  { const k = kit(placard), lines = ['ALL 6 FOUND!', 'MORE IN THE', 'FULL GAME', 'RELEASING', '1996!'];
    const pic = tex(52, 34, g => { px(g, C.cream, 0, 0, 52, 34); px(g, C.tan3, 0, 0, 52, 1); px(g, C.tan3, 0, 33, 52, 1); px(g, C.tan3, 0, 0, 1, 34); px(g, C.tan3, 51, 0, 1, 34);
      lines.forEach((l, i) => words(g, l, 26, 3 + i * 6, 1, i === 0 ? C.red : C.ink, { align: 'center' })); });
    k.cyl(0.03, 0.03, 0.6, 4, psx(T.wood, { tint: 0xc89868 }), [0.12, 0.72, -0.02]);
    k.plane(1.3, 0.85, psx(pic, { unlit: 0.5, side: DoubleSide }), [0.12, 1.4, 0], [0, 0, 0], 1);
  }

  // ---------- the reef round the mountain: rocks and foam, and a buoy for each of the five finds ----------
  const reef = new Group(); sea.add(reef);
  const buoys = [];
  { const k = kit(reef), rock = psx(T.stone, { rx: 1, ry: 1, tint: 0x8a88b0 }), foam = solid(0xffffff, { unlit: 0.4 });
    for (let i = 0; i < 44; i++) {
      const a = i / 44 * Math.PI * 2, r = REEF_R + Math.sin(i * 2.7) * 1.5, x = Math.sin(a) * r, z = Math.cos(a) * r;
      k.cone(1.4 + (i % 3) * 0.5, 1.6 + (i % 4) * 0.6, 5, rock, [x, 0.2, z], [0, i, 0]);
      if (i % 2) k.box(2.4, 0.12, 0.6, foam, [x * 0.97, 0.05, z * 0.97], [0, a, 0]);
    }
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + i / 5 * Math.PI * 2, x = Math.sin(a) * (REEF_R + 3.5), z = Math.cos(a) * (REEF_R + 3.5);
      k.cyl(0.55, 0.7, 1.4, 8, solid(0xe83a3a), [x, 0.5, z]);
      k.box(0.8, 0.1, 0.1, solid(0xffffff), [x, 0.8, z]);
      const lamp = k.ball(0.35, solid(0x5a2a2a), [x, 1.45, z]);
      buoys.push(lamp);
    }
  }
  // (and, once the reef's sunk, a trail of lit buoys leading in to the mountain from the south)
  const trail = new Group(); trail.visible = false; sea.add(trail);
  { const k = kit(trail);
    for (let i = 0; i < 5; i++) { const z = 8 + i * 6; const x = i % 2 ? 4 : -4; k.cyl(0.4, 0.5, 1.0, 8, solid(0xffd23a), [x, 0.4, z]); k.ball(0.28, solid(0xfff08a, { unlit: 1 }), [x, 1.05, z]); }
  }

  // ---------- breadcrumbs: each spot's own little things, drifting out towards where you start ----------
  const crumbs = {};
  const crumbPics = {
    bottle: tex(8, 8, g => { px(g, C.tan2, 2, 1, 4, 6); px(g, '#e8b878', 3, 1, 2, 5); }),                          // corks
    hat: tex(16, 4, g => { px(g, '#4a3527', 0, 0, 16, 4); px(g, '#7a5a3a', 0, 1, 16, 1); }),                            // planks
    duck: tex(8, 8, g => { oval(g, 3.5, 5, 3.5, 2.5, C.gold); oval(g, 5, 2.5, 2, 2, C.gold); px(g, '#ff7a1a', 7, 2, 1, 1); }),   // baby ducks
    floppy: tex(8, 8, g => { oval(g, 4, 4, 3.5, 3.5, '#fff3a0', C.gold); px(g, C.white, 3, 3, 2, 2); }),                 // lit floats
    coconut: tex(8, 8, g => { oval(g, 4, 4, 3.5, 3.5, C.tan3, '#4a2a18'); px(g, '#9a6a3a', 2, 3, 1, 1); }),              // coconuts
  };
  for (const s of SPOTS) if (crumbPics[s.id]) {
    const dx = START.x - s.x, dz = START.z - s.z, len = Math.hypot(dx, dz), list = [];
    for (let i = 0; i < 7; i++) {
      const t = (s.r + 16 + i * 11) / len, wob = Math.sin(i * 1.7 + s.x) * 3;
      const x = s.x + dx * t - dz / len * wob, z = s.z + dz * t + dx / len * wob;
      const c = new Mesh(keep(new PlaneGeometry(s.id === 'hat' ? 1.8 : 0.9, s.id === 'hat' ? 0.45 : 0.9)), psx(crumbPics[s.id], { unlit: 0.35, side: DoubleSide }));
      c.position.set(x, 0.35, z); sea.add(c); faces.push(c); floaty(c, 0.35, i + s.x);
      list.push(c);
    }
    crumbs[s.id] = list;
  }
  // a twinkle over each spot you haven't found yet, drawn bigger the further off it is, so you can
  // see it from anywhere
  const twinklePic = tex(9, 9, g => { px(g, C.yellow, 4, 0, 1, 9); px(g, C.yellow, 0, 4, 9, 1); px(g, C.white, 3, 3, 3, 3); px(g, C.white, 4, 1, 1, 7); px(g, C.white, 1, 4, 7, 1); });
  const twinkles = {};
  for (const s of SPOTS) if (s.id !== 'mountain') {
    const t = new Mesh(keep(new PlaneGeometry(1, 1)), psx(twinklePic, { unlit: 1 }));
    t.position.set(s.x, s.id === 'floppy' ? 26 : s.id === 'duck' ? 17 : 14, s.z); t.material.depthTest = false; t.renderOrder = 5;
    sea.add(t); faces.push(t); twinkles[s.id] = t;
  }

  // ---------- the boat: the deck and bow in front of you, the mast and sail, and the dashboard ----------
  const boat = new Group(); scene.add(boat);
  const led = tex(96, 12, () => {}), radar = tex(32, 32, () => {}), dash = new Group();
  { const k = kit(boat), deck = psx(T.wood, { rx: 2, ry: 4, tint: 0xe8c8a0 }), paint = solid(0xffffff), trimC = solid(0xe83a3a);
    k.box(1.8, 0.1, 3.2, deck, [0, 0.12, -0.6]);
    k.cone(0.9, 1.6, 3, deck, [0, 0.12, -2.95], [-Math.PI / 2, 0, 0]).scale.set(1, 1, 0.12);
    for (const s of [-1, 1]) { k.box(0.1, 0.35, 3.4, paint, [s * 0.92, 0.22, -0.55]); k.box(0.12, 0.08, 3.4, trimC, [s * 0.92, 0.42, -0.55]); }
    k.cyl(0.05, 0.06, 5.5, 6, psx(T.wood, { tint: 0xc89868 }), [0.62, 2.8, -1.7]);   // (the mast stands off to the right, out of your way)
    const sailPic = tex(16, 32, g => { for (let y = 0; y < 32; y++) { const w = Math.round((y + 1) / 2); px(g, y % 8 === 7 ? '#e8dcff' : C.cream, 0, y, w, 1); } px(g, C.pink, 3, 22, 3, 3); });
    // the sail, swung out to the right over the water, its foot above your head
    const sailM = k.plane(1.5, 3.4, psx(sailPic, { side: DoubleSide, unlit: 0.3 }), [0.62, 3.4, -1.7], [0, -Math.PI / 2 + 1.15, 0], 2);
    sailM.geometry.translate(0.75, 0, 0);
    k.cyl(0.03, 0.03, 1.5, 4, psx(T.wood, { tint: 0xc89868 }), [0.99, 1.7, -1.47], [0, -Math.PI / 2 + 1.15, Math.PI / 2]);
    // the dashboard: a panel with the sign, the radar, and the big red button home
    dash.position.set(0, 0.6, -1.15); dash.rotation.x = -0.45; dash.scale.setScalar(0.85); boat.add(dash);
    const kd = kit(dash);
    kd.box(1.3, 0.34, 0.08, solid(0x5a2a78), [0, 0, 0]);
    kd.plane(0.78, 0.1, psx(led, { unlit: 1 }), [-0.2, 0.08, 0.045], [0, 0, 0], 1);
    kd.plane(0.22, 0.22, psx(radar, { unlit: 1 }), [0.46, 0, 0.045], [0, 0, 0], 1);
    kd.cyl(0.05, 0.06, 0.04, 8, solid(0xe83a3a, { unlit: 0.4 }), [-0.45, -0.08, 0.06], [Math.PI / 2, 0, 0]);
    const homeLabel = tex(40, 8, g => { px(g, C.ink, 0, 0, 40, 8); words(g, 'AQUARIUM', 20, 2, 1, C.yellow, { align: 'center' }); });
    kd.plane(0.26, 0.05, psx(homeLabel, { unlit: 0.6 }), [-0.14, -0.08, 0.045], [0, 0, 0], 1);
  }

  // ---------- the LED sign and the radar ----------
  let message = '', flash = false, scroll = 0, lastDraw = -1;
  function drawLed(t) {
    const g = led.image.getContext('2d'); px(g, '#120a24', 0, 0, 96, 12);
    for (let x = 1; x < 95; x += 2) for (let y = 1; y < 11; y += 2) px(g, '#2a0a12', x, y);
    const on = !flash || Math.floor(t * 3) % 2 === 0, w = message.length * 4;
    if (on) {
      if (w <= 90) words(g, message, 48, 4, 1, '#ff5a3a', { align: 'center' });
      else words(g, message, 96 - Math.floor(scroll * 20) % (w + 96), 4, 1, '#ff5a3a');
    }
    led.needsUpdate = true;
  }
  function drawRadar(t, me, found) {
    const g = radar.image.getContext('2d'); px(g, '#0a1a0a', 0, 0, 32, 32);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x - 15.5, y - 15.5); if (d > 14.5 && d < 15.5) px(g, '#2aa04a', x, y); else if (Math.abs(d - 7.5) < 0.5 && (x + y) % 2) px(g, '#16602a', x, y); }
    const sweep = t * 2;
    for (let r = 1; r < 14; r++) px(g, '#1a7a3a', Math.round(15.5 + Math.sin(sweep) * r), Math.round(15.5 - Math.cos(sweep) * r));
    px(g, C.white, 15, 15, 2, 2);
    const blink = Math.floor(t * 2.5) % 3 !== 0;
    for (const s of SPOTS) {
      if (found.includes(s.id) || (s.id === 'mountain' && !reefOpen(found))) continue;
      const dx = s.x - me.x, dz = s.z - me.z, d = Math.hypot(dx, dz), c = Math.cos(me.yaw), sn = Math.sin(me.yaw);
      // (turned so up on the radar is the way the boat faces)
      const rx = dx * c - dz * sn, rz = dx * sn + dz * c, k = Math.min(13, d / 300 * 13) / Math.max(d, 1e-6);
      if (blink) px(g, s.id === 'mountain' ? C.pink : C.yellow, Math.round(15 + rx * k), Math.round(15 + rz * k), 2, 2);
    }
    radar.needsUpdate = true;
  }

  // ---------- keeping it all up to date ----------
  let found = [], openedAt = -1e9, note = null, noteUntil = 0;
  // put everything as it should be for what you've found (at the start of a trip, and as you find things)
  function show(list, t = 0) {
    found = list.slice();
    for (const s of SPOTS) {
      const got = found.includes(s.id);
      if (findMesh[s.id]) findMesh[s.id].visible = !got;
      if (twinkles[s.id]) twinkles[s.id].visible = !got;
      for (const c of crumbs[s.id] || []) c.visible = !got;
    }
    // a buoy lit for each find so far; the reef sunk (and the trail in) once all five are found
    const lit = found.filter(id => id !== 'mountain').length;
    buoys.forEach((b, i) => { b.material.uniforms.tint.value.set(i < lit ? 0xfff08a : 0x5a2a2a); b.material.uniforms.uUnlit.value = i < lit ? 1 : 0; });
    const open = reefOpen(found);
    if (openedAt < -1e8) reef.position.y = open ? -6 : 0;
    trail.visible = open && !found.includes('mountain');
  }
  // a find picked up: the reef starts sinking if that was the fifth
  function take(id, t) {
    const wasOpen = reefOpen(found);
    if (!wasOpen && reefOpen([...found, id])) openedAt = t;   // (the fifth: the reef sinks, over a few seconds)
    show([...found, id], t);
    const s = SPOTS.find(q => q.id === id);
    say(`GOT ${s.name}!`, t, 3.5);
  }
  function say(text, t, secs) { note = text; noteUntil = t + secs; }

  function sign(t) {
    const left = 5 - found.filter(id => id !== 'mountain').length;
    if (note && t < noteUntil) return [note, false];
    if (found.includes('mountain')) return ['ALL 6 FOUND!', false];
    if (reefOpen(found)) return ['GO TO THE MOUNTAIN!', true];
    return [`FINDS ${found.length} OF 6`, false];
  }

  // `me`: where you are (the room's ears, in the room's terms), `off`: where the sea is
  function update(t, dt, me, off) {
    const lx = me.x - off.x, lz = me.z - off.z, under = me.y < SURFACE;
    sky.position.set(me.x, me.y, me.z); clouds.position.set(me.x, 0, me.z);
    sky.visible = clouds.visible = !under;
    scene.background.set(under ? UNDERWATER : 0x3a8af0);
    water.material.uniforms.map.value.offset.set(t * 0.02, t * 0.013);
    for (const [o, c] of pairs) c.rotation.copy(o.rotation);
    for (const f of faces) f.rotation.y = Math.atan2(me.x - off.x - f.position.x, me.z - off.z - f.position.z);
    // the dashboard, small enough to fit across a narrow phone screen
    const aspect = innerWidth / Math.max(1, innerHeight), fov = Math.min(68, Math.max(55, 2 * Math.atan(Math.tan(40 * Math.PI / 180) / aspect) * 180 / Math.PI));
    dash.scale.setScalar(Math.min(0.85, 0.85 * Math.tan(fov * Math.PI / 360) * aspect * 1.15 * 0.95 / 0.56));
    for (const [mesh, y, ph] of bob) { mesh.position.y = y + Math.sin(t * 1.1 + ph) * 0.12; mesh.rotation.z = Math.sin(t * 0.8 + ph) * 0.05; }
    if (beam) beam.rotation.y = t * 0.35;
    // the looming mountain: scaled up with how far off it is, so it's always the same size
    const dm = Math.hypot(lx, lz), sc = loom(dm);
    mountain.scale.setScalar(sc);
    sadie.position.set(0, found.includes('mountain') ? 0.2 : MT * sc + 0.08, 0);
    sadie.visible = dm < 60; placard.visible = sadie.visible && found.includes('mountain');
    sadie.rotation.z = dm < 14 ? Math.sin(t * 5) * 0.18 : 0;   // (she waves when you're close)
    for (const s of SPOTS) if (twinkles[s.id]) {
      const tw = twinkles[s.id], d = Math.hypot(s.x - lx, s.z - lz);
      tw.scale.setScalar(Math.max(1.5, d * 0.03) * (0.8 + 0.25 * Math.sin(t * 4 + s.x)));
    }
    // the reef sinking, over three seconds, once it's opened
    if (openedAt > -1e8) { const k = Math.min(1, (t - openedAt) / 3); reef.position.y = -6 * k * k; if (k >= 1) openedAt = -1e9; }
    // the boat: where you are, facing where you face, rocking a little
    boat.visible = me.y > SURFACE - 0.3;
    boat.position.set(me.x, SURFACE + Math.sin(t * 1.3) * 0.04, me.z); boat.rotation.set(Math.sin(t * 0.9) * 0.015, me.yaw, Math.sin(t * 1.1) * 0.025);
    // the sign and the radar (a few times a second is plenty)
    if (!reefOpen(found) && dm < REEF_R + 6 && !(note?.startsWith('REEF') && t < noteUntil)) say(`REEF CLOSED! FIND ${5 - found.filter(id => id !== 'mountain').length} MORE THINGS`, t, 4);
    [message, flash] = sign(t); scroll += dt;
    if (t - lastDraw > 0.08) { lastDraw = t; drawLed(t); drawRadar(t, { x: lx, z: lz, yaw: me.yaw }, found); }
  }

  return {
    scene, sea, copy, faces: [], show, take, update,
    get found() { return found; },
    message: () => message,
    // what's at this spot of sea (sea coordinates): can the boat be here, and what can you pick up
    sailable: (x, z) => sailable(x, z, found),
    findHere: (x, z) => findHere(x, z, found),
    SEA_R,
  };
}
