// Every piece type: its shape (in blocks), color, name, and material (how it behaves).
export const SHAPES = {
  I: [[0,0],[1,0],[2,0],[3,0]],
  O: [[0,0],[1,0],[0,1],[1,1]],
  T: [[0,0],[1,0],[2,0],[1,1]],
  S: [[0,0],[1,0],[1,1],[2,1]],
  Z: [[1,0],[2,0],[0,1],[1,1]],
  L: [[0,0],[1,0],[2,0],[2,1]],
  J: [[0,0],[1,0],[2,0],[0,1]],
  noodle: [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]],
  boulder: [[0,0],[1,0],[0,1],[1,1]],
  ball: null, // round, built separately
};
export const COLORS = { I:'#8fe3ff', O:'#ffcf3a', T:'#9a6bff', S:'#6fd08a', Z:'#e8394f', L:'#ff9a40', J:'#ffc2dc',
  noodle:'#c6ec4a', boulder:'#9d94ab', ball:'#ff6a3d' };
export const NAMES = { I: 'Ice bar', O: 'Sponge', T: 'Grape gum', S: 'Lime grip', Z: 'Cherry brick', L: 'Wobbler', J: 'Marshmallow',
  noodle: 'Noodle', boulder: 'Boulder', ball: 'Bouncy ball' };
// How each kind of piece behaves. These are our tuning knobs, not the player's.
//   kMul: how firmly each part holds its shape   bendMul: how much the whole piece resists bending
//   invMass: 1 = normal, lower = heavier          bounce: how much it springs back off things
//   drag: 1 = normal air/wobble damping, lower = keeps moving longer
//   grip: 1 = normal friction, lower = slippery, higher = grabs onto things
export const JELLY = { kMul: 1, bendMul: 1, invMass: 1, bounce: 0, drag: 1, grip: 1 };
export const MATERIALS = {
  I:       { kMul: 1.6,  bendMul: 1.5, invMass: 1,    bounce: 0,    drag: 1,    grip: 0.08 }, // ice bar: slides off everything
  O:       { kMul: 0.45, bendMul: 1,   invMass: 1.4,  bounce: 0,    drag: 1,    grip: 1.6 },  // sponge: soft, light, squashes into gaps
  T:       { kMul: 1.3,  bendMul: 1.5, invMass: 1,    bounce: 0.45, drag: 0.5,  grip: 1 },    // grape gum: springy
  S:       { kMul: 1,    bendMul: 1,   invMass: 1,    bounce: 0,    drag: 1,    grip: 3 },    // lime grip: clings to slopes
  Z:       { kMul: 1.8,  bendMul: 2,   invMass: 0.5,  bounce: 0,    drag: 1,    grip: 1 },    // cherry brick: heavy and firm
  L:       { kMul: 0.7,  bendMul: 0.7, invMass: 1,    bounce: 0,    drag: 0.25, grip: 1 },    // wobbler: jiggles for ages
  J:       { kMul: 0.35, bendMul: 0.6, invMass: 1.8,  bounce: 0,    drag: 1,    grip: 1.3 },  // marshmallow: very squishy and light
  noodle:  { kMul: 0.9,  bendMul: 0,   invMass: 1,    bounce: 0,    drag: 1,    grip: 1 },
  boulder: { kMul: 4,    bendMul: 5,   invMass: 0.25, bounce: 0,    drag: 1,    grip: 1 },
  ball:    { kMul: 2.5,  bendMul: 7,   invMass: 0.7,  bounce: 0.75, drag: 0.15, grip: 1 },
};
export const matOf = type => MATERIALS[type] || JELLY;
