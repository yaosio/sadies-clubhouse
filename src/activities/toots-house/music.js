// Toots' music, while you're in her house: a bouncy little tune with barks in it. Made up as it plays,
// so it never comes round the same way twice (no drone, no tick, no loop: RULEBOOK.md section 4).
// Plucked notes that die away by themselves, a walking bass on the half bars only (never every beat),
// and at the end of a phrase the barks answer the tune: two or three little "arf"s, sung on the
// tune's own notes, like a dog joining in. A quiet moment between pieces. The barks are made here from
// numbers, not her recording: her real voice is only ever her roo.
//
// makeComposer(rng) writes the notes (no browser: the tests read an hour of it); makeMusic(h) plays
// them on the browser's own oscillators through a band (src/shared/band.js: the clubhouse's theme
// makes way for it, the pause menu's MUSIC button sets its volume, it's only heard in her house, and
// it's all stopped when the house is put away). How loud, how often she barks, the speeds: Claude's
// numbers, change them freely.
import { hz } from '../../shared/retro.js';
import { makeBand } from '../../shared/band.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
// the shapes the tune is made of: scale steps, each with how long it lasts (in beats)
const MOTIFS = [
  [[4, 0.5], [5, 0.5], [7, 1], [4, 1], [2, 1]],
  [[0, 0.5], [2, 0.5], [4, 0.5], [7, 0.5], [9, 1], [7, 1]],
  [[7, 1], [9, 0.5], [7, 0.5], [4, 1], [5, 1]],
  [[2, 0.5], [4, 0.5], [2, 0.5], [0, 0.5], [4, 1], [7, 1]],
];

export function makeComposer(rng = Math.random) {
  const int = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const pick = a => a[Math.floor(rng() * a.length)];
  let t = 1, piece = 0;
  const queue = [];

  function compose() {
    piece++;
    const root = int(58, 65), beat = 60 / int(104, 126), phrases = int(4, 6);
    const lead = pick(['pluck', 'bell']);
    const note = n => root + 12 * Math.floor(n / 7) + MAJOR[((n % 7) + 7) % 7];
    const out = [];
    let at = t;
    for (let p = 0; p < phrases; p++) {
      // a phrase is four bars: the tune for three (a motif, then the same again a step up or down),
      // and the fourth left for her to answer (every other phrase, and always the last)
      const chords = p === phrases - 1 ? [0, 3, 4, 0] : pick([[0, 3, 4, 0], [0, 5, 3, 4], [0, 4, 5, 3]]);
      const m = pick(MOTIFS), lift = pick([0, 1, -1, 2]);
      const answers = p % 2 === 1 || p === phrases - 1;
      for (let bar = 0; bar < 4; bar++) {
        const c = chords[bar], b0 = at + bar * 4 * beat;
        // the bass: the chord's root on beat one, and its fifth on beat three
        out.push({ at: b0, midi: note(c) - 24, len: beat * 1.6, vel: 0.3, voice: 'bass' });
        out.push({ at: b0 + 2 * beat, midi: note(c + 4) - 24, len: beat * 1.4, vel: 0.24, voice: 'bass' });
        if (bar === 3 && answers) {
          // her answer: two or three barks, on the chord's own notes, with a rest after
          const n = int(2, 3);
          for (let k = 0; k < n; k++) out.push({ at: b0 + k * beat * (n === 2 ? 1 : 0.75), midi: note(c + pick([0, 2, 4]) + 7), len: 0.16, vel: 0.5 + rng() * 0.15, voice: 'bark' });
          continue;
        }
        if (bar === 3) { out.push({ at: b0, midi: note(c + 7), len: beat * 2, vel: 0.36, voice: lead }); continue; }
        // the tune: the motif, moved to sit on this bar's chord
        let x = b0;
        for (const [s, d] of m) {
          if (x >= b0 + 4 * beat - 0.01) break;
          out.push({ at: x, midi: note(s + 7 + (bar === 1 ? lift : bar === 2 ? c - chords[0] : 0)), len: beat * d * 0.9, vel: 0.34 + rng() * 0.1, voice: lead });
          x += beat * d;
        }
      }
      at += 16 * beat;
    }
    out.push({ at, midi: note(7), len: beat * 2, vel: 0.36, voice: lead });   // home
    out.push({ at: at + beat, midi: note(11), len: 0.16, vel: 0.55, voice: 'bark' });   // and one last arf
    out.sort((a, b) => a.at - b.at);
    for (const n of out) Object.assign(n, { piece, root });
    queue.push(...out);
    t = at + 2 + int(5, 10);   // a quiet moment before the next piece
  }
  return {
    // the next note: { at (seconds from the start), midi, len, vel, voice ('pluck', 'bell', 'bass' or 'bark'), piece, root }
    next() { if (!queue.length) compose(); return queue.shift(); },
  };
}

