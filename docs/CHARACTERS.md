# Characters

Who everyone is, why they do what they do, and how that becomes code. Read this before changing
how any character behaves. A character's reasons come first; the numbers serve them.

The part of the game the owner loves most isn't the tower itself. It's the characters and what
happens between them. So characters aren't scripted ("if this, then that"). They have **feelings**,
things in the world **offer** something, and each character keeps doing whatever they want most
right now. New interactions should mostly come from new feelings, new offers or new activities,
not from rules that name two characters.

## How it works (`src/core/mind/`)

- **Feelings** (`feelings.js`): numbers from 0 to 1 on each character (`c.feel`). They drift on
  their own and get nudged by what happens.
- **Offers** (`offers.js`): things say what they're good for. Anything can offer anything, and
  characters look for offers, never for particular things:

  | Offer | Who offers it now |
  |---|---|
  | `food` | each hay bundle (`hay.js`) |
  | `home` | the barn (`barn.js`) |
  | `fetch` | a thrown ball nobody's played with yet (`toys.js`) |
  | `friend` | Sadie, and Chooter once met (their own files) |

- **Thinking** (`think.js`): each character has a set of **activities**. Every tick each activity
  says how much the character wants to do it (its `want`, from feelings and offers). The biggest
  want wins. The current activity gets a small bonus so they don't flip-flop, and an activity can
  be **busy** so nothing interrupts it (holding the barn rope, napping in the barn).
- **Bodies**: how a character gets around stays their own. Sadie walks and climbs; Chooter trots
  and leaps. Activities only say where to go.

### Adding an interaction

1. Ask why the character would do it, in their own terms (see below).
2. If they need a new want, add a feeling. If something new should be wanted, add an offer to
   that thing. If they need a new way to act, add an activity.
3. Let the wants decide. Avoid rules like "if Chooter is near Sadie and Sadie is eating": use
   feelings and offers so it works with every character and thing, including future ones.
4. The design pillars still win: Sadie is a character with moods, not a cursor, and the dropper
   never moves on its own to help her.

Example, planned next: Chooter feels ignored, so he takes the hay Sadie wants (to him it's play).
Hay he carries still offers `food`, so Sadie's hunger sends her after it, and to him being chased
is the best game ever. Nobody writes "Sadie chases Chooter".

## Sadie (`src/core/sadie/brain.js`)

The owner's late cat. A cat who thinks she's a cow.

- **Extremely food motivated.** That's why she goes after the hay. (`hunger`: her strongest
  feeling. Eating always matters to her: `eat` wants 1 + hunger, and she never walks past a
  bundle she can reach. Hunger creeps up over about 90 s; a bundle takes away half.)
- **She has a barn because she needs somewhere to live, and she thinks she's a cow.**
- **She drags the barn up the tower because she can't live in it if it's buried.** (`settled`:
  how at home she feels after her last trip, 1 right after, gone in 60 s. Once it's gone, a barn
  6+ blocks below her or buried 1+ block deep makes `fetchBarn` want 3, more than even hay.)
- **Scared** by pieces lurching under her feet, or by falling (`scared`, a short-lived fear).
- **Not into play.** She's unimpressed when Chooter brings her the ball.
- Activities: `eat`, `fetchBarn`.
- Fits her, not built yet: tiredness, and napping in the barn when tired.

## Chooter (`src/core/friends/chooter.js`)

Sadie's first friend, a black lab/pitbull mix. She meets him the first time she stands 15 blocks
up.

- **Very manic and energetic.** (`energy`: winds up over 40–75 s, a bit different each time. Full
  energy means zoomies, which use it all up in 7–10 s.)
- **Absolutely loves everybody.** (`missing`: wanting to say hello. Full when he meets Sadie, so
  he runs over to greet her. He plays near his friend whenever nothing else is going on.)
- **Thinks everything he does is play, even if it's antagonizing.** He doesn't mean harm: knocking
  pieces over in the zoomies, and (planned) stealing Sadie's hay, are games to him.
- **Gets tired** (`tired`: worn out after 70–120 s out, twice as fast in the zoomies). Then he goes
  home to the barn, rests 25–45 s, and comes back out. A thrown ball gets him out right away.
- Activities: `greet` (want 4), `fetch` (3, busy while carrying), `zoom` (2, busy until his
  energy is used up; not when worn out), `home` (1.5, busy once inside), `play` (1).

## The dropper (future)

The owner sees the dropper drone as a character too. What it's like and why it does what it does
is still to be decided. Until then it stays exactly as it is: it stays where the player puts it
and never moves on its own to help Sadie.
