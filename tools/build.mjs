// Builds the game: the page, dist/index.html, and its game files beside it in dist/game/
//
// The page is the clubhouse (src/main.js, and its menu in src/clubhouse/) plus every activity in src/activities/: each folder with
// a card.js is one, found here so adding an activity never changes the clubhouse's code. An
// activity's .html and .css files come in as text (its card hands them to the clubhouse).
//
//   node tools/build.mjs              the real game (what goes on the game page)
//   node tools/build.mjs --preview    the test version (for the test page): same game, but it says
//                                     "test version" in the corner and in the tab title
//   node tools/build.mjs --readable   not squeezed small, so function names and source files show
//                                     (tools/dropper-world/profile.mjs builds it this way)
//
// The game is split into files, fetched as they're needed: the clubhouse (main-*.js, with every
// activity's card), and in chunk-*.js files the mansion, each room or activity's own code, and the
// bits several of them share (three.js). dist/game-files.json says which is which. Walking up to a door fetches that room's file, so the page
// never grows with the number of rooms. Every file's name carries a fingerprint of what's in it, so
// a browser never mixes an old file with a new page.
//
// Beside the game files goes a copy of every project file (game/source-<fingerprint>.json, which the
// page names in a <link id="jelly-source">). That copy is how the source travels with the published
// artifact: tools/unpack.mjs turns a built page (and that file) back into the project folder. It used
// to be inside the page, which grew with every room towards the page limit (16 MB); nothing in the
// game ever fetches it.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, copyFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { activityIds } from './activities.mjs';

const root = new URL('..', import.meta.url).pathname;
const preview = process.argv.includes('--preview'), readable = process.argv.includes('--readable');
// (everything a checkout needs to be checked and built the same: the lockfile, Node's version, the
// linter's settings and GitHub's checks too, so `--live` can tell what's unchanged and an unpacked page is whole)
const EMBED = ['README.md', 'CLAUDE.md', '.gitignore', '.nvmrc', 'package.json', 'package-lock.json', 'eslint.config.js', '.github', 'docs', 'src', 'tests', 'tools'];

function collect(p, out) {
  const full = join(root, p);
  let st; try { st = statSync(full); } catch { return; }
  if (st.isDirectory()) { for (const f of readdirSync(full).sort()) collect(join(p, f), out); }
  else if (!full.endsWith('.woff2')) out[relative(root, full)] = readFileSync(full, 'utf8');   // (the fonts are files, not text: tools/fonts/get.mjs fetches them)
}

