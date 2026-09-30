// The sound director: every sound in the clubhouse goes out through here, so music never plays over
// other music without anyone having to remember it.
//
// Anything that makes sound asks for its own line to the speakers with openAudio(), saying whether
// it's music (a tune, a song, a radio) or just sounds (a crack, a meow, an instrument you play).
// Music goes through a music channel: the director listens to every music channel (a meter on each)
// and knows when one is actually playing, and the pause menu's MUSIC button (ON, SOFT, OFF) sets
// every music channel's volume at once. The clubhouse's main theme is music too (`theme`): it asks
// otherMusic() every frame and fades out while anything else is playing, and back in after.
//
// So a new room just plays its music through openAudio({ music: true }): the theme makes way for it
// by itself, and the MUSIC button works on it. Nothing else may make its own AudioContext (the
// checks look). Browsers without sound get null, and every caller quietly does nothing.

const HOLD = 6;           // seconds the theme stays away after other music was last heard (its rests)
const HEARD = 0.004;      // how loud (RMS) counts as playing
export const LEVELS = { on: 1, soft: 0.45, off: 0 };

const channels = new Set();
let level = 1, heardAt = -1e9;

// A line to the speakers: { ctx, out } (connect what you play to `out`), or null with no sound.
export function openAudio({ music = false, theme = false } = {}) {
  let ctx;
  try { const AC = globalThis.AudioContext || globalThis.webkitAudioContext; ctx = new AC(); } catch { return null; }
  if (!music) return { ctx, out: ctx.destination };
  const input = ctx.createGain(), vol = ctx.createGain(), meter = ctx.createAnalyser();
  meter.fftSize = 512;
  vol.gain.value = level;
  input.connect(meter); input.connect(vol); vol.connect(ctx.destination);
  channels.add({ ctx, vol, meter, theme, buf: new Float32Array(meter.fftSize) });
  return { ctx, out: input };
}

// How loud music is to be: 0 to 1 (the MUSIC button: ON 1, SOFT 0.45, OFF 0), on every channel.
export function setMusicLevel(v) {
  level = v;
  for (const c of channels) if (c.ctx.state !== 'closed') c.vol.gain.setTargetAtTime(v, c.ctx.currentTime, 0.1);
}
export const musicLevel = () => level;

// Is any music but the theme playing (or was it, in the last few seconds)? The meters are read
// before the MUSIC button's volume, so music turned down still counts.
export function otherMusic() {
  const now = performance.now() / 1000;
  for (const c of [...channels]) {
    if (c.ctx.state === 'closed') { channels.delete(c); continue; }
    if (c.theme || c.ctx.state !== 'running') continue;
    c.meter.getFloatTimeDomainData(c.buf);
    let s = 0; for (const x of c.buf) s += x * x;
    if (Math.sqrt(s / c.buf.length) > HEARD) heardAt = now;
  }
  return now - heardAt < HOLD;
}
