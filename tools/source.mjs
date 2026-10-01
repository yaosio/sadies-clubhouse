// Finds the copy of the project that travels with a built page. Since it moved out of the page it's a
// file of its own beside it (game/source-<fingerprint>.json, which the page names in its
// <link id="jelly-source">); older pages carried it inside, in <script id="jelly-source">. Either
// way: { format, builtAt, version, files: { "path": "text" } }, or null if there's none.
//
// Needs nothing but Node (tools/unpack.mjs runs it on a freshly downloaded page).
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function readSource(page) {
  const html = readFileSync(page, 'utf8');
  const inside = html.match(/<script type="application\/json" id="jelly-source">([\s\S]*?)<\/script>/);
  if (inside) return JSON.parse(inside[1]);
  const beside = html.match(/<link [^>]*id="jelly-source"[^>]*href="\.\/([^"]+)"/);
  if (!beside) return null;
  const file = join(dirname(page), beside[1]);
  if (!existsSync(file)) throw new Error(`the page names its source as ${beside[1]}, but it isn't beside it (save it there too)`);
  return JSON.parse(readFileSync(file, 'utf8'));
}
