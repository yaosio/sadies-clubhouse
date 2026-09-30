// Inside Clyde's house: a cosy, cluttered workshop (a chalkboard with PLAN V47 on it, a bookshelf,
// sticky notes, a photo of Clyde's first client), and across the back wall the Good Morning Machine:
// a lever lets a marble roll down a ramp into the dominoes, which push a one-pound weight onto a
// seesaw, which flings a ball of yarn into a funnel; down the pipe it rolls into the hamster wheel,
// where Clyde starts running, which turns the fan by its belt, which blows a paper boat across the
// trough into a teacup, which tips the treat down a chute into Sadie's bowl. Sadie, asleep in her
// basket, wakes up and eats it.
//
// Six pieces (the dominoes, the seesaw, the funnel, the fan, the boat, the teacup) can go missing,
// a few at a time; you fill each gap from Clyde's box of spare parts (mostly junk, though the rubber
// duck floats) and pull the lever. The rules are in machine.js, the words in
// lines.js. Stepping up to the machine is like playing an instrument in the music room: every key
// and every press goes to it until you step back.
//
// The mansion calls buildRoom(m) with its building kit, and with the outside and this activity's
// plot on it (its card has a `lot`), so the house outside is built here too (house.js).
import { Scene, Color, Mesh, Group, Vector3, PlaneGeometry, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, ConeGeometry, DoubleSide } from 'three';
import { drawArt, K } from './art.js';
import { buildHouse, DW, DH } from './house.js';
import { makeMachine, saveOf, missing, partIn, swap, run, won, GAPS } from './machine.js';
import * as L from './lines.js';
import { REACT } from './reactions.js';
import { makeSounds } from './sounds/index.js';
import { store } from '../../shared/storage.js';

const KEY = 'sadies-clubhouse.clydes-house.machine';
const RW = 4.6, RD = 4.2, H = 5.6;       // the room: half its width and depth, and its height
const MZ = -RD + 0.35;                    // the machine stands this far out from the back wall
const at = (u, v, dz = 0) => [u, v, MZ + dz];

// where things are on the machine (u across, v up)
const LEVER = [-2.65, 3.28];
const MARBLE = [-2.42, 3.56], RAMP_END = [-1.42, 3.22];
const DOMINOES = [-1.3, -1.17, -1.04, -0.91, -0.78], WEIGHT = [-0.6, 3.21];
const SEE = [0, 2.62];                    // the seesaw's pivot
const YARN = [0.45, 2.64], FUNNEL = [2.0, 3.36], PIPE_OUT = [2.0, 2.05], SLIDE = [[1.95, 1.98], [1.42, 1.78]];
const WHEEL = [0.9, 1.75], WR = 0.42, FAN = [-0.2, 1.3];
const BOAT = [-0.8, -1.72], CUP = [-2.17, 1.18], TREAT = [-2.07, 1.33], BOWL = [-2.62, 0.35];
const BASKET = [-1.5, 0.48], SADIE_SITS = [0.2, 0.55];
// the gaps: where a part goes, how big, and where its name tag is
const SPOT = {
  dominoes: { c: [-1.04, 3.3], w: 0.74, h: 0.32, junk: [-1.04, 3.34], tag: [-1.04, 2.99] },
  seesaw: { c: [-0.1, 2.64], w: 1.0, h: 0.3, junk: [-0.42, 2.62], tag: [0.0, 2.34] },
  funnel: { c: [2.0, 3.22], w: 0.46, h: 0.42, junk: [2.0, 3.24], tag: [2.5, 3.24] },
  fan: { c: [-0.2, 1.55], w: 0.5, h: 0.52, junk: [-0.2, 1.5], tag: [-0.2, 1.12] },
  boat: { c: [-0.8, 1.3], w: 0.42, h: 0.3, junk: [-0.8, 1.3], tag: [-0.9, 0.87] },
  cup: { c: [-2.07, 1.3], w: 0.36, h: 0.32, junk: [-2.07, 1.3], tag: [-2.0, 0.87] },
};

