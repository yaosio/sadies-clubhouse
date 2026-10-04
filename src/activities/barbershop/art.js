// Marbles' Cut & Curl's pictures, drawn on little canvases when the room's built: the shop from outside
// (its stripes, the awning, the sign, the door, the windows), inside the wallpaper, the checkered floor,
// the mirror, the curtain, the signs, Marbles in three moods, and the little pictures the shows use
// (a music note, a Z, an exclamation mark, a puff of smoke, a sparkle). Sadie's outfits aren't here:
// they're drawn on her (looks.js).
const rect = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

export const MARBLES = { W: 40, H: 42 };   // her picture, in dots

export function drawArt(m) {
  const { tex, words, C } = m, A = {};
  // ---------- outside ----------
  // the walls: cream with a pink stripe, a little tile border at the bottom
  A.wall = tex(32, 24, g => {
    rect(g, '#fff4e4', 0, 0, 32, 24);
    for (let x = 0; x < 32; x += 8) rect(g, '#ffc4e0', x, 0, 3, 20);
    for (let x = 0; x < 32; x += 4) for (let y = 20; y < 24; y += 4) rect(g, ((x + y) / 4) % 2 ? '#111' : '#fff', x, y, 4, 4);
  });
  // the awning: red and white stripes, scalloped
  A.awning = tex(32, 16, g => {
    const col = x => Math.floor(x / 4) % 2 ? '#fff' : C.red;
    for (let x = 0; x < 32; x++) rect(g, col(x), x, 0, 1, 12);
    for (let x = 0; x < 32; x += 4) for (let y = 12; y < 16; y++) for (let i = 0; i < 4; i++) if (Math.hypot(i - 1.5, y - 12) < 2.6) rect(g, col(x), x + i, y);
  });
  // the sign over the door
  A.sign = tex(96, 22, g => {
    rect(g, C.ink, 0, 0, 96, 22); rect(g, '#ffd23f', 1, 1, 94, 20); rect(g, C.ink, 3, 3, 90, 16);
    words(g, "MARBLES'", 48, 5, 1, C.pink, { align: 'center' });
    words(g, 'CUT & CURL', 48, 11, 1, '#ffd23f', { align: 'center' });
  });
  // the front door: red with a little window and an OPEN sign (the back, from inside, has none)
  const door = (g, open) => {
    rect(g, '#e83a3a', 0, 0, 24, 40); rect(g, '#a02a2a', 1, 1, 22, 38); rect(g, '#e83a3a', 3, 3, 18, 34);
    rect(g, C.ink, 5, 5, 14, 12); rect(g, '#bfe8ff', 6, 6, 12, 10); rect(g, '#e8fbff', 7, 7, 4, 2);
    if (open) { rect(g, C.ink, 2, 19, 20, 9); rect(g, C.white, 3, 20, 18, 7); words(g, 'OPEN', 12, 21, 1, C.red, { align: 'center' }); }
    rect(g, C.gold, 18, 30, 2, 2);
  };
  A.door = tex(24, 40, g => door(g, true));
  A.doorBack = tex(24, 40, g => door(g, false));
  // the shop windows: a mirror and a cat shape
  A.window = tex(32, 24, g => {
    rect(g, C.white, 0, 0, 32, 24); rect(g, C.ink, 1, 1, 30, 22); rect(g, '#bfe8ff', 2, 2, 28, 20); rect(g, '#e8fbff', 4, 4, 8, 2);
    const fur = '#7a4a2a'; rect(g, fur, 13, 11, 9, 9); rect(g, fur, 21, 14, 4, 6); rect(g, fur, 12, 5, 10, 7); rect(g, fur, 12, 2, 3, 4); rect(g, fur, 19, 2, 3, 4); rect(g, '#3ec43e', 14, 7, 2, 2); rect(g, '#3ec43e', 18, 7, 2, 2);
  });
  // the barber pole: stripes that wind round it
  A.pole = tex(16, 32, g => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) { const v = (x + y) % 16; rect(g, v < 4 ? '#e8202a' : v < 8 ? '#fff' : v < 12 ? '#2050e0' : '#fff', x, y); }
  });
  // ---------- inside ----------
  A.wallpaper = tex(32, 32, g => {
    rect(g, '#3ee8b5', 0, 0, 32, 32); for (let x = 0; x < 32; x += 8) rect(g, '#35d0a2', x, 0, 4, 32);
    rect(g, '#ff4fa3', 0, 24, 32, 2); for (let x = 0; x < 32; x += 8) { rect(g, '#fff', x + 2, 8, 2, 2); rect(g, '#ffd23f', x + 6, 16, 2, 2); }
  });
  A.floor = tex(16, 16, g => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) rect(g, (x + y) % 2 ? '#111' : '#f4f4f4', x * 8, y * 8, 8, 8); });
  A.mirror = tex(48, 32, g => {
    rect(g, '#6a4a2a', 0, 0, 48, 32); rect(g, '#ffd23f', 1, 1, 46, 30); rect(g, '#6a4a2a', 2, 2, 44, 28); rect(g, '#bfe8ff', 3, 3, 42, 26);
    rect(g, '#e8fbff', 6, 6, 12, 3); rect(g, '#e8fbff', 9, 10, 5, 2); rect(g, '#e8fbff', 30, 20, 8, 2);
  });
  // the stage curtain: red with folds and a gold fringe
  A.curtain = tex(16, 32, g => {
    for (let x = 0; x < 16; x++) rect(g, x % 4 < 2 ? '#c01030' : '#e83a50', x, 0, 1, 30);
    rect(g, '#ffd23f', 0, 30, 16, 2);
  });
  A.stageTop = tex(16, 16, g => { rect(g, '#b87848', 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) rect(g, '#9a5a2a', 0, y, 16, 1); rect(g, '#e8b070', 0, 0, 16, 1); });
  const sign = (text, w, bg, fg) => tex(w, 9, g => { rect(g, C.ink, 0, 0, w, 9); rect(g, bg, 1, 1, w - 2, 7); words(g, text, w / 2, 2, 1, fg, { align: 'center' }); });
  A.signWigs = sign('WIGS', 24, '#ffd23f', C.ink);
  A.signTails = sign('TAILS', 28, '#ff8ec8', C.ink);
  A.signOutfits = sign('OUTFITS', 36, '#8a2be2', C.white);
  A.signShow = sign('SHOW TIME!', 48, '#e83a3a', C.white);
  A.signChair = sign('SADIE', 24, C.white, C.ink);
  // Marbles: a brown tabby sitting up, scissors in her paw, an M on her forehead. Three moods.
  A.marbles = ['plain', 'grin', 'wink'].map(mood => tex(MARBLES.W, MARBLES.H, g => {
    const x = 4, y = 4, K = '#2b1d3c', B = '#a8743a', S = '#5a3618', L = '#e8c89a', R = (a, b, w, h, c) => rect(g, c, x + a, y + b, w, h);
    R(4, 12, 22, 24, K); R(5, 13, 20, 22, B);
    for (let i = 0; i < 4; i++) R(6, 16 + i * 5, 18, 2, S);
    R(9, 20, 8, 14, L);
    R(2, 0, 22, 16, K); R(3, 1, 20, 14, B);
    R(3, -4, 5, 6, K); R(4, -3, 3, 4, '#ff9ab8'); R(18, -4, 5, 6, K); R(19, -3, 3, 4, '#ff9ab8');
    R(9, 2, 1, 4, S); R(12, 2, 1, 3, S); R(15, 2, 1, 4, S); R(10, 2, 5, 1, S);
    R(6, 7, 4, 3, '#3ec43e'); R(7, 7, 2, 3, K);
    if (mood === 'wink') R(15, 8, 4, 1, K); else { R(15, 7, 4, 3, '#3ec43e'); R(16, 7, 2, 3, K); }
    R(10, 11, 4, 2, '#ff6fa0');
    if (mood === 'plain') R(10, 13, 4, 1, K); else { R(8, 13, 8, 1, K); R(7, 12, 1, 1, K); R(16, 12, 1, 1, K); }
    R(-3, 10, 5, 1, '#fff'); R(22, 10, 5, 1, '#fff');
    R(25, 26, 8, 4, K); R(26, 27, 7, 2, B); R(30, 22, 4, 8, K); R(31, 23, 2, 6, S);
    R(-4, 18, 9, 2, '#d8d8e8'); R(-4, 21, 9, 2, '#d8d8e8'); R(4, 17, 4, 7, K); R(5, 18, 2, 5, '#e8202a');
  }));
  // the little pictures the shows use
  A.note = [C.gold, C.pink, '#3ee8b5'].map(c => tex(8, 10, g => { rect(g, C.ink, 4, 0, 3, 8); rect(g, c, 5, 1, 1, 7); rect(g, C.ink, 0, 6, 5, 4); rect(g, c, 1, 7, 3, 2); rect(g, C.ink, 5, 0, 3, 2); rect(g, c, 6, 0, 2, 1); }));
  A.zzz = tex(16, 16, g => { words(g, 'Z', 9, 0, 2, C.white, { shadow: C.ink }); words(g, 'Z', 2, 9, 1, C.white, { shadow: C.ink }); });
  A.bang = tex(8, 16, g => { rect(g, C.ink, 1, 0, 6, 16); rect(g, '#ffd23f', 2, 1, 4, 9); rect(g, '#ffd23f', 2, 12, 4, 3); });
  A.puff = tex(16, 16, g => { for (const [cx, cy, r] of [[8, 8, 6], [4, 9, 4], [12, 9, 4], [8, 4, 4]]) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) rect(g, C.white, cx + x, cy + y); });
  A.star = tex(7, 7, g => { rect(g, '#ffd23f', 3, 0, 1, 7); rect(g, '#ffd23f', 0, 3, 7, 1); rect(g, C.white, 3, 3, 1, 1); });
  A.glass = tex(12, 14, g => { for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) { const d = x * x + y * y; if (d <= 25) rect(g, d > 14 ? '#333' : 'rgba(191,232,255,0.9)', 6 + x, 5 + y); } rect(g, '#6a4a2a', 5, 11, 2, 3); });
  // the bobbing arrows over everything you can use (yellow; pink once it's what Sadie has on)
  A.arrow = ['#ffd23f', '#ff4fa3'].map(c => tex(9, 10, g => { rect(g, C.ink, 2, 0, 5, 6); rect(g, c, 3, 0, 3, 5); rect(g, C.ink, 0, 5, 9, 2); rect(g, c, 1, 5, 7, 1); rect(g, C.ink, 1, 7, 7, 1); rect(g, C.ink, 2, 8, 5, 1); rect(g, c, 2, 6, 5, 1); rect(g, c, 3, 7, 3, 1); rect(g, C.ink, 3, 9, 3, 1); }));
  A.beam = tex(4, 4, g => rect(g, '#fff6b0', 0, 0, 4, 4));
  return A;
}
