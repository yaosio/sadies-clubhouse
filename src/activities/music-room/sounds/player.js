// Plays the music room's sounds in the browser (the samples are made by the other files here, as
// plain numbers), all through the room's volume dial. Also the theremin's voice, which can't be a
// sample: it plays for as long as you hold it, sliding wherever your hand goes.
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
    played: 0, last: null, log: [], volume,   // (how many, the last, and the last 40: for the checks)
    wake() { try { if (ctx && ctx.state !== 'running') ctx.resume(); } catch {} },
    // the volume dial: 0 (off) to 1
    setVolume(v) { player.volume = v; if (out) out.gain.setTargetAtTime(v, ctx.currentTime, 0.05); },
    // play a sound: its name (the same name, the same sound: it's only made once), how to make it,
    // and how loud (0 to 1)
    play(key, make, loud = 1) {
      player.played++; player.last = key; player.log.push(key); if (player.log.length > 40) player.log.shift();
      const b = buffer(key, make); if (!b || !player.volume) return;
      try {
        const src = ctx.createBufferSource(), g = ctx.createGain();
        src.buffer = b; g.gain.value = loud; src.connect(g); g.connect(out); src.start();
      } catch {}
    },
    // a voice that sounds while it's held: set(frequency, how loud) as often as you like (it glides),
    // stop() to let it fade away. Crunched to 8 bits like everything else.
    voice() {
      player.played++; player.last = 'voice'; player.log.push('voice'); if (player.log.length > 40) player.log.shift();
      if (!ctx) return { set() {}, stop() {} };
      try {
        const osc = ctx.createOscillator(), wob = ctx.createOscillator(), wobAmt = ctx.createGain(), crunch = ctx.createWaveShaper(), g = ctx.createGain();
        osc.type = 'sine'; wob.frequency.value = 5.5; wobAmt.gain.value = 0;
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) curve[i] = Math.round((i / 127.5 - 1) * 24) / 24;   // (a few dozen levels: the 8-bit crunch)
        crunch.curve = curve;
        g.gain.value = 0;
        wob.connect(wobAmt); wobAmt.connect(osc.frequency); osc.connect(crunch); crunch.connect(g); g.connect(out);
        osc.start(); wob.start();
        let gone = false;
        return {
          set(f, loud) {
            if (gone) return;
            const now = ctx.currentTime;
            osc.frequency.setTargetAtTime(f, now, 0.04); wobAmt.gain.setTargetAtTime(f * 0.012, now, 0.1);
            g.gain.setTargetAtTime(loud, now, 0.05);
          },
          stop() {
            if (gone) return; gone = true;
            const now = ctx.currentTime;
            g.gain.setTargetAtTime(0, now, 0.08);
            osc.stop(now + 0.6); wob.stop(now + 0.6);
          },
        };
      } catch { return { set() {}, stop() {} }; }
    },
  };
  const off = new AbortController();
  if (ctx && globalThis.addEventListener) for (const e of ['pointerdown', 'keydown', 'touchend'])
    globalThis.addEventListener(e, () => player.wake(), { capture: true, passive: true, signal: off.signal });
  // done with it for good (its room put away): the browser's sound goes, and it stops listening
  player.close = () => { off.abort(); try { ctx?.close().catch(() => {}); } catch {} ctx = null; };
  return player;
}
