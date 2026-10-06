// What goes on at the pool, as plain numbers with no drawing (so a headless check can run an hour of
// it in a second): the ball, Chooter, Marbles, Sadie's moods, and when you've "arrived" (which sets
// Chooter off). pool.js draws it and plays its sounds from what `out(type, data)` says happened:
//   'splash' (x, z, strength), 'bounce' (x, z, strength), 'bump' (x, z, strength), 'drops' ({ kind, from, to }),
//   'cross' (Sadie has just been got at).
import { DECK, SOLID, BALL, inRect } from './layout.js';
import { makeBall, stepBall, kick } from './ball.js';
import { makeChooter, stepChooter, arrive } from './dog.js';
import { makeMarbles, stepMarbles } from './marbles.js';

const rand = (a, b) => a + Math.random() * (b - a);
const FLIGHT = { splash: 0.7, squirt: 0.5, bucket: 0.5 };   // how long the water takes to reach her

export function makePoolSim(out = () => {}) {
  const sim = {
    t: 0, ball: makeBall(), chooter: makeChooter(), marbles: makeMarbles(),
    sadie: { state: 'doze', timer: rand(6, 10) },   // 'doze' (asleep), 'lounge' (awake, blinking) or 'cross' (just got at)
    here: false, away: 0, hits: [], hitBall: 0, bumped: 0,
    kick(x, z, yaw) { return kick(sim.ball, x, z, yaw); },
  };
  const { ball, chooter, marbles, sadie } = sim;
  const gotAt = () => { sadie.state = 'cross'; sadie.timer = 3; out('cross'); };

  // `you`: where you are ({ x, z }) when you're out in the open, or null (indoors, or you can't be seen)
  sim.step = (dt, you) => {
    sim.t += dt;
    // arriving: within a metre of the fence. Gone: three metres off (or out of sight) for a moment.
    // Come back, and it's an arrival again.
    const near = !!you && inRect(you.x, you.z, [DECK.x0, DECK.x1, DECK.z0, DECK.z1], 1);
    const far = !you || !inRect(you.x, you.z, [DECK.x0, DECK.x1, DECK.z0, DECK.z1], 3);
    if (near && !sim.here) { sim.here = true; arrive(chooter); }
    sim.away = far ? sim.away + dt : 0;
    if (sim.here && sim.away > 1.5) sim.here = false;

    stepChooter(chooter, dt, { you: you && !far ? you : null, emit: out });
    stepMarbles(marbles, dt, { ball, emit: (type, d) => { out(type, d); if (type === 'drops') sim.hits.push({ t: FLIGHT[d.kind], kind: d.kind }); } });
    stepBall(ball, dt, out);

    // Chooter and the ball: he bats it about when he runs into it
    sim.bumped -= dt;
    if (!ball.held && sim.bumped <= 0 && chooter.y < 0.6 && Math.hypot(ball.x - chooter.x, ball.z - chooter.z) < BALL.r + 0.4 && chooter.mode !== 'swim') {
      const dx = ball.x - chooter.x, dz = ball.z - chooter.z, d = Math.hypot(dx, dz) || 1;
      ball.vx += dx / d * 3.5; ball.vz += dz / d * 3.5; ball.vy = Math.max(ball.vy, 2.6); sim.bumped = 0.6;
      out('bounce', ball.x, ball.z, 0.5);
    }
    // the ball hits Sadie
    sim.hitBall -= dt;
    if (sim.hitBall <= 0 && ball.y < 1.3 && Math.hypot(ball.vx, ball.vz) > 1.2 && inRect(ball.x, ball.z, SOLID[0], BALL.r + 0.12)) { sim.hitBall = 2; gotAt(); out('bounce', ball.x, ball.z, 0.6); }
    // water that's on its way to Sadie lands
    for (const h of sim.hits) h.t -= dt;
    if (sim.hits.some(h => h.t <= 0)) { sim.hits = sim.hits.filter(h => h.t > 0); gotAt(); }

    // Sadie: dozes, wakes for a while, dozes again; cross for a few seconds when she's been got at
    sadie.timer -= dt;
    if (sadie.timer <= 0) {
      if (sadie.state === 'doze') { sadie.state = 'lounge'; sadie.timer = rand(7, 12); }
      else { sadie.state = 'doze'; sadie.timer = rand(10, 18); }
    }
  };
  return sim;
}
