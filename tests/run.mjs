// Runs every activity's headless tests (tests/<activity>/run.mjs), one activity after another:
//
//   npm test                     all of them
//   npm test -- dropper-world    just one activity's
//
// Each activity's tests only load that activity's code and the shared toolbox, so they can be run
// (and pass or fail) on their own; tools/check.mjs uses that to skip the ones whose code didn't change.
import { spawnSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const here = new URL('.', import.meta.url).pathname;
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const all = readdirSync(here).sort().filter(d => existsSync(join(here, d, 'run.mjs')));
let bad = 0;
for (const a of only.length ? only : all) {
  console.log(`\n==== ${a}`);
  if (spawnSync(process.execPath, [join(here, a, 'run.mjs')], { stdio: 'inherit' }).status !== 0) bad++;
}
process.exit(bad ? 1 : 0);
