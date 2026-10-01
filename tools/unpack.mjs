// Recreates the project folder from a built page (for example the published artifact).
//
//   node tools/unpack.mjs path/to/index.html [target-folder]
//
// The copy of the project is a file beside the page (game/source-*.json, named in the page), so
// save that too, in a game/ folder next to the page. Needs nothing but Node, so it can be run on a
// freshly downloaded page before anything is installed.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { readSource } from './source.mjs';

const [src, target = '.'] = process.argv.slice(2);
if (!src) { console.error('usage: node tools/unpack.mjs <built.html> [target-folder]'); process.exit(1); }
const bundle = readSource(src);
if (!bundle) { console.error('no copy of the project found with ' + src); process.exit(1); }
for (const [path, text] of Object.entries(bundle.files)) {
  const out = join(target, path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, text);
}
console.log(`unpacked ${Object.keys(bundle.files).length} files (built ${bundle.builtAt}) into ${target}`);