// the test version's label: in each activity's page where it says <!--@badge-->, else at the end
let when = '', commit = '', badgePlaced = false;
if (preview) {
  // which commit this is, so a test page can be matched to its code (not there in an unpacked copy)
  try { commit = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
  when = new Date().toISOString().slice(5, 16).replace('T', ' ') + ' UTC';
}
const badge = () => `<div id="testBadge" style="position:fixed;right:12px;top:calc(66px + env(safe-area-inset-top));` +
  `padding:2px 10px;border-radius:999px;background:#c2410cdd;color:#fff;font:600 11px/1.6 system-ui,sans-serif;` +
  `pointer-events:none;white-space:nowrap;opacity:.9">test version · ${when}${commit ? ' · ' + commit : ''}</div>`;

const activities = activityIds(root);
if (!activities.length) throw new Error('no activities in src/activities');
const clubhouse = {
  name: 'clubhouse',
  setup(b) {
    // import cards from 'activities': every activity's card, in folder order
    b.onResolve({ filter: /^activities$/ }, () => ({ path: 'activities', namespace: 'clubhouse' }));
    b.onLoad({ filter: /.*/, namespace: 'clubhouse' }, () => ({
      resolveDir: join(root, 'src'),
      contents: activities.map((d, i) => `import c${i} from './activities/${d}/card.js';`).join('\n') +
        `\nexport default [${activities.map((d, i) => 'c' + i).join(', ')}];`,
    }));
    b.onLoad({ filter: /\.html$/ }, a => {
      let text = readFileSync(a.path, 'utf8');
      if (text.includes('<!--@badge-->')) {
        text = text.replace('<!--@badge-->', preview ? badge() : ''); // every activity's page (only one is ever in the page at a time)
        if (preview) badgePlaced = true;
      }
      return { contents: text, loader: 'text' };
    });
  },
};

rmSync(join(root, 'dist/game'), { recursive: true, force: true });
const result = await build({
  entryPoints: [join(root, 'src/main.js')],
  plugins: [clubhouse],
  loader: { '.css': 'text' },
  bundle: true,
  splitting: true,   // each room's `import()` becomes a file of its own, fetched when it's needed
  format: 'esm',
  outdir: join(root, 'dist/game'),
  entryNames: '[name]-[hash]',
  chunkNames: 'chunk-[hash]',
  metafile: true,
  target: 'es2020',
  legalComments: 'eof',   // (three.js's licence notice has to stay with it)
  minify: !readable,   // three.js (the clubhouse's 3D) is big; readable source travels in the page anyway
  write: false,
  // A browser remembers a file that failed to come and won't fetch it again, so every file's
  // `import()` goes through fetchAgain: after a failure, the next try asks for it under a new name
  // (file.js?again=1), which the browser does fetch.
  banner: { js: 'var fetchAgain=u=>{const m=globalThis.gameMisses||={},n=m[u]|0;return import(u+(n?"?again="+n:"")).catch(e=>{m[u]=n+1;throw e})};' },
});
mkdirSync(join(root, 'dist/game'), { recursive: true });
// the fonts, files of the game's own (src/shared/fonts/, named in its fonts.css)
const FONTS = join(root, 'src/shared/fonts');
for (const f of readdirSync(FONTS)) if (f.endsWith('.woff2')) copyFileSync(join(FONTS, f), join(root, 'dist/game', f));
for (const f of result.outputFiles) {
  const text = f.text.replace(/\bimport\((".\/[\w-]+\.js")\)/g, 'fetchAgain($1)');
  writeFileSync(f.path, text);
}
const game = readdirSync(join(root, 'dist/game')).sort();
const main = Object.entries(result.metafile.outputs).find(([, o]) => o.entryPoint?.endsWith('src/main.js'))[0].split('/').pop();
const js = `import './game/${main}';`;
// which file each room's (and activity's) own code went into, for the checks: dist/game-files.json
const outputs = Object.fromEntries(Object.entries(result.metafile.outputs).filter(([, o]) => o.entryPoint)
  .map(([f, o]) => [o.entryPoint.replace(/^.*?src\//, 'src/'), f.split('/').pop()]));
writeFileSync(join(root, 'dist/game-files.json'), JSON.stringify(outputs, null, 1));
const gameKB = game.reduce((n, f) => n + statSync(join(root, 'dist/game', f)).size, 0) / 1024;
const biggest = Math.max(...game.map(f => statSync(join(root, 'dist/game', f)).size)) / 1024;
let html = readFileSync(join(root, 'src/index.html'), 'utf8');
// Every file the page needs before the mansion's first picture is asked for at once, at the top of the
// page (`modulepreload`): the clubhouse, the mansion, and everything they bring in (three.js). Left to
// itself, a browser only finds each one once the one before it has come, a wait for each in a row.
const out = result.metafile.outputs, mansionFile = Object.keys(out).find(f => out[f].entryPoint?.endsWith('src/clubhouse/mansion.js'));
const needs = new Set(), need = f => {
  if (!f || needs.has(f)) return;
  needs.add(f);
  for (const i of out[f].imports) if (i.kind === 'import-statement') need(i.path);
};
need(Object.keys(out).find(f => out[f].entryPoint?.endsWith('src/main.js'))); need(mansionFile);

const files = {};
for (const p of EMBED) collect(p, files);
const pkg = JSON.parse(files['package.json'] || '{}');
const bundle = { format: 'jelly-source/1', builtAt: new Date().toISOString(), version: pkg.version || '0', files };
// (its name's fingerprint is of the files alone, so the same project gets the same name)
const sourceFile = `source-${createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0, 8).toUpperCase()}.json`;
writeFileSync(join(root, 'dist/game', sourceFile), JSON.stringify(bundle));

const put = (marker, text) => {
  const i = html.indexOf(marker);
  if (i < 0) throw new Error('missing marker ' + marker);
  html = html.slice(0, i) + text + html.slice(i + marker.length);
};
put('/*@script*/', js);
put('<!--@preload-->', [...needs].map(f => `<link rel="modulepreload" href="./game/${f.split('/').pop()}">`).join('\n'));
// the rules for every font (a font is only fetched once something uses it), and the mansion's own two
// asked for straight away
put('<!--@fonts-->', `<style>${readFileSync(join(FONTS, 'fonts.css'), 'utf8').replace(/\/\*.*?\*\//g, '').trim()}</style>\n` +
  ['silkscreen-n400', 'silkscreen-n700', 'patrick-hand-n400'].map(n => `<link rel="preload" as="font" type="font/woff2" crossorigin href="./game/font-${n}.woff2">`).join('\n'));
put('<!--@source-->', `<link rel="alternate" type="application/json" id="jelly-source" href="./game/${sourceFile}">`);

if (preview) {
  html = html.replace(/<title>(.*?)<\/title>/, '<title>$1 (test version)</title>');
  if (!badgePlaced) html = html.replace('</body>', badge() + '\n</body>');
}

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), html);
console.log(`built dist/index.html${preview ? ' (test version)' : ''}  ${(html.length / 1024).toFixed(1)} kB  (game ${gameKB.toFixed(1)} kB in ${game.length} files in dist/game, the biggest ${biggest.toFixed(1)} kB; ${activities.length} ${activities.length === 1 ? 'activity' : 'activities'}, ${Object.keys(files).length} project files in game/${sourceFile})`);
