# Sadie in Dropper World

Who Sadie is and why she does what she does (`src/activities/dropper-world/core/sadie/brain.js`).
Read before changing how she behaves. How minds work: `minds.md`; her numbers:
`docs/dropper-world/tuning/sadie.md` and `docs/dropper-world/tuning/barn.md`.

The owner's late cat. A cat who thinks she's a cow.

- **Extremely food motivated.** That's why she goes after the hay. (`hunger`: her strongest
  feeling. Eating always matters to her: `eat` wants 1 + hunger, and she never walks past a
  bundle she can reach. Hunger creeps up over about 90 s; a bundle takes away half.)
- **She has a barn because she needs somewhere to live, and she thinks she's a cow.**
- **She drags the barn up the tower because she can't live in it if it's buried.** (`settled`:
  how at home she feels after her last trip, 1 right after, gone in 60 s. Once it's gone, a barn
  6+ blocks below her or buried 1+ block deep makes `fetchBarn` want 3, more than even hay.)
- **Impatient** when the hay is out of reach (`impatient`: fills in 12 s of waiting or pacing under
  it, gone the moment she eats, and fades over 25 s while she's getting somewhere). She's restless,
  so the mole thinks she wants to be buried, and drops pieces on her. That's how the pile grows
  under her hay. She has no idea it's trying to bury her; the mole has no idea it's helping.
- **Scared** by pieces lurching under her feet, or by falling (`scared`, a short-lived fear).
- **Her food getting away is not okay.** If the hay she's after is being carried off, she doesn't
  wait or pace: she runs after it, and eats it the moment she can reach it (even out of Chooter's
  mouth).
- **Not into play.** She's unimpressed when Chooter brings her the ball.
- Activities: `eat`, `fetchBarn`.
- Fits her, not built yet: tiredness, and napping in the barn when tired.
