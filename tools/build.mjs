// Builds the game: the page, dist/index.html, and its game files beside it in dist/game/
//
// The page is the clubhouse (src/main.js, and its menu in src/clubhouse/) plus every activity in src/activities/: each folder with
// a card.js is one, found here so adding an activity never changes the clubhouse's code. An
// activity's .html and .css files come in as text (its card hands them to the clubhouse).
//
//   node tools/build.mjs              the real game (what goes on the game page)
//   node tools/build.mjs --preview    the test version (for the test page): same game, but it says
//                                     "test version" in the corner and in the tab title
//
// The game is split into files, fetched as they're needed: the clubhouse (main-*.js, with the mansion
// and every activity's card), each room or activity's own code (room-*.js, main-*.js), and the bits
// several of them share (chunk-*.js). Walking up to a door fetches that room's file, so the page
// never grows with the number of rooms. Every file's name carries a fingerprint of what's in it, so
// a browser never mixes an old file with a new page.
//
// The page contains a loader for the game plus a copy of every project file (as JSON in a
// <script type="application/json" id="jelly-source"> tag). That embedded copy is how the
// source travels with the published artifact: tools/unpack.mjs turns a built page back into
// the project folder.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const preview = process.argv.includes('--preview');
const EMBED = ['README.md', 'CLAUDE.md', '.gitignore', 'package.json', 'docs', 'src', 'tests', 'tools'];

function collect(p, out) {
  const full = join(root, p);
  let st; try { st = statSync(full); } catch { return; }
  if (st.isDirectory()) { for (const f of readdirSync(full).sort()) collect(join(p, f), out); }
  else out[relative(root, full)] = readFileSync(full, 'utf8');
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

const activities = readdirSync(join(root, 'src/activities')).sort()
  .filter(d => existsSync(join(root, 'src/activities', d, 'card.js')));
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
  legalComments: 'none',
  minify: true,   // three.js (the clubhouse's 3D) is big; readable source travels in the page anyway
  write: false,
  // A browser remembers a file that failed to come and won't fetch it again, so every file's
  // `import()` goes through fetchAgain: after a failure, the next try asks for it under a new name
  // (file.js?again=1), which the browser does fetch.
  banner: { js: 'var fetchAgain=u=>{const m=globalThis.gameMisses||={},n=m[u]|0;return import(u+(n?"?again="+n:"")).catch(e=>{m[u]=n+1;throw e})};' },
});
mkdirSync(join(root, 'dist/game'), { recursive: true });
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
put('/*@script*/', js);
put('<!--@source-->', `<script type="application/json" id="jelly-source">${json}</script>`);

if (preview) {
  html = html.replace(/<title>(.*?)<\/title>/, '<title>$1 (test version)</title>');
  if (!badgePlaced) html = html.replace('</body>', badge() + '\n</body>');
}

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), html);
console.log(`built dist/index.html${preview ? ' (test version)' : ''}  ${(html.length / 1024).toFixed(1)} kB  (game ${gameKB.toFixed(1)} kB in ${game.length} files in dist/game, the biggest ${biggest.toFixed(1)} kB; ${activities.length} ${activities.length === 1 ? 'activity' : 'activities'}, ${Object.keys(files).length} source files embedded)`);
