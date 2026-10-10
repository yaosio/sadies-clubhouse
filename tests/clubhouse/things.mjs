// The distance keeper's fatal-error checks (src/clubhouse/things.js, run from tests/clubhouse/run.mjs):
// a thing builds as you come near and not before, is never let go while you're near or it's busy,
// never flickers when you stand on an edge, comes back after a failed build, and one thing's mistake
// never stops the rest. No drawing: fake positions and fake things, so a long walk runs in a moment.
// (How it feels isn't checked: docs/clubhouse/checks/fatal-only.md.)
import { makeThings } from '../../src/clubhouse/things.js';

const DT = 1 / 30;
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

// a fake thing that writes down every state it was told
function fake(id, x, z, more = {}) {
  const log = [];
  return { r: 0, ...more, id, x, z, log, show: s => { log.push(s); return more.show?.(s); } };
}
// walk `from` to `to` along z at 5 m/s, stepping the keeper, and give back the path of states
async function walk(keeper, x, z0, z1) {
  for (let z = z0; z0 < z1 ? z <= z1 : z >= z1; z += (z1 > z0 ? 1 : -1) * 5 * DT) { keeper.step(DT, { x, z }); await settle(); }
}

export async function checkThings(check) {
  // ---- a walk out to the thing and back ----
  {
    const k = makeThings(), pool = fake('pool', 0, 100, { r: 10 }); k.add(pool);
    await walk(k, 0, 0, 20);   // 70 m from its edge: too far to need building, but in view
    check('a thing far off (but in view) is a stand-in, not built', k.states().pool === 'far' && !pool.log.includes('near'), JSON.stringify(pool.log));
    await walk(k, 0, 20, 45);   // 45 m from its edge: inside 60
    check('...built once you come inside its near range', k.states().pool === 'near' && pool.log.at(-1) === 'near' && pool.log.filter(s => s === 'near').length === 1, JSON.stringify(pool.log));
    await walk(k, 0, 45, 0);    // back to 90 m from its edge (leave is 75)
    check('...and not let go the moment you step past its leave range', k.states().pool === 'near');
    for (let i = 0; i < 30 * 6; i++) k.step(DT, { x: 0, z: 0 });
    check('...let go to a stand-in only after you stayed out past its leave range for the grace time', k.states().pool === 'far' && pool.log.at(-1) === 'far', JSON.stringify(pool.log));
  }
  // ---- too far to be seen, and back ----
  {
    const k = makeThings(), t = fake('field', 0, 1000); k.add(t);
    k.step(DT, { x: 0, z: 0 }); await settle();
    check('a thing past the draw distance is nothing at all', k.states().field === 'gone');
    k.step(DT, { x: 0, z: 800 }); await settle();
    check('...a stand-in once it is in view', k.states().field === 'far');
    k.step(DT, { x: 0, z: 740 }); await settle();   // (260 m: past 250 but not past 265)
    check('...and does not flicker between stand-in and nothing at the edge of view', t.log.join() === 'gone,far' && k.states().field === 'far', JSON.stringify(t.log));
  }
  // ---- standing on the edge of near range never flickers ----
  {
    const k = makeThings(), t = fake('p', 0, 100); k.add(t);
    for (let i = 0; i < 30 * 120; i++) { k.step(DT, { x: 0, z: 100 - 60 + Math.sin(i / 7) * 4 }); if (i % 5 === 0) await settle(); }
    const near = t.log.filter(s => s === 'near').length, off = t.log.filter(s => s === 'far' || s === 'gone').length;
    check('standing about on the edge of its range for two minutes builds a thing once and never lets it go', near === 1 && off <= 1, `built ${near} times, stand-in ${off} times: ${JSON.stringify(t.log)}`);
  }
  // ---- distance is to the edge, not the middle ----
  {
    const k = makeThings(), big = fake('big', 0, 100, { r: 30 }), small = fake('small', 0, 100); k.add(big); k.add(small);
    k.step(DT, { x: 0, z: 20 }); await settle();   // 80 m to the middle: 50 m from the big one's edge
    check('a big thing is near while you are still far from its middle (distance is to its edge)', k.states().big === 'near' && k.states().small !== 'near');
  }
  // ---- busy, and not seen ----
  {
    let busy = true;
    const k = makeThings(), t = fake('game', 0, 100, { busy: () => busy }); k.add(t);
    k.step(DT, { x: 0, z: 100 }); await settle();
    for (let i = 0; i < 30 * 60; i++) k.step(DT, { x: 0, z: -400 });
    check('a thing that says it is busy is never let go', k.states().game === 'near');
    busy = false;
    for (let i = 0; i < 30 * 10; i++) k.step(DT, { x: 0, z: -400 });
    check('...and is let go once it is not', k.states().game !== 'near');
    k.step(DT, { x: 0, z: 100 }); await settle();
    const log = t.log.length;
    for (let i = 0; i < 30 * 60; i++) k.step(DT, null);
    check('when outside cannot be seen (null) nothing changes, however long', k.states().game === 'near' && t.log.length === log);
  }
  // ---- one at a time, the nearest first ----
  {
    const k = makeThings(), order = [], slow = (id) => ({ show: s => { if (s === 'near') { order.push(id); return new Promise(ok => setTimeout(ok, 5)); } } });
    const a = fake('a', 0, 50, slow('a')), b = fake('b', 0, 20, slow('b')), c = fake('c', 0, 40, slow('c'));
    for (const t of [a, b, c]) k.add(t);
    for (let i = 0; i < 600; i++) { k.step(DT, { x: 0, z: 0 }); await new Promise(ok => setTimeout(ok, 1)); }
    check('things build one at a time, the nearest first', order.join('') === 'bca' && k.states().a === 'near' && k.states().b === 'near' && k.states().c === 'near', order.join(''));
  }
  // ---- a failed build is tried again, a few times, and then left; one thing's mistake stops no other ----
  {
    const warn = console.warn; console.warn = () => {};
    let tries = 0, bad = '';
    try {
      const k = makeThings(), fails = fake('fails', 0, 10, { show: s => { if (s === 'near') { tries++; throw new Error('no'); } } }), fine = fake('fine', 0, 20);
      const angry = fake('angry', 0, 500, { show: () => { throw new Error('mine'); } });
      for (const t of [fails, fine, angry]) k.add(t);
      try { for (let i = 0; i < 30 * 120; i++) { k.step(DT, { x: 0, z: 0 }); if (i % 3 === 0) await settle(); } } catch (e) { bad = e.message; }
      check('a thing that will not build is tried again a few times and then left alone (and the others still build)', tries > 1 && tries <= 6 && k.states().fine === 'near' && !bad, `tried ${tries} times ${bad}`);
      check('a thing that throws when told its state stops nothing', !bad);
    } finally { console.warn = warn; }
  }
  // ---- the ranges can be pulled in all at once (for the test page and the checks) ----
  {
    const k = makeThings(), t = fake('p', 0, 100); k.add(t);
    k.step(DT, { x: 0, z: 0 }); await settle();
    const before = k.states().p;
    k.setScale(2); k.step(DT, { x: 0, z: 0 }); await settle();
    check('pushing every range out makes a thing near that was not, and pulling them in lets it go', before !== 'near' && k.states().p === 'near');
    k.setScale(0.2); for (let i = 0; i < 30 * 10; i++) k.step(DT, { x: 0, z: 0 }); await settle();
    check('...pulled in again, it is let go', k.states().p !== 'near');
  }
}
