// What every tool that opens a hidden browser starts with (tools/<room>/*.mjs): Playwright, found
// in the project or, failing that, wherever npm keeps things installed for everyone; a browser that
// draws 3D without a graphics card. The checks' own version is tests/shared/browser.mjs.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { PHONE, DESKTOP } from '../tests/shared/devices.mjs';

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
export const DEVICES = { desktop: DESKTOP, phone: PHONE };
