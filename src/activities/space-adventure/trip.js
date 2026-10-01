// The trip in numbers, with no screen (the tests read it): when everything happens, what Sadie says
// and when, how big the planet looks, the way down through the clouds to the beach, and where Sadie
// is. Times are seconds since you sat down in the pilot's seat; distances are metres.
//
// The cockpit is the room: its door at the back (z = -RD), the windscreen at the front (+z), you in
// the pilot's seat looking straight out of it. Out there is space (stars, and the planet dead ahead,
// which grows as you get nearer), and then the planet's land, which is its own model (`land.js`) that
// the room moves round the cockpit (the ship never moves: the world does).

export const RW = 2.5, RD = 3.2, RH = 2.8;      // the cockpit: half its width and depth, its height
export const DASH = { z0: 1.6, z1: 2.55, top: 0.95 };   // the dashboard along the front: from, to, how high
export const SEAT = { x: 0, z: 0.45, y: -0.38 };  // where you sit (y: your eye is this much lower than standing)
export const EYE = 1.6 + SEAT.y;                  // so your eye is here, sitting down
export const LOCK_Z = -1.4;                       // walk in past here and the trip starts: you're strapped in

// when everything happens
export const T = {
  hop: 0.8,        // Sadie hops up onto the dashboard
  go: 2.5,         // the engines: off we go (Sadie starts talking, the music starts)
  hot: 63.5,       // into the air: the windscreen glows
  clouds: 68.5,    // into the clouds
  swap: 72,        // deep in the clouds, nothing but white out there: space is swapped for the land
  clear: 75.5,     // out under the clouds
  level: 84,       // levelled out, over the beach
  land: 90,        // touchdown
  closer: 95.5,    // Sadie comes closer
  closest: 100,    // and closer
  leap: 107,       // she flies at you
  black: 107.4,    // everything goes black
  back: 109.6,     // the black clears: you're standing in the doorway of her space room
  end: 110.6,
};

// What Sadie says, and when: each line stays up until the next. She talks the whole way.
export const LINES = [
  [T.go, "Oh, it's you. Sit down. We're leaving."],
  [6.5, "See all that? That's space, everything lives there. You live there."],
  [12, 'Every one of those little dots is a sun. Most of them will never know we were here.'],
  [18.5, 'Some of that light left home before there were any cats. Imagine that. No cats anywhere.'],
  [25, 'Out here nobody can hear you meow. I checked. Twice.'],
  [29.5, "It's quiet. Not nap quiet. The other kind."],
  [33.5, 'That planet has gone round and round its sun all by itself for longer than anyone can count.'],
  [40, 'Nobody pets it. Nobody feeds it. It just keeps going.'],
  [44.5, "Sometimes I think the universe is one big empty box, and we're all sitting in it, waiting for someone to come home."],
  [52.4, "Everything you've ever known fits in one of those dots. Even my food bowl."],
  [58.2, "Feel small? Good. Everything's small out here. That's fair."],
  [T.hot - 0.5, "We're almost there, a new planet, new life, new discoveries."],
  [68, 'Hold on to something. This part gets warm.'],
  [72, 'Clouds. Just water pretending to be a floor.'],
  [76.5, "Look down there. Nobody's ever seen it before. Well. Nobody but me."],
  [81.6, 'I used to watch the birds from the window like this. Same feeling. Bigger window.'],
  [87.5, 'Here we go...'],
  [T.land + 1, "But you've seen this already. It's just land and water."],
  [T.closer, "Disappointing isn't it?"],
  [T.closest, "Almost as disappointing as when you didn't give me the treats I wanted."],
];
// and in her space room afterwards
export const AFTER = 'I love space!';

// the line on screen at time t (null before she starts, and once she's flown at you)
export function lineAt(t) {
  if (t < LINES[0][0] || t >= T.leap) return null;
  let i = 0;
  while (i + 1 < LINES.length && LINES[i + 1][0] <= t) i++;
  return { i, text: LINES[i][1], since: t - LINES[i][0] };
}

const clamp01 = x => Math.max(0, Math.min(1, x));
export const smooth = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };

// How big the planet looks: its angular radius (radians). Tiny at first, growing slowly, then faster
// and faster as you get close, until it fills the windscreen.
export const PLANET_FROM = 0.07, PLANET_TO = 1.2;
export function planetSize(t) {
  const u = clamp01((t - T.go) / (T.swap - T.go));
  // how far away it is (in planet radii), falling slowly and then quickly: it looks 1 / that big
  const logD = Math.log(1 / Math.tan(PLANET_FROM)) - 1.6 * u - 3.8 * Math.pow(u, 5);
  return Math.min(PLANET_TO, Math.atan(1 / Math.exp(logD)));
}

// Coming in: the glow round the windscreen (the air getting hot), the white of the clouds (1: nothing
// but white out there, which is when space is swapped for the land) and the shaking.
export function entry(t) {
  const glow = smooth(T.hot, T.hot + 3, t) * (1 - smooth(T.clouds + 1, T.swap, t));
  const white = t < T.swap ? smooth(T.clouds, T.swap - 0.6, t) : 1 - smooth(T.swap + 0.4, T.clear, t);
  const shake = 0.6 * glow + 0.25 * white * (t < T.clear ? 1 : 0);
  return { glow, white, shake };
}

