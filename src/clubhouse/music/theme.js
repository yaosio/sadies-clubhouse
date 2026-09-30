// Plays the main theme in the browser: compose.js writes it a bar at a time, voices.js plays each
// note, a moment ahead of when it's due, on the clubhouse's sound system (src/shared/sound.js). The
// mansion calls tick() every frame. Whenever any other music is playing (the sound system hears it),
// or the place you're in asks for quiet (`hush`), the theme fades out (and stops writing), and fades
// back in once it's over, carrying on, or starting a new piece after a long quiet. With the pause
// menu's MUSIC at OFF it stops writing too. With no sound at all in the browser, it does nothing.
import { makeComposer } from './compose.js';
import { playNote, makeEcho } from './voices.js';
import { soundsFor, otherMusic, volume } from '../../shared/sound.js';
const LOUD = 0.2;        // the whole theme: soft, under everything else in the house
const AHEAD = 1.2;       // how far ahead notes are handed to the browser (s)
const FRESH_AFTER = 40;  // quiet longer than this (s), and it starts a new piece when it comes back

export function makeTheme(seed = Date.now()) {
  const sound = soundsFor('clubhouse'), line = sound.line('music', { everywhere: true, theme: true });
  let ctx = line?.ctx ?? null, out = null, echo = null;
  if (ctx) { out = ctx.createGain(); out.gain.value = 0; out.connect(line.out); echo = makeEcho(ctx, out); }
  const composer = makeComposer(seed);
  let clock = 0, want = false, other = false, level = -1, quietSince = 0, notes = 0, bars = 0, piece = null;
  const theme = {
    // every frame: `hush` when the place you're in asks for quiet
    tick(hush) {
      if (!ctx) return;
      const now = ctx.currentTime, hidden = globalThis.document?.hidden;
      const was = want;
      other = otherMusic();
      want = !hush && !other && volume('music') > 0 && !hidden;
      const target = want ? LOUD : 0;
      if (target !== level) {
        // fading out takes about two seconds (one where a place asks for quiet: you've walked in), coming back about four
        out.gain.cancelScheduledValues(now); out.gain.setValueAtTime(out.gain.value, now);
        out.gain.setTargetAtTime(target, now, target > level ? 1.2 : hush ? 0.3 : 0.6);
        level = target;
      }
      if (!want) { if (was) quietSince = performance.now(); return; }
      if (ctx.state !== 'running') return;
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
    state: () => ({ other, playing: want && ctx?.state === 'running', sound: ctx ? ctx.state : 'none', level: out ? Math.round(out.gain.value * 1000) / 1000 : 0,
      notes, bars, pieces: composer.pieces(), piece }),
    // done for good (going into an activity)
    close: () => sound.close(),
  };
  return theme;
}
