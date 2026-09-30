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
// rim, leans over the water looking down, dips in and looks up, and (the ocean isn't built yet) a
// COMING SOON sign floats there in the water for a moment before you come back out to where you
// stood. Each step is where to glide to ({x, z, eye, yaw, pitch}: eye is how far your eye is above
// where it'd be standing on the floor) and how long it takes. `from` is where you stood; EYE is how
// high your eye is standing.
export function dive(from, EYE) {
  const x = Math.max(-TW + 0.6, Math.min(TW - 0.6, from.x));
  const over = T1 + 0.75 - EYE, under = WATER - 0.28 - EYE, inTank = (GZ + BZ) / 2 - 0.25;
  return [
    { to: { ...from }, secs: 0.9 },                                                    // the fish scatter, Sadie glares
    { to: { x: from.x, z: from.z, eye: over, yaw: Math.PI, pitch: 0.05 }, secs: 1.1 },   // up past the rim
    { to: { x, z: inTank, eye: over, yaw: Math.PI, pitch: -1.35 }, secs: 1.4 },           // over the water, looking down
    { to: { x, z: inTank, eye: under, yaw: Math.PI, pitch: 0 }, secs: 1.0, sign: true },   // in, looking up: COMING SOON
    { to: { x, z: inTank, eye: under, yaw: Math.PI, pitch: 0 }, secs: 1.8, sign: true },   // (a moment to read it)
    { to: { x, z: inTank, eye: over, yaw: Math.PI, pitch: -0.6 }, secs: 0.8 },            // back out of the water
    { to: { x: from.x, z: from.z, eye: over, yaw: from.yaw, pitch: -0.3 }, secs: 1.0 },  // back over the rim
    { to: { ...from }, secs: 0.8 },                                                    // and down where you stood
  ];
}

// the six spots in the OCEAN FINDS cabinet (for the things you'll bring back from the ocean)
export const FINDS = ['SHELL', 'BOTTLE', 'ANCHOR', 'PEARL', 'STARFISH', 'COIN'];
