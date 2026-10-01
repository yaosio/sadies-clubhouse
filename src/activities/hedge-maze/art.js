// The hedge maze's pictures, drawn on little canvases when the maze is built: the garden gates (the
// leaves of every doorway in and out, and the shut ones in the maze), the signs at the arches, and
// the hedges, a deeper, leafier green than the garden's.
const rect = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function speckle(g, c, x, y, w, h, n, seed = 1) {
  let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) rect(g, c, x + Math.floor(r() * w), y + Math.floor(r() * h), 1, 1);
}

export function drawArt({ tex, words, C }) {
  const A = {};
  // hedge: dark leaves, lighter tips, a few tiny white flowers (it's a well-kept maze)
  A.hedge = tex(16, 16, g => {
    rect(g, '#1f7a34', 0, 0, 16, 16);
    speckle(g, '#2fa046', 0, 0, 16, 16, 70, 3); speckle(g, '#125224', 0, 0, 16, 16, 50, 9); speckle(g, '#7ee06a', 0, 0, 16, 16, 14, 17);
    rect(g, '#fff4e4', 4, 6); rect(g, '#fff4e4', 12, 13);
  });
  // a garden gate leaf: green planks, an arched top rail, iron studs, a ring to pull
  const gate = flip => tex(16, 40, g => {
    rect(g, '#2a7a3a', 0, 0, 16, 40);
    for (let x = 0; x < 16; x += 4) { rect(g, '#1a5a2a', x, 0, 1, 40); rect(g, '#3a9a4a', x + 1, 0, 1, 40); }
    for (const y of [5, 20, 34]) { rect(g, '#5a3a1a', 0, y, 16, 2); for (let x = 1; x < 16; x += 4) rect(g, C.gold, x, y, 1, 1); }
    const rx = flip ? 2 : 12; rect(g, C.gold2, rx, 24, 2, 3); rect(g, C.gold, rx, 25, 2, 1);
  });
  A.gateL = gate(false); A.gateR = gate(true);
  const sign = (w, h, a, b) => tex(w, h, g => {
    rect(g, C.black, 0, 0, w, h); rect(g, '#7ad06a', 1, 1, w - 2, h - 2); rect(g, '#2a7a3a', 2, 2, w - 4, h - 4); rect(g, C.cream, 3, 3, w - 6, h - 6);
    words(g, a, w / 2, h / 2 - 11, 2, '#1a5a2a', { align: 'center' });
    words(g, b, w / 2, h / 2 + 1, 2, C.red, { align: 'center' });
  });
  A.signIn = sign(96, 32, 'HEDGE MAZE', 'ENTRANCE');
  A.signOut = sign(96, 32, 'MAZE EXIT', 'NO ENTRY!!');
  return A;
}
