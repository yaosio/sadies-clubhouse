// Space Adventure's little pictures, drawn when the room is built: the cockpit's panels and screens,
// the planet from space, the stars' clouds, the land's colours, the sky, and Sadie's space room (its
// wallpaper, the radio, the button's sign, Sadie in her space helmet). `tex` and `C` are the
// mansion's (a canvas drawing made into a texture, and its palette); `words` its 3x5 pixel font.
export const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const dot = (x, y) => BAYER[(y % 4) * 4 + (x % 4)] / 16;   // the ordered dither's threshold at a pixel
export function oval(g, cx, cy, rx, ry, col, edge) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
    if (d <= 1) px(g, edge && d > 0.72 ? edge : col, x, y);
  }
}
// bands of colour, top to bottom, dithered from one to the next
function bands(g, cols, x, y, w, h) {
  const n = cols.length - 1;
  for (let j = 0; j < h; j++) {
    const f = j / Math.max(1, h - 1) * n, k = Math.min(n - 1, Math.floor(f));
    for (let i = 0; i < w; i++) px(g, dot(x + i, y + j) < f - k ? cols[k + 1] : cols[k], x + i, y + j);
  }
}
// smooth made-up noise, the same every time (for the planet's continents and clouds)
function noise(seed) {
  const h = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return s - Math.floor(s); };
  const n = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
  };
  return (x, y, wrap) => {   // (wrap: the x it repeats after, so a planet's map joins up round the back)
    let s = 0, a = 0.5, f = 1;
    for (let o = 0; o < 4; o++) { const W = wrap * f; const xx = ((x * f) % W + W) % W; s += a * (n(xx, y * f) * (1 - xx / W) + n(xx - W, y * f) * (xx / W)); a /= 2; f *= 2; }
    return s;
  };
}

