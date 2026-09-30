// The sound system: every sound in the clubhouse is played through here. One audio engine for the
// whole page (a phone only has to run one), three volumes (music, sounds, voices: the pause menu's
// buttons), and the rules that keep it kind to the ears (the owner has misophonia) in one place, so
// every room, and every room still to come, keeps them without doing anything.
//
// A room gets a handle with soundsFor(owner), `owner` being its place's name ('room:brickbuster'),
// and plays by name: handle.play('crack2', () => samples, { loud, bus, dist }). A sound's samples are
// made the first time its name is played and kept. Music that streams (a song, a radio, the main
// theme) asks for a line instead: handle.line('music') gives { ctx, out } to connect notes to.
//
// The rules, for everything:
//   - the same sound can't play again within `gap` seconds (0.08 unless it says; mashing never buzzes)
//   - a voice (bus 'voices': Sadie, Clyde) never says the same thing twice running
//   - `dist` (metres from you) fades it: all of it up to `near`, nothing past `far`
//   - never more than MAX sounds at once (anything more is dropped, not queued)
//   - a room's music is only heard while you're in that room (the mansion says where you are)
//   - any music playing (heard on its meter) makes the main theme fade out (otherMusic())
//   - a room put away (or left for good) stops everything it started: closeSounds(owner)
// Browsers only allow sound once something's been pressed: it wakes on the first press or key, and
// rests while the page is out of sight. With no sound at all in the browser, it quietly does nothing,
// but still counts what it would have played (for the checks).

export const LEVELS = { on: 1, soft: 0.45, off: 0 };
export const BUSES = ['music', 'sounds', 'voices'];
const MAX = 14;           // sounds playing at once, at most
const HOLD = 6;           // seconds the theme stays away after other music was last heard (its rests)
const HEARD = 0.004;      // how loud (RMS) counts as music playing

let ctx = null, bus = null, here = null, heardAt = -1e9, live = 0;
const handles = new Set(), levels = { music: 1, sounds: 1, voices: 1 };

function engine() {
  if (ctx !== null) return ctx || null;
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    ctx = new AC();
    bus = {};
    for (const b of BUSES) { bus[b] = ctx.createGain(); bus[b].gain.value = levels[b]; bus[b].connect(ctx.destination); }
    const wake = () => { try { if (ctx.state === 'suspended' && !globalThis.document?.hidden) ctx.resume(); } catch {} };
    for (const e of ['pointerdown', 'keydown', 'touchend']) globalThis.addEventListener?.(e, wake, { capture: true, passive: true });
    globalThis.document?.addEventListener?.('visibilitychange', () => { try { if (document.hidden) ctx.suspend(); else ctx.resume(); } catch {} });
  } catch { ctx = false; }
  return ctx || null;
}

// How loud something is from `d` metres away: all of it up to `near`, fading to nothing at `far`.
export function nearness(d, near = 3, far = 18) {
  const k = Math.min(1, Math.max(0, (far - d) / (far - near)));
  return k * k;
}

// The pause menu's buttons: how loud each bus is (0 to 1)
export function setVolume(b, v) {
  levels[b] = v;
  if (engine()) bus[b].gain.setTargetAtTime(v, ctx.currentTime, 0.1);
}
export const volume = b => levels[b];

// Where you are (the mansion says, every frame): a room's music is only heard while you're in it.
export function youAreIn(owner) {
  if (owner === here) return;
  here = owner;
  if (ctx) for (const h of handles) for (const l of h.lines) if (l.bus === 'music' && !l.everywhere) l.mute.gain.setTargetAtTime(h.owner === here ? 1 : 0, ctx.currentTime, 0.25);
}

// Is any music but the main theme playing (or was it, in the last few seconds)? Read before the
// MUSIC volume, so music turned down still counts.
export function otherMusic() {
  const now = performance.now() / 1000;
  if (ctx && ctx.state === 'running') for (const h of handles) for (const l of h.lines) {
    if (l.bus !== 'music' || l.theme) continue;
    l.meter.getFloatTimeDomainData(l.buf);
    let s = 0; for (const x of l.buf) s += x * x;
    if (Math.sqrt(s / l.buf.length) > HEARD) heardAt = now;
  }
  return now - heardAt < HOLD;
}

