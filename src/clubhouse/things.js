// Things that build themselves by distance (docs/clubhouse/outside/things.md). A thing is a place and a size in
// the world (the pool, a stretch of road, a field) plus one function, `show(state)`. This file only
// decides which of three states each thing is in, from how far you are, and says so; what each
// state looks like (built and running, a cheap stand-in, nothing) is the thing's own business. It
// draws nothing and touches no page, so a headless check can run it.
//
//   near:  built and running
//   far:   far but still in view: a cheap stand-in, nothing running
//   gone:  too far to see: nothing in the scene
//
// Distance is straight metres from where you are to the thing's edge (its middle less its size), never
// to its middle. A thing builds at `near` metres and is only let go past `leave`, and only after
// `grace` seconds of staying out there, so standing on the edge never makes it flicker. Likewise
// it stays a stand-in until it's past `seen` + `gap`. A thing that says it's `busy()` is never let go.
// Only one thing builds at a time (the nearest first), a thing that fails to build is tried again a
// little later, a few times (as rooms are: clubhouse.js), and what's solid is not this file's
// business: a thing keeps its solids on whatever state it is in.

// Claude's numbers (changeable, and a thing can name its own): metres, and seconds
export const RANGE = { near: 60, gap: 15, seen: 250, grace: 5, tries: 6 };

export function makeThings(over = {}) {
  const base = { ...RANGE, ...over };
  const all = [];
  let scale = 1;   // (the checks and the test page can pull every range in, or push it out)

  const range = t => {
    const near = (t.near ?? base.near) * scale, gap = t.gap ?? base.gap, seen = (t.seen ?? base.seen) * scale;
    return { near, leave: near + gap, seen, gone: seen + gap, grace: t.grace ?? base.grace };
  };
  const edge = (t, from) => Math.max(0, Math.hypot(from.x - t.x, from.z - t.z) - (t.r || 0));
  const say = (t, state) => {
    try { return t.show(state); } catch (e) { console.warn(`${t.id} failed to go ${state}:`, e); }
  };

  // move to a state that's quick to reach (a stand-in, or nothing)
  function settle(t, state) {
    if (t.state === state) return;
    t.state = state;
    say(t, state);
  }

  // what a thing at distance `d` would be if it were not near, keeping its state across the gap
  function outer(t, d, r) {
    if (t.state === 'far') return d > r.gone ? 'gone' : 'far';
    return d <= r.seen ? 'far' : 'gone';
  }

  function build(t) {
    t.building = Promise.resolve()
      .then(() => t.show('near'))
      .then(() => { t.state = 'near'; t.away = 0; t.tries = 0; },
        e => { console.warn(`${t.id} wouldn't build:`, e); t.tries = (t.tries || 0) + 1; t.failed = now; })
      .finally(() => { t.building = null; });
  }

  let now = 0;
  return {
    // add a thing: { id, x, z, r, show(state), busy?(), near?, gap?, seen?, grace?, watched? }. It starts nowhere
    // (state null): the next `step` says where it is.
    add(t) { const thing = { ...t, state: null, away: 0, tries: 0, building: null, failed: -1e9 }; all.push(thing); return thing; },
    // turn the distance watching of one thing on or off (a thing can start unwatched: `watched: false`)
    watch(id, on) { const t = all.find(t => t.id === id); if (t) t.watched = on; },
    remove(id) { const i = all.findIndex(t => t.id === id); if (i >= 0) all.splice(i, 1); },
    // every frame: `from` is where outside is seen from ({ x, z }), or null if it can't be seen (nothing changes then)
    step(dt, from) {
      now += dt;
      if (!from) return;
      let next = null, best = 1e9;
      for (const t of all) {
        if (t.building) continue;
        if (t.watched === false && t.state) continue;   // (not watched: built once at the start, then left alone)
        const r = range(t), d = edge(t, from);
        if (t.state === 'near') {
          t.away = d > r.leave && !t.busy?.() ? t.away + dt : 0;
          if (t.away > r.grace) { t.away = 0; settle(t, outer(t, d, r)); }
          continue;
        }
        if (d <= r.near) {
          if (t.tries < base.tries && now - t.failed > 3 * (t.tries + 1) && d < best) { best = d; next = t; }
        } else settle(t, outer(t, d, r));
      }
      if (next && !all.some(t => t.building)) build(next);
    },
    states: () => Object.fromEntries(all.map(t => [t.id, t.state])),
    // every range pulled in (below 1) or pushed out (above)
    setScale(k) { scale = k; },
    get scale() { return scale; },
    // is anything still building (the checks wait on it)
    busy: () => all.some(t => t.building),
  };
}
