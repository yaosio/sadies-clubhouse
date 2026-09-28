// When does Chooter arrive on a new board? Plays fresh games in Node (the real game, the mole
// dropping pieces as usual) with a few different random seeds, and says when he first peeked in
// and when he burst in, and how tall the pile and Sadie were by then. Handy when tuning how a
// friend turns up.
//
//   node tools/dropper-world/arrival.mjs [seeds...]      (default: 7 11 42 99)
import { spawnSync } from 'node:child_process';

const seeds = process.argv.slice(2).filter(a => /^\d+$/.test(a));
if (process.env.ARRIVAL_SEED) {
  let seed = +process.env.ARRIVAL_SEED;
  Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const src = new URL('../../src/activities/dropper-world/', import.meta.url);
  const { U } = await import(new URL('config.js', src));
  const { chooter, PEEK_AT } = await import(new URL('core/friends/chooter.js', src));
  const { resetGame, update } = await import(new URL('core/game.js', src));
  const { sadie } = await import(new URL('core/sadie/brain.js', src));
  const { world } = await import(new URL('core/world.js', src));
  chooter.met = false; chooter.heard = 0; resetGame();
  let peeked = null, f = 0;
  for (; f < 20 * 3600 && !chooter.met; f++) { update(1 / 60); if (peeked === null && chooter.peek > 0.5) peeked = f / 60; }
  const mins = s => s === null ? 'never' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  console.log(`seed ${process.env.ARRIVAL_SEED}: first peeked in at ${mins(peeked)}, burst in at ${chooter.met ? mins(f / 60) : 'never (20 min)'}` +
    ` (wound up to ${PEEK_AT * 100}% before peeking), ${world.pieces.length} pieces, pile ${(world.topSettled / U).toFixed(1)} blocks, Sadie ${(sadie.y / U).toFixed(1)} blocks up`);
} else {
  const runs = (seeds.length ? seeds : ['7', '11', '42', '99']).map(s => new Promise(ok => {
    const r = spawnSync(process.execPath, [new URL(import.meta.url).pathname], { env: { ...process.env, ARRIVAL_SEED: s } });
    process.stdout.write(r.stdout.toString() + r.stderr.toString()); ok();
  }));
  await Promise.all(runs);
}
