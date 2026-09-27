// The mole: it drops the pieces. It lives up in the sky (nobody knows why, and it's funnier that
// way), and like any mole it's sure everything belongs underground. See docs/CHARACTERS.md.
//
// What it does comes from how it feels and what it sees, through the shared thinking in
// mind/think.js:
//   bury - anyone restless (Sadie impatient under hay she can't reach, Chooter wanting attention)
//          must want to be buried, like any sensible creature. It flies over and drops pieces on
//          them. (That builds the pile up under Sadie, which is how she gets to her hay. The mole
//          has no idea it's helping.)
//   barn - otherwise, the barn: it's a home, and homes belong underground. It drops pieces all
//          over it. (Sadie drags it back out, of course.)
//   nap  - worn out: no pieces at all until it's rested.
//
// Its one feeling, tired, is the game looking after itself: when the physics takes up too much of
// each second (the screen tells it how much, see feelStrain), the mole tires, drops more slowly,
// and once it's worn out it naps until things calm down. On a quick enough device it never tires.
//
// It always drops with a full supply, so it's never faster than one piece every REGEN seconds.
import { U } from '../config.js';
import { world } from './world.js';
import { emote } from './effects.js';
import { drp, flyTo, dropHeld, readyToDrop, heldOffsets, NO_PIECE, REGEN } from './dropper.js';
import { barn, barnX, barnCover, BARN_HALF, OUTLINE } from './barn.js';
import { drift } from './mind/feelings.js';
import { offers } from './mind/offers.js';
import { think, switchTo } from './mind/think.js';
import { mindsFrom } from './mind/thoughts.js';

export const NOTICE = 0.3;               // how restless someone has to be before the mole notices
export const FLY = 6 * U;                // flying speed (half that when it's worn out)
export const TIRE_AT = 0.5, REST_AT = 0.35; // share of each second the simulation takes: above this it tires, below it rests
const TIRE = 1 / 8, RECOVER = 1 / 20;    // per second: worn out after 8 s of a struggling game, rested 20 s after
const SLOW = 3;                          // tired, it waits up to this much longer again between drops
const WAKE_AT = 0.4;                     // napping, it gets back to work once it's this rested
const AIM = 0.5 * U;                     // close enough to the spot it's after to let go
const ROOF = OUTLINE.reduce((m, [, y]) => Math.max(m, y), 0) * U;

// doing: bury | barn | nap; who/whoName: who it's burying; since: seconds since the last drop;
// off: where the next piece goes, compared to what it's aiming at; strain: the share of each
// second the simulation takes, smoothed (from the screen; 0 in the tests unless they set it)
export const mole = { doing: null, feel: { tired: 0 }, napping: false, who: null, whoName: null, since: 0, off: 0, strain: 0, zT: 0 };

// The screen reports how busy the simulation kept it (0 = idle, 1 = all the time), each frame.
export function feelStrain(share, dt) { mole.strain += (share - mole.strain) * Math.min(1, dt / 2); }

// The most restless creature around, if anyone's restless enough to notice.
function restless() {
  let best = null;
  for (const o of offers('restless')) if (o.how >= NOTICE && (!best || o.how > best.how)) best = o;
  return best;
}
// Fly over x and let go once there (and the supply's full, and it isn't too tired). The next piece
// goes somewhere else within `spread`, so it covers things instead of stacking a spire.
function aimAt(x, spread) {
  flyTo(x + mole.off);
  if (mole.since >= REGEN * (1 + SLOW * mole.feel.tired) && readyToDrop(AIM) && dropHeld()) {
    mole.since = 0; mole.off = (Math.random() * 2 - 1) * spread;
  }
}

const bury = {
  want: () => { const o = restless(); return o ? 1 + 2 * o.how : 0; },
  start: c => { c.off = 0; },
  stop: c => { c.who = c.whoName = null; },
  step(c) {
    const o = restless();
    if (!o) return 'there';
    if (o.thing !== c.who) { c.who = o.thing; c.whoName = o.name; c.off = 0; }
    aimAt(o.x, 0.5 * U);
    return 'moving';
  },
};
const buryBarn = {
  want: () => barn.piece ? 1 : 0,
  start: c => { c.off = 0; },
  step() { aimAt(barnX(), BARN_HALF + 0.3 * U); return 'moving'; },
};
const nap = {
  want: c => c.napping ? 10 : 0,
  busy: c => c.napping,
  step(c, dt) {
    flyTo(drp.x);
    c.zT -= dt;
    if (c.zT <= 0) { emote('z', '#7a6a86', drp.x + 0.5 * U, drp.y + 1.6 * U, 12, 30); c.zT = 0.9; }
    return 'there';
  },
};
export const MOLE_DOES = { bury, barn: buryBarn, nap };

// A fresh board: it forgets what it was doing (but not how tired it is: that's about the device).
export function resetMole() { Object.assign(mole, { doing: null, who: null, whoName: null, since: 0, off: 0 }); }
// The dev sheet's button: wear it out right now, to see it nap.
export function tireMole() { mole.feel.tired = 1; mole.napping = true; switchTo(mole, MOLE_DOES, 'nap'); }

export function updateMole(dt) {
  const c = mole, s = c.strain;
  drift(c.feel, { tired: s > TIRE_AT ? TIRE : s < REST_AT ? -RECOVER : 0 }, dt);
  if (c.feel.tired >= 1) c.napping = true;
  else if (c.feel.tired <= WAKE_AT) c.napping = false;
  c.since += dt;
  drp.fly = FLY * (1 - 0.5 * c.feel.tired);
  think(c, MOLE_DOES, dt);
}

// ---------- what it's thinking (the bubble you get by tapping it) ----------
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
function moleThinks() {
  const c = mole, t = c.feel.tired;
  let doing, why;
  if (c.napping) { doing = 'Zzz...'; why = "I'm worn out from all this dropping. I'll get back to burying things after a little rest."; }
  else if (c.doing === 'bury' && c.whoName) { doing = `I'm burying ${c.whoName}!`; why = 'Look at all that fidgeting. Nobody fidgets like that unless they want to be underground.'; }
  else if (barn.piece && barn.hauling) { doing = "I'm burying the barn again!"; why = 'Somebody keeps digging it up. It\'s a home, and homes belong underground.'; }
  else if (barn.piece && barnCover() >= 0) { doing = "I'm tucking the barn in deeper."; why = "It's nicely buried. A little deeper can't hurt."; }
  else { doing = "I'm burying the barn."; why = "It's a home, and homes belong underground."; }
  if (!c.napping && t > 0.3) why += " I'm getting tired, though, so I'm taking it slow.";
  const feelings = [{ label: "I'm tired", value: t }];
  if (barn.piece) feelings.push({ label: 'The barn needs burying', value: clamp01(-barnCover() / ROOF) });
  for (const o of offers('restless')) feelings.push({ label: `${o.name} wants to be buried`, value: clamp01(o.how) });
  return { doing, why, feelings };
}
mindsFrom(() => {
  const o = world.held ? heldOffsets(world.held, world.held.ang) : NO_PIECE;
  return [{ who: mole, name: 'Mole', x: drp.x, y: drp.y + o.y0, h: o.y1 - o.y0 + 1.2 * U, think: moleThinks }];
});
