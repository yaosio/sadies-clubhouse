// The clubhouse's headless checks: the main theme (src/clubhouse/music/), composed in Node from
// seeds, so every run is the same; the sound rules; and the room checker (every activity's card,
// tests/clubhouse/cards.mjs). A few seconds.
//
//   node tests/clubhouse/run.mjs
import { makeComposer, MODES, RANGE, LONGEST } from '../../src/clubhouse/music/compose.js';
import { SHAPES, RELEASE } from '../../src/clubhouse/music/voices.js';
import { checkCards } from './cards.mjs';
import * as WX from '../../src/clubhouse/weather/rules.js';
import { strict, hallView, outsideView, realPlace } from '../../src/clubhouse/neighbours.js';
import { ALL as SADIE_SAYS, RATE } from '../../src/clubhouse/weather/sounds.js';
import { store, saveBox, saveRoom, backup, inspectBackup, loadBackup, onLeave, forget, reloading } from '../../src/shared/storage.js';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { checker } from '../shared/check.mjs';
import { checkPool } from './pool.mjs';

const { check, finish } = checker();

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

// ---------- the shared code names no room ----------
// The clubhouse, the outside, the shell and the toolbox work the same for every room: anything only
// one room needs lives in that room's folder, and a new kind of control goes in src/clubhouse/play/
// as something any place can use. So none of their code (comments aside) names an activity, by its
// folder or its card's name.
{
  const src = new URL('../../src/', import.meta.url).pathname, acts = join(src, 'activities'), bad = [];
  const rooms = readdirSync(acts).filter(d => statSync(join(acts, d)).isDirectory()).flatMap(d => {
    const name = readFileSync(join(acts, d, 'card.js'), 'utf8').match(/\bname:\s*(['"`])(.*?)\1/)?.[2];
    return [d, ...(name ? [name] : [])];
  });
  const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(m?js|html|css)$/.test(f)) {
    const code = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
    for (const r of rooms) if (code.includes(r)) bad.push(`${p.slice(src.length)} names ${r}`);
  } } };
  for (const d of ['clubhouse', 'shared']) walk(join(src, d));
  for (const f of ['main.js', 'index.html']) {
    const code = readFileSync(join(src, f), 'utf8').replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
    for (const r of rooms) if (code.includes(r)) bad.push(`${f} names ${r}`);
  }
  check(`the clubhouse, the outside, the shell and the toolbox name no room (${rooms.length / 2} rooms)`, !bad.length, bad.join('; '));
}

// ---------- a room's timers run on the game's time ----------
// A room that lives in the clubhouse waits with `m.after(secs, fn)` (held while paused, gone when the
// room is put away): a browser timer does neither, so nothing in a room's folder may use one.
{
  const acts = new URL('../../src/activities/', import.meta.url).pathname, bad = [];
  const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.m?js$/.test(f)) {
    const code = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
    if (/\b(setTimeout|setInterval)\b/.test(code)) bad.push(p.slice(acts.length));
  } } };
  for (const d of readdirSync(acts)) if (/\broom:/.test(readFileSync(join(acts, d, 'card.js'), 'utf8'))) walk(join(acts, d));
  check('no room uses a browser timer (m.after runs on the game\'s time)', !bad.length, bad.join(', '));
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
  check('closing every sound (the clubhouse leaving the page) leaves none behind', !Object.keys(soundState().owners).length);
  performance.now = real;
}

