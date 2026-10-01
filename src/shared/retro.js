// The kit the rooms' sounds are made with: plain numbers, no browser (the tests run it in Node).
// 8-bit, 11 kHz samples, like the .WAV files off a 1996 shareware CD. Played through the sound
// system (sound.js), each held 4 times over at 44.1 kHz so it keeps its crunch. Two endings:
// `finish`, gentle (soft starts, a fade right down to nothing, only a whisper of echo: the owner
// can't stand harsh noise), and `crunch`, Brickbuster's arcade one (a slapback, a harder limit).

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

// The arcade version (Brickbuster's): a slapback echo, a hard limit, 8 bits.
export function crunch(a, echo = 0.3, delay = 0.085) {
  const d = Math.round(delay * RATE);
  if (echo) for (let i = a.length - 1; i >= d; i--) a[i] += a[i - d] * echo;
  for (let i = 0; i < a.length; i++) {
    const v = Math.tanh(a[i] * 1.3);
    a[i] = Math.round(v * 127) / 127;
  }
  return a;
}
