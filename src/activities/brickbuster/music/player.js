// Plays the arcade music in the browser, live on the browser's own oscillators (a square wave for
// the tune, a buzzier one, softened, for the arpeggio, a triangle for the bass), a moment ahead of
// when each note is due, through a music channel (src/shared/audio.js: the clubhouse's theme makes
// way for it, and the pause menu's MUSIC button sets its volume). tune.js writes the notes. It only plays while you're at the machine:
// play() when you step up, stop() when you step back, pause, or the glass breaks (a quick fade),
// and play() again carries on the same tune.
//
// SHAPES are the numbers (the tests read them): how fast a note comes in and goes out (s), and how
// loud each is. With no sound at all in the browser it quietly does nothing.
import { makeTune } from './tune.js';
import { openAudio } from '../../../shared/audio.js';

export const SHAPES = {
  sq: { attack: 0.006, release: 0.04, gain: 0.3, cut: 2400 },
  pulse: { attack: 0.006, release: 0.04, gain: 0.22, cut: 1600 },
  tri: { attack: 0.008, release: 0.03, gain: 0.8, cut: 1800 },
};
const LOUD = 0.16;    // the whole thing (under the cracks and blips); the pause menu's MUSIC button turns it down from there
const AHEAD = 0.5;
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

export function makeArcade(seed = Date.now()) {
  let ctx = null, out = null, line = null, echo = null;
  try {
    line = openAudio({ music: true }); ctx = line.ctx; out = ctx.createGain(); out.gain.value = 0; out.connect(line.out);
    // a short slapback, like a cabinet in a big room
    echo = ctx.createGain(); echo.gain.value = 0.22;
    const d = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
    d.delayTime.value = 0.16; fb.gain.value = 0.2; lp.type = 'lowpass'; lp.frequency.value = 1500;
    echo.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(out);
  } catch { ctx = null; }
  const tune = makeTune(seed);
  let clock = 0, playing = false, notes = 0;
  function note(n, when) {
    const s = SHAPES[n.voice], end = when + n.len, amp = ctx.createGain(), peak = n.vel * s.gain;
    amp.gain.setValueAtTime(0, when); amp.gain.linearRampToValueAtTime(peak, when + s.attack);
    amp.gain.setTargetAtTime(peak * 0.6, when + s.attack, 0.25);
    amp.gain.setTargetAtTime(0, end, s.release);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = s.cut;
    const o = ctx.createOscillator(); o.type = n.voice === 'tri' ? 'triangle' : n.voice === 'pulse' ? 'sawtooth' : 'square'; o.frequency.value = hz(n.midi);
    o.connect(lp); lp.connect(amp); amp.connect(out);
    if (n.voice !== 'tri') { const w = ctx.createGain(); w.gain.value = 0.5; amp.connect(w); w.connect(echo); }
    o.start(when); o.stop(end + s.release * 8);
    o.onended = () => { try { amp.disconnect(); } catch {} };
  }
  const arcade = {
    get playing() { return playing; },
    played: () => notes,
    // start (or carry on)
    play() {
      playing = true;
      if (!ctx) return;
      try { if (ctx.state !== 'running') ctx.resume(); } catch {}
      out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(LOUD, ctx.currentTime, 0.05);
    },
    // stop, fading out over about `secs`
    stop(secs = 0.4) {
      if (!playing) return;
      playing = false;
      if (!ctx) return;
      out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(0, ctx.currentTime, secs / 3);
      // (a fresh output for next time, so the notes already handed over fade with the old one)
      const old = out; out = ctx.createGain(); out.gain.value = 0; out.connect(line.out);
      setTimeout(() => { try { old.disconnect(); } catch {} }, secs * 1000 + 1500);
      clock = 0;
    },
    // every frame while playing: hand over the notes coming up. `heat`: how cracked the glass is (0 to 1)
    tick(heat) {
      if (!playing || !ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      if (clock < now + 0.05) clock = now + 0.08;
      while (clock < now + AHEAD) {
        const bar = tune.next(heat);
        for (const n of bar.notes) { try { note(n, clock + n.at); notes++; } catch {} }
        clock += bar.secs;
      }
    },
    // done with it for good (the room put away)
    close() { try { ctx?.close().catch(() => {}); } catch {} ctx = null; playing = false; },
  };
  return arcade;
}
