// Keeps the docs laid out so a job reads only what it needs, and their pointers true.
//
//   node tools/docs.mjs
//
// A job reads `docs/TASKS.md`'s row for it, so every docs page is small, about one topic, and listed
// where it can be found. It fails when:
//   - a docs file is over its size limit (the pages a job always reads have tighter ones),
//   - a docs file doesn't start with a `# title`,
//   - a backticked `.md` path in the docs, CLAUDE.md or README.md doesn't exist,
//   - a docs page isn't listed in the README.md of its folder (or one above it),
//   - an activity's docs don't have the shape every activity's docs have (`docs/clubhouse/rooms/adding.md`):
//     a README with `## Design pillars` then `## Its pages`, and a `parked.md`,
//   - a shared page (docs/clubhouse/) names an activity (the shared code can't either).
// `npm run check` runs it with the code checker, and GitHub runs it on every pull request.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const LIMIT = 5000;                    // bytes, any docs page
const LIMITS = {                       // what every job reads: tighter
  'CLAUDE.md': 6000, 'README.md': 8000, 'docs/TASKS.md': 6000, 'docs/clubhouse/ARCHITECTURE.md': 5000,
};
const ACTIVITY_README = 4000;          // an activity's README.md

const walk = d => readdirSync(join(root, d)).flatMap(n => {
  const p = join(d, n);
  return statSync(join(root, p)).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
});
const read = f => readFileSync(join(root, f), 'utf8');
const docs = walk('docs'), everything = ['CLAUDE.md', 'README.md', ...docs];
const activities = readdirSync(join(root, 'src/activities')).filter(n => existsSync(join(root, 'src/activities', n, 'card.js')));
const names = activities.flatMap(id => {   // how an activity is named: its card's name and the words people use
  const card = read(`src/activities/${id}/card.js`), m = card.match(/name:\s*(?:'([^']+)'|"([^"]+)")/);
  return m ? [m[1] ?? m[2]] : [];
}).concat(['Clyde', 'Chooter', 'Brickbuster', 'Dropper World', 'TypeFitter', 'Music Room', 'aquarium', 'Space Adventure', 'Hedge Maze', 'Paint Shop']);
const GENERIC = ['CLAUDE.md', 'docs/TASKS.md', 'docs/clubhouse/rooms/adding.md', 'docs/clubhouse/checks/tools.md'];   // may name the pages every activity has, bare
const MAY_NAME = ['docs/clubhouse/decisions/', 'docs/clubhouse/look/history.md', 'docs/clubhouse/RULEBOOK.md'];

let bad = 0;
const fail = msg => { bad++; console.log('FAIL  ' + msg); };

for (const f of everything) {
  const text = read(f), size = Buffer.byteLength(text);
  const isActivityReadme = /^docs\/[^/]+\/README\.md$/.test(f) && activities.includes(f.split('/')[1]);
  const limit = LIMITS[f] ?? (isActivityReadme ? ACTIVITY_README : LIMIT);
  if (size > limit) fail(`${f} is ${size} bytes, over its ${limit}: split it by topic into small pages and list them in its folder's README.md`);
  if (f.startsWith('docs/') && !text.startsWith('# ')) fail(`${f} doesn't start with a "# title" line`);

  // every backticked docs page it names exists: from the top, or beside it
  for (const [, name] of text.matchAll(/`([\w./-]+\.md)`/g)) {
    if (!name.includes('/') && ['CLAUDE.md', 'README.md'].includes(name) && existsSync(join(root, name))) continue;
    if (!name.includes('/') && GENERIC.includes(f) && docs.some(d => d.endsWith('/' + name))) continue;
    const places = [name, join(dirname(f), name)];
    if (!places.some(p => existsSync(join(root, p)))) fail(`${f} names ${name}, which doesn't exist`);
  }

  // shared pages never name an activity
  if (f.startsWith('docs/clubhouse/') && !MAY_NAME.some(p => f.startsWith(p))) {
    const hit = names.find(n => text.toLowerCase().includes(n.toLowerCase()));
    if (hit) fail(`${f} names "${hit}": the shared docs say how rooms work in general (one example at most, in words, never a list of rooms)`);
  }
}

// every page is listed in the README.md of its folder, or of one above it
for (const f of docs) {
  if (f.endsWith('/README.md')) continue;
  const base = f.split('/').pop(), rel = r => relative(r, f);
  let d = dirname(f), listed = false;
  while (d.startsWith('docs/') && d !== 'docs') {
    const readme = join(d, 'README.md');
    if (existsSync(join(root, readme))) {
      const text = read(readme);
      if (text.includes('`' + rel(d) + '`') || text.includes('`' + base + '`')) { listed = true; break; }
    }
    d = dirname(d);
  }
  if (!listed && !f.startsWith('docs/TASKS')) fail(`${f} isn't listed in its folder's README.md (under "Its pages")`);
}

// every activity's docs have the same shape
for (const id of activities) {
  const readme = `docs/${id}/README.md`;
  if (!existsSync(join(root, readme))) { fail(`${id} has no ${readme}`); continue; }
  const text = read(readme), p = text.indexOf('## Design pillars'), pages = text.indexOf('## Its pages');
  if (p < 0) fail(`${readme} has no "## Design pillars" part`);
  if (pages < 0) fail(`${readme} has no "## Its pages" part (a line per other page)`);
  if (p >= 0 && pages >= 0 && pages < p) fail(`${readme}: "## Design pillars" comes before "## Its pages"`);
  if (!existsSync(join(root, `docs/${id}/parked.md`))) fail(`docs/${id}/parked.md is missing (parked ideas, or that there are none)`);
}

console.log(bad ? `${bad} problem(s) with the docs` : `PASS  the docs are small, listed, true to their pointers, and shaped alike (${everything.length} pages)`);
process.exit(bad ? 1 : 0);
