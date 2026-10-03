# The mole in Dropper World

Who the mole is and why it does what it does (`src/activities/dropper-world/core/mole.js`). Read
before changing how it behaves. How minds work: `minds.md`; its numbers:
`docs/dropper-world/tuning/supply-mole.md` and `docs/dropper-world/tuning/hay.md`.

It drops the pieces. It lives up in the sky, in a propeller beanie, and nobody knows why (that's the
joke). The player doesn't steer it: it decides where every piece goes, for its own reasons.

- **Everything belongs underground.** It's a mole. It can't imagine anyone wanting otherwise.
- **Thinks everyone else wants to be buried too.** Anyone restless (any `restless` offer at 0.3 or
  more) must be wishing they were underground, so `bury` wants 1 + 2 × how restless they are, and
  it drops pieces on the most restless one: Sadie waiting impatiently under hay she can't reach,
  or Chooter fidgeting for attention. Burying Sadie builds the pile up under her, so she climbs to
  her hay. It never means to help.
- **The barn is a home, and homes belong underground.** When nobody's restless, `barn` (want 1):
  it drops pieces all over the barn. Sadie drags it back out, of course, and it starts again.
- **Hay doesn't belong underground.** Digging for its next piece, it now and then comes up with a
  bundle of hay instead (whenever fewer than 3 are about). It's shocked ("Hay?! Down there?!"),
  stares at it in disgust, and flings it away. That's the only reason Sadie has any hay: the mole
  has no idea it's feeding her. It doesn't aim to help, just along the same trail as the last one.
- **Floats, and it's not the hat.** Nobody knows what keeps it up there; everyone assumes it's the
  propeller beanie. It isn't. Hay it flings gets the same mystery float once it settles (a faint
  twinkle under both). For 10 s after a throw its thoughts add: "Everyone thinks it's the hat.
  It's not the hat."
- **Gets tired** (`tired`). This is the game looking after itself. The screen tells it how much of
  each second the physics takes (`feelStrain`). Over half, it tires (worn out in 8 s); under 35%,
  it rests (fully in 20 s). Tired, it waits up to 4× as long between pieces and flies slower. Once
  it's worn out it `nap`s (no pieces at all, little z's) until it's down to 40%. On a quick
  device it never tires; on a slow one it slows or pauses the tower growing. (A tall tower doesn't
  tire it by itself: the bedrock keeps the board to about 400 pieces however tall it gets.)
- Always drops with a full supply, so never faster than one piece every 1.5 s.
- Activities: `bury` (want 1 + 2 × restless), `barn` (1), `nap` (10, busy until rested).
- **Envies the bedrock.** For 20 s after pieces melt into the bedrock (`core/bedrock.js`), its
  thoughts add: "And some of the deep ones just turned into bedrock. Lucky things." Nothing is more
  underground than that.
- The player's thing to do with the mole: tap it to see what it's thinking. (The owner is still
  thinking about something more.)
