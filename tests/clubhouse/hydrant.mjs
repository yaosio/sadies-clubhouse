// Dog City in the browser (the clubhouse's checks, tests/clubhouse/browser.mjs): the giant hydrant out past
// the town square can be walked all the way up, has no edge to walk off, and its doors take you where
// they say. Walked on the page's own floor (the outside's), from the same numbers the game is built from.
import { HYDRANT as H, HYDRANT_DOORS } from '../../src/clubhouse/town/layout.js';
import { around, DOOR_SIDES } from '../../src/clubhouse/town/hydrant-walk.js';

export async function checkHydrant({ p, M, walk, check, shot, device }) {
  // every spot you can get to from the foot of the ramp (the floor's own rules, half a metre at a time)
  const reach = await p.evaluate(({ H }) => {
    const floor = (x, z, y) => window.__clubhouse.floorAt('outside', x, z, y);
    const key = (x, z, y) => Math.round(x * 2) + ',' + Math.round(z * 2) + ',' + Math.round(y * 2);
    const start = { x: H.x + 17 * Math.cos(H.th0), z: H.z + 17 * Math.sin(H.th0) }, seen = new Map(), todo = [[start.x, start.z, 0]];
    seen.set(key(start.x, start.z, 0), [start.x, start.z, 0]);
    let most = 0;
    while (todo.length) {
      const [x, z, y] = todo.pop();
      for (const [dx, dz] of [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) {
        const nx = x + dx, nz = z + dz;
        if (Math.hypot(nx - H.x, nz - H.z) > 45) continue;
        const h = floor(nx, nz, y);
        if (h === null) continue;
        const k = key(nx, nz, h);
        if (seen.has(k)) continue;
        seen.set(k, [nx, nz, h]); todo.push([nx, nz, h]); most = Math.max(most, h);
      }
    }
    return { cells: [...seen.values()].filter(c => c[2] > 0.6).map(c => [Math.round(c[0] * 2) / 2, Math.round(c[1] * 2) / 2, Math.round(c[2] * 100) / 100]), count: seen.size, most };
  }, { H });
  const at = (x, z, y) => reach.cells.some(c => Math.abs(c[0] - x) <= 0.75 && Math.abs(c[1] - z) <= 0.75 && Math.abs(c[2] - y) <= 0.75);
  check(`${device}: Dog City: the ramp winds all the way up to the lookout deck`, at(...(({ x, z }) => [x, z])(around(14.5, H.th0 + 0.4)), H.top), `highest reachable ${reach.most.toFixed(1)} m`);
  for (const s of H.stops) {
    const p0 = around(s.door + 1.5, H.th0 + s.turn);
    check(`${device}: ...and every landing's ledge (${s.who}'s, ${s.y} m up) is reachable on foot, up to its front door`, at(p0.x, p0.z, s.y));
  }
  // nothing to walk off: no spot above the ground out past a ledge's or the deck's edge
  const beyond = reach.cells.filter(([x, z, y]) => Math.hypot(x - H.x, z - H.z) > H.ledge + 0.01 || (y > H.top - 0.1 && Math.hypot(x - H.x, z - H.z) > H.deck[1]));
  check(`${device}: ...with no edge to walk off (nothing up there reachable past the rails)`, beyond.length === 0, beyond.length ? `${beyond.length} spots, e.g. ${beyond[0]}` : '');
  // the foot is clear: from the path to the first step of the ramp, no hitch
  const foot = around(14, H.th0 + 0.02), from = around(20, H.th0 + 0.02);
  check(`${device}: ...and the foot of the ramp is clear (nothing in the way from the path)`, await p.evaluate(({ f, t }) => {
    let y = 0;
    for (let i = 0; i <= 20; i++) { const x = f.x + (t.x - f.x) * i / 20, z = f.z + (t.z - f.z) * i / 20, h = window.__clubhouse.floorAt('outside', x, z, y); if (h === null) return false; y = h; }
    return true;
  }, { f: from, t: foot }));
  // every door in the hydrant takes you to its other half: walk up to it, in through it
  for (const d of HYDRANT_DOORS) for (const dir of d.id === 'lookout' ? ['down', 'up'] : ['down']) {
    const a = `dog-city.${d.id}.${dir}`, to = DOOR_SIDES.find(s => s.id === `${d.id}.${dir === 'down' ? 'up' : 'down'}`);
    const ok = await M('faceDoor', 'outside', a, 2.2);
    await walk(250); await p.waitForTimeout(500);
    const looking = await M('looking');
    await walk(700); await p.waitForTimeout(200);
    const w = await M('where'), spot = around(to.r0 + 1.9, to.th);
    const near = Math.hypot(w.x - spot.x, w.z - spot.z) < 3.5 && Math.abs(w.y - to.y) < 0.6;
    if (d.id === 'chooter' && dir === 'down') await shot('3b-dog-city-door');
    check(`${device}: Dog City: the ${dir === 'down' ? 'door at the bottom' : 'door on the lookout'} for ${d.label.toLowerCase()} opens and takes you ${dir === 'down' ? (d.id === 'lookout' ? 'up to the lookout' : 'up to its landing') : 'back down to the bottom'}`,
      ok && looking === 'outside' && w.place === 'outside' && near, `${ok ? '' : 'no such door; '}looking ${looking}, now at ${w.x.toFixed(1)}, ${w.y.toFixed(1)}, ${w.z.toFixed(1)}; wanted near ${spot.x.toFixed(1)}, ${to.y}, ${spot.z.toFixed(1)}`);
  }
}
