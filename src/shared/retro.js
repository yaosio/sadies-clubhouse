// The kit the rooms' sounds are made with: plain numbers, no browser (the tests run it in Node).
// 8-bit, 11 kHz samples, like the .WAV files off a 1996 shareware CD. Played through the sound
// system (sound.js), each held 4 times over at 44.1 kHz so it keeps its crunch. Rings and pings, a
// tone that slides and a soft hush, Sadie's "mrrp", and two endings: `finish`, gentle (soft
// starts, a fade right down to nothing, only a whisper of echo: the owner can't stand harsh noise),
// and `dry`, the same with no echo. (Brickbuster's harder arcade ending is its own: sounds/crunch.js.)

export const RATE = 11025;
export const TAU = Math.PI * 2;

// the same numbers every time from a seed, so a sound sounds the same every time
export function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// a note's frequency, from its number (60 is middle C)
export const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);

// an empty sample `secs` long, with `tail` seconds of room after it (for an echo)
export function blank(secs, tail = 0) { return new Float32Array(Math.round(secs * RATE) + Math.round(tail * RATE)); }

// add a ringing partial into `a`: frequency, how fast it dies away, how loud, when it starts (s)
export function ring(a, f, dec, amp, at = 0) {
  const s0 = Math.round(at * RATE);
  for (let i = 0; s0 + i < a.length; i++) {
    const t = i / RATE, e = Math.exp(-t * dec);
    if (e < 0.002) break;
    a[s0 + i] += Math.sin(TAU * f * t) * e * amp * Math.min(1, t / 0.004);   // (4 ms to come in: no click)
  }
}

// a little high ping (a bit of glass), added into `a` at sample `at`: frequency, how fast it dies
// away, how loud
export function ping(a, at, f, dec, amp, end = a.length) {
  for (let i = 0; at + i < end; i++) {
    const t = i / RATE, e = Math.exp(-t * dec);
    if (e < 0.01) break;
    a[at + i] += Math.sin(TAU * f * t) * e * amp;
  }
}

// how loud a sound is over time: a plucked one dies away (6 ms to come in, so no click); a swell
// comes up and goes down again
export const pluck = rate => t => Math.exp(-t * rate) * Math.min(1, t / 0.006);
export const swell = (t, k) => Math.sin(Math.PI * k);

// a tone added into `a` from `at` seconds for `len`, its pitch sliding from f0 to f1 (or f0 can be a
// function of how far through it is, 0 to 1), as loud as env(t, k) says; o: gain, tri
// (softer-edged, like a wood block), h2 (a bit of the octave, for a voice), wob and wobHz (a wobble
// in the pitch)
export function tone(a, at, len, f0, f1, env, o = {}) {
  const n = Math.round(len * RATE), s0 = Math.round(at * RATE), gain = o.gain ?? 0.3;
  let ph = 0;
  for (let i = 0; i < n && s0 + i < a.length; i++) {
    const t = i / RATE, k = i / n;
    let f = typeof f0 === 'function' ? f0(k) : f0 * Math.pow(f1 / f0, k);
    if (o.wob) f *= 1 + o.wob * Math.sin(TAU * (o.wobHz || 8) * t);
    ph += TAU * f / RATE;
    let w = Math.sin(ph);
    if (o.tri) w = Math.asin(w) * 2 / Math.PI;
    if (o.h2) w += o.h2 * Math.sin(2 * ph);
    a[s0 + i] += w * env(t, k) * gain;
  }
  return a;
}

// a hush of air added into `a`: noise smoothed right down (`smooth`: the lower, the more whoosh
// than hiss), as loud as env(t, k) says
export function hush(a, at, len, env, gain = 0.3, smooth = 0.08, seed = 7) {
  const n = Math.round(len * RATE), s0 = Math.round(at * RATE);
  let s = seed, y = 0;
  for (let i = 0; i < n && s0 + i < a.length; i++) {
    s = (s * 16807) % 2147483647;
    y += ((s / 2147483647) * 2 - 1 - y) * smooth;
    a[s0 + i] += y * env(i / RATE, i / n) * gain * 3;
  }
  return a;
}

// Sadie's "mrrp": a little rolled chirp, going up from `lo` to `hi` Hz (each room's is her own)
export const mrrp = (lo = 420, hi = 640, gain = 0.26) => dry(tone(blank(0.36), 0, 0.33, lo, hi,
  (t, k) => Math.sin(Math.PI * Math.min(1, k * 1.3)) * (0.6 + 0.4 * Math.sin(Math.PI * 2 * 28 * t)), { h2: 0.3, gain }));

// A resonance (a two-pole filter): noise or a buzz put through it rings at `f` Hz, `width` Hz wide.
// Call it once per sample; f can change as it goes (a mouth opening). Makes voices sound like voices.
export function resonance(width) {
  let y1 = 0, y2 = 0;
  const r = Math.exp(-Math.PI * width / RATE);
  return (x, f) => {
    const y = (1 - r) * x + 2 * r * Math.cos(TAU * f / RATE) * y1 - r * r * y2;
    y2 = y1; y1 = y;
    return y;
  };
}

// The 90s part, kept gentle: a faint echo, a soft limit, a fade to nothing over the last `fade`
// seconds, and squashed down to 256 levels (8 bits).
export function finish(a, echo = 0.12, delay = 0.09, fade = 0.04) {
  const d = Math.round(delay * RATE);
  if (echo) for (let i = a.length - 1; i >= d; i--) a[i] += a[i - d] * echo;
  const f = Math.max(1, Math.round(fade * RATE));
  for (let i = 0; i < a.length; i++) {
    let v = Math.tanh(a[i]);
    if (i > a.length - f) v *= (a.length - i) / f;
    a[i] = Math.round(v * 127) / 127;
  }
  return a;
}

// The same with no echo: rounded off, faded to nothing over its last bit, 8 bits
export const dry = (a, fade = 0.04) => finish(a, 0, 0, fade);
