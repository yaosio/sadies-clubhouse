// Builds the mansion mock-up into one page: dist/mansion/mockup.html
//   node art/mansion/build.mjs
// Then art/mansion/shots.mjs takes its pictures.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const here = new URL('.', import.meta.url).pathname, root = join(here, '../..');
const r = await build({ entryPoints: [join(here, 'page.js')], bundle: true, format: 'esm', target: 'es2022', write: false, minify: true, legalComments: 'none' });
const html = readFileSync(join(here, 'mockup.html'), 'utf8').replace('/*@script*/', () => r.outputFiles[0].text.replace(/<\/script/g, '<\\/script'));
mkdirSync(join(root, 'dist/mansion'), { recursive: true });
writeFileSync(join(root, 'dist/mansion/mockup.html'), html);
console.log(`dist/mansion/mockup.html: ${(html.length / 1024).toFixed(0)} KB`);
