// The aquarium's little pictures, drawn when the room is built: the fish, and Sadie in her diving
// suit (her own sprite, with a fishbowl helmet, an air tank and flippers). `tex` and `C` are the
// mansion's (a canvas drawing made into a texture, and its palette).
export const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const dot = (x, y) => BAYER[(y % 4) * 4 + (x % 4)] / 16;   // the ordered dither's threshold at a pixel
export function oval(g, cx, cy, rx, ry, col, edge) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
    if (d <= 1) px(g, edge && d > 0.72 ? edge : col, x, y);
  }
}

export function fishPics(tex, C) {
  const eye = (g, x, y) => { px(g, C.white, x, y, 2, 2); px(g, C.black, x + 1, y + 1, 1, 1); };
  return {
    gold: tex(20, 12, g => {
      for (let i = 0; i < 5; i++) px(g, '#ff7a2a', i, 6 - i, 1, 2 * i + 1 - Math.max(0, i - 3));
      oval(g, 11, 6, 7, 4.5, '#ff9a1e', '#e0501a'); px(g, '#ffe08a', 9, 7, 6, 2); px(g, '#ff7a2a', 9, 1, 4, 2); eye(g, 14, 4);
    }),
    tang: tex(20, 12, g => {
      for (let i = 0; i < 4; i++) px(g, C.gold, i, 5 - i, 1, 2 * i + 2);
      oval(g, 11, 6, 7.5, 5, '#2a6af0', '#1a3aa0'); px(g, C.ink, 7, 3, 7, 1); px(g, C.ink, 6, 4, 2, 4); px(g, C.gold, 5, 6, 3, 1); eye(g, 15, 4);
    }),
    angel: tex(16, 20, g => {
      for (let y = 0; y < 20; y++) { const w = Math.round(6 - Math.abs(y - 10) * 0.55); if (w > 0) px(g, y % 5 < 2 ? C.ink : C.yellow, 8 - w, y, w + 3, 1); }
      oval(g, 9, 10, 5, 4, C.yellow); px(g, C.ink, 7, 6, 2, 8); px(g, '#ffffff', 12, 8, 2, 2); px(g, C.black, 13, 9, 1, 1);
      for (let i = 0; i < 4; i++) px(g, C.yellow, 1 + i, 8 - i % 2, 1, 4 + i % 2);
    }),
    puffer: tex(16, 16, g => {
      for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; px(g, C.tan3, Math.round(8 + 7.2 * Math.cos(t)), Math.round(8 + 7.2 * Math.sin(t))); }
      oval(g, 8, 8, 6, 6, '#f8d860', C.tan2); px(g, '#fff4c0', 4, 9, 7, 3); eye(g, 10, 5); px(g, C.pink2, 13, 9, 2, 1);
      for (const [x, y] of [[5, 5], [7, 3], [4, 7]]) px(g, C.tan2, x, y);
    }),
    pink: tex(20, 12, g => {   // a pink fish, the colour of Dropper World's jelly
      px(g, C.pink2, 0, 2, 3, 8); px(g, C.pink2, 3, 4, 2, 4);
      oval(g, 12, 6, 7, 4, C.pink, C.pink2); px(g, '#ffd0ea', 10, 7, 6, 2); eye(g, 15, 4);
      for (const x of [8, 11]) px(g, '#ffd0ea', x, 3, 1, 1);
    }),
    silver: tex(16, 8, g => { px(g, '#8a88a8', 0, 1, 2, 6); px(g, '#8a88a8', 2, 3, 2, 2); oval(g, 9, 4, 6, 2.6, '#d8dcf0', '#8a88a8'); px(g, C.tarp, 6, 3, 6, 1); px(g, C.black, 12, 3, 1, 1); }),
  };
}

