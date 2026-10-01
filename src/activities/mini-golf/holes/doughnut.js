// Hole 1, The Doughnut: you tee off from a raised platform and roll down a chute into a round bowl
// with the hole sunk in the middle, and a banked rim all the way round it like a racetrack. The pins
// stand up on the rim, round and behind the hole. A garden gnome rolls laps round the rim the other
// way, and knocks a ball he bumps down towards the hole.
//
// In the plan's units (100 across, 140 long; the tee's at the bottom). `pins` and `shots` come from
// tools/mini-golf/design.mjs: the winning shots were worked out first and the pins put where they
// roll (`normal`: one pin a shot, then in; `trick`: all three pins in one shot). Each shot is
// [angle, power, clock]: which way (radians, in the plan), how hard (0-1), and the course's clock
// as it's hit (where the gnome is).
export default {
  id: 'doughnut', name: 'The Doughnut', par: 4,
  shape: [['circle', 50, 60, 41], ['rrect', 40, 92, 60, 133, 6]],
  height: [['bowl', 50, 60, 27, -2.6], ['rim', 50, 60, 28, 39, 2.2], ['slopeY', 96, 118, 0, 2.2]],
  tee: [50, 125], cup: [50, 60], reach: 11,
  movers: [{ kind: 'gnome', cx: 50, cy: 60, r: 35, a0: 0, speed: -0.35, size: 2.6, push: 25 }],
  // the parts of the hole a pin can stand in (each pin in a different one; null: nowhere for a
  // pin, like the chute in front of the hole, or down in the bowl)
  zone(x, y) {
    if (y > 92 || Math.hypot(x - 50, y - 60) < 29) return null;
    if (y < 40) return 'back';
    return x < 50 ? 'left' : 'right';
  },
  pins: [[41.9, 89.7], [38.9, 31.5], [81.3, 54.7]],
  shots: { normal: [[5.6025, 0.45, 0], [3.2463, 0.12, 0], [0.0262, 0.55, 0]], trick: [[0.6807, 0.9, 2.5]] },
  // where it is in the backyard: the plan's corner (x, z, metres), and whether it's flipped left to right
  at: { x: -17, z: 31 },
  club: 'fish',
};
