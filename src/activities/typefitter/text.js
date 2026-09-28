// The text on TypeFitter's page, and its box. Every button changes the text's style (`apply`); the
// text is drawn one letter per span so WarpArt can bend it and the ransom note can mix fonts
// (`render`); then it's measured, the box is put around it, always a bit too small (`boxFor` in
// love.js), and the page zooms out if the text wouldn't be seen whole (`layout`).
import { boxFor } from './love.js';

export const FONTS = [
  { name: 'TIMELY ROMAN', css: "'Old Standard TT',Georgia,serif" },
  { name: 'COMIC SANDS', css: "'Comic Neue','Comic Sans MS',cursive" },
  { name: 'GOTHICK', css: "'UnifrakturMaguntia',serif" },
  { name: 'FANCY SCRIPT', css: "'Pacifico',cursive" },
  { name: 'DOS CLASSIC', css: "'VT323',monospace" },
  { name: 'BILLBOARD', css: "'Bungee',Impact,sans-serif" },
  { name: 'RANSOM NOTE', css: null }, // every letter cut from a different magazine
];
// the fonts to load up front, so switching never shows a stand-in
export const WEB_FONTS = ['Old Standard TT', 'Comic Neue', 'UnifrakturMaguntia', 'Pacifico', 'VT323', 'Bungee'];
const SIZES = [22, 30, 40, 52, 66, 84, 104];
const WARPS = ['none', 'arch', 'wave', 'space', 'grow'];
const WARP_NAMES = { none: 'NO WARP', arch: 'ARCH', wave: 'WAVE', space: 'OFF INTO SPACE', grow: 'GROWING' };
const SPACINGS = [0, .18, .45, -.06];
const COLORS = ['ink', 'red', 'rainbow', 'chrome'];
const COLOR_NAMES = { ink: 'BLACK', red: 'RED', rainbow: 'RAINBOW', chrome: 'CHROME' };
const LOUD = ['#e0103a', '#ff8a00', '#e8c000', '#1aa84a', '#1a6aff', '#8a2be2', '#ff3d8b'];
const SYMS = '☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼';

// each new sentence starts plain, in one of the first three fonts
export const freshStyle = (random = Math.random) => ({ font: Math.floor(random() * 3), bold: false, italic: false, underline: false,
  outline: false, shadow: false, warp: 0, size: 3, space: 0, color: 0, symbols: false });

export function apply(fx, st) {
  switch (fx) {
    case 'font': st.font = (st.font + 1) % FONTS.length; break;
    case 'bold': case 'italic': case 'underline': case 'outline': case 'shadow': case 'symbols': st[fx] = !st[fx]; break;
    case 'warp': st.warp = (st.warp + 1) % WARPS.length; break;
    case 'bigger': st.size = Math.min(SIZES.length - 1, st.size + 1); break;
    case 'smaller': st.size = Math.max(0, st.size - 1); break;
    case 'squeeze': st.space = (st.space + 1) % SPACINGS.length; break;
    case 'color': st.color = (st.color + 1) % COLORS.length; break;
  }
}
// which buttons show as switched on
export const lit = st => ({ bold: st.bold, italic: st.italic, underline: st.underline, outline: st.outline, shadow: st.shadow,
  warp: st.warp > 0, squeeze: st.space > 0, color: st.color > 0, symbols: st.symbols });
// the style in words, for what Sadie says about it
export const describe = st => ({ ...st, fontName: FONTS[st.font].name, warpName: WARP_NAMES[WARPS[st.warp]], colorName: COLOR_NAMES[COLORS[st.color]] });

const $ = id => document.getElementById(id);

