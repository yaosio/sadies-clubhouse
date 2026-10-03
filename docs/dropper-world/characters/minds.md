# How Dropper World's characters think

How feelings, offers and activities turn into behavior, and how to add an interaction. Read before
changing how any character behaves. Who they are: `sadie.md`, `chooter.md`, `mole.md` (a
character's reasons come first; the numbers in `docs/dropper-world/tuning/` serve them).

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
  says how much the character wants it (its `want`, from feelings and offers). The biggest want
  wins. The current activity gets a small bonus so they don't flip-flop, and an activity can be
  **busy** so nothing interrupts it (holding the barn rope, napping in the barn).
- **Bodies**: how a character gets around stays their own. Sadie walks and climbs; Chooter trots
  and leaps. Activities only say where to go.

## Thoughts (`thoughts.js`)

Tap a character and the dashboard shows what they're doing, why, and their strongest feeling right
now as a meter, all in their own voice, in first person ("I'm hungry", "I love absolutely
everybody!"), true to who they are (their pages here).

- Each character writes its own `think()` next to its activities. When you add an activity or a
  feeling, add its line there too, so the dashboard never says something that isn't true.
- At most 4 feelings per character (the dashboard shows the strongest; the owner chose one meter
  over all of them, to save room), each label short enough to fit it ("I'm worried", "Bury the
  barn!").
- Never one feeling per other character (that won't scale as friends are added). The mole, for
  example, has one bar for whoever it has its eye on right now.
- There are no pop-up messages ("Munch munch!", "Zoomies!"); only a new friend gets one.

## Adding an interaction

1. Ask why the character would do it, in their own terms (their page here).
2. If they need a new want, add a feeling. If something new should be wanted, add an offer to
   that thing. If they need a new way to act, add an activity.
3. Let the wants decide. Avoid rules like "if Chooter is near Sadie and Sadie is eating": use
   feelings and offers so it works with every character and thing, including future ones.
4. The design pillars still win (`docs/dropper-world/README.md`): Sadie is a character with
   moods, not a cursor, and the mole never means to help her (it only ever does by accident).

Example (built): Chooter feels ignored, so he takes the hay Sadie wants (to him it's play). Hay he
carries still offers `food`, so Sadie's hunger sends her after it, and to him being chased is the
best game ever. Nobody wrote "Sadie chases Chooter": Sadie only knows "run after food that's on the
move", and Chooter only knows "keep away from whoever's close".
