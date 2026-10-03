// Draws the aquarium's door (art/aquarium/door.js) in a hidden browser and writes it as a PNG
// inside src/activities/aquarium/door.js, where the game's build picks it up.
//   node tools/aquarium/pictures.mjs
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '../browser.mjs';

const root = join(new URL('.', import.meta.url).pathname, '../..');

const js = (await build({
  stdin: { contents: `import { aquariumDoor } from './art/aquarium/door.js'; window.door = aquariumDoor().toDataURL('image/png');`, resolveDir: root },
  bundle: true, format: 'iife', write: false,
})).outputFiles[0].text;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><body></body>');
await page.addScriptTag({ content: js });
const door = await page.evaluate(() => window.door);
await browser.close();
writeFileSync(join(root, 'src/activities/aquarium/door.js'), `// The aquarium's door on the clubhouse's landing, as a PNG.
// Drawn by art/aquarium/door.js (node tools/aquarium/pictures.mjs): change the drawing there and run it, never edit this file.
export default ${JSON.stringify(door)};
`);
console.log('src/activities/aquarium/door.js', door.length, 'bytes');
