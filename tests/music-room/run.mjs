// The music room's headless checks: its instruments' sounds (sounds/), Sadie (sadie.js), the tape
// deck (tape.js) and which key plays what (layout.js), run in Node, seeded so every run is the same.
// A few seconds.
//
//   node tests/music-room/run.mjs
import { RATE } from '../../src/shared/retro.js';
import { toyPiano, WHITE, BLACK, OUT_OF_TUNE } from '../../src/activities/music-room/sounds/piano.js';
import { bar, BARS } from '../../src/activities/music-room/sounds/xylophone.js';
import { drum, DRUMS } from '../../src/activities/music-room/sounds/drums.js';
import { synthNote, VOICES } from '../../src/activities/music-room/sounds/synth.js';
import { chime, TUBES } from '../../src/activities/music-room/sounds/chimes.js';
import { makeSadie, stepSadie, goNow, KEYS, TIMING } from '../../src/activities/music-room/sadie.js';
import { makeTape, press, heard, stepTape, sadieTake, saveTape, LONGEST } from '../../src/activities/music-room/tape.js';
import { keyboardNote, noteAt, barOf, WHITE_KEYS, BLACK_KEYS, KEYS_PIC } from '../../src/activities/music-room/layout.js';
import { checker } from '../shared/check.mjs';

const { check, finish } = checker();

// 1. the sounds: every one is 8-bit, not silent, soft (never at full blast: the owner can't stand
// harsh noise), and fades right down to nothing, with no click at the start
{
  const all = [
    ...[...WHITE, ...BLACK.map(b => b[0])].map(n => ['piano ' + n, toyPiano(n)]),
    ...BARS.map(n => ['xylophone ' + n, bar(n)]),
    ...DRUMS.map(d => ['drum ' + d, drum(d)]),
    ...VOICES.flatMap(v => [60, 67, 76].map(n => [`synth ${v} ${n}`, synthNote(v, n)])),
    ...TUBES.map((_, i) => ['chime ' + i, chime(i)]),
  ];
  const bad = { eight: [], silent: [], loud: [], tail: [], click: [], long: [] };
  for (const [name, a] of all) {
    let peak = 0; for (const v of a) peak = Math.max(peak, Math.abs(v));
    if (a.some(v => Math.abs(Math.round(v * 127) - v * 127) > 1e-3)) bad.eight.push(name);
    if (peak < 0.1) bad.silent.push(name);
    if (peak > 0.8) bad.loud.push(name);
    if (a.slice(-20).some(v => v !== 0)) bad.tail.push(name);
    if (Math.abs(a[0]) > 0.05) bad.click.push(name);
    if (a.length > 2.5 * RATE) bad.long.push(name);
  }
  check(`all ${all.length} of the instruments' sounds are 8-bit`, !bad.eight.length, bad.eight.join(', '));
  check('...none of them silent', !bad.silent.length, bad.silent.join(', '));
  check('...none of them at full blast', !bad.loud.length, bad.loud.join(', '));
  check('...every one fades right down to nothing', !bad.tail.length, bad.tail.join(', '));
  check('...none starts with a click', !bad.click.length, bad.click.join(', '));
  check('...and none rings on for long (2.5 seconds at most)', !bad.long.length, bad.long.join(', '));
  const zc = a => { let n = 0; for (let i = 1; i < 2000; i++) if (a[i - 1] <= 0 && a[i] > 0) n++; return n; };
  check('the out-of-tune key is sharper than it should be', zc(toyPiano(OUT_OF_TUNE)) > zc(toyPiano(OUT_OF_TUNE - 1)) * Math.pow(2, 1.3 / 12));
}

// 2. which key plays what
{
  check('A to ; play the ten white keys, W E T Y U O P the seven black ones', WHITE_KEYS.every((k, i) => keyboardNote(k) === WHITE[i]) && BLACK_KEYS.every((k, i) => keyboardNote(k) === BLACK[i][0]));
  check('...and other keys play nothing', keyboardNote('KeyQ') === null && keyboardNote('Escape') === null);
  const whites = WHITE.every((n, i) => noteAt(i * 12 + 6, KEYS_PIC.h - 4) === n);
  const blacks = BLACK.every(([n, i]) => noteAt((i + 1) * 12, 5) === n);
  check('pressing a key\'s picture finds that key (white near you, black further in)', whites && blacks);
  check('A to K play the xylophone\'s eight bars', ['KeyA', 'KeyK'].map(barOf).join() === [BARS[0], BARS[7]].join() && barOf('KeyL') === null);
}

