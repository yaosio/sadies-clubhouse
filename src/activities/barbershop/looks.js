// What Sadie can wear at Marbles' (hairdos, taildos and outfits), as plain lists, and how each is
// drawn: pixel by pixel on a see-through picture the size of Sadie's own (58 x 47 dots) with room
// above for tall hair and hats (`TOP` rows), laid over her in the shop. Nothing here touches the
// browser except the canvas it's handed, so a test can read the lists.
export const TOP = 24;                // rows of the picture above Sadie's head
export const W = 58, H = 47 + TOP;    // the picture's size, in dots
const K = '#2b1d3c';                  // the outline colour of Sadie's sprite

// every item: a name, a colour (for its wig head, ribbon or hanger and the use's swatch) and how to draw it
// `r(x, y, w, h, colour)` draws a rectangle in Sadie's own dots (0, 0 is her sprite's top left)
export const HAIR = [
  { name: 'JUST SADIE', color: '#d8d8e8', h: 0, draw() {} },
  { name: 'POMPADOUR', color: '#1a1a1a', h: 6, draw(r) {
    r(33, 6, 16, 6, K); r(34, 5, 14, 6, '#1a1a1a'); r(44, 3, 8, 6, K); r(45, 4, 7, 4, '#1a1a1a'); r(36, 6, 9, 1, '#555'); r(46, 5, 4, 1, '#555'); } },
  { name: 'PINK MOHAWK', color: '#ff4fa3', h: 9, draw(r) {
    for (let i = 0; i < 5; i++) { const x = 34 + i * 3, t = 2 + (i % 2) * 2; r(x, t, 3, 12 - t, K); r(x + 1, t + 1, 1, 10 - t, '#ff4fa3'); } } },
  { name: 'BIG BEEHIVE', color: '#3a7bff', h: 16, draw(r) {
    r(33, -8, 18, 20, K); r(34, -7, 16, 18, '#3a7bff'); r(36, -11, 12, 4, K); r(37, -10, 10, 4, '#3a7bff');
    for (let y = -9; y < 10; y += 3) r(36 + (y & 3), y, 9, 1, '#76a6ff'); } },
  { name: 'PIGTAILS', color: '#ffd23f', h: 3, draw(r) {
    r(34, 9, 15, 3, '#e8b030');
    r(27, 10, 7, 8, K); r(28, 11, 5, 6, '#ffd23f'); r(50, 10, 7, 8, K); r(51, 11, 5, 6, '#ffd23f');
    r(31, 9, 3, 3, '#e8202a'); r(50, 9, 3, 3, '#e8202a'); } },
  { name: 'BIG PERM', color: '#8a4b1f', h: 8, draw(r) {
    for (const [x, y] of [[30, 6], [34, 3], [39, 2], [44, 3], [48, 6], [29, 11], [50, 11], [32, 8], [46, 8]]) { r(x, y, 7, 7, K); r(x + 1, y + 1, 5, 5, '#8a4b1f'); r(x + 2, y + 2, 2, 2, '#b06a30'); } } },
];

// the tail's own dots (`mask`: [x, y] pairs, read off Sadie's picture once) are recoloured by some
export const TAIL = [
  { name: 'PLAIN TAIL', color: '#8a88a8', draw() {} },
  { name: 'POODLE POM', color: '#ffb3d9', draw(r) { r(5, 7, 9, 8, K); r(6, 8, 7, 6, '#ffb3d9'); r(7, 9, 3, 2, '#fff'); } },
  { name: 'BIG RED BOW', color: '#e8202a', draw(r) { r(4, 18, 5, 5, K); r(5, 19, 3, 3, '#e8202a'); r(12, 18, 5, 5, K); r(13, 19, 3, 3, '#e8202a'); r(8, 19, 5, 4, K); r(9, 20, 3, 2, '#ff6060'); } },
  { name: 'CANDY STRIPE', color: '#ffffff', draw(r, mask) { for (const [x, y] of mask) r(x, y, 1, 1, (x + y) % 4 < 2 ? '#e8202a' : '#ffffff'); } },
  { name: 'LION TUFT', color: '#e8902a', draw(r) { for (const [x, y] of [[3, 6], [8, 5], [11, 8], [4, 11], [9, 10]]) { r(x, y, 5, 5, K); r(x + 1, y + 1, 3, 3, '#e8902a'); } } },
  { name: 'GLITTER', color: '#ff78dc', sparkle: true, draw(r, mask, t) {
    const n = Math.floor(t * 1.1);   // (a new sparkle pattern about once a second: slow, never a flash)
    for (const [x, y] of mask) { const v = (x * 7 + y * 13 + n) % 9; if (v === 0) r(x, y, 1, 1, '#ffd23f'); else if ((x * 5 + y * 3) % 7 === 0) r(x, y, 1, 1, '#ff78dc'); } } },
];

