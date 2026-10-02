// What a room's own music plays through (Brickbuster's arcade tune, Space Adventure's songs, the
// Hedge Maze's music box): a music line from the sound system (sound.js: the main theme makes way for
// it, the pause menu's MUSIC button sets its volume, it's only heard in its room, and it's all
// stopped when the room's put away), an echo, and parts that fade in and out together with their
// share of the echo. The room keeps its own notes and when they're due; this is only the plumbing.
//
//   const band = makeBand(h, { volume, echo: { delay, feedback, cut, send } })
//   band.ctx: the browser's sound (null with none at all: then nothing here does anything)
//   const part = band.part(level): a part, starting at that level
//     part.out, part.wet: connect a note to out, and a share of it to wet for the echo
//     part.set(v, wet = v): straight to that level; part.to(v, secs, wet = v): glide there
//     part.fade(secs, linear): fade out over about `secs` (straight down to nothing, if linear); any
//       note already handed over fades with it, and the part's ready to play again at once
export function makeBand(h, { volume = 1, echo }) {
  const line = h.line('music'), ctx = line?.ctx ?? null;
  if (!ctx) return { ctx: null, part: () => null };
  const out = ctx.createGain(); out.gain.value = volume; out.connect(line.out);
  // the echo: a delay that comes round again, dulled a little more each time
  const echoIn = ctx.createGain(); echoIn.gain.value = echo.send;
  const d = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
  d.delayTime.value = echo.delay; fb.gain.value = echo.feedback; lp.type = 'lowpass'; lp.frequency.value = echo.cut;
  echoIn.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(out);

  function part(level = 0) {
    let dry, wet;
    const fresh = v => {
      dry = ctx.createGain(); dry.gain.value = v; dry.connect(out);
      wet = ctx.createGain(); wet.gain.value = v; wet.connect(echoIn);
    };
    fresh(level);
    const both = (v, w, f) => { for (const [g, x] of [[dry, v], [wet, w]]) { g.gain.cancelScheduledValues(ctx.currentTime); f(g.gain, x); } };
    return {
      get out() { return dry; },
      get wet() { return wet; },
      set(v, w = v) { both(v, w, (p, x) => p.setValueAtTime(x, ctx.currentTime)); },
      to(v, secs, w = v) { both(v, w, (p, x) => p.setTargetAtTime(x, ctx.currentTime, secs)); },
      fade(secs, linear = false) {
        const old = [dry, wet], now = ctx.currentTime;
        for (const g of old) {
          g.gain.cancelScheduledValues(now);
          if (linear) { g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + secs); }
          else g.gain.setTargetAtTime(0, now, secs / 3);
        }
        // (fresh ones for next time, so the notes already handed over fade with the old ones, which
        // are let go once they're quiet)
        fresh(0);
        setTimeout(() => { for (const g of old) try { g.disconnect(); } catch {} }, secs * 1000 + 2500);
      },
    };
  }
  return { ctx, part };
}
