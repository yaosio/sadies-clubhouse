// Clyde's house from outside, on its plot along the lane outside the front gate: The Overthinkery,
// a tall crooked cottage (each storey a little more off-true than the one below, since thinking goes
// up), with terracotta tiles, a round window, a chimney that puffs out question marks, a mailbox,
// a sign by the lane, and Clyde by the front door, who waves when you come up the path. Beside it,
// Clyde's Weather Machine (weather-machine.js).
//
// Built into the outside's own scene, in a group of its own (the mansion hands the room this place and the plot); the
// front door is a doorway into the room, like every door in the mansion.
import { Group, Mesh, PlaneGeometry, BoxGeometry, ConeGeometry, DoubleSide } from 'three';
import { buildWeather } from './weather-machine.js';

export const DW = 1.3, DH = 2.3;   // the front door

export function buildHouse(m, A) {
  const { T, psx, keep, kit, wallGeometry, doorway, outside, lot } = m;
  // (all in one group, so the mansion can swap it for a plain stand-in when you're far off)
  const scene = new Group(); outside.add(scene);
  const { add, box, plane, ball } = kit(scene);
  const hx = lot.x, hz = lot.z, W = 5.4, D = 5, H1 = 3.6;
  // (it faces the gate, away from the sun, so it's lit a little from within: never drab)
  const siding = (w, h) => psx(A.siding, { rx: w / 1.6, ry: h / 1.6, unlit: 0.35 });
  const tiles = (rx, ry) => psx(A.tiles, { rx, ry, unlit: 0.3 });
  const mesh = (geo, mat, pos, rot, parent) => { const o = new Mesh(keep(geo), mat); if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); parent.add(o); return o; };

  // ---------- the ground floor, with the front door ----------
  const front = add(new Mesh(wallGeometry(W, H1, DW, DH), psx(A.siding, { rx: 1 / 1.6, ry: 1 / 1.6, unlit: 0.35 })), [hx, 0, hz]);
  plane(D, H1, siding(D, H1), [hx - W / 2, H1 / 2, hz - D / 2], [0, -Math.PI / 2, 0]);
  plane(D, H1, siding(D, H1), [hx + W / 2, H1 / 2, hz - D / 2], [0, Math.PI / 2, 0]);
  plane(W, H1, siding(W, H1), [hx, H1 / 2, hz - D], [0, Math.PI, 0]);
  const door = doorway(scene, { pos: [hx, 0, hz], yaw: 0, w: DW, h: DH, leaves: [{ front: A.door, back: A.doorBack }], hinge: -1, trim: 0xd97757 });
  door.group.traverse(o => { if (o.material?.uniforms?.uUnlit && !o.material.uniforms.pic) o.material.uniforms.uUnlit.value = 0.3; });
  // the see-through box behind the door sits a hair above the grass, which runs on under the house:
  // level with it, the grass flickered through the floor of the room you see through the door
  door.see.position.y += 0.03;
  for (const s of [-1, 1]) plane(0.8, 1.0, psx(A.window, { unlit: 0.5 }), [hx + s * 1.75, 1.6, hz + 0.08], null, 1);
  box(1.9, 0.1, 0.8, tiles(2, 1), [hx, DH + 0.3, hz + 0.4]);                    // a little awning over the door
  for (const s of [-1, 1]) box(0.06, 0.3, 0.5, psx(null, { tint: 0xa8502e }), [hx + s * 0.85, DH + 0.15, hz + 0.25]);
  plane(1.0, 0.4, psx(A.mat, { onFloor: true }), [hx, 0, hz + 0.6], [-Math.PI / 2, 0, 0], 1).renderOrder = -1;
  const roof = cone(4.1, 1.2, [hx, H1 + 0.6, hz - D / 2], tiles(6, 3), scene);

  // ---------- the storey above, a little off-true, and the turret on it, more so ----------
  const up = new Group(); up.position.set(hx + 0.15, H1, hz - 2.4); up.rotation.set(0, 0.1, 0.035); scene.add(up);
  mesh(new BoxGeometry(4.2, 2.4, 4.0, 2, 2, 2), siding(4.2, 2.4), [0, 1.2, 0], null, up);
  mesh(new PlaneGeometry(1.3, 1.3), psx(A.round, { unlit: 0.35 }), [0, 1.25, 2.08], null, up);
  cone(3.4, 1.5, [0, 3.15, 0], tiles(5, 3), up);
  const tur = new Group(); tur.position.set(-0.9, 2.4, -0.3); tur.rotation.set(0, -0.25, -0.07); up.add(tur);
  mesh(new BoxGeometry(1.4, 2.0, 1.4, 2, 2, 2), siding(1.4, 2), [0, 1.0, 0], null, tur);
  mesh(new PlaneGeometry(0.6, 0.6), psx(A.round, { unlit: 0.35 }), [0, 1.2, 0.77], null, tur);
  cone(1.3, 1.5, [0, 2.75, 0], tiles(2, 2), tur);
  // a spark for a weathervane, turning in the breeze
  const vane = mesh(new PlaneGeometry(0.5, 0.5), psx(A.spark, { side: DoubleSide, unlit: 0.5 }), [0, 3.75, 0], null, tur);
  mesh(new BoxGeometry(0.03, 0.5, 0.03), psx(null, { tint: 0x221a44 }), [0, 3.4, 0], null, tur);

  // ---------- the chimney: it puffs out what Clyde's thinking ----------
  box(0.5, 1.8, 0.5, psx(T.brick, { rx: 1, ry: 2 }), [hx + 1.9, H1 + 0.6, hz - 4.0]);
  const puffs = [A.what, A.bang, A.spark, A.what].map((t, i) => {
    const p = new Mesh(keep(new PlaneGeometry(0.4, 0.4)), psx(t, { unlit: 0.6 }));
    p.userData.phase = i / 4; scene.add(p); return p;
  });

  // ---------- the path from the lane, the mailbox, the sign, a bush either side ----------
  plane(1.3, 4.8, psx(T.path, { rx: 1, ry: 3, onFloor: true }), [hx, 0, hz + 2.4 + 0.02], [-Math.PI / 2, 0, 0], 4).renderOrder = -1;
  const post = psx(T.wood, { tint: 0xffe0c0 });
  box(0.08, 1.0, 0.08, post, [hx + 1.4, 0.5, hz + 3.0]);
  box(0.5, 0.3, 0.3, psx(null, { tint: 0xd97757 }), [hx + 1.4, 1.1, hz + 3.0]);
  plane(0.5, 0.2, psx(A.mailbox, { unlit: 0.5 }), [hx + 1.4, 1.1, hz + 3.16], null, 1);
  for (const s of [-1, 1]) box(0.1, 1.7, 0.1, post, [hx - 1.6 + s * 0.8, 0.85, hz + 4.3]);
  plane(1.9, 0.75, psx(A.houseSign, { side: DoubleSide, unlit: 0.5 }), [hx - 1.6, 1.3, hz + 4.36], null, 1);
  const leaf = psx(T.leaf, { rx: 2, ry: 2 });
  for (const s of [-1, 1]) { ball(0.55, leaf, [hx + s * 2.3, 0.45, hz + 0.45], 0.9); outside.blockRound(hx + s * 2.3, hz + 0.45, 0.5); }

  // ---------- Clyde, by the door, and what Clyde says when you come up the path ----------
  const me = new Mesh(keep(new PlaneGeometry(0.62, 0.72).translate(0, 0.36, 0)), psx(A.clyde.idle, { unlit: 0.6 }));
  me.position.set(hx + 1.05, 0, hz + 0.9); scene.add(me);
  const hi = new Mesh(keep(new PlaneGeometry(0.95, 0.31).translate(0.3, 0.155, 0)), psx(A.greet, { unlit: 0.8 }));
  hi.position.set(hx + 1.05, 0.8, hz + 0.9); hi.visible = false; scene.add(hi);
  outside.face(me, hi, ...puffs);

  // what's solid: the house, the mailbox, the sign
  outside.block(hx - W / 2, hx + W / 2, hz - D, hz);
  outside.blockRound(hx + 1.4, hz + 3.0, 0.2);
  outside.blockRound(hx + 1.05, hz + 0.9, 0.25);
  outside.block(hx - 2.5, hx - 0.7, hz + 4.25, hz + 4.35);

  // ---------- beside the house: Clyde's Weather Machine (weather-machine.js) ----------
  const weather = buildWeather(m, scene);

  let blinkAt = 2;
  return {
    door, clyde: me, group: scene,
    // from far off it's drawn as a plain block: the size of the house itself (not the path, the sign
    // or the mailbox), in the colour of its walls
    body: [front, roof, up], farTint: 0xd9a55a,
    // every frame: the puffs rise and fade, the vane turns, and Clyde waves when you're close
    update(t, dt, ears) {
      weather.update(t, dt, ears);
      vane.rotation.y = Math.sin(t * 0.4) * 1.2;
      for (const p of puffs) {
        const k = (t / 7 + p.userData.phase) % 1;
        p.position.set(hx + 1.9 + Math.sin(k * 5 + p.userData.phase * 9) * 0.3, H1 + 1.6 + k * 2.6, hz - 4.0);
        p.scale.setScalar(0.5 + k * 0.8);
        p.material.uniforms.uFade.value = Math.max(0, k * 1.3 - 0.35);
      }
      const near = ears && outside.is(ears.place) && Math.hypot(ears.x - me.position.x, ears.z - me.position.z) < 7;
      hi.visible = near;
      let mood = 'idle';
      if (near) mood = Math.floor(t * 3) % 2 ? 'wave' : 'happy';
      else if (t > blinkAt) { mood = 'blink'; if (t > blinkAt + 0.15) blinkAt = t + 2 + Math.random() * 3; }
      me.material.uniforms.map.value = A.clyde[mood];
    },
  };

  // a four-sided roof, r out to its corners (turned so its sides face the walls)
  function cone(r, h, pos, mat, parent) { return mesh(new ConeGeometry(r, h, 4, 2), mat, pos, [0, Math.PI / 4, 0], parent); }
}
