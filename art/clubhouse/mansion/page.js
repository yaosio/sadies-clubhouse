// The mock-up page around the 3D scene: the view buttons, computer/phone, the little on-screen
// bits (all the game would show), Sadie's letter, and what to look for in each view.
import { start } from './mockup.js';

const $ = s => document.querySelector(s);
const SAYS = {
  outside: `Where you start: at the front gate. The tower in the middle is the cat tree's trunk, and its top is always being built (the scaffolding and the sign). The wing on the left is a branch (a covered bridge joins it, round the side); the bare platform and sign peeking out on the right is where the next branch goes. The two turrets at the front lean out a little: from the gate, they're ears. Look for the cat weathervane, the porch pillars wrapped in scratching rope (clawed up at the bottom), the cat flap in the front door, the FRIENDS ONLY mat and one hedge shaped like a cat. Sadie is on the gatepost, expecting you (not that she'd show it).`,
  invite: `Only the very first time you visit: Sadie's letter, in her own handwriting, over the view of the gate. Close it and walk up the path.`,
  hall: `Just inside the front door. The middle of the house is one tall round hall with a giant scratching post up the middle, and the stairs wind round it like a cat tree, with carpeted perches. Each floor is a ring of doors (the first one is up there with the green and blue doors). The top floor is still being built: planks, scaffolding, tape and a tarp for a roof. Down here: wallpaper with fish bones and paw prints in it, the shredded armchair under Duchess Sadie, a vase knocked off its table, Sadie asleep in the box the chandelier came in, in the sunbeam, and a feather toy someone tied to the chandelier. The taped-off archway (round to the left, out of sight here) leads to a new wing. The hall is far too big for the tower you saw outside, on purpose.`,
  landing: `Up on the first landing. Every room gets a door here: Dropper World's (hay poking out underneath, and a dirt pile where the mole came up through the floor) and TypeFitter's (its nameplate doesn't fit). The boarded-up ones are for the next rooms. Every door has a cat-sized one beside it. The only thing on screen is a small hint when you're at a door.`,
};

// Sadie's letter, drawn small in wobbly handwriting and blown up in big square pixels
function letter() {
  const c = $('#letterArt'), g = c.getContext('2d'), W = c.width, H = c.height;
  const px = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  px('#6a3a88', 0, 0, W, H); px('#fff4e4', 1, 1, W - 2, H - 2);
  for (let x = 3; x < W - 3; x++) { px(x % 6 < 3 ? '#ff8ec8' : '#8ad8ff', x, 3); px(x % 6 < 3 ? '#ff8ec8' : '#8ad8ff', x, H - 4); }
  for (let y = 18; y < H - 12; y += 17) for (let x = 10; x < W - 10; x += 2) px('#dccff4', x, y + 15);
  const t = document.createElement('canvas'); t.width = W; t.height = H; const k = t.getContext('2d');
  k.font = '17px "Patrick Hand", "Comic Sans MS", cursive'; k.fillStyle = '#000'; k.textBaseline = 'top';
  const lines = ['Dear friend,', 'I have decided to share my', 'clubhouse with all my friends.', 'You are invited.', 'Come in. Wipe your paws.', 'Do not sit in my chair.'];
  lines.forEach((l, i) => k.fillText(l, 12 + (i % 2), 16 + i * 17));
  k.font = '22px "Patrick Hand", "Comic Sans MS", cursive'; k.fillText('Sadie', W - 88, 14 + 6 * 17);
  const d = k.getImageData(0, 0, W, H);
  for (let i = 0; i < d.data.length; i += 4) { const on = d.data[i + 3] > 90; d.data[i] = 42; d.data[i + 1] = 26; d.data[i + 2] = 110; d.data[i + 3] = on ? 255 : 0; }
  k.putImageData(d, 0, 0); g.drawImage(t, 0, 0);
  // her signature paw print, in pink ink
  const pawX = W - 30, pawY = H - 30, pink = '#e0509a';
  px(pink, pawX, pawY + 7, 8, 6); px(pink, pawX + 1, pawY + 13, 6, 1);
  for (const [x, y] of [[-2, 3], [1, 0], [5, 0], [8, 3]]) px(pink, pawX + x, pawY + y, 3, 3);
  // wax seal, top right
  for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y < 40) px((x + y) % 3 ? '#e83a3a' : '#a02030', W - 16 + x, 12 + y);
  px('#ffb0b0', W - 18, 11, 4, 3); for (const [x, y] of [[-4, 5], [-2, 7], [1, 7], [3, 5]]) px('#ffb0b0', W - 17 + x, 3 + y, 1, 1);
}

const scene = await start($('#view'), null);
letter();

let view = 'outside', device = 'computer';
function show() {
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === view));
  document.querySelectorAll('[data-device]').forEach(b => b.setAttribute('aria-pressed', b.dataset.device === device));
  const stage = $('#stage'); stage.dataset.device = device; stage.dataset.view = view;
  $('#says').textContent = SAYS[view];
  scene.show(view);
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { view = b.dataset.view; show(); }));
document.querySelectorAll('[data-device]').forEach(b => b.addEventListener('click', () => { device = b.dataset.device; show(); scene.resize(); }));
$('#ok').addEventListener('click', () => { view = 'outside'; show(); });
addEventListener('resize', () => scene.resize());
const first = location.hash.slice(1).split('-');
if (SAYS[first[0]]) view = first[0];
if (first[1] === 'phone') device = 'phone';
show();
window.__clubhouseReady = true;
