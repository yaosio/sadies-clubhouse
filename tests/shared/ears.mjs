// Kind to the ears (the owner has misophonia: nothing droning, constant or repetitive): standing
// still somewhere, doing nothing, the game must stay calm. Run by tools/check.mjs with no code of a
// room's own: in every room that lives in the mansion (after its own checks), and outside at the
// gate and in the hall (after the mansion's). For LISTEN seconds of the game's time it counts every
// sound played, by anyone (what you'd hear there, wherever it comes from), and fails on
//   - the same sound more than SAME times (a tick, a drip, a hum made of repeats),
//   - more than ALL sounds in all (a busy, never-quiet place),
//   - anything held on that isn't music (a line on the sounds or voices bus: a drone).
// Music is the sound system's own business (the main theme's checks, and a room's music only heard
// in its room). Today every place plays at most one sound standing still for 40 s; these limits
// leave room for a cat getting up to something, never for a sound that keeps on. While it stands
// there it also checks something is drawn (tests/shared/looks.mjs).
import { rest } from './browser.mjs';
import { looks } from './looks.mjs';
import { DESKTOP } from './devices.mjs';

const LISTEN = 30, SAME = 4, ALL = 12;

// counts by "owner/sound" over LISTEN seconds where you're standing now
async function listen(p, M) {
  const counts = s => Object.fromEntries(Object.entries(s.owners).flatMap(([o, v]) => Object.entries(v.counts || {}).map(([k, n]) => [`${o}/${k}`, n])));
  await rest(p, 1000);
  const a = counts(await M('sound'));
  await rest(p, LISTEN * 1000);
  const s = await M('sound'), b = counts(s);
  const heard = Object.fromEntries(Object.entries(b).map(([k, n]) => [k, n - (a[k] || 0)]).filter(([, n]) => n > 0));
  const held = Object.entries(s.owners).filter(([, v]) => v.held).map(([o, v]) => `${o} holds ${v.held}`);
  return { heard, held };
}

function judge(check, where, { heard, held }) {
  const total = Object.values(heard).reduce((a, n) => a + n, 0), same = Object.entries(heard).filter(([, n]) => n > SAME);
  const list = Object.entries(heard).map(([k, n]) => `${k.replace('room:', '')} ${n}`).join(', ') || 'nothing';
  check(`standing still ${where} for ${LISTEN} s is calm: nothing repeating, nothing held on`, !same.length && total <= ALL && !held.length,
    same.length ? `over and over: ${same.map(([k, n]) => `${k} ${n} times`).join(', ')}` : total > ALL ? `${total} sounds: ${list}` : held.length ? held.join(', ') : `heard ${list}`);
}

async function open(browser, page) {
  const ctx = await browser.newContext(DESKTOP);
  const p = await ctx.newPage();
  await p.goto(page);
  const ok = await p.waitForFunction(() => window.__mansion?.frames() > 10 && window.__mansion.settled(), null, { timeout: 30000 }).then(() => true, () => false);
  if (ok) { await p.click('#ok').catch(() => {}); await p.keyboard.press('Shift'); }   // (a press wakes the sound)
  return { ctx, p, ok, M: (f, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [f, a]) };
}

// in a room that lives in the mansion, a couple of metres in from its door
export async function roomEars({ browser, page, card, check }) {
  const { ctx, p, ok, M } = await open(browser, page);
  if (!ok || !(await M('faceDoor', 'room:' + card.id, 'door', 2.5))) check('it can be stood in, to listen', false);
  else { judge(check, 'in it', await listen(p, M)); await looks(p, check, 'in it'); }
  await ctx.close().catch(() => {});
}

// outside at the gate (where the game opens), and in the hall in front of a door
export async function houseEars({ browser, page, cards, check }) {
  const { ctx, p, ok, M } = await open(browser, page);
  if (!ok) check('the mansion opens, to listen', false);
  else {
    judge(check, 'outside at the gate', await listen(p, M)); await looks(p, check, 'outside at the gate');
    const door = cards.find(c => c.slot !== undefined)?.id;
    if (door && await M('faceDoor', 'hall', door, 3)) { judge(check, 'in the hall', await listen(p, M)); await looks(p, check, 'in the hall'); }
  }
  await ctx.close().catch(() => {});
}