// The way down, once you're under the clouds: where the ship is over the land (the land's own
// metres: the beach you land on is at 0, 0, its sand GROUND high, the sea's surface at 0) and how far
// its nose points down. Swapped in at T.swap high over the land, diving through the clouds, levelling
// out over the beach at T.level, then down gently onto the sand at T.land. The cockpit's floor sits
// SKIDS over the ground once it's down.
export const GROUND = 0.72, SKIDS = 1.0;
const P0 = [0, 260, -700], P1 = [0, 150, -400], P2 = [0, 40, -110], P3 = [0, 25, -30], DOWN = [0, GROUND + SKIDS, 0];
const bez = (a, b, c, d, u) => a.map((_, i) => { const v = 1 - u; return v * v * v * a[i] + 3 * v * v * u * b[i] + 3 * v * u * u * c[i] + u * u * u * d[i]; });
export function shipAt(t) {
  if (t <= T.level) {
    const u = clamp01((t - T.swap) / (T.level - T.swap));
    const [x, y, z] = bez(P0, P1, P2, P3, u);
    return { x, y, z, pitch: -0.75 * (1 - smooth(0, 1, u)) };
  }
  // then a gentle hover down: carrying on the way it was going, slowing to a stop on the sand
  const s = T.land - T.level, u = clamp01((t - T.level) / s);
  const v0 = P3.map((p, i) => 3 * (p - P2[i]) / (T.level - T.swap) * s);   // (its speed as it levelled out)
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2;
  const [x, y, z] = P3.map((p, i) => h00 * p + h10 * v0[i] + h01 * DOWN[i]);
  // (a little bump as the skids touch the sand)
  const bump = t > T.land ? Math.sin(Math.min(1, (t - T.land) / 0.5) * Math.PI) * 0.06 : 0;
  return { x, y: y - bump, z, pitch: 0 };
}

// Sadie, in the cockpit: where she is (the middle of her feet), and how big (1: her usual size).
// She hops up from behind the dashboard, sits on it, looks out with you; when you land she walks up to
// its front edge, then onto the control stick, and then she flies at your face.
export const STICK = { x: 0, y: 0.74, z: 1.15 };
export function sadieAt(t) {
  const perch = { x: 0.05, y: DASH.top, z: 2.05 };
  if (t < T.hop) return { x: perch.x, y: DASH.top - 0.8, z: 2.35, size: 1 };   // (out of sight behind it)
  if (t < T.hop + 0.8) {
    const u = (t - T.hop) / 0.8;
    return { x: perch.x, y: DASH.top - 0.8 + 0.8 * u + 0.55 * Math.sin(u * Math.PI), z: 2.35 + (perch.z - 2.35) * u, size: 1 };
  }
  if (t < T.closer - 0.6) return { ...perch, size: 1 };
  const hop = (from, to, t0, secs) => {
    const u = clamp01((t - t0) / secs);
    return { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u + 0.25 * Math.sin(u * Math.PI), z: from.z + (to.z - from.z) * u, size: 1 };
  };
  const edge = { x: 0, y: DASH.top, z: DASH.z0 + 0.12 };
  if (t < T.closest - 0.6) return hop(perch, edge, T.closer - 0.6, 0.6);
  if (t < T.leap) return hop(edge, STICK, T.closest - 0.6, 0.6);
  // flying at you: straight at your face, getting bigger, in under half a second
  const u = clamp01((t - T.leap) / (T.black - T.leap)), face = { x: SEAT.x, y: EYE - 0.3, z: SEAT.z + 0.15 };
  return { x: STICK.x + (face.x - STICK.x) * u, y: STICK.y + (face.y - STICK.y) * u, z: STICK.z + (face.z - STICK.z) * u, size: 1 + u * 1.5 };
}

// What's saved: whether you've been on the trip (after it, the door opens onto Sadie's space room).
export const SAVE = 'trip';
export const readSave = v => ({ done: !!(v && v.done) });

// The land, in its own metres: the beach you land on at 0, 0 (its sand GROUND high), the sea off to
// your left (+x), rolling green hills behind the beach, tall snowy mountains far ahead (+z) and off to
// the right, and the sea's surface at 0. It's drawn as one big grid (LAND: its edges and how many
// squares), coloured by height.
export const LAND = { x0: -1400, x1: 1400, z0: -1000, z1: 1600, nx: 90, nz: 104 };
export const shore = z => 6 + 0.04 * z + 5 * Math.sin(z / 45);
export function heightAt(x, z) {
  const d = shore(z) - x;   // how far inland (under the sea when it's less than 0)
  let h = d < 0 ? Math.max(-30, d * 1.5) : Math.min(d * 0.12, 2 + d * 0.02) + smooth(15, 90, d) * (5 + 5 * Math.sin(x / 37) * Math.sin(z / 29));
  const ridge = Math.pow(0.5 * Math.abs(Math.sin(x / 53 + z / 97)) + 0.3 * Math.abs(Math.sin(x / 23 - z / 41)) + 0.2 * Math.abs(Math.sin(x / 11 + z / 13)), 1.5);
  const far = smooth(420, 820, z) * smooth(-60, 140, d) * (160 + 260 * ridge);            // the mountains ahead
  const side = smooth(-260, -520, x) * smooth(-300, 100, z) * (60 + 180 * ridge);          // and off to the right
  return h + Math.max(far, side);
}
