// Keeps the docs every change reads small, and their pointers true.
//
//   node tools/docs.mjs
//
// Every thread reads CLAUDE.md, README.md and docs/clubhouse/ARCHITECTURE.md before changing
// anything, so each of them has a size limit: past it, the check fails and says what to move out
// (a room's special cases to its own docs, a system's details to its reference page in
// docs/clubhouse/). It also fails if one of them names a docs page that doesn't exist.
// `npm run check` runs it with the code checker, and GitHub runs it on every pull request.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const LIMITS = {   // bytes
  'CLAUDE.md': 10000,
  'README.md': 10000,
  'docs/clubhouse/ARCHITECTURE.md': 8000,
};
const WHAT = {
  'CLAUDE.md': 'move the details it points to into the docs it names',
  'README.md': 'give the activities their own page (docs/ACTIVITIES.md) and leave a pointer to it',
  'docs/clubhouse/ARCHITECTURE.md': "move a room's special cases to its own docs, a system's details to its page in docs/clubhouse/",
};

let bad = 0;
for (const [file, limit] of Object.entries(LIMITS)) {
  const text = readFileSync(join(root, file), 'utf8'), size = Buffer.byteLength(text);
  if (size > limit) { bad++; console.log(`FAIL  ${file} is ${size} bytes, over its ${limit}: ${WHAT[file]}`); }
  // every docs page it names exists (`docs/...md` from the top; a bare `NAME.md` in ARCHITECTURE.md
  // beside it in docs/clubhouse/ or at the top, like README.md)
  for (const [, name] of text.matchAll(/`([\w./-]+\.md)`/g)) {
    const places = name.includes('/') ? [name] : file.startsWith('docs/') ? [join(dirname(file), name), name] : [];
    if (places.length && !places.some(p => existsSync(join(root, p)))) { bad++; console.log(`FAIL  ${file} names ${name}, which doesn't exist`); }
  }
}
console.log(bad ? `${bad} problem(s) with the docs every change reads` : 'PASS  the docs every change reads are short, and every page they name is there');
process.exit(bad ? 1 : 0);
