// The synthesizer the trip's music is played on: each instrument makes one note as plain numbers (no
// browser: the tests run it in Node), at 22 kHz, like a sound card's MIDI from 1994 that somebody
// loved too much. Everything is soft: slow starts, filtered edges, clean fades to nothing, no hum.
// song.js says which notes, player.js plays them.

export const RATE = 22050;
const TAU = Math.PI * 2;
export const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);

// the same numbers every time from a seed
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// a soft low-pass filter (two poles): smooths the buzz off a sawtooth; cutoff can move per sample
function lowpass() {
  let a = 0, b = 0;
  return (x, cut) => { const k = 1 - Math.exp(-TAU * Math.min(cut, RATE * 0.45) / RATE); a += (x - a) * k; b += (a - b) * k; return b; };
}
// how loud a note is at sample i of n: in over `att` seconds, out over the last `rel`
function shape(i, n, att, rel) {
  const t = i / RATE, left = (n - i) / RATE;
  return Math.min(1, t / Math.max(0.004, att), left / Math.max(0.01, rel));
}
const saw = p => 2 * (p - Math.floor(p + 0.5));
const pulse = (p, w) => (p - Math.floor(p) < w ? 1 : -1);

// A pad: a chord of slightly out-of-tune sawtooths, swelling in and fading out (never held on and on)
export function pad(notes, secs, bright = 0.3) {
  const n = Math.round(secs * RATE), out = new Float32Array(n), f = lowpass(), f2 = lowpass();
  const oscs = notes.flatMap((m, j) => [-7, 6].map((c, k) => ({ step: hz(m) * Math.pow(2, c / 1200) / RATE, p: (j * 0.31 + k * 0.57) % 1 })));
  const att = Math.min(0.9, secs * 0.3), rel = Math.min(1.1, secs * 0.4), amp = 0.5 / Math.sqrt(oscs.length);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (const o of oscs) { s += saw(o.p); o.p += o.step; }
    const e = shape(i, n, att, rel), cut = 300 + 1500 * bright * (0.6 + 0.4 * e);
    out[i] = f2(f(s * amp, cut), cut * 1.4) * e;
  }
  return out;
}

// An arpeggio's pluck: a hollow square-ish wave, bright at first and dulling as it dies away
export function pluck(midi, secs = 0.5, bright = 0.5) {
  const n = Math.round(secs * RATE), out = new Float32Array(n), f = lowpass(), step = hz(midi) / RATE;
  let p = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE, e = Math.exp(-t * 7) * shape(i, n, 0.003, 0.05);
    out[i] = f(pulse(p, 0.32) * 0.3, 250 + (900 + 2600 * bright) * Math.exp(-t * 9)) * e; p += step;
  }
  return out;
}

// The bass: a warm sawtooth with a round sine under it
export function bass(midi, secs, bright = 0.3) {
  const n = Math.round(secs * RATE), out = new Float32Array(n), f = lowpass(), step = hz(midi) / RATE;
  let p = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE, e = (0.65 + 0.35 * Math.exp(-t * 5)) * shape(i, n, 0.006, 0.08);
    out[i] = (f(saw(p) * 0.35, 180 + 500 * bright * Math.exp(-t * 3)) + Math.sin(TAU * p) * 0.3) * e; p += step;
  }
  return out;
}

// The lead: a singing synth with a slow vibrato that creeps in, and a little slide up into the note
export function lead(midi, secs, bright = 0.5) {
  const n = Math.round(secs * RATE), out = new Float32Array(n), f = lowpass(), f0 = hz(midi);
  let p = 0, q = 0.5;
  for (let i = 0; i < n; i++) {
    const t = i / RATE, vib = 1 + 0.006 * Math.min(1, Math.max(0, t - 0.3) / 0.6) * Math.sin(TAU * 5.2 * t);
    const fr = f0 * vib * (1 - 0.02 * Math.exp(-t * 30)), e = shape(i, n, 0.05, Math.min(0.35, secs * 0.35));
    p += fr / RATE; q += fr * 1.003 / RATE;
    out[i] = f(saw(p) * 0.22 + pulse(q, 0.5) * 0.12, 900 + 1800 * bright) * e;
  }
  return out;
}

// A bell (the sort of glassy FM bell every 80s synth had): rings and dies away
export function bell(midi, secs = 2.2) {
  const n = Math.round(secs * RATE), out = new Float32Array(n), f0 = hz(midi);
  for (let i = 0; i < n; i++) {
    const t = i / RATE, e = Math.exp(-t * 2.4) * shape(i, n, 0.004, 0.1);
    out[i] = Math.sin(TAU * f0 * t + 1.6 * Math.exp(-t * 3) * Math.sin(TAU * f0 * 3.5 * t)) * 0.28 * e;
  }
  return out;
}

// Drums, kept soft: a round thump, and the big 80s snare (a hiss with a short roomy tail, cut off)
export function kick() {
  const n = Math.round(0.35 * RATE), out = new Float32Array(n);
  let p = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE; p += (42 + 70 * Math.exp(-t * 28)) / RATE;
    out[i] = Math.sin(TAU * p) * Math.exp(-t * 9) * shape(i, n, 0.002, 0.05) * 0.55;
  }
  return out;
}
export function snare(seed = 3) {
  const n = Math.round(0.42 * RATE), out = new Float32Array(n), r = rng(seed), f = lowpass();
  let hp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE, noise = r() * 2 - 1;
    const lp = f(noise, 5000); const band = lp - hp; hp += (lp - hp) * 0.12;   // (a hiss, its lowest part taken out)
    const body = t < 0.06 ? Math.exp(-t * 30) : 0.35 * (t < 0.3 ? 1 : Math.max(0, 1 - (t - 0.3) / 0.1));   // the gated tail
    out[i] = (band * 0.5 * body + Math.sin(TAU * 185 * t) * Math.exp(-t * 25) * 0.25) * shape(i, n, 0.002, 0.04);
  }
  return out;
}

// every instrument by name, for song.js's notes: { kind, notes (a chord) or midi, len, bright }
export const INSTRUMENTS = {
  pad: e => pad(e.notes, e.len, e.bright),
  pluck: e => pluck(e.midi, Math.min(e.len, 0.6), e.bright),
  bass: e => bass(e.midi, e.len, e.bright),
  lead: e => lead(e.midi, e.len, e.bright),
  bell: e => bell(e.midi),
  kick: () => kick(),
  snare: () => snare(),
};
// what makes two notes the same sound (so each is only made once)
export const soundKey = e => `${e.kind}:${e.notes ? e.notes.join('.') : e.midi ?? ''}:${e.len ? e.len.toFixed(2) : ''}:${e.bright !== undefined ? e.bright.toFixed(2) : ''}`;
