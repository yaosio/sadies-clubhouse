// What's where on the instruments, and which computer key plays what: plain numbers (the tests
// read them too).
import { WHITE, BLACK } from './sounds/piano.js';
import { BARS } from './sounds/xylophone.js';
import { VOICES } from './sounds/synth.js';

// The keyboards (the toy piano, and the KEYCAT 3000 laid out the same): ten white keys and seven
// black ones, each with a sticker saying which computer key plays it.
export const WHITE_KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];
export const BLACK_KEYS = ['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU', 'KeyO', 'KeyP'];
export const STICKERS = { white: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'], black: ['W', 'E', 'T', 'Y', 'U', 'O', 'P'] };
// a computer key's note on a keyboard, or null
export function keyboardNote(code) {
  const w = WHITE_KEYS.indexOf(code); if (w >= 0) return WHITE[w];
  const b = BLACK_KEYS.indexOf(code); if (b >= 0) return BLACK[b][0];
  return null;
}
// The keyboard's picture is 120 x 40 (the far end at the top): white keys 12 wide, black keys 9
// wide and 22 long. Which note is at pixel (x, y) of it, or null.
export const KEYS_PIC = { w: 120, h: 40, white: 12, black: 9, blackLong: 22 };
export function noteAt(x, y) {
  if (y < KEYS_PIC.blackLong) for (const [midi, i] of BLACK) { const bx = (i + 1) * 12 - 4; if (x >= bx && x < bx + 9) return midi; }
  const w = Math.floor(x / 12);
  return w >= 0 && w < WHITE.length ? WHITE[w] : null;
}
// Sadie's paws count keys 0 up from the left, black and white: the notes, one by one
export const pawNote = k => 60 + k;

// the xylophone: A to K
export const BAR_KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'];
export const barOf = code => { const i = BAR_KEYS.indexOf(code); return i >= 0 ? BARS[i] : null; };

// the drums, as you look at them left to right, and their keys (Space is the kick too); Sadie walks
// across the four in the middle, and ends up curled in the bass drum
export const DRUM_KEYS = { KeyA: 'hat', KeyS: 'snare', KeyD: 'tom1', KeyF: 'tom2', KeyG: 'floor', KeyH: 'cymbal', Space: 'kick', KeyJ: 'kick' };
export const SADIE_DRUMS = ['snare', 'tom1', 'tom2', 'floor'];

// the KEYCAT 3000's sound buttons (1 to 4) and its DEMO button (0)
export const VOICE_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];
export { VOICES };

// the tape deck's buttons
export const TAPE_KEYS = { KeyR: 'rec', KeyP: 'play', KeyS: 'stop', KeyL: 'loop', KeyT: 'tape' };
export const TAPE_BUTTONS = ['rec', 'play', 'stop', 'loop'];   // left to right along its top

// the volume dial: what its settings are called, and how loud each is
export const VOLUMES = [['SOFT', 0.25], ['MEDIUM', 0.5], ['LOUD', 0.8], ['OFF', 0]];
