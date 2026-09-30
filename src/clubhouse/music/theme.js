// Plays the main theme in the browser: compose.js writes it a bar at a time, voices.js plays each
// note, a moment ahead of when it's due. The mansion calls tick() every frame. Whenever any other
// music is playing anywhere (the sound director, src/shared/audio.js, hears it), or the place you're
// in asks for quiet (`hush`), the theme fades out (and stops writing), and fades back in once it's
// over, carrying on, or starting a new piece after a long quiet.
//
// The pause menu's MUSIC button sets how loud it is: ON, SOFT or OFF (the director sets the volume
// of all music; at OFF the theme stops writing too).
// Browsers only let a page make sound once the player has pressed something, so it wakes itself on
// the next press or key. With no sound at all in the browser, it quietly does nothing.
import { makeComposer } from './compose.js';
import { playNote, makeEcho } from './voices.js';
import { openAudio, otherMusic, setMusicLevel, LEVELS } from '../../shared/audio.js';
export { LEVELS };
const LOUD = 0.2;        // the whole theme at ON: soft, under everything else in the house
const AHEAD = 1.2;       // how far ahead notes are handed to the browser (s)
const FRESH_AFTER = 40;  // quiet longer than this (s), and it starts a new piece when it comes back

export function makeTheme(setting = 'on', seed = Date.now()) {
  let ctx = null, out = null, echo = null;
  try {
    const line = openAudio({ music: true, theme: true });
    ctx = line.ctx; out = ctx.createGain(); out.gain.value = 0; out.connect(line.out);
    echo = makeEcho(ctx, out);
  } catch { ctx = null; }
  const composer = makeComposer(seed);
  setMusicLevel(LEVELS[setting] ?? 1);
  let clock = 0, want = false, other = false, level = -1, quietSince = 0, notes = 0, bars = 0, piece = null;
  const theme = {
    // ON, SOFT or OFF
    set(s) { setting = LEVELS[s] !== undefined ? s : 'on'; setMusicLevel(LEVELS[setting]); },
    get setting() { return setting; },
    wake() { try { if (ctx && ctx.state === 'suspended' && want) ctx.resume(); } catch {} },
    // every frame: `hush` when the place you're in asks for quiet
    tick(hush) {
      if (!ctx) return;
      const now = ctx.currentTime, hidden = globalThis.document?.hidden;
      const was = want;
      other = otherMusic();
      want = !hush && !other && setting !== 'off' && !hidden;
      const target = want ? LOUD : 0;
      if (target !== level) {
        // fading out takes about two seconds, coming back about four
        out.gain.cancelScheduledValues(now); out.gain.setValueAtTime(out.gain.value, now);
        out.gain.setTargetAtTime(target, now, target > level ? 1.2 : 0.6);
        level = target;
      }
      if (!want) {
        if (was) quietSince = performance.now();
        // (a page out of sight, or no music for a while: the browser's sound rests)
        if (ctx.state === 'running' && (hidden || performance.now() - quietSince > 6000)) ctx.suspend().catch(() => {});
        return;
      }
      if (ctx.state !== 'running') { if (!was) ctx.resume().catch(() => {}); return; }
      if (!was && quietSince && performance.now() - quietSince > FRESH_AFTER * 1000) composer.fresh();
      if (clock < now + 0.05) clock = now + 0.15;   // (coming back: carry on from the next bar)
      while (clock < now + AHEAD) {
        const bar = composer.next();
        piece = composer.now();
        if (piece && echo) echo.setBeat(60 / piece.bpm);
        for (const n of bar.notes) { try { playNote(ctx, out, echo.input, n, clock + n.at); notes++; } catch {} }
        clock += bar.secs; bars++;
      }
    },
    // for the checks: what it's doing
    state: () => ({ setting, other, playing: want && ctx?.state === 'running', sound: ctx ? ctx.state : 'none', level: out ? Math.round(out.gain.value * 1000) / 1000 : 0,
      notes, bars, pieces: composer.pieces(), piece }),
    // done for good (going into an activity): a quick fade, then the browser's sound goes
    close() {
      off.abort();
      if (!ctx) return;
      const c = ctx; ctx = null;
      try { out.gain.setTargetAtTime(0, c.currentTime, 0.08); } catch {}
      setTimeout(() => { try { c.close().catch(() => {}); } catch {} }, 400);
    },
  };
  const off = new AbortController();
  if (ctx && globalThis.addEventListener) for (const e of ['pointerdown', 'keydown', 'touchend'])
    globalThis.addEventListener(e, () => theme.wake(), { capture: true, passive: true, signal: off.signal });
  return theme;
}
