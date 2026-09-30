// The kit every sound here is made with: plain numbers, no browser (the tests run it in Node).
// Sounds are 8-bit, 11 kHz samples, like the .WAV files off a 1996 shareware CD: crunchy, a bit
// hissy, with a cheap echo. Nothing in here knows about Brickbuster, so it can move to the toolbox
// (src/shared/) unchanged the day a second activity wants sound.

export const RATE = 11025;
export const TAU = Math.PI * 2;

// the same numbers every time from a seed, so a sound sounds the same every time
export function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// an empty sample `secs` long, with `tail` seconds of room after it (for the echo)
export function blank(secs, tail = 0) { return new Float32Array(Math.round(secs * RATE) + Math.round(tail * RATE)); }

// the 90s part: a slapback echo, a hard limit, and squashed down to 256 levels (8 bits)
export function finish(a, echo = 0.3, delay = 0.085) {
  const d = Math.round(delay * RATE);
  if (echo) for (let i = a.length - 1; i >= d; i--) a[i] += a[i - d] * echo;
  for (let i = 0; i < a.length; i++) {
    const v = Math.tanh(a[i] * 1.3);
    a[i] = Math.round(v * 127) / 127;
  }
  return a;
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
