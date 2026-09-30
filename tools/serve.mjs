// Serves the built game (dist/) from a local web address, the way the game page serves it: the page
// at / and its game files beside it (dist/game/). The checks and every picture-taking tool use this,
// since a page opened as a file:// can't load its game files.
//   const server = await serve();  ...  `http://127.0.0.1:${server.address().port}/`  ...  server.close()
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';

const root = join(new URL('.', import.meta.url).pathname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };

// page: what's served at / (the built page, unless a tool has its own copy of it)
export async function serve({ page } = {}) {
  const dist = join(root, 'dist');
  const server = createServer((q, s) => {
    const path = decodeURIComponent(q.url.split(/[?#]/)[0]);
    if (path === '/' || path === '/index.html') {
      s.writeHead(200, { 'content-type': TYPES['.html'] });
      return s.end(page ?? readFileSync(join(dist, 'index.html')));
    }
    const file = normalize(join(dist, path));
    if (!file.startsWith(dist + '/') || !existsSync(file) || !statSync(file).isFile()) { s.writeHead(404); return s.end(); }
    s.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    s.end(readFileSync(file));
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok));
  return server;
}
