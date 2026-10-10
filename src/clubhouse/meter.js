// The speed readout behind the pause menu's SPEED button (docs/clubhouse/world/speed-readout.md): how fast
// the game is running on this device, so someone can open it on a phone and read it out. It only
// writes down numbers (a frame's length, how long the game's own work took, which place you were in),
// so a headless check can run it; showing them is the clubhouse's job.
//
// A frame's length is the time since the one before it, drawing and waiting included: what you feel.
// Frames over 2 seconds long (the page was in the background) and frames with the pause menu up are
// not written down. Claude's numbers: the last 120 frames are "right now", a place needs 30 frames
// before it can be called the slowest, and "slow" is a frame over 33 ms (under 30 a second).
export const NOW = 120, MIN_FRAMES = 30, SLOW_MS = 33, GAP_MS = 2000;

export function makeMeter() {
  let recent = [], places = new Map(), all = { n: 0, sum: 0, slow: 0, worst: 0 }, peaks = {};
  const stat = () => ({ n: 0, sum: 0, work: 0, slow: 0, worst: 0 });
  return {
    // one frame: the place you were in, its length (ms) and how long the game's own work took (ms)
    frame(place, ms, work) {
      if (!(ms > 0) || ms > GAP_MS) return;
      recent.push(ms); if (recent.length > NOW) recent.shift();
      let s = places.get(place); if (!s) places.set(place, s = stat());
      s.n++; s.sum += ms; s.work += work || 0; s.worst = Math.max(s.worst, ms); if (ms > SLOW_MS) s.slow++;
      all.n++; all.sum += ms; all.worst = Math.max(all.worst, ms); if (ms > SLOW_MS) all.slow++;
    },
    // the highest a number has been (the page's memory, now and then)
    note(what, value) { peaks[what] = Math.max(peaks[what] || 0, value); },
    peak: what => peaks[what] || 0,
    clear() { recent = []; places = new Map(); all = { n: 0, sum: 0, slow: 0, worst: 0 }; peaks = {}; },
    // the readout as lines of words (extra: what the page knows, like the graphics card's numbers)
    report(here, extra = []) {
      const fps = (n, sum) => Math.round(1000 * n / sum);
      const lines = [];
      if (!all.n) return ['NOTHING YET: WALK ABOUT FOR A FEW SECONDS, THEN OPEN THIS AGAIN.', ...extra];
      const now = recent.reduce((a, b) => a + b, 0), worstNow = Math.max(...recent);
      lines.push(`RIGHT NOW: ${fps(recent.length, now)} FRAMES A SECOND, SLOWEST ${Math.round(worstNow)} MS`);
      const h = places.get(here);
      if (h) lines.push(`HERE (${label(here)}): ${fps(h.n, h.sum)} A SECOND ON AVERAGE, ${Math.round(100 * h.slow / h.n)}% OF FRAMES SLOW, ITS OWN WORK ${(h.work / h.n).toFixed(1)} MS A FRAME`);
      const slowest = [...places].filter(([, s]) => s.n >= MIN_FRAMES).sort((a, b) => fps(a[1].n, a[1].sum) - fps(b[1].n, b[1].sum))[0];
      if (slowest && slowest[0] !== here) lines.push(`SLOWEST PLACE: ${label(slowest[0])}, ${fps(slowest[1].n, slowest[1].sum)} A SECOND, WORST FRAME ${Math.round(slowest[1].worst)} MS`);
      lines.push(`ALL TOGETHER: ${fps(all.n, all.sum)} A SECOND OVER ${all.n} FRAMES, ${Math.round(100 * all.slow / all.n)}% SLOW, WORST ${Math.round(all.worst)} MS`);
      return [...lines, ...extra];
    },
  };
}

// a place's name in words ("room:cats-only" is CATS ONLY)
const label = name => String(name).replace(/^room:/, '').replace(/-/g, ' ').toUpperCase();
