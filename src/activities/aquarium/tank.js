// The aquarium's tank in numbers, with no screen (the tests read it): the room and the tank's size,
// the fish and their lanes, Sadie's lazy loop, and the dive you take when you tap the glass.
// Everything is in metres; the tank stands against the back wall (+z), its glass facing the door.

export const RW = 5, RD = 6, RH = 4.2;                  // the room: half its width and depth, its height
export const TW = 3.6, T0 = 0.8, T1 = 3.2;              // the tank: half its width, its bottom and top
export const GZ = 4.2, BZ = 5.9;                         // the glass, and the tank's back
export const WATER = 3.02;                               // the water's surface

// the fish: which picture, how big (metres per 16 pixels), their lane's height and depth, and speed
export const FISH = [
  ['gold', 0.42, 2.2, 4.9, 0.7], ['gold', 0.36, 1.5, 5.4, 0.55], ['tang', 0.44, 2.6, 5.2, 0.8], ['angel', 0.36, 1.8, 4.7, 0.45],
  ['puffer', 0.34, 1.3, 5.0, 0.3], ['pink', 0.4, 2.45, 5.6, 0.6], ['silver', 0.3, 2.8, 4.6, 1.0], ['silver', 0.3, 2.72, 4.66, 1.0], ['tang', 0.38, 1.1, 5.7, 0.65],
];

// Sadie: a slow, lazy loop round the tank, t seconds in
export function sadieAt(t) {
  const s = t * 0.16;
  return { x: Math.sin(s) * 2.3, y: 1.95 + Math.sin(s * 2.1) * 0.35 + Math.sin(t * 1.3) * 0.04, z: 5.1 + Math.cos(s) * 0.35 };
}

// The dive, when you tap the glass: a wait while the fish scatter, then your view rises past the
// rim, leans over the water looking down, and sinks straight down to just above the sand. There,
// looking at nothing but the sand and what's on it, the room is swapped for the ocean, which has an
// exact copy of the tank's floor right under you (`swap`: nothing on the screen changes). Then you
// rise up through the open sea, turning to face the way the boat faces, break the surface, look up,
// and you're in the boat. Each step is where to glide to ({x, z, eye, yaw, pitch}: eye is how far
// your eye is above where it'd be standing on the floor, y where you stand once there) and how long
// it takes. `from` is where you stood, EYE how high your eye is standing, `surface` the sea's surface
// and `deck` where you sit in the boat (heights in the room's terms), `yaw` the way the boat faces.
export const LOW = T0 + 0.25;   // how high your eye is over the sand when the swap happens
export const diveX = from => Math.max(-TW + 0.6, Math.min(TW - 0.6, from.x));
export const DIVE_Z = (GZ + BZ) / 2 - 0.25;
export function dive(from, EYE, { surface, deck, yaw }) {
  const x = diveX(from), z = DIVE_Z, over = T1 + 0.75 - EYE, low = LOW - EYE;
  return [
    { to: { ...from }, secs: 0.9 },                                                    // the fish scatter, Sadie glares
    { to: { x: from.x, z: from.z, eye: over, yaw: Math.PI, pitch: 0.05 }, secs: 1.1 },   // up past the rim
    { to: { x, z, eye: over, yaw: Math.PI, pitch: -1.35 }, secs: 1.4 },                   // over the water, looking down
    { to: { x, z, eye: low, yaw: Math.PI, pitch: -1.5 }, secs: 1.3, swap: 'sea' },        // down to the sand: swap
    { to: { x, z, eye: surface - 0.6 - EYE, yaw, pitch: -1.1 }, secs: 1.8 },              // up through the sea, turning
    { to: { x, z, eye: deck, yaw, pitch: 0.04, y: deck }, secs: 1.2 },                    // through the surface, look up
  ];
}

// Going home (BACK TO AQUARIUM, in the boat): the same the other way. You look down and sink to just
// over the seabed, where the copy of the tank's floor has been put right under the boat (`at`: where
// the boat is, in the room's terms, the copy moved to be under it); in one frame you're moved back to
// the tank (`swap`: the room, whose floor is the same, just where you are), and you rise out over the
// rim and back down to where you stood when you tapped the glass.
export function surfaceHome(at, from, EYE) {
  const x = diveX(from), z = DIVE_Z, over = T1 + 0.75 - EYE, low = LOW - EYE;
  return [
    { to: { x: at.x, z: at.z, eye: at.eye, yaw: at.yaw, pitch: -1.2 }, secs: 0.8 },      // look down into the water
    { to: { x: at.x, z: at.z, eye: low, yaw: at.yaw, pitch: -1.5 }, secs: 2.2 },          // sink to the seabed
    { to: { x, z, eye: low, yaw: at.yaw, pitch: -1.5 }, secs: 0.001, swap: 'room' },      // (in one frame: back in the tank)
    { to: { x, z, eye: WATER - 0.28 - EYE, yaw: Math.PI, pitch: -1.1 }, secs: 1.3 },      // up through the tank
    { to: { x, z, eye: over, yaw: Math.PI, pitch: -0.6 }, secs: 0.8 },                   // out of the water
    { to: { x: from.x, z: from.z, eye: over, yaw: from.yaw, pitch: -0.3 }, secs: 1.0 },  // back over the rim
    { to: { ...from, y: 0 }, secs: 0.8 },                                                // and down where you stood
  ];
}

// the six spots in the OCEAN FINDS cabinet, one for each find in the ocean (chart.js)
export { SPOTS as FINDS } from './chart.js';
