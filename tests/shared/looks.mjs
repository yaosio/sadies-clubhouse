// Something is drawn: a room drawing black, a missing texture turned one flat colour, the sky gone
// white, a page that never drew. Run by tools/check.mjs with no code of an activity's own, wherever
// it's already standing still (tests/shared/ears.mjs: in every room, wherever its door is: inside the
// house, outside the gate, in the grounds; and outside at the gate, in the hall) and on every activity started straight from its address (a computer's). It
// takes a picture of what you see and fails if it's nearly all one colour, or has hardly any colours
// at all. It can't tell a picture that's drawn wrong; only one that's missing.
import { DESKTOP } from './devices.mjs';

const MOST = 0.85, FEWEST = 12;

// what share of the picture its commonest colour covers, and how many colours it has (each counted
// roughly, 16 shades a channel, and only if it covers at least 1 in 2000 of the picture)
export async function picture(p) {
  const png = (await p.screenshot()).toString('base64');
  return p.evaluate(async png => {
    const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
    const w = 320, h = Math.round(img.height * w / img.width), c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data, n = new Map();
    for (let i = 0; i < d.length; i += 4) { const k = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | d[i + 2] >> 4; n.set(k, (n.get(k) || 0) + 1); }
    const all = w * h, counts = [...n.values()];
    return { most: Math.max(...counts) / all, colours: counts.filter(v => v >= all / 2000).length };
  }, png);
}

export async function looks(p, check, where) {
  const s = await picture(p).catch(e => ({ error: e.message.split('\n')[0] }));
  check(`what you see ${where} is drawn: not one colour`, !s.error && s.most <= MOST && s.colours >= FEWEST,
    s.error || `${Math.round(s.most * 100)}% one colour, ${s.colours} colours`);
}

// an activity started straight from its address (on a computer: not in the mansion)
export async function computerLooks({ browser, page, card, check }) {
  const ctx = await browser.newContext(DESKTOP);
  const p = await ctx.newPage();
  await p.goto(page + '#' + card.id);
  await p.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(2500);
  await looks(p, check, 'when it starts');
  await ctx.close().catch(() => {});
}
