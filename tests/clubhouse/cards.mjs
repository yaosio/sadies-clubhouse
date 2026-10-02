// The room checker: every activity's card, read the way the build reads it, checked against the
// clubhouse's rules, so a mistake shows up here with a plain reason instead of as a broken game.
// Run by tests/clubhouse/run.mjs (headless, a second or two).
//
//   - its id is its folder's name, it has a name, and it only uses card fields the clubhouse knows
//     (a misspelt one would just be ignored);
//   - it's either on a computer (`start`, with its `page` and `styles`) or lives in its room (`room`);
//   - it has exactly one place: a door on a landing (`slot`), a plot along the lane (`lot`) or a
//     spot in the grounds (`grounds`), which exists, and no other card has taken;
//   - and nothing placed ever moves: every door, plot and spot is still exactly where
//     tests/clubhouse/spots.json says, in the same order (a new one goes on the end of its list, and
//     on the end of the file's list too: that's what's never allowed to change after);
//   - its saves: a room saves through its kit's box (`m.saves`, src/shared/storage.js), never
//     straight to the browser; `keeps` names where they start; a new activity's start `sadies-clubhouse.<id>.`;
//     no two activities' overlap, nor the mansion's own (`mansion.`); an activity that saves
//     anything (uses the toolbox's `store`) has `keeps`; and it never names another activity's save;
//   - it has its own checks, headless and in a browser (tests/<id>/run.mjs and browser.mjs).
// The mansion's browser check also looks at every save actually written while it walks round every
// room, and fails on one no card's `keeps` covers (tests/clubhouse/browser.mjs).
import { build } from 'esbuild';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SLOTS } from '../../src/clubhouse/hall.js';
import { LOTS, GROUNDS } from '../../src/clubhouse/outside.js';

const root = new URL('../..', import.meta.url).pathname;
// every field a card can have (docs/clubhouse/ROOMS.md)
const FIELDS = ['id', 'name', 'page', 'styles', 'start', 'room', 'door', 'slot', 'lot', 'grounds', 'doorstep', 'box', 'keeps'];
const PLACES = { slot: SLOTS.length, lot: LOTS.length, grounds: GROUNDS.length };
// saves from before there was a clubhouse (Dropper World's): never renamed, or everyone's would be lost
const OLD_KEEPS = { 'dropper-world': ['sadies-dropper-world.', 'jellystack.', 'sadie.'] };

// a card as the build sees it: its page and styles as text, its room or game left unloaded
async function readCard(dir) {
  const out = await build({
    entryPoints: [join(dir, 'card.js')], bundle: true, write: false, format: 'esm', logLevel: 'silent',
    loader: { '.html': 'text', '.css': 'text' },
    plugins: [{ name: 'lazy', setup(b) { b.onResolve({ filter: /.*/ }, a => a.kind === 'dynamic-import' ? { path: a.path, external: true } : undefined); } }],
  });
  const code = out.outputFiles[0].text;
  return (await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))).default;
}

function sourceOf(dir) {
  let text = '';
  const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.js')) text += readFileSync(p, 'utf8') + '\n'; } };
  walk(dir);
  return text;
}

// where every save may start: each card's `keeps`, and the mansion's own (for the browser check)
export async function allKeeps() {
  const ids = readdirSync(join(root, 'src/activities')).filter(d => existsSync(join(root, 'src/activities', d, 'card.js')));
  const keeps = ['mansion.'];
  for (const id of ids) keeps.push(...((await readCard(join(root, 'src/activities', id))).keeps || []));
  return keeps;
}

// every activity's card (in folder order), for checks that go round them all without naming any
export async function allCards() {
  const ids = readdirSync(join(root, 'src/activities')).sort().filter(d => existsSync(join(root, 'src/activities', d, 'card.js')));
  return Promise.all(ids.map(id => readCard(join(root, 'src/activities', id))));
}

