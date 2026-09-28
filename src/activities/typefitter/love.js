// Sadie's TEXT LOVE meter, and the box that never fits. No DOM here, so the tests run it in Node.
//
// It looks like Sadie has opinions: the meter goes up and down after each change to the text. It's a
// dice roll, rigged: each round secretly picks how many changes it takes (FEWEST to MOST), wobbles
// along the way, and fills exactly on that change. It never needs more than MOST, so the player
// always gets there, and nobody has to keep track of what they've already tried.
export const FEWEST = 4, MOST = 10, HEARTS = 10;

export function makeMeter(random = Math.random) {
  const m = {
    love: 0, goal: 0, changes: 0,
    get full() { return m.love >= HEARTS; },
    reset() { m.love = 0; m.changes = 0; m.goal = FEWEST + Math.floor(random() * (MOST - FEWEST + 1)); },
    // one change to the text: returns whether the meter went up (or stayed)
    change() {
      if (m.full) return true;
      m.changes++;
      const before = m.love;
      if (m.changes >= m.goal) m.love = HEARTS;
      else {
        let v = Math.round((m.changes / m.goal) * HEARTS + (random() * 4.3 - 2.5));
        if (random() < .22) v = before - Math.ceil(1 + random() * 2); // she changed her mind
        m.love = Math.max(0, Math.min(HEARTS - 1, v));
      }
      return m.love >= before;
    },
  };
  m.reset();
  return m;
}

// The box for text of this size: always a bit too small, and closer the more Sadie loves it.
// Never closer than 5 px too wide and 3 px too tall.
export function boxFor(w, h, love) {
  const v = Math.max(0, Math.min(1, love / HEARTS));
  return { w: Math.max(0, Math.min(w * (0.74 + 0.22 * v), w - 5)), h: Math.max(0, Math.min(h * (0.8 + 0.16 * v), h - 3)) };
}

// How well it fitted, as the program announces it: always over 100%, so always a win.
export const FIT_SCORES = [104, 107, 112, 118, 121, 133, 150];
