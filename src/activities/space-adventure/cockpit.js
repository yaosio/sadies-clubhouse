// The cockpit of Sadie's spaceship, the SADIE-1: what you see as soon as the door opens. Purple
// panelled walls, a metal floor, the pilot's seat in the middle (with its back to the door) facing a
// wide windscreen, the dashboard under it (screens, a radar, rows of blinking lights), a control stick,
// consoles down the sides, and a SPACE CADET poster and Sadie's food bowl by the door. The windows are
// just holes: space (or the land) is drawn behind everything.
//
// Also here: the glow and the clouds outside the windows on the way in (a box round the cockpit,
// drawn in see-through dots, `weather`).
import { Group, Mesh, BoxGeometry, BackSide } from 'three';
import { RW, RD, RH, DASH, STICK } from './trip.js';

export const WIN = { bottom: DASH.top, top: 2.45, front: 2.6, side: 0.5 };   // the windows: from, to, the front wall, where the side ones start

export function buildCockpit(m, P) {
  const { psx, kit, wallGeometry } = m;
  const cockpit = new Group();
  const { add, box, plane, cyl, ball } = kit(cockpit);
  const panel = (w, h) => psx(P.panel, { rx: w / 1.6, ry: h / 1.6 });
  const metal = psx(null, { tint: 0x5e5c80 }), dark = psx(null, { tint: 0x2a1e6a }), trim = psx(null, { tint: 0xffd23a });

  // floor and ceiling
  plane(2 * RW, RD + WIN.front, psx(P.grate, { rx: 2 * RW / 0.8, ry: (RD + WIN.front) / 0.8 }), [0, 0, (WIN.front - RD) / 2], [-Math.PI / 2, 0, 0], 6).renderOrder = -2;
  plane(2 * RW, RD + WIN.front, psx(P.ceiling, { rx: 2 * RW / 0.8, ry: (RD + WIN.front) / 0.8 }), [0, RH, (WIN.front - RD) / 2], [Math.PI / 2, 0, 0], 6);
  // the back wall, with the door in it
  add(new Mesh(wallGeometry(2 * RW, RH, 1.5, 2.45), panel(2 * RW, RH)), [0, 0, -RD]);
  // the side walls: solid at the back, windows at the front
  for (const s of [-1, 1]) {
    const back = WIN.side + RD, rot = [0, -s * Math.PI / 2, 0];
    plane(back, RH, panel(back, RH), [s * RW, RH / 2, (WIN.side - RD) / 2], rot, 4);
    const fl = WIN.front - WIN.side, mid = (WIN.front + WIN.side) / 2;
    plane(fl, WIN.bottom, panel(fl, WIN.bottom), [s * RW, WIN.bottom / 2, mid], rot, 2);
    plane(fl, RH - WIN.top, panel(fl, RH - WIN.top), [s * RW, (RH + WIN.top) / 2, mid], rot, 2);
    for (const z of [WIN.side, (WIN.side + WIN.front) / 2, WIN.front]) box(0.12, WIN.top - WIN.bottom, 0.12, metal, [s * (RW - 0.02), (WIN.top + WIN.bottom) / 2, z]);
    // a console along each side, under the windows
    box(0.5, 0.8, 1.9, metal, [s * (RW - 0.25), 0.4, 1.35]);
    plane(1.9, 0.3, psx(P.dashTop, { rx: 3 }), [s * (RW - 0.5), 0.82, 1.35], [-Math.PI / 2 + 0.5, -s * Math.PI / 2, 0], 2);
  }
  // the front: under the windscreen, the frame round it, its struts
  plane(2 * RW, WIN.bottom, panel(2 * RW, 1), [0, WIN.bottom / 2, WIN.front], [0, Math.PI, 0], 2);
  plane(2 * RW, RH - WIN.top, panel(2 * RW, 1), [0, (RH + WIN.top) / 2, WIN.front], [0, Math.PI, 0], 2);
  for (const x of [-RW + 0.05, -0.95, 0.95, RW - 0.05]) box(0.12, WIN.top - WIN.bottom, 0.12, metal, [x, (WIN.top + WIN.bottom) / 2, WIN.front]);
  box(2 * RW, 0.1, 0.16, trim, [0, WIN.top, WIN.front - 0.02]);
  // overhead: a panel of switches over the windscreen
  box(1.6, 0.14, 0.7, metal, [0, RH - 0.07, WIN.front - 0.5]);
  plane(1.5, 0.6, psx(P.dashFront, { rx: 1 }), [0, RH - 0.145, WIN.front - 0.5], [Math.PI / 2, 0, 0], 2);

  // the dashboard: its top (where Sadie sits), its front facing you, and what's on it
  box(2 * RW - 0.2, DASH.top, DASH.z1 - DASH.z0, dark, [0, DASH.top / 2, (DASH.z0 + DASH.z1) / 2]);
  plane(2 * RW - 0.2, DASH.z1 - DASH.z0, psx(P.dashTop, { rx: 6 }), [0, DASH.top + 0.01, (DASH.z0 + DASH.z1) / 2], [-Math.PI / 2, 0, 0], 4);
  plane(2 * RW - 0.3, DASH.top - 0.12, psx(P.dashFront, { rx: 2 }), [0, (DASH.top - 0.12) / 2 + 0.06, DASH.z0 - 0.01], [0, Math.PI, 0], 2);
  box(2 * RW - 0.2, 0.06, 0.08, trim, [0, DASH.top, DASH.z0]);
  // screens standing on it, tilted towards you (none right in the middle: that's where Sadie sits)
  const screens = [['NAV', -1.45, 0], ['O2 OK', -0.85, 0], ['FISH 3', 0.85, 0x3aff6a], ['SPACE', 1.45, 0xffd23a]];
  for (const [text, x, col] of screens) {
    box(0.5, 0.3, 0.08, metal, [x, DASH.top + 0.18, DASH.z0 + 0.35], [-0.35, x > 0 ? -0.15 : 0.15, 0]);
    plane(0.44, 0.22, psx(P.screen(text, col ? '#' + col.toString(16).padStart(6, '0') : undefined), { unlit: 0.9 }), [x, DASH.top + 0.19, DASH.z0 + 0.3], [-0.35, Math.PI + (x > 0 ? 0.15 : -0.15), 0], 1);
  }
  // the radar, off to one side
  cyl(0.2, 0.22, 0.06, 10, metal, [-0.45, DASH.top + 0.03, DASH.z0 + 0.25]);
  const radar = plane(0.36, 0.36, psx(P.radar, { unlit: 0.9 }), [-0.45, DASH.top + 0.065, DASH.z0 + 0.25], [-Math.PI / 2, 0, 0], 1);
  // blinking lights along its front edge
  const blinks = [];
  const COLS = [0xe83a3a, 0xffd23a, 0x3aff6a, 0x2ad0c0, 0xff8ec8];
  for (let i = 0; i < 16; i++) {
    const x = -2.1 + i * 0.28;
    if (Math.abs(x) < 0.3) continue;
    const l = box(0.06, 0.03, 0.06, psx(null, { tint: COLS[i % COLS.length], unlit: 1 }), [x, DASH.top + 0.02, DASH.z0 + 0.07]);
    blinks.push({ l, col: COLS[i % COLS.length], rate: 0.6 + (i * 0.37) % 1.4, ph: i * 1.3 });
  }
  // the control stick
  cyl(0.035, 0.05, STICK.y - 0.08, 6, metal, [STICK.x, (STICK.y - 0.08) / 2, STICK.z]);
  ball(0.05, psx(null, { tint: 0xe83a3a }), [STICK.x, STICK.y - 0.03, STICK.z]);
  cyl(0.18, 0.22, 0.06, 8, dark, [STICK.x, 0.03, STICK.z]);

  // the pilot's seat, its back to the door
  const vinyl = psx(P.vinyl, { rx: 2, ry: 2 });
  box(0.75, 0.12, 0.7, vinyl, [0, 0.5, 0.4]);
  box(0.75, 1.0, 0.14, vinyl, [0, 1.0, 0.02], [-0.12, 0, 0]);
  box(0.5, 0.25, 0.12, vinyl, [0, 1.62, -0.06], [-0.12, 0, 0]);
  cyl(0.06, 0.06, 0.45, 6, metal, [0, 0.22, 0.35]);
  cyl(0.3, 0.3, 0.04, 8, metal, [0, 0.02, 0.35]);
  for (const s of [-1, 1]) box(0.1, 0.1, 0.6, metal, [s * 0.42, 0.72, 0.45]);

  // by the door: a poster, a food bowl with SADIE on it, a light in the ceiling
  plane(0.64, 0.88, psx(P.poster, { decal: true }), [-RW + 0.05, 1.6, -2.2], [0, Math.PI / 2, 0], 2);
  cyl(0.18, 0.14, 0.09, 10, psx(null, { tint: 0xff8ec8 }), [1.9, 0.045, -2.6]);
  cyl(0.15, 0.15, 0.02, 10, psx(null, { tint: 0x8a5a30 }), [1.9, 0.08, -2.6]);
  box(1.2, 0.05, 0.3, psx(null, { tint: 0xfff4e4, unlit: 1 }), [0, RH - 0.03, -1.2]);
  box(1.2, 0.05, 0.3, psx(null, { tint: 0xfff4e4, unlit: 1 }), [0, RH - 0.03, 1.0]);

  // Outside the windows on the way in: a box round the whole cockpit, in dots (the fewer dots, the
  // more you see through it): orange while the air glows, then white in the clouds.
  const weather = new Mesh(m.keep(new BoxGeometry(2 * RW + 1.2, RH + 1.2, RD + WIN.front + 1.2, 2, 2, 2)), psx(P.streaks, { unlit: 1, side: BackSide, rx: 3, ry: 2, fade: 1 }));
  weather.position.set(0, RH / 2, (WIN.front - RD) / 2); cockpit.add(weather); weather.visible = false;

  function update(t) {
    for (const b of blinks) b.l.visible = Math.sin(t * b.rate * Math.PI * 2 + b.ph) > -0.3;
    radar.rotation.z = -t * 0.8;
  }
  return { group: cockpit, weather, update };
}