export function render(st, sentence, round) {
  const t = $('txt'), f = FONTS[st.font], sz = SIZES[st.size], warp = WARPS[st.warp], color = COLORS[st.color];
  t.textContent = '';
  t.style.fontFamily = f.css || FONTS[0].css;
  t.style.fontSize = sz + 'px';
  t.style.fontWeight = st.bold ? 700 : 400;
  t.style.fontStyle = st.italic ? 'italic' : 'normal';
  t.style.letterSpacing = SPACINGS[st.space] + 'em';
  t.style.transform = warp === 'space' ? 'perspective(260px) rotateX(38deg)' : '';
  t.style.transformOrigin = '50% 100%';
  const chars = [...sentence], n = chars.length;
  let si = 0;
  chars.forEach((ch, i) => {
    const s = document.createElement('span');
    let shown = ch;
    if (st.symbols && ch !== ' ') shown = SYMS[(ch.toLowerCase().charCodeAt(0) + si++) % SYMS.length];
    s.textContent = ch === ' ' ? ' ' : shown;
    if (st.underline) { s.style.textDecoration = 'underline'; s.style.textDecorationThickness = '.07em'; s.style.textUnderlineOffset = '.12em'; }
    let fill = '#111';
    if (color === 'red') fill = '#d0102a';
    if (color === 'rainbow') fill = LOUD[i % LOUD.length];
    if (color === 'chrome') { s.style.backgroundImage = 'linear-gradient(#ffffff 0%,#9aa0c8 45%,#2a2a5a 50%,#b8c0ff 80%,#ffffff)'; s.style.webkitBackgroundClip = 'text'; s.style.backgroundClip = 'text'; fill = 'transparent'; }
    if (st.outline) { s.style.webkitTextStroke = Math.max(1, sz / 40) + 'px ' + (fill === 'transparent' ? '#111' : fill); fill = 'transparent'; }
    s.style.color = fill;
    if (st.shadow) s.style.textShadow = `${Math.max(2, sz / 16)}px ${Math.max(2, sz / 16)}px 0 #9a96b8`;
    if (!f.css) {
      const r = FONTS[(i * 5 + round) % 6]; s.style.fontFamily = r.css;
      if (ch !== ' ') { s.style.background = ['#fff6a0', '#ffffff', '#d8f0ff', '#ffd8e8'][i % 4]; s.style.padding = '0 .05em'; s.style.margin = '0 .03em'; }
      s.style.rotate = (((i * 37) % 13) - 6) + 'deg';
    }
    const u = n > 1 ? i / (n - 1) : 0;
    if (warp === 'arch') s.style.transform = `translateY(${-Math.sin(u * Math.PI) * sz * .9}px) rotate(${(u - .5) * -50}deg)`;
    if (warp === 'wave') s.style.transform = `translateY(${Math.sin(i * .8) * sz * .3}px)`;
    if (warp === 'grow') s.style.fontSize = (.45 + u * 1.1) + 'em';
    t.appendChild(s);
  });
}

// Measure the text, put the box round it (too small), zoom out if needed. Returns the sizes.
let zoom = 1;
export function layout(love) {
  const t = $('txt'), z = $('zoomer'), doc = $('doc');
  t.style.left = '0px'; t.style.top = '0px';
  z.style.transform = `scale(${zoom})`;
  const measure = () => {
    const o = z.getBoundingClientRect(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const s of t.children) { const r = s.getBoundingClientRect(); if (!r.width) continue; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
    if (x1 < x0) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: (x0 - o.left) / zoom, y: (y0 - o.top) / zoom, w: (x1 - x0) / zoom, h: (y1 - y0) / zoom };
  };
  let m = measure();
  t.style.left = (-m.x - m.w / 2) + 'px'; t.style.top = (-m.y - m.h / 2) + 'px'; // the text's middle on the page's middle
  m = measure();
  const dw = doc.clientWidth, dh = doc.clientHeight;
  zoom = Math.max(.05, Math.min(1, (dw - 36) / (m.w + 8), (dh - 50) / (m.h + 30)));
  z.style.transform = `scale(${zoom})`;
  const bx = boxFor(m.w, m.h, love), b = $('box');
  b.style.width = bx.w + 'px'; b.style.height = bx.h + 'px';
  b.style.left = (m.x + m.w / 2 - bx.w / 2) + 'px'; b.style.top = (m.y + m.h / 2 - bx.h / 2) + 'px';
  b.style.setProperty('--unz', 1 / zoom); // its label stays the same size on screen
  const ov = $('over');
  ov.textContent = `${Math.round(m.w - bx.w)} PX TOO WIDE ►`;
  ov.style.left = (m.x + m.w / 2 + bx.w / 2) + 'px'; ov.style.top = (m.y + m.h / 2 + bx.h / 2 + 4 / zoom) + 'px';
  ov.style.transform = `translateX(-100%) scale(${1 / zoom})`;
  $('stSize').textContent = `TEXT ${Math.round(m.w)}X${Math.round(m.h)}`;
  $('stBox').textContent = `BOX ${Math.round(bx.w)}X${Math.round(bx.h)}`;
  $('stZoom').textContent = `ZOOM ${Math.round(zoom * 100)}%`;
  return { text: { w: m.w, h: m.h }, box: bx, zoom };
}
