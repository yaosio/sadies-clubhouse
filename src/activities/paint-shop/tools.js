// What's for sale (well, for free) in the paint shop: the pots on the counter and the tools on the
// pegboard, and what each one does. Plain numbers, no browser: the tests read them.
import { PAINTS } from './layer.js';
import { STAMPS } from './stamps.js';

// The pots: every paint, and the RAINBOW pot (`paint` 'rainbow': a stroke goes through the colours).
export const POTS = [...PAINTS.slice(1).map((p, i) => ({ paint: i + 1, name: p.name })), { paint: 'rainbow', name: 'RAINBOW' }];

// The tools. r: how big, in metres from the middle. kind: brush (paints as you hold it), spray (dots,
// as you hold it), fill (the whole patch of one colour you press on), stamp (once per press), boom
// (the dynamite: the thing you press on goes back to bare, with a bang that's really a soft fwump).
export const TOOLS = [
  { id: 'brush', name: 'BRUSH', kind: 'brush', r: 0.06 },
  { id: 'roller', name: 'ROLLER', kind: 'brush', r: 0.2, square: true },
  { id: 'spray', name: 'SPRAY CAN', kind: 'spray', r: 0.3, dots: 14 },
  { id: 'bucket', name: 'PAINT BUCKET', kind: 'fill' },
  ...Object.entries(STAMPS).map(([id, s]) => ({ id: 'stamp-' + id, name: s.name + ' STAMP', kind: 'stamp', stamp: id })),
  { id: 'dynamite', name: 'DYNAMITE', kind: 'boom' },
];
export const tool = id => TOOLS.find(t => t.id === id) || TOOLS[0];

// what you're holding to start with (and after starting the paint shop over)
export const START = { tool: 'brush', paint: 1 };

// how far a rainbow stroke goes on each colour, in metres
export const RAINBOW_STEP = 0.18;
