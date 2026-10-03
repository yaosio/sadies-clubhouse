// TypeFitter in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs (never
// on its own) with the built page, whenever this activity's code, the clubhouse's shell, the toolbox
// or the build changed since these last passed.
//
// It opens the activity, checks Sadie's picture is drawn and the frame has no windows in it, presses
// buttons until the TEXT LOVE meter fills (never more than 10), checks the box never fits the text,
// presses FIT IT!, waits for the win and the certificate, goes on to the next sentence, and opens
// README.TXT. Screenshots in dist/check/typefitter/. Any error on the page is a failure.
import { join } from 'node:path';

export default async function ({ browser, page, check, outDir }) {
  const DEVICES = [
    ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
    ['desktop', { viewport: { width: 1280, height: 800 } }],
  ];
  // the phone and the desktop at the same time (each in its own browser window)
  await Promise.all(DEVICES.map(async ([device, opts]) => {
    const ctx = await browser.newContext(opts);
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const shot = name => p.screenshot({ path: join(outDir, `${device}-${name}.png`) });
    const info = () => p.evaluate(() => window.__typefitter());
    const press = sel => opts.hasTouch ? p.tap(sel) : p.click(sel);

    await p.goto(page + '#typefitter');
    const started = await p.waitForFunction(() => window.__typefitter && window.__typefitter().text, null, { timeout: 8000 }).then(() => true, () => false);
    await p.waitForTimeout(800);
    await shot('0-start');
    let d = await info();
    check(`${device}: TypeFitter starts, with a sentence in a box`, started && d.text?.w > 0, d.text && `text ${d.text.w.toFixed(0)} px wide, box ${d.box.w.toFixed(0)}`);
    check(`${device}: Sadie's picture is drawn`, d.scanDrawn > 0.9, `${(d.scanDrawn * 100).toFixed(0)}% of it`);
    const layout = await p.evaluate(() => {
      const r = id => document.getElementById(id).getBoundingClientRect(), doc = r('doc'), fit = r('fit'), back = document.getElementById('clubBack')?.getBoundingClientRect();
      const logo = document.querySelector('#tf .mlogo').getBoundingClientRect();
      return { docShare: doc.width * doc.height / (innerWidth * innerHeight), fitVisible: fit.bottom <= innerHeight && fit.height > 20,
        logoClear: !back || logo.left >= back.right - 1, wide: document.documentElement.scrollWidth <= innerWidth,
        windows: document.querySelectorAll('#tf .title, #tf .menu, #tf .win').length };
    });
    check(`${device}: the page with the text gets a good share of the screen`, layout.docShare > 0.18, `${(layout.docShare * 100).toFixed(0)}%`);
    check(`${device}: FIT IT! is on screen, and the ESC BACK key doesn't cover the name`, layout.fitVisible && layout.logoClear);
    check(`${device}: no windows in the frame, and nothing wider than the screen`, !layout.windows && layout.wide);
    // a short desktop window (a laptop with its toolbars, or the game page's own frame): Sadie's
    // picture shrinks so the meter and FIT IT! still fit under it
    if (!opts.hasTouch) {
      const short = [];
      for (const [w, h] of [[1280, 600], [1024, 560], [1440, 640]]) {
        await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(150);
        if (!(await p.evaluate(() => { const f = document.getElementById('fit').getBoundingClientRect(), m = document.getElementById('hearts').getBoundingClientRect(); return f.bottom <= innerHeight && m.bottom <= f.top; }))) short.push(`${w}x${h}`);
      }
      await shot('0b-short-window');
      await p.setViewportSize(opts.viewport); await p.waitForTimeout(150);
      check(`${device}: ...and in a short window too, with the love meter`, !short.length, short.length ? `cut off at ${short.join(', ')}` : '');
    }

    // press buttons until Sadie loves it; the box never fits along the way
    const buttons = ['bold', 'warp', 'outline', 'font', 'color', 'shadow', 'bigger', 'italic', 'symbols', 'squeeze', 'underline', 'smaller'];
    let presses = 0, fitted = 0, closest = Infinity;
    for (const fx of buttons) {
      await press(`#tools [data-fx=${fx}]`); presses++;
      await p.waitForTimeout(120);
      d = await info();
      if (d.box.w >= d.text.w || d.box.h >= d.text.h) fitted++;
      closest = Math.min(closest, d.text.w - d.box.w);
      if (d.full) break;
    }
    await shot('1-full');
    check(`${device}: the TEXT LOVE meter fills within 10 changes`, d.full && presses <= 10, `${presses} changes`);
    check(`${device}: the text never fits the box`, !fitted, `closest ${closest.toFixed(0)} px too wide`);
    check(`${device}: Sadie says something about it`, /PERFECT|PRESS/.test(d.bubble), JSON.stringify(d.bubble.slice(0, 60)));
    check(`${device}: FIT IT! lights up`, await p.evaluate(() => !document.getElementById('fit').disabled && document.getElementById('fit').classList.contains('ready')));

    await press('#fit');
    await p.waitForTimeout(1500);
    d = await info();
    await shot('2-fitting');
    check(`${device}: FIT IT! starts fitting`, d.dialog === 'FITTING TEXT...' && d.busy);
    const won = await p.waitForFunction(() => { const b = document.getElementById('nextBtn'); return b && !b.hidden; }, null, { timeout: 15000 }).then(() => true, () => false);
    d = await info();
    const cert = await p.evaluate(() => document.getElementById('paper')?.textContent || '');
    await shot('3-won');
    check(`${device}: ...it doesn't fit, and you win anyway, with a certificate`, won && d.dialog === 'CONGRATULATIONS!' && /CERTIFICATE OF FITNESS/.test(cert) && /SADIE/.test(cert));
    await press('#nextBtn'); await p.waitForTimeout(500);
    d = await info();
    check(`${device}: NEXT SENTENCE starts a new round, meter empty`, !d.dialog && d.round === 1 && d.love === 0 && !d.busy);

    await press('#readmeKey'); await p.waitForTimeout(300);
    const readme = await p.evaluate(() => document.querySelector('#veil .readme')?.textContent || '');
    await shot('4-readme');
    check(`${device}: README.TXT admits the text never fits, on purpose`, /never fit/i.test(readme));
    if (!opts.hasTouch) {
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      d = await info();
      check(`${device}: Escape closes it (and stays in TypeFitter)`, !d.dialog && await p.evaluate(() => !!window.__typefitter));
      await p.keyboard.press('b'); await p.waitForTimeout(150);
      check(`${device}: the keys work the buttons (B for bold)`, (await info()).changes === 1);
    } else {
      await press('#okBtn'); await p.waitForTimeout(200);
    }
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }));
}
