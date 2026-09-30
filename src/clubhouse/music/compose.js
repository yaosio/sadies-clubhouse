// The clubhouse's main theme, composed as it plays: no screen and no browser (the tests run it in
// Node), just notes. It writes one piece at a time, a couple of minutes long, and hands its bars
// out one by one; player.js plays them.
//
// Each piece picks its own key, mode (plain major, dreamy lydian, wistful dorian...), speed, beat
// (4 or 3 to a bar) and instruments, then a form (an intro, a tune it comes back to, a middle bit,
// an ending), a chord progression for each part, and a little tune (a motif) that each phrase plays
// a new variation of. Phrases leave room: a phrase of rest now and then, a soft echo in the gap.
// When a piece ends there's a quiet moment, then the next piece starts in a nearby key.
//
// Kind to the ears (the owner has misophonia): no drums, no held pads or drones, every note dies
// away by itself (the longest a few seconds), nothing ticks along in a fast even stream, and the
// same few bars never come round again.

// the same numbers every time from a seed (the tests use seeds; the game uses the clock)
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
// pick from { thing: weight }
function pickW(r, weights) {
  const e = Object.entries(weights);
  let x = r() * e.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of e) if ((x -= w) < 0) return k;
  return e[e.length - 1][0];
}
const pick = (r, list) => list[Math.floor(r() * list.length)];
const between = (r, a, b) => a + r() * (b - a);

export const MODES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
};
const MODE_WEIGHTS = { major: 5, lydian: 2.5, dorian: 2.5, mixolydian: 1.5, aeolian: 1 };
// how a chord likes to move on (by scale degree, 0 the home chord); chords that sound sour in a
// mode (a diminished fifth) are never used
const NEXT = [
  { 3: 3, 5: 2, 1: 2, 4: 1, 2: 1 },
  { 4: 3, 3: 1.5, 0: 1, 6: 0.5 },
  { 5: 2, 3: 2, 1: 1 },
  { 0: 2, 4: 2, 1: 1.5, 2: 0.5, 5: 0.7 },
  { 0: 3, 5: 2, 3: 1, 1: 0.5 },
  { 1: 2, 3: 2, 4: 1.5, 2: 0.5 },
  { 0: 2, 2: 1, 5: 1 },
];
// the instruments (voices.js makes them) and how often each gets the tune or the chords
const TUNE_VOICES = { box: 3, flute: 2, marimba: 2, ep: 1.5, vibes: 1.5 };
const CHORD_VOICES = { ep: 3, harp: 2 };
// how each part of a piece is played: how full it sounds (0 to 1)
const LIFT = { intro: 0.6, A: 0.8, B: 0.95, outro: 0.62 };
const FORMS = [
  ['intro', 'A', 'A', 'B', 'A', 'outro'],
  ['intro', 'A', 'B', 'A', 'outro'],
  ['intro', 'A', 'A', 'outro'],
  ['intro', 'A', 'B', 'B', 'A', 'outro'],
  ['intro', 'A', 'B', 'outro'],
];
export const RANGE = { tune: [64, 86], chords: [50, 72], bass: [33, 48] };
export const LONGEST = 4.2;   // no note is let ring longer than this (s)

