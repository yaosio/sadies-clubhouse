// Space Adventure's headless checks: its card and door, the trip in numbers (trip.js): Sadie's lines
// (all of the owner's, word for word, one after another the whole way, each up long enough to read),
// the planet growing, the clouds going fully white exactly when space is swapped for the land, the
// way down (over the land, never under it, ending on the beach with the sea beside it), Sadie's hops;
// and the music (song.js, synth.js): gentle, no note held on and on, building to its loudest at
// touchdown, the radio's song going round cleanly. Run in Node, in a few seconds.
//
//   node tests/space-adventure/run.mjs
import card from '../../src/activities/space-adventure/card.js';
import { T, LINES, lineAt, AFTER, planetSize, PLANET_FROM, entry, shipAt, sadieAt, heightAt, shore, GROUND, SKIDS, SEAT, EYE, DASH, LOCK_Z, RD, readSave } from '../../src/activities/space-adventure/trip.js';
import { tripSong, radioSong, LANDING } from '../../src/activities/space-adventure/music/song.js';
import { INSTRUMENTS, RATE, soundKey } from '../../src/activities/space-adventure/music/synth.js';

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failed++;
}

// 1. the card: a room in the mansion, behind the sixth door, with its own door picture
check('the card is a room in the mansion', card.id === 'space-adventure' && typeof card.room === 'function' && !card.start && !card.page);
const png = Buffer.from(card.door.split(',')[1] || '', 'base64');
const w = png.length > 24 ? png.readUInt32BE(16) : 0, h = png.length > 24 ? png.readUInt32BE(20) : 0;
check('its door is a 40 x 64 picture, like every door', card.door.startsWith('data:image/png;base64,') && w === 40 && h === 64, `${w} x ${h}`);
check('its door is the sixth on the landing (the room checker sees no other activity has it)', card.slot === 5);
check('starting it over forgets the trip', card.keeps.length === 1 && card.keeps[0] === 'sadies-clubhouse.space-adventure.');

// 2. what Sadie says
const has = s => LINES.some(([, t]) => t === s);
for (const s of ["See all that? That's space, everything lives there. You live there.", "We're almost there, a new planet, new life, new discoveries.",
  "But you've seen this already. It's just land and water.", "Disappointing isn't it?", "Almost as disappointing as when you didn't give me the treats I wanted."])
  check(`she says, word for word: "${s}"`, has(s));
check('"I love space!" in her space room', AFTER === 'I love space!');
check('she talks a lot, not just a few lines', LINES.length >= 18, `${LINES.length} lines`);
const order = ["See all that", "We're almost there", "But you've seen", "Disappointing isn't", "Almost as disappointing"].map(k => LINES.findIndex(([, t]) => t.startsWith(k)));
check('in the right order: space, almost there, landed, disappointing, the treats', order.every((v, i) => i === 0 || v > order[i - 1]), order.join(', '));
const at = k => LINES.find(([, t]) => t.startsWith(k))[0];
check('"almost there" comes as the planet fills the windscreen, just before the air glows', at("We're almost there") > T.hot - 4 && at("We're almost there") <= T.hot && planetSize(at("We're almost there")) > 0.9);
check('"just land and water" comes after touchdown', at('But you') > T.land);
// the whole way, one after another: each line up long enough to read (typed out at 40 a second, then about 17 letters a second to read)
let worst = Infinity, gaps = 0;
for (let i = 0; i < LINES.length; i++) {
  const [t0, text] = LINES[i], t1 = i + 1 < LINES.length ? LINES[i + 1][0] : T.leap;
  worst = Math.min(worst, (t1 - t0) - (1 + text.length / 17));
  if (i && t0 !== LINES[i - 1][0] && lineAt(t0 - 0.01)?.i !== i - 1) gaps++;
}
check('every line is up long enough to read', worst >= 0, `tightest has ${worst.toFixed(1)} s to spare`);
let quiet = 0;
for (let t = T.go; t < T.leap; t += 0.1) if (!lineAt(t)) quiet++;
check('she talks the whole way, from the engines starting until she flies at you', quiet === 0 && gaps === 0 && lineAt(T.go).i === 0 && !lineAt(T.leap));

// 3. the planet, the glow and the clouds, and the swap
let grows = true;
for (let t = T.go; t < T.swap; t += 0.5) if (planetSize(t + 0.5) < planetSize(t) - 1e-9) grows = false;
check('the planet starts small and only ever grows', planetSize(0) === PLANET_FROM && PLANET_FROM < 0.1 && grows);
check('...slowly at first (still small half way), filling the windscreen by the time the air glows', planetSize((T.go + T.hot) / 2) < 0.3 && planetSize(T.hot) > 1.1, `${(planetSize((T.go + T.hot) / 2) * 57.3).toFixed(0)} deg, ${(planetSize(T.hot) * 57.3).toFixed(0)} deg`);
check('nothing but white out of the windows when space is swapped for the land', entry(T.swap - 0.01).white === 1 && entry(T.swap).white === 1 && entry(T.swap).glow === 0);
check('...and it clears as you come out under the clouds', entry(T.clear).white === 0 && entry(T.go).white === 0 && entry(T.land).white === 0);

