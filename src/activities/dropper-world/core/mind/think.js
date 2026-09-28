// Choosing what to do. Each character has a set of activities (eat, fetch the barn, play,
// zoomies...). Every tick each activity says how much the character wants to do it right now,
// from their feelings and what's on offer; the one they want most wins. What they're already
// doing gets a small bonus so they don't flip-flop, and an activity can say it's busy (you don't
// let go of the barn rope halfway up, or leave the barn mid-nap) so nothing else can take over.
//
// An activity is { want(c), step(c, dt), start?(c), stop?(c), busy?(c) }. step() returns
// whatever the character's movement returned ('moving', 'there', 'blocked'). An activity that's
// finished calls done(c); the character picks something new next tick.
const STICK = 0.1;

export function think(c, activities, dt) {
  const cur = activities[c.doing];
  if (!(cur && cur.busy && cur.busy(c))) {
    let best = null, bestWant = 0;
    for (const name in activities) {
      const w = activities[name].want(c) + (name === c.doing ? STICK : 0);
      if (w > bestWant) { bestWant = w; best = name; }
    }
    if (best !== c.doing) switchTo(c, activities, best);
  }
  const a = activities[c.doing];
  return a ? a.step(c, dt) : 'there';
}
// Start something right now, whatever they'd rather do (the dev sheet's buttons).
export function switchTo(c, activities, name) {
  const prev = activities[c.doing];
  if (prev && prev.stop) prev.stop(c);
  c.doing = name;
  const a = activities[name];
  if (a && a.start) a.start(c);
}
export function done(c) { c.doing = null; }
