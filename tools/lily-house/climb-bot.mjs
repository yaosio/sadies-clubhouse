// A simple player for Lily's Big Climb, to see the level can be won: node tools/lily-house/climb-bot.mjs [games]
import { makeClimb, LADDERS, CHICKEN } from '../../src/activities/lily-house/climb.js';
const games = +(process.argv[2] || 40);
let hops = 0, hits = 0, wins = 0, lost = 0, times = [], scores = [];
for (let s = 1; s <= games; s++) {
  const G = makeClimb(s * 7919); G.start();
  let t = 0, jumpCool = 0;
  while (t < 200 && G.state !== 'done' && G.state !== 'over') {
    const L = G.lily, input = { left: false, right: false, jump: false };
    if (G.state === "play" && !L.air && !L.dying) {
      const goal = L.g === CHICKEN.on ? CHICKEN.x : LADDERS.filter(p => p.on === L.g && !p.broken).sort((a, b) => Math.abs(a.x - L.x) - Math.abs(b.x - L.x))[0].x;
      if (L.climb) input.up = true; else if (Math.abs(goal - L.x) < 3) { if (L.g !== CHICKEN.on) input.up = true; }
      else if (goal > L.x) input.right = true; else input.left = true;
      // something coming at her, close: jump it
      const near = G.items.find(it => it.g === L.g && Math.abs(it.y - L.y) < 6 && Math.sign(L.x - it.x) === Math.sign(it.vx) && Math.abs(L.x - it.x) < 22 + Math.abs(it.vx) * 0.05) || G.suds.find(u => u.g === L.g && !u.climb && Math.abs(u.x - L.x) < 14);
      if (near && !L.climb && jumpCool <= 0) { input.jump = true; jumpCool = 0.1; }
    }
    jumpCool -= 1 / 60;
    G.step(1 / 60, input); t += 1 / 60; for (const e of G.events) { if (e === "hop") hops++; if (e === "ouch") hits++; }
  }
  if (G.won) { wins++; times.push(t.toFixed(0)); } else lost++;
  scores.push(G.score);
}
console.log(`hops ${hops} hits ${hits}; won ${wins}, lost ${lost} of ${games}; times ${times.join(' ')}; scores ${scores.slice(0, 12).join(' ')}`);
