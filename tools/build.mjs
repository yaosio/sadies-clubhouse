// Builds the game into one self-contained page: dist/index.html
//
// The page is the clubhouse (src/main.js, and its menu in src/clubhouse/) plus every activity in src/activities/: each folder with
// a card.js is one, found here so adding an activity never changes the clubhouse's code. An
// activity's .html and .css files come in as text (its card hands them to the clubhouse).
//
//   node tools/build.mjs              the real game (what goes on the game page)
//   node tools/build.mjs --preview    the test version (for the test page): same game, but it says
//                                     "test version" in the corner and in the tab title
//
// The page contains the bundled game plus a copy of every project file (as JSON in a
// <script type="application/json" id="jelly-source"> tag). That embedded copy is how the
// source travels with the published artifact: tools/unpack.mjs turns a built page back into
// the project folder.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
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

// the test version's label: in an activity's page where it says <!--@badge-->, else at the end
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
        text = text.replace('<!--@badge-->', preview && !badgePlaced ? badge() : '');
        if (preview) badgePlaced = true;
      }
      return { contents: text, loader: 'text' };
    });
  },
};

const result = await build({
  entryPoints: [join(root, 'src/main.js')],
  plugins: [clubhouse],
  loader: { '.css': 'text' },
  bundle: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  legalComments: 'none',
  minify: true,   // three.js (the clubhouse's 3D) is big; readable source travels in the page anyway
});
const js = result.outputFiles[0].text;
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
put('/*@script*/', js.replace(/<\/script/gi, '<\\/script'));
put('<!--@source-->', `<script type="application/json" id="jelly-source">${json}</script>`);

if (preview) {
  html = html.replace(/<title>(.*?)<\/title>/, '<title>$1 (test version)</title>');
  if (!badgePlaced) html = html.replace('</body>', badge() + '\n</body>');
}

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), html);
console.log(`built dist/index.html${preview ? ' (test version)' : ''}  ${(html.length / 1024).toFixed(1)} kB  (game ${(js.length / 1024).toFixed(1)} kB, ${activities.length} ${activities.length === 1 ? 'activity' : 'activities'}, ${Object.keys(files).length} source files embedded)`);
