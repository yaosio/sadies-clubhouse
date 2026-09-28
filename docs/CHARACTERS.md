# Characters

Who everyone is, why they do what they do, and how that becomes code. Read this before changing
how any character behaves. A character's reasons come first; the numbers serve them.

The part of the game the owner loves most isn't the tower itself. It's the characters and what
happens between them. So characters aren't scripted ("if this, then that"). They have **feelings**,
things in the world **offer** something, and each character keeps doing whatever they want most
right now. New interactions should mostly come from new feelings, new offers or new activities,
not from rules that name two characters.

## How it works (`src/activities/dropper-world/core/mind/`)

- **Feelings** (`feelings.js`): numbers from 0 to 1 on each character (`c.feel`). They drift on
  their own and get nudged by what happens.
- **Offers** (`offers.js`): things say what they're good for. Anything can offer anything, and
  characters look for offers, never for particular things:

  | Offer | Who offers it now |
  |---|---|
  | `food` | each hay bundle (`hay.js`) once it's landed, even while someone's carrying it (then it's `moving`) |
  | `home` | the barn (`barn.js`) |
  | `fetch` | a thrown ball nobody's played with yet (`toys.js`) |
  | `friend` | Sadie, and Chooter once met (their own files) |
  | `restless` (with `how`, 0–1) | Sadie (how impatient she is), Chooter once met and out (how much he wants attention) |

- **Thinking** (`think.js`): each character has a set of **activities**. Every tick each activity
  says how much the character wants to do it (its `want`, from feelings and offers). The biggest
  want wins. The current activity gets a small bonus so they don't flip-flop, and an activity can
  be **busy** so nothing interrupts it (holding the barn rope, napping in the barn).
- **Bodies**: how a character gets around stays their own. Sadie walks and climbs; Chooter trots
  and leaps. Activities only say where to go.

- **Thoughts** (`thoughts.js`): tap a character and a bubble shows what they're doing, why, and
  their feelings as bars, all in their own voice, in first person ("I'm hungry", "I love
  absolutely everybody!"), true to who they are in this file. Each character writes its own
  `think()` next to its activities. When you add an activity or a feeling, add its line there too,
  so the bubble never says something that isn't true. At most 4 bars per character: never one bar
  per other character (that won't scale as friends are added). The mole, for example, has one bar
  for whoever it has its eye on right now. There are no pop-up messages ("Munch munch!",
  "Zoomies!"); only a new friend gets one.

### Adding an interaction

1. Ask why the character would do it, in their own terms (see below).
2. If they need a new want, add a feeling. If something new should be wanted, add an offer to
   that thing. If they need a new way to act, add an activity.
3. Let the wants decide. Avoid rules like "if Chooter is near Sadie and Sadie is eating": use
   feelings and offers so it works with every character and thing, including future ones.
4. The design pillars still win: Sadie is a character with moods, not a cursor, and the mole never
   means to help her (it only ever does by accident).

Example (built): Chooter feels ignored, so he takes the hay Sadie wants (to him it's play). Hay he
carries still offers `food`, so Sadie's hunger sends her after it, and to him being chased is the
best game ever. Nobody wrote "Sadie chases Chooter": Sadie only knows "run after food that's on the
move", and Chooter only knows "keep away from whoever's close".

## Sadie (`src/activities/dropper-world/core/sadie/brain.js`)

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

## Chooter (`src/activities/dropper-world/core/friends/chooter.js`)

Sadie's first friend, a black lab/pitbull mix. Friends show up because of something happening in
the world, never at a height or a time.

- **He can hear it all from next door.** (`heard`: every thud, squish and topple, and Sadie
  scraping the barn along, winds him up. It sounds like SO much fun. It rings in his ears, so it
  only winds him up so fast: a few minutes of just Sadie and the mole at the very least, about
  4 in a normal game.) Most of the way there, he can't help peeking in over the wall nearer Sadie
  now and then ("?!"), and you can tap him. Once he can't stand it any longer, he bursts in with a
  leap and a bark and runs to say hello. Only listening, nothing random, so nothing before he
  arrives changes.

- **Very manic and energetic.** (`energy`: winds up over 40–75 s, a bit different each time. Full
  energy means zoomies, which use it all up in 7–10 s.)
- **Absolutely loves everybody.** (`missing`: wanting to say hello. Full when he meets Sadie, so
  he runs over to greet her. He plays near his friend whenever nothing else is going on.)
- **Thinks everything he does is play, even if it's antagonizing.** He doesn't mean harm: knocking
  pieces over in the zoomies, and stealing Sadie's hay, are games to him.
- **Wants Sadie's attention.** (`ignored`: builds over about 75 s of playing next to her, since she
  never pays him any mind, and a bit more each time she's unimpressed with the ball. Once it's
  full and he can reach the hay she's going for, `tease` wants 2.5: he snatches it and plays
  keep-away, darting off when she's within 3 blocks (picking a way to run and sticking to it) and
  bouncing in place, facing her, when she falls behind. Backed into a wall, he's caught and
  happy about it. It ends when she eats it out of his mouth, or after 20 s when he gets bored and
  drops it. Either way he's satisfied and `ignored` goes back to 0.) He can snatch hay up to about
  3.9 blocks above the pile with a leap. Wanting attention makes him restless, and
  the mole, seeing that, drops pieces on him (he wriggles out on top, delighted).
- **Gets tired** (`tired`: worn out after 70–120 s out, twice as fast in the zoomies). Then he goes
  home to the barn, rests 25–45 s, and comes back out. A thrown ball gets him out right away.
- Before he's met: listening (`heard`), peeking in, and bursting in (not an activity: he isn't on
  the board yet).
- Activities: `greet` (want 4), `fetch` (3, busy while carrying), `tease` (2.5, busy while he
  has the hay), `zoom` (2, busy until his energy is used up; not when worn out), `home` (1.5, busy
  once inside), `play` (1).

## The mole (`src/activities/dropper-world/core/mole.js`)

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
