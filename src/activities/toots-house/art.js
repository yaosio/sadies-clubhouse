// Toots' house's pictures, drawn on little canvases when the room's built. Outside: an ordinary
// two-story house, sky-blue siding and white trim, that's plainly owned by a dog (shutters with bones
// cut out of them, a front door with a dog flap, a WELCOME EVERYBODY mat, paw-print stepping stones, a
// round attic window drawn like a tennis ball, nose prints on her window, her mailbox and her sign).
// Inside: the wallpaper, the floors, the rugs, the couch, her bowls and beds, Sadie's quilt, and the
// framed pictures of her friends (Sadie, Marbles, Chooter).
import { frontToots, paint } from './toots-art.js';
import { CHOOTER, CHOOTER_PAL } from './chooter-pic.js';
const rect = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function dith(g, a, b, x, y, w, h, amt) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) rect(g, BAYER[((y + j) % 4) * 4 + ((x + i) % 4)] / 16 < amt ? b : a, x + i, y + j); }
function disc(g, c, cx, cy, r) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) rect(g, c, cx + x, cy + y); }
// a little bone, `w` long, lying flat
function bone(g, c, x, y, w) { rect(g, c, x + 2, y + 1, w - 4, 2); for (const bx of [x, x + w - 3]) { rect(g, c, bx, y, 3, 2); rect(g, c, bx, y + 2, 3, 2); rect(g, c, bx + (bx === x ? 1 : 0), y + 1, 2, 2); } }
// a paw print
function paw(g, c, x, y) { disc(g, c, x + 2, y + 4, 2); for (const [i, j] of [[-1, 0], [1, -1], [3, -1], [5, 0]]) rect(g, c, x + i, y + j, 2, 2); }

export const BALL = '#d8f03a', BALL2 = '#a8c020';

