// Lily's Big Climb's music, while you're playing it: a quick, bright arcade tune. Made up as it plays,
// so it never comes round the same way twice (no drone, no tick, no loop: RULEBOOK.md section 4).
// A square-wave tune of short plucked notes that die away by themselves, a bouncy bass on the half
// bars (never every beat, nothing like a clock), and a breath between pieces. It stops as you step
// back, and gives way to the fanfare when she gets her chicken.
//
// makeComposer(rng) writes the notes (no browser: the tests read a while of it); makeMusic(h) plays
// them on the browser's own oscillators through a band (src/shared/band.js: the clubhouse's theme
// makes way for it, the pause menu's MUSIC button sets its volume, it's only heard in her house, and
// it's all stopped when the house is put away). How loud, the speeds: Claude's numbers, change freely.
import { hz } from '../../shared/retro.js';
import { makeBand } from '../../shared/band.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
// the shapes the tune is made of: scale steps, each with how long it lasts (in beats)
const MOTIFS = [
  [[0, 0.5], [2, 0.5], [4, 0.5], [7, 0.5], [4, 1], [9, 1]],
  [[7, 0.5], [7, 0.5], [9, 0.5], [7, 0.5], [4, 1], [2, 1]],
  [[4, 0.5], [5, 0.5], [7, 1], [11, 0.5], [9, 0.5], [7, 1]],
  [[9, 0.5], [7, 0.5], [4, 0.5], [2, 0.5], [0, 1], [4, 1]],
  [[2, 1], [4, 0.5], [7, 0.5], [9, 1], [7, 1]],
];

export function makeComposer(rng = Math.random) {
  const int = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const pick = a => a[Math.floor(rng() * a.length)];
  let t = 0.3, piece = 0;
  const queue = [];

  function compose() {
    piece++;
    const root = int(62, 69), beat = 60 / int(138, 156), phrases = int(4, 6);
    const note = n => root + 12 * Math.floor(n / 7) + MAJOR[((n % 7) + 7) % 7];
    const out = [];
    let at = t;
    for (let p = 0; p < phrases; p++) {
      const chords = pick([[0, 3, 4, 0], [0, 5, 3, 4], [0, 4, 5, 3], [5, 3, 4, 0]]);
      const m = pick(MOTIFS), m2 = pick(MOTIFS);
      for (let bar = 0; bar < 4; bar++) {
        const c = chords[bar], b0 = at + bar * 4 * beat;
        // the bass: the chord's root, then up the octave, on the half bars
        out.push({ at: b0, midi: note(c) - 24, len: beat * 1.2, vel: 0.32, voice: 'bass' });
        out.push({ at: b0 + 2 * beat, midi: note(c) - 12, len: beat * 1.2, vel: 0.26, voice: 'bass' });
        // the tune: a motif on the chord, then another, the last bar of the phrase held to breathe
        if (bar === 3) { out.push({ at: b0, midi: note(c + 7), len: beat * 1.5, vel: 0.34, voice: 'lead' }); continue; }
        let x = b0;
        for (const [s, d] of bar === 2 ? m2 : m) {
          if (x >= b0 + 4 * beat - 0.01) break;
          out.push({ at: x, midi: note(s + 7 + (bar === 1 ? c - chords[0] : 0)), len: beat * d * 0.8, vel: 0.3 + rng() * 0.08, voice: 'lead' });
          x += beat * d;
        }
      }
      at += 16 * beat;
    }
    out.push({ at, midi: note(14), len: beat * 2, vel: 0.34, voice: 'lead' });   // home
    out.sort((a, b) => a.at - b.at);
    for (const n of out) Object.assign(n, { piece, root });
    queue.push(...out);
    t = at + 2 + int(1, 3);   // a breath before the next piece
  }
  return {
    // the next note: { at (seconds from the start), midi, len, vel, voice ('lead' or 'bass'), piece, root }
    next() { if (!queue.length) compose(); return queue.shift(); },
  };
}

const LOUD = 0.1, AHEAD = 0.5;

// `h`: the house's sound handle. play() as you step up to the game, stop() as you step back (a quick
// fade); a new composer each time, so every game has its own tune. tick() every frame hands over the
// notes coming up.
export function makeMusic(h, rng = Math.random) {
  // the big game room's echo
  const band = makeBand(h, { echo: { delay: 0.18, feedback: 0.22, cut: 2200, send: 0.18 } }), ctx = band.ctx, part = band.part(0);
  let playing = false, played = 0, C = null, next = null, base = null;
  function voice(n, when) {
    const f = hz(n.midi), amp = ctx.createGain(), lp = ctx.createBiquadFilter(), oscs = [];
    lp.type = 'lowpass'; lp.frequency.value = n.voice === 'bass' ? 1100 : 3600;
    const osc = (type, freq, g) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = freq; og.gain.value = g; o.connect(og); og.connect(lp); oscs.push(o); };
    if (n.voice === 'bass') { osc('triangle', f, 1); osc('square', f, 0.12); }
    else { osc('square', f, 0.45); osc('triangle', f * 2, 0.2); }
    amp.gain.setValueAtTime(0, when);
    amp.gain.linearRampToValueAtTime(n.vel, when + 0.005);
    amp.gain.setTargetAtTime(0, when + 0.005, Math.min(0.22, n.len / 3));   // dies away by itself
    lp.connect(amp); amp.connect(part.out);
    const w = ctx.createGain(); w.gain.value = 0.35; amp.connect(w); w.connect(part.wet);
    for (const o of oscs) { o.start(when); o.stop(when + n.len + 0.9); }
    oscs[0].onended = () => { try { amp.disconnect(); w.disconnect(); } catch {} };
  }
  return {
    get playing() { return playing; },
    played: () => played,
    play() {
      if (playing) return;
      playing = true; base = null; C = makeComposer(rng); next = C.next();
      if (!ctx) return;
      h.wake();
      part.to(LOUD, 0.2, 1);
    },
    stop(secs = 0.8) {
      if (!playing) return;
      playing = false;
      if (!ctx) return;
      part.fade(secs);
    },
    tick() {
      if (!playing || !ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      if (base === null) base = now + 0.1;
      const song = now - base;
      // (a note more than a moment late is skipped, never crammed in: after a hitch, it just carries on)
      while (next.at < song + AHEAD) {
        if (next.at > song - 0.1) { voice(next, base + next.at); played++; }
        next = C.next();
      }
    },
  };
}
