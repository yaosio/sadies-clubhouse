// Toots' voice: her roo, the long talking howl she made at the window, from the owner's own video
// (roo-data.js: two cuts, only her, made by tools/toots-house/make-roo.mjs). Nothing else in the house
// makes a sound (the ball bounces silently, like the yarn ball in Brickbuster).
//
// Each roo is one of her two cuts, played a hair higher or lower now and then so they don't all sound
// the same. Through the sound system on the VOICES volume, fading with distance, never two at once
// (one every few seconds at most, whoever asks: the window or the fetch).
import { decode } from '../../../shared/adpcm.js';
import data from './roo-data.js';

export const CUTS = data.length;
const RATES = [1, 0.95, 1.05];
const at = () => Math.random();
let last = -1, lastAt = -1e9;
const GAP = 5;   // seconds between any two roos (Claude's number)
export const roo = i => decode(Uint8Array.from(atob(data[i]), c => c.charCodeAt(0)));

// `h`: a handle on the sound system. Hands back roo(o): o.at, where she is.
export function makeSounds(h, volume = 0.55) {
  return {
    roo(o = {}) {
      const now = performance.now() / 1000;
      if (now - lastAt < GAP) return false;
      let i = Math.floor(at() * CUTS); if (i === last && CUTS > 1) i = (i + 1) % CUTS; last = i;
      const r = RATES[Math.floor(at() * RATES.length)];
      const played = h.play(`roo${i}@${r}`, () => roo(i), { loud: volume, rate: Math.round(11025 * r), hold: 4, gap: GAP, bus: 'voices', near: 4, far: 30, ...o });
      if (played) lastAt = now;
      return played;
    },
    get log() { return h.log; },
  };
}
