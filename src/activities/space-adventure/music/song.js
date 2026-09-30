// The music, as notes (plain numbers: the tests read them). Two versions of the same tune:
//
// - The trip's: slow, sad synthwave in A minor. It starts with just soft chords and a bell, and
//   builds a layer at a time (a rippling arpeggio, the bass, the melody, soft drums), brighter and
//   fuller as the planet gets closer, up to a big finish right as you land (the last chord turns
//   major), then it fades away and leaves Sadie to talk.
// - The radio's, in Sadie's space room: the same tune, happy, in C major and bouncier, over and over.
//
// A note is { t (seconds from the start), kind (synth.js's INSTRUMENTS), midi or notes, len, bright, vol }.

const q = x => Math.round(x * 10) / 10;   // (brightness in steps, so each sound is only made a few times)

// the tune, four bars at a time: [bar, beat, midi, beats long]. The same shape in both keys.
const PHRASES = {
  A: [[0, 0, 76, 2], [0, 2, 74, 1], [0, 3, 72, 1], [1, 0, 72, 1.5], [1, 1.5, 69, 2.5], [2, 0, 67, 1], [2, 1, 72, 1], [2, 2, 76, 2], [3, 0, 74, 3]],
  B: [[0, 0, 76, 1], [0, 1, 79, 1], [0, 2, 81, 2], [1, 0, 79, 1], [1, 1, 77, 1], [1, 2, 76, 2], [2, 0, 76, 1], [2, 1, 74, 1], [2, 2, 72, 1], [2, 3, 74, 1], [3, 0, 71, 2], [3, 2, 74, 2]],
  C: [[0, 0, 69, 1], [0, 1, 72, 1], [0, 2, 76, 1], [0, 3, 81, 1], [1, 0, 72, 1], [1, 1, 77, 1], [1, 2, 81, 2], [2, 0, 79, 1], [2, 1, 76, 1], [2, 2, 79, 1], [2, 3, 84, 1], [3, 0, 83, 2], [3, 2, 86, 2]],
};
// A minor into C major: each note of the tune moved up to the same step of the happy key (and the one
// low G to an A, so it sits on the F chord under it)
const MAJOR = { 67: 69, 69: 72, 71: 74, 72: 76, 74: 77, 76: 79, 77: 81, 79: 83, 81: 84 };

