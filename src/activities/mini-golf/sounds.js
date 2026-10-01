// The mini golf's sounds: every one short and soft (nothing that drones or repeats: the owner has
// misophonia), made with the kit in retro.js and played through the clubhouse's sound system
// (src/shared/sound.js), through the course's handle. No mouth sounds: the tentacles grabbing the
// ball is a cartoon spring, not a slurp.
import { RATE, TAU, rng, hz, blank, ring, finish } from '../../shared/retro.js';

// a pitch slide: from f0 to f1 Hz over `secs`, dying away at `dec`, `amp` loud, starting at `at` s
function slide(a, f0, f1, secs, dec, amp, at = 0, shape = Math.sin) {
  let ph = 0;
  const s0 = Math.round(at * RATE), n = Math.round(secs * RATE);
  for (let i = 0; i < n && s0 + i < a.length; i++) {
    const t = i / RATE, f = f0 + (f1 - f0) * (i / n);
    ph += TAU * f / RATE;
    a[s0 + i] += shape(ph) * Math.exp(-t * dec) * amp * Math.min(1, t / 0.004) * Math.min(1, (n - i) / (0.01 * RATE));
  }
}
const soft = ph => Math.sin(ph) * 0.8 + Math.sin(ph * 2) * 0.15;

// the club meeting the ball: a little wooden tock (higher for a tap, lower for a whack)
export function tap(power = 0.5) {
  const a = blank(0.15);
  ring(a, 900 - power * 300, 45, 0.5); ring(a, 1900 - power * 500, 70, 0.2);
  const r = rng(3); for (let i = 0; i < 40; i++) a[i] += (r() * 2 - 1) * 0.2 * (1 - i / 40);
  return finish(a, 0);
}
// the big hit: BONK (a hollow knock that drops in pitch, like a coconut)
export function bonk() {
  const a = blank(0.4, 0.15);
  slide(a, 330, 150, 0.35, 9, 0.7, 0, soft);
  ring(a, 620, 30, 0.25);
  const r = rng(9); for (let i = 0; i < 60; i++) a[i] += (r() * 2 - 1) * 0.25 * (1 - i / 60);
  return finish(a, 0.15);
}
// a pin BLASTED off the course: a sharp clack and a little whistle off into the distance
export function blast(n = 0) {
  const a = blank(0.5);
  const r = rng(20 + n); for (let i = 0; i < 70; i++) a[i] += (r() * 2 - 1) * 0.6 * (1 - i / 70);
  ring(a, 1400 + n * 120, 50, 0.35);
  slide(a, 1500 + n * 200, 2600 + n * 200, 0.4, 5, 0.12, 0.04);
  return finish(a, 0.1);
}
// the ball off a low wall: a soft plastic tok
export function wall() {
  const a = blank(0.08);
  ring(a, 520, 70, 0.35); ring(a, 1300, 110, 0.12);
  return finish(a, 0);
}
// the tentacles grabbing the ball and flinging it back to the tee: a cartoon spring (boing-oing)
export function grab() {
  const a = blank(0.6);
  let ph = 0;
  for (let i = 0; i < a.length; i++) {
    const t = i / RATE, f = 220 + 90 * Math.sin(TAU * 11 * t) * Math.exp(-t * 4) + 140 * t;
    ph += TAU * f / RATE;
    a[i] += soft(ph) * Math.exp(-t * 4.5) * 0.45 * Math.min(1, t / 0.005);
  }
  return finish(a, 0.1);
}
// the tentacles, friendly now, drawing it in: three notes going up
export function pull() {
  const a = blank(0.5);
  [72, 76, 79].forEach((m, i) => ring(a, hz(m), 9, 0.22, i * 0.09));
  return finish(a, 0.15);
}
// in the hole: a low plop, and a chime
export function sunk() {
  const a = blank(0.9, 0.2);
  slide(a, 260, 110, 0.18, 14, 0.6, 0, soft);
  [84, 88, 91, 96].forEach((m, i) => ring(a, hz(m), 6, 0.16, 0.15 + i * 0.07));
  return finish(a, 0.18);
}
// the gnome bumping it: a round boop
export function bump() {
  const a = blank(0.2);
  slide(a, 300, 420, 0.18, 14, 0.45, 0, soft);
  return finish(a, 0);
}
// Sadie's tail batting it: a soft fwap of fur (a puff of brushed noise)
export function bat() {
  const a = blank(0.16), r = rng(7);
  let y = 0;
  for (let i = 0; i < a.length; i++) { const t = i / RATE; y += ((r() * 2 - 1) - y) * 0.25; a[i] += y * Math.sin(Math.PI * t / 0.16) * 0.7; }
  return finish(a, 0);
}
// through the cat flap: flap-clack
export function flap() {
  const a = blank(0.3);
  ring(a, 700, 60, 0.3); ring(a, 950, 60, 0.25, 0.11); ring(a, 1200, 80, 0.15, 0.17);
  return finish(a, 0);
}
// popping out of a tunnel
export function pop() {
  const a = blank(0.12);
  slide(a, 500, 900, 0.1, 20, 0.4, 0, soft);
  return finish(a, 0);
}
// the end of a hole: how it went (under par: a happy run up; par: two notes; over: a shrug)
export function result(under) {
  const a = blank(0.9, 0.2);
  const tune = under < 0 ? [72, 76, 79, 84] : under === 0 ? [72, 79] : [67, 64];
  tune.forEach((m, i) => { ring(a, hz(m), 5, 0.22, i * 0.12); ring(a, hz(m + 12), 9, 0.06, i * 0.12); });
  return finish(a, 0.2);
}
// the trick shot's award: a cheesy little fanfare
export function award() {
  const a = blank(1.6, 0.3);
  [[72, 0], [72, 0.1], [72, 0.2], [77, 0.32], [81, 0.62], [84, 0.82]].forEach(([m, at], i) => {
    ring(a, hz(m), i === 5 ? 2.5 : 7, 0.2, at); ring(a, hz(m + 7), i === 5 ? 3 : 9, 0.07, at); ring(a, hz(m - 12), 6, 0.08, at);
  });
  return finish(a, 0.22);
}