// ---------- the save director (src/shared/storage.js), on a pretend browser storage ----------
{
  // like a browser's: about 5 million letters of keys and saves, and a save past that fails
  const data = new Map(), size = () => [...data].reduce((n, [k, v]) => n + k.length + v.length, 0);
  globalThis.localStorage = {
    get length() { return data.size; }, key: i => [...data.keys()][i] ?? null,
    getItem: k => data.has(k) ? data.get(k) : null, removeItem: k => data.delete(k),
    setItem(k, v) { v = String(v); if (size() - (data.has(k) ? k.length + data.get(k).length : 0) + k.length + v.length > 5e6) throw new Error('QuotaExceededError'); data.set(k, v); },
  };
  const box = saveBox('aquarium');
  box.set('ocean', { found: ['duck'] });
  check('a room\'s saves are named after it, and come back as they went in', data.has('sadies-clubhouse.aquarium.ocean') && box.get('ocean').found[0] === 'duck');
  data.set('sadies-clubhouse.aquarium.ocean', '{not a save');
  const back = box.get('ocean', 'fresh');
  check('a save that can\'t be read is put aside, never wiped', back === 'fresh' && data.get('sadies-clubhouse.aquarium.ocean.unreadable') === '{not a save');
  check('...and how much room the saves take is known', saveRoom().used > 0 && !saveRoom().nearlyFull && !saveRoom().failed);
  const PRE = ['mansion.', 'sadies-clubhouse.aquarium.'];
  box.set('ocean', { found: ['duck', 'hat'] }); store.set('mansion.music', 'soft'); data.set('someone.else', 'theirs');
  const file = backup(PRE);
  box.set('ocean', { found: [] }); box.set('extra', 1); store.set('mansion.music', 'off');
  const why = loadBackup(file, PRE);
  check('a backup puts every save back as it was (and only the clubhouse\'s)', !why && box.get('ocean').found.length === 2 && store.get('mansion.music') === 'soft'
    && box.get('extra', null) === null && data.get('someone.else') === 'theirs' && !JSON.parse(file).saves['someone.else'], why);
  check('...and something that isn\'t a backup changes nothing', loadBackup('hello', PRE) && loadBackup('{"format":"other"}', PRE) && box.get('ocean').found.length === 2);
  const big = JSON.stringify({ format: 'sadies-clubhouse-backup/1', saves: { 'sadies-clubhouse.aquarium.huge': JSON.stringify('x'.repeat(5.1e6)) } });
  check('...nor one too big to fit: all or nothing', loadBackup(big, PRE) && box.get('ocean').found.length === 2 && store.get('mansion.music') === 'soft');
  // a bad file is turned away before anything is touched, and saves put aside are never wiped
  data.set('sadies-clubhouse.aquarium.old.unreadable', 'kept');
  const mk = (saves, format = 'sadies-clubhouse-backup/1') => JSON.stringify({ format, made: '2026-01-02T03:04:05Z', saves });
  const bad = {
    'a backup with no saves in it': mk({}), 'one whose saves are a list': mk([]),
    'one with only other people\'s keys': mk({ 'someone.else': '1' }),
    'one with a save that isn\'t readable': mk({ 'mansion.music': '"off"', 'sadies-clubhouse.aquarium.ocean': '{broken' }),
    'one with a save that isn\'t text': mk({ 'mansion.music': 5 }),
    'one from a newer version': mk({ 'mansion.music': '"off"' }, 'sadies-clubhouse-backup/2'),
  };
  for (const [what, text] of Object.entries(bad))
    check(`...${what} is turned away, and nothing is lost`, !!loadBackup(text, PRE) && !!inspectBackup(text, PRE).error && box.get('ocean').found.length === 2 && store.get('mansion.music') === 'soft', inspectBackup(text, PRE).error);
  check('...a newer version\'s backup says so', /NEWER VERSION/.test(inspectBackup(bad['one from a newer version'], PRE).error));
  const good = inspectBackup(mk({ 'mansion.music': '"off"' }), PRE);
  check('...a good one says its date and how many saves it holds before it\'s loaded', !good.error && good.made === '2026-01-02' && good.saves.length === 1 && store.get('mansion.music') === 'soft');
  check('...and loading never wipes a save put aside', !loadBackup(mk({ 'mansion.music': '"off"' }), PRE) && data.get('sadies-clubhouse.aquarium.old.unreadable') === 'kept' && store.get('mansion.music') === 'off');
  store.set('mansion.music', 'soft');
  store.set('sadies-clubhouse.aquarium.fill', 'x'.repeat(4.2e6));
  check('nearly full saves are noticed', saveRoom().nearlyFull && !saveRoom().failed);
  check('...and a save that doesn\'t fit fails and is noticed', !store.set('sadies-clubhouse.aquarium.more', 'x'.repeat(1e6)) && saveRoom().failed);
  data.delete('sadies-clubhouse.aquarium.fill');
  // leaving the page: every room's save-on-the-way-out runs, until a start-over (last here: after
  // it, nothing more is saved by this page)
  const leave = {}; globalThis.addEventListener = (e, f) => { leave[e] = f; };
  let left = 0;
  const stop = onLeave(() => { left++; box.set('ocean', { found: ['late'] }); }); onLeave(() => left++);
  leave.pagehide();
  check('as the page is closed, every room saves on its way out', left === 2 && box.get('ocean').found[0] === 'late');
  stop(); leave.pagehide();
  check('...but not one that\'s stopped (a room put away)', left === 3);
  onLeave(() => box.set('ocean', { found: ['too late'] }));
  forget(['sadies-clubhouse.aquarium.']); reloading();
  leave.pagehide(); box.set('again', 1);
  check('a start-over erases its saves, and nothing saves them back as the page reloads', left === 3 && box.get('ocean', null) === null && box.get('again', null) === null
    && store.get('mansion.music') === 'soft' && data.get('someone.else') === 'theirs');
  delete globalThis.localStorage; delete globalThis.addEventListener;
}