// Sadie in a diving suit: her sprite, with a fishbowl helmet, an air tank on her back and flippers
export function scubaSadie(tex, C, sadie, blink) {
  return tex(66, 60, g => {
    if (sadie) g.drawImage(blink || sadie, 4, 10);
    // flippers on her feet, and an air tank strapped on her back
    for (const fx of [15, 32]) { px(g, C.ink, fx, 55, 13, 5); px(g, C.gold, fx + 1, 56, 11, 3); px(g, '#fff08a', fx + 1, 56, 11, 1); }
    const ty = 26;
    px(g, C.ink, 11, ty, 20, 9); px(g, '#ff7a2a', 12, ty + 1, 18, 7); px(g, '#ffb070', 13, ty + 2, 16, 2); px(g, '#c04a10', 12, ty + 6, 18, 2);
    px(g, '#8a88a8', 30, ty + 2, 3, 4); px(g, C.ink, 30, ty + 2, 3, 1);
    for (const x of [16, 25]) px(g, C.ink, x, ty + 9, 2, 4);
    // the helmet: a fishbowl round her head, dithered glass with a shine, and a brass collar
    const cx = 46, cy = 28, r = 15.5;
    for (let y = 0; y < 60; y++) for (let x = 0; x < 66; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d > r - 1.2 && d <= r) px(g, '#dff6ff', x, y);
      else if (d > r - 2.2 && d <= r - 1.2 && (x + y) % 2) px(g, '#8ad8ff', x, y);
      else if (d < r - 1.2 && dot(x, y) < 0.1) px(g, '#bff0ff', x, y);
    }
    for (let a = 0; a < 9; a++) { const t = Math.PI * (1.1 + a * 0.05); px(g, C.white, Math.round(cx + (r - 4) * Math.cos(t)), Math.round(cy + (r - 4) * Math.sin(t)), 2, 1); }
    px(g, C.gold3, 34, 42, 25, 4); px(g, C.gold, 35, 42, 23, 2); for (const x of [37, 46, 55]) px(g, C.gold3, x, 42, 1, 1);
  });
}

// The six finds from the ocean, as 16 x 16 pictures: in the OCEAN FINDS cabinet, and floating out at
// sea where you find them
export function findPics(tex, C) {
  return {
    mountain: tex(16, 16, g => {   // the looming mountain, sandcastle-sized, on its little sandbar
      oval(g, 8, 14, 7.5, 2, '#f0d890', '#d8b868');
      for (let y = 2; y < 14; y++) { const w = (y - 2) * 0.62; px(g, y < 5 ? C.white : y % 3 ? C.lav3 : C.slate, Math.round(8 - w), y, Math.max(1, Math.round(2 * w)), 1); }
      px(g, C.lav2, 6, 8, 2, 3); px(g, C.pink, 8, 1, 1, 1);
    }),
    bottle: tex(16, 16, g => {     // a message in a bottle, the note inside signed with a paw
      for (let x = 2; x < 12; x++) px(g, x % 5 ? '#3fbf6a' : '#78e090', x, 5, 1, 7);
      px(g, '#3fbf6a', 12, 7, 2, 3); px(g, C.tan2, 14, 7, 2, 3); px(g, C.cream, 4, 7, 6, 3); px(g, C.pink2, 8, 8, 1, 1);
      px(g, '#b8ffcf', 3, 6, 6, 1);
    }),
    hat: tex(16, 16, g => {        // a little captain's hat
      oval(g, 8, 7, 6, 4, C.white, '#c8c8e0'); px(g, C.ink, 2, 9, 12, 3); px(g, C.black, 3, 12, 10, 2);
      px(g, C.gold, 6, 6, 4, 2); px(g, C.gold2, 7, 7, 2, 1);
    }),
    duck: tex(16, 16, g => {       // a rubber duck, normal-sized
      oval(g, 7, 10, 6, 4, C.gold, C.gold2); oval(g, 10, 5, 3.5, 3.5, C.gold, C.gold2);
      px(g, '#ff7a2a', 13, 5, 3, 2); px(g, C.black, 11, 4, 1, 1); px(g, C.yellow, 4, 8, 4, 1);
    }),
    floppy: tex(16, 16, g => {     // a floppy disk: LIGHTHOUSE.EXE
      px(g, C.ink, 1, 1, 14, 14); px(g, '#2a6af0', 2, 2, 12, 12); px(g, '#c8c8e0', 5, 2, 6, 4); px(g, C.ink, 8, 3, 2, 2);
      px(g, C.white, 4, 8, 8, 5); for (const y of [9, 11]) px(g, C.red, 5, y, 6, 1);
    }),
    coconut: tex(16, 16, g => {    // a coconut with a face drawn on it
      oval(g, 8, 9, 6.5, 6, C.tan3, '#4a2a18');
      for (const [x, y] of [[4, 5], [7, 4], [11, 6], [5, 12], [12, 11]]) px(g, '#9a6a3a', x, y);
      px(g, C.white, 5, 8, 2, 2); px(g, C.white, 10, 8, 2, 2); px(g, C.black, 6, 9, 1, 1); px(g, C.black, 11, 9, 1, 1);
      px(g, C.white, 6, 12, 5, 1); px(g, C.white, 5, 11, 1, 1); px(g, C.white, 11, 11, 1, 1);
    }),
  };
}
