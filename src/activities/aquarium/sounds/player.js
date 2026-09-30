// Plays the ocean's sounds in the browser (the samples are made by the other files here, as plain
// numbers). A copy of Brickbuster's player (activities never share files).
//
// Browsers only let a page make sound once the player has pressed something, so it wakes itself on
// the next press or key (and whoever made it can wake() it during one). If the browser has no sound
// at all, it quietly does nothing (but still counts, for the checks).
import { RATE } from './retro.js';
import { openAudio } from '../../../shared/audio.js';

export function makePlayer(volume = 0.5) {
  let ctx = null, out = null, line = null;
  try {
    line = openAudio(); ctx = line.ctx; out = ctx.createGain(); out.gain.value = volume; out.connect(line.out);
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
    played: 0, last: null, log: [],   // (how many, the last, and the last 40: for the checks)
    wake() { try { if (ctx && ctx.state !== 'running') ctx.resume(); } catch {} },
    // play a sound: its name (the same name, the same sound: it's only made once), how to make it,
    // and how loud (0 to 1)
    play(key, make, loud = 1) {
      player.played++; player.last = key; player.log.push(key); if (player.log.length > 40) player.log.shift();
      const b = buffer(key, make); if (!b) return;
      try {
        const src = ctx.createBufferSource(), g = ctx.createGain();
        src.buffer = b; g.gain.value = loud; src.connect(g); g.connect(out); src.start();
      } catch {}
    },
  };
  const off = new AbortController();
  if (ctx && globalThis.addEventListener) for (const e of ['pointerdown', 'keydown', 'touchend'])
    globalThis.addEventListener(e, () => player.wake(), { capture: true, passive: true, signal: off.signal });
  // done with it for good (its room put away): the browser's sound goes, and it stops listening
  player.close = () => { off.abort(); try { ctx?.close().catch(() => {}); } catch {} ctx = null; };
  return player;
}

// How loud something is from `d` metres away: all of it up to `near`, fading to nothing at `far`.
export function nearness(d, near = 3, far = 18) {
  const k = Math.min(1, Math.max(0, (far - d) / (far - near)));
  return k * k;
}
