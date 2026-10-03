// The ocean in numbers, with no screen (the tests read it): where the six spots are, the reef round
// the mountain, where you can sail, how big the mountain looks from where you are, and what's saved.
// The approved map: https://claude.ai/artifact/TBpQYmZUAqKcFqyk3gRfk3
//
// Sea coordinates are metres, with the mountain in the middle at (0, 0), north at -z (the clubhouse's
// yaw 0 faces -z too). The sea is a disc SEA_R across; its surface is sea height 0.

export const SEA_R = 260;          // how far out you can sail (past it, the boat slides along the edge)
export const BOAT = 16;            // how fast the boat sails, in metres a second
export const REEF_R = 30;          // the reef round the mountain, and how close it keeps you while it's closed
export const DECK = -0.5;          // where you sit, below the surface (your eye is EYE above it)

// the six spots, and the find at each: `r` how close the boat can get to the middle, `reach` how near
// you have to be to pick the find up, `label` its name in the OCEAN FINDS cabinet
export const SPOTS = [
  { id: 'mountain', label: 'MOUNTAIN', name: 'THE MOUNTAIN', x: 0, z: 0, r: 2.6, reach: 8 },
  { id: 'bottle', label: 'BOTTLE', name: 'THE BOTTLE', x: -139, z: -91, r: 0, reach: 9 },
  { id: 'hat', label: 'HAT', name: "THE CAPTAIN'S HAT", x: 139, z: -115, r: 8, reach: 15 },
  { id: 'duck', label: 'DUCK', name: 'THE RUBBER DUCK', x: 144, z: 101, r: 9.5, reach: 17 },
  { id: 'floppy', label: 'FLOPPY', name: 'THE FLOPPY DISK', x: -154, z: 106, r: 12, reach: 19 },
  { id: 'coconut', label: 'COCONUT', name: 'THE COCONUT', x: -72, z: -173, r: 11, reach: 18 },
];
export const OTHERS = SPOTS.filter(s => s.id !== 'mountain').map(s => s.id);

// where you come up the first time: south of the mountain, facing it
export const START = { x: 19, z: 197, yaw: Math.atan2(19, 197) };

// the reef stays shut until you've found the five other things
export const reefOpen = found => OTHERS.every(id => found.includes(id));

// Can the boat be here? Inside the sea, outside every spot's solid middle, and (while the reef is
// closed) outside the reef.
export function sailable(x, z, found) {
  if (Math.hypot(x, z) > SEA_R) return false;
  if (!reefOpen(found) && Math.hypot(x, z) < REEF_R + 2) return false;
  return SPOTS.every(s => !s.r || Math.hypot(x - s.x, z - s.z) > s.r);
}

// The spot whose find you can pick up from here, if any (not found yet; the mountain only once the
// reef is open).
export function findHere(x, z, found) {
  return SPOTS.find(s => !found.includes(s.id) && (s.id !== 'mountain' || reefOpen(found)) && Math.hypot(x - s.x, z - s.z) < s.reach) || null;
}

// The looming mountain. It's really tiny (MT metres tall), but it's drawn scaled up in step with how
// far away it is, so it looks the same size (LOOK: its height over its distance) from anywhere in
// the sea. Over the last stretch (from FADE_FAR in to FADE_NEAR metres) the scaling fades away, so
// it shrinks down to its real size as you arrive. This is the only thing in the sea that does it.
export const MT = 1.3, LOOK = 0.36, FADE_FAR = 28, FADE_NEAR = 5;
export function loom(d) {
  const k = Math.min(1, Math.max(0, (d - FADE_NEAR) / (FADE_FAR - FADE_NEAR))), e = k * k * (3 - 2 * k);
  return Math.max(1, 1 + (LOOK * d / MT - 1) * e);
}

// What's saved (in the browser): which finds you have, and where you left the boat.
export const SAVE = 'ocean';
export function readSave(v) {
  const found = Array.isArray(v?.found) ? SPOTS.map(s => s.id).filter(id => v.found.includes(id)) : [];
  const b = v?.boat, ok = b && [b.x, b.z, b.yaw].every(Number.isFinite) && Math.hypot(b.x, b.z) <= SEA_R;
  return { found, boat: ok ? { x: b.x, z: b.z, yaw: b.yaw } : { ...START } };
}
