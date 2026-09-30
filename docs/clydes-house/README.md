# Clyde's House (The Overthinkery)

The first building outside Sadie's front gate (`src/activities/clydes-house/`). The owner asked
Claude on 2026-09-30 to build a house of its own just outside the gate, with a little path to it,
and gave no other direction: its own character, its own house, and at least one activity inside
that's interesting and fun, not generic. More buildings will follow along the lane, so the house
sits on the first of its plots (`lot` 0).
The character was first called Claude; the owner renamed it Clyde (same little spark, same house).

**Clyde** is a little terracotta spark with eight stubby rays, big eyes and little legs, drawn like
the eager "helper" characters of 90s programs. Polite, keen, and unable to do anything the simple
way. **The house** is The Overthinkery: a tall, crooked, butter-yellow cottage with terracotta tiles
(each storey a little more off-true than the one below, because thinking goes up), a round window,
a turret with a spark for a weathervane, and a chimney that puffs out question marks. A sign by the
lane says THE OVERTHINKERY / CLYDE: I CAN HELP WITH THAT!, the mailbox says CLYDE, the mat says
WIPE YOUR THOUGHTS, and Clyde stands by the door and waves (HI! COME IN!) as you come up the path.

**Sadie** is in it as herself: asleep in her basket at the end of the machine, and the reason for it.

## Design pillars (these win over any feature idea)

- **The joke is overthinking.** A helper who builds a ten-step machine to hand a cat one treat, and
  "improves" it by making it harder. Everything Clyde says is earnest, polite and a bit too much.
- **Short and satisfying.** A run takes about ten seconds and ends with Sadie eating her treat;
  the whole arc (four rounds and the finale) is a few minutes. No timer, no losing: a wrong part
  just gets a comment and waits for you to swap it.
- **It happens in the room, in the world**, like the music room: the machine is real 3D on the
  wall, and you play it right there.
- **Kind to the ears** (the owner has misophonia). Every sound is a single short, soft blip when
  something happens, and nothing loops, hums or rattles: no rolling marble, no whirring wheel or
  fan, no purring or crunching. The same sound can't play twice within a tenth of a second.
  Each group of sounds has its own file in `sounds/`.
- **Sadie wants the machine.** The finale's punchline: handed the treat directly, she turns her
  back on it and goes to sit by the machine.

## The Good Morning Machine

On the back wall, left to right along the top and back along the bottom: the **lever** lets a
marble roll down the **ramp** into the **dominoes**, the last of which pushes a **1LB weight** onto
the **seesaw**, which flings a **ball of yarn** into the **funnel**; down the pipe it rolls into the
**hamster wheel**, where Clyde starts running, which turns the **fan** by its belt, which blows a
**paper boat** across the trough into a **teacup**, which tips the **treat** down a chute into
**Sadie's bowl**. She wakes, walks over, eats it (a heart), and goes back to sleep. A red LED board
counts the TREATS.

Six pieces can go missing: the dominoes, the seesaw, the funnel, the fan, the paper boat and the
teacup. Each empty gap has a dashed outline and a tag saying what's in it; swapping cycles its
four parts: the right one and three bits of junk from Clyde's spare-parts box (a rubber duck, a
banana, one sock, a cactus, a floppy disk (DISK 2 OF 9), a toaster, a trophy, an idea (a light
bulb), a sandwich, a houseplant, one shoe, a fish bone, a yo-yo, an umbrella, cold pizza). With
junk in a gap the machine runs up to it and stops: the marble bumps it, the weight lands on it,
the yarn bounces off it, the junk spins where the fan should be, the fan blows at it, or the boat
bumps it. Then **each bit of junk does its own thing** (`reactions.js`): the duck bounces and
squeaks, the banana slips and lands on its back, the sock flops, the cactus shakes its head, the
floppy disk ejects spinning, the toaster pops out a slice of toast, the trophy swells with pride,
the bulb lights up and flickers out, the sandwich gets squashed, the houseplant sways (a heart for
trying), the shoe flips over, the fish bone wakes Sadie up to look, the yo-yo goes down and up,
the umbrella opens and floats up, and the pizza flies off like a frisbee and comes back. Clyde has
a line about each. An empty gap gets "NOTHING
THERE. VERY BRAVE. VERY UNSUCCESSFUL." One secret: **the rubber duck floats**, so in the boat's gap
it works, sailing across the trough itself (squeak), and Clyde promotes it to boat.

