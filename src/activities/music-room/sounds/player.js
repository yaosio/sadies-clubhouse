// Plays the music room's sounds in the browser (the samples are made by the other files here, as
// plain numbers), all through the room's volume dial. Also the theremin's voice, which can't be a
// sample: it plays for as long as you hold it, sliding wherever your hand goes.
// (If the browser has no sound at all, it quietly does nothing, but still counts, for the checks.)
import { RATE } from '../../../shared/retro.js';
import { wrap } from '../../../shared/sound.js';

// `h`: the room's handle (src/shared/sound.js): the clubhouse's sound system plays everything, with
// its rules (no buzzing, a cap on how many at once). The instruments are sounds, not music (the
// main theme is kept out of this room by its `hush` instead), on the pause menu's SOUNDS volume.
export function makePlayer(h, volume = 0.5) {
  let line = null;   // (the theremin's: made the first time it's played)
  const player = wrap(h, {
    volume,
    // the volume dial: 0 (off) to 1
    setVolume(v) { player.volume = v; if (line) line.out.gain.setTargetAtTime(v, line.ctx.currentTime, 0.05); },
    // a voice that sounds while it's held: set(frequency, how loud) as often as you like (it glides),
    // stop() to let it fade away. Crunched to 8 bits like everything else.
    // play a sound: its name (the same name, the same sound: it's only made once), how to make it,
    // and how loud (0 to 1). 11 kHz samples, each held 4 times over (no smoothing: the crunch).
    play(key, make, loud = 1) { if (player.volume) h.play(key, make, { loud: loud * player.volume, rate: RATE, hold: 4, gap: 0.03 }); },
    voice() {
      h.played++; h.last = 'voice'; h.log.push('voice'); if (h.log.length > 200) h.log.shift();
      line ||= h.line('sounds');
      if (!line) return { set() {}, stop() {} };
      line.out.gain.value = player.volume;
      const ctx = line.ctx, out = line.out;
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
  });
  return player;
}