export function cockpitPics(tex, C, words) {
  const P = {};
  // the walls: big purple panels with bevels, rivets and a teal stripe
  P.panel = tex(32, 32, g => {
    px(g, '#3a2a8c', 0, 0, 32, 32); px(g, '#5a48b8', 0, 0, 32, 1); px(g, '#5a48b8', 0, 0, 1, 32); px(g, '#1c1238', 31, 0, 1, 32); px(g, '#1c1238', 0, 31, 32, 1);
    for (let y = 2; y < 30; y++) for (let x = 2; x < 30; x++) if (dot(x, y) < 0.12) px(g, '#46369c', x, y);
    px(g, '#2ad0c0', 0, 20, 32, 3); px(g, '#8af0e0', 0, 20, 32, 1);
    for (const [x, y] of [[3, 3], [28, 3], [3, 28], [28, 28]]) { px(g, '#8a88a8', x, y, 2, 2); px(g, C.white, x, y); }
  });
  P.grate = tex(16, 16, g => {
    px(g, '#34305c', 0, 0, 16, 16);
    for (let i = 0; i < 16; i += 4) { px(g, '#4a4a78', i, 0, 1, 16); px(g, '#4a4a78', 0, i, 16, 1); px(g, '#1c1238', i + 1, 0, 1, 16); }
    px(g, '#ffd23a', 0, 15, 16, 1);
  });
  P.ceiling = tex(16, 16, g => { px(g, '#2a1e6a', 0, 0, 16, 16); for (let x = 0; x < 16; x += 8) px(g, '#1c1238', x, 0, 1, 16); px(g, '#3a2a8c', 0, 0, 16, 1); });
  // the dashboard's front, facing you: rows of buttons, lights and a speaker grille, and its name
  P.dashFront = tex(96, 24, g => {
    px(g, '#5e5c80', 0, 0, 96, 24); px(g, '#8a88a8', 0, 0, 96, 1); px(g, '#34305c', 0, 23, 96, 1);
    const cols = [C.red, C.gold, C.green, '#2ad0c0', C.pink, C.white];
    for (let i = 0; i < 14; i++) { const x = 4 + i * 6; px(g, C.ink, x, 3, 4, 4); px(g, cols[i % cols.length], x + 1, 4, 2, 2); }
    for (let y = 11; y < 20; y += 2) px(g, '#34305c', 6, y, 20, 1);
    px(g, C.ink, 36, 10, 26, 10); px(g, '#ffd23a', 37, 11, 24, 8); words(g, 'SADIE-1', 49, 13, 1, C.ink, { align: 'center' });
    for (let i = 0; i < 5; i++) { px(g, C.ink, 68 + i * 5, 11, 3, 9); px(g, '#e8dcff', 69 + i * 5, 12 + (i * 3) % 6, 1, 3); }
  });
  P.dashTop = tex(32, 16, g => { px(g, '#4a4a78', 0, 0, 32, 16); for (let x = 0; x < 32; x += 2) if (x % 6) px(g, '#5e5c80', x, 0, 1, 16); });
  // the round radar screen: the planet's blip in the middle of green rings
  P.radar = tex(24, 24, g => {
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
      const d = Math.hypot(x - 11.5, y - 11.5);
      if (d < 11.5) px(g, d > 10.5 ? '#8a88a8' : Math.abs(d - 7) < 0.5 || Math.abs(d - 3.5) < 0.5 || x === 11 || y === 11 ? '#3aff6a' : '#0a3a1a', x, y);
    }
    px(g, '#e8ffe8', 11, 5, 2, 2);
  });
  // a little screen with writing on it (what it says: `text`)
  P.screen = (text, col = '#3aff6a') => tex(32, 16, g => {
    px(g, '#1c1238', 0, 0, 32, 16); px(g, '#0a2a1a', 1, 1, 30, 14);
    for (let y = 1; y < 15; y += 2) px(g, '#0e341e', 1, y, 30, 1);
    words(g, text, 16, 6, 1, col, { align: 'center' });
  });
  P.light = col => tex(2, 2, g => px(g, col, 0, 0, 2, 2));
  P.vinyl = tex(8, 8, g => { px(g, '#c8283a', 0, 0, 8, 8); px(g, '#e83a4a', 0, 0, 8, 1); px(g, '#8a1a2a', 0, 4, 8, 1); });
  // a poster by the door
  P.poster = tex(32, 44, g => {
    px(g, C.ink, 0, 0, 32, 44); bands(g, ['#1a1a80', '#5a2a78', '#e0509a'], 1, 1, 30, 42);
    for (const [x, y] of [[4, 5], [25, 8], [9, 14], [27, 20], [5, 24]]) px(g, C.white, x, y);
    oval(g, 20, 30, 7, 7, '#58d04a', '#2a9a3a'); oval(g, 20, 30, 11, 2, '#ffd23a');
    oval(g, 20, 30, 6, 1.2, '#58d04a');
    words(g, 'SPACE', 16, 4, 1, C.yellow, { align: 'center', shadow: C.ink });
    words(g, 'CADET', 16, 10, 1, C.yellow, { align: 'center', shadow: C.ink });
    px(g, C.pink2, 4, 36, 4, 3); for (const [x, y] of [[-1, -2], [1, -3], [3, -3], [5, -2]]) px(g, C.pink2, 4 + x, 36 + y, 1, 1);
  });
  // the glow of the air as you come in, and the white of the clouds: streaks, scrolled past
  P.streaks = tex(32, 32, g => {
    for (let x = 0; x < 32; x++) { const s = Math.sin(x * 2.3) * 0.5 + 0.5; for (let y = 0; y < 32; y++) px(g, dot(x, y) < 0.3 + 0.5 * s * (0.5 + 0.5 * Math.sin(y / 5 + x)) ? '#ffffff' : '#d8e0f0', x, y); }
  });
  return P;
}