export async function buildRoom(m) {
  const { T, psx, keep, kit, wallGeometry, doorway, card } = m;
  const A = drawArt(m);
  const scene = new Scene(); scene.background = new Color(0x0a0628);
  const { add, box, plane, cyl } = kit(scene);
  const mesh = (geo, mat, pos, rot, parent = scene) => { const o = new Mesh(keep(geo), mat); if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); parent.add(o); return o; };
  const sprite = (t, w, h, pos, o = {}) => mesh(new PlaneGeometry(w, h).translate(0, o.bottom ? h / 2 : 0, 0), psx(t, { unlit: o.unlit ?? 0.25, side: o.side }), pos, null, o.parent);
  const tint = (c, o = {}) => psx(null, { tint: c, ...o });
  const house = m.outside && m.lot ? buildHouse(m, A) : null;

  // ---------- the room ----------
  const paper = psx(A.paper, { rx: 1 / 0.9, ry: 1 / 0.9 });
  add(new Mesh(wallGeometry(2 * RW, H), paper), [0, 0, -RD]);
  add(new Mesh(wallGeometry(2 * RW, H, DW, DH), paper), [0, 0, RD], [0, Math.PI, 0]);
  add(new Mesh(wallGeometry(2 * RD, H), paper), [-RW, 0, 0], [0, Math.PI / 2, 0]);
  add(new Mesh(wallGeometry(2 * RD, H), paper), [RW, 0, 0], [0, -Math.PI / 2, 0]);
  plane(2 * RW, 2 * RD, psx(A.floor, { rx: 2 * RW / 1.4, ry: 2 * RD / 1.4 }), [0, 0, 0], [-Math.PI / 2, 0, 0], 8).renderOrder = -2;
  plane(2 * RW, 2 * RD, tint(0xfff0dc), [0, H, 0], [Math.PI / 2, 0, 0], 6);
  const door = doorway(scene, { pos: [0, 0, RD], yaw: Math.PI, w: DW, h: DH, leaves: [{ front: A.doorBack, back: A.door }], hinge: 1, trim: 0xd97757 });
  plane(3.2, 3.2, psx(A.rug, { rx: 2, ry: 2, onFloor: true }), [0, 0, 1.0], [-Math.PI / 2, 0, 0], 4).renderOrder = -1;
  // a skirting board all round, in Clyde's colour
  for (const [w, pos, rot] of [[2 * RW, [0, 0.12, -RD + 0.03], 0], [2 * RD, [-RW + 0.03, 0.12, 0], Math.PI / 2], [2 * RD, [RW - 0.03, 0.12, 0], -Math.PI / 2], [2 * RW, [0, 0.12, RD - 0.03], Math.PI]])
    plane(w, 0.24, tint(0xa8502e, { decal: true }), pos, [0, rot, 0], 2);
  // the lamp, on a long flex
  cyl(0.01, 0.01, 1.0, 3, tint(0x221a44), [0, H - 0.5, 2.8]);
  cyl(0.16, 0.36, 0.3, 8, tint(0xffd23a, { unlit: 0.8 }), [0, H - 1.1, 2.8]);
  // the left wall: the chalkboard with the plan, and a round window
  plane(2.6, 1.8, psx(A.chalk, { decal: true, unlit: 0.1 }), [-RW + 0.05, 2.1, -0.4], [0, Math.PI / 2, 0], 2);
  plane(1.1, 1.1, psx(A.round, { decal: true, unlit: 0.5 }), [-RW + 0.05, 2.4, 2.3], [0, Math.PI / 2, 0], 2);
  // the right wall: the bookshelf (papers on top), sticky notes, a photo of Clyde's first client
  box(0.5, 2.3, 2.0, psx(T.wood), [RW - 0.25, 1.15, 0.9]);
  plane(1.9, 1.4, psx(A.books, { unlit: 0.1 }), [RW - 0.56, 1.3, 0.9], [0, -Math.PI / 2, 0], 2);
  plane(0.8, 0.8, psx(A.notes, { decal: true }), [RW - 0.05, 2.0, -1.5], [0, -Math.PI / 2, 0], 2);
  plane(0.95, 0.9, psx(A.frame), [RW - 0.05, 2.9, 0.9], [0, -Math.PI / 2, 0], 2);
  sprite(T.sadie, 0.62, 0.5, [RW - 0.12, 3.0, 0.9], { unlit: 0.2 }).rotation.y = -Math.PI / 2;
  // by the door, more notes
  plane(0.6, 0.6, psx(A.notes, { decal: true }), [1.9, 1.8, RD - 0.05], [0, Math.PI, 0], 2);

  // ---------- the machine ----------
  plane(6.0, 3.7, psx(A.pegboard, { rx: 6.0 / 0.25, ry: 3.7 / 0.25 }), [0, 2.28, -RD + 0.05], null, 2);
  const pegEdge = tint(0x7a4a2a);
  box(6.1, 0.08, 0.1, pegEdge, [0, 4.15, -RD + 0.08]); box(6.1, 0.08, 0.1, pegEdge, [0, 0.42, -RD + 0.08]);
  sprite(A.led, 1.15, 0.26, at(-2.25, 3.93), { unlit: 0.8 }); A.count(0);
  sprite(A.title, 1.9, 0.44, at(1.85, 0.7, -0.24), { unlit: 0.2 });
  const wood = psx(T.wood, { rx: 2 }), metal = tint(0x8a88c8), ink = tint(0x221a44);

  // the lever, and the marble on its little shelf (held by a peg until the lever's pulled)
  box(0.24, 0.1, 0.16, tint(0x5e5c80), at(LEVER[0], LEVER[1] - 0.04));
  const lever = new Group(); lever.position.set(...at(...LEVER)); scene.add(lever);
  mesh(new BoxGeometry(0.04, 0.42, 0.04), metal, [0, 0.21, 0], null, lever);
  mesh(new SphereGeometry(0.07, 8, 6), tint(0xe83a3a), [0, 0.43, 0], null, lever);
  box(0.16, 0.03, 0.14, wood, at(MARBLE[0], MARBLE[1] - 0.085));
  const peg = box(0.02, 0.14, 0.06, ink, at(MARBLE[0] + 0.09, MARBLE[1]));
  const marble = mesh(new SphereGeometry(0.07, 8, 6), tint(0xff8ec8, { unlit: 0.15 }), at(...MARBLE));
  // the ramp and the dominoes' ledge
  slope(MARBLE, RAMP_END, 0.085, wood);
  box(1.08, 0.05, 0.16, wood, at(-0.96, 3.125));
  const dominoes = new Group(); scene.add(dominoes);
  const tiles = DOMINOES.map(u => {
    const p = new Group(); p.position.set(...at(u + 0.025, 3.15)); dominoes.add(p);
    mesh(new BoxGeometry(0.05, 0.22, 0.12), tint(0xfff4e4), [-0.025, 0.11, 0], null, p);
    mesh(new BoxGeometry(0.052, 0.012, 0.122), ink, [-0.025, 0.11, 0], null, p);
    return p;
  });
  const weight = new Group(); weight.position.set(...at(...WEIGHT)); scene.add(weight);
  mesh(new BoxGeometry(0.14, 0.12, 0.1), tint(0x3a3a58), [0, 0, 0], null, weight);
  mesh(new PlaneGeometry(0.14, 0.12), psx(A.weight, { unlit: 0.3 }), [0, 0, 0.052], null, weight);
  // the seesaw, the yarn on its end
  mesh(new ConeGeometry(0.12, 0.2, 3), tint(0xa8502e), at(SEE[0], SEE[1] - 0.12));
  const plank = new Group(); plank.position.set(...at(...SEE)); scene.add(plank);
  mesh(new BoxGeometry(1.1, 0.04, 0.14), wood, [0, 0, 0], null, plank);
  const yarn = mesh(new SphereGeometry(0.09, 8, 6), psx(T.rope, { tint: 0xff8ec8, rx: 2, ry: 2 }), at(...YARN));
  // the funnel (a gap), and the pipe down to the slide
  const funnel = mesh(new ConeGeometry(0.2, 0.3, 12, 1, true), tint(0xb8c0e0, { side: DoubleSide }), at(FUNNEL[0], 3.2), [Math.PI, 0, 0]);
  cyl(0.055, 0.055, 0.95, 8, metal, at(2.0, 2.58));
  slope(SLIDE[1], SLIDE[0], 0.105, wood);
  // the hamster wheel (Clyde's), its stand, and the belt to the fan
  box(0.06, 0.8, 0.04, tint(0x5e5c80), at(WHEEL[0], WHEEL[1] - 0.4, -0.06));
  mesh(new TorusGeometry(WR, 0.025, 5, 20), tint(0x2a8ad0), at(...WHEEL));
  const spokes = new Group(); spokes.position.set(...at(...WHEEL, -0.03)); scene.add(spokes);
  for (let k = 0; k < 4; k++) mesh(new BoxGeometry(2 * WR, 0.02, 0.02), tint(0x50b0f0), null, [0, 0, k * Math.PI / 4], spokes);
  const beltLen = Math.hypot(WHEEL[0] - FAN[0], WHEEL[1] - FAN[1] - 0.28);
  const belt = box(beltLen, 0.025, 0.02, ink, at((WHEEL[0] + FAN[0]) / 2, (WHEEL[1] + FAN[1] + 0.28) / 2, -0.05), [0, 0, Math.atan2(WHEEL[1] - FAN[1] - 0.28, WHEEL[0] - FAN[0])]);
  // the fan (a gap), on its shelf, turned to blow along the trough
  box(0.44, 0.04, 0.22, wood, at(FAN[0], FAN[1] - 0.02));
  const fan = new Group(); fan.position.set(...at(...FAN)); fan.rotation.y = -0.93; scene.add(fan);
  mesh(new BoxGeometry(0.07, 0.2, 0.07), tint(0x5e5c80), [0, 0.1, 0], null, fan);
  mesh(new TorusGeometry(0.19, 0.02, 4, 12), metal, [0, 0.3, 0], null, fan);
  const blades = new Group(); blades.position.set(0, 0.3, 0.01); fan.add(blades);
  for (const r of [0, Math.PI / 2]) mesh(new BoxGeometry(0.34, 0.07, 0.01), tint(0xffd23a), null, [0, 0, r], blades);
  mesh(new SphereGeometry(0.04, 6, 4), tint(0xe83a3a), [0, 0.3, 0.02], null, fan);
  // the trough of water, the paper boat, the teacup with the treat in it, the chute to the bowl
  box(1.36, 0.16, 0.3, wood, at(-1.28, 1.09));
  plane(1.3, 0.26, tint(0x40a0f0, { unlit: 0.25 }), at(-1.28, 1.175), [-Math.PI / 2, 0, 0], 2);
  const boat = sprite(A.boat, 0.36, 0.22, at(BOAT[0], 1.13, 0.02), { bottom: true });
  box(0.28, 0.06, 0.2, wood, at(CUP[0] + 0.1, CUP[1] - 0.03));
  const cup = new Group(); cup.position.set(...at(...CUP, 0.01)); scene.add(cup);
  sprite(A.cup, 0.2, 0.17, [0.1, 0, 0], { bottom: true, parent: cup });
  const treat = sprite(A.treat, 0.15, 0.09, at(...TREAT, 0.005));
  slope([-2.55, 0.4], [-2.26, 1.12], 0.03, wood);
  cyl(0.15, 0.11, 0.07, 10, tint(0xff8ec8), [BOWL[0], 0.035, MZ + BOWL[1]]);
  // Sadie's basket, and Sadie
  cyl(0.44, 0.38, 0.18, 10, psx(T.rope, { tint: 0xe8b070, rx: 5, ry: 1 }), [BASKET[0], 0.09, MZ + BASKET[1]]);
  cyl(0.38, 0.38, 0.03, 10, tint(0xff8ec8), [BASKET[0], 0.17, MZ + BASKET[1]]);
  const sadie = sprite(T.nap, 0.72, 0.58, [BASKET[0], 0.12, MZ + BASKET[1]], { bottom: true, unlit: 0.3 });
  // Clyde, in the wheel; and a heart, a puff, the treat Clyde offers
  const clyde = sprite(A.clyde.idle, 0.43, 0.5, at(WHEEL[0], WHEEL[1] - WR + 0.03, 0.03), { bottom: true, unlit: 0.35 });
  const heart = sprite(A.heart, 0.2, 0.18, [0, -9, 0], { unlit: 0.8 });
  const puff = sprite(A.what, 0.18, 0.18, [0, -9, 0], { unlit: 0.8 });
  const offered = sprite(A.treat, 0.15, 0.09, [0, -9, 0]);
  // the gaps: an outline while empty, the junk that's in one, a tag with its name, and an arrow
  const gapBits = {};
  for (const g of GAPS) {
    const s = SPOT[g];
    gapBits[g] = {
      outline: sprite(A.gap, s.w, s.h, at(...s.c, 0.06), { unlit: 0.9 }),
      junk: sprite(A.junk.duck, 0.32, 0.32, at(...s.junk, 0.08), { unlit: 0.3 }),
      tagTex: A.tag(),
    };
    gapBits[g].tag = sprite(gapBits[g].tagTex, 1.0, 0.14, at(...s.tag, 0.1), { unlit: 0.9 });
  }
  const toast = sprite(A.toast, 0.17, 0.155, [0, -9, 0], { unlit: 0.3 });
  const arrow = sprite(A.arrow, 0.18, 0.14, [0, -9, 0], { unlit: 0.9 });
  const bubble = sprite(A.bubble, 3.3, 1.04, [0, 4.85, MZ + 0.5], { unlit: 1 });
  const right = { dominoes: [dominoes], seesaw: [plank, yarn], funnel: [funnel], fan: [fan], boat: [boat], cup: [cup, treat] };

  // a slope from a to b (where a ball's middle rolls), `under` below it
  function slope(a, b, under, mat) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.08, ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    return box(len, 0.03, 0.14, mat, at((a[0] + b[0]) / 2 + Math.sin(ang) * under, (a[1] + b[1]) / 2 - Math.cos(ang) * under), [0, 0, ang]);
  }

  // ---------- the machine's state, kept in the browser ----------
  const M = makeMachine(store.get(KEY, {}) || {});
  A.count(M.treats);
  const sounds = (() => { let s = null; return () => (s ||= makeSounds()); })();
  const sfx = k => sounds()[k]();

  // ---------- putting everything back where it starts ----------
  function tidy() {
    lever.rotation.z = 0.55; peg.position.y = MARBLE[1]; peg.visible = true;
    marble.position.set(...at(...MARBLE)); marble.visible = true;
    tiles.forEach(p => { p.rotation.z = 0; });
    weight.position.set(...at(...WEIGHT)); weight.rotation.z = 0;
    plank.rotation.z = -0.2;
    yarn.position.set(...at(...YARN)); yarn.scale.setScalar(1); yarn.visible = true;
    spin.wheel = spin.fan = 0; spin.junk = null;
    boat.position.set(...at(BOAT[0], 1.13, 0.02)); boat.rotation.z = 0;
    cup.rotation.z = 0; treat.position.set(...at(...TREAT, 0.005)); treat.visible = true; treat.scale.setScalar(1);
    clyde.position.set(...at(WHEEL[0], WHEEL[1] - WR + 0.03, 0.03)); clyde.scale.x = 1;
    offered.position.y = -9;
    sadie.position.set(BASKET[0], 0.12, MZ + BASKET[1]); sadie.scale.x = 1; naps = true;
    for (const g of GAPS) { const j = gapBits[g].junk; j.rotation.z = 0; j.scale.set(1, 1, 1); j.position.set(...at(...SPOT[g].junk, 0.08)); }
    react = null; toast.position.y = -9;
    showGaps();
  }
  const spin = { wheel: 0, fan: 0, junk: null }, wobble = {};
  let react = null;   // the junk the machine's just bumped into, doing its thing (reactions.js)
  let naps = true;
  function showGaps() {
    for (const g of GAPS) {
      const b = gapBits[g], p = partIn(M, g), gone = !!M.gaps[g];
      for (const o of right[g]) o.visible = p === g;
      b.outline.visible = gone && p === null;
      b.junk.visible = gone && p !== null && p !== g;
      if (b.junk.visible) b.junk.material.uniforms.map.value = A.junk[p];
      b.tag.visible = gone;
      if (gone) A.label(b.tagTex, p);
    }
  }

  // ---------- the timeline: one thing after another ----------
  let tl = [], speed = 1;
  const step = (dur, fn, o = {}) => tl.push({ dur, fn, t: 0, ...o });
  const now = fn => step(0, null, { start: fn });
  const wait = s => step(s);
  let talkUntil = 0, clock = 0;
  const say = text => step(1.6 + text.length * 0.045, null, { line: true, start: () => { A.say(text); talkUntil = clock + text.length * 0.035; } });
  const lerp = (a, b, k) => a + (b - a) * k, ease = k => k * k * (3 - 2 * k);
  const move = (o, from, to, dz = 0) => k => o.position.set(...at(lerp(from[0], to[0], k), lerp(from[1], to[1], k), dz));
  const arc = (o, a, b, peak, dz = 0) => k => o.position.set(...at(lerp(a[0], b[0], k), lerp(a[1], b[1], k) + Math.sin(k * Math.PI) * peak, dz));
  function advance(dt) {
    while (tl.length) {
      const s = tl[0];
      if (!s.started) { s.started = true; s.start?.(); }
      s.t += dt; dt = 0;
      const k = s.dur ? Math.min(1, s.t / s.dur) : 1;
      s.fn?.(k);
      if (k < 1) return;
      tl.shift(); s.end?.();
    }
  }
  let phase = 'ready', mood = null;   // phase: 'ready' (pick parts, pull the lever), 'running', 'talking'
  let focus = 0, sel = 0, greeted = false;
  const targets = () => [...missing(M), 'lever'];

  // ---------- pulling the lever ----------
  function pull() {
    if (phase !== 'ready') return;
    phase = 'running'; arrow.position.y = -9;
    const { steps, fail } = run(M);
    const did = s => steps.includes(s);
    A.say(L.BUSY);
    // the lever, and the marble down the ramp
    step(0.35, k => { lever.rotation.z = lerp(0.55, -0.55, ease(k)); focus = LEVER[0]; }, { start: () => sfx('clunk'), end: () => { peg.position.y = MARBLE[1] - 0.15; } });
    step(0.55, k => { move(marble, MARBLE, RAMP_END)(k * k); focus = marble.position.x; });
    // the dominoes (or whatever's in their gap)
    if (did('dominoes')) {
      step(0.18, move(marble, RAMP_END, [DOMINOES[0] - 0.1, RAMP_END[1]]));
      now(() => sfx('clatter'));
      tiles.forEach((p, i) => step(0.09, k => { p.rotation.z = -(i === tiles.length - 1 ? 1.3 : 1.0) * ease(k); focus = p.position.x; }));
      step(0.12, move(weight, WEIGHT, [-0.42, WEIGHT[1]]));
      step(0.22, k => weight.position.set(...at(lerp(-0.42, -0.45, k), lerp(WEIGHT[1], 2.79, k * k))));
    } else return failAt('dominoes', fail.part, () => {
      const to = fail.part ? SPOT.dominoes.junk[0] - 0.24 : WEIGHT[0] - 0.14;
      step(0.25, move(marble, RAMP_END, [to, RAMP_END[1]]), { end: () => poke('dominoes', fail.part) });
      step(0.3, move(marble, [to, RAMP_END[1]], [to - 0.08, RAMP_END[1]]));
    });
    // the seesaw flings the yarn (or the weight lands on whatever's there instead)
    if (!did('seesaw')) return failAt('seesaw', fail.part, () => {
      if (fail.part) now(() => poke('seesaw', fail.part));
      else step(0.25, k => { weight.position.y = lerp(2.79, 2.3, k * k); weight.rotation.z = k * 0.6; }, { end: () => poke('seesaw', null) });
      wait(0.5);
    });
    now(() => sfx('boing'));
    step(0.12, k => { plank.rotation.z = lerp(-0.2, 0.25, k); weight.position.y = lerp(2.79, 2.6, k); yarn.position.y = lerp(YARN[1], 2.85, k); });
    const launch = [YARN[0], 2.85];
    if (did('funnel')) {
      step(0.85, k => { const a = arc(yarn, launch, FUNNEL, 0.9); a(k); focus = yarn.position.x; });
      step(0.2, k => { yarn.position.y = FUNNEL[1] - k * 0.2; yarn.scale.setScalar(1 - k * 0.6); });
      now(() => { yarn.visible = false; sfx('fwoop'); }); wait(0.45);
      now(() => { yarn.visible = true; yarn.scale.setScalar(1); yarn.position.set(...at(...PIPE_OUT)); });
    } else return failAt('funnel', fail.part, () => {
      step(0.85, k => { arc(yarn, launch, FUNNEL, 0.9)(k); focus = yarn.position.x; }, { end: () => poke('funnel', fail.part) });
      const land = fail.part ? [2.6, 0.1] : [2.3, 0.1];
      step(0.7, k => yarn.position.set(...at(lerp(FUNNEL[0], land[0], k), lerp(FUNNEL[1], land[1], k * k) + Math.sin(k * Math.PI) * (fail.part ? 0.35 : 0), 0.2 * k)));
    });
    // down the slide into the wheel: Clyde starts running
    step(0.12, move(yarn, PIPE_OUT, SLIDE[0]));
    step(0.45, k => { move(yarn, SLIDE[0], SLIDE[1])(k * k); focus = yarn.position.x; }, { end: () => { puffAt(A.bang, WHEEL[0] + 0.3, WHEEL[1] + 0.35); spin.wheel = 1; } });
    wait(0.35);
    if (did('fan')) {
      step(0.3, k => { spin.fan = k; focus = lerp(WHEEL[0], FAN[0], k); }, { start: () => sfx('whoosh') });
    } else return failAt('fan', fail.part, () => {
      step(1.6, k => { focus = lerp(WHEEL[0], FAN[0], Math.min(1, k * 2)); if (fail.part) spin.junk = 'fan'; }, { end: () => poke('fan', fail.part) });
      now(() => { spin.wheel = 0; spin.junk = null; });
    });
    // the boat across the trough (or the duck, which floats), into the cup, which tips the treat down the chute
    const ducky = partIn(M, 'boat') === 'duck', sails = ducky ? gapBits.boat.junk : boat, sy = ducky ? SPOT.boat.junk[1] : 1.13;
    if (!did('boat')) return failAt('boat', fail.part, () => {
      step(1.2, k => { if (fail.part) gapBits.boat.junk.rotation.z = Math.sin(k * 30) * 0.08; focus = lerp(FAN[0], BOAT[0], Math.min(1, k * 2)); }, { end: () => poke('boat', fail.part) });
      now(() => { spin.wheel = 0; spin.fan = 0; });
    });
    now(() => sfx(ducky ? 'squeak' : 'bloop'));
    const sailTo = did('cup') ? BOAT[1] : fail.part ? -1.68 : -1.8;
    step(1.3 * (BOAT[0] - sailTo) / (BOAT[0] - BOAT[1]), k => { sails.position.set(...at(lerp(BOAT[0], sailTo, k), sy + Math.sin(k * 20) * 0.01, ducky ? 0.08 : 0.02)); sails.rotation.z = Math.sin(k * 14) * 0.06; focus = sails.position.x; });
    if (!did('cup')) return failAt('cup', fail.part, () => {
      now(() => { poke('cup', fail.part); spin.wheel = 0; spin.fan = 0; });
      wait(0.6);
    });
    step(0.3, k => { cup.rotation.z = 1.4 * ease(k); }, { start: () => sfx('clink') });
    step(0.22, arc(treat, TREAT, [-2.28, 1.16], 0.08, 0.005));
    step(0.35, k => { move(treat, [-2.28, 1.16], [-2.54, 0.44], 0.005)(k * k); focus = -2.3; });
    step(0.25, k => treat.position.set(BOWL[0], lerp(0.44, 0.1, k * k), MZ + lerp(0.005, BOWL[1], k)), { end: () => { sounds().chime(); spin.wheel = 0; spin.fan = 0; mood = 'happy'; } });
    // Sadie wakes, and has her breakfast
    now(() => { naps = false; });
    wait(0.4);
    now(() => sfx('mrrp'));
    step(0.7, k => { sadie.position.set(lerp(BASKET[0], BOWL[0] + 0.45, k), 0.12 * (1 - k), MZ + lerp(BASKET[1], BOWL[1] + 0.12, k)); sadie.position.y += Math.abs(Math.sin(k * 9)) * 0.03; });
    step(1.3, k => { sadie.position.y = Math.abs(Math.sin(k * 16)) * 0.03; treat.scale.setScalar(1 - k); }, { end: () => { treat.visible = false; puffAt(A.heart, BOWL[0] + 0.45, 0.8, MZ + BOWL[1] + 0.2); } });
    now(() => {
      const what = won(M); store.set(KEY, saveOf(M)); A.count(M.treats);
      if (ducky) for (const l of L.DUCK) say(l);
      afterWin(what);
    });
  }
  // a run that stops at a gap: the bit that plays up to it, then what Clyde makes of it
  function failAt(gap, part, play) {
    play();
    now(() => { mood = 'oops'; spin.wheel = 0; });
    say(L.FAIL[part]);
    say(L.TRY_AGAIN[Math.floor(Math.random() * L.TRY_AGAIN.length)]);
    now(() => { mood = null; tidy(); ready(); });
  }
  // something bumps into what's in a gap: the junk does its own thing, or (if nothing's there) a
  // question mark
  function poke(gap, part) {
    const [u, v] = SPOT[gap].c;
    if (!part) {
      sfx('bonk'); puffAt(A.what, u + 0.2, v + 0.25);
      if (gap === 'dominoes') wobble.weight = 1;
      return;
    }
    const r = REACT[part];
    react = { gap, part, t: 0 };
    spin.junk = null; gapBits[gap].junk.rotation.z = 0;
    if (r.sound) sfx(r.sound);
    if (r.puff) { const [x, y] = SPOT[gap].junk; puffAt(A[r.puff], x + 0.22, y + 0.25); }
  }
  // (every frame, while it's at it)
  function reacting(dt) {
    const r = REACT[react.part], j = gapBits[react.gap].junk, [bu, bv] = SPOT[react.gap].junk;
    react.t += dt;
    const k = Math.min(1, react.t / r.dur), p = r.pose(k);
    j.position.set(...at(bu + p.x, bv + p.y, 0.08)); j.rotation.z = p.rot; j.scale.set(p.sx, p.sy, 1);
    if (r.toast) toast.position.set(...at(bu, bv + r.toast(k), 0.075));
    if (r.lit) j.material.uniforms.map.value = r.lit(k) ? A.lit : A.junk[react.part];
    if (r.sadie) naps = !r.sadie(k);
  }
  let puffT = 0;
  function puffAt(t, u, v, z = MZ + 0.15) { const p = t === A.heart ? heart : puff; p.material.uniforms.map.value = t; p.position.set(u, v, z); p.userData.t = 0; puffT = 0; }

  function afterWin(what) {
    step(0.7, k => { sadie.position.set(lerp(BOWL[0] + 0.45, BASKET[0], k), 0.12 * k, MZ + lerp(BOWL[1] + 0.12, BASKET[1], k)); sadie.scale.x = -1; });
    now(() => { sadie.scale.x = 1; naps = true; mood = null; });
    if (what === 'next') for (const l of L.NEXT[M.round - 1]) say(l);
    else if (what === 'again') say(L.AGAIN[Math.floor(Math.random() * L.AGAIN.length)]);
    else finale();
    now(() => { sel = 0; tidy(); ready(); });
  }
  // The finale (the first time the fourth round works): Clyde has an idea, hops out of the
  // wheel and offers Sadie the treat directly. She turns her back on it and goes to sit by the
  // machine. She wants the machine.
  function finale() {
    say(L.FINALE.ate); say(L.FINALE.wait);
    now(() => { mood = 'think'; sfx('idea'); }); say(L.FINALE.idea);
    const wheelAt = [WHEEL[0], WHEEL[1] - WR + 0.03], by = [BASKET[0] + 0.75, 0], BY = 0.5;
    now(() => { mood = 'run'; });
    step(0.9, k => { clyde.position.set(lerp(wheelAt[0], by[0], k), lerp(wheelAt[1], 0, k) + Math.sin(k * Math.PI) * 0.4, MZ + lerp(0.03, BY, k)); focus = clyde.position.x; });
    now(() => { mood = 'happy'; offered.position.set(by[0] - 0.24, 0.3, MZ + BY + 0.05); naps = false; });
    say(L.FINALE.offer);
    step(0.4, k => { sadie.scale.x = k < 0.5 ? 1 : -1; }, { start: () => sfx('mew') });
    step(1.2, k => { sadie.position.set(lerp(BASKET[0], SADIE_SITS[0], k), Math.abs(Math.sin(k * 12)) * 0.03, MZ + lerp(BASKET[1], SADIE_SITS[1], k)); focus = sadie.position.x; },
      { end: () => { sadie.scale.x = 1; puffAt(A.heart, SADIE_SITS[0], 0.85, MZ + SADIE_SITS[1] + 0.1); } });
    now(() => { mood = 'oops'; }); say(L.FINALE.snub);
    now(() => { mood = 'think'; }); say(L.FINALE.wants);
    now(() => { mood = 'happy'; }); say(L.FINALE.fine);
    now(() => { mood = 'run'; offered.position.y = -9; });
    step(0.9, k => { clyde.position.set(lerp(by[0], wheelAt[0], k), lerp(0, wheelAt[1], k) + Math.sin(k * Math.PI) * 0.4, MZ + lerp(BY, 0.03, k)); focus = clyde.position.x; });
    step(1.2, k => { sadie.position.set(lerp(SADIE_SITS[0], BASKET[0], k), 0.12 * k + Math.abs(Math.sin(k * 12)) * 0.03, MZ + lerp(SADIE_SITS[1], BASKET[1], k)); });
    now(() => { mood = null; });
  }

  function ready() {
    phase = 'ready';
    const t = targets(); sel = Math.min(sel, t.length - 1);
    A.say(L.HOWTO[missing(M).length]);
  }
  // pick a gap (or the lever), and swap what's in it
  function choose(i) { const t = targets(); sel = (i + t.length) % t.length; }
  function swapIn(g, by) { sfx(swap(M, g, by) === 'duck' ? 'squeak' : 'pop'); showGaps(); const j = gapBits[g].junk; j.scale.setScalar(1.3); }
  function press(target, by = 1) {
    if (phase === 'talking' || (phase === 'running' && tl[0]?.line)) { skip(); return; }
    if (phase !== 'ready') return;
    if (target === 'lever') pull(); else if (target) { choose(targets().indexOf(target)); swapIn(target, by); }
  }
  // pressing anything while Clyde's talking moves things on
  function skip() { if (tl[0]?.line) tl[0].t = tl[0].dur; }
  const talking = () => !!tl[0]?.line;

  // where on the machine a press is (u, v), from a line out of the camera
  function onMachine(r) {
    if (!r || Math.abs(r.dir.z) < 1e-4) return null;
    const k = (MZ - r.origin.z) / r.dir.z; if (k < 0) return null;
    return [r.origin.x + r.dir.x * k, r.origin.y + r.dir.y * k];
  }
  function under([u, v]) {
    let best = null, d = 0.5;
    for (const g of missing(M)) { const e = Math.hypot(u - SPOT[g].c[0], v - SPOT[g].c[1]); if (e < d) { d = e; best = g; } }
    const e = Math.hypot(u - LEVER[0], v - LEVER[1] - 0.2); if (e < Math.max(d, 0.45)) best = 'lever';
    return best;
  }

  // ---------- stepping up to it ----------
  const view = { center: new Vector3(0, 2.75, MZ), normal: new Vector3(0, 0, 1), w: 6.4, h: 6.1 };
  const narrow = () => (globalThis.innerWidth || 1) / (globalThis.innerHeight || 1) < 1.25;
  const touches = new Map();
  const KEYS = ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'KeyE'];
  let playing = false;
  const machine = {
    label: 'PLAY THE GOOD MORNING MACHINE', view,
    hint: {
      keys: '<kbd>A D</kbd> PICK A GAP &nbsp; <kbd>W S</kbd> SWAP PART &nbsp; <kbd>SPACE</kbd> PULL LEVER &nbsp; <kbd>ESC</kbd> STEP BACK',
      touch: 'TAP A GAP: SWAP &middot; TAP THE LEVER &middot; SWIPE',
    },
    start() {
      sounds().wake(); playing = true;
      if (!greeted && phase === 'ready') {
        greeted = true; phase = 'talking'; sfx('hello');
        for (const l of M.treats ? L.HELLO_AGAIN : L.HELLO) say(l);
        now(() => ready());
      } else if (phase === 'ready') ready();
    },
    stop() { playing = false; touches.clear(); },
    key(code, down, repeat) {
      if (!KEYS.includes(code)) return false;
      if (!down || repeat) return true;
      const t = targets();
      if (talking() || phase === 'talking') { skip(); return true; }
      if (phase !== 'ready') return true;
      switch (code) {
        case 'KeyA': case 'ArrowLeft': choose(sel - 1); return true;
        case 'KeyD': case 'ArrowRight': choose(sel + 1); return true;
        case 'KeyW': case 'ArrowUp': case 'KeyE': press(t[sel], 1); return true;
        case 'KeyS': case 'ArrowDown': if (t[sel] !== 'lever') press(t[sel], -1); return true;
        case 'Space': case 'Enter': pull(); return true;
      }
      return false;
    },
    touch(id, r, kind) {
      if (kind === 'down') { const p = onMachine(r); touches.set(id, { from: p, last: p, cx: view.center.x }); return; }
      const tc = touches.get(id); if (!tc) return;
      if (kind === 'move') {
        const p = onMachine(r); if (!p || !tc.from) return;
        // (measured against where the view was, since the view follows a swipe)
        tc.last = [p[0] + (tc.cx - view.center.x), p[1]];
        return;
      }
      touches.delete(id);
      if (!tc.from) return;
      const dx = tc.last[0] - tc.from[0];
      if (Math.abs(dx) > 0.35 && narrow() && phase === 'ready') { choose(sel + (dx < 0 ? 1 : -1)); return; }
      if (talking() || phase === 'talking') { skip(); return; }
      press(under(tc.from));
    },
  };

  // ---------- every frame ----------
  let blinkAt = 3, runT = 0;
  const place = {
    name: 'room:' + card.id, card, scene, doors: { door }, faces: [sadie], house,
    uses: [{ pos: new Vector3(0, 2.2, MZ), reach: 7.5, label: machine.label, play: machine }],
    light: { sun: 0.25, bulb: 0.8, lamp: [0, H - 1.4, 1.5] },
    spots: {
      door: { x: 0, z: RD - 1.2, yaw: 0, pitch: 0, y: 0 },
      machine: { x: 0, z: MZ + 3.2, yaw: 0, pitch: 0.12, y: 0 },
    },
    floor(x, z) {
      const P = 0.35;
      if (Math.abs(x) > RW - P || Math.abs(z) > RD - P) return null;
      if (z < MZ + 1.05 + P) return null;                                     // the machine, Sadie and her bowl
      if (x > RW - 0.5 - P && z > -0.1 - P && z < 1.9 + P) return null;       // the bookshelf
      return 0;
    },
    update(t, dt = 0) {
      clock = t;
      const e = m.ears();
      house?.update(t, dt, e);
      const here = e && e.place === place;
      if (!here && !tl.length) return;
      dt *= speed;
      advance(dt);
      if (phase === 'running' && !tl.length) phase = 'ready';
      if (phase === 'talking' && !tl.length) ready();
      // the bubble: what Clyde's saying (just a hello from across the room until you step up)
      if (!playing && !tl.length && phase === 'ready') A.say(greeted ? L.HOWTO[missing(M).length] : L.PEEK);
      // the view: all of it on a wide screen; on a narrow one, closer, following what's happening
      if (narrow()) {
        if (phase === 'ready') { const g = targets()[sel]; focus = g === 'lever' ? LEVER[0] : SPOT[g].c[0]; }
        view.w = 3.3; view.center.x += (Math.max(-2.1, Math.min(2.1, focus)) - view.center.x) * Math.min(1, dt * 4);
      } else { view.w = 6.4; view.center.x = 0; }
      bubble.position.x = playing ? view.center.x : 0;
      // the arrow over what you've picked (not needed with a finger)
      const tg = targets()[sel];
      if (playing && phase === 'ready' && tg) {
        const [u, v] = tg === 'lever' ? [LEVER[0], LEVER[1] + 0.62] : [SPOT[tg].c[0], SPOT[tg].c[1] + SPOT[tg].h / 2 + 0.12];
        arrow.position.set(...at(u, v + Math.sin(t * 6) * 0.03, 0.12));
      } else arrow.position.y = -9;
      // things turning, wobbling, popping
      if (spin.wheel) { spokes.rotation.z += dt * 9; belt.rotation.x = Math.sin(t * 30) * 0.3; }
      if (spin.fan) blades.rotation.z += dt * 25 * spin.fan;
      if (spin.junk) gapBits[spin.junk].junk.rotation.z += dt * 10;
      if (react) reacting(dt);
      for (const g of GAPS) {
        const j = gapBits[g].junk;
        if (react?.gap !== g) j.scale.setScalar(Math.max(1, j.scale.x - dt * 1.5));
        gapBits[g].outline.material.uniforms.uFade.value = gapBits[g].outline.visible && Math.floor(t * 2.5) % 2 ? 0.5 : 0;
      }
      if (wobble.weight > 0) { wobble.weight = Math.max(0, wobble.weight - dt); weight.rotation.z = Math.sin(t * 30) * 0.08 * wobble.weight; }
      for (const p of [heart, puff]) if (p.position.y > -5) {
        p.userData.t += dt; p.position.y += dt * 0.35;
        p.material.uniforms.uFade.value = Math.max(0, p.userData.t - 0.6);
        if (p.userData.t > 1.8) p.position.y = -9;
      }
      // Clyde: running in the wheel, or in a mood, or talking, or just blinking now and then
      let face = 'idle';
      runT += dt;
      if (spin.wheel || mood === 'run') face = Math.floor(runT * 10) % 2 ? 'run1' : 'run2';
      else if (mood) face = mood;
      else if (clock < talkUntil) face = Math.floor(t * 7) % 2 ? 'talk' : 'idle';
      else if (t > blinkAt) { face = 'blink'; if (t > blinkAt + 0.15) blinkAt = t + 2.5 + Math.random() * 3; }
      clyde.material.uniforms.map.value = A.clyde[face];
      sadie.material.uniforms.map.value = naps ? T.nap : T.sadie;
    },
  };
  tidy();
  A.say(L.PEEK);

  // for the checks (tests/clydes-house/browser.mjs)
  globalThis.__clydesHouse = {
    state: () => ({
      round: M.round, treats: M.treats, finale: M.finale, phase, lines: tl.filter(s => s.line).length,
      missing: missing(M), parts: Object.fromEntries(GAPS.map(g => [g, partIn(M, g)])), options: Object.fromEntries(missing(M).map(g => [g, M.gaps[g].parts])),
      picked: targets()[sel], sounds: sounds().played, heard: [...new Set(sounds().log)], naps, view: { x: view.center.x, w: view.w },
    }),
    speed(k) { speed = k; },
    // (for tools/clydes-house/junk.mjs) put this bit of junk in the first empty gap
    junk(part) { const g = missing(M)[0], x = M.gaps[g]; x.parts[x.parts.findIndex(p => p !== g)] = part; x.pick = x.parts.indexOf(part); showGaps(); return g; },
  };
  return place;
}
