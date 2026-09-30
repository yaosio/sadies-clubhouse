// What each bit of junk does when the machine bumps into it, instead of just sitting there: the duck
// squeaks and bounces, the banana slips, the toaster pops out a slice of toast, and so on. Plain
// numbers (no browser: the tests check every bit of junk has its own). room.js plays them.
//
// Each has how long it takes (seconds), the sound it makes (sounds/), a puff that pops up over it
// ('bang', 'spark', 'heart' or none), and its pose part of the way through (k, 0 to 1): how far it's
// moved (x across, y up, in metres), turned (rot, anticlockwise) and stretched (sx, sy). It stays in
// its last pose until the machine is tidied up for the next try. A few do something extra: `toast`
// (how high the toast is, over the toaster), `lit` (the bulb's on), `sadie` (she wakes up to look).
const ease = k => k * k * (3 - 2 * k);
const hump = k => Math.sin(Math.PI * Math.min(1, Math.max(0, k)));
const pose = (o = {}) => ({ x: 0, y: 0, rot: 0, sx: 1, sy: 1, ...o });

export const REACT = {
  // bounces, a bit less each time
  duck: { dur: 1.1, sound: 'squeak', pose: k => pose({ y: Math.abs(Math.sin(k * Math.PI * 3)) * 0.2 * (1 - k) }) },
  // slips: spins off to the side and lands on its back
  banana: { dur: 1.1, sound: 'fwoop', pose: k => { const e = ease(Math.min(1, k * 1.4)); return pose({ x: e * 0.22, y: hump(k * 1.4) * 0.15, rot: -e * Math.PI * 3 }); } },
  // flops over, limp
  sock: { dur: 0.9, sound: 'bonk', pose: k => { const e = ease(k); return pose({ y: -e * 0.06, rot: e * 1.5, sy: 1 - e * 0.35 }); } },
  // won't budge: shakes its head, no thank you
  cactus: { dur: 1.2, sound: 'bonk', puff: 'bang', pose: k => pose({ x: Math.sin(k * 36) * 0.04 * (1 - k) }) },
  // ejects: shoots up, spinning flat like a frisbee, and drops back
  floppy: { dur: 1.3, sound: 'bloop', pose: k => pose({ y: hump(k) * 0.65, sx: 0.25 + 0.75 * Math.abs(Math.cos(k * 18)) }) },
  // pops out a slice of toast, which lands on top
  toaster: { dur: 1.2, sound: 'ding', toast: k => 0.1 + hump(k * 1.15) * 0.55, pose: k => pose({ y: k < 0.12 ? -hump(k / 0.12) * 0.03 : 0 }) },
  // swells with pride
  trophy: { dur: 1.0, sound: 'idea', puff: 'spark', pose: k => { const e = ease(Math.min(1, k * 2)); return pose({ y: e * 0.03, sx: 1 + e * 0.25, sy: 1 + e * 0.25 }); } },
  // lights up for a moment (a good idea!), flickers and goes out
  bulb: { dur: 1.4, sound: 'plink', puff: 'spark', lit: k => k < 0.5 || (k < 0.8 && Math.floor(k * 30) % 2 === 0), pose: k => pose({ y: hump(k) * 0.05 }) },
  // squashed flat
  sandwich: { dur: 0.6, sound: 'bonk', pose: k => { const e = ease(k); return pose({ y: -e * 0.07, sx: 1 + e * 0.35, sy: 1 - e * 0.5 }); } },
  // sways, doing its best, and gets a heart for trying
  plant: { dur: 1.6, sound: null, puff: 'heart', pose: k => pose({ rot: Math.sin(k * Math.PI * 4) * 0.3 * (1 - k) }) },
  // kicked: flips head over heels and lands upside down
  shoe: { dur: 0.8, sound: 'bonk', pose: k => pose({ y: hump(k) * 0.28, rot: ease(k) * Math.PI }) },
  // Sadie wakes up to look (it's hers), and it rattles
  fishbone: { dur: 1.8, sound: 'mrrp', puff: 'heart', sadie: k => k < 0.85, pose: k => pose({ rot: Math.sin(k * 40) * 0.12 * (1 - k) }) },
  // down on its string and back up, twice
  yoyo: { dur: 1.4, sound: 'zip', pose: k => pose({ y: -Math.abs(Math.sin(k * Math.PI * 2)) * 0.45 }) },
  // opens and floats up, swaying, like it's caught a breeze
  umbrella: { dur: 1.8, sound: 'whoosh', pose: k => { const e = ease(k); return pose({ x: Math.sin(k * 7) * 0.06, y: e * 0.5, sx: 1 + ease(Math.min(1, k * 3)) * 0.4 }); } },
  // flies off spinning like a frisbee, and comes back like a boomerang
  pizza: { dur: 1.5, sound: 'boing', pose: k => pose({ x: -hump(k) * 0.8, y: hump(k) * 0.3, sx: 0.3 + 0.7 * Math.abs(Math.cos(k * 20)) }) },
};
