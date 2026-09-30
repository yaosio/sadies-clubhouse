# Claude's House (The Overthinkery)

The first building outside Sadie's front gate (`src/activities/claudes-house/`). The owner asked
Claude on 2026-09-30 to build a house of its own just outside the gate, with a little path to it,
and gave no other direction: its own character, its own house, and at least one activity inside
that's interesting and fun, not generic. More buildings will follow along the lane, so the house
sits on the first of its plots (`lot` 0).

**Claude** is a little terracotta spark with eight stubby rays, big eyes and little legs, drawn like
the eager "helper" characters of 90s programs. Polite, keen, and unable to do anything the simple
way. **The house** is The Overthinkery: a tall, crooked, butter-yellow cottage with terracotta tiles
(each storey a little more off-true than the one below, because thinking goes up), a round window,
a turret with a spark for a weathervane, and a chimney that puffs out question marks. A sign by the
lane says THE OVERTHINKERY / CLAUDE: I CAN HELP WITH THAT!, the mailbox says CLAUDE, the mat says
WIPE YOUR THOUGHTS, and Claude stands by the door and waves (HI! COME IN!) as you come up the path.

**Sadie** is in it as herself: asleep in her basket at the end of the machine, and the reason for it.

## Design pillars (these win over any feature idea)

- **The joke is overthinking.** A helper who builds a ten-step machine to hand a cat one treat, and
  "improves" it by making it harder. Everything Claude says is earnest, polite and a bit too much.
- **Short and satisfying.** A run takes about ten seconds and ends with Sadie eating her treat;
  the whole arc (three rounds and the finale) is a few minutes. No timer, no losing: a wrong part
  just gets a comment and waits for you to swap it.
- **It happens in the room, in the world**, like the music room: the machine is real 3D on the
  wall, and you play it right there.
- **Kind to the ears** (the owner has misophonia). One sound only: a soft two-note music-box chime
  when the treat lands in the bowl, once per breakfast. The dominoes, the fan and the wheel are
  silent. More sounds would each get their own file in `sounds/`.
- **Sadie wants the machine.** The finale's punchline: handed the treat directly, she turns her
  back on it and goes to sit by the machine.

## The Good Morning Machine

On the back wall, left to right along the top and back along the bottom: the **lever** lets a
marble roll down the **ramp** into the **dominoes**, the last of which pushes a **1LB weight** onto
the **seesaw**, which flings a **ball of yarn** into the **funnel**; down the pipe it rolls into the
**hamster wheel**, where Claude starts running, which turns the **fan** by its belt, which blows a
**paper boat** across the trough into a **teacup**, which tips the **treat** down a chute into
**Sadie's bowl**. She wakes, walks over, eats it (a heart), and goes back to sleep. A red LED board
counts the TREATS.

Three pieces can go missing: the dominoes, the funnel and the fan. Each empty gap has a dashed
outline and a tag saying what's in it; swapping cycles its four parts: the right one and three
bits of junk from Claude's spare-parts box (a rubber duck, a banana, one sock, a cactus, a floppy
disk (DISK 2 OF 9), a toaster, a trophy, an idea (a light bulb), a sandwich, a houseplant). With
junk in a gap the machine runs up to it and stops: the marble bumps it, the yarn bounces off it,
or the junk spins where the fan should be, and Claude has a line about that particular piece of
junk. An empty gap gets "NOTHING THERE. VERY BRAVE. VERY UNSUCCESSFUL."

- **Round 1:** only the dominoes are missing. It works, and Claude "improves" it:
- **Round 2:** the dominoes and the funnel. Then "WHAT IF ALL THREE PIECES WERE MISSING?":
- **Round 3:** all three.
- **The finale** (the first time round 3 works): "...WAIT. WHAT IF I JUST... HANDED HER THE TREAT?"
  Claude hops out of the wheel and offers it. Sadie turns her back, walks over and sits by the
  machine (a heart). "SHE DOESN'T WANT IT HANDED TO HER. SHE WANTS THE MACHINE." Claude hops back
  in, and from then on each breakfast has one to three gaps at random.

**Controls.** Walk up to it and press E (PLAY on a phone): the view eases back until the whole
machine fits (on a narrow screen, closer, following whatever's happening). A/D (or the arrows)
pick a gap, with an arrow over it; W/S swap its part; Space pulls the lever; clicking a gap swaps
it and clicking the lever pulls it. On a phone: tap a gap to swap, tap the lever, swipe to move
along the machine. While Claude's talking, any key or tap moves on to the next line. Esc (STEP
BACK) steps back; a run carries on without you.

It saves (`sadies-clubhouse.claudes-house.machine`) which round you're on, whether you've seen the
finale, and the treats delivered. The pause menu's CLAUDE'S HOUSE button starts it over.

## How it's built

| File | What it does |
|---|---|
| `card.js` | Its card: `lot` 0 (not a `slot`: it's not behind a door on the landing), `room` (loads `room.js`), `keeps`. |
| `room.js` | The room (9.2 x 8.4 m, 5.6 m tall: a workshop with the chalkboard, PLAN V47, the bookshelf, sticky notes and MY FIRST CLIENT, a photo of Sadie) and the machine: every part, the timeline that plays a run one step after another, the gaps, Sadie, Claude, the speech bubble. Builds the house outside too (`house.js`). Hands the mansion its place, with a `play` on the machine (`key`, every key; `touch`, every press as a line into the room) and `house` (its front door, so the mansion joins it to the outside). `window.__claudesHouse` for the checks (`state()`, and `speed(k)` to run it faster). |
| `house.js` | The house from outside, built into the outside's scene on its plot: walls, the storeys, the turret, the chimney's puffs, the path, mailbox, sign, bushes, and Claude by the door (waves when you're near). Tells the outside what's solid. |
| `machine.js` | The machine's rules, with no screen (the tests run them): the steps, the gaps, the junk, the rounds, swapping, where a run stops, what happens when it works, what's saved. |
| `lines.js` | Everything Claude says. The bubble holds four lines of 26 letters in the mansion's 3x5 font: no lower case, no double quotes (the tests check). |
| `art.js` | Its pictures, drawn when the mansion opens: Claude in nine moods (idle, blink, talk, happy, oops, think, wave, and two running), the junk, the house's siding, tiles, door and signs, the wallpaper, the chalkboard; and the ones drawn again as they change: the speech bubble, the tags, the treat counter. |
| `sounds/` | `chime.js`, the one sound (made in code, 8-bit, 11 kHz), and `index.js`, which plays it. |

Checks: `tests/claudes-house/run.mjs` (the rules, the lines fitting the bubble, the chime) and
`tests/claudes-house/browser.mjs` (walking out to the house and in, junk in a gap, the three
rounds and the finale, the phone's taps and swipe, kept after a reload). Pictures of it:
`node tools/claudes-house/shots.mjs [desktop|phone]` (after a build) saves the house from the gate,
the lane and the door, the room, and a run of the machine, in `dist/shots/claudes-house/`.

## Parked ideas

None yet.
