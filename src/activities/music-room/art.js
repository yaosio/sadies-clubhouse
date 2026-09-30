// The music room's pictures, drawn on little canvases when it opens (from the approved mock-up,
// art/music-room/): the wallpaper, the instruments' faces, the tape deck, the poster, the dial and
// the sign by the door. Some are drawn again as things change (the keys you're pressing light up,
// the synth's screen, the tape deck's buttons, the dial's pointer, the sign).
import { STICKERS, KEYS_PIC } from './layout.js';
import { WHITE, BLACK, OUT_OF_TUNE } from './sounds/piano.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function dith(g, a, b, x, y, w, h, amt) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) rect(g, BAYER[((y + j) % 4) * 4 + ((x + i) % 4)] / 16 < amt ? b : a, x + i, y + j, 1, 1);
}
function bands(g, cols, x, y, w, h) {
  const n = cols.length - 1;
  for (let j = 0; j < h; j++) { const f = j / (h - 1) * n, k = Math.min(n - 1, Math.floor(f)); dith(g, cols[k], cols[k + 1], x, y + j, w, 1, f - k); }
}
function speckle(g, c, x, y, w, h, n, seed = 1) {
  let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) rect(g, c, x + Math.floor(r() * w), y + Math.floor(r() * h), 1, 1);
}
// a little eighth note
const note = (g, x, y, c) => { rect(g, c, x, y, 1, 6); rect(g, c, x - 2, y + 5, 3, 2); rect(g, c, x + 1, y, 2, 1); rect(g, c, x + 2, y + 1, 1, 2); };

export const TEAL = { a: '#38b0c8', dark: '#1a7890', light: '#70e0e8' };

