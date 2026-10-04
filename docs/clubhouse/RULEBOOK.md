# The game rulebook

The rules every place in Sadie's Clubhouse follows. Read before designing a new activity or
building, and check the idea against it. It points at the detailed pages rather than repeating them.
Approved by the owner, 2026-10-02. Each rule says whether a check enforces it today. They are
guidelines, not walls: the owner can change any of them (2026-10-03), and Claude says so before
breaking or changing one, never quietly.

## 0. Names
Sadie's house is **the clubhouse**, everywhere: in the docs, the game and what Claude says. Never
"the mansion". (Old names are left in the code on purpose: file and element names like `mansion.js` and
`#mansion`, and the clubhouse's own saves starting `mansion.`, which must keep that name or every
player's saved settings would be lost.)

## 1. One look
- The misremembered 90s (`docs/clubhouse/look/README.md`): loud Kid Pix colours, chunky pixels,
  dithering, flat sprite characters that turn to face you. Built from the kit's textures and palette
  (`T`, `C`, `psx`).
- **One scale.** You see from 1.6 m. Doors are 2.4 m tall (today 2.3 to 2.45, except the 3.0 m front door). Sadie is one size
  everywhere she's a sprite (today 0.55 to 0.9 m) unless being a different size is the joke.
  *Not checked* (only fatal errors are tested).
- Rooms can be bigger inside than outside. No loading screens.

## 2. Same controls everywhere
- Walk: WASD and mouse, or the thumb stick. Use: E, or the USE button. Leave a game: ESC, or BACK.
- A room never invents its own key or gesture; a new way of playing is a file in
  `src/clubhouse/play/` any place can use (`docs/clubhouse/rooms/controls.md`). *Not checked.*
- **Phones are equal:** every action has a button; every hint fits a 360 px wide screen; nothing
  needs hover or a keyboard. *Not checked* (only fatal errors are tested).

## 3. Every place has an owner, a toy and a door
- **An owner:** inside the fence it's Sadie's; outside the gate it belongs to somebody else. The
  owner is there, or clearly lives there.
- **Something to play with** within a few steps of walking in.
- **An easy, obvious exit:** the way you came in is always in reach, and the pause menu always gets
  you out. Anything that holds you (a cutscene, a trip) says how long, or can be left.
  The owner's exception (2026-10-04): Space Adventure's trip is meant to trap you. Once you walk
  in you're strapped in for the whole trip, with no way out, on purpose.
- **Sadie's in it** somehow (not always the same way). An exception is said in the activity's
  README.

## 4. Kind to the ears
**The owner's rule (Yaosio, 2026-10-04, replacing a stricter blanket one):** the owner has
misophonia, and the only sounds that bother them are **droning** ones (an engine hum) and
**ticking** ones (a clock, hi-hats). Soft bird chirping is fine, just never loud or constant. Any
other sound is fine if it's rare, soft and varied. Written only here; other pages point here.
- Everything through the sound system (`docs/clubhouse/sound/README.md`). *Checked.*
- No drone, no tick. *Not checked: only fatal errors are tested (`docs/clubhouse/decisions/fatal-only.md`).*
- A sound that can happen often (a chirp, a meow) is kept rare, soft and varied.
- Claude's choices, not the owner's rule: the main theme is composed as it plays, not looped, and
  most rooms never loop a sound. A room may loosen that if it stays soft.
- The owner's exceptions (2026-10-02), both things you choose to switch on: Space Adventure's radio
  loops its song, and the Music Room tape's LOOP repeats as long as you leave it on.

## 5. Kind to the eyes
- Nothing bright flashes more than 3 times a second, and no big area goes from dark to bright in a
  blink. *Not checked* (only fatal errors are tested).

## 6. Where it goes
- A door never moves; a new room takes the next free door spot (`slot`). A building outside takes
  the next plot round the town square (`lot`) or a grounds spot (`grounds`); those stay put too
  (Claude's rule, not the owner's; plots moved once, 2026-10-04, for the square).
  *Checked that each spot stays where it is* (not which room has which). (`docs/clubhouse/rooms/card.md`)
- The town grows a building at a time, packed close, next to what's there
  (`docs/clubhouse/outside/town.md`).
- Shared code names no room; a room imports only its own folder and the toolbox. *Checked.*

## 7. Small and fast
- A room's save stays small (under 300 KB, Claude's choice: the browser has about 5 MB for every room
  together) and old saves always load. *Both checked* (the biggest save any room's checks reach). (`docs/clubhouse/rooms/saves.md`)
- A room hands back everything it made when it's put away. *Checked:* every room is put away and built
  again several times, and the memory and listeners are compared.

## 8. Docs
- Each activity's docs have the same shape and one topic per small file (`docs/TASKS.md` says which
  files a job reads). *Checked* (`tools/docs.mjs`).
