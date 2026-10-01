// Plays the music in the browser: each note is made once by synth.js (as plain numbers) and then
// played at exactly its time, a moment ahead, through a soft echo. Two tracks: the trip's song, and
// the radio's (whose loudness follows how near you are to the radio).
//
// It plays on the clubhouse's sound system (src/shared/sound.js), through a music line: the main
// theme makes way for it, the MUSIC volume turns it down, and it's only heard in its room. If the
// browser has no sound at all it quietly does nothing, but still keeps count of what it would have
// played (for the checks).
import { RATE, INSTRUMENTS, soundKey } from './synth.js';

const AHEAD = 0.6;   // how far ahead notes are handed to the browser (s)

// `h`: the room's handle (src/shared/sound.js); the music goes out through a music line of its own
export function makeMusic(h, volume = 0.4) {
  const line = h.line('music');
  let ctx = line?.ctx ?? null, out = null, echoIn = null;
  if (ctx) {
    out = ctx.createGain(); out.gain.value = volume; out.connect(line.out);
    // the echo: a dotted-eighth-ish delay, dulled a little more each time round
    echoIn = ctx.createGain(); echoIn.gain.value = 0.3;
    const d = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
    d.delayTime.value = 0.42; fb.gain.value = 0.32; lp.type = 'lowpass'; lp.frequency.value = 2200;
    echoIn.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(out);
  }
  const made = new Map();
  function buffer(e) {
    const key = soundKey(e);
    if (!made.has(key)) {
      const s = INSTRUMENTS[e.kind](e), b = ctx.createBuffer(1, s.length, RATE);
      b.getChannelData(0).set(s); made.set(key, b);
    }
    return made.get(key);
  }
  const ECHO = { lead: 1, pluck: 0.8, bell: 1, snare: 0.5, pad: 0.3 };

  // a track: a song's notes, played from a moment you say, and (for the radio) round and round
  function track(notes, { loop = 0 } = {}) {
    // its output, and its send into the echo beside it: both fade together when it stops (so no
    // note already handed over carries on in the echo)
    let gain = null, wet = null;
    const fresh = v => {
      gain = ctx.createGain(); gain.gain.value = v; gain.connect(out);
      wet = ctx.createGain(); wet.gain.value = v; wet.connect(echoIn);
    };
    if (ctx) fresh(1);
    let next = 0, lap = 0, playing = false, start = 0;
    const tr = {
      played: 0,
      // start at song time `from` (s)
      play(from = 0) {
        playing = true; lap = 0; next = 0;
        if (loop) { lap = Math.floor(from / loop); from -= lap * loop; }
        while (next < notes.length && notes[next].t < from) next++;
        start = (ctx ? ctx.currentTime : 0) - from;
        if (gain) for (const g of [gain, wet]) { g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(tr.level ?? 1, ctx.currentTime); }
      },
      // stop, fading out over `secs`
      stop(secs = 0.3) {
        if (!playing) return;
        playing = false;
        if (gain) {
          const old = [gain, wet];
          for (const g of old) { g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + secs); }
          // (fresh ones for next time, so notes already handed over fade with the old ones, which
          // are let go once they're quiet)
          fresh(0);
          setTimeout(() => { for (const g of old) try { g.disconnect(); } catch {} }, secs * 1000 + 1500);
        }
      },
      get playing() { return playing; },
      level: 1,
      setLevel(v) { tr.level = v; if (gain && playing) for (const g of [gain, wet]) g.gain.setTargetAtTime(v, ctx.currentTime, 0.1); },
      // hand the browser the notes coming up in the next moment; call it every frame
      tick() {
        if (!playing) return;
        const now = ctx ? ctx.currentTime : performance.now() / 1000, songNow = now - start;
        for (;;) {
          if (next >= notes.length) {
            if (!loop) { playing = false; return; }
            next = 0; lap++;
          }
          const e = notes[next], at = e.t + lap * loop;
          if (at > songNow + AHEAD) break;
          next++;
          if (at < songNow - 0.05) continue;   // (too late for it: skipped, never bunched up)
          tr.played++;
          if (!ctx) continue;
          try {
            const src = ctx.createBufferSource(), g = ctx.createGain();
            src.buffer = buffer(e); g.gain.value = e.vol ?? 0.5; src.connect(g); g.connect(gain);
            if (ECHO[e.kind]) { const s = ctx.createGain(); s.gain.value = ECHO[e.kind] * (e.vol ?? 0.5); src.connect(s); s.connect(wet); }
            src.start(start + at);
          } catch {}
        }
      },
    };
    if (!ctx) tr.tick = () => {};   // (no sound: nothing to count either)
    return tr;
  }

  const music = {
    track,
    wake: () => h.wake(),
    // make a song's notes ahead of time (a few at a time, so nothing stutters)
    warm(notes, n = 6) { if (!ctx) return true; let k = 0; for (const e of notes) { if (made.has(soundKey(e))) continue; buffer(e); if (++k >= n) return false; } return true; },
    close: () => h.close(),
  };
  return music;
}
