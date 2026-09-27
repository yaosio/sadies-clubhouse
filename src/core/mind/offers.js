// Offers: things in the world say what they're good for, so characters don't need a rule for
// every thing. Hay says "I'm food", the barn "I'm home", a thrown ball "chase me", Sadie "I'm a
// friend". A character that wants food looks for food offers, whatever and wherever they are, so
// anything new that offers food (or hay that moves) works without changing the character.
//
// Each kind of thing registers a function that lists its offers right now:
//   { kind, thing, x, y }   kind: food | home | fetch | friend
const sources = [];
export function offersFrom(list) { sources.push(list); }
export function offers(kind) {
  const out = [];
  for (const list of sources) for (const o of list()) if (o.kind === kind) out.push(o);
  return out;
}
