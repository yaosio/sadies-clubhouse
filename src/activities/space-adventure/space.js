// Space, round the cockpit: the stars, a pink cloud of gas and a galaxy far off, a sun with its lens
// flare, and the planet dead ahead (with its thin blue air round the edge), which grows as the trip
// goes on (trip.js's planetSize). It's all drawn behind everything else (none of it is tested for
// depth), so it can be any size and as far off as it likes: the planet is drawn at a fixed distance,
// just made bigger as you get closer.
import { Group, Mesh, PlaneGeometry, SphereGeometry, BackSide, Color } from 'three';
import { EYE, SEAT } from './trip.js';

export const PLANET_UP = 0.28;   // how far above straight ahead the planet is (radians)
const FAR = 150;                 // how far off everything out here is drawn

export function buildSpace(m, P) {
  const { psx, keep } = m;
  const space = new Group(); space.position.set(SEAT.x, EYE, SEAT.z);   // (round your eye in the seat)
  const behind = (mesh, order) => { mesh.material.depthTest = false; mesh.material.depthWrite = false; mesh.renderOrder = order; space.add(mesh); return mesh; };
  // a direction: `x` radians round to the left (+x is on your left, facing out of the windscreen), `y` up
  const dir = (x, y) => [Math.sin(x) * Math.cos(y), Math.sin(y), Math.cos(x) * Math.cos(y)];
  const facing = (mesh, [a, b, c], d) => { mesh.position.set(a * d, b * d, c * d); mesh.lookAt(space.position.x, space.position.y, space.position.z); mesh.position.set(a * d, b * d, c * d); return mesh; };

  // the stars: dots on a big sphere all round you, a few coloured, a few bigger (drawn with the
  // mansion's own material, like everything else, so seeing them the first time never stutters)
  behind(new Mesh(keep(new SphereGeometry(FAR * 1.2, 24, 16)), psx(P.stars, { unlit: 1, side: BackSide })), -20);
  // far-off things: a pink cloud of gas, and a galaxy
  const flat = (pic, w, h, d, o = {}) => behind(new Mesh(keep(new PlaneGeometry(w, h)), psx(pic, { unlit: 1, ...o })), -19);
  facing(flat(P.nebula, 90, 45, FAR, { fade: 0.35 }), dir(-0.5, 0.45), FAR);
  facing(flat(P.nebula, 70, 35, FAR, { fade: 0.5 }), dir(0.9, -0.25), FAR);
  facing(flat(P.galaxy, 22, 22, FAR), dir(0.35, 0.6), FAR);
  // the sun, and its flare: rings along the line from it through the middle of the view
  const SUN = dir(0.2, 0.42);
  facing(flat(P.sun, 22, 22, FAR), SUN, FAR);
  const sx = SUN[0] / SUN[2], sy = SUN[1] / SUN[2], flares = [];
  [[0.3, 6, 0], [0.55, 3, 1], [0.8, 4, 2], [1.25, 2.5, 3], [1.6, 7, 4], [1.9, 3.5, 1]].forEach(([k, size, i]) => {
    const f = flat(P.flares[i], size, size, 80, { fade: 0.45 }); f.renderOrder = -15;
    const x = sx * (1 - k), y = sy * (1 - k), n = Math.hypot(x, y, 1);
    facing(f, [x / n, y / n, 1 / n], 80); flares.push(f);
  });

  // the planet, straight ahead and a little up; and its air, a ring round its edge
  const AHEAD = dir(0, PLANET_UP);
  const planet = behind(new Mesh(keep(new SphereGeometry(1, 28, 18)), psx(P.planet, { tint: 0xffffff })), -17);
  planet.rotation.set(0.35, 0, 0.2);
  const clouds = behind(new Mesh(keep(new SphereGeometry(1.025, 28, 18)), psx(P.planetClouds, { unlit: 0.3 })), -16);
  clouds.rotation.set(0.35, 0, 0.2);
  const halo = behind(new Mesh(keep(new PlaneGeometry(2.3, 2.3)), psx(P.halo, { unlit: 1, fade: 0.2 })), -18);

  // how big the planet looks (its angular radius, radians), and how far it has turned
  function planetAt(size, spin) {
    const R = FAR * Math.sin(size);
    planet.position.set(AHEAD[0] * FAR, AHEAD[1] * FAR, AHEAD[2] * FAR); planet.scale.setScalar(R); planet.rotation.y = spin;
    clouds.position.copy(planet.position); clouds.scale.setScalar(R); clouds.rotation.y = spin * 1.6 + 0.4;
    facing(halo, AHEAD, FAR * 1.02); halo.scale.setScalar(R * 1.02 * 1.05);
  }
  planetAt(0.07, 0);
  return { group: space, planetAt, planet, flares, background: new Color(0x05020f) };
}