- **Round 1:** only the dominoes are missing. It works, and Clyde "improves" it:
- **Round 2:** the seesaw and the funnel. Then "WHAT IF THREE PIECES WERE MISSING?":
- **Round 3:** the dominoes, the fan and the boat. Then "EVEN THE TEACUP":
- **Round 4:** the seesaw, the funnel, the fan and the teacup.
- **The finale** (the first time round 4 works): "...WAIT. WHAT IF I JUST... HANDED HER THE TREAT?"
  Clyde hops out of the wheel and offers it. Sadie turns her back (mew), walks over and sits by the
  machine (a heart). "SHE DOESN'T WANT IT HANDED TO HER. SHE WANTS THE MACHINE." Clyde hops back
  in, and from then on each breakfast has two to four gaps at random.

**Sounds**, each once when it happens: the lever's clunk, one little clatter as the dominoes go,
a boing from the seesaw, a fwoop down the funnel, one soft whoosh as the fan starts, a bloop as the
boat sets off, a clink as the teacup tips, and the music-box ding-ding when the treat lands; a
soft pop when you swap a part (a squeak for the duck), and a wooden bonk when it stops at a gap.
Sadie says mrrp? when the treat wakes her, and mew when she's handed it; Clyde beeps hello the
first time you step up, and sparkles when the big idea comes.

**Controls.** Walk up to it and press E (PLAY on a phone): the view eases back until the whole
machine fits (on a narrow screen, closer, following whatever's happening). A/D (or the arrows)
pick a gap, with an arrow over it; W/S swap its part; Space pulls the lever; clicking a gap swaps
it and clicking the lever pulls it. On a phone: tap a gap to swap, tap the lever, swipe to move
along the machine. While Clyde's talking, any key or tap moves on to the next line. Esc (STEP
BACK) steps back; a run carries on without you.

It saves (`sadies-clubhouse.clydes-house.machine`) which round you're on, whether you've seen the
finale, and the treats delivered. The pause menu's CLYDE'S HOUSE button starts it over.

## Clyde's Weather Machine (outside)

The owner asked for it on 2026-09-30: Clyde's, so it stands beside his house, and outdoors, since it
changes the weather for the whole world. On the grass left of the house (as you face it from the
lane), with stepping stones from the lane: a mint-green enamel cabinet with far too much on top (a
dish turning slowly, wind cups that spin faster in bad weather, a funnel that puffs out a cloud each
time you pull a lever), a sign (CLYDE'S WEATHER MACHINE / MORE WEATHER IN THE FULL VERSION!), a
green screen with the forecast (TODAY: RAIN / FOR THE PLANTS), a note on a stake (PLEASE DO NOT
PULL THE LEVERS. (THAT WAS A JOKE. PLEASE DO.)), and four levers with brass plates: **RAIN**,
**SNOW**, **2ND SUN** and **CATS**.

Walk up to a lever and press E (PULL on a phone): its weather comes over the whole of outside (the
garden, the lane, and what you see of it through the front door from the hall) in about three
seconds, and every other lever goes back up. Pull it again and the sky clears. One weather at a time.

- **Rain:** a dark dome of cloud covers the sky (and hides the sun), the light goes dim, and
  pixelly streaks fall all round you.
- **Snow:** pale lavender cloud, flakes drifting down, and the ground slowly goes white (it takes
  about forty seconds to settle, and melts in ten once it stops).
- **2nd sun:** a second sun comes up over the hills right beside the first (clear of the mansion, looking in from the gate), and
  everything's brighter.
- **Cats:** pink cloud, and a cat at a time (ginger, black or grey) falls tumbling from the sky,
  rights itself just before the ground (they always land on their feet), sits a moment, and poofs.

**Sadie** on the gatepost reacts: a little pink umbrella in the rain, a heap of snow on her head,
sunglasses for the second sun, and a word bubble for a few seconds once it arrives (rain MEW!, snow
MRRP?, sun ..., cats MINE., clear MRRP.), with her mew or mrrp if you're near enough to hear.

**Sounds:** the lever's clunk and one soft music-box jingle for each weather as it arrives (three low
notes going down for rain, three high ones for snow, going up for the sun, a questioning little tune
for cats, two settling notes for clear). Nothing plays while it rains or snows: no hiss, no patter,
no dripping.

The weather is saved (`sadies-clubhouse.clydes-house.weather`), so it's still there after a reload;
the pause menu's CLYDE'S HOUSE button clears it too. It's built with the house, into the outside, so
it stays when the room inside is put away.

## How it's built

