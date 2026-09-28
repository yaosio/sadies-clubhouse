// Feelings: what a character wants, as numbers from 0 (not at all) to 1 (can't think of anything
// else). They drift on their own (Sadie's hunger creeps up, Chooter winds up with energy) and get
// nudged by what happens (eating, zoomies, a rest in the barn). What a character does comes from
// its feelings: see think.js. Who each character is, and why they feel what they feel, is in
// docs/CHARACTERS.md.

const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

// Move each feeling by its rate (per second; negative rates fall), keeping it between 0 and 1.
export function drift(feel, rates, dt) {
  for (const k in rates) feel[k] = clamp01(feel[k] + rates[k] * dt);
}
// A sudden change from something that happened (eating a bundle: hunger - 0.5).
export function nudge(feel, k, by) { feel[k] = clamp01(feel[k] + by); }