// ---------- the trip's ----------
// It starts when the engines start (T.go) and lands on a bar line exactly at touchdown: bar LANDING.
export const LANDING = 29;
export function tripSong(secs) {   // secs: from the start of the music to touchdown
  const BAR = secs / LANDING, BEAT = BAR / 4, out = [];
  const add = (bar, beat, e) => out.push({ t: (bar + beat / 4) * BAR, ...e });
  // i VI III VII: A minor, F, C, G (with a note added to each, the synthwave way)
  const CHORDS = [[57, 60, 64, 71], [53, 57, 60, 64], [55, 60, 64, 67], [55, 59, 62, 67]], ROOTS = [45, 41, 48, 43];
  const lift = bar => Math.min(1, bar / 27);   // (how far into the build: brighter and louder as it goes)
  for (let bar = 0; bar < LANDING - 1; bar++) {
    const c = bar % 4, L = lift(bar), bright = q(0.15 + 0.6 * L);
    // chords that swell and fade every bar
    add(bar, 0, { kind: 'pad', notes: CHORDS[c], len: q(BAR * 0.96), bright, vol: 0.5 + 0.35 * L });
    // a bell, now and then, at the start
    if (bar < 8 && bar % 2 === 0) add(bar, 0, { kind: 'bell', midi: CHORDS[c][3] + 12, vol: 0.35 });
    if (bar < 4) add(bar, 2, { kind: 'bell', midi: CHORDS[c][2] + 12, vol: 0.25 });
    // the arpeggio: eighths, then sixteenths for the build
    if (bar >= 4) {
      const fast = bar >= 20 && bar < 28, steps = fast ? 16 : 8, pat = [0, 1, 2, 3, 2, 1, 2, 3];
      for (let s = 0; s < steps; s++) add(bar, s * 4 / steps, { kind: 'pluck', midi: CHORDS[c][pat[s % 8]] + 12, len: q(Math.min(0.6, BEAT * 4 / steps * 1.6)), bright: q(0.3 + 0.5 * L), vol: 0.22 + 0.15 * L });
    }
    // the bass, from bar 8: long notes, then eighths once the drums are in
    if (bar >= 8) {
      if (bar < 16) { add(bar, 0, { kind: 'bass', midi: ROOTS[c], len: q(BEAT * 1.9), bright, vol: 0.55 }); add(bar, 2, { kind: 'bass', midi: ROOTS[c], len: q(BEAT * 1.9), bright, vol: 0.5 }); }
      else for (let s = 0; s < 8; s++) add(bar, s / 2, { kind: 'bass', midi: ROOTS[c] + (s % 4 === 3 ? 12 : 0), len: q(BEAT * 0.45), bright, vol: 0.5 });
    }
    // soft drums from bar 16 (a kick and that big snare; no hi-hats ticking away)
    if (bar >= 16) {
      add(bar, 0, { kind: 'kick', vol: 0.5 }); add(bar, 2, { kind: 'kick', vol: 0.45 });
      add(bar, 1, { kind: 'snare', vol: 0.3 + 0.1 * L }); add(bar, 3, { kind: 'snare', vol: 0.3 + 0.1 * L });
    }
  }
  // the melody: A, B, A up high, the rising one for the way in, and B up high over the land
  const melody = (name, from, up = 0, vol = 0.45) => {
    for (const [b, beat, m, len] of PHRASES[name]) add(from + b, beat, { kind: 'lead', midi: m + up, len: q(BEAT * len * 0.95), bright: q(0.3 + 0.5 * lift(from + b)), vol });
  };
  melody('A', 8); melody('B', 12); melody('A', 16, 0, 0.5); melody('C', 20, 0, 0.5); melody('B', 24, 12, 0.42);
  // the last bar before touchdown: F then G, the drums rolling in, the melody climbing...
  const LB = LANDING - 1;
  add(LB, 0, { kind: 'pad', notes: [53, 57, 60, 65], len: q(BEAT * 1.9), bright: 1, vol: 0.9 });
  add(LB, 2, { kind: 'pad', notes: [55, 59, 62, 67], len: q(BEAT * 1.9), bright: 1, vol: 0.9 });
  add(LB, 0, { kind: 'lead', midi: 84, len: q(BEAT * 1.9), bright: 0.9, vol: 0.5 }); add(LB, 2, { kind: 'lead', midi: 86, len: q(BEAT * 1.9), bright: 0.9, vol: 0.5 });
  for (let s = 0; s < 8; s++) add(LB, s / 2, { kind: 'bass', midi: s < 4 ? 41 : 43, len: q(BEAT * 0.45), bright: 1, vol: 0.55 });
  for (let s = 0; s < 8; s++) add(LB, s / 2, { kind: 'snare', vol: 0.18 + s * 0.03 });
  add(LB, 0, { kind: 'kick', vol: 0.5 }); add(LB, 2, { kind: 'kick', vol: 0.5 });
  // ...and touchdown: A major, big and bright, ringing out and fading away
  add(LANDING, 0, { kind: 'pad', notes: [57, 61, 64, 69, 73], len: q(BAR * 1.75), bright: 1, vol: 1 });
  add(LANDING, 0, { kind: 'lead', midi: 85, len: q(BAR * 1.2), bright: 0.9, vol: 0.5 });
  add(LANDING, 0, { kind: 'bass', midi: 45, len: q(BAR * 1.2), bright: 0.8, vol: 0.6 });
  add(LANDING, 0, { kind: 'kick', vol: 0.55 });
  for (const [beat, m] of [[0, 81], [1, 85], [2, 88], [3, 93]]) add(LANDING, beat, { kind: 'bell', midi: m, vol: 0.3 });
  return out.sort((a, b) => a.t - b.t);
}

// ---------- the radio's ----------
// The same tune, happy: C major, quicker, C, A minor, F, G (the happy 50s way round), bouncing bass. Sixteen bars that go round and
// round (the first four without the melody, so it breathes between times).
export function radioSong() {
  const BAR = 4 * 60 / 112, BEAT = BAR / 4, out = [];
  const add = (bar, beat, e) => out.push({ t: (bar + beat / 4) * BAR, ...e });
  const CHORDS = [[60, 64, 67, 72], [57, 60, 64, 69], [57, 60, 65, 69], [55, 59, 62, 67]], ROOTS = [48, 45, 41, 43];
  for (let bar = 0; bar < 16; bar++) {
    const c = bar % 4;
    add(bar, 0, { kind: 'pad', notes: CHORDS[c], len: q(BAR * 0.9), bright: 0.6, vol: 0.4 });
    const pat = [0, 2, 1, 3, 2, 1, 3, 2];
    for (let s = 0; s < 8; s++) add(bar, s / 2, { kind: 'pluck', midi: CHORDS[c][pat[s]] + 12, len: 0.3, bright: 0.8, vol: 0.2 });
    for (let s = 0; s < 4; s++) add(bar, s, { kind: 'bass', midi: ROOTS[c] + (s % 2 ? 12 : 0), len: q(BEAT * 0.8), bright: 0.6, vol: 0.45 });
    if (bar >= 2) { add(bar, 0, { kind: 'kick', vol: 0.4 }); add(bar, 2, { kind: 'kick', vol: 0.4 }); add(bar, 1, { kind: 'snare', vol: 0.22 }); add(bar, 3, { kind: 'snare', vol: 0.22 }); }
    if (bar % 4 === 0 && bar < 4) add(bar, 0, { kind: 'bell', midi: 84, vol: 0.3 });
  }
  const melody = (name, from) => {
    for (const [b, beat, m, len] of PHRASES[name]) add(from + b, beat, { kind: 'lead', midi: MAJOR[m] ?? m, len: q(BEAT * len * 0.85), bright: 0.8, vol: 0.4 });
  };
  melody('A', 4); melody('B', 8); melody('A', 12);
  return { notes: out.sort((a, b) => a.t - b.t), length: 16 * BAR };
}