export function drawArt({ tex, words, C }) {
  const A = {};
  // (the kit's font has no semicolon: the sticker's is drawn by hand)
  const say = (g, text, x, y, s, col, o) => {
    if (text !== ';') return words(g, text, x, y, s, col, o);
    rect(g, col, x - s, y + s, s, s); rect(g, col, x - s, y + 3 * s, s, s); rect(g, col, x - 2 * s, y + 4 * s, s, s);
  };
  // the wallpaper: teal, with music notes and the odd fish bone in the pattern
  A.paper = tex(24, 24, g => {
    rect(g, TEAL.a, 0, 0, 24, 24); dith(g, TEAL.a, TEAL.light, 0, 0, 24, 24, 0.18);
    note(g, 5, 3, TEAL.dark); note(g, 17, 14, TEAL.dark);
    const m = TEAL.dark;
    rect(g, m, 13, 5, 6, 1); for (const x of [14, 16]) rect(g, m, x, 3, 1, 5); rect(g, m, 19, 4, 2, 3); rect(g, m, 12, 4, 1, 3);
    for (const [x, y] of [[4, 17], [21, 2]]) { rect(g, C.gold, x, y, 1, 1); rect(g, TEAL.light, x - 1, y + 1, 3, 1); rect(g, C.gold, x, y + 2, 1, 1); }
  });
  A.floor = tex(16, 16, g => {
    rect(g, C.tan2, 0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) { rect(g, C.tan3, 0, y, 16, 1); rect(g, C.tan3, (y * 3) % 16, y, 1, 4); }
    speckle(g, C.tan, 0, 0, 16, 16, 18, 8);
  });
  A.ceiling = tex(16, 16, g => { rect(g, C.plum2, 0, 0, 16, 16); speckle(g, C.gold, 0, 0, 16, 16, 3, 5); speckle(g, C.lav3, 0, 0, 16, 16, 4, 9); });

  // a keyboard, seen from above (the far end at the top), its pressed keys lit: the piano's has
  // cream keys with stickers; the synth's the same, in its own colours
  function drawKeys(g, lit, synth) {
    const { w, h } = KEYS_PIC;
    rect(g, C.ink, 0, 0, w, h);
    WHITE.forEach((midi, i) => {
      const x = i * 12, on = lit.has(midi);
      rect(g, on ? C.yellow : synth ? '#f0f0f8' : C.cream, x + 1, 0, 11, h);
      rect(g, on ? C.gold : C.lav, x + 1, h - 3, 11, 3);
      const odd = !synth && midi === OUT_OF_TUNE;   // the out-of-tune one: Sadie's favourite
      rect(g, odd ? C.pink : synth ? C.lav2 : TEAL.light, x + 3, 29, 7, 8);
      say(g, odd ? '?' : STICKERS.white[i], x + 7, 30, 1, C.ink, { align: 'center' });
    });
    if (!synth) for (const [x, y, ww] of [[88, 36, 5], [89, 35, 3], [90, 34, 1]]) rect(g, C.ink, x, y, ww, h - y);   // the chewed one
    BLACK.forEach(([midi, i], j) => {
      const x = (i + 1) * 12 - 4, on = lit.has(midi);
      rect(g, on ? C.gold2 : C.black, x, 0, 9, 22); rect(g, on ? C.gold : C.slate2, x + 1, 0, 1, 21);
      say(g, STICKERS.black[j], x + 5, 14, 1, on ? C.ink : C.lav2, { align: 'center' });
    });
  }
  A.keys = tex(KEYS_PIC.w, KEYS_PIC.h, g => drawKeys(g, new Set(), false));
  A.synthKeys = tex(KEYS_PIC.w, KEYS_PIC.h, g => drawKeys(g, new Set(), true));
  A.lightKeys = (t, lit, synth) => { drawKeys(t.image.getContext('2d'), lit, synth); t.needsUpdate = true; };

  // the piano's front: pink lacquer, its maker's name in gold, claw marks down one side (it's hers)
  A.piano = tex(96, 32, g => {
    rect(g, C.pink2, 0, 0, 96, 32); dith(g, C.pink2, C.pink, 0, 0, 96, 32, 0.2);
    rect(g, C.gold, 0, 0, 96, 2); rect(g, C.gold2, 0, 30, 96, 2);
    rect(g, C.pink3, 4, 13, 88, 15); rect(g, C.pink2, 5, 14, 86, 13);
    words(g, 'TINKLE-TONE JR.', 48, 4, 1, C.gold, { align: 'center', shadow: C.pink3 });
    for (const x of [82, 85, 88]) for (let y = 15; y < 27; y++) if ((x + y) % 5) rect(g, '#ffd0ea', x + (y > 20 ? 1 : 0), y, 1, 1);
  });
  A.songbook = tex(48, 32, g => {
    rect(g, C.tan3, 0, 0, 48, 32); rect(g, C.cream, 1, 1, 23, 30); rect(g, C.white, 24, 1, 23, 30);
    words(g, 'FEED ME', 12, 3, 1, C.plum, { align: 'center' }); words(g, 'NOW', 12, 10, 1, C.red, { align: 'center' });
    for (const y of [20, 23, 26]) rect(g, C.grey, 3, y, 19, 1);
    for (const [x, y] of [[6, 16], [11, 19], [16, 14]]) note(g, x, y, C.ink);
    for (const y of [5, 9, 13, 17, 21, 25]) rect(g, C.grey, 27, y, 18, 1);
    for (const [x, y] of [[30, 2], [36, 6], [42, 10], [33, 14], [39, 18]]) note(g, x, y, C.ink);
  });
  A.cushion = tex(16, 16, g => { rect(g, C.pink, 0, 0, 16, 16); dith(g, C.pink, C.pink2, 0, 0, 16, 16, 0.3); rect(g, C.gold, 7, 7, 2, 2); });

  // the drum kit: THE PAWS on the bass drum, a blanket stuffed in it, fur all over the snare
  A.head = tex(48, 48, g => {
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
      const r = Math.hypot(x - 23.5, y - 23.5);
      if (r < 21) rect(g, C.cream, x, y, 1, 1); else if (r < 24) rect(g, (Math.floor(Math.atan2(y - 23.5, x - 23.5) * 5) % 2) ? C.red : C.gold, x, y, 1, 1);
    }
    words(g, 'THE', 24, 9, 2, C.plum, { align: 'center' }); words(g, 'PAWS', 24, 21, 2, C.red, { align: 'center' });
    const px = 20, py = 34;
    rect(g, C.pink2, px, py + 4, 8, 5); for (const [x, y] of [[-2, 1], [1, -1], [5, -1], [8, 1]]) rect(g, C.pink2, px + x, py + y, 2, 2);
  });
  A.blanket = tex(16, 16, g => {
    rect(g, '#8ac8ff', 0, 0, 16, 16);
    for (let i = 0; i < 16; i += 6) { rect(g, C.cream, i, 0, 2, 16); rect(g, C.cream, 0, i, 16, 2); }
    for (let i = 3; i < 16; i += 6) { rect(g, '#4a88d8', i, 0, 1, 16); rect(g, '#4a88d8', 0, i, 16, 1); }
  });
  A.fur = tex(16, 16, g => {
    rect(g, C.white, 0, 0, 16, 16); dith(g, C.white, C.lav, 0, 0, 16, 16, 0.2);
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 26; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 15), c = [C.grey, C.tan, C.lav3][i % 3]; rect(g, c, x, y, 2, 1); rect(g, c, x + 1, y + 1, 1, 1); }
  });
  A.shell = tex(16, 8, g => { rect(g, C.pink2, 0, 0, 16, 8); rect(g, C.pink, 0, 1, 16, 1); rect(g, C.gold, 0, 0, 16, 1); rect(g, C.gold, 0, 7, 16, 1); for (let x = 1; x < 16; x += 5) rect(g, C.lav, x, 2, 1, 5); });
  A.brass = tex(8, 8, g => { rect(g, C.gold, 0, 0, 8, 8); dith(g, C.gold, C.yellow, 0, 0, 8, 8, 0.3); rect(g, C.gold2, 0, 3, 8, 1); });
  A.chrome = tex(8, 8, g => { rect(g, C.lav2, 0, 0, 8, 8); rect(g, C.white, 2, 0, 1, 8); rect(g, C.grey, 6, 0, 1, 8); });
  // a xylophone bar that's a fish (tinted a colour per bar), and the mallets' pom-poms
  A.fish = tex(24, 10, g => {
    for (let x = 2; x < 19; x++) { const hh = Math.round(4 * Math.sin((x - 2) / 17 * Math.PI)); rect(g, C.white, x, 5 - hh, 1, hh * 2); }
    for (let y = 1; y < 9; y++) { const w = 4 - Math.abs(y - 5); if (w > 0) rect(g, C.white, 19, y, w + 1, 1); }
    rect(g, C.ink, 6, 3, 1, 1); rect(g, C.lav3, 9, 2, 1, 6); rect(g, C.lav3, 13, 2, 1, 6);
  });
  A.pompom = tex(8, 8, g => { rect(g, C.pink, 0, 0, 8, 8); speckle(g, '#ffd0ea', 0, 0, 8, 8, 14, 2); speckle(g, C.pink2, 0, 0, 8, 8, 10, 5); });

  // the KEYCAT 3000's panel: its name, its little green screen, the four sound buttons and DEMO
  const panel = tex(96, 24, () => {});
  A.synthPanel = panel;
  A.drawPanel = (voice, lcd) => {
    const g = panel.image.getContext('2d');
    rect(g, '#2a2a40', 0, 0, 96, 24); rect(g, '#3a3a58', 0, 0, 96, 1);
    words(g, 'KEYCAT 3000', 3, 2, 1, C.pink);
    rect(g, '#60a060', 50, 0, 44, 13); rect(g, '#a8e0a0', 51, 1, 42, 11);
    const lines = lcd.split('\n');
    lines.forEach((l, i) => words(g, l, 72, lines.length > 1 ? 1 + i * 6 : 4, 1, '#204020', { align: 'center' }));
    ['CAT', 'BIRD', 'BELL', 'CAN'].forEach((l, i) => {
      const on = l === voice, x = 2 + i * 12;
      rect(g, on ? C.gold : C.lav3, x, 13, 11, 8); rect(g, on ? C.yellow : C.lav2, x, 13, 11, 1);
      words(g, String(i + 1), x + 6, 15, 1, C.ink, { align: 'center' });
    });
    rect(g, C.red, 52, 13, 24, 8); words(g, 'DEMO', 64, 15, 1, C.white, { align: 'center' });
    rect(g, C.black, 80, 13, 12, 8); words(g, '0', 86, 15, 1, C.lav2, { align: 'center' });
    panel.needsUpdate = true;
  };
  A.drawPanel('CAT', 'CAT');

  // the tape deck: a chunky boom box, its buttons along the top (lit while they're down), the
  // tape in its window, and its reels
  const deck = tex(160, 80, () => {});
  A.tape = deck;
  A.drawDeck = (state, which, turn = 0) => {
    const g = deck.image.getContext('2d');
    rect(g, C.grey2, 0, 0, 160, 80); rect(g, C.grey, 2, 2, 156, 76); dith(g, C.grey, C.lav2, 2, 2, 156, 20, 0.3);
    for (const cx of [28, 132]) for (let y = 25; y < 72; y++) for (let x = cx - 24; x < cx + 24; x++) {
      const r = Math.hypot(x - cx, y - 48);
      if (r < 23) rect(g, r < 8 ? C.pink3 : (r < 20 ? ((x + y) % 2 ? C.black : C.slate2) : C.black), x, y, 1, 1);
    }
    rect(g, C.black, 54, 24, 52, 44); rect(g, '#7a88a0', 56, 26, 48, 40);
    const hers = which === 'sadie';
    rect(g, hers ? C.cream : '#c8f0ff', 59, 29, 42, 20);
    if (hers) { words(g, 'SADIE', 80, 31, 1, C.plum, { align: 'center' }); words(g, 'LIVE!', 80, 39, 1, C.red, { align: 'center' }); }
    else { words(g, 'MY', 80, 31, 1, C.plum, { align: 'center' }); words(g, 'SONG', 80, 39, 1, C.tarp2, { align: 'center' }); }
    for (const x of [66, 86]) {   // the reels, going round while it plays or records
      rect(g, C.white, x, 53, 8, 8);
      const a = turn * (state === 'idle' ? 0 : 1), dx = Math.round(Math.cos(a) * 2), dy = Math.round(Math.sin(a) * 2);
      rect(g, C.black, x + 3 + dx, 56 + dy, 2, 2);
    }
    [['rec', C.red, 'REC'], ['play', C.green, 'PLAY'], ['stop', C.cream, 'STOP'], ['loop', C.gold, 'LOOP']].forEach(([b, c, l], i) => {
      const x = 6 + i * 38, down = state === b;
      rect(g, C.black, x, 4, 36, 16); rect(g, c, x + 1, down ? 7 : 4, 34, down ? 12 : 13);
      words(g, l, x + 18, down ? 10 : 7, 1, C.ink, { align: 'center' });
    });
    words(g, 'TAPE-O-MATIC', 80, 71, 1, C.ink, { align: 'center' });
    if (state === 'rec') rect(g, C.red, 150, 70, 4, 4);
    deck.needsUpdate = true;
  };
  A.drawDeck('idle', 'mine');
  A.cassette = tex(64, 40, g => {
    rect(g, C.ink, 0, 0, 64, 40); rect(g, C.pink, 2, 2, 60, 36); rect(g, C.white, 5, 4, 54, 20);
    words(g, 'SADIE', 32, 6, 1, C.plum, { align: 'center' }); words(g, 'LIVE!', 32, 14, 1, C.red, { align: 'center' });
    for (const x of [16, 40]) rect(g, C.ink, x, 27, 8, 8);
  });

  // the volume dial on the wall, its pointer at the setting
  const dial = tex(48, 60, () => {});
  A.dial = dial;
  A.drawDial = (k, name) => {   // k: 0 (off) to 1 (loud)
    const g = dial.image.getContext('2d');
    rect(g, C.black, 0, 0, 48, 60); rect(g, C.lav, 1, 1, 46, 58);
    for (let a = 0; a < 11; a++) { const th = (-135 + a * 27) * Math.PI / 180; rect(g, a < 4 ? C.green2 : (a > 8 ? C.red : C.plum), Math.round(24 + Math.sin(th) * 20) - 1, Math.round(26 - Math.cos(th) * 20) - 1, 2, 2); }
    for (let y = 0; y < 60; y++) for (let x = 0; x < 48; x++) { const r = Math.hypot(x - 24, y - 26); if (r < 15) rect(g, r > 13 ? C.plum2 : ((x + y) % 3 ? C.plum : C.pink3), x, y, 1, 1); }
    const th = (-135 + k * 270) * Math.PI / 180;
    for (let i = 3; i < 13; i++) rect(g, C.gold, Math.round(24 + Math.sin(th) * i) - 1, Math.round(26 - Math.cos(th) * i) - 1, 2, 2);
    words(g, 'VOLUME', 24, 44, 1, C.ink, { align: 'center' }); words(g, name, 24, 51, 1, name === 'OFF' ? C.red : C.plum, { align: 'center' });
    dial.needsUpdate = true;
  };

  // the band poster
  A.poster = sadie => tex(48, 64, g => {
    rect(g, C.black, 0, 0, 48, 64); bands(g, [C.plum, C.pink3, C.red], 1, 1, 46, 62);
    words(g, 'SADIE', 24, 3, 1, C.gold, { align: 'center', shadow: C.black });
    words(g, '& THE PAWS', 24, 10, 1, C.yellow, { align: 'center' });
    if (sadie) g.drawImage(sadie, 5, 17, 38, 31);
    words(g, 'LIVE! 1 NITE', 24, 50, 1, C.white, { align: 'center' });
    words(g, 'ONLY 1996', 24, 57, 1, C.white, { align: 'center' });
  });
  A.window = tex(32, 40, g => {
    rect(g, C.tan3, 0, 0, 32, 40); bands(g, ['#1a1a80', '#141a58', '#3a2a90'], 2, 2, 28, 36);
    for (let y = 0; y < 40; y++) for (let x = 0; x < 32; x++) if (Math.hypot(x - 22, y - 10) < 4 && Math.hypot(x - 20, y - 9) > 3.4) rect(g, C.yellow, x, y, 1, 1);
    speckle(g, C.white, 2, 2, 28, 36, 14, 4);
    rect(g, C.cream, 15, 2, 2, 36); rect(g, C.cream, 2, 19, 28, 2); rect(g, C.cream, 0, 0, 32, 2); rect(g, C.cream, 0, 38, 32, 2);
  });
  // the sign by the door: SADIE WELCOME on one side, SHH SADIE NAPPING on the other
  const sign = tex(40, 28, () => {});
  A.sign = sign;
  A.drawSign = welcome => {
    const g = sign.image.getContext('2d');
    rect(g, '#b87838', 0, 0, 40, 28); rect(g, welcome ? '#d8a060' : '#b8c8f0', 1, 1, 38, 26);
    if (welcome) { words(g, 'SADIE', 20, 4, 1, C.plum, { align: 'center' }); words(g, 'WELCOME', 20, 11, 1, C.green3, { align: 'center' }); }
    else { words(g, 'SHH!', 20, 3, 1, C.red, { align: 'center' }); words(g, 'SADIE', 20, 10, 1, C.plum, { align: 'center' }); words(g, 'NAPPING', 20, 17, 1, C.tarp2, { align: 'center' }); }
    const p = C.pink2; rect(g, p, 17, welcome ? 20 : 23, 5, 3); for (const x of [16, 18, 20, 22]) rect(g, p, x, welcome ? 18 : 22, 1, 1);
    sign.needsUpdate = true;
  };
  A.label = tex(48, 10, g => { rect(g, C.tan3, 0, 0, 48, 10); words(g, 'THEREMIN', 24, 3, 1, C.yellow, { align: 'center' }); });
  A.mirror = tex(16, 16, g => { for (let y = 0; y < 16; y += 2) for (let x = 0; x < 16; x += 2) rect(g, [C.white, C.lav2, C.lav3, TEAL.light, C.pink][(x * 3 + y * 7) % 5], x, y, 2, 2); });
  A.notes = [C.gold, C.pink, TEAL.light].map(c => tex(10, 12, g => { rect(g, c, 6, 0, 2, 9); rect(g, c, 2, 8, 6, 4); rect(g, c, 8, 0, 2, 2); rect(g, c, 9, 2, 1, 3); rect(g, C.ink, 1, 9, 1, 2); }));
  return A;
}