// ---------- space ----------
export function spacePics(tex, C) {
  const P = {};
  // the planet, as a map wrapped round it: seas, green land, purple mountains, ice at the poles, and clouds
  const land = noise(3), cloud = noise(11);
  P.planet = tex(128, 64, g => {
    for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) {
      const lat = Math.abs(y - 31.5) / 32, h = land(x / 16, y / 16, 8) - 0.08 * Math.cos(y / 64 * Math.PI * 2), d = dot(x, y);
      let col = h < 0.42 ? (h < 0.34 ? '#1a3aa0' : '#2a6af0') : h < 0.45 ? '#f0d890' : h < 0.55 ? (d < (h - 0.45) * 10 ? '#2a9a3a' : '#58d04a') : h < 0.62 ? '#9c86d6' : '#e8dcff';
      if (lat > 0.82 + 0.06 * Math.sin(x / 5)) col = d < 0.8 ? '#ffffff' : '#c8e0ff';
      px(g, col, x, y);
    }
  });
  // its clouds, on a sphere of their own just over it (turning a little quicker, so they drift)
  P.planetClouds = tex(128, 64, g => {
    for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) {
      const c = cloud(x / 10 + 3, y / 7, 12.8);
      if (c > 0.58 && dot(x, y) < (c - 0.58) * 7) px(g, c > 0.68 ? '#ffffff' : '#dfe8ff', x, y);
    }
  });
  // the stars, as a map wrapped round the sky: mostly single white dots, some coloured, a few bigger
  P.stars = tex(1024, 512, g => {
    px(g, '#05020f', 0, 0, 1024, 512);
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const tints = ['#ffffff', '#ffffff', '#e8e8ff', '#c8e0ff', '#fff0b0', '#ffb0d8', '#b0ffff', '#8a88a8', '#5e5c80'];
    for (let i = 0; i < 2200; i++) {
      const x = Math.floor(r() * 1024), y = Math.floor(Math.acos(1 - 2 * r()) / Math.PI * 512), c = tints[Math.floor(r() * tints.length)];
      if (i % 25 === 0) { px(g, c, x, y - 1, 1, 3); px(g, c, x - 1, y, 3, 1); } else px(g, c, x, y);
    }
  });
  // its air, round its edge: a soft blue ring
  P.halo = tex(64, 64, g => {
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const d = Math.hypot(x + 0.5 - 32, y + 0.5 - 32) / 32;
      if (d > 0.86 && d < 1) { const k = 1 - Math.abs(d - 0.9) / 0.1; if (dot(x, y) < k) px(g, k > 0.7 ? '#bff0ff' : '#58c8f0', x, y); }
    }
  });
  // a far-off sun, with its glow and a few spikes (it's the 90s: there's a lens flare too)
  P.sun = tex(32, 32, g => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16);
      if (d < 4) px(g, C.white, x, y); else if (d < 7) px(g, dot(x, y) < (7 - d) / 3 ? '#fff6b0' : '#ffd23a', x, y);
      else if (d < 15 && dot(x, y) < (15 - d) / 18) px(g, '#ffb070', x, y);
    }
    for (let i = 0; i < 16; i++) { px(g, '#fff6b0', 16 + i, 16, 1, 1); px(g, '#fff6b0', 15 - i, 15, 1, 1); px(g, '#fff6b0', 15, 16 + i, 1, 1); px(g, '#fff6b0', 16, 15 - i, 1, 1); }
  });
  const ring = (col, fill) => tex(32, 32, g => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const a = Math.atan2(y + 0.5 - 16, x + 0.5 - 16), d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16) * Math.cos(Math.PI / 6) / Math.cos(((a % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3) - Math.PI / 6);
      if (d < 15 && (fill ? dot(x, y) < 0.35 : d > 12.5)) px(g, col, x, y);
    }
  });
  P.flares = [ring('#ff8ec8', true), ring('#8ad8ff', false), ring('#fff08a', true), ring('#b8ffb0', false), ring('#c9b6f2', true)];
  // a faraway pink cloud of gas, and a spiral galaxy
  P.nebula = tex(64, 32, g => {
    const n = noise(5);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) {
      const e = 1 - Math.hypot((x - 31.5) / 32, (y - 15.5) / 16), k = e * n(x / 9, y / 6, 7.1) * 1.8;
      if (dot(x, y) < k - 0.25) px(g, k > 0.7 ? '#ff8ec8' : k > 0.5 ? '#e0509a' : '#5a2a78', x, y);
    }
  });
  P.galaxy = tex(32, 32, g => {
    for (let i = 0; i < 400; i++) {
      const arm = i % 2, r = (i / 400) * 14, a = r * 0.55 + arm * Math.PI + Math.sin(i * 7.1) * 0.25;
      px(g, r < 3 ? '#fff6b0' : r < 8 ? '#c9b6f2' : '#8a9af0', Math.round(16 + r * Math.cos(a)), Math.round(16 + r * Math.sin(a) * 0.55));
    }
  });
  return P;
}

