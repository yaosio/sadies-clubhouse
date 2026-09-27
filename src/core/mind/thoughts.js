// What a character is thinking, in plain words, for the bubble you get by tapping them
// (ui/thoughts.js). Each character registers itself, the same way things register offers:
//   { who, name, x, y, h, think() }   x, y: their feet; h: how tall they are (for tapping)
//   think() -> { doing, why, feelings: [{ label, value }] }   value from 0 to 1
// think() only reads the character; it never changes anything or uses random numbers.
const sources = [];
export function mindsFrom(list) { sources.push(list); }
export function minds() { const out = []; for (const list of sources) out.push(...list()); return out; }