// outfits: `body` goes on under the head, `hat` after the hair (it sits on top of it: `y` is the top of
// the hair); `show` is the little segment it has, if any
const hatTop = hair => 9 - hair.h;
export const OUTFIT = [
  { name: 'NO OUTFIT', color: '#c8c8d8', body() {}, hat() {} },
  { name: 'POP STAR', color: '#8a2be2', show: 'sing', body(r) {
      r(16, 26, 22, 9, K); r(17, 27, 20, 7, '#8a2be2');
      for (let x = 18; x < 36; x += 3) for (let y = 28; y < 34; y += 2) r(x + (y % 4 ? 1 : 0), y, 1, 1, '#ffd23f');
      r(30, 27, 2, 7, '#ff4fa3'); },
    hat(r) { r(34, 19, 13, 4, K); r(35, 20, 4, 2, '#ff4fa3'); r(42, 20, 4, 2, '#ff4fa3'); r(39, 20, 3, 1, K); } },
  { name: 'HARD HAT + VEST', color: '#ff8a1f', show: 'build', body(r) {
      r(16, 26, 22, 9, K); r(17, 27, 20, 7, '#ff8a1f'); r(17, 30, 20, 2, '#e8f0f0'); r(28, 27, 2, 7, '#c86010'); },
    hat(r, hair) { const y = hatTop(hair); r(31, y - 1, 22, 3, K); r(32, y, 20, 1, '#ffd23f'); r(35, y - 6, 14, 6, K); r(36, y - 5, 12, 5, '#ffd23f'); r(41, y - 6, 2, 6, '#e8b020'); } },
  { name: 'BALL GOWN', color: '#ff4fa3', show: 'dance', body(r) {
      r(15, 25, 26, 8, K); r(16, 26, 24, 7, '#ff6fb8');
      r(11, 32, 34, 14, K); r(12, 33, 32, 12, '#ff4fa3'); for (let x = 13; x < 43; x += 4) r(x, 34, 1, 11, '#ff9fd0'); r(12, 44, 32, 1, '#fff'); },
    hat(r, hair) { const y = hatTop(hair); r(36, y - 3, 11, 3, K); r(37, y - 2, 9, 2, '#ffd23f'); r(38, y - 4, 1, 1, '#ffd23f'); r(41, y - 5, 1, 2, '#3ee8b5'); r(44, y - 4, 1, 1, '#ffd23f'); } },
  { name: 'MAGICIAN', color: '#1a1a1a', show: 'magic', body(r) {
      r(13, 24, 27, 12, K); r(14, 25, 25, 10, '#1a1a1a'); r(14, 33, 25, 2, '#c01030'); r(38, 27, 5, 4, K); r(39, 28, 3, 2, '#e8202a'); },
    hat(r, hair) { const y = hatTop(hair); r(33, y - 1, 18, 3, K); r(36, y - 11, 12, 11, K); r(37, y - 10, 10, 9, '#1a1a1a'); r(37, y - 3, 10, 2, '#e8202a'); } },
  { name: 'SUPERHERO', color: '#e8202a', show: 'fly', body(r) {
      for (let y = 24; y < 40; y++) { const x0 = Math.round(30 - (y - 24) * 1.3); r(x0 - 1, y, 33 - x0, 1, K); r(x0, y, 31 - x0, 1, y > 37 ? K : '#e8202a'); }
      r(26, 26, 10, 8, K); r(27, 27, 8, 6, '#3a7bff'); r(29, 28, 4, 4, '#ffd23f'); },
    hat(r) { r(34, 20, 14, 3, K); r(35, 21, 3, 1, '#3a7bff'); r(43, 21, 3, 1, '#3a7bff'); } },
  { name: 'DETECTIVE', color: '#b08a5a', show: 'sleuth', body(r) {
      r(15, 25, 24, 10, K); r(16, 26, 22, 8, '#b08a5a'); r(16, 26, 22, 2, '#8a6a40'); },
    hat(r, hair) { const y = hatTop(hair); r(36, y - 7, 12, 2, K); r(34, y - 5, 16, 6, K); r(37, y - 6, 10, 2, '#9a7a4a'); r(35, y - 4, 14, 4, '#9a7a4a');
      for (let x = 36; x < 48; x += 3) r(x, y - 5, 1, 5, '#6a4a2a'); r(30, y, 6, 2, K); r(48, y, 6, 2, K); } },
  { name: 'PAJAMAS', color: '#7aa8ff', show: 'sleep', body(r) {
      r(15, 25, 25, 11, K); r(16, 26, 23, 9, '#7aa8ff'); for (const [x, y] of [[18, 28], [24, 31], [30, 27], [35, 32]]) r(x, y, 2, 2, '#ffd23f'); },
    hat(r, hair) { const y = hatTop(hair); r(35, y - 4, 14, 5, K); r(36, y - 3, 12, 4, '#3ee8b5'); r(48, y - 2, 6, 3, K); r(49, y - 1, 4, 2, '#3ee8b5'); r(54, y, 3, 3, '#fff'); } },
];

// draws what Sadie's wearing onto `g` (a W x H picture, cleared first): the tail, the outfit, the hair, the hat
export function drawLook(g, pick, mask, t = 0) {
  g.clearRect(0, 0, W, H);
  const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, TOP + y, w, h); };
  const hair = HAIR[pick.hair], tail = TAIL[pick.tail], out = OUTFIT[pick.outfit];
  tail.draw(r, mask, t); out.body(r); hair.draw(r); out.hat(r, hair);
}
