// What a room is lent of the places next door: never the whole hall or the whole outside, only what
// docs/clubhouse/rooms/kit.md and docs/clubhouse/outside/plots.md say it may use. Each is a narrow view of the real place, and reading
// anything else from it (or from the kit) is an error straight away, so a room can't come to lean on
// something nobody promised it (the checks play every room, and any page error fails them).
//
// Something a room puts into a place (`add`, `face`, `use`) hands back how to take it out again.

// a view that fails loudly on anything it doesn't have (bar the few names JavaScript itself asks
// about: `then` when it's awaited, and the like)
const QUIET = new Set(['then', 'toJSON', 'constructor', 'asymmetricMatch', 'nodeType', '$$typeof']);
export function strict(what, o) {
  return new Proxy(Object.freeze(o), {
    get(t, k) {
      if (k in t || typeof k === 'symbol' || QUIET.has(k)) return t[k];
      throw new Error(`a room asked for ${what}.${k}, which it isn't lent (docs/clubhouse/rooms/kit.md and docs/clubhouse/outside/plots.md list what is)`);
    },
  });
}

// the real place behind a view (for the clubhouse's own use: snapshot)
const behind = new WeakMap();
export const realPlace = p => behind.get(p) || p;

const takeOut = (list, xs) => () => { for (const x of xs) { const i = list.indexOf(x); if (i >= 0) list.splice(i, 1); } };
function lend(place, what, more) {
  const v = strict(what, {
    is: p => p === place || p === v,   // (is this, say `ears().place`, that place?)
    add(...objs) { place.scene.add(...objs); return () => place.scene.remove(...objs); },
    face(...objs) { place.faces.push(...objs); return takeOut(place.faces, objs); },   // things that turn to face you
    use(...uses) { place.uses.push(...uses); return takeOut(place.uses, uses); },     // things to use there
    ...more,
  });
  behind.set(v, place);
  return v;
}

// The hall: its solid `shape` (for something bouncing round it), and Sadie asleep in her box, lent
// out (`borrowSadie()` hands back how to give her back): she's out of her box while anyone has her.
export function hallView(hall, outside) {
  let out = 0, holders = 0;
  const fd = hall.doors.front, od = outside.doors.front;
  const there = d => ({ x: d.pos.x, y: d.pos.y, z: d.pos.z, yaw: d.yaw });
  return lend(hall, 'hall', {
    shape: hall.shape,
    // The front door, for something running out through it (the Cats Only herd): where it is on
    // each side (`in`, `out`), how far open it is (`open()`, 0 to 1), `hold()` to keep it open (hands
    // back how to let go), and `outside`: the garden beyond it, to put things into.
    front: strict('hall.front', {
      in: there(fd), out: there(od), open: () => fd.amount,
      hold() { holders++; hall.holding = fd; let given = false; return () => { if (given) return; given = true; if (--holders === 0) hall.holding = null; }; },
      outside: lend(outside, 'garden', {}),
    }),
    borrowSadie() {
      out++; hall.napping.visible = false;
      let given = false;
      return () => { if (given) return; given = true; if (--out === 0) hall.napping.visible = true; };
    },
    sadieBorrowed: () => out > 0,
  });
}

// The outside, for a building on it: what's solid there and what to walk on (`block`, `blockRound`,
// `surface`), and the clubhouse's own house (`house`: for a picture of it).
export function outsideView(outside) {
  return lend(outside, 'outside', {
    block: outside.block, blockRound: outside.blockRound, surface: outside.surface, house: outside.house,
  });
}

// A room's door on the landing: where it is and which way it faces (`normal`, `yaw`), how far open it
// is (`open()`, 0 to 1), and `paint(texture)` for a new picture on its front (nothing, for its own back).
export function doorView(d) {
  return d ? strict('landingDoor', { pos: d.pos, normal: d.normal, yaw: d.yaw, open: () => d.amount, paint: t => d.paint(t) }) : null;
}
