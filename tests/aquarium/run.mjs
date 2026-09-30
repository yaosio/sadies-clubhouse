// The aquarium's headless checks: its card and door, and the tank in numbers (tank.js): the fish
// and Sadie stay in the water, and the dive you take when you tap the glass never goes through the
// glass or the rim. Run in Node, well under a second.
//
//   node tests/aquarium/run.mjs
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import card from '../../src/activities/aquarium/card.js';
import { TW, T0, T1, GZ, BZ, WATER, FISH, FINDS, sadieAt, dive } from '../../src/activities/aquarium/tank.js';

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failed++;
}
const root = join(new URL('.', import.meta.url).pathname, '../..');

// 1. the card: a room in the mansion, behind the fifth door, with its own door picture
check('the card is a room in the mansion', card.id === 'aquarium' && typeof card.room === 'function' && !card.start && !card.page);
const png = Buffer.from(card.door.split(',')[1] || '', 'base64');
const w = png.length > 24 ? png.readUInt32BE(16) : 0, h = png.length > 24 ? png.readUInt32BE(20) : 0;
check('its door is a 40 x 64 picture, like every door', card.door.startsWith('data:image/png;base64,') && w === 40 && h === 64, `${w} x ${h}`);
// (the other cards are read as text: some only load in a browser)
const others = readdirSync(join(root, 'src/activities')).filter(d => d !== 'aquarium' && existsSync(join(root, 'src/activities', d, 'card.js')))
  .map(d => ({ id: d, slot: Number((readFileSync(join(root, 'src/activities', d, 'card.js'), 'utf8').match(/^\s*slot:\s*(\d+)/m) || [])[1]) }));
check('its door is the fifth on the landing, and no other activity has that one', card.slot === 4 && !others.some(c => c.slot === card.slot), others.map(c => `${c.id} ${c.slot}`).join(', '));

// 2. the fish swim in the water, well away from the glass, the back, the sand and the surface
const inWater = (x, y, z, m) => Math.abs(x) < TW - m && y > T0 + m && y < WATER - m && z > GZ + m / 2 && z < BZ - m / 2;
check('every fish lane is in the water', FISH.every(([, size, y, z]) => inWater(0, y, z, size / 2)), FISH.map(f => f.slice(2, 4).join('/')).join(' '));

// 3. Sadie's loop keeps her (a metre wide, helmet and flippers) in the water, for ten minutes
let out = 0;
for (let t = 0; t < 600; t += 0.1) { const s = sadieAt(t); if (!inWater(s.x, s.y, s.z, 0.45)) out++; }
check('Sadie swims round and round without leaving the water', !out, out ? out + ' moments out' : '');

// 4. the dive: never through the glass or the rim, into the water and back where you stood
const EYE = 1.6, ease = k => k * k * (3 - 2 * k);
for (const from of [{ x: -0.9, z: GZ - 1.4, eye: 0, yaw: Math.PI + 0.1, pitch: 0.05 }, { x: 3.5, z: GZ - 0.6, eye: 0, yaw: Math.PI - 0.3, pitch: -0.2 }, { x: -3.4, z: GZ - 2.5, eye: 0, yaw: Math.PI, pitch: 0 }]) {
  const steps = dive(from, EYE);
  let at = { ...from }, through = 0, secs = 0, under = false, signUnder = true;
  for (const s of steps) {
    for (let i = 1; i <= 40; i++) {
      const k = ease(i / 40), x = at.x + (s.to.x - at.x) * k, z = at.z + (s.to.z - at.z) * k, y = at.eye + (s.to.eye - at.eye) * k + EYE;
      const pz = at.z + (s.to.z - at.z) * ease((i - 1) / 40);
      // crossing the glass's line (or over the tank's rim, 30 cm deep) must be up over the rim
      if ((Math.sign(pz - GZ) !== Math.sign(z - GZ) || (z > GZ - 0.3 && z < GZ + 0.1)) && Math.abs(x) < TW + 0.3 && y < T1 + 0.45) through++;
      if (z > GZ && y < WATER) under = true;
    }
    if (s.sign && !(s.to.eye + EYE < WATER && s.to.eye + EYE > T0 + 0.5 && Math.abs(s.to.x) < TW - 0.4)) signUnder = false;
    secs += s.secs; at = { ...s.to };
  }
  const back = Math.hypot(at.x - from.x, at.z - from.z) < 1e-9 && at.eye === from.eye && at.yaw === from.yaw;
  check(`the dive from x ${from.x}: over the rim, into the water, back where you stood, in under 10 s`, !through && under && back && secs < 10, `${through} through the glass, ${secs.toFixed(1)} s`);
  check(`...and the COMING SOON sign is read underwater, inside the tank`, steps.some(s => s.sign) && signUnder);
}

// 5. the cabinet has a spot for each find
check('the OCEAN FINDS cabinet has six spots', FINDS.length === 6);

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
