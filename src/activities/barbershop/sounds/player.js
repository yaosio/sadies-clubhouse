// Plays the shop's music (music.js) on the sound system's music line: the shop's tune while you're
// inside, a show's song during its show. The line is the sound system's (sound.js): the clubhouse's
// own theme makes way for it, the pause menu's MUSIC button sets its volume, it's only heard in the
// shop, and it's all stopped when the shop's put away. One song at a time; a new one fades the old
// one out first.
import { RATE } from '../../../shared/retro.js';
import { SONGS, shopSteps } from './music.js';

// `h`: the room's handle (soundsFor). Returns { play(name, { loop, fade }), stop(secs), prepare(breathe), playing }
export function makeMusic(h, volume = 0.6) {
  const line = h.line('music'), ctx = line?.ctx ?? null;
  const made = {};
  let now = null;
  const rendered = {};
  const buffer = name => made[name] ||= (() => {
    const a = rendered[name] || SONGS[name](), b = ctx.createBuffer(1, a.length, RATE);
    b.copyToChannel(a, 0);
    return b;
  })();
  // make the shop's tune ahead of time, a step at a time (`breathe`: the room's, so the game draws between steps),
  // so the first time you walk in it's ready instead of taking a tenth of a second or more to make
  async function prepare(breathe) {
    if (rendered.shop) return;
    const it = shopSteps();
    for (let r = it.next(); ; r = it.next()) {
      if (r.done) { rendered.shop = r.value; return; }
      await breathe?.();
    }
  }
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
  return { play, stop, prepare, get playing() { return now ? now.name : null; } };
}
