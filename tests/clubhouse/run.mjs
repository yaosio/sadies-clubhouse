// The clubhouse's headless checks: the main theme (src/clubhouse/music/), composed in Node from
// seeds, so every run is the same. A few seconds.
//
//   node tests/clubhouse/run.mjs
import { makeComposer, MODES, RANGE, LONGEST } from '../../src/clubhouse/music/compose.js';
import { SHAPES, RELEASE } from '../../src/clubhouse/music/voices.js';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failed++;
}

// an hour of the theme from a seed: every note (with its time), every bar, and the pieces
function hour(seed, secs = 3600) {
  const c = makeComposer(seed), notes = [], bars = [], pieces = [];
  let t = 0;
  while (t < secs) {
    const bar = c.next(), now = c.now();
    if (!bar.gap && (!pieces.length || pieces[pieces.length - 1].n !== c.pieces())) pieces.push({ n: c.pieces(), start: t, ...now, gapAfter: 0 });
    if (bar.gap) pieces[pieces.length - 1].gapAfter = bar.secs;
    else pieces[pieces.length - 1].end = t + bar.secs;
    bars.push({ t, secs: bar.secs, gap: !!bar.gap, notes: bar.notes, piece: c.pieces(), now });
    for (const n of bar.notes) notes.push({ ...n, t: t + n.at, piece: c.pieces(), now });
    t += bar.secs;
  }
  return { notes, bars, pieces, secs: t };
}
const runs = [1, 2, 3].map(s => hour(s));
const all = runs.flatMap(r => r.notes);

// ---------- what it is ----------
const lens = runs.flatMap(r => r.pieces.filter(p => p.end).map(p => p.end - p.start));
check('it writes pieces a couple of minutes long, one after another', lens.every(l => l > 50 && l < 300) && runs.every(r => r.pieces.length > 15),
  `${runs.map(r => r.pieces.length).join(', ')} pieces an hour, ${Math.min(...lens).toFixed(0)} to ${Math.max(...lens).toFixed(0)} s each`);
const gaps = runs.flatMap(r => r.pieces.slice(0, -1).map(p => p.gapAfter));
check('with a quiet moment between them', gaps.every(g => g >= 5 && g <= 12), `${Math.min(...gaps).toFixed(1)} to ${Math.max(...gaps).toFixed(1)} s`);
const ps = runs.flatMap(r => r.pieces);
const modes = new Set(ps.map(p => p.mode));
check('each piece in its own mood: modes, beats and instruments all turn up', modes.size === Object.keys(MODES).length && ps.some(p => p.beats === 3) && ps.some(p => p.beats === 4)
  && new Set(ps.map(p => p.tune)).size >= 5 && new Set(ps.map(p => p.chords)).size === 2, `${[...modes].join(', ')}; tunes on ${[...new Set(ps.map(p => p.tune))].join(', ')}`);
check('slow, with space: 60 to 100 beats a minute, and a gentle number of notes', ps.every(p => p.bpm >= 60 && p.bpm <= 100) && runs.every(r => r.notes.length / r.secs > 0.8 && r.notes.length / r.secs < 3),
  `${runs.map(r => (r.notes.length / r.secs).toFixed(2)).join(', ')} notes a second`);
// every note in its piece's key
let outOfKey = 0;
for (const r of runs) {
  for (const n of r.notes) {
    const tonic = 55 + ((n.now.key - 7 + 12) % 12), pc = ((n.midi - tonic) % 12 + 12) % 12;
    if (!MODES[n.now.mode].includes(pc)) outOfKey++;
  }
}
check('every note is in its piece\'s key and mode (no sour notes)', !outOfKey, `${outOfKey} out of ${all.length}`);
const tune = all.filter(n => !['bass'].includes(n.voice) && n.midi >= RANGE.tune[0]);
check('each part stays in its range', all.filter(n => n.voice === 'bass').every(n => n.midi >= RANGE.bass[0] && n.midi <= RANGE.bass[1]) && all.every(n => n.midi >= RANGE.bass[0] && n.midi <= RANGE.tune[1] + 12) && tune.length > 1000);

// ---------- kind to the ears ----------
const vs = Object.keys(SHAPES);
check('no drums and no drones: only the soft instruments, and no note rings longer than ' + LONGEST + ' s', all.every(n => vs.includes(n.voice) && n.len > 0 && n.len <= LONGEST),
  `longest ${Math.max(...all.map(n => n.len)).toFixed(2)} s`);
