// The maze's music: a garden music box, composed as it plays so it never comes round the same way
// twice (no drone, no tick, and Claude's choice not to loop: RULEBOOK.md section 4). Soft plucked and chimed
// notes that die away by themselves, a tune that wanders and rests, a few chord notes under it, and
// a quiet moment between pieces. Each piece has its own key, mode, speed and instruments.
//
// makeComposer(rng) writes the notes (no browser: the tests read an hour of it); makeMusic(h) plays
// them on the browser's own oscillators through a band (src/shared/band.js: the clubhouse's theme
// makes way for it, the pause menu's MUSIC button sets its volume, it's only heard in the maze, and
// it's all stopped when the maze is put away).
import { hz } from '../../shared/retro.js';
import { makeBand } from '../../shared/band.js';

export const SCALES = {
  pentatonic: [0, 2, 4, 7, 9], major: [0, 2, 4, 5, 7, 9, 11], lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
};
const NAMES = Object.keys(SCALES);
const VOICES = ['harp', 'bell', 'flute'];

export function makeComposer(rng = Math.random) {
  const int = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const pick = a => a[Math.floor(rng() * a.length)];
  let t = 1, piece = 0;
  const queue = [];

  function compose() {
    piece++;
    const root = int(53, 62), scale = pick(NAMES), steps = SCALES[scale];
    const beat = 60 / int(62, 86), per = rng() < 0.3 ? 3 : 4, bars = int(16, 28);
    const lead = pick(VOICES), under = pick(['harp', 'bell'].filter(v => v !== lead).concat(['harp']));
    // a note n scale steps above the root (any number, either way)
    const note = n => root + 12 * Math.floor(n / steps.length) + steps[((n % steps.length) + steps.length) % steps.length];
    let at = t, pos = int(steps.length, steps.length + 4), chord = 0;
    const out = [];
    for (let bar = 0; bar < bars; bar++) {
      // a new chord every two bars (on the scale's own notes), the last two bars back home
      if (bar % 2 === 0) chord = bar >= bars - 2 ? 0 : pick([0, 0, 3, 4, 5, 1, 2]);
      const phrase = Math.floor(bar / 4), sings = bar < bars - 2 && (phrase % 3 !== 2 || rng() < 0.3);
      // the chord: two or three of its notes, low and soft, on different beats
      const beats = [...Array(per).keys()].sort(() => rng() - 0.5).slice(0, int(1, Math.min(3, per)));
      for (const b of beats) out.push({ at: at + b * beat, midi: note(chord + pick([0, 2, 4]) - steps.length), len: Math.min(2, beat * 1.6), vel: 0.22 + rng() * 0.08, voice: under });
      // the tune: wandering a step or two at a time, resting often, the end of each phrase held a little
      if (sings) for (let half = 0; half < per * 2; half++) {
        if (rng() > (half % 2 ? 0.25 : 0.62)) continue;
        pos = Math.max(steps.length, Math.min(steps.length * 3, pos + pick([-2, -1, -1, 1, 1, 2, 0, 3, -3])));
        const end = bar % 4 === 3 && half >= per * 2 - 2;
        out.push({ at: at + half * beat / 2, midi: note(pos), len: Math.min(2, beat * (end ? 2 : pick([0.6, 0.9, 1.2]))), vel: 0.32 + rng() * 0.18, voice: lead });
      }
      at += per * beat;
    }
    out.push({ at, midi: note(steps.length * 2), len: Math.min(2, beat * 2), vel: 0.35, voice: lead });   // home
    out.sort((a, b) => a.at - b.at);
    for (const n of out) Object.assign(n, { piece, root, scale });
    queue.push(...out);
    t = at + 2 + int(4, 9);   // a quiet moment before the next piece
  }
  return {
    // the next note: { at (seconds from the start), midi, len, vel, voice, piece, root, scale }
    next() { if (!queue.length) compose(); return queue.shift(); },
  };
}

const LOUD = 0.13, AHEAD = 0.6;

// `h`: the maze's sound handle. play() as you come in, stop() as you leave (a slow fade); it carries
// on where it was next time. tick() every frame hands over the notes coming up.
export function makeMusic(h, rng = Math.random) {
  // a soft echo, like a garden with walls
  const band = makeBand(h, { echo: { delay: 0.37, feedback: 0.28, cut: 1700, send: 0.3 } }), ctx = band.ctx, part = band.part(0);
  let playing = false, played = 0;
  const C = makeComposer(rng);
  let next = C.next(), song = 0, base = null;   // song: where in the music it's got to (seconds)
  function voice(n, when) {
    const f = hz(n.midi), amp = ctx.createGain(), peak = n.vel, end = when + n.len;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = n.voice === 'flute' ? 2200 : 3000;
    const oscs = [];
    const osc = (type, freq, g) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = freq; og.gain.value = g; o.connect(og); og.connect(lp); oscs.push(o); };
    amp.gain.setValueAtTime(0, when);
    if (n.voice === 'flute') {
      osc('sine', f, 1); osc('triangle', f * 2, 0.08);
      amp.gain.linearRampToValueAtTime(peak * 0.8, when + 0.07);
      amp.gain.setTargetAtTime(0, when + n.len * 0.6, 0.12);
    } else {
      if (n.voice === 'bell') { osc('sine', f, 1); osc('sine', f * 2.76, 0.18); } else { osc('triangle', f, 1); osc('sine', f * 2, 0.15); }
      amp.gain.linearRampToValueAtTime(peak, when + 0.006);
      amp.gain.setTargetAtTime(0, when + 0.006, n.len / 3.5);   // dies away by itself
    }
    lp.connect(amp); amp.connect(part.out);
    const w = ctx.createGain(); w.gain.value = 0.5; amp.connect(w); w.connect(part.wet);
    for (const o of oscs) { o.start(when); o.stop(end + 1); }
    oscs[0].onended = () => { try { amp.disconnect(); w.disconnect(); } catch {} };
  }
  return {
    get playing() { return playing; },
    played: () => played,
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
