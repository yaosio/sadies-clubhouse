// Makes a save of a full board (about 400 pieces, the deepest already melting into bedrock) by
// playing the real game in Node for 14 minutes, the mole dropping pieces as usual. It's what a
// long-played tower looks like, for checking the game in a browser without waiting for one.
// (Raining pieces in with the dev tools is quicker but makes a messy heap that never quite settles,
// which runs much slower than a real tower, so it's no good for judging smoothness.)
//
//   node tools/fullboard.mjs <out.json>
//
// The file holds exactly what the game keeps in the browser under its save key. Random numbers are
// seeded, so the same code always makes the same board. Takes about two minutes.
import { writeFileSync } from 'node:fs';

let seed = 7;
Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const src = new URL('../src/', import.meta.url);
const { world } = await import(new URL('core/world.js', src));
const { resetGame, update } = await import(new URL('core/game.js', src));
const { snapshot } = await import(new URL('core/save.js', src));
const { bedrock } = await import(new URL('core/bedrock.js', src));

const out = process.argv[2];
if (!out) { console.error('usage: node tools/fullboard.mjs <out.json>'); process.exit(2); }

resetGame();
for (let f = 0; f < 14 * 60 * 60; f++) update(1 / 60);
const text = JSON.stringify(snapshot());
writeFileSync(out, text);
console.log(`full board: ${world.pieces.length} pieces, ${bedrock.melted} melted into bedrock, save ${(text.length / 1024).toFixed(0)} KB`);
