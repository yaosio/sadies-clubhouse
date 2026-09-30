// Plays Clyde's house's sounds in the browser (made by the other files here, as plain numbers).
// Each group has a file of its own: the machine's (machine.js), Sadie's (sadie.js), Clyde's (clyde.js)
// the chime when the treat lands (chime.js) and the weather machine's jingles (weather.js); synth.js is what they're made with. The same sound
// can't play twice within a tenth of a second (mashing a key never makes a buzz). Browsers only let
// a page make sound once something's been pressed, so it's made when you step up to the machine. If
// the browser has no sound at all, it quietly does nothing (but still counts, for the checks).
import { RATE } from './synth.js';
import { chime } from './chime.js';
import * as machine from './machine.js';
import * as sadie from './sadie.js';
import * as clyde from './clyde.js';
import * as weather from './weather.js';

// every sound, by name
export const ALL = { chime, ...machine, ...sadie, ...clyde, ...weather };

export function makeSounds(volume = 0.45) {
  let ctx = null, out = null;
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    ctx = new AC(); out = ctx.createGain(); out.gain.value = volume; out.connect(ctx.destination);
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
  const last = new Map();
  function play(key, make) {
    const now = globalThis.performance?.now?.() ?? Date.now();
    if (now - (last.get(key) ?? -1e9) < 100) return;
    last.set(key, now);
    S.played++; S.log.push(key);
    const b = buffer(key, make); if (!b) return;
    try { const src = ctx.createBufferSource(); src.buffer = b; src.connect(out); src.start(); } catch {}
  }
  const S = {
    played: 0, log: [],
    wake() { try { if (ctx && ctx.state !== 'running') ctx.resume(); } catch {} },
    // done with it for good (its room put away): the browser's sound goes
    close() { try { ctx?.close().catch(() => {}); } catch {} ctx = null; },
  };
  for (const [k, make] of Object.entries(ALL)) S[k] = () => play(k, make);
  return S;
}
