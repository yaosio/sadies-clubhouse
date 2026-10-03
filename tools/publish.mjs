// Gets a build ready to publish, and checks everything CLAUDE.md asks before a publish. It doesn't
// publish (Claude does that, with the Artifact tool): it prints what to pass.
//
//   node tools/publish.mjs --live <folder> [--published <file>]
//       the real game, from main's latest commit: built without --preview, its test label must be
//       missing, and the live page's copy of the project (the page saved in <folder> with its
//       game/source-*.json) must be one of main's commits (the one last published; or --against
//       <commit>): if it isn't, the game was changed some other way, so stop and ask
//   node tools/publish.mjs --preview --to <folder outside dist/> [--published <file>]
//       the test page: built with --preview (its label must be there) and copied to <folder>
//
// --published names a file listing the paths the page has now (the Artifact tool's file listing,
// pasted, one per line or as JSON: anything that looks like game/<name>): every game/ file this
// build doesn't have is passed as null, so old files don't pile up. Prints, and writes beside the
// page as publish.json: { file_path, files, capabilities }. Exits 1 if anything is wrong.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readSource } from './source.mjs';

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const valueOf = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const preview = args.includes('--preview'), live = valueOf('--live'), listing = valueOf('--published');
const git = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8' });
let wrong = 0;
const say = (ok, what, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? `  (${detail})` : ''}`); if (!ok) wrong++; };
const stop = () => { console.log(`\n${wrong} thing(s) wrong: not ready to publish`); process.exit(1); };

// where it goes: the test page is published from a copy outside dist/, so it can never be the real one
const to = resolve(preview ? valueOf('--to') || '' : valueOf('--to') || join(root, 'dist'));
if (preview && (!valueOf('--to') || to.startsWith(resolve(root, 'dist')))) { say(false, 'the test page is copied outside dist/', 'pass --to <folder>'); stop(); }
if (!preview && !live) { say(false, "the live page's copy of the project is compared with main", 'pass --live <folder>'); stop(); }

// the real game: from main's latest commit, nothing changed by hand
const head = git('rev-parse', 'HEAD').stdout.trim();
if (!preview) {
  git('fetch', '-q', 'origin', 'main');
  const main = git('rev-parse', 'origin/main').stdout.trim();
  say(head === main, "it's main's latest commit", `${head.slice(0, 7)}${head === main ? '' : `, main is ${main.slice(0, 7)}`}`);
  say(!git('status', '--porcelain', '--untracked-files=no').stdout.trim(), 'nothing changed by hand since that commit');
  // the live page holds what main was at some earlier commit (the last time it was published): if no
  // commit of main's matches it, someone changed the game another way, so stop and ask
  const page = join(live, 'index.html');
  let bundle = null;
  try { bundle = existsSync(page) ? readSource(page) : null; } catch (e) { say(false, "the live page's copy of the project was read", e.message); }
  if (bundle) {
    const blob = text => { const b = Buffer.from(text); return createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'); };
    const mine = Object.entries(bundle.files).map(([path, text]) => [path, blob(text)]);
    const tree = c => new Map(git('ls-tree', '-r', c).stdout.trim().split('\n').map(l => { const [meta, path] = l.split('\t'); return [path, meta.split(' ')[2]]; }));
    const differs = c => { const t = tree(c); return mine.filter(([path, h]) => t.get(path) !== h).map(([p]) => p); };
    const commits = valueOf('--against') ? [valueOf('--against')] : git('rev-list', '--first-parent', '-60', 'HEAD').stdout.trim().split('\n');
    const match = commits.find(c => !differs(c).length);
    const near = differs(commits[0]);
    say(!!match, "the live page's copy of the project is one of main's commits", match
      ? `${git('log', '-1', '--format=%h %s', match).stdout.trim()}; ${Object.keys(bundle.files).length} files, built ${bundle.builtAt}`
      : `none of the last ${commits.length} match; against ${commits[0].slice(0, 7)} it differs in ${near.slice(0, 5).join(', ')}${near.length > 5 ? ` and ${near.length - 5} more` : ''}`);
  } else if (!wrong) say(false, "the live page's copy of the project was found", `save the page as ${page}, with its game/source-*.json beside it`);
  if (wrong) stop();
}

// build it (after the commit, so its label names it)
const built = spawnSync('node', ['tools/build.mjs', ...(preview ? ['--preview'] : [])], { cwd: root, encoding: 'utf8' });
say(!built.status, 'it builds', built.status ? built.stderr.split('\n')[0] : built.stdout.trim().split('\n').pop());
if (wrong) stop();
// (the label is in the page or an activity's file; the project's copy names it too, in the build tool's code)
const game = readdirSync(join(root, 'dist/game')).sort();
const labels = ['index.html', ...game.filter(f => !f.startsWith('source-')).map(f => 'game/' + f)]
  .reduce((n, f) => n + readFileSync(join(root, 'dist', f), 'utf8').split('<div id="testBadge"').length - 1, 0);
say(preview ? labels > 0 : labels === 0, preview ? 'the test label is on it' : 'the test label is not on it', `${labels} found`);

// copy it where it's published from (the real one is published straight from dist/)
if (to !== resolve(root, 'dist')) {
  rmSync(join(to, 'game'), { recursive: true, force: true }); mkdirSync(to, { recursive: true });
  cpSync(join(root, 'dist/index.html'), join(to, 'index.html')); cpSync(join(root, 'dist/game'), join(to, 'game'), { recursive: true });
}

// what to pass: every game file, and null for the page's old ones
const files = Object.fromEntries(game.map(f => [`game/${f}`, join(to, 'game', f)]));
let old = [];
if (listing) {
  const had = [...new Set(readFileSync(listing, 'utf8').match(/game\/[\w.-]+/g) || [])];
  old = had.filter(p => !(p in files));
  for (const p of old) files[p] = null;
} else console.log('(no --published listing: the page\'s old game/ files are left as they are)');
say(game.some(f => f.startsWith('source-')), "the project's copy goes with it");
const out = { file_path: join(to, 'index.html'), files, capabilities: { downloads: true } };
writeFileSync(join(to, 'publish.json'), JSON.stringify(out, null, 1));
console.log(`\n${game.length} game files, ${old.length} old ones removed, built at ${head.slice(0, 7)}; what to pass to the Artifact tool is in ${join(to, 'publish.json')}`);
console.log(preview ? 'publish it to the test page: https://claude.ai/artifact/N7uvNgLxdePKW72SsM3NFX'
  : `publish it to the game page, https://claude.ai/artifact/3vqbn276s3a4hCN462QjsB, once \`npm run check -- --live <the saved page>\` passes on ${head.slice(0, 7)}`);
if (wrong) stop();
