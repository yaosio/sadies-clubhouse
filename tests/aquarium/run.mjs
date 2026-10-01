// The aquarium's headless checks: its card and door, the tank in numbers (tank.js): the fish and
// Sadie stay in the water, the dive into the ocean and back never goes through the glass or the rim,
// and the ocean in numbers (chart.js): the spots, the reef, a boat sailing round them all picking
// everything up, the looming mountain, what's saved, and the sounds (gentle, and rare). Run in Node,
// in a second or two.
//
//   node tests/aquarium/run.mjs
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import card from '../../src/activities/aquarium/card.js';
import { TW, T0, T1, GZ, BZ, WATER, FISH, FINDS, sadieAt, dive, surfaceHome, LOW } from '../../src/activities/aquarium/tank.js';
import { SPOTS, START, SEA_R, BOAT, REEF_R, sailable, findHere, reefOpen, loom, MT, LOOK, readSave } from '../../src/activities/aquarium/chart.js';
import { FIND_SOUNDS, reef } from '../../src/activities/aquarium/sounds/finds.js';
import { wave, sail, seaPacing, GAP, WAVE_MIN, WAVES } from '../../src/activities/aquarium/sounds/sea.js';
import { RATE } from '../../src/shared/retro.js';

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

// 2. the fish swim in the water, well away from the glass, the back, the sand and the // 4. the dive into the ocean, and back: never through the glass or the rim; the swap happens down at
// the sand, looking straight down, well inside the tank; and home brings you back where you stood
const EYE = 1.6, ease = k => k * k * (3 - 2 * k), SURF = 4.6, DECK = 4.1;
function walkSteps(from, steps) {
  let at = { ...from }, through = 0, secs = 0;
  for (const s of steps) {
    if (s.swap === 'room') at = { ...s.to };   // (the jump back into the tank: one frame, nothing in between)
    for (let i = 1; i <= 40; i++) {
      const k = ease(i / 40), x = at.x + (s.to.x - at.x) * k, z = at.z + (s.to.z - at.z) * k, y = at.eye + (s.to.eye - at.eye) * k + EYE;
      const pz = at.z + (s.to.z - at.z) * ease((i - 1) / 40);
      if ((Math.sign(pz - GZ) !== Math.sign(z - GZ) || (z > GZ - 0.3 && z < GZ + 0.1)) && Math.abs(x) < TW + 0.3 && y < T1 + 0.45) through++;
    }
    secs += s.secs; at = { ...s.to };
    if (s.swap) s.at = { ...at };
  }
  return { at, through, secs };
}
for (const from of [{ x: -0.9, z: GZ - 1.4, eye: 0, yaw: Math.PI + 0.1, pitch: 0.05 }, { x: 3.5, z: GZ - 0.6, eye: 0, yaw: Math.PI - 0.3, pitch: -0.2 }, { x: -3.4, z: GZ - 2.5, eye: 0, yaw: Math.PI, pitch: 0 }]) {
  const steps = dive(from, EYE, { surface: SURF, deck: DECK, yaw: 0.3 }), w = walkSteps(from, steps), sw = steps.find(s => s.swap);
  const swapOk = sw.to.eye + EYE === LOW && LOW > T0 + 0.15 && LOW < T0 + 0.4 && sw.to.pitch <= -1.45 && Math.abs(sw.to.x) < TW - 0.5 && sw.to.z > GZ + 0.4 && sw.to.z < BZ - 0.4;
  check(`into the ocean from x ${from.x}: over the rim, down to the sand, swapped there looking straight down`, !w.through && swapOk, `${w.through} through the glass`);
  check(`...then up through the sea into the boat, facing its way, in under 10 s`, w.at.y === DECK && w.at.eye === DECK && w.at.yaw === 0.3 && w.secs < 10, `${w.secs.toFixed(1)} s`);
  const home = surfaceHome({ x: 40, z: -80, eye: DECK, yaw: 2 }, from, EYE), h = walkSteps({ x: 40, z: -80, eye: DECK, yaw: 2 }, home), hs = home.find(s => s.swap);
  const before = home[home.indexOf(hs) - 1].to;
  check(`...and home: sinks to the seabed, jumps back in one frame at the same height, same way and looking down`, hs.secs < 0.01 && before.eye === hs.to.eye && before.yaw === hs.to.yaw && before.pitch === hs.to.pitch && hs.to.pitch <= -1.45 && hs.to.eye + EYE === LOW);
  check(`...then out over the rim, back where you stood, on the floor`, !h.through && h.at.x === from.x && h.at.z === from.z && h.at.yaw === from.yaw && h.at.y === 0 && h.secs < 10, `${h.through} through the glass, ${h.secs.toFixed(1)} s`);
}

// 5. the cabinet has a spot for each find, and each is out in the ocean
check('the OCEAN FINDS cabinet has six spots, one for each spot in the sea', FINDS.length === 6 && FINDS === SPOTS);

// 6. the sea: the spots are in it, well apart; you start outside the reef, facing the mountain
const apart = SPOTS.every((a, i) => SPOTS.every((b, j) => i === j || Math.hypot(a.x - b.x, a.z - b.z) > 80));
check('every spot is in the sea, at least 80 m from the next', apart && SPOTS.every(s => Math.hypot(s.x, s.z) + s.reach < SEA_R));
check('the reef is round the mountain, clear of every other spot', SPOTS.filter(s => s.id !== 'mountain').every(s => Math.hypot(s.x, s.z) - s.reach > REEF_R + 20));
check('you start in open water, outside the reef, facing the mountain', sailable(START.x, START.z, []) && Math.hypot(START.x, START.z) > REEF_R + 20 && Math.abs(Math.atan2(-START.x, -START.z) - Math.atan2(-Math.sin(START.yaw), -Math.cos(START.yaw))) < 0.01);
check("every find can be picked up from somewhere the boat can be", SPOTS.every(s => { for (let a = 0; a < 6.3; a += 0.3) { const d = (s.r + s.reach) / 2; if (sailable(s.x + Math.sin(a) * d, s.z + Math.cos(a) * d, ['bottle', 'hat', 'duck', 'floppy', 'coconut'])) return true; } return false; }));