export function drawArt(m) {
  const { tex, words, C } = m, A = {};
  // the siding: sky blue boards, each with a shadow line under it
  A.siding = tex(16, 16, g => { rect(g, '#9ccaf4', 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) { rect(g, '#7aa8e0', 0, y + 3, 16, 1); rect(g, '#b8dcff', 0, y, 16, 1); } });
  // the roof: dark red shingles, staggered
  A.shingles = tex(16, 16, g => {
    rect(g, '#9a2a34', 0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) { rect(g, '#6a1622', 0, y + 3, 16, 1); for (let x = (y / 4) % 2 ? 2 : 6; x < 16; x += 8) rect(g, '#6a1622', x, y, 1, 3); dith(g, '#9a2a34', '#b8404a', 0, y, 16, 1, 0.4); }
  });
  A.trim = tex(4, 4, g => rect(g, '#ffffff', 0, 0, 4, 4));
  A.brick = tex(16, 8, g => { rect(g, '#b85a3a', 0, 0, 16, 8); rect(g, '#7a3a2a', 0, 3, 16, 1); rect(g, '#7a3a2a', 0, 7, 16, 1); rect(g, '#7a3a2a', 4, 0, 1, 3); rect(g, '#7a3a2a', 12, 4, 1, 3); });
  // the front door: red as her collar, a fanlight, a brass bone for a knocker, and a big dog flap
  const door = (g, front) => {
    rect(g, '#e8202a', 0, 0, 24, 40); rect(g, '#a01018', 1, 1, 22, 38); rect(g, '#e8202a', 2, 2, 20, 36);
    rect(g, C.ink, 4, 3, 16, 7); rect(g, '#bfe8ff', 5, 4, 14, 5); rect(g, '#e8fbff', 6, 5, 3, 1);
    rect(g, '#a01018', 4, 12, 7, 10); rect(g, '#a01018', 13, 12, 7, 10);
    // the dog flap: a rubber flap in a frame, wide enough for a dog of her size
    rect(g, '#c8c8d8', 5, 26, 14, 12); rect(g, '#3a3a4a', 6, 27, 12, 10); rect(g, '#5a5a6a', 6, 27, 12, 2);
    if (front) bone(g, C.gold, 8, 15, 8);
    disc(g, C.gold, 19, 22, 1);
  };
  A.door = tex(24, 40, g => door(g, true));
  A.doorBack = tex(24, 40, g => door(g, false));
  // a window downstairs: white frame, four panes, a little blue
  A.window = tex(16, 20, g => {
    rect(g, '#ffffff', 0, 0, 16, 20); rect(g, '#2a4a7a', 1, 1, 14, 18); rect(g, '#7ab8f0', 2, 2, 12, 16);
    rect(g, '#ffffff', 7, 1, 2, 18); rect(g, '#ffffff', 1, 9, 14, 2); rect(g, '#d8f0ff', 3, 3, 3, 1); rect(g, '#d8f0ff', 10, 12, 2, 1);
  });
  // a shutter: navy, slatted, with a bone cut out where a shutter would have a heart
  A.shutter = tex(8, 20, g => {
    rect(g, '#2a3a8a', 0, 0, 8, 20); for (let y = 1; y < 20; y += 2) rect(g, '#1a2a6a', 1, y, 6, 1);
    rect(g, '#ffffff', 2, 4, 4, 1); rect(g, '#ffffff', 1, 3, 1, 3); rect(g, '#ffffff', 6, 3, 1, 3);
  });
  // the round attic window up in the gable, drawn like a tennis ball (the seams are the frame)
  A.ballWindow = tex(24, 24, g => {
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
      const d = Math.hypot(x + 0.5 - 12, y + 0.5 - 12);
      if (d > 11.5) continue;
      rect(g, d > 10 ? '#ffffff' : '#9ad0ff', x, y);
      const s1 = Math.abs(Math.hypot(x + 0.5 - 1, y + 0.5 - 12) - 7.5), s2 = Math.abs(Math.hypot(x + 0.5 - 23, y + 0.5 - 12) - 7.5);
      if (d <= 10 && (s1 < 1 || s2 < 1)) rect(g, '#ffffff', x, y);
    }
    rect(g, '#e8fbff', 9, 5, 2, 1);
  });
  // a tennis ball, for the gutter and the grass
  A.ball = tex(8, 8, g => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (Math.hypot(x + 0.5 - 4, y + 0.5 - 4) < 3.9) rect(g, BALL, x, y);
    rect(g, '#ffffff', 1, 2, 1, 4); rect(g, '#ffffff', 2, 1, 1, 1); rect(g, '#ffffff', 2, 6, 1, 1); rect(g, '#ffffff', 6, 2, 1, 4); rect(g, '#ffffff', 5, 1, 1, 1); rect(g, '#ffffff', 5, 6, 1, 1);
    rect(g, BALL2, 3, 6, 2, 1);
  });
  // the glass of her window: clear, with a few nose prints off to the sides (where she's leaned) and a pawprint smudge
  // (only the smudges are drawn: the rest of the glass is clear)
  A.glass = tex(48, 32, g => {
    for (const [x, y] of [[8, 22], [12, 24], [37, 23], [41, 21]]) { disc(g, '#dfefff', x, y, 2); rect(g, '#c8dcf0', x - 1, y, 1, 1); rect(g, '#c8dcf0', x + 1, y, 1, 1); }
    paw(g, '#dfefff', 6, 26);
    rect(g, '#f0f8ff', 3, 3, 6, 1); rect(g, '#f0f8ff', 4, 5, 3, 1); rect(g, '#f0f8ff', 40, 4, 4, 1);
  });
  // inside her window: warm wallpaper, a curtain, a cushion on the window seat
  A.inside = tex(16, 16, g => { rect(g, '#ffe0a8', 0, 0, 16, 16); for (let x = 0; x < 16; x += 8) { paw(g, '#f4c888', x + 2, 4); } dith(g, '#ffe0a8', '#f8d098', 0, 12, 16, 4, 0.4); });
  A.curtain = tex(8, 32, g => { for (let x = 0; x < 8; x++) rect(g, x % 4 < 2 ? '#e8d8b8' : '#d0bc98', x, 0, 1, 32); rect(g, '#e8202a', 0, 16, 8, 2); });
  A.cushion = tex(16, 8, g => { rect(g, '#e8202a', 0, 0, 16, 8); for (let x = 1; x < 16; x += 4) rect(g, '#ffffff', x, 3, 2, 2); });
  // the mat by the door
  A.mat = tex(64, 16, g => {
    rect(g, '#b8783a', 0, 0, 64, 16); rect(g, '#8a5420', 1, 1, 62, 14); rect(g, '#c8884a', 2, 2, 60, 12);
    words(g, 'WELCOME', 32, 2, 1, '#5a2a10', { align: 'center' });
    words(g, 'EVERYBODY', 32, 8, 1, '#5a2a10', { align: 'center' });
    paw(g, '#5a2a10', 4, 6); paw(g, '#5a2a10', 54, 6);
  });
  // a stepping stone with a paw print pressed into it
  A.stone = tex(16, 16, g => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (Math.hypot((x + 0.5 - 8) / 1.1, y + 0.5 - 8) < 7.4) rect(g, '#c8c4d8', x, y);
    dith(g, '#c8c4d8', '#b0acc4', 3, 3, 10, 10, 0.2);
    paw(g, '#8a86a0', 5, 6);
  });
  // her sign by the path
  A.sign = tex(64, 24, g => {
    rect(g, '#7a4a2a', 0, 0, 64, 24); rect(g, '#e8b070', 1, 1, 62, 22); rect(g, '#d09858', 1, 8, 62, 1); rect(g, '#d09858', 1, 16, 62, 1);
    words(g, "TOOTS'", 32, 3, 1, '#e8202a', { align: 'center', shadow: '#5a2a10' });
    words(g, 'HOUSE', 32, 12, 1, C.ink, { align: 'center' });
    paw(g, '#5a2a10', 6, 14); paw(g, '#5a2a10', 52, 6);
  });
  // her mailbox: a little dog house, TOOTS on the side
  A.mailbox = tex(24, 16, g => { rect(g, '#9ccaf4', 0, 0, 24, 16); rect(g, '#7aa8e0', 0, 15, 24, 1); words(g, 'TOOTS', 12, 5, 1, C.ink, { align: 'center' }); });
  A.guest = tex(32, 10, g => { rect(g, '#ffffff', 0, 0, 32, 10); rect(g, C.ink, 1, 1, 30, 8); words(g, 'GUESTS', 16, 2, 1, C.yellow, { align: 'center' }); });
  A.hydrant = tex(8, 8, g => { rect(g, '#e8202a', 0, 0, 8, 8); rect(g, '#ff6a6a', 1, 0, 2, 8); });
  drawInside(m, A);
  return A;
}