export function makeComposer(seed = Date.now()) {
  const r = rng(seed);
  let piece = null, key = Math.floor(r() * 12), mode = null, pieces = 0, gapNext = false;
  const composer = {
    pieces: () => pieces,
    // finish this piece now: the next bar starts a new one (after a long quiet)
    fresh() { if (piece) piece.at = piece.bars.length; gapNext = false; },
    now: () => piece && { key, mode: piece.mode, bpm: piece.bpm, beats: piece.beats, tune: piece.tune, chords: piece.chordVoice, bar: piece.at, of: piece.bars.length },
    // the next bar: { secs, notes: [{ at, len, midi, voice, vel }] } (at and len in seconds);
    // between pieces a bar of nothing (a quiet moment)
    next() {
      if (gapNext) { gapNext = false; return { secs: between(r, 5, 12), notes: [], gap: true }; }
      if (!piece || piece.at >= piece.bars.length) { piece = writePiece(); pieces++; }
      const bar = piece.bars[piece.at++];
      if (piece.at >= piece.bars.length) gapNext = true;
      return bar;
    },
  };

  // ---------- a piece ----------
  function writePiece() {
    // a nearby key (never the same key and mode twice running), and its mode
    if (pieces) key = (key + pick(r, [5, 7, 5, 7, 2, 10, 3, 9])) % 12;
    let m; do m = pickW(r, MODE_WEIGHTS); while (m === mode && r() < 0.7);
    mode = m;
    const scale = MODES[mode];
    const tonic = 55 + ((key - 7 + 12) % 12);           // G3 up to F#4: the chords' home note
    const beats = r() < 0.25 ? 3 : 4;
    const bpm = Math.round(between(r, 62, 80) * (beats === 3 ? 1.25 : 1));
    const spb = 60 / bpm;
    const perChord = r() < 0.55 ? 2 : 1;                 // bars each chord lasts
    const tuneVoice = pickW(r, TUNE_VOICES);
    const chordVoice = pickW(r, CHORD_VOICES);
    const accomp = chordVoice === 'harp' ? pick(r, ['arp', 'arp', 'roll']) : pick(r, ['roll', 'sparse', 'arp']);
    const arpOrder = pick(r, ['up', 'updown', 'hop']);
    const arpBeats = beats === 3 ? [0, 1, 2] : pick(r, [[0, 1, 2, 3], [0, 1.5, 2, 3], [0, 1, 2.5], [0, 1.5, 3]]);
    const bassy = r() < 0.8;
    const form = [...pick(r, FORMS)];
    // (a quick piece gets another turn of its tune, so each lasts a minute or more)
    const long = () => form.reduce((s, p) => s + (p === 'intro' ? 4 : p === 'outro' ? 4 : 8), 0) * beats * spb;
    while (long() < 70) form.splice(form.length - 1, 0, form[form.length - 2] === 'A' ? 'B' : 'A');

    // scale index -> midi note (index 0 is the tonic; 7 is an octave up)
    const note = i => tonic + 12 * Math.floor(i / 7) + scale[((i % 7) + 7) % 7];
    const sour = d => ((scale[(d + 4) % 7] + (d + 4 >= 7 ? 12 : 0)) - scale[d]) !== 7;   // (not a perfect fifth)
    const good = d => !sour(d);
    // a chord progression: `n` chords from `from`, leaning home at the end
    function progression(n, from, end) {
      const out = [from];
      while (out.length < n) {
        const w = { ...NEXT[out[out.length - 1]] };
        for (const d of Object.keys(w)) if (!good(+d)) delete w[d];
        if (out.length === n - 1 && end) for (const d of end) if (w[d] !== undefined) w[d] *= 4;
        out.push(Object.keys(w).length ? +pickW(r, w) : 0);
      }
      return out;
    }
    const cadence = [4, 3, 1, 6].filter(good);
    const chordsIn = bars => Math.max(1, Math.round(bars / perChord));
    const progs = {
      intro: [0, ...(r() < 0.5 ? [pick(r, [3, 5, 1].filter(good))] : [])],
      A: progression(chordsIn(8), 0, cadence),
      B: progression(chordsIn(8), pick(r, [3, 5, 1, 2].filter(good)), cadence),
      outro: [pick(r, [3, 1, 5].filter(good)), 0],
    };
    // two motifs: the tune, and the middle bit's
    const motifs = { A: motif(), B: motif() };

    const bars = [];
    let voicing = null, last = { tune: 7 + pick(r, [0, 2, 4]) };
    for (let s = 0; s < form.length; s++) {
      const part = form[s], prog = progs[part];
      const nBars = part === 'intro' ? prog.length * 2 : part === 'outro' ? 4 : 8;
      const lift = LIFT[part] * (part === 'A' && s === form.length - 2 ? 0.92 : 1);
      // which phrases (two bars each) have the tune, a variation, the answer, or rest
      const plan = part === 'intro' || part === 'outro' ? Array(nBars / 2).fill('rest')
        : pick(r, [['m', 'v', 'm', 'rest'], ['m', 'rest', 'v', 'a'], ['m', 'a', 'v', 'rest'], ['m', 'v', 'a', 'v'], ['rest', 'm', 'v', 'a']]);
      if (part === 'outro') plan[1] = 'end';   // (the last note, over the home chord)
      for (let b = 0; b < nBars; b++) {
        const deg = prog[Math.min(prog.length - 1, Math.floor(b / (part === 'intro' || part === 'outro' ? 2 : perChord)))];
        const fresh = b === 0 || deg !== prog[Math.min(prog.length - 1, Math.floor((b - 1) / (part === 'intro' || part === 'outro' ? 2 : perChord)))];
        const tones = chordTones(deg);
        if (fresh) voicing = voice(tones, voicing);
        const notes = [];
        const add = (atBeats, lenSecs, midi, voiceName, vel) => notes.push({
          at: Math.max(0, atBeats * spb + between(r, -0.012, 0.012)), len: Math.min(LONGEST, lenSecs), midi, voice: voiceName, vel: vel * between(r, 0.88, 1.08) });
        // the chords
        const final = part === 'outro' && b === nBars - 2;
        if (accomp === 'roll' || final) {
          if (fresh || final) voicing.forEach((m, i) => add(i * 0.07 * (final ? 2.2 : 1), (final ? 4.2 : perChord * beats * spb), m, chordVoice === 'harp' && !final ? 'harp' : 'ep', 0.34 * lift));
          else if (r() < 0.5) voicing.slice(-2).forEach((m, i) => add(beats / 2 + i * 0.07, beats / 2 * spb * 1.6, m, chordVoice, 0.2 * lift));
        } else if (accomp === 'sparse') {
          if (fresh) voicing.forEach((m, i) => add(i * 0.05, perChord * beats * spb, m, 'ep', 0.32 * lift));
          if (r() < 0.55) add(beats === 3 ? 2 : pick(r, [2, 2.5, 3]), 1.6 * spb, pick(r, voicing.slice(1)) + 12, 'ep', 0.16 * lift);
        } else if (!(part === 'outro' && b === nBars - 1)) {
          const order = arpOrder === 'up' ? voicing : arpOrder === 'updown' ? (b % 2 ? [...voicing].reverse() : voicing) : [voicing[0], voicing[2] ?? voicing[1], voicing[1], voicing[voicing.length - 1]];
          arpBeats.forEach((at, i) => { if (i && r() < 0.12) return; add(at, 1.8 * spb, order[i % order.length], chordVoice, (i ? 0.2 : 0.28) * lift * between(r, 0.8, 1.1)); });
        }
        // the bass: the chord's root when it changes (and now and then its fifth)
        if (bassy && part !== 'intro' || (part === 'intro' && b > 1 && bassy)) {
          const root = low(tones[0]);
          if (fresh) add(0, beats * spb * 1.2, root, 'bass', 0.42 * lift);
          else if (r() < 0.45) add(0, beats * spb, r() < 0.5 ? root : low(tones[2]), 'bass', 0.3 * lift);
          if (beats === 4 && r() < 0.25) add(pick(r, [2, 2.5, 3]), spb * 1.4, low(tones[2]), 'bass', 0.22 * lift);
        }
        // the tune, a phrase (two bars) at a time
        if (b % 2 === 0) {
          const kind = plan[b / 2];
          const chordAt = beat => {   // (the chord playing `beat` beats into the phrase)
            const bb = b + Math.floor(beat / beats);
            const d = prog[Math.min(prog.length - 1, Math.floor(Math.min(bb, nBars - 1) / (part === 'intro' || part === 'outro' ? 2 : perChord)))];
            return chordTones(d);
          };
          const phrase = kind === 'rest' ? [] : kind === 'end' ? [{ at: 0.5, dur: beats * 2 - 0.5, i: 7 }]
            : realise(motifs[part === 'B' ? 'B' : 'A'], kind, chordAt);
          // (a rest after a phrase: now and then its last two notes echo softly, up high, on the chords)
          if (kind === 'rest' && last.echo && r() < 0.5) last.echo.forEach((i, k) => add(1 + k * 0.75, 1.6 * spb, clampTune(note(i + 7)), chordVoice === 'harp' ? 'harp' : 'ep', 0.14 * lift));
          last.echo = kind === 'rest' || kind === 'end' ? null : phrase.slice(-2).map(p => p.i);
          const tv = kind === 'end' ? (tuneVoice === 'flute' ? 'box' : tuneVoice) : tuneVoice;
          for (const p of phrase) {
            const beatInBar = p.at, inBar = beatInBar >= beats ? 1 : 0;
            const len = Math.min(tv === 'flute' ? 1.7 : 3, p.dur * spb * 0.95);
            (inBar ? (bars.pending ||= []) : notes).push({ at: (beatInBar - inBar * beats) * spb + between(r, -0.01, 0.01), len, midi: clampTune(note(p.i)), voice: tv, vel: (0.4 + 0.12 * (p.at === 0)) * lift * between(r, 0.85, 1.1) });
          }
        } else if (bars.pending) { notes.push(...bars.pending); bars.pending = null; }
        const endBar = part === 'outro' && b === nBars - 1;
        bars.push({ secs: beats * spb * (endBar ? 1.5 : 1), notes: notes.sort((a, c) => a.at - c.at) });
      }
    }
    delete bars.pending;
    return { bars, at: 0, mode, bpm, beats, tune: tuneVoice, chordVoice };

    // ----- the helpers, for this piece -----
    function chordTones(d) {   // midi-ish notes of the chord on degree d: root, 3rd, 5th, 7th (and 9th)
      return [0, 2, 4, 6, 8].map(k => note(d + k));
    }
    function low(m) { while (m > RANGE.bass[1]) m -= 12; while (m < RANGE.bass[0]) m += 12; return m; }
    function clampTune(m) { while (m > RANGE.tune[1]) m -= 12; while (m < RANGE.tune[0]) m += 12; return m; }
    // a voicing of the chord (three or four notes) close to the last one, so the chords glide
    function voice(tones, prev) {
      const pcs = [tones[1], tones[2], tones[3], r() < 0.4 ? tones[4] : tones[0]].map(m => ((m % 12) + 12) % 12);
      const use = r() < 0.35 ? pcs.slice(0, 3) : pcs;
      let best = null, cost = 1e9;
      for (let base = RANGE.chords[0]; base < RANGE.chords[0] + 12; base++) {
        // stack the notes upward from base
        const v = []; let at = base;
        for (const pc of [...use].sort((a, b) => ((a - base % 12 + 12) % 12) - ((b - base % 12 + 12) % 12))) {
          let m = at; while (((m % 12) + 12) % 12 !== pc) m++; v.push(m); at = m + 1;
        }
        if (v[v.length - 1] > RANGE.chords[1]) continue;
        const c = prev ? v.reduce((s, m, i) => s + Math.abs(m - (prev[Math.min(i, prev.length - 1)])), 0) : Math.abs(v[0] - 57);
        if (c < cost) { cost = c; best = v; }
      }
      return best || use.map(pc => 60 + pc).sort((a, b) => a - b);
    }
    // a motif: a little rhythm (in beats, over two bars) and the steps between its notes
    function motif() {
      const span = beats * 2, out = [];
      let t = pick(r, [0, 0, 0.5, 1]), n = 3 + Math.floor(r() * 4);
      while ((out.length < n || t < span * 0.45) && t < span * 0.72) {
        const dur = +pickW(r, { 0.5: 2, 1: 4, 1.5: 2, 2: 1.5 });
        out.push({ at: t, dur, step: out.length ? +pickW(r, { '-2': 1.5, '-1': 3, 1: 3, 2: 1.5, 0: 0.6, 3: 0.7, '-3': 0.5, 4: 0.3 }) : 0 });
        t += dur;
      }
      // the last note is held (to the end of the phrase, less a breath)
      const lastN = out[out.length - 1]; lastN.dur = Math.max(lastN.dur, span - lastN.at - pick(r, [0.5, 1, 1]));
      return out;
    }
    // play a motif over the phrase's chords: 'm' as it is, 'v' varied, 'a' the answer (its steps
    // turned upside down); notes on the strong beats land on a note of the chord
    function realise(mo, kind, chordAt) {
      const out = [];
      let i = last.tune;
      for (let k = 0; k < mo.length; k++) {
        let { at, dur, step } = mo[k];
        if (kind === 'a') step = -step;
        if (kind === 'v' && k && r() < 0.35) step += pick(r, [-1, 1]);
        if (kind === 'v' && k && k < mo.length - 1 && r() < 0.15) continue;   // (a note left out)
        i += step;
        if (i > 13) i -= Math.abs(step) * 2; if (i < 2) i += Math.abs(step) * 2;
        const strong = at % (beats === 3 ? 3 : 2) === 0 || k === mo.length - 1;
        if (strong || k === 0) i = nearestChordTone(i, chordAt(at));
        out.push({ at, dur, i });
        // (a variation now and then adds a passing note on the way to the next one)
        if (kind === 'v' && k < mo.length - 1 && dur >= 1 && r() < 0.25) {
          out[out.length - 1].dur = dur / 2;
          out.push({ at: at + dur / 2, dur: dur / 2, i: i + Math.sign(mo[k + 1].step || 1) });
        }
      }
      if (out.length) last.tune = out[out.length - 1].i;
      return out;
    }
    function nearestChordTone(i, tones) {
      const pcs = tones.slice(0, 4).map(m => ((m % 12) + 12) % 12);
      for (let d = 0; d < 4; d++) for (const s of [0, -d, d]) if (pcs.includes(((note(i + s) % 12) + 12) % 12)) return i + s;
      return i;
    }
  }
  return composer;
}
