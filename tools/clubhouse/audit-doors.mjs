// Lists flat surfaces that sit on (within 2 cm of) a doorway's see-through box faces.
import { serve } from '../serve.mjs';
import { launch, DEVICES } from '../browser.mjs';
const server = await serve(), browser = await launch();
const p = await browser.newPage(DEVICES.desktop);
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 5 && window.__clubhouse.settled(), null, { timeout: 60000 });
for (const r of await p.evaluate(() => window.__clubhouse.audit())) console.log(r.w, '->', r.to, JSON.stringify(r.hits));
await browser.close(); server.close();
