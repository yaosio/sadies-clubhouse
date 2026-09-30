// Brickbuster '96's arcade music, written as it plays (no screen: the tests run it in Node), so it
// never comes round the same. Bouncy 1996 arcade: a square-wave tune over a triangle bass, four
// chords a round, the tune's little hook played, varied, answered. It gets more exciting as the
// glass cracks (`heat`, 0 to 1): quicker, a soft arpeggio joins in, the bass starts hopping octaves.
// Every so often it changes chords, and now and then goes up a key, like arcade music does.
//
// Kind to the ears (the owner has misophonia): no drums, nothing hissing or ticking, every note
// short and soft-edged, the tune takes a breath at the end of each round, and it only plays while
// you're at the machine.

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];

const SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11] };
// four chords a round (scale degrees; 0 is home)
const PROGS = {
  minor: [[0, 5, 2, 6], [0, 3, 6, 2], [0, 6, 5, 6], [5, 6, 0, 0], [0, 2, 3, 4], [0, 5, 3, 4]],
  major: [[0, 4, 5, 3], [0, 3, 4, 3], [5, 3, 0, 4], [0, 5, 3, 4], [3, 4, 0, 5]],
};
export const RANGE = { lead: [67, 88], arp: [67, 86], bass: [33, 57] };   // (the bass hops octaves: its low note is at most 45)
export const BPM = [132, 150];   // calm glass to nearly broken
export const BEATS = 4;

export function makeTune(seed = Date.now()) {
  const r = rng(seed);
  let mood = r() < 0.65 ? 'minor' : 'major', tonic = 57 + Math.floor(r() * 5);   // (A3 to C#4)
  let prog = pick(r, PROGS[mood]), hook = makeHook(), answer = makeHook(), bar = 0, rounds = 0, lifts = 0, last = 9, bassStyle = 0;
  const scale = () => SCALES[mood];
  const note = i => tonic + 12 * Math.floor(i / 7) + scale()[((i % 7) + 7) % 7];
  const fit = (m, [lo, hi]) => { while (m > hi) m -= 12; while (m < lo) m += 12; return m; };

  const tune = {
    rounds: () => rounds,
    now: () => ({ mood, tonic, prog, bar }),
    // the next bar at this heat: { secs, notes: [{ at, len, midi, voice, vel }] }
    next(heat = 0) {
      heat = Math.max(0, Math.min(1, heat));
      const bpm = BPM[0] + (BPM[1] - BPM[0]) * heat, spb = 60 / bpm;
      if (bar === 0) newRound(heat);
      const deg = prog[bar % 4], root = note(deg), tri = [0, 2, 4].map(k => note(deg + k));
      const notes = [];
      const add = (beat, lenBeats, midi, voice, vel) => notes.push({ at: beat * spb, len: Math.min(0.9, lenBeats * spb), midi, voice, vel: vel * (0.9 + r() * 0.15) });
      // the bass
      const b = fit(root - 12, [RANGE.bass[0], RANGE.bass[0] + 12]);
      if (bassStyle === 2) for (let i = 0; i < 8; i++) add(i / 2, 0.4, b + (i % 2 ? 12 : 0), 'tri', i % 2 ? 0.34 : 0.45);
      else if (bassStyle === 1) [[0, b], [1.5, b], [2, fit(tri[2] - 12, RANGE.bass)], [3, b]].forEach(([at, m]) => add(at, 0.8, m, 'tri', 0.45));
      else [0, 1, 2, 3].forEach(i => add(i, 0.8, i === 2 ? fit(tri[2] - 12, RANGE.bass) : b, 'tri', 0.45));
      // a soft arpeggio up high, once the glass has cracked
      if (heat >= 0.3) {
        const up = tri.map(m => fit(m + 12, RANGE.arp)).sort((x, y) => x - y);
        const ord = [0, 1, 2, 1, 0, 1, 2, 1];
        for (let i = 0; i < 8; i++) if (i || bar % 2 === 0) add(i / 2, 0.35, up[ord[i]], 'pulse', 0.13 + 0.05 * heat);
      }
      // the tune: the hook, the hook varied, the hook again, then the answer (and a breath at the end)
      const phrase = [hook, hook, hook, answer][Math.floor(bar / 2)], half = bar % 2, kind = ['m', 'v', 'm', 'a'][Math.floor(bar / 2)];
      if (!(bar === 7 && r() < 0.6)) {
        for (const h of phrase) {
          if (Math.floor(h.at / BEATS) !== half) continue;
          if (kind === 'v' && r() < 0.2) continue;
          let i = last + (kind === 'v' && r() < 0.3 ? h.step + pick(r, [-1, 1]) : h.step);
          if (i > 16) i -= 7; if (i < 4) i += 7;
          if (h.at % 2 === 0) i = snap(i, tri);   // (on the beat: a note of the chord)
          last = i;
          add(h.at - half * BEATS, h.dur * 0.8, fit(note(i), RANGE.lead), 'sq', 0.38);
        }
      }
      bar = (bar + 1) % 8;
      return { secs: BEATS * spb, notes: notes.sort((x, y) => x.at - y.at) };
    },
  };
  // a new round: now and then new chords, a new hook, or a key change up
  function newRound(heat) {
    rounds++;
    if (rounds > 1 && rounds % 2 === 1) { prog = pick(r, PROGS[mood]); answer = makeHook(); }
    if (rounds > 1 && rounds % 4 === 1) {
      hook = makeHook();
      if (lifts < 3 && r() < 0.6) { tonic += 2; lifts++; } else if (lifts) { tonic -= 2 * lifts; lifts = 0; if (r() < 0.3) mood = mood === 'minor' ? 'major' : 'minor'; prog = pick(r, PROGS[mood]); }
    }
    bassStyle = heat >= 0.6 ? 2 : heat >= 0.3 ? pick(r, [1, 2]) : pick(r, [0, 1]);
  }
  // a hook: two bars of quick notes (eighths and quarters) and the steps between them
  function makeHook() {
    const out = [];
    let t = pick(r, [0, 0, 0.5]);
    while (t < 7) {
      const dur = pick(r, [0.5, 0.5, 0.5, 1, 1, 1.5]);
      out.push({ at: t, dur, step: out.length ? pick(r, [-2, -1, -1, 1, 1, 2, 2, 3, -3, 0]) : 0 });
      t += dur;
      if (r() < 0.12) t += 0.5;   // (a little gap)
    }
    const lastN = out[out.length - 1]; lastN.dur = Math.max(lastN.dur, Math.min(1.5, 8 - lastN.at));
    return out;
  }
  function snap(i, tri) {
    const pcs = tri.map(m => m % 12);
    for (let d = 0; d < 4; d++) for (const s of [0, -d, d]) if (pcs.includes(note(i + s) % 12)) return i + s;
    return i;
  }
  return tune;
}
