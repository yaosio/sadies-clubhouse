// The barbershop's music, written as notes and made into samples with the toolbox's kit: the shop's own
// tune (two eight-bar parts, about forty seconds, played round and round while you're inside) and a
// little song for each show, each about as long as its show. Melody, never a drone or a tick: every
// note is a bell, a flute or a soft pluck that dies away, and the bass only comes in once or twice a bar.
// Played on the music line by player.js; here it's only numbers (the tests run it in Node).
import { blank, ring, tone, pluck, dry, hz } from '../../../shared/retro.js';

const NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// 'Eb5' -> 76: a note's number (60 is middle C)
const midi = n => { const m = /^([A-G])([#b]?)(\d)$/.exec(n); return 12 * (+m[3] + 1) + NAMES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };

// the voices: each puts a note of `len` seconds at `at` into `a`
const VOICE = {
  bell: (a, f, at, len, g = 1) => { ring(a, f, 3.2, 0.09 * g, at); ring(a, f * 2, 8, 0.025 * g, at); },
  flute: (a, f, at, len, g = 1) => tone(a, at, len * 0.95, f, f, (t, k) => Math.min(1, t / 0.05) * (k > 0.75 ? (1 - k) / 0.25 : 1) * (0.7 + 0.3 * Math.exp(-t * 3)),
    { tri: true, h2: 0.12, wob: 0.008, wobHz: 5, gain: 0.11 * g }),
  horn: (a, f, at, len, g = 1) => tone(a, at, len * 0.92, f, f, (t, k) => Math.min(1, t / 0.03) * (k > 0.8 ? (1 - k) / 0.2 : 1) * (0.75 + 0.25 * Math.exp(-t * 4)),
    { h2: 0.35, gain: 0.07 * g }),
  bass: (a, f, at, len, g = 1) => tone(a, at, Math.max(len, 0.6), f, f, pluck(2.8), { tri: true, gain: 0.2 * g }),
};
// a run of notes into `a` on one voice: 'C5:1 E5:0.5 R:0.5' is note:beats (R is a rest); returns the beat it ends on
function line(a, voice, beat, text, from = 0, g = 1) {
  let b = from;
  for (const tok of text.trim().split(/\s+/)) {
    const [n, d = '1'] = tok.split(':'), len = +d;
    if (n !== 'R') VOICE[voice](a, hz(midi(n)), b * beat, len * beat, g);
    b += len;
  }
  return b;
}
const secs = (beats, beat, tail = 0.8) => blank(beats * beat + tail);

// ---------- the shop's tune: two parts of eight bars, four beats each ----------
const CHORD = { C: ['C3', 'G3'], Am: ['A2', 'E3'], F: ['F2', 'C3'], G: ['G2', 'D3'], Dm: ['D3', 'A3'] };
const PART_A = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G'];
const PART_B = ['Dm', 'G', 'C', 'Am', 'F', 'G', 'C', 'C'];
const MEL_A = 'E5:1 G5:0.5 A5:0.5 G5:2  E5:1 C5:1 A4:2  F5:1 A5:1 G5:1 F5:1  E5:1 D5:1 G4:2  E5:1 G5:0.5 A5:0.5 C6:2  B5:1 A5:1 G5:2  A5:1 G5:1 F5:1 E5:1  D5:2 R:2';
const MEL_B = 'F5:1 A5:1 D6:2  D6:1 B5:1 G5:2  E6:1 C6:1 G5:2  A5:1 C6:1 E6:2  F6:1 E6:1 D6:1 C6:1  B5:1 D6:1 G5:2  C6:1 E6:1 G5:1 E5:1  C5:3 R:1';
export function shop() {
  const beat = 0.6, bars = [...PART_A, ...PART_B], a = blank(bars.length * 4 * beat);
  bars.forEach((c, i) => { VOICE.bass(a, hz(midi(CHORD[c][0])), i * 4 * beat, 2 * beat); VOICE.bass(a, hz(midi(CHORD[c][1])), (i * 4 + 2) * beat, 2 * beat, 0.7); });
  line(a, 'flute', beat, MEL_A, 0, 0.9);
  line(a, 'flute', beat, MEL_B, 32, 0.9);
  line(a, 'bell', beat, 'C6:2 R:2 A5:2 R:2 A5:2 R:2 B5:2 R:2 C6:2 R:2 C6:2 R:2 A5:2 R:2 B5:2 R:2  E6:2 R:2 D6:2 R:2 C6:2 R:2 C6:2 R:2 A5:2 R:2 B5:2 R:2 G5:2 R:2 C6:2 R:2', 0, 0.7);   // (a quiet bell on top, now and then)
  return dry(a, 0.002);
}

// ---------- the shows' songs ----------
// the pop star: a little backing for eight meows (they come every half second or so)
export function sing() {
  const beat = 0.52, a = secs(12, beat);
  [['C3', 0], ['F2', 2], ['G2', 4], ['C3', 6]].forEach(([n, b]) => VOICE.bass(a, hz(midi(n)), b * beat, 2 * beat));
  line(a, 'bell', beat, 'E6:1 G6:1 A6:1 G6:1 F6:1 D6:1 E6:1 R:1 C6:0.5 E6:0.5 G6:0.5 C7:2', 0, 0.8);
  return dry(a, 0.4);
}
// the construction worker: a whistled work tune that builds up, then comes apart when the tower falls (about 5.2 s in)
export function build() {
  const beat = 0.4, a = secs(20, beat);
  line(a, 'flute', beat, 'C5:1 E5:1 G5:1 E5:1  C5:1 E5:1 G5:2  F5:1 A5:1 C6:1 A5:1  G5:1 E5:1 D5:1 R:1', 0, 1);
  [['C3', 0], ['F2', 8], ['G2', 12]].forEach(([n, b]) => VOICE.bass(a, hz(midi(n)), b * beat, 2 * beat));
  // ...and the sad trombone of a tower falling over
  tone(a, 5.3, 0.5, 330, 300, (t, k) => Math.min(1, t / 0.04) * (1 - k * 0.3), { h2: 0.4, gain: 0.07 });
  tone(a, 5.85, 0.5, 280, 250, (t, k) => Math.min(1, t / 0.04) * (1 - k * 0.3), { h2: 0.4, gain: 0.07 });
  tone(a, 6.4, 1.3, 240, 150, (t, k) => Math.min(1, t / 0.04) * (1 - k), { h2: 0.4, wob: 0.03, wobHz: 6, gain: 0.07 });
  return dry(a, 0.4);
}
// the ball gown: a music-box waltz in three-time
export function dance() {
  const beat = 0.333, a = blank(24 * beat + 1.2);
  const note = (f, at, amp) => { ring(a, f, 4.2, amp, at); ring(a, f * 2, 9, amp * 0.25, at); };
  [659, 784, 784, 698, 659, 659, 587, 659, 698, 659, 587, 523, 587, 659, 523, 494, 523, 587, 659, 587, 523, 523, 0, 0].forEach((f, i) => f && note(f * 1.5, i * beat, 0.07));
  [262, 220, 175, 196, 262, 196, 175, 131].forEach((f, k) => note(f, k * 3 * beat, 0.06));
  return dry(a, 0.4);
}
// the magician: harp-like runs in A minor, and a ta-da (at 5.2 s) when Marbles pops out of the hat
export function magic() {
  const beat = 0.25, a = secs(32, beat);
  line(a, 'bell', beat, 'A4:1 C5:1 E5:1 A5:1 E5:1 C5:1 A4:2  B4:1 D5:1 E5:1 G#5:1 E5:1 D5:1 B4:2  A4:0.5 C5:0.5 E5:0.5 A5:0.5 C6:0.5 E6:0.5 A6:2', 0, 1.1);
  line(a, 'flute', beat, 'E5:4 R:4 D5:4 R:4 C5:6', 0, 0.6);
  line(a, 'bell', beat, 'C5:1 E5:1 G5:1 C6:6', 20.8, 1.2);
  [['A2', 0], ['E3', 8], ['A2', 16], ['C3', 20.8]].forEach(([n, b]) => VOICE.bass(a, hz(midi(n)), b * beat, 2 * beat));
  return dry(a, 0.5);
}
// the superhero: a fanfare, then a little deflated plunk when she lands in the box
export function fly() {
  const beat = 0.35, a = secs(20, beat);
  line(a, 'horn', beat, 'C5:1 C5:0.5 E5:0.5 G5:2  E5:0.5 G5:0.5 C6:3', 0, 1);
  line(a, 'horn', beat, 'C4:1 C4:0.5 G4:0.5 E4:2  C4:0.5 E4:0.5 C4:3', 0, 0.7);
  line(a, 'flute', beat, 'G5:1 E5:1 C5:2', 12.5, 0.9);
  return dry(a, 0.4);
}
// the detective: tiptoeing bass, a sly clarinet-ish tune, no steady beat
export function sleuth() {
  const beat = 0.3, a = secs(28, beat);
  line(a, 'bass', beat, 'C3:1 R:1 Eb3:1 R:0.5 F3:0.5 Eb3:1 R:1 D3:1 G2:2 R:1  C3:1 R:1 Eb3:1 R:0.5 F3:0.5 G3:1 R:1 Ab3:1 G3:2', 0, 1.2);
  line(a, 'flute', beat, 'G4:1 Bb4:1 C5:2 R:1 Eb5:1 D5:1 C5:1 Bb4:2 R:1  G4:1 Bb4:1 C5:2 R:1 D5:1 Eb5:1 D5:1 C5:3', 0, 1);
  return dry(a, 0.5);
}
// pajamas: a slow lullaby on a music box
export function sleep() {
  const beat = 0.5, a = secs(13, beat, 1.5);
  line(a, 'bell', beat, 'E5:0.5 E5:0.5 G5:2  E5:0.5 E5:0.5 G5:2  E5:0.5 G5:0.5 C6:1 B5:1 A5:1  A5:0.5 G5:0.5 D5:1 E5:1 C5:3', 0, 1);
  [['C3', 0], ['C3', 3], ['F2', 6], ['G2', 8.5]].forEach(([n, b]) => VOICE.bass(a, hz(midi(n)), b * beat, 2 * beat, 0.7));
  return dry(a, 0.8);
}

export const SONGS = { shop, sing, build, dance, magic, fly, sleuth, sleep };
