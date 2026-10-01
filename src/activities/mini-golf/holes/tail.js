// Hole 3, Sadie's Tail: two ramps lead from the lower lawn up to a raised green with the hole in the
// middle. Between the ramps a cat flap tunnel goes through the bank and pops the ball out just below
// the hole. It's built against the bench in the backyard where Sadie naps, and her (very long) tail
// hangs over the wall and sweeps across the right-hand ramp, batting the ball up it.
// (How `pins` and `shots` were made: doughnut.js.) In the backyard it's flipped left to right, so
// her bench is on the right as you look up it from the tee.
export default {
  id: 'tail', name: "Sadie's Tail", par: 5,
  shape: [['rrect', 8, 92, 84, 134, 8], ['rect', 10, 44, 26, 96], ['rect', 62, 44, 80, 96], ['rrect', 8, 8, 84, 50, 8]],
  height: [['slopeY', 50, 92, 3.2, 0], ['bump', 46, 30, 11, -1.2], ['bump', 30, 116, 8, 0.5], ['bump', 62, 124, 8, -0.4]],
  tee: [16, 126], cup: [46, 30], reach: 10,
  // the cat flap: its mouth in the lawn's top wall (w: half its width; dir: the lawn's on its +y
  // side), and where it comes out on the top green
  tunnel: { mouth: [44, 92], w: 3, dir: 1, out: [44, 46] },
  // her tail: from her bench (off the green), sweeping across the right-hand ramp
  movers: [{ kind: 'tail', x: 105, y: 79, a0: Math.PI, amp: 0.35, speed: 0.7, len: 43, thick: 1.8, push: 45 }],
  // (where pins can stand: round the hole, up top, or on the ramps; not on the lawn below)
  zone(x, y) {
    if (y < 18) return 'back';
    if (y < 50) return x < 46 ? 'top-left' : 'top-right';
    if (y < 92) return 'ramps';
    return null;
  },
  pins: [[19.3, 88.9], [15.7, 43.7], [33.7, 14.6]],
  shots: { normal: [[5.0527, 0.24, 0], [4.4506, 0.5, 0], [2.9583, 0.6, 0]], trick: [[4.1364, 0.95, 0]] },
  at: { x: 13.275, z: 11.825, flip: true },
  club: 'sock',
};
