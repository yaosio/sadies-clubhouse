// Sadie's sounds while she plays with the yarn ball out in the hall, and the rules for when she
// makes them. The owner can't stand constant noise (the ball itself stays silent for that reason),
// so she's quiet most of the time: a soft pat of a paw now and then, a little chirp when she
// pounces, a happy trill for a mighty whack, and a real meow only once in a while. No two of her
// sounds come close together, the same one never plays twice in a row the same way, and she fades
// with distance (index.js has that part).
import { RATE, TAU, rng, crunch as finish, resonance } from '../../../shared/retro.js';

export const VARIANTS = 4;   // each of her sounds comes in this many slightly different versions

// how loud her sounds can be, at most, before distance (the case's sounds are 0.6 to 1)
export const LOUD = { pat: 0.3, chirp: 0.35, trill: 0.3, meow: 0.25 };

// When she makes them. chance: how likely, each time it could happen; every: at least this many
// seconds since that sound last played. `gap`: never any two of her sounds closer than this;
// `voice`: never two chirps, trills or meows closer than this; `most`: never more than this many in
// any minute.
export const CHATTER = {
  gap: 5, voice: 15, most: 5,
  pat: { chance: 0.3, every: 10 },     // a whack
  meow: { chance: 0.08, every: 75 },   // a whack, once in a while, instead of the pat
  chirp: { chance: 0.2, every: 30 },   // her pouncing on it
  trill: { chance: 0.6, every: 25 },   // a mighty whack, up towards the landing
};

// Decides, each time something happens ('pounce', 'whack', 'mighty'), whether she makes a sound:
// returns { name, variant } or null. Plain numbers (the tests run it), t in seconds.
export function makeChatter(seed = 1, rules = CHATTER) {
  const r = rng(seed), last = {}, lastVariant = {};
  let any = -Infinity, voice = -Infinity, recent = [];
  const ready = (name, t) => t - (last[name] ?? -Infinity) >= rules[name].every && r() < rules[name].chance;
  function say(name, t) {
    let v = Math.floor(r() * (VARIANTS - 1));
    if (v >= (lastVariant[name] ?? VARIANTS)) v++;   // never the same version twice running
    last[name] = any = t; lastVariant[name] = v; recent.push(t);
    if (name !== 'pat') voice = t;
    return { name, variant: v };
  }
  return {
    heard(event, t) {
      recent = recent.filter(s => t - s < 60);
      if (t - any < rules.gap || recent.length >= rules.most) return null;
      const talk = t - voice >= rules.voice;
      if (event === 'pounce') return talk && ready('chirp', t) ? say('chirp', t) : null;
      if (event === 'mighty' && talk && ready('trill', t)) return say('trill', t);
      if (event === 'whack' && talk && ready('meow', t)) return say('meow', t);
      if (event === 'whack' || event === 'mighty') return ready('pat', t) ? say('pat', t) : null;
      return null;
    },
  };
}

// ---------- the sounds themselves ----------

// scale a sample so its loudest bit is `peak` (so her sounds all sit at the same level before
// their volume), then the 90s finish
function level(a, peak, echo = 0, delay = 0.085) {
  let m = 0; for (const v of a) m = Math.max(m, Math.abs(v));
  if (m) for (let i = 0; i < a.length; i++) a[i] *= peak / m;
  return finish(a, echo, delay);
}
const ease = (t, a, d, len) => Math.min(1, t / a, (len - t) / d);   // fade in over a, out over d
const lerp = (pts, k) => {   // a value along a few points, k from 0 to 1
  const x = Math.min(pts.length - 1.0001, Math.max(0, k * (pts.length - 1))), i = Math.floor(x);
  return pts[i] + (pts[i + 1] - pts[i]) * (x - i);
};

// A voice: a buzz at a pitch that follows `pitch` (Hz, points along its length), through two
// resonances (the mouth) that follow f1 and f2, with a little breath. roll: a rolled rrr (Hz).
function voice(len, pitch, f1, f2, { roll = 0, seed = 1, breath = 0.15, attack = 0.03, release = 0.1 } = {}) {
  const r = rng(seed), n = Math.round(len * RATE), a = new Float32Array(n + Math.round(0.15 * RATE));
  const m1 = resonance(120), m2 = resonance(200);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE, k = t / len;
    ph += lerp(pitch, k) * (1 + 0.012 * Math.sin(TAU * 6 * t)) / RATE;
    const buzz = (ph % 1) * 2 - 1 + (r() * 2 - 1) * breath;
    const rr = roll ? 0.55 + 0.45 * Math.sin(TAU * roll * t) : 1;
    a[i] = (m1(buzz, lerp(f1, k)) + 0.6 * m2(buzz, lerp(f2, k))) * ease(t, attack, release, len) * rr;
  }
  return a;
}

// A soft pat of a paw on the yarn: a muffled low thump and a little brush of wool. No click.
export function pat(variant = 0) {
  const r = rng(31 + variant), len = 0.13, n = Math.round(len * RATE), a = new Float32Array(n);
  const f = 105 + variant * 11, brush = resonance(300);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    a[i] = Math.sin(TAU * f * t) * Math.exp(-t * 32) * Math.min(1, t / 0.006)
      + brush(r() * 2 - 1, 700 + variant * 60) * 0.5 * Math.exp(-t * 45);
  }
  return level(a, 0.55);
}

// A little chirp as she pounces: a short rising "mrrp".
export function chirp(variant = 0) {
  const up = variant * 25;
  return level(voice(0.24, [360 + up, 480 + up, 620 + up], [450, 650, 800], [1300, 1600, 1900], { roll: 26, seed: 7 + variant, release: 0.06 }), 0.6, 0.12);
}

// A happy trill for a mighty whack: a longer rolled "brrrrip!", going up.
export function trill(variant = 0) {
  const up = variant * 20;
  return level(voice(0.42, [340 + up, 420 + up, 520 + up, 700 + up], [420, 600, 700, 850], [1250, 1500, 1700, 2000], { roll: 30, seed: 17 + variant, release: 0.07 }), 0.6, 0.15);
}

// A meow, now and then: a small "mi-aow", up and then down, the mouth opening from "ee" to "ow".
export function meow(variant = 0) {
  const up = variant * 30, len = 0.52 + variant * 0.04;
  return level(voice(len, [500 + up, 690 + up, 660 + up, 470 + up], [380, 820, 780, 560], [2100, 1500, 1200, 1000], { seed: 3 + variant, attack: 0.05, release: 0.14 }), 0.6, 0.15, 0.1);
}