// 4. the way down: above the land and the sea the whole way, landing on the beach, the sea beside it
let under = 0, lowest = Infinity, jumpy = 0, prev = shipAt(T.swap);
for (let t = T.swap; t <= T.land + 2; t += 0.05) {
  const s = shipAt(t), eyeY = s.y + EYE, ground = Math.max(0, heightAt(s.x, s.z));
  // (the cockpit's nose and floor too: a couple of metres all round)
  const clear = s.y - Math.max(ground, heightAt(s.x, s.z + 3), heightAt(s.x + 2, s.z), heightAt(s.x - 2, s.z));
  lowest = Math.min(lowest, clear + (t > T.land - 0.1 ? 1 : 0)); if (eyeY < ground || clear < -0.1) under++;
  if (Math.hypot(s.x - prev.x, s.y - prev.y, s.z - prev.z) > 120 * 0.05 || Math.abs(s.pitch - prev.pitch) > 0.05) jumpy++;   // (never faster than 120 m/s, the nose never swinging more than 1 radian a second)
  prev = s;
}
check('coming down, the ship never goes into the ground', under === 0, `closest ${lowest.toFixed(2)} m`);
check('...and never jumps (smooth all the way)', jumpy === 0, `${jumpy} jumps`);
const down = shipAt(T.land + 1);
check('it touches down on the beach, level, its skids on the sand', Math.abs(down.y - (GROUND + SKIDS)) < 1e-6 && down.pitch === 0 && Math.abs(heightAt(0, 0) - GROUND) < 1e-6 && GROUND > 0.3);
check('the sea is right beside the landing spot (on your left), the land on your right', shore(0) > 3 && shore(0) < 15 && heightAt(shore(0) + 5, 0) < 0 && heightAt(-20, 0) > 0);
let tallest = 0; for (let x = -600; x <= 200; x += 25) for (let z = 500; z <= 1500; z += 25) tallest = Math.max(tallest, heightAt(x, z));
check('tall mountains in the distance ahead', tallest > 250, `${tallest.toFixed(0)} m`);
check('the level-out happens under the clouds, high enough to see the land', shipAt(T.clear).y > 100 && shipAt(T.level).pitch === 0);

// 5. Sadie
const perch = sadieAt(T.go + 5), edge = sadieAt(T.closer + 1), stick = sadieAt(T.closest + 1), face = sadieAt(T.black);
check('she starts out of sight behind the dashboard', sadieAt(0).y < DASH.top - 0.4 && sadieAt(0).z > DASH.z0);
check('she hops up and sits on the dashboard', perch.y === DASH.top && perch.z > DASH.z0 && perch.z < DASH.z1);
const d = s => Math.hypot(s.x - SEAT.x, s.z - SEAT.z);
check('when you land she comes closer, then closer still', d(edge) < d(perch) - 0.2 && d(stick) < d(edge) - 0.2, `${d(perch).toFixed(2)}, ${d(edge).toFixed(2)}, ${d(stick).toFixed(2)} m`);
check('then she flies right at your face, getting bigger', d(face) < 0.3 && Math.abs(face.y - EYE) < 0.5 && face.size > 2 && T.black - T.leap < 0.6);
check('you walk in past the chair to get strapped in', LOCK_Z > -RD + 1 && LOCK_Z < SEAT.z - 1);
check('what\'s saved', readSave(null).done === false && readSave({ done: true }).done === true);

// 6. the music
const notes = tripSong(T.land - T.go), bar = (T.land - T.go) / LANDING;
check('the song lands on a bar line exactly at touchdown', Math.abs(notes.find(n => n.t >= LANDING * bar - 1e-6).t - LANDING * bar) < 1e-6);
const loud = (t0, t1) => notes.filter(n => n.t >= t0 && n.t < t1).reduce((s, n) => s + (n.vol || 0.5) * (n.len || 0.4), 0) / (t1 - t0);
const parts = [0, 4, 8, 12, 16, 20, 24].map(b0 => loud(b0 * bar, (b0 + 4) * bar));   // (each four bars)
check('the music builds: every stretch fuller than the one before, up to touchdown', parts.every((v, i) => i === 0 || v > parts[i - 1] * 0.98), parts.map(v => v.toFixed(2)).join(' < '));
check('...its biggest chord right at touchdown, then it fades out and leaves her to talk', notes.filter(n => n.kind === 'pad').reduce((a, b) => (b.vol > a.vol ? b : a)).t === LANDING * bar && Math.max(...notes.map(n => n.t + (n.len || 2.2))) < T.closer - T.go, `ends ${(Math.max(...notes.map(n => n.t + (n.len || 2.2))) + T.go).toFixed(1)} s`);
check('no droning: every note but the last chord is under 3.2 s', notes.every(n => (n.len || 0) < 3.2 || n.t === LANDING * bar));
check('no hi-hats ticking away, and no drums until half way', !notes.some(n => n.kind === 'hat') && notes.filter(n => n.kind === 'kick' || n.kind === 'snare').every(n => n.t > 14 * bar));
const radio = radioSong();
check('the radio\'s song: the same tune, happy, going round cleanly', radio.notes.length > 100 && radio.notes.every(n => n.t >= 0 && n.t < radio.length) && radio.notes.some(n => n.kind === 'lead'));
// every sound it makes: soft, and ending cleanly at nothing
const made = new Map();
for (const n of [...notes, ...radio.notes]) made.set(soundKey(n), n);
let peak = 0, clicks = 0, bad = 0;
for (const n of made.values()) {
  const s = INSTRUMENTS[n.kind](n);
  for (const v of s) { if (!Number.isFinite(v)) bad++; peak = Math.max(peak, Math.abs(v * (n.vol ?? 0.5))); }
  if (Math.abs(s[s.length - 1]) > 0.01 || Math.abs(s[0]) > 0.05) clicks++;
}
check('every note is soft, starts and ends at nothing (no clicks)', bad === 0 && clicks === 0 && peak < 0.9, `${made.size} sounds, loudest ${peak.toFixed(2)}`);
check('made at 22 kHz', RATE === 22050);

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
