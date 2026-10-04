// Marbles' Cut & Curl's headless checks: the card (the third plot outside the gate, nothing saved),
// that everything Sadie can wear is there and every outfit with a show has one, that each show runs
// from start to finish without a mistake (on stand-ins for the props), and that every sound makes
// numbers (not how they sound). Run in Node, in about a second.
//
//   node tests/barbershop/run.mjs
import { HAIR, TAIL, OUTFIT, drawLook, W, H } from '../../src/activities/barbershop/looks.js';
import { SHOWS } from '../../src/activities/barbershop/shows.js';
import { ALL } from '../../src/activities/barbershop/sounds/index.js';
import { SONGS } from '../../src/activities/barbershop/sounds/music.js';
import { RATE } from '../../src/shared/retro.js';
import card from '../../src/activities/barbershop/card.js';
import { checker } from '../shared/check.mjs';

const { check, finish } = checker();

// 1. the card: Marbles' shop on the third plot outside the gate, which keeps nothing
check("the card puts Marbles' shop on the third plot outside the gate, not on the landing", card.lot === 2 && card.slot === undefined && typeof card.room === 'function' && /Marbles/.test(card.name));
check('...and keeps nothing (nothing is saved)', card.keeps === undefined);

// 2. what Sadie can wear: names, colours, and a show for every outfit that says so
const all = [['hair', HAIR], ['tail', TAIL], ['outfit', OUTFIT]];
check('there are hairdos, taildos and outfits, each with a name, a colour and a way to draw it',
  all.every(([, l]) => l.length >= 6 && l.every(x => x.name && /^#[0-9a-f]{6}$/i.test(x.color))) && HAIR.every(h => typeof h.draw === 'function') && TAIL.every(t => typeof t.draw === 'function') && OUTFIT.every(o => typeof o.body === 'function' && typeof o.hat === 'function'));
check('...none the same name twice', all.every(([, l]) => new Set(l.map(x => x.name)).size === l.length));
check('every outfit with a show has one to run, and the three asked for are there (sing, build, dance)',
  OUTFIT.every(o => !o.show || SHOWS[o.show]) && ['sing', 'build', 'dance'].every(s => OUTFIT.some(o => o.show === s)));
check('the hairdos and taildos have no shows of their own', [...HAIR, ...TAIL].every(x => !x.show));
// drawing every combination on a stand-in canvas: it never draws outside the picture
{
  let bad = 0, rects = 0;
  const g = { fillStyle: '', clearRect() {}, fillRect(x, y, w, h) { rects++; if (x < -1 || y < -1 || x + w > W + 1 || y + h > H + 1) bad++; } };
  const mask = [[6, 12], [7, 13], [8, 14]];
  for (let h = 0; h < HAIR.length; h++) for (let t = 0; t < TAIL.length; t++) for (let o = 0; o < OUTFIT.length; o++) drawLook(g, { hair: h, tail: t, outfit: o }, mask, 2);
  check('every hairdo with every taildo and outfit draws inside the picture', bad === 0 && rects > 1000, `${bad} outside, ${rects} rectangles`);
}

// 3. each show runs from start to finish on stand-ins for the props, and starts only sounds that exist
{
  const thing = () => ({ visible: false, position: { set() {} }, rotation: { set() {} }, scale: { set() {}, setScalar() {} }, material: { uniforms: { uFade: { value: 0 } } } });
  const P = { mic: thing(), beam: thing(), notes: Array.from({ length: 8 }, thing), blocks: Array.from({ length: 5 }, thing), hat: thing(), cape: thing(), puff: thing(), box: thing(), glass: thing(), bang: thing(), tuna: thing(), zs: [thing(), thing(), thing()], sparks: Array.from({ length: 6 }, thing) };
  for (const [name, def] of Object.entries(SHOWS)) {
    const heard = new Set(), said = [], fired = new Set();
    const c = {
      S: { x: 3, y: 0.3, z: -2.5 }, P, puffsList: [],
      at() {}, marblesAt() {}, marblesScale() {}, say: t => said.push(t), mood() {}, nap() {}, tilt() {}, sadieShown() {}, play: n => heard.add(n),
      once(key, a, b) { const [cond, fn] = typeof a === 'function' ? [true, a] : [a, b]; if (cond && !fired.has(key)) { fired.add(key); fn(); } },
    };
    let error = null;
    try { for (let t = 0; t <= def.len; t += 1 / 30) def.run(c, t); } catch (e) { error = e.message; }
    check(`the ${name} show runs from start to finish, with a sound or a line of its own`, !error && (heard.size > 0 || said.length > 0) && def.len >= 5 && def.len <= 9, error || `${def.len} s`);
    check(`...and every sound it plays exists (${[...heard].join(', ')})`, [...heard].every(n => typeof ALL[n] === 'function'));
  }
}

// 4. every sound makes numbers (nothing broken: it's how it sounds that isn't tested, by the owner's rule)
for (const [name, make] of Object.entries(ALL)) {
  const a = make();
  check(`the ${name} sound makes real numbers, not silence (${(a.length / RATE).toFixed(1)} s)`, a.length > 100 && a.every(Number.isFinite) && a.some(v => v));
}

// 5. the shop's tune and every show's song make real numbers (and every show has a song of its own)
check('every show has a song, and the shop has its tune', Object.keys(SHOWS).every(n => typeof SONGS[n] === 'function') && typeof SONGS.shop === 'function');
for (const [name, make] of Object.entries(SONGS)) {
  const a = make();
  check(`the ${name} music makes real numbers, not silence (${(a.length / RATE).toFixed(1)} s)`, a.length > 1000 && a.every(Number.isFinite) && a.some(v => v));
}

finish();
