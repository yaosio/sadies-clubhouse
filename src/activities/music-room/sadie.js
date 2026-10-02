// Sadie in the music room, with no screen (the tests run it): most of the time she's on her cushion
// by the piano. Every so often, and only while you're in the room, she gets up and walks across one
// instrument, once: a few slow, clumsy steps, a paw on a key or two at a time (her back paws are
// heavier), a different walk every time. Then she sits down on the end of it (one last low note),
// or lies down on it (one soft chord) and naps there a while, and goes back to her cushion. Then she
// leaves them all alone for a long time.
//
// She never walks on the instrument you're playing, and if you step up to the one she's on, she
// hops off. If the sign on the door says SHH, she goes and sits next to one instead, silently,
// looking offended. room.js draws her and plays her notes.
import { rng } from '../../shared/retro.js';

// her instruments and how much she likes each (never the theremin or the chimes: out of reach);
// how many keys each has for her paws to land on
export const FAVOURITES = { piano: 0.55, drums: 0.22, xylophone: 0.13, synth: 0.1 };
export const KEYS = { piano: 17, drums: 4, xylophone: 8, synth: 17 };
// how long between her walks (seconds you're in the room: the first one, then after each), how many
// steps, how long between them, how likely she is to lie down at the end, and how long she naps
export const TIMING = { first: [45, 100], between: [160, 360], steps: [4, 6], step: [0.4, 0.85], nap: 0.3, napFor: [18, 35], sulk: 15, hop: 0.8 };

const between = (r, [a, b]) => a + r() * (b - a);

export function makeSadie(seed = 1) {
  const r = rng(seed);
  return { r, mode: 'cushion', inst: null, u: 0, wait: between(r, TIMING.first), t: 0, steps: 0, left: 0, dir: 1, walks: 0, lastInst: null };
}

// pick where to go: by her favourites, never the one you're playing, and not the same one twice
// running if she can help it
function pick(S, playing) {
  const ok = Object.keys(FAVOURITES).filter(k => k !== playing), w = k => FAVOURITES[k] * (k === S.lastInst ? 0.3 : 1);
  let x = S.r() * ok.reduce((s, k) => s + w(k), 0);
  for (const k of ok) { x -= w(k); if (x <= 0) return k; }
  return ok[ok.length - 1];
}

// Send her now (the test version, and the checks), to `inst` or one she picks.
export function goNow(S, world, inst) { S.wait = 0; S.forced = inst || null; if (S.mode === 'cushion') return stepSadie(S, 0, world); return []; }

// Moves her on by dt seconds. world: { here (you're in the room), playing (the instrument you're
// at, or null), welcome (the sign says SADIE WELCOME) }. Returns what she did that makes a sound:
// { type: 'paw', inst, keys: [..], loud, kind } (keys counted 0 up, left to right as she sees them;
// kind: 'step', 'end' (sitting down on the end) or 'nap' (lying down on it)).
export function stepSadie(S, dt, world) {
  const out = [], r = S.r;
  if (!world.here) return out;   // she only gets up to things while you're there to hear them
  S.t += dt;
  // you've stepped up to the instrument she's on: she hops straight off, not a sound
  if (S.inst && S.inst === world.playing && ['hop', 'walk', 'sit', 'nap'].includes(S.mode)) { S.mode = 'back'; S.t = 0; }
  const paw = (keys, loud, kind = 'step') => out.push({ type: 'paw', inst: S.inst, keys: [...new Set(keys.map(k => Math.max(0, Math.min(KEYS[S.inst] - 1, k))))], loud, kind });
  switch (S.mode) {
    case 'cushion':
      S.wait -= dt;
      if (S.wait > 0) break;
      S.inst = S.forced || pick(S, world.playing); S.forced = null;
      if (S.inst === world.playing) { S.wait = 10; S.inst = null; break; }
      S.dir = r() < 0.5 ? 1 : -1; S.u = S.dir > 0 ? 0 : 1; S.t = 0;
      S.mode = world.welcome ? 'hop' : 'sulk';
      break;
    case 'hop':   // up onto one end of it
      if (S.t < TIMING.hop) break;
      S.mode = 'walk'; S.t = 0; S.steps = Math.round(between(r, TIMING.steps)); S.left = S.steps; S.next = between(r, TIMING.step);
      break;
    case 'walk': {   // across it, a paw at a time
      if (S.t < S.next) break;
      S.t = 0; S.next = between(r, TIMING.step);
      const done = S.steps - S.left, n = KEYS[S.inst];
      S.u = S.dir > 0 ? (done + 1) / (S.steps + 1) : 1 - (done + 1) / (S.steps + 1);
      const k = Math.round(S.u * (n - 1) + (r() - 0.5) * 2);
      const back = done % 2 === 1;   // her back paws come down heavier
      paw(r() < 0.25 ? [k, k + (r() < 0.5 ? 1 : -1)] : [k], back ? 0.75 + r() * 0.2 : 0.45 + r() * 0.2);
      if (--S.left <= 0) {
        S.u = S.dir > 0 ? 1 : 0;
        if (r() < TIMING.nap) { S.mode = 'nap'; S.napFor = between(r, TIMING.napFor); const e = S.dir > 0 ? n - 1 : 0; paw([e, e - S.dir, e - 2 * S.dir], 0.3, 'nap'); }
        else { S.mode = 'sit'; S.sitFor = 2 + r() * 2; S.low = true; }
      }
      break;
    }
    case 'sit':   // sitting on the end: one last low note, a moment later
      if (S.low && S.t > 0.9) { S.low = false; paw([0], 0.5, 'end'); }
      if (S.t > S.sitFor) { S.mode = 'back'; S.t = 0; }
      break;
    case 'nap':
      if (S.t > S.napFor) { S.mode = 'back'; S.t = 0; }
      break;
    case 'sulk':   // sitting beside it, offended, not a sound
      if (S.t > TIMING.sulk) { S.mode = 'back'; S.t = 0; }
      break;
    case 'back':   // hopping down and back to her cushion
      if (S.t > TIMING.hop) {
        S.mode = 'cushion'; S.walks++; S.lastInst = S.inst; S.inst = null; S.t = 0;
        S.wait = between(r, TIMING.between);
      }
      break;
  }
  return out;
}
