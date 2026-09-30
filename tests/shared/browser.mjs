// What every room's browser checks start with (tests/<room>/browser.mjs, run by tools/check.mjs):
// the phone and the desktop side by side, each in its own browser window, with the page's errors
// collected, and the few moves every check makes in the mansion. A check that changes this file runs
// every room's browser checks again.
import { join } from 'node:path';

export const DEVICES = [
  ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['desktop', { viewport: { width: 1280, height: 800 } }],
];

// a browser window as that device, the web fonts answered with nothing (they can't be fetched from
// here; rather than log a network error), and every error on its page collected
export async function openDevice(browser, opts) {
  const ctx = await browser.newContext(opts);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  return { ctx, p, errors };
}

// `fn` run as the phone and the desktop at the same time, handed its kit:
//   device, opts, ctx, p (the page), errors
//   shot(name): a screenshot, dist/check/<room>/<device>-<name>.png
//   M(fn, ...args): the mansion's hook for the checks (window.__mansion)
//   up(): wait for the mansion to open and every room to be built (false if it doesn't)
//   walk(ms, key): hold a key down (W: forward) that long
//   use(): E on a desktop, the button on a phone
//   modeIs(mode): wait for the mansion to be in that mode ('play', 'arcade'...; false if it isn't)
export function bothDevices(browser, outDir, fn) {
  return Promise.all(DEVICES.map(async ([device, opts]) => {
    const { ctx, p, errors } = await openDevice(browser, opts);
    const kit = {
      device, opts, ctx, p, errors,
      shot: name => p.screenshot({ path: join(outDir, `${device}-${name}.png`) }),
      M: (f, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [f, a]),
      up: () => p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10 && window.__mansion.settled(), null, { timeout: 15000 }).then(() => true, () => false),
      walk: async (ms, key = 'KeyW') => { await p.keyboard.down(key); await p.waitForTimeout(ms); await p.keyboard.up(key); await p.waitForTimeout(100); },
      use: () => opts.hasTouch ? p.tap('#mansion #use') : p.keyboard.press('KeyE'),
      modeIs: m => p.waitForFunction(m => window.__mansion.mode() === m, m, { timeout: 5000 }).then(() => true, () => false),
    };
    try { await fn(kit); } finally { await ctx.close().catch(() => {}); }
  }));
}
