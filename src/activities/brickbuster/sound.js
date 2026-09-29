// Brickbuster '96's sounds, made right here as 8-bit, 11 kHz samples, like the .WAV files off a
// 1996 shareware CD: crunchy, a bit hissy, with a cheap echo. The cracks get worse each time (the
// third is a big stock "glass break"), the paddle goes BOING, bricks blip (higher up, higher notes)
// and the sides of the case go tock.
//
// The sample-making part is plain numbers (the tests run it in Node); makePlayer() plays them in a
// browser, and must first be called while the player is pressing something (browsers only allow
// sound after that).

export const RATE = 11025;

function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const TAU = Math.PI * 2;

// the 90s part: a slapback echo, a hard limit, and squashed down to 256 levels (8 bits)
function finish(a, echo = 0.3, delay = 0.085) {
  const d = Math.round(delay * RATE);
  if (echo) for (let i = a.length - 1; i >= d; i--) a[i] += a[i - d] * echo;
  for (let i = 0; i < a.length; i++) {
    const v = Math.tanh(a[i] * 1.3);
    a[i] = Math.round(v * 127) / 127;
  }
  return a;
}

// A crack in the glass. level 1, 2 or 3 (the third: the big one).
export function crack(level, seed = level * 77) {
  const r = rng(seed), len = [0.55, 0.8, 1.6][level - 1] ?? 0.8, n = Math.round(len * RATE);
  const a = new Float32Array(n + Math.round(0.3 * RATE));
  const loud = [0.75, 0.9, 1.0][level - 1] ?? 0.9;
  // the hit: a sharp snap of noise
  for (let i = 0; i < 60; i++) a[i] += (r() * 2 - 1) * loud * (1 - i / 60);
  // the thump behind it (a low knock, bigger each time)
  for (let i = 0; i < 0.18 * RATE; i++) { const t = i / RATE; a[i] += Math.sin(TAU * (95 - 120 * t) * t) * Math.exp(-t * 22) * 0.25 * level; }
  // the crackle: bursts of clicks running along the glass, thinning out
  const spread = [0.35, 0.5, 1.1][level - 1] ?? 0.5;
  for (let i = 0; i < spread * RATE; i++) {
    const t = i / RATE, k = Math.exp(-t / (spread * 0.35));
    if (r() < 0.07 * k + 0.004) {
      const w = 2 + Math.floor(r() * 10), amp = (0.35 + r() * 0.5) * k * loud, sign = r() < 0.5 ? -1 : 1;
      for (let j = 0; j < w && i + j < n; j++) a[i + j] += sign * amp * (1 - j / w) * (r() < 0.3 ? -1 : 1);
    }
    a[i] += (r() * 2 - 1) * 0.12 * k * loud;   // a hiss of splintering
  }
  // the tinkle: little high pings of glass, a shower of them for the big one
  const pings = [3, 6, 16][level - 1] ?? 6;
  for (let p = 0; p < pings; p++) {
    const at = Math.floor((0.02 + r() * (len - 0.2)) * RATE), f = 1700 + r() * 3300, dec = 18 + r() * 30, amp = 0.12 + r() * 0.16;
    for (let i = 0; at + i < n; i++) { const t = i / RATE, e = Math.exp(-t * dec); if (e < 0.01) break; a[at + i] += Math.sin(TAU * f * t) * e * amp; }
  }
  if (level >= 3) {   // and a long crunchy crash, like a pane coming down (it doesn't, yet)
    for (let i = Math.floor(0.08 * RATE); i < n; i++) { const t = i / RATE; a[i] += (r() * 2 - 1) * 0.3 * Math.exp(-(t - 0.08) * 3.2) * (0.6 + 0.4 * Math.sin(t * 60)); }
  }
  return finish(a, 0.32);
}

// The paddle: a springy square-wave BOING, the pitch wobbling up.
export function boing(off = 0) {
  const n = Math.round(0.34 * RATE), a = new Float32Array(n + Math.round(0.2 * RATE));
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE, f = (150 + off * 25) + 230 * (1 - Math.exp(-t * 11)) + 40 * Math.sin(TAU * 16 * t) * Math.exp(-t * 5);
    ph += f / RATE;
    a[i] = (ph % 1 < 0.5 ? 0.42 : -0.42) * Math.exp(-t * 7);
  }
  return finish(a, 0.25);
}

// A brick: a short blip, higher for the rows further up.
export function blip(row = 0) {
  const n = Math.round(0.09 * RATE), a = new Float32Array(n + Math.round(0.2 * RATE)), f = 523 * Math.pow(2, (5 - row) / 5);
  let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / RATE; ph += (t < 0.03 ? f : f * 1.5) / RATE; a[i] = (ph % 1 < 0.5 ? 0.3 : -0.3) * (1 - t / 0.09); }
  return finish(a, 0.2);
}

// The sides of the case: a low wooden tock. And tapping glass that can't crack any more: a dull tink.
export function tock() {
  const n = Math.round(0.05 * RATE), a = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / RATE; a[i] = Math.sin(TAU * 190 * t) * Math.exp(-t * 70) * 0.45; }
  return finish(a, 0);
}
export function tink() {
  const n = Math.round(0.12 * RATE), a = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / RATE; a[i] = (Math.sin(TAU * 1250 * t) * 0.3 + Math.sin(TAU * 2990 * t) * 0.12) * Math.exp(-t * 35); }
  return finish(a, 0);
}

// Plays the sounds. Made the first time the player steps up to the machine (a press, so the browser
// allows sound). If the browser has no sound at all, it quietly does nothing (but still counts).
export function makePlayer() {
  let ctx = null, out = null;
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    ctx = new AC(); out = ctx.createGain(); out.gain.value = 0.5; out.connect(ctx.destination);
  } catch { ctx = null; }
  const made = new Map();
  // each sample held 4 times over at 44.1 kHz: no smoothing, so it keeps its 11 kHz crunch
  function buffer(key, make) {
    if (!ctx) return null;
    if (!made.has(key)) {
      const s = make(), b = ctx.createBuffer(1, s.length * 4, RATE * 4), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = s[i >> 2];
      made.set(key, b);
    }
    return made.get(key);
  }
  const player = {
    played: 0, last: null,
    wake() { try { if (ctx && ctx.state !== 'running') ctx.resume(); } catch {} },
    play(key, make, volume = 1) {
      player.played++; player.last = key;
      const b = buffer(key, make); if (!b) return;
      try {
        const src = ctx.createBufferSource(), g = ctx.createGain();
        src.buffer = b; g.gain.value = volume; src.connect(g); g.connect(out); src.start();
      } catch {}
    },
    crack: level => player.play('crack' + level, () => crack(level)),
    boing: off => player.play('boing' + Math.round(off * 2), () => boing(Math.round(off * 2) / 2), 0.8),
    blip: row => player.play('blip' + row, () => blip(row), 0.7),
    tock: () => player.play('tock', tock, 0.6),
    tink: () => player.play('tink', tink, 0.7),
  };
  return player;
}
