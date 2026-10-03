// The TAPE-O-MATIC, with no screen (the tests run it). Two tapes: yours, and SADIE LIVE! (her last
// walk across an instrument, which it keeps by itself). REC records what you play onto yours (up to
// a minute), PLAY plays the tape in it back once, LOOP plays it over and over until STOP (or until
// you leave the room: nothing here plays on its own for ever), and TAPE swaps the tapes over.
// A note is { inst, key, loud } (plus the synth's voice); what it saves is just the two tapes.

export const LONGEST = 60, MOST = 400, GAP = 1.2;   // a tape holds a minute (400 notes); a loop waits a moment before going round

export function makeTape(saved) {
  const ok = a => Array.isArray(a) ? a.filter(n => n && typeof n.at === 'number').slice(0, MOST) : [];
  return { mine: ok(saved?.mine), sadie: ok(saved?.sadie), which: saved?.which === 'sadie' ? 'sadie' : 'mine', state: 'idle', t0: 0, i: 0 };
}
export const saveTape = T => ({ mine: T.mine, sadie: T.sadie, which: T.which });
export const tapeIn = T => T[T.which];

// a recording's done: the quiet before its first note is cut off, so it starts playing straight away
function done(T) {
  T.fresh = false;
  const first = T.mine[0]?.at ?? 0;
  if (first > 0.3) T.mine = T.mine.map(n => ({ ...n, at: Math.round((n.at - first + 0.3) * 1000) / 1000 }));
  T.state = 'idle';
}

// the buttons (now: seconds)
export function press(T, button, now) {
  if (T.state === 'rec' && button !== 'rec') done(T);
  if (button === 'rec') { T.which = 'mine'; T.fresh = true; T.state = 'rec'; T.t0 = now; }   // (your old take goes only when you play the first new note: REC then STOP keeps it)
  else if (button === 'play' || button === 'loop') { if (tapeIn(T).length) { T.state = button; T.t0 = now; T.i = 0; } else T.state = 'idle'; }
  else if (button === 'stop') T.state = 'idle';
  else if (button === 'tape') { T.which = T.which === 'mine' ? 'sadie' : 'mine'; T.state = 'idle'; }
}

// a note you just played: onto your tape, if it's recording
export function heard(T, note, now) {
  if (T.state !== 'rec') return;
  if (T.fresh) { T.mine = []; T.fresh = false; }
  const at = now - T.t0;
  if (at > LONGEST || T.mine.length >= MOST) { done(T); return; }
  T.mine.push({ ...note, at: Math.round(at * 1000) / 1000 });
}

// Sadie's walk, kept on her tape (notes with their times from when she started)
export function sadieTake(T, notes) { if (notes.length) T.sadie = notes.slice(0, MOST); }

// what's due to play by now, from the tape
export function stepTape(T, now) {
  const out = [];
  if (T.state === 'rec' && now - T.t0 > LONGEST) done(T);
  if (T.state !== 'play' && T.state !== 'loop') return out;
  const tape = tapeIn(T), at = now - T.t0;
  while (T.i < tape.length && tape[T.i].at <= at) out.push(tape[T.i++]);
  if (T.i >= tape.length) {
    const end = (tape[tape.length - 1]?.at ?? 0) + GAP;
    if (T.state === 'play') T.state = 'idle';
    else if (at > end) { T.t0 = now; T.i = 0; }
  }
  return out;
}