// a picture frame round a picture: gold, with a cream mat
function framed(g, w, h, bg) {
  rect(g, '#8a5a10', 0, 0, w, h); rect(g, '#ffd23a', 1, 1, w - 2, h - 2); rect(g, '#c89018', 2, 2, w - 4, h - 4);
  rect(g, '#fff4e4', 3, 3, w - 6, h - 6); rect(g, bg, 5, 5, w - 10, h - 10);
}

function drawInside(m, A) {
  const { tex, words, C, T } = m;
  // the walls: soft butter yellow with a little paw pattern, and below the rail, wood panelling
  A.paper = tex(16, 16, g => { rect(g, '#fff0b8', 0, 0, 16, 16); dith(g, '#fff0b8', '#ffe8a0', 0, 0, 16, 16, 0.15); paw(g, '#f4d888', 3, 4); paw(g, '#f4d888', 11, 11); });
  A.paperUp = tex(16, 16, g => { rect(g, '#9cc4f0', 0, 0, 16, 16); dith(g, '#9cc4f0', '#8ab4e8', 0, 0, 16, 16, 0.15); for (const [x, y] of [[2, 2], [10, 10]]) { disc(g, '#d8f03a', x + 2, y + 2, 2); rect(g, '#ffffff', x + 1, y + 1, 1, 1); rect(g, '#ffffff', x + 3, y + 3, 1, 1); } paw(g, '#b8d8f8', 11, 3); paw(g, '#b8d8f8', 3, 11); });
  A.panelUp = tex(16, 16, g => { rect(g, '#ffffff', 0, 0, 16, 16); rect(g, '#d8e4f4', 1, 2, 6, 12); rect(g, '#d8e4f4', 9, 2, 6, 12); rect(g, '#f4f8ff', 2, 3, 4, 10); rect(g, '#f4f8ff', 10, 3, 4, 10); rect(g, '#e8202a', 0, 0, 16, 1); });
  A.panel = tex(16, 16, g => { rect(g, '#b8783a', 0, 0, 16, 16); rect(g, '#9a5a2a', 1, 2, 6, 12); rect(g, '#9a5a2a', 9, 2, 6, 12); rect(g, '#c8884a', 2, 3, 4, 10); rect(g, '#c8884a', 10, 3, 4, 10); rect(g, '#ffd23a', 0, 0, 16, 1); });
  A.boards = tex(16, 16, g => { rect(g, '#c8884a', 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) { rect(g, '#9a5a2a', 0, y + 3, 16, 1); rect(g, '#9a5a2a', (y * 5) % 16, y, 1, 3); } dith(g, '#c8884a', '#d89858', 0, 0, 16, 16, 0.12); });
  A.carpet = tex(8, 8, g => { rect(g, '#7ab0e8', 0, 0, 8, 8); dith(g, '#7ab0e8', '#8ac0f0', 0, 0, 8, 8, 0.3); });
  // the big round rug: rings, red and cream, like a target (or a tennis ball, if you squint)
  A.rug = tex(32, 32, g => { for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16); if (d < 15.5) rect(g, ['#e8202a', '#fff4e4', '#d8f03a', '#fff4e4'][Math.floor(d / 4) % 4], x, y); } });
  A.couch = tex(16, 16, g => { rect(g, '#2a8a6a', 0, 0, 16, 16); dith(g, '#2a8a6a', '#3aa07a', 0, 0, 16, 16, 0.3); rect(g, '#1a6a4a', 0, 15, 16, 1); });
  A.quilt = tex(16, 16, g => { const cs = ['#ff8ec8', '#fff08a', '#9ad0ff', '#ffffff']; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) rect(g, cs[(x + y * 2) % 4], x * 4, y * 4, 4, 4); for (let i = 0; i < 16; i += 4) { rect(g, '#e0509a', i, 0, 1, 16); rect(g, '#e0509a', 0, i, 16, 1); } });
  A.bedTop = tex(16, 8, g => { rect(g, '#e8202a', 0, 0, 16, 8); rect(g, '#ffffff', 1, 1, 14, 6); rect(g, '#e8202a', 2, 2, 12, 4); for (let x = 3; x < 13; x += 3) rect(g, '#ffd23a', x, 3, 1, 2); });
  // her bowls: one says TOOTS, one has a bone on it
  A.bowl = tex(24, 8, g => { rect(g, '#e8202a', 0, 0, 24, 8); words(g, 'TOOTS', 12, 2, 1, '#ffffff', { align: 'center' }); });
  A.bowl2 = tex(24, 8, g => { rect(g, '#2a6af0', 0, 0, 24, 8); bone(g, '#ffffff', 7, 2, 10); });
  A.basket = tex(16, 8, g => { rect(g, '#c89050', 0, 0, 16, 8); for (let x = 0; x < 16; x += 2) rect(g, '#9a6a30', x, (x / 2) % 2, 1, 8); rect(g, '#7a4a2a', 0, 0, 16, 1); });
  A.ballSign = tex(40, 10, g => { rect(g, C.ink, 0, 0, 40, 10); rect(g, '#d8f03a', 1, 1, 38, 8); words(g, 'BALLS', 20, 2, 1, C.ink, { align: 'center' }); });
  A.homeSign = tex(64, 16, g => {
    rect(g, '#7a4a2a', 0, 0, 64, 16); rect(g, '#fff4e4', 1, 1, 62, 14);
    words(g, 'EVERYBODY IS', 32, 2, 1, '#e8202a', { align: 'center' }); words(g, 'WELCOME HERE', 32, 9, 1, '#e8202a', { align: 'center' });
  });
  // the pictures of her friends, each framed, with a name plate below
  A.plate = name => { const w = Math.max(40, name.length * 5 + 6); return tex(w, 8, g => { rect(g, '#8a5a10', 0, 0, w, 8); rect(g, '#ffd23a', 1, 1, w - 2, 6); words(g, name, w / 2, 2, 1, C.ink, { align: 'center' }); }); };
  // Sadie: her own picture, the same as everywhere, on pink
  A.picSadie = tex(70, 60, g => { framed(g, 70, 60, '#ff8ec8'); g.drawImage(T.sadie.image, 6, 7); });   // (her picture dot for dot, never shrunk: shrunk, it blurs)
  // Marbles: the brown tabby who runs the barbershop, green eyes, the M on her forehead, a bow
  // upstairs, over her bed: Toots and Sadie together
  A.picFriends = tex(120, 72, g => { framed(g, 120, 72, '#9ad0ff'); rect(g, '#5ac85a', 5, 52, 110, 15); paint(g, frontToots({ ears: 1, wag: 1 }), 4, 2); g.drawImage(T.sadie.image, 56, 19); });
  A.picMarbles = tex(48, 44, g => {
    framed(g, 48, 44, '#9ad0ff');
    const K = '#2b1d3c', B = '#a8743a', S = '#5a3618', L = '#e8c89a';
    rect(g, K, 12, 26, 24, 13); rect(g, B, 13, 27, 22, 12); for (let i = 0; i < 3; i++) rect(g, S, 14, 29 + i * 3, 20, 1); rect(g, L, 20, 30, 8, 9);
    rect(g, K, 13, 11, 22, 17); rect(g, B, 14, 12, 20, 15);
    rect(g, K, 13, 6, 6, 7); rect(g, '#ff9ab8', 15, 8, 2, 4); rect(g, K, 29, 6, 6, 7); rect(g, '#ff9ab8', 31, 8, 2, 4);
    rect(g, B, 14, 8, 4, 4); rect(g, B, 30, 8, 4, 4); rect(g, '#ff9ab8', 15, 9, 2, 3); rect(g, '#ff9ab8', 31, 9, 2, 3);
    rect(g, S, 20, 13, 1, 4); rect(g, S, 24, 13, 1, 3); rect(g, S, 27, 13, 1, 4); rect(g, S, 21, 13, 6, 1);
    rect(g, '#3ec43e', 17, 18, 4, 3); rect(g, K, 18, 18, 2, 3); rect(g, '#3ec43e', 27, 18, 4, 3); rect(g, K, 28, 18, 2, 3);
    rect(g, '#ff6fa0', 22, 22, 4, 2); rect(g, K, 20, 24, 8, 1);
    rect(g, '#fff', 9, 21, 5, 1); rect(g, '#fff', 34, 21, 5, 1);
    rect(g, '#e8202a', 30, 9, 6, 3); rect(g, '#e8202a', 32, 7, 2, 7);
  });
  // Chooter: the black dog from the paint shop, white blaze, blue collar with its gold tag, his big
  // grin (the same portrait as on Lily's wall, copied dot for dot: chooter-pic.js), in a bigger frame
  A.picChooter = tex(64, 60, g => {
    framed(g, 64, 60, '#fff08a');
    CHOOTER.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== '.' && 7 + y < 55) rect(g, CHOOTER_PAL[row[x]], 8 + x, 7 + y); });
  });
  // upstairs: the bird channel on her TV (four pictures, swapped as it plays: a bluebird on a branch
  // looks about, sings, hops along, and a red one drops in), a GOOD GIRL pennant, a shelf of books
  const bird = (g, x, y, body, open, flip) => {
    const f = flip ? -1 : 1;
    rect(g, '#1b1424', x - 3, y - 2, 6, 4); rect(g, body, x - 2, y - 2, 4, 3); rect(g, '#ffd8b0', x - 1, y, 3, 1);
    rect(g, '#1b1424', x + f * 2, y - 4, 2, 3); rect(g, body, x + f * 2, y - 4, 1, 2); rect(g, '#1b1424', x + f * 3, y - 4, 1, 1);
    rect(g, '#ffb020', x + f * (open ? 4 : 4), y - 3, 1, 1); if (open) rect(g, '#ffb020', x + f * 4, y - 2, 1, 1);
    rect(g, body, x - f * 4, y - 3, 2, 1); rect(g, '#5a3a22', x - 1, y + 2, 1, 1); rect(g, '#5a3a22', x + 1, y + 2, 1, 1);
  };
  A.birdTV = i => tex(32, 24, g => {
    for (let y = 0; y < 24; y++) rect(g, y < 12 ? '#8ad0ff' : '#a8e0ff', 0, y, 32, 1);
    disc(g, '#3aa04a', 27, 6, 5); disc(g, '#58c058', 4, 4, 4);
    rect(g, '#7a4a2a', 0, 16, 32, 2); rect(g, '#5a3618', 22, 13, 2, 3);
    const x = i === 2 ? 17 : 10;
    bird(g, x, 13, '#3a7ae8', i === 1, false);
    if (i === 3) bird(g, 24, 6, '#e8202a', false, true);
    else if (i !== 0) { rect(g, '#ffffff', x + 6, 7, 1, 1); rect(g, '#ffffff', x + 8, 5, 1, 1); }
    for (let y = 1; y < 24; y += 2) { g.fillStyle = 'rgba(0,0,40,0.12)'; g.fillRect(0, y, 32, 1); }   // (the screen's lines)
  });
  A.goodGirl = tex(64, 16, g => {
    rect(g, '#ff8ec8', 0, 0, 64, 16); for (let x = 0; x < 64; x += 8) rect(g, '#ffd23a', x, 13, 4, 3);
    paw(g, '#ffffff', 3, 5); paw(g, '#ffffff', 55, 5);
    words(g, 'GOOD GIRL', 32, 4, 1, '#ffffff', { align: 'center', shadow: '#c0408a' });
  });
  A.books = tex(32, 36, g => {
    rect(g, '#5a3618', 0, 0, 32, 36);
    const cs = ['#e8202a', '#3a7ae8', '#ffd23a', '#3aa04a', '#ff8ec8', '#8a52b0', '#ff9a3a', '#ffffff'];
    for (let row = 0; row < 3; row++) { let x = 1, k = row * 3; while (x < 30) { const w = 2 + (k * 7) % 3, h = 8 + (k * 5) % 3; rect(g, cs[k % cs.length], x, row * 12 + 11 - h, Math.min(w, 31 - x), h); x += w; k++; } rect(g, '#9a5a2a', 0, row * 12 + 11, 32, 1); }
  });
  // the backyard through the big window
  A.fence = tex(16, 16, g => { rect(g, '#ffffff', 0, 0, 16, 16); for (let x = 3; x < 16; x += 4) rect(g, '#d8d8e8', x, 0, 1, 16); rect(g, '#d8d8e8', 0, 5, 16, 1); rect(g, '#d8d8e8', 0, 12, 16, 1); });
  A.brickIn = tex(16, 8, g => { rect(g, '#c86a4a', 0, 0, 16, 8); rect(g, '#8a3a2a', 0, 3, 16, 1); rect(g, '#8a3a2a', 0, 7, 16, 1); rect(g, '#8a3a2a', 4, 0, 1, 3); rect(g, '#8a3a2a', 12, 4, 1, 3); });
  A.fire = tex(16, 16, g => { rect(g, '#1c1238', 0, 0, 16, 16); for (const [x, h, c] of [[3, 7, '#e8202a'], [6, 10, '#ff8a2a'], [9, 12, '#ffd23a'], [12, 8, '#ff8a2a']]) { rect(g, c, x - 1, 16 - h, 3, h); rect(g, '#fff08a', x, 16 - h + 3, 1, h - 4); } rect(g, '#7a4a2a', 1, 14, 14, 2); });
}