// Everything a room started stops (it's been put away).
export function closeSounds(owner) { for (const h of [...handles]) if (h.owner === owner) h.close(); }

// What's going on (for the checks): the engine, how many sounds are playing, and per owner its
// sounds playing, its lines, and its music lines that can be heard where you are.
export function soundState() {
  const owners = {};
  for (const h of handles) {
    const o = owners[h.owner] ||= { sounds: 0, lines: 0, music: 0 };
    o.sounds += h.sources.size; o.lines += h.lines.length;
    for (const l of h.lines) if (l.bus === 'music' && (l.everywhere || h.owner === here)) o.music++;
  }
  return { engine: ctx ? ctx.state : 'none', playing: live, here, levels: { ...levels }, owners };
}

export function soundsFor(owner) {
  const made = new Map(), lastAt = new Map();
  let lastVoice = null;
  const h = {
    owner, sources: new Set(), lines: [], closed: false,
    played: 0, last: null, log: [],   // (how many, the last, and the last 200: for the checks)
    // play a sound by name. `make()` makes its samples (plain numbers, at `rate`, each held `hold`
    // times over: the 8-bit crunch), the first time only. Returns whether it played.
    play(key, make, { loud = 1, bus: b = 'sounds', rate = 11025, hold = 1, gap = 0.08, dist, near, far } = {}) {
      if (h.closed) return false;
      const now = performance.now() / 1000;
      if (now - (lastAt.get(key) ?? -1e9) < gap) return false;
      if (b === 'voices' && key === lastVoice) return false;
      if (dist !== undefined) loud *= nearness(dist, near, far);
      if (loud < 0.005) return false;
      lastAt.set(key, now); if (b === 'voices') lastVoice = key;
      h.played++; h.last = key; h.log.push(key); if (h.log.length > 200) h.log.shift();
      if (!engine() || ctx.state !== 'running' || live >= MAX) return true;
      try {
        if (!made.has(key)) {
          const s = make(), buf = ctx.createBuffer(1, s.length * hold, rate * hold), d = buf.getChannelData(0);
          if (hold === 1) d.set(s); else for (let i = 0; i < d.length; i++) d[i] = s[Math.floor(i / hold)];
          made.set(key, buf);
        }
        const src = ctx.createBufferSource(), g = ctx.createGain();
        src.buffer = made.get(key); g.gain.value = loud; src.connect(g); g.connect(bus[b]);
        h.sources.add(src); live++;
        src.onended = () => { if (h.sources.delete(src)) live--; try { g.disconnect(); } catch {} };
        src.start();
      } catch {}
      return true;
    },
    // a line to play into yourself (streamed music, a held note): { ctx, out }, or null with no
    // sound. A music line is metered (the main theme makes way for it) and only heard in your room
    // (`everywhere`: the main theme's, heard all over the house; `theme`: it's the main theme).
    line(b = 'music', { everywhere = false, theme = false } = {}) {
      if (h.closed || !engine()) return null;
      const out = ctx.createGain(), mute = ctx.createGain();
      mute.gain.value = b !== 'music' || everywhere || owner === here ? 1 : 0;
      out.connect(mute); mute.connect(bus[b]);
      const l = { bus: b, out, mute, everywhere, theme };
      if (b === 'music') { l.meter = ctx.createAnalyser(); l.meter.fftSize = 512; l.buf = new Float32Array(512); mute.connect(l.meter); }
      h.lines.push(l);
      return { ctx, out };
    },
    wake() { try { if (engine() && ctx.state === 'suspended') ctx.resume(); } catch {} },
    // stop everything it started, for good
    close() {
      if (h.closed) return;
      h.closed = true; handles.delete(h);
      for (const s of h.sources) { try { s.stop(); } catch {} }
      live -= h.sources.size; h.sources.clear();
      for (const l of h.lines) { try { l.mute.disconnect(); } catch {} }
      h.lines = [];
    },
  };
  handles.add(h);
  return h;
}
