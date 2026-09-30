// Plays Claude's house's sounds in the browser (made by the other files here, as plain numbers).
// There's only the one so far (chime.js); more would each get a file of their own. Browsers only let
// a page make sound once something's been pressed, so it's made when you step up to the machine. If
// the browser has no sound at all, it quietly does nothing (but still counts, for the checks).
import { RATE, chime } from './chime.js';

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
  function play(key, make) {
    S.played++; S.log.push(key);
    const b = buffer(key, make); if (!b) return;
    try { const src = ctx.createBufferSource(); src.buffer = b; src.connect(out); src.start(); } catch {}
  }
  const S = {
    played: 0, log: [],
    wake() { try { if (ctx && ctx.state !== 'running') ctx.resume(); } catch {} },
    chime: () => play('chime', chime),
  };
  return S;
}
