// Plays the music in the browser: each note is made once by synth.js (as plain numbers) and then
// played at exactly its time, a moment ahead, through a soft echo. Two tracks: the trip's song, and
// the radio's (whose loudness follows how near you are to the radio).
//
// Browsers only let a page make sound once the player has pressed something, so it wakes itself on
// the next press or key. If the browser has no sound at all it quietly does nothing, but still keeps
// count of what it would have played (for the checks).
import { RATE, INSTRUMENTS, soundKey } from './synth.js';

const AHEAD = 0.6;   // how far ahead notes are handed to the browser (s)

export function makeMusic(volume = 0.4) {
  let ctx = null, out = null, echoIn = null;
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    ctx = new AC(); out = ctx.createGain(); out.gain.value = volume; out.connect(ctx.destination);
    // the echo: a dotted-eighth-ish delay, dulled a little more each time round
    echoIn = ctx.createGain(); echoIn.gain.value = 0.3;
    const d = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
    d.delayTime.value = 0.42; fb.gain.value = 0.32; lp.type = 'lowpass'; lp.frequency.value = 2200;
    echoIn.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(out);
  } catch { ctx = null; }
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
    let gain = null;
    if (ctx) { gain = ctx.createGain(); gain.gain.value = 1; gain.connect(out); }
    let next = 0, lap = 0, playing = false, start = 0;
    const tr = {
      played: 0,
      // start at song time `from` (s)
      play(from = 0) {
        playing = true; lap = 0; next = 0;
        if (loop) { lap = Math.floor(from / loop); from -= lap * loop; }
        while (next < notes.length && notes[next].t < from) next++;
        start = (ctx ? ctx.currentTime : 0) - from;
        if (gain) { gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setValueAtTime(tr.level ?? 1, ctx.currentTime); }
      },
      // stop, fading out over `secs`
      stop(secs = 0.3) {
        if (!playing) return;
        playing = false;
        if (gain) {
          const g = gain; g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + secs);
          // (a fresh gain for next time, so notes already handed over fade with the old one)
          gain = ctx.createGain(); gain.gain.value = 0; gain.connect(out);
        }
      },
      get playing() { return playing; },
      level: 1,
      setLevel(v) { tr.level = v; if (gain && playing) gain.gain.setTargetAtTime(v, ctx.currentTime, 0.1); },
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
            if (ECHO[e.kind]) { const s = ctx.createGain(); s.gain.value = ECHO[e.kind] * (e.vol ?? 0.5); src.connect(s); s.connect(echoIn); }
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
    wake() { try { if (ctx && ctx.state !== 'running') ctx.resume(); } catch {} },
    // paused (the pause menu): everything stops where it is, and carries on after
    hold(on) { try { if (ctx) on ? ctx.suspend() : ctx.resume(); } catch {} },
    // make a song's notes ahead of time (a few at a time, so nothing stutters)
    warm(notes, n = 6) { if (!ctx) return true; let k = 0; for (const e of notes) { if (made.has(soundKey(e))) continue; buffer(e); if (++k >= n) return false; } return true; },
  };
  if (ctx && globalThis.addEventListener) for (const e of ['pointerdown', 'keydown', 'touchend'])
    globalThis.addEventListener(e, () => music.wake(), { capture: true, passive: true });
  return music;
}

// How loud something is from `d` metres away: all of it up to `near`, fading to nothing at `far`.
export function nearness(d, near = 2, far = 14) {
  const k = Math.min(1, Math.max(0, (far - d) / (far - near)));
  return k * k;
}
