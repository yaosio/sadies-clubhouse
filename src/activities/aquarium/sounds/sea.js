// The sea's own sounds, all rare and gentle (the owner has misophonia: nothing constant, nothing
// that repeats). There's no loop at all: now and then one small wave laps at the boat, and the sail
// rustles once when you turn hard. `seaPacing` decides when, with its rules in numbers the tests
// read: never two sounds closer than GAP seconds, waves only every WAVE_MIN to WAVE_MAX seconds,
// never the same one twice running.
import { RATE, rng, blank, finish } from './retro.js';

export const GAP = 8, WAVE_MIN = 40, WAVE_MAX = 80, SAIL_REST = 20;
export const WAVES = 3;

// one small wave: muffled noise that swells up and dies away, a different shape each variant
export function wave(v) {
  const len = [1.9, 2.3, 1.6][v], peak = [0.35, 0.45, 0.3][v], a = blank(len), r = rng(11 + v);
  let y = 0, z = 0;
  for (let i = 0; i < a.length; i++) {
    const k = i / a.length;
    y += (r() * 2 - 1 - y) * 0.06; z += (y - z) * 0.3;   // (twice smoothed: a hush, no hiss)
    const env = k < peak ? Math.sin(Math.PI / 2 * k / peak) : Math.pow(1 - (k - peak) / (1 - peak), 2);
    a[i] = z * env * 2.2;
  }
  return finish(a, 0);
}

// the sail catching the wind as you turn: two soft flaps
export function sail() {
  const a = blank(0.8), r = rng(5);
  let y = 0;
  for (let i = 0; i < a.length; i++) {
    const t = i / RATE;
    y += (r() * 2 - 1 - y) * 0.12;
    const flap = Math.max(0, Math.sin(Math.PI * t / 0.3)) * (t < 0.3 ? 1 : 0) + Math.max(0, Math.sin(Math.PI * (t - 0.35) / 0.4)) * (t > 0.35 && t < 0.75 ? 0.6 : 0);
    a[i] = y * flap * 1.3;
  }
  return finish(a, 0);
}

// When the sea makes a sound: call it every frame with the time, whether you're turning hard, and a
// random number (0 to 1); it hands back what to play ({ name, variant }) or null.
export function seaPacing() {
  let last = -1e9, nextWave = WAVE_MIN, lastWave = -1, lastSail = -1e9;
  return (t, turning, rand) => {
    if (t - last < GAP) return null;
    if (turning && t - lastSail > SAIL_REST) { last = lastSail = t; return { name: 'sail', variant: 0 }; }
    if (t >= nextWave) {
      let v = Math.floor(rand * WAVES) % WAVES;
      if (v === lastWave) v = (v + 1) % WAVES;
      lastWave = v; last = t; nextWave = t + WAVE_MIN + rand * (WAVE_MAX - WAVE_MIN);
      return { name: 'wave', variant: v };
    }
    return null;
  };
}
