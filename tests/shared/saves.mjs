// Old saves still load: every activity's saves, as they were written by earlier versions of the
// game, are put back in a fresh browser and the game opened on them. Nothing may be put aside as
// unreadable (the save director keeps a save it can't read as `<key>.unreadable`), the activity must
// still have saves of its own afterwards (not have started fresh over them), and the page must have
// no errors. Run by tools/check.mjs for every activity that saves anything, after its own browser
// checks, with no code of the activity's own: a new activity is covered the moment it saves.
//
// The samples are tests/saves/<activity>/*.json, one file per shape its saves have ever had (which
// keys, and how each one's insides are laid out; not the values). They make themselves: while an
// activity's browser checks play it, tools/check.mjs keeps what it saved, and if that's a shape no
// sample has yet (its saves changed, or it has none), it's written as a new sample, to be committed
// with the change (never on GitHub). So the shape a version saved in is kept before the next
// version can change it, and every later version is checked against all of them.
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DESKTOP } from './devices.mjs';

const SAMPLE_MAX = 50e3, TOTAL_MAX = 500e3;   // bytes: one sample, and all of an activity's
const dirOf = (root, id) => join(root, 'tests/saves', id);
const ownKey = (keeps, k) => keeps.some(p => k.startsWith(p)) && !k.endsWith('.unreadable');

// the shape of a save: its keys, and for each the outline of what's in it (objects' fields, every
// item of a list put together, the kind of each value), never the values themselves. A `null` is
// kept as 'null', which matches anything (a mole holding a piece or not isn't a different format).
const bothObjects = (a, b) => a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b);
const merge = (a, b) => a === undefined || a === 'null' ? b : b === undefined || b === 'null' ? a : bothObjects(a, b)
  ? Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].sort().map(k => [k, merge(a[k], b[k])])) : a;
function outline(v) {
  if (Array.isArray(v)) return v.length ? [v.map(outline).reduce(merge)] : [];
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, outline(v[k])]));
  return v === null ? 'null' : typeof v;
}
function shapeOf(saves, keeps) {
  const read = s => { try { return outline(JSON.parse(s)); } catch { return 'text'; } };
  return Object.fromEntries(Object.keys(saves).filter(k => ownKey(keeps, k)).sort().map(k => [k, read(saves[k])]));
}
// Is everything in shape `a` already in shape `b`? (a save with less in it just now, an empty list,
// isn't a new format; a key or kind of value `b` has never seen is)
const covered = (a, b) => a === undefined || a === 'null' || b === 'null' || (bothObjects(a, b) ? Object.keys(a).every(k => covered(a[k], b[k]))
  : Array.isArray(a) ? Array.isArray(b) && (!a.length || !b.length || covered(a[0], b[0])) : a === b);

// After its checks: the fullest set of saves any page of them had (`dumps`: every page's saves, as
// each window closed), kept as a new sample if no sample has its shape. The sample carries the
// mansion's saves too, so the game opens on it as it was. Returns the new file's name, or null.
export function keepSample({ root, id, keeps, dumps }) {
  if (!keeps.length) return null;
  const own = d => Object.keys(d).filter(k => ownKey(keeps, k)).length;
  // (the one with the most saves of its own, then the smallest: a sample is for its shape, not its size)
  const best = dumps.filter(own).sort((a, b) => own(b) - own(a) || JSON.stringify(a).length - JSON.stringify(b).length)[0];
  if (!best) return null;
  const sample = Object.fromEntries(Object.entries(best).filter(([k]) => ownKey(keeps, k) || k.startsWith('mansion.')));
  const dir = dirOf(root, id), shape = shapeOf(sample, keeps);
  const have = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')) : [];
  if (have.some(f => covered(shape, shapeOf(JSON.parse(readFileSync(join(dir, f), 'utf8')), keeps)))) return null;
  const commit = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root }).stdout?.toString().trim() || 'unknown';
  const name = `${new Date().toISOString().slice(0, 10)}-${commit}.json`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), JSON.stringify(sample, null, 1) + '\n');
  return name;
}

// Open the game on each of its samples (but `skip`: ones written just now, already the current
// shape) and check nothing was lost.
export async function oldSaves({ browser, page, card, check, root, skip = [] }) {
  const id = card.id, keeps = card.keeps || [], dir = dirOf(root, id);
  if (!keeps.length || !existsSync(dir)) return;
  // samples stay small: they ship in the project copy and every check loads each one
  const sizes = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => [f, statSync(join(dir, f)).size]);
  const big = sizes.filter(([, n]) => n > SAMPLE_MAX), total = sizes.reduce((n, [, b]) => n + b, 0);
  check('its old-saves samples stay small', !big.length && total <= TOTAL_MAX,
    big.length ? `${big.map(([f, n]) => `${f} is ${Math.round(n / 1024)} KB`).join(', ')} (over ${SAMPLE_MAX / 1024} KB: trim it to a few pieces of each kind)` : total > TOTAL_MAX ? `${Math.round(total / 1024)} KB in all, over ${TOTAL_MAX / 1024} KB` : `${sizes.length} samples, ${Math.round(total / 1024)} KB`);
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json') && !skip.includes(f)).sort()) {
    const saves = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const ctx = await browser.newContext(DESKTOP);
    // (the saves go in before the game starts, once: not again on a reload)
    await ctx.addInitScript(saves => {
      if (sessionStorage.getItem('saves-put-back')) return;
      localStorage.clear(); for (const [k, v] of Object.entries(saves)) localStorage.setItem(k, v);
      sessionStorage.setItem('saves-put-back', '1');
    }, saves);
    const p = await ctx.newPage(), errors = [];
    p.on('pageerror', e => errors.push(e.message.split('\n')[0]));
    let opened;
    if (card.room) {
      // in its room in the mansion: built (reading its saves), run a moment, then put away (saving)
      await p.goto(page);
      opened = await p.waitForFunction(n => window.__mansion?.settled() && window.__mansion.built().includes(n), 'room:' + id, { timeout: 30000 }).then(() => true, () => false);
      if (opened) {
        await p.evaluate(n => window.__mansion.faceDoor(n, 'door', 2), 'room:' + id).catch(() => {});
        await p.waitForTimeout(1500);
        await p.evaluate(n => window.__mansion.putAway(n), 'room:' + id).catch(() => {});
      }
    } else {
      // on a computer: started straight from its address, run a moment, then the page left (saving)
      await p.goto(page + '#' + id);
      opened = await p.waitForLoadState('networkidle', { timeout: 30000 }).then(() => true, () => false);
      await p.waitForTimeout(2500);
      await p.evaluate(() => dispatchEvent(new Event('pagehide'))).catch(() => {});
    }
    const after = await p.evaluate(() => ({ ...localStorage })).catch(() => ({}));
    await ctx.close().catch(() => {});
    const before = Object.keys(saves).filter(k => ownKey(keeps, k)), now = Object.keys(after).filter(k => ownKey(keeps, k));
    const putAside = Object.keys(after).filter(k => k.endsWith('.unreadable') && !(k in saves));
    check(`its saves from ${f.replace('.json', '')} still load`, opened && !putAside.length && (!before.length || now.length) && !errors.length,
      !opened ? 'the game never opened on them' : putAside.length ? `put aside as unreadable: ${putAside.join(', ')}`
        : before.length && !now.length ? 'none of its saves were left afterwards' : errors.length ? errors[0] : `${before.length} saves`);
  }
}
