// Plays the shop's music (music.js) on the sound system's music line: the shop's tune while you're
// inside, a show's song during its show. The line is the sound system's (sound.js): the clubhouse's
// own theme makes way for it, the pause menu's MUSIC button sets its volume, it's only heard in the
// shop, and it's all stopped when the shop's put away. One song at a time; a new one fades the old
// one out first.
import { RATE } from '../../../shared/retro.js';
import { SONGS } from './music.js';

// `h`: the room's handle (soundsFor). Returns { play(name, { loop, fade }), stop(secs), playing }
export function makeMusic(h, volume = 0.6) {
  const line = h.line('music'), ctx = line?.ctx ?? null;
  const made = {};
  let now = null;
  const buffer = name => made[name] ||= (() => {
    const a = SONGS[name](), b = ctx.createBuffer(1, a.length, RATE);
    b.copyToChannel(a, 0);
    return b;
  })();
  function stop(secs = 0.5) {
    if (!now) return;
    const { src, gain } = now, t = ctx.currentTime;
    now = null;
    gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(0, t + secs);
    try { src.stop(t + secs + 0.05); } catch {}
    src.onended = () => { try { gain.disconnect(); } catch {} };
  }
  function play(name, { loop = false, fade = 0.6 } = {}) {
    if (!ctx) return;
    stop(0.4);
    const src = ctx.createBufferSource(), gain = ctx.createGain(), t = ctx.currentTime;
    src.buffer = buffer(name); src.loop = loop;
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(volume, t + fade);
    src.connect(gain); gain.connect(line.out); src.start(t);
    now = { src, gain, name };
    src.onended = () => { if (now && now.src === src) now = null; try { gain.disconnect(); } catch {} };
  }
  return { play, stop, get playing() { return now ? now.name : null; } };
}
