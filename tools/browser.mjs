// What every tool that opens a hidden browser starts with (tools/<room>/*.mjs): Playwright, found
// in the project or, failing that, wherever npm keeps things installed for everyone; a browser that
// draws 3D without a graphics card; and the web fonts answered with nothing (they can't be fetched
// from here, and would only log a network error). The checks' own version is tests/shared/browser.mjs.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
export const chromium = (() => {
  try { return require('playwright').chromium; }
  catch {
    try { return require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright')).chromium; }
    catch { console.log('Playwright is not installed (npm install), so nothing can be opened in a browser'); process.exit(1); }
  }
})();

// a hidden browser that draws 3D in software (`more`: any other switches it needs)
export const launch = (more = []) => chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', ...more] });

// the screens the tools look at things on
export const DEVICES = {
  desktop: { viewport: { width: 1280, height: 800 } },
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};

// the web fonts answered with nothing, on a browser window or one page
export const quietFonts = at => at.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