// ---------- the land ----------
export function landPics(tex, C) {
  const P = {};
  // the ground, coloured by how high it is (the texture's height IS the land's height): sand, grass,
  // purple rock, then snow on the mountains
  P.ground = tex(16, 64, g => {
    const at = y => (y < 5 ? ['#f0d890', '#e8c878'] : y < 18 ? ['#58d04a', '#2a9a3a'] : y < 40 ? ['#9c86d6', '#6a5ab0'] : ['#ffffff', '#c8d8ff']);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 16; x++) {
      const [a, b] = at(y), [na] = at(y + 2);
      px(g, dot(x, y) < 0.18 + ((x * 7 + y * 3) % 5) * 0.03 ? b : na !== a && dot(x, y) < 0.5 ? na : a, x, y);
    }
  });
  P.water = tex(16, 16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(g, Math.sin(x / 2.5 + Math.sin(y / 3) * 2) > 0.75 ? '#dff6ff' : (x + y) % 7 ? '#2a6af0' : '#58c8f0', x, y); });
  P.foam = tex(16, 4, g => { for (let x = 0; x < 16; x++) px(g, (x * 5) % 3 ? C.white : '#bff0ff', x, 1 + (x % 3 === 0 ? 1 : 0), 1, 2); });
  // the sky: deep purple up high, through blue and turquoise, to a pink glow at the horizon
  P.sky = tex(4, 64, g => {
    bands(g, ['#2a0a58', '#3a2a9c', '#2a60e0', '#3aa8f0', '#8ae0f0', '#ffb0d8', '#ffd8a0'], 0, 0, 4, 32);
    px(g, '#ffd8a0', 0, 32, 4, 32);
  });
  P.cloud = tex(32, 16, g => { oval(g, 10, 10, 8, 5, C.white); oval(g, 18, 7, 9, 6, C.white); oval(g, 25, 10, 6, 4, C.white); px(g, '#d8e0ff', 3, 13, 27, 2); px(g, '#c8d0f0', 5, 15, 22, 1); });
  // the ringed planet in the sky, and a little moon
  P.ringed = tex(48, 24, g => {
    oval(g, 24, 12, 9, 9, '#ff9a5a', '#e0602a'); for (let y = 5; y < 20; y += 4) px(g, '#ffc08a', 17, y, 14, 1);
    for (let x = 0; x < 48; x++) { const y = Math.round(12 + (x - 24) * 0.12); if (Math.abs(x - 24) > 7 || x % 2) px(g, x % 3 ? '#fff08a' : '#ffd23a', x, y, 1, 2); }
  });
  P.moon = tex(16, 16, g => { oval(g, 8, 8, 7, 7, '#e8dcff', '#c9b6f2'); px(g, '#c9b6f2', 5, 5, 2, 2); px(g, '#c9b6f2', 9, 10, 3, 2); });
  // alien plants along the beach: pink and turquoise, obviously
  P.plant = tex(16, 32, g => {
    for (let y = 10; y < 32; y++) px(g, y % 4 ? '#b87848' : '#7a4a2a', 7 + Math.round(Math.sin(y / 5) * 1.5), y, 2, 1);
    for (const [dx, dy, col] of [[-6, 2, '#ff8ec8'], [5, 1, '#ff8ec8'], [-4, -3, '#e0509a'], [4, -4, '#e0509a'], [0, -5, '#2ad0c0']]) oval(g, 8 + dx, 10 + dy, 4, 2, col);
  });
  P.shrub = tex(16, 12, g => { oval(g, 8, 8, 7, 4, '#2ad0c0', '#1a8a80'); for (const x of [3, 7, 11]) px(g, C.pink, x, 5, 1, 1); });
  P.rock = tex(16, 12, g => { oval(g, 8, 7, 7, 5, '#8a88a8', '#5e5c80'); px(g, '#c8c6e0', 5, 4, 3, 1); });
  return P;
}