// ---------- the weather (src/clubhouse/weather/): the world's, over everywhere out of doors ----------
{
  const all = ['clear', ...WX.KINDS];
  check('the weather is one of clear, rain, snow, a second sun, cats or a tornado; anything odd is clear', WX.KINDS.join() === 'rain,snow,sun,cats,tornado' && WX.loaded('cats') === 'cats' && WX.loaded('hail') === 'clear' && WX.loaded(null) === 'clear');
  check('every weather has its look and a word from Sadie, in letters the clubhouse\'s font has', all.every(k => WX.LOOK[k] && WX.SADIE[k] && !/[^A-Z0-9 .,!'?]/.test(WX.SADIE[k])));
  check('...rain is dimmer and the second sun brighter than a clear day', WX.LOOK.rain.sun < WX.LOOK.clear.sun && WX.LOOK.sun.sun > WX.LOOK.clear.sun);
  check('it\'s saved with the clubhouse\'s own (a backup has it; no room\'s start-over clears it)', WX.KEY.startsWith('mansion.'));
  const say = Object.entries(SADIE_SAYS).map(([k, make]) => { const a = make(); return { k, secs: a.length / RATE, top: Math.max(...a.map(Math.abs)), end: Math.abs(a[a.length - 1]) }; });
  check('Sadie\'s mew and mrrp on the gatepost are short and soft, and end in silence', say.every(x => x.secs < 0.6 && x.top < 0.6 && x.end < 0.01), JSON.stringify(say));
}

// ---------- what a room is lent of next door (neighbours.js) ----------
{
  const throws = f => { try { f(); return false; } catch { return true; } };
  const kit = strict('the kit', { saves: 1, house: null });
  check('asking the kit for something it doesn\'t list is an error; what it lists is fine, even if it\'s nothing', throws(() => kit.hall) && kit.saves === 1 && kit.house === null && !throws(() => kit.then));
  const scene = { kids: [], add(...o) { this.kids.push(...o); }, remove(...o) { this.kids = this.kids.filter(k => !o.includes(k)); } };
  const hall = { scene, faces: [], uses: [], napping: { visible: true }, shape: {}, floor() {} };
  const H = hallView(hall), outside = { scene, faces: [], uses: [], block() {}, blockRound() {}, surface() {}, house: {}, sadie: {} }, O = outsideView(outside);
  check('a room is lent only the documented bits of the hall and the outside', throws(() => H.scene) && throws(() => H.napping) && throws(() => H.floor) && throws(() => O.sadie) && throws(() => O.light) && !!H.shape && !!O.house);
  check('...and can\'t change them', throws(() => { 'use strict'; H.shape = 1; }));
  const out = [H.add('ball'), H.face('cat')];
  check('...what it adds to a place it can take out again', scene.kids.includes('ball') && hall.faces.includes('cat') && (out.forEach(f => f()), !scene.kids.includes('ball') && !hall.faces.includes('cat')));
  check('...and the hall knows itself (ears().place), and the clubhouse its real place behind the view', H.is(hall) && !H.is(outside) && O.is(outside) && realPlace(O) === outside);
  const a = H.borrowSadie(), b = H.borrowSadie();
  a(); a();
  const stillOut = !hall.napping.visible && H.sadieBorrowed();
  b();
  check('Sadie is out of her box while anyone has her, and back once everyone\'s given her back (each only once)', stillOut && hall.napping.visible && !H.sadieBorrowed());
}

// ---------- the room checker: every activity's card (tests/clubhouse/cards.mjs) ----------
// nothing in the game asks anyone else's server for anything (its fonts are files of its own,
// tools/fonts/get.mjs), so it works offline and nobody is told who's playing
{
  const hits = [], walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(js|html|css)$/.test(f) && /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(p, 'utf8'))) hits.push(p.replace(/^.*\/src\//, 'src/')); } };
  walk(new URL('../../src', import.meta.url).pathname);
  check('the game asks nobody else for its fonts', !hits.length, hits.join(', '));
}
{
  const { CREDITS } = await import('../../src/clubhouse/credits.js');
  const families = [...new Set([...readFileSync(new URL('../../src/shared/fonts/fonts.css', import.meta.url), 'utf8').matchAll(/font-family:'([^']+)'/g)].map(m => m[1]))];
  const missing = families.filter(f => !CREDITS.some(c => c.name === f));
  check('every font the game carries is credited on the CREDITS page (and three.js)', !missing.length && CREDITS.some(c => c.name === 'three.js'), missing.join(', '));
}
await checkCards(check);
checkPool(check);

finish('failed', 'all passed');
