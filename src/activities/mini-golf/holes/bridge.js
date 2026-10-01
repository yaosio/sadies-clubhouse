// Hole 2, The Bridge Over the Hole: a railed bridge climbs from the lawn, straight over the hole, up
// onto a raised terrace at the far end. The tentacles wave up at a ball on the bridge but can't reach
// it. A sprinkler beside the hole turns slowly, its spray pushing the ball down towards the hole.
// (How `pins` and `shots` were made: doughnut.js.)
export default {
  id: 'bridge', name: 'The Bridge', par: 4,
  shape: [['rrect', 8, 8, 92, 132, 10]],
  height: [['slopeY', 22, 27, 3, 0], ['bump', 50, 62, 18, -2.4], ['bump', 22, 100, 9, 1.0], ['bump', 80, 104, 8, 0.9], ['bump', 82, 20, 8, 0.6], ['bump', 18, 22, 8, 0.6]],
  tee: [22, 124], cup: [50, 62], reach: 11,
  // the bridge: its deck between x0 and x1, from its low end on the lawn to its high end on the
  // terrace; `under`: the stretch at its low end too low for a ball to roll under
  bridge: { x0: 44, x1: 56, yLow: 108, hLow: -0.05, yHigh: 22, hHigh: 2.8, under: [90, 108] },
  movers: [{ kind: 'sprinkler', x: 80, y: 70, a0: 0, speed: 0.6, len: 19, push: 60 }],
  // (where pins can stand: not on the lawn in front, nearer the tee than the hole)
  zone(x, y) {
    if (y < 26) return 'terrace';
    if (y > 84) return null;
    if (x < 44) return 'left';
    if (x > 56) return 'right';
    return null;
  },
  pins: [[22.3, 80], [61.5, 16.5], [86.6, 52.5]],
  shots: { normal: [[4.6862, 0.65, 0], [0.0262, 0.12, 0], [0.1833, 0.3, 0]], trick: [[4.0317, 1, 2.5]] },
  at: { x: -6, z: 31 },
  club: 'spoon',
};
