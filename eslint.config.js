// The code checker (ESLint): `npm run lint`. It looks for mistakes (a misspelt name, a variable
// that's never used, code that can never run), not for how the code is laid out. It also keeps the
// folder rules in CLAUDE.md: an activity only uses its own folder and the toolbox (src/shared/),
// the toolbox uses nobody's, and Dropper World's core/ never reaches into render/, ui/ or input/.
import js from '@eslint/js';
import globals from 'globals';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const inside = (p, dir) => !relative(dir, p).startsWith('..');

// Why `from` (a file, relative to the repo) can't use `to` (where its import points), or null if it can.
function folderRule(from, to) {
  const src = resolve(root, 'src'), act = from.match(/^src\/activities\/([^/]+)\//)?.[1];
  if (act) {
    const own = resolve(src, 'activities', act);
    if (!inside(to, own) && !inside(to, resolve(src, 'shared'))) return `an activity only uses its own folder and src/shared/`;
    if (act === 'dropper-world' && inside(from, 'src/activities/dropper-world/core') && ['render', 'ui', 'input'].some(d => inside(to, resolve(own, d))))
      return `Dropper World's core/ never uses render/, ui/ or input/`;
  }
  if (from.startsWith('src/shared/') && !inside(to, resolve(src, 'shared'))) return `the toolbox (src/shared/) only uses itself`;
  return null;
}
const clubhouse = {
  rules: {
    'own-folder': {
      meta: { type: 'problem', schema: [] },
      create(context) {
        const from = relative(root, context.filename).split(sep).join('/');
        const look = node => {
          const spec = node.source?.type === 'Literal' && node.source.value;
          if (typeof spec !== 'string' || !spec.startsWith('.')) return;   // (a package, like three)
          const why = folderRule(from, resolve(dirname(context.filename), spec));
          if (why) context.report({ node: node.source, message: `'${spec}': ${why}` });
        };
        return { ImportDeclaration: look, ExportNamedDeclaration: look, ExportAllDeclaration: look, ImportExpression: look };
      },
    },
  },
};

export default [
  { ignores: ['dist/', 'node_modules/', 'art/'] },   // (art/: the old mockups the look was drawn from, not the game)
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser } },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],   // `catch {}`: ignoring a failure on purpose
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
    },
  },
  { files: ['src/**'], plugins: { clubhouse }, rules: { 'clubhouse/own-folder': 'error' } },
  {
    files: ['tools/**', 'tests/**', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