// `h`: the course's handle (soundsFor). `d`: metres from you (a sound far off is quieter).
export function makeSounds(h) {
  const play = (key, make, loud = 1, more) => h.play(key, make, { loud: loud * 0.45, rate: RATE, hold: 4, ...more });
  return {
    putt: (power, d) => power > 0.72 ? play('bonk', bonk, 0.9, { dist: d }) : play('tap' + Math.round(power * 4), () => tap(Math.round(power * 4) / 4), 0.8, { dist: d }),
    blast: (n, d) => play('blast' + n, () => blast(n), 0.7, { dist: d, gap: 0.03 }),
    wall: (speed, d) => play('wall', wall, Math.min(1, speed / 80) * 0.6, { dist: d, gap: 0.12 }),
    grab: d => play('grab', grab, 0.7, { dist: d }),
    pull: d => play('pull', pull, 0.6, { dist: d }),
    sunk: d => play('sunk', sunk, 0.8, { dist: d }),
    bump: d => play('bump', bump, 0.6, { dist: d, gap: 0.3 }),
    bat: d => play('bat', bat, 0.6, { dist: d, gap: 0.3 }),
    flap: d => play('flap', flap, 0.6, { dist: d }),
    pop: d => play('pop', pop, 0.5, { dist: d }),
    result: under => play('result' + Math.sign(under), () => result(under), 0.7),
    award: () => play('award', award, 0.8),
  };
}
// every sound, for the checks
export const ALL = { tap, bonk, blast, wall, grab, pull, sunk, bump, bat, flap, pop, result, award };
