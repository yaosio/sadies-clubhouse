// The mini golf's pictures, drawn on little canvases when the course is built: the painted plywood
// the greens stand on, the tee mats, the sign at each tee, the three silly clubs (a fish, a spoon, a
// sock), and the board by the patio with the best scores on it (drawn again whenever one's beaten).
const rect = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function speckle(g, c, x, y, w, h, n, seed = 1) {
  let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) rect(g, c, x + Math.floor(r() * w), y + Math.floor(r() * h), 1, 1);
}

export function drawArt({ tex, words, C }) {
  const A = {};
  // the plinth: plywood painted swimming-pool blue, a white stripe along the top, and scuffs
  A.plinth = tex(16, 16, g => {
    rect(g, '#2a78e8', 0, 0, 16, 16); speckle(g, '#1a58c0', 0, 0, 16, 16, 30, 4); speckle(g, '#5aa0ff', 0, 0, 16, 16, 10, 8);
    rect(g, C.white, 0, 0, 16, 2); rect(g, '#1a4ab0', 0, 2, 16, 1);
  });
  // a tee mat: rubbery green with a white T
  A.teeMat = tex(16, 12, g => {
    rect(g, '#1a6a2a', 0, 0, 16, 12); for (let y = 1; y < 12; y += 2) for (let x = (y >> 1) % 2; x < 16; x += 2) rect(g, '#2a8a3a', x, y);
    rect(g, C.white, 5, 3, 6, 1); rect(g, C.white, 7, 3, 2, 6);
  });
  // the sign at each tee: which hole, its name, and its par
  A.teeSign = (hole, n) => tex(104, 52, g => {
    rect(g, C.black, 0, 0, 104, 52); rect(g, C.pink, 1, 1, 102, 50); rect(g, C.pink3, 2, 2, 100, 48); rect(g, C.cream, 3, 3, 98, 46);
    words(g, `HOLE ${n}`, 52, 6, 2, C.pink2, { align: 'center' });
    words(g, hole.name, 52, 20, 2, C.ink, { align: 'center' });
    words(g, `PAR ${hole.par}`, 52, 34, 2, '#2a78e8', { align: 'center' });
  });
  // the clubs (seen side on, the end that hits the ball on the left)
  const club = draw => tex(32, 16, g => { g.clearRect(0, 0, 32, 16); draw(g); });
  A.club = name => club({
    // a fish, held by the tail
    fish: g => {
      for (let x = 2; x < 22; x++) { const w = Math.round(4.5 * Math.sin((x - 1) / 21 * Math.PI)); rect(g, '#4a90c8', x, 8 - w, 1, w * 2); rect(g, '#bfe4ff', x, 8, 1, Math.max(0, w - 1)); }
      rect(g, C.black, 5, 6, 1, 1); rect(g, C.white, 5, 5, 1, 1); rect(g, C.pink2, 2, 8, 2, 1);
      for (let y = 0; y < 5; y++) { rect(g, '#3a78b0', 22 + y, 8 - y, 1, y * 2 + 1); }
      rect(g, '#2a5a90', 27, 2, 4, 12);
    },
    // a big silver spoon
    spoon: g => {
      for (let y = 3; y < 13; y++) { const w = Math.round(5 * Math.sin((y - 2) / 11 * Math.PI)); rect(g, '#d8d8e8', 7 - w, y, w * 2, 1); }
      rect(g, C.white, 4, 5, 2, 3); rect(g, '#9a9ab0', 10, 6, 1, 4);
      rect(g, '#b8b8c8', 12, 7, 19, 2); rect(g, '#e8e8f4', 12, 7, 19, 1);
    },
    // a stripy sock, stuffed (a tennis ball in the toe, for heft)
    sock: g => {
      for (let x = 2; x < 30; x++) for (let y = 4; y < 12; y++) rect(g, Math.floor(x / 3) % 2 ? C.red : C.cream, x, y);
      rect(g, C.pink, 2, 4, 5, 8); rect(g, C.pink2, 2, 11, 5, 1);
      rect(g, C.gold, 26, 3, 4, 10); rect(g, C.gold2, 26, 12, 4, 1);
    },
  }[name] || (g => rect(g, C.grey, 2, 6, 28, 4)));

  // the score board by the patio: each hole's best, and the best round. `draw(best)` paints it again.
  const board = tex(96, 72, () => {});
  A.board = board;
  A.drawBoard = (holes, best) => {
    const g = board.image.getContext('2d');
    rect(g, C.black, 0, 0, 96, 72); rect(g, '#1a6a2a', 1, 1, 94, 70); rect(g, '#0e4a1a', 2, 2, 92, 68);
    words(g, 'BEST SCORES', 48, 5, 2, C.gold, { align: 'center' });
    rect(g, C.gold2, 6, 16, 84, 1);
    holes.forEach((h, i) => {
      const b = best.holes?.[h.id];
      words(g, `${i + 1}`, 8, 21 + i * 11, 2, C.pink);
      words(g, h.name.length > 15 ? h.name.slice(0, 14) + '.' : h.name, 18, 22 + i * 11, 1, C.cream);
      words(g, b ? String(b) : '-', 86, 21 + i * 11, 2, b && b <= h.par ? C.yellow : C.white, { align: 'center' });
    });
    rect(g, C.gold2, 6, 55, 84, 1);
    words(g, 'ROUND', 8, 60, 1, C.cream);
    words(g, best.round ? String(best.round) : '-', 86, 58, 2, C.yellow, { align: 'center' });
    if (best.trick) words(g, 'TRICK SHOT!', 30, 60, 1, C.pink);
    board.needsUpdate = true;
  };
  return A;
}