// 7. a whole trip: a boat that just steers at the nearest thing still to find (sliding along
// whatever's in the way, like the mansion's walking) picks all six up, the reef opening after the
// fifth, in under five minutes of sailing
{
  let x = START.x, z = START.z, t = 0, found = [], openedAt = null;
  const dt = 0.05;
  while (found.length < 6 && t < 600) {
    const todo = SPOTS.filter(s => !found.includes(s.id) && (s.id !== 'mountain' || reefOpen(found)));
    const aim = todo.sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
    const d = Math.hypot(aim.x - x, aim.z - z), step = BOAT * dt, mx = (aim.x - x) / d * step, mz = (aim.z - z) / d * step;
    let moved = false;   // (stuck: the trip fails)
    for (const [dx, dz] of [[mx, mz], [mx, 0], [0, mz], [-mz, mx]]) if (sailable(x + dx, z + dz, found)) { x += dx; z += dz; moved = true; break; }
    if (!moved) break;
    const f = findHere(x, z, found);
    if (f) { found.push(f.id); if (reefOpen(found) && openedAt === null) openedAt = found.length; }
    t += dt;
  }
  check('a boat sailing to the nearest thing each time finds all six, the mountain last, in under 5 minutes', found.length === 6 && found[5] === 'mountain' && t < 300 && openedAt === 5, `${found.join(', ')} in ${Math.round(t)} s`);
  let inside = 0;
  for (let a = 0; a < 6.3; a += 0.05) for (let r = 0; r < REEF_R + 2; r += 1) if (sailable(Math.sin(a) * r, Math.cos(a) * r, ['bottle', 'hat', 'duck', 'floppy'])) inside++;
  check('...and with four finds, the reef keeps the boat out entirely; with five it lets you in', !inside && sailable(0, 10, ['bottle', 'hat', 'duck', 'floppy', 'coconut']) && !findHere(0, 5, ['bottle', 'hat', 'duck', 'floppy']));
}

// 8. the looming mountain: the same size from anywhere past the last stretch, then shrinking right
// down to its real size as you arrive
{
  const size = d => loom(d) * MT / d;   // (how tall it looks: its height over its distance)
  const far = [30, 60, 120, 250, 400].map(size);
  check('from 30 m to 400 m off, the mountain looks exactly the same height', far.every(v => Math.abs(v - LOOK) < 1e-9), far.map(v => v.toFixed(3)).join(' '));
  check('...closer in, it shrinks as you go, down to its real size', size(20) < LOOK && size(12) < size(20) && loom(5) === 1 && loom(3) === 1 && [30, 25, 20, 15, 10, 6, 5].every((d, i, a) => !i || loom(d) <= loom(a[i - 1])));
}

// 9. what's saved: nonsense or nothing starts you fresh at the start
const fresh = readSave(null), odd = readSave({ found: ['duck', 'duck', 'spoon'], boat: { x: 9e9, z: 0, yaw: 0 } }), ok = readSave({ found: ['hat'], boat: { x: 5, z: 50, yaw: 1 } });
check('a new save starts at the start with nothing found; a broken one too; a good one is kept', !fresh.found.length && fresh.boat.x === START.x && odd.found.join() === 'duck' && odd.boat.z === START.z && ok.found.join() === 'hat' && ok.boat.z === 50);

// 10. the sounds: each one short, soft, ending in silence; none of the sea's own sounds loops, and
// they're rare (a wave at most every WAVE_MIN s, never the same wave twice running)
const sounds = { ...Object.fromEntries(Object.entries(FIND_SOUNDS).map(([k, f]) => [k, f()])), reef: reef(), sail: sail(), ...Object.fromEntries([0, 1, 2].map(v => ['wave' + v, wave(v)])) };
const bad = Object.entries(sounds).filter(([, a]) => !(a.length > 0.1 * RATE && a.length < 3 * RATE && a.every(Number.isFinite) && Math.max(...a.map(Math.abs)) <= 1 && Math.abs(a[a.length - 1]) < 0.02));
check('every ocean sound is short, never over full volume, and ends in silence', !bad.length, bad.map(b => b[0]).join(', '));
{
  const pace = seaPacing(), heard = [];
  let r = 0.37;
  for (let t = 0; t < 1800; t += 0.05) { r = (r * 9301 + 0.49297) % 1; const s = pace(t, Math.sin(t / 7) > 0.9, r); if (s) heard.push([t, s]); }
  const gaps = heard.slice(1).map(([t], i) => t - heard[i][0]), waves = heard.filter(([, s]) => s.name === 'wave');
  const waveGaps = waves.slice(1).map(([t], i) => t - waves[i][0]);
  check(`in half an hour at sea: no two sounds within ${GAP} s, waves at most every ${WAVE_MIN} s, never the same wave twice running`, heard.length > 0 && gaps.every(g => g >= GAP) && waveGaps.every(g => g >= WAVE_MIN) && waves.every(([, s], i) => !i || s.variant !== waves[i - 1][1].variant) && WAVES > 1, `${heard.length} sounds, ${(heard.length / 30).toFixed(1)} a minute`);
}

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