check('the flute (the only one that holds a note) never holds one long', all.filter(n => n.voice === 'flute').every(n => n.len <= 1.8));
check('every instrument starts softly (no click) and dies away by itself', vs.every(v => SHAPES[v].attack >= 0.005 && (v === 'flute' || SHAPES[v].decay <= 1.5)) && RELEASE >= 0.05);
check('never loud: every note well under full volume', all.every(n => n.vel > 0 && n.vel * SHAPES[n.voice].gain < 0.4), `loudest ${Math.max(...all.map(n => n.vel * SHAPES[n.voice].gain)).toFixed(2)}`);
// never a busy patch: at most so many notes in any two seconds
let busiest = 0;
for (const r of runs) { const ts = r.notes.map(n => n.t).sort((a, b) => a - b); for (let i = 0, j = 0; i < ts.length; i++) { while (ts[i] - ts[j] > 2) j++; busiest = Math.max(busiest, i - j + 1); } }
check('never a flurry: at most 16 notes in any two seconds (a chord counts each note)', busiest <= 16, `busiest ${busiest}`);
// the tune breathes: some two-bar phrases have no tune in them
let phrases = 0, rests = 0;
for (const r of runs) {
  for (let i = 0; i + 1 < r.bars.length; i += 2) {
    const [a, b] = [r.bars[i], r.bars[i + 1]];
    if (a.gap || b.gap || a.piece !== b.piece) continue;
    phrases++;
    if (![...a.notes, ...b.notes].some(n => n.voice === a.now.tune && n.midi >= 64)) rests++;
  }
}
check('the tune takes breaths: a good share of phrases rest', rests / phrases > 0.2 && rests / phrases < 0.6, `${Math.round(rests / phrases * 100)}% of phrases`);
// never the same bars again: no eight bars (their notes' pitches and when) come round twice in an hour
let repeats = 0;
for (const r of runs) {
  const sig = r.bars.map(b => b.gap ? null : b.notes.map(n => n.midi + '@' + Math.round(n.at * 8)).join(' '));
  const seen = new Set();
  for (let i = 0; i + 8 <= sig.length; i++) {
    const w = sig.slice(i, i + 8); if (w.includes(null) || w.join('').length < 40) continue;
    const k = w.join('|'); if (seen.has(k)) repeats++; seen.add(k);
  }
}
check('it never repeats: no eight bars come round the same again in an hour', !repeats, `${repeats} repeats`);

// ---------- the sound system (src/shared/sound.js) ----------
// Every sound goes out through it (its rules, its volumes, the theme making way for music): nothing
// else in the game may make its own AudioContext or play straight to the speakers.
{
  const src = new URL('../../src/', import.meta.url).pathname, bad = [];
  const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.m?js$/.test(f)) {
    const text = readFileSync(p, 'utf8'), rel = p.slice(src.length);
    if (rel !== 'shared/sound.js' && /AudioContext|\.destination\b/.test(text)) bad.push(rel);
  } } };
  walk(src);
  check('every sound in the game goes through the sound system (nothing makes an AudioContext of its own)', !bad.length, bad.join(', '));
}

// Its rules, with no browser sound at all (it still counts what it would have played), on a clock
// the check moves by hand: a voice never says the same thing twice running (but can, a good while
// later: a room with only one meow still meows), and nothing but music plays behind the pause menu.
{
  const { soundsFor, paused, closeSounds, soundState } = await import('../../src/shared/sound.js');
  let clock = 1000;
  const real = performance.now.bind(performance);
  performance.now = () => clock;
  const h = soundsFor('check:rules'), none = () => new Float32Array(10);
  const first = h.play('mew', none, { bus: 'voices' }), twice = (clock += 1000, h.play('mew', none, { bus: 'voices' }));
  const later = (clock += 11000, h.play('mew', none, { bus: 'voices' }));
  check('a voice never says the same thing twice running, but can a good while later', first && !twice && later);
  paused(true); clock += 1000;
  const hushed = !h.play('clunk', none) && !h.play('mrrp', none, { bus: 'voices' }) && h.play('note', none, { bus: 'music' });
  paused(false); clock += 1000;
  check('behind the pause menu only music plays, and everything is back after', hushed && h.play('clunk', none));
  soundsFor('check:other'); closeSounds();
  check('closing every sound (the mansion leaving the page) leaves none behind', !Object.keys(soundState().owners).length);
  performance.now = real;
}

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