| File | What it does |
|---|---|
| `card.js` | Its card: `lot` 0 (not a `slot`: it's not behind a door on the landing), `room` (loads `room.js`), `keeps`. |
| `room.js` | The room (9.2 x 8.4 m, 5.6 m tall: a workshop with the chalkboard, PLAN V47, the bookshelf, sticky notes and MY FIRST CLIENT, a photo of Sadie) and the machine: every part, the timeline that plays a run one step after another, the gaps, Sadie, Clyde, the speech bubble. Builds the house outside too (`house.js`). Hands the mansion its place, with a `play` on the machine (`key`, every key; `touch`, every press as a line into the room) and `house` (its front door, so the mansion joins it to the outside). `window.__clydesHouse` for the checks (`state()`, and `speed(k)` to run it faster). |
| `house.js` | The house from outside, built into the outside's scene on its plot: walls, the storeys, the turret, the chimney's puffs, the path, mailbox, sign, bushes, and Clyde by the door (waves when you're near). Tells the outside what's solid. |
| `machine.js` | The machine's rules, with no screen (the tests run them): the steps, the gaps, the junk, the rounds, swapping, where a run stops, what happens when it works, what's saved. |
| `reactions.js` | What each bit of junk does when the machine bumps into it: how long, its sound, a puff, and its pose over time (moved, turned, stretched), plus the toaster's toast, the bulb lighting up and Sadie waking for the fish bone. Plain numbers; the tests check every bit of junk has its own. |
| `lines.js` | Everything Clyde says. The bubble holds four lines of 26 letters in the mansion's 3x5 font: no lower case, no double quotes (the tests check). |
| `art.js` | Its pictures, drawn when the mansion opens: Clyde in nine moods (idle, blink, talk, happy, oops, think, wave, and two running), the junk, the house's siding, tiles, door and signs, the wallpaper, the chalkboard; and the ones drawn again as they change: the speech bubble, the tags, the treat counter. |
| `weather.js` | The weather machine's rules, with no screen: the four kinds, how each looks (the sunlight, the cloud colour, what falls), the forecasts, what Sadie says, pulling a lever, what's saved. |
| `weather-machine.js` | The weather machine, built beside the house (`buildWeather`, called by `house.js`), and the weather itself: the cloud dome, the second sun, the snow lying on the ground, the rain and snow (a box of little crossed quads round wherever you are, written into one mesh each frame), the falling cats, Sadie's umbrella, snow, sunglasses and word. Its levers are `act` uses it puts in the outside's `uses`, and it sets the outside's `light.sun`. `window.__weather` for the checks (`state()`, `pull(kind)`, `speed(k)`, `machine`). |
| `weather-art.js` | The weather machine's pictures: the enamel, the signs and lever plates, the forecast screen (drawn again when it changes), the cloud cover, the snow, the cats, and what Sadie wears and says. |
| `sounds/` | Made in code, 8-bit, 11 kHz, a file per group: `machine.js` (every step's sound, the pop, bonk and squeak, and the toaster's ding, the yo-yo's zip and the bulb's plink), `sadie.js` (mrrp, mew), `clyde.js` (hello, idea), `chime.js` (the treat landing), `weather.js` (the weather machine's jingles); `synth.js`, what they're made with; `index.js`, which plays them (never the same one twice within a tenth of a second). |

Checks: `tests/clydes-house/run.mjs` (the rules, the weather machine's rules, the lines fitting the bubble, every bit of junk reacting its own way, every sound soft and short) and
`tests/clydes-house/browser.mjs` (walking out to the house and in, junk in a gap, the four
rounds and the finale, every sound played, the phone's taps and swipe, kept after a reload; then each
weather lever outside, Sadie's reactions, the jingles, and the weather kept after a reload).
`node tools/clydes-house/weather.mjs [desktop|phone] [rain|snow|sun|cats|clear]` takes pictures of
the weather machine and of each weather from the lane, at Sadie, the sky, and from the hall. Pictures of it:
`node tools/clydes-house/shots.mjs [desktop|phone]` (after a build) saves the house from the gate,
the lane and the door, the castle from the lane, the room, and a run of the machine, in `dist/shots/clydes-house/`;
`node tools/clydes-house/junk.mjs [part]` takes two of each bit of junk reacting.
`node tools/clydes-house/tags.mjs [part]` puts the same part (FLOPPY DISK, the longest name, unless you
name one) in every gap at once and takes a picture on a big desktop, a laptop and a phone, to check
the name tags are readable and don't run into each other or the machine. The tags are drawn big
(1.6 m wide) so they read on a wide screen, where the view pulls back to fit the whole machine.

**Far off,** the house is drawn as a plain block the colour of its walls (`house.js` hands the mansion its `group`, `body` and `farTint`); none of the lane is that far yet.

**Put away when you're far off.** The mansion puts the room away when you've been three doors or more from it for a while, but never while the machine's going or Clyde's talking (`busy()`). `putAway()` closes its sounds. The house outside stays (the mansion hands it back as `m.house` when the room's built again, and keeps it moving meanwhile). Parts put in the machine but not yet run are forgotten, just like on a reload.

## Parked ideas

None yet.