// ---------- Sadie's space room ----------
export function roomPics(tex, C, words, sadie) {
  const P = {};
  P.wall = tex(32, 32, g => {
    px(g, '#1a1a60', 0, 0, 32, 32);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (dot(x, y) < 0.08 && (x * 3 + y * 5) % 4 === 0) px(g, '#26268a', x, y);
    for (const [x, y, c] of [[3, 4, C.white], [20, 7, C.yellow], [11, 18, C.white], [27, 23, C.pink], [6, 28, '#8ad8ff'], [16, 12, C.white]]) px(g, c, x, y);
    for (const [x, y] of [[24, 14]]) { px(g, C.yellow, x, y - 1); px(g, C.yellow, x - 1, y, 3, 1); px(g, C.yellow, x, y + 1); }
    oval(g, 8, 10, 2.5, 2.5, '#ff9a5a'); px(g, '#fff08a', 4, 10, 9, 1);
  });
  P.ceiling = tex(32, 32, g => { px(g, '#120a3a', 0, 0, 32, 32); for (const [x, y] of [[4, 5], [20, 3], [12, 16], [27, 20], [7, 26], [18, 28]]) { px(g, '#d8ffb0', x, y); px(g, '#8af070', x - 1, y); px(g, '#8af070', x + 1, y); px(g, '#8af070', x, y - 1); px(g, '#8af070', x, y + 1); } });
  P.floor = tex(16, 16, g => { px(g, '#4a4a78', 0, 0, 16, 16); px(g, '#5e5c80', 0, 0, 8, 8); px(g, '#5e5c80', 8, 8, 8, 8); px(g, '#34305c', 0, 15, 16, 1); px(g, '#34305c', 15, 0, 1, 16); });
  // a round rug that's a ringed planet
  P.rug = tex(48, 48, g => {
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
      const dx = x + 0.5 - 24, dy = y + 0.5 - 24, d = Math.hypot(dx, dy), r = Math.hypot(dx, dy * 2.6);
      if (d < 13) px(g, Math.floor(d / 3 + dy / 6) % 2 ? '#e0509a' : '#ff8ec8', x, y);
      else if (r < 23.5 && r > 17) px(g, r > 22 ? '#8a5a10' : '#ffd23a', x, y);
    }
  });
  // the radio: a boombox with two speakers and a tape deck
  P.radio = tex(40, 20, g => {
    px(g, C.ink, 0, 0, 40, 20); px(g, '#e83a3a', 1, 1, 38, 18); px(g, '#ff7a7a', 1, 1, 38, 1);
    for (const cx of [8, 32]) { oval(g, cx, 11, 6, 6, '#34305c', C.ink); oval(g, cx, 11, 2, 2, '#8a88a8'); }
    px(g, C.ink, 15, 7, 10, 7); px(g, '#8ad8ff', 16, 8, 8, 3); px(g, '#34305c', 16, 12, 8, 1);
    for (let x = 15; x < 25; x += 3) px(g, C.gold, x, 3, 2, 2);
    words(g, 'FM', 20, 15, 1, C.white, { align: 'center' });
  });
  P.note = tex(8, 10, g => { px(g, C.yellow, 5, 0, 1, 8); px(g, C.yellow, 5, 0, 3, 1); px(g, C.yellow, 6, 1, 2, 1); oval(g, 3.5, 8, 2.5, 1.8, C.yellow); });
  // the sign over the button
  P.sign = tex(80, 32, g => {
    px(g, C.ink, 0, 0, 80, 32); px(g, '#ffd23a', 1, 1, 78, 30); px(g, '#e83a3a', 3, 3, 74, 26);
    for (let x = 4; x < 76; x += 4) { px(g, x % 8 ? C.yellow : C.white, x, 1, 2, 1); px(g, x % 8 ? C.white : C.yellow, x, 30, 2, 1); }
    words(g, 'FUN SPACE', 40, 6, 2, C.yellow, { align: 'center', shadow: C.ink });
    words(g, 'ADVENTURE', 40, 18, 2, C.yellow, { align: 'center', shadow: C.ink });
  });
  // her speech bubble
  P.bubble = tex(64, 24, g => {
    oval(g, 32, 9.5, 31, 9.5, C.ink); oval(g, 32, 9.5, 30, 8.5, C.white);
    for (let i = 0; i < 5; i++) px(g, i === 4 ? C.ink : C.white, 22 - i, 18 + i, 3, 1);
    px(g, C.ink, 20, 23, 2, 1);
    words(g, 'I LOVE SPACE!', 32, 7, 1, C.ink, { align: 'center' });
  });
  P.poster = tex(32, 44, g => {
    px(g, C.ink, 0, 0, 32, 44); px(g, '#2a6af0', 1, 1, 30, 42);
    for (const [x, y] of [[4, 20], [27, 16], [8, 34], [25, 38]]) px(g, C.white, x, y);
    // a rocket
    px(g, C.white, 13, 14, 6, 16); px(g, C.red, 13, 11, 6, 3); px(g, C.red, 14, 9, 4, 2); px(g, C.red, 15, 8, 2, 1);
    oval(g, 16, 19, 2, 2, '#8ad8ff', C.ink); px(g, C.red, 10, 25, 3, 5); px(g, C.red, 19, 25, 3, 5);
    for (let y = 30; y < 38; y++) px(g, y % 2 ? '#ffd23a' : '#ff7a2a', 14 + (y % 3 === 0 ? 1 : 0), y, 4 - (y > 34 ? 2 : 0), 1);
    words(g, 'SPACE!', 16, 3, 1, C.yellow, { align: 'center', shadow: C.ink });
  });
  // Sadie in a space helmet: her own sprite, with a fishbowl helmet round her head and a little antenna
  const helmet = blink => tex(64, 56, g => {
    if (sadie) g.drawImage(blink || sadie, 3, 9);
    const cx = 44, cy = 25, r = 14.5;
    for (let y = 0; y < 56; y++) for (let x = 0; x < 64; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d > r - 1.2 && d <= r) px(g, '#dff6ff', x, y);
      else if (d > r - 2.2 && d <= r - 1.2 && (x + y) % 2) px(g, '#8ad8ff', x, y);
      else if (d < r - 1.2 && dot(x, y) < 0.08) px(g, '#bff0ff', x, y);
    }
    for (let a = 0; a < 8; a++) { const t = Math.PI * (1.1 + a * 0.05); px(g, C.white, Math.round(cx + (r - 4) * Math.cos(t)), Math.round(cy + (r - 4) * Math.sin(t)), 2, 1); }
    px(g, '#8a88a8', cx, cy - r - 5, 1, 5); oval(g, cx + 0.5, cy - r - 6, 1.6, 1.6, C.red);
    px(g, '#8a88a8', 32, 38, 23, 3); px(g, '#c8c6e0', 33, 38, 21, 1);
  });
  P.helmet = helmet(); P.helmetBlink = blinkPic => helmet(blinkPic);
  return P;
}

// Sadie's face for the box her words come up in: a crop of her sprite round her head
export function portrait(canvas, sadie) {
  const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
  px(g, '#5a2a78', 0, 0, canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 2) px(g, '#4a1e68', 0, y, canvas.width, 1);
  if (sadie) g.drawImage(sadie, 28, 4, 26, 26, 0, 0, canvas.width, canvas.height);
}
