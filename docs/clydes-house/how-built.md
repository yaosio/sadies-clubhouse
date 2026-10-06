# How Clyde's House is built

The code in `src/activities/clydes-house/`: which file does what, how it plugs into the clubhouse,
being far off and put away. Read before changing its code. Its checks and picture tools are in
`checks.md`.

## The house and the Good Morning Machine

- `card.js`: its card: `lot` 0 (not a `slot`: it's not behind a door on the landing), `room`
  (loads `room.js`), `keeps`.
- `room.js`: the room (9.2 x 8.4 m, 5.6 m tall: a workshop with the chalkboard, PLAN V47, the
  bookshelf, sticky notes and MY FIRST CLIENT, a photo of Sadie) and the machine: every part, the
  timeline that plays a run one step after another, the gaps, Sadie, Clyde, the speech bubble.
  Builds the house outside too (`house.js`). Hands the clubhouse its place, with a `play` on the
  machine (`key`, every key; `touch`, every press as a line into the room) and `house` (its front
  door, so the clubhouse joins it to the outside). `window.__clydesHouse` for the checks
  (`state()`, and `speed(k)` to run it faster).
- `house.js`: the house from outside, built into the outside's scene on its plot: walls, the
  storeys, the turret, the chimney's puffs, the path, mailbox, sign, bushes, and Clyde by the door
  (waves when you're near). Tells the outside what's solid.
- `machine.js`: the machine's rules, with no screen (the tests run them): the steps, the gaps, the
  junk, the rounds, swapping, where a run stops, what happens when it works, what's saved.
- `reactions.js`: what each bit of junk does when the machine bumps into it: how long, its sound, a
  puff, and its pose over time (moved, turned, stretched), plus the toaster's toast, the bulb
  lighting up and Sadie waking for the fish bone. Plain numbers; the tests check every bit of junk
  has its own.
- `lines.js`: everything Clyde says. The bubble holds four lines of 26 letters in the clubhouse's
  3x5 font: no lower case, no double quotes (the tests check).
- `art.js`: its pictures, drawn when the clubhouse opens: Clyde in nine moods (idle, blink, talk,
  happy, oops, think, wave, and two running), the junk, the house's siding, tiles, door and signs,
  the wallpaper, the chalkboard; and the ones drawn again as they change: the speech bubble, the
  tags, the treat counter.

## The Weather Machine

- `weather.js`: the weather machine's rules, with no screen: its five levers, the forecasts,
  pulling a lever, and reading the weather's old save.
- `weather-machine.js`: the weather machine, built beside the house (`buildWeather`, called by
  `house.js`): the cabinet, dish, wind cups, funnel and puff, the forecast and the levers (`act`
  uses it puts in the outside's `uses`, which set the world's weather). `window.__weather` for the
  checks (`state()`: the levers, labels and jingles; `pull(kind)`; `machine`); the weather itself
  is `__clubhouse.weather()`.
- `weather-art.js`: the weather machine's pictures: the enamel, the signs and lever plates, the
  forecast screen (drawn again when it changes), the puff.

## Sounds

`sounds/`: made in code, 8-bit, 11 kHz, a file per group: `machine.js` (every step's sound, the
pop, bonk and squeak, and the toaster's ding, the yo-yo's zip and the bulb's plink), `sadie.js`
(mrrp, mew), `clyde.js` (hello, idea), `chime.js` (the treat landing), `weather.js` (the weather
machine's jingles), all made with the toolbox's kit (`src/shared/retro.js`: its tone, hush and
Sadie's mrrp); `index.js`, which plays them on the clubhouse's sound system
(`src/shared/sound.js`; never the same one twice within a tenth of a second; Sadie's and Clyde's
on the VOICES volume). The weather machine has its own handle (`house:weather-machine`), since it
stays outside when the room's put away (the clubhouse closes it when it leaves the page).

## Far off and put away

**Far off,** the house is drawn as a plain block the colour of its walls (`house.js` hands the
clubhouse its `group`, `body` and `farTint`); none of the town is that far yet.

**Put away when you're far off.** The clubhouse puts the room away when you've been three doors or
more from it for a while, but never while the machine's going or Clyde's talking (`busy()`).
the clubhouse closes its sounds when it puts the room away. The house outside stays (the clubhouse hands it back as `m.house`
when the room's built again, and keeps it moving meanwhile). Parts put in the machine but not yet
run are forgotten, just like on a reload.
