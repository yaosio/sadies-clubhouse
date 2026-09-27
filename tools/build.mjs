// Builds the game into one self-contained page: dist/index.html
//
//   node tools/build.mjs
//
// The page contains the bundled game plus a copy of every project file (as JSON in a
// <script type="application/json" id="jelly-source"> tag). That embedded copy is how the
// source travels with the published artifact: tools/unpack.mjs turns a built page back into
// the project folder.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const EMBED = ['README.md', '.gitignore', 'package.json', 'docs', 'src', 'tests', 'tools'];

function collect(p, out) {
  const full = join(root, p);
  let st; try { st = statSync(full); } catch { return; }
  if (st.isDirectory()) { for (const f of readdirSync(full).sort()) collect(join(p, f), out); }
  else out[relative(root, full)] = readFileSync(full, 'utf8');
}

const result = await build({
  entryPoints: [join(root, 'src/main.js')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  legalComments: 'none',
});
const js = result.outputFiles[0].text;
const css = readFileSync(join(root, 'src/styles.css'), 'utf8');
let html = readFileSync(join(root, 'src/index.html'), 'utf8');

const files = {};
for (const p of EMBED) collect(p, files);
const pkg = JSON.parse(files['package.json'] || '{}');
const bundle = { format: 'jelly-source/1', builtAt: new Date().toISOString(), version: pkg.version || '0', files };
// "<" is escaped so nothing inside the JSON can close the script tag early
const json = JSON.stringify(bundle).replace(/</g, '\\u003c');

const put = (marker, text) => {
  const i = html.indexOf(marker);
  if (i < 0) throw new Error('missing marker ' + marker);
  html = html.slice(0, i) + text + html.slice(i + marker.length);
};
put('/*@styles*/', css);
put('/*@script*/', js.replace(/<\/script/gi, '<\\/script'));
put('<!--@source-->', `<script type="application/json" id="jelly-source">${json}</script>`);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), html);
console.log(`built dist/index.html  ${(html.length / 1024).toFixed(1)} kB  (game ${(js.length / 1024).toFixed(1)} kB, ${Object.keys(files).length} source files embedded)`);
