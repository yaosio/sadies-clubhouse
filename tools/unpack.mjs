// Recreates the project folder from a built page (for example the published artifact).
//
//   node tools/unpack.mjs path/to/index.html [target-folder]
//
// Needs nothing but Node, so it can be run on a freshly downloaded page before anything is installed.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [src, target = '.'] = process.argv.slice(2);
if (!src) { console.error('usage: node tools/unpack.mjs <built.html> [target-folder]'); process.exit(1); }
const html = readFileSync(src, 'utf8');
const m = html.match(/<script type="application\/json" id="jelly-source">([\s\S]*?)<\/script>/);
if (!m) { console.error('no embedded source found in ' + src); process.exit(1); }
const bundle = JSON.parse(m[1]);
for (const [path, text] of Object.entries(bundle.files)) {
  const out = join(target, path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, text);
}
console.log(`unpacked ${Object.keys(bundle.files).length} files (built ${bundle.builtAt}) into ${target}`);