// 3. Sadie: rare (a walk every few minutes you're in the room), a few steps each, never on what
// you're playing, never while the sign says SHH, never while you're out of the room
{
  const HOURS = 3, DT = 0.1;
  let walks = 0, onPlaying = 0, perWalk = [], cur = 0, sulks = 0, shhNotes = 0, awayNotes = 0, gaps = [], lastEnd = null, loudest = 0;
  const S = makeSadie(42);
  let mode = S.mode;
  for (let t = 0; t < HOURS * 3600; t += DT) {
    const hour = Math.floor(t / 3600);
    const playing = Math.floor(t / 300) % 3 === 0 ? 'piano' : Math.floor(t / 300) % 3 === 1 ? 'drums' : null;
    const welcome = hour !== 1, here = !(t % 1800 > 1500);   // (the second hour: SHH; now and then: out of the room)
    const ev = stepSadie(S, DT, { here, playing, welcome });
    for (const e of ev) {
      cur++; loudest = Math.max(loudest, e.loud);
      if (e.inst === playing) onPlaying++;
      if (!welcome) shhNotes++;
      if (!here) awayNotes++;
    }
    if (S.mode !== mode) {
      if (S.mode === 'hop') { walks++; if (lastEnd !== null) gaps.push(t - lastEnd); cur = 0; }
      if (S.mode === 'sulk') sulks++;
      if (S.mode === 'cushion') { lastEnd = t; if (mode !== 'sulk' && cur) perWalk.push(cur); }
      mode = S.mode;
    }
  }
  const most = Math.max(...perWalk), fewest = Math.min(...perWalk), gap = Math.min(...gaps);
  check(`Sadie walks on an instrument only now and then (${walks} times in ${HOURS} hours)`, walks >= 10 && walks <= 50);
  check(`...never less than ${TIMING.between[0] / 60 | 0} minutes apart`, gap >= TIMING.between[0] - 1, `closest ${Math.round(gap)} s`);
  check('...a few notes each time (4 to 8, counting the one at the end)', fewest >= 4 && most <= 8, `${fewest} to ${most}`);
  check('...never on the instrument you\'re playing', onPlaying === 0, `${onPlaying} notes`);
  check('...not a note while the sign says SHH (she sits beside one, offended)', shhNotes === 0 && sulks > 0, `${sulks} sulks`);
  check('...and never while you\'re out of the room', awayNotes === 0);
  check('...softer than you play (paws, not fingers)', loudest <= 0.96, loudest.toFixed(2));

  // she hops straight off when you step up to the one she's on
  const S2 = makeSadie(7); const w = { here: true, playing: null, welcome: true };
  goNow(S2, w, 'piano'); for (let i = 0; i < 20; i++) stepSadie(S2, 0.1, w);
  const on = S2.mode;
  const after = stepSadie(S2, 0.1, { ...w, playing: 'piano' });
  check('stepping up to the piano while she\'s walking on it, she hops off without a sound', on === 'walk' && S2.mode === 'back' && !after.length, `${on} → ${S2.mode}`);
  // her keys are always on the instrument
  let off = 0;
  for (let s = 1; s <= 40; s++) {
    const S3 = makeSadie(s);
    for (const inst of Object.keys(KEYS)) { goNow(S3, w, inst); for (let i = 0; i < 400; i++) for (const e of stepSadie(S3, 0.1, w)) off += e.keys.filter(k => k < 0 || k >= KEYS[inst]).length; }
  }
  check('her paws always land on keys that are there', off === 0);
}

// 4. the tape deck
{
  const T = makeTape(null);
  press(T, 'rec', 10);
  heard(T, { inst: 'piano', n: 60 }, 13); heard(T, { inst: 'piano', n: 62 }, 13.5); heard(T, { inst: 'drums', n: 'kick' }, 14);
  press(T, 'stop', 20);
  check('REC records what you play onto your tape', T.mine.length === 3 && T.state === 'idle');
  check('...starting with the first note (no quiet before it)', T.mine[0].at <= 0.3 + 1e-9, String(T.mine[0].at));
  press(T, 'play', 100);
  let got = [];
  for (let t = 100; t < 104; t += 0.05) got.push(...stepTape(T, t));
  check('PLAY plays it back, once', got.length === 3 && T.state === 'idle');
  press(T, 'loop', 200); got = [];
  for (let t = 200; t < 210; t += 0.05) got.push(...stepTape(T, t));
  check('LOOP plays it over and over', got.length >= 9, `${got.length} notes in 10 s`);
  press(T, 'stop', 210); got = [];
  for (let t = 210; t < 215; t += 0.05) got.push(...stepTape(T, t));
  check('...until STOP', !got.length && T.state === 'idle');
  press(T, 'rec', 300);
  for (let i = 0; i < 100; i++) heard(T, { inst: 'piano', n: 60 }, 300 + i);
  check(`a recording stops by itself after a minute`, T.state === 'idle' && T.mine.length <= LONGEST + 1, `${T.mine.length} notes`);
  sadieTake(T, [{ inst: 'piano', n: 64, at: 0 }, { inst: 'piano', n: 65, at: 0.5 }]);
  press(T, 'tape', 400);
  check('TAPE swaps to SADIE LIVE! (her last walk)', T.which === 'sadie' && T.sadie.length === 2);
  press(T, 'rec', 401);
  check('...and REC always records on yours, never over hers', T.which === 'mine' && T.sadie.length === 2);
  const back = makeTape(JSON.parse(JSON.stringify(saveTape(T))));
  check('both tapes are kept', back.sadie.length === 2 && makeTape({ mine: 'junk', sadie: [{ at: 'x' }] }).mine.length === 0);
}

finish();