const LOUD = 0.12, AHEAD = 0.6;

// `h`: the house's sound handle. play() as you come in, stop() as you leave (a slow fade); it carries
// on where it was next time. tick() every frame hands over the notes coming up.
export function makeMusic(h, rng = Math.random) {
  // a small room's echo
  const band = makeBand(h, { echo: { delay: 0.21, feedback: 0.2, cut: 1800, send: 0.22 } }), ctx = band.ctx, part = band.part(0);
  let playing = false, played = 0, barked = 0, noise = null;
  const C = makeComposer(rng);
  let next = C.next(), song = 0, base = null;
  // a bark: a buzzy note that jumps up and falls straight back, through a mouth-shaped filter, with a
  // breath of noise at its start ("arf")
  function bark(n, when) {
    const f = hz(n.midi), amp = ctx.createGain(), mouth = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter();
    mouth.type = 'bandpass'; mouth.frequency.setValueAtTime(900, when); mouth.frequency.linearRampToValueAtTime(1500, when + 0.04); mouth.frequency.linearRampToValueAtTime(700, when + n.len); mouth.Q.value = 1.6;
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f * 0.9, when); o.frequency.linearRampToValueAtTime(f * 1.25, when + 0.03); o.frequency.exponentialRampToValueAtTime(f * 0.7, when + n.len);
    o.connect(mouth);
    if (!noise) { noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.05), ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (rng() * 2 - 1) * (1 - i / d.length); }
    const breath = ctx.createBufferSource(), bg = ctx.createGain(); breath.buffer = noise; bg.gain.value = 0.35; breath.connect(bg); bg.connect(mouth);
    mouth.connect(lp); lp.connect(amp);
    amp.gain.setValueAtTime(0, when); amp.gain.linearRampToValueAtTime(n.vel * 1.4, when + 0.008); amp.gain.setTargetAtTime(0, when + 0.05, 0.035);
    amp.connect(part.out);
    const w = ctx.createGain(); w.gain.value = 0.4; amp.connect(w); w.connect(part.wet);
    o.start(when); o.stop(when + n.len + 0.3); breath.start(when);
    o.onended = () => { try { amp.disconnect(); w.disconnect(); } catch {} };
    barked++;
  }
  function voice(n, when) {
    if (n.voice === 'bark') return bark(n, when);
    const f = hz(n.midi), amp = ctx.createGain(), lp = ctx.createBiquadFilter(), oscs = [];
    lp.type = 'lowpass'; lp.frequency.value = n.voice === 'bass' ? 900 : 3200;
    const osc = (type, freq, g) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = freq; og.gain.value = g; o.connect(og); og.connect(lp); oscs.push(o); };
    if (n.voice === 'bell') { osc('sine', f, 1); osc('sine', f * 2.76, 0.16); }
    else if (n.voice === 'bass') { osc('triangle', f, 1); osc('sine', f * 2, 0.2); }
    else { osc('square', f, 0.35); osc('triangle', f, 0.8); }
    amp.gain.setValueAtTime(0, when);
    amp.gain.linearRampToValueAtTime(n.vel, when + 0.006);
    amp.gain.setTargetAtTime(0, when + 0.006, Math.min(0.35, n.len / 3));   // dies away by itself
    lp.connect(amp); amp.connect(part.out);
    const w = ctx.createGain(); w.gain.value = 0.4; amp.connect(w); w.connect(part.wet);
    for (const o of oscs) { o.start(when); o.stop(when + n.len + 1.2); }
    oscs[0].onended = () => { try { amp.disconnect(); w.disconnect(); } catch {} };
  }
  return {
    get playing() { return playing; },
    played: () => played,
    barked: () => barked,
    play() {
      if (playing) return;
      playing = true; base = null;
      if (!ctx) return;
      h.wake();
      part.to(LOUD, 0.4, 1);
    },
    stop() {
      if (!playing) return;
      playing = false;
      if (!ctx) return;
      part.fade(1.5);
    },
    tick() {
      if (!playing) return;
      if (!ctx || ctx.state !== 'running') { song = next.at; return; }   // (no sound: it just waits)
      const now = ctx.currentTime;
      if (base === null) { base = now + 0.1 - song; if (next.at < song) next = C.next(); }
      song = now - base;
      // (a note more than a moment late is skipped, never crammed in: after a hitch, it just carries on)
      while (next.at < song + AHEAD) {
        if (next.at > song - 0.1) { voice(next, base + next.at); played++; }
        next = C.next();
      }
    },
  };
}