export async function checkCards(check) {
  const ids = readdirSync(join(root, 'src/activities')).sort().filter(d => existsSync(join(root, 'src/activities', d, 'card.js')));
  const cards = [], unread = [];
  for (const id of ids) {
    const dir = join(root, 'src/activities', id);
    try { cards.push({ id, dir, card: await readCard(dir) }); } catch (e) { unread.push(`${id}: ${e.message}`); }
  }
  check(`room checker: every activity's card can be read (${ids.length})`, !unread.length, unread.join('; '));

  // each card: one line, listing anything wrong with it
  for (const { id, dir, card: c } of cards) {
    const bad = [], need = (ok, why) => { if (!ok) bad.push(why); };
    const odd = Object.keys(c).filter(k => !FIELDS.includes(k));
    need(c.id === id, `its id isn't its folder's name (${c.id})`);
    need(typeof c.name === 'string' && c.name, 'it has no name');
    need(!odd.length, `fields the clubhouse doesn't know: ${odd.join(', ')}`);
    const computer = typeof c.start === 'function', room = typeof c.room === 'function';
    need(computer !== room, 'it needs either start (on a computer) or room (lives in its room), not both');
    need(!computer || (typeof c.page === 'string' && typeof c.styles === 'string'), 'on a computer, it needs its page and styles');
    need(!room || (!c.page && !c.styles), "living in its room, it has no page or styles");
    const places = Object.keys(PLACES).filter(k => c[k] !== undefined), where = places[0], n = c[where];
    need(places.length === 1, `it needs exactly one place (a door, a plot or a spot in the grounds), has ${places.join(', ') || 'none'}`);
    need(places.length !== 1 || (Number.isInteger(n) && n >= 0 && n < PLACES[where]), `its ${where} ${n} doesn't exist (there are ${PLACES[where]})`);
    need(!c.doorstep || where === 'slot', 'only a door on the landing has a doorstep');
    // saves
    const keeps = c.keeps || [], own = `sadies-clubhouse.${id}.`, old = OLD_KEEPS[id] || [];
    need(Array.isArray(keeps) && keeps.every(k => typeof k === 'string' && (k.startsWith(own) || old.includes(k))), `its saves must start ${own} (keeps: ${keeps})`);
    const src = sourceOf(dir), saves = /\b(store|saves)\.(get|set|remove)\(|saveBox\(|localStorage/.test(src);
    need(!room || !/shared\/storage\.js|localStorage/.test(src), "a room saves through its kit's box (m.saves), not straight to the browser");
    need(!saves || keeps.length, "it saves things but its card doesn't say what (keeps)");
    const others = [...new Set([...src.matchAll(/['"`](sadies-clubhouse\.[\w-]+\.)/g)].map(m => m[1]).filter(k => k !== own))];
    need(!others.length, `it names another activity's save: ${others.join(', ')}`);
    // its own checks: headless (run.mjs) and in a browser (browser.mjs), or nothing would ever test it
    const missing = ['run.mjs', 'browser.mjs'].filter(f => !existsSync(join(root, 'tests', id, f)));
    need(!missing.length, `it has no tests/${id}/${missing.join(' or ')} (every activity has its own checks)`);
    check(`room checker: ${id}'s card is right`, !bad.length, bad.join('; ') || `${where} ${n}${keeps.length ? ', saves ' + keeps.join(' ') : ', saves nothing'}`);
  }

  // nothing placed ever moves
  const was = JSON.parse(readFileSync(join(root, 'tests/clubhouse/spots.json'), 'utf8')), now = { slot: SLOTS, lot: LOTS, grounds: GROUNDS };
  for (const where of Object.keys(PLACES)) {
    const moved = was[where].map((o, i) => JSON.stringify(o) === JSON.stringify(now[where][i]) ? null : `${i}: was ${JSON.stringify(o)}, now ${JSON.stringify(now[where][i]) ?? 'gone'}`).filter(Boolean);
    const unlisted = now[where].length - was[where].length;
    check(`room checker: no ${where === 'slot' ? 'door' : where === 'lot' ? 'plot' : 'spot in the grounds'} has moved (tests/clubhouse/spots.json)`, !moved.length && !unlisted,
      moved.join('; ') || (unlisted > 0 ? `${unlisted} new one(s): add them to the end of its list in spots.json` : `${now[where].length}`));
  }

  // nothing shared between cards
  for (const where of Object.keys(PLACES)) {
    const taken = {};
    for (const { id, card } of cards) if (card[where] !== undefined) (taken[card[where]] ||= []).push(id);
    const twice = Object.entries(taken).filter(([, who]) => who.length > 1);
    check(`room checker: no two activities have the same ${where === 'slot' ? 'door' : where === 'lot' ? 'plot' : 'spot in the grounds'}`,
      !twice.length, twice.map(([n, who]) => `${n}: ${who.join(' and ')}`).join('; '));
  }
  const all = cards.flatMap(({ id, card }) => (card.keeps || []).map(k => ({ id, k }))).concat({ id: 'the mansion', k: 'mansion.' });
  const overlaps = all.flatMap(a => all.filter(b => a.id !== b.id && b.k.startsWith(a.k)).map(b => `${a.id} ${a.k} covers ${b.id} ${b.k}`));
  check(`room checker: no two activities' saves (or the mansion's) overlap`, !overlaps.length, overlaps.join('; '));
  return cards;
}
