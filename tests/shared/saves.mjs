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
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const dirOf = (root, id) => join(root, 'tests/saves', id);
const ownKey = (keeps, k) => keeps.some(p => k.startsWith(p)) && !k.endsWith('.unreadable');

// the shape of a save: its keys, and for each the outline of what's in it (objects' fields, the
// first item of a list, the kind of each value), never the values themselves
function outline(v) {
  if (Array.isArray(v)) return v.length ? [outline(v[0])] : [];
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, outline(v[k])]));
  return v === null ? 'null' : typeof v;
}
function shapeOf(saves, keeps) {
  const read = s => { try { return outline(JSON.parse(s)); } catch { return 'text'; } };
  return JSON.stringify(Object.keys(saves).filter(k => ownKey(keeps, k)).sort().map(k => [k, read(saves[k])]));
}

// After its checks: the fullest set of saves any page of them had (`dumps`: every page's saves, as
// each window closed), kept as a new sample if no sample has its shape. The sample carries the
// mansion's saves too, so the game opens on it as it was. Returns the new file's name, or null.
export function keepSample({ root, id, keeps, dumps }) {
  if (!keeps.length) return null;
  const own = d => Object.keys(d).filter(k => ownKey(keeps, k)).length;
  const best = dumps.filter(own).sort((a, b) => own(b) - own(a) || JSON.stringify(b).length - JSON.stringify(a).length)[0];
  if (!best) return null;
  const sample = Object.fromEntries(Object.entries(best).filter(([k]) => ownKey(keeps, k) || k.startsWith('mansion.')));
  const dir = dirOf(root, id), shape = shapeOf(sample, keeps);
  const have = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')) : [];
  if (have.some(f => shapeOf(JSON.parse(readFileSync(join(dir, f), 'utf8')), keeps) === shape)) return null;
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
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json') && !skip.includes(f)).sort()) {
    const saves = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
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
