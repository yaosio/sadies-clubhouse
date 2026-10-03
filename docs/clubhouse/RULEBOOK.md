# The game rulebook

The rules every place in Sadie's Clubhouse follows. Read before designing a new activity or
building, and check the idea against it. It points at the detailed pages rather than repeating them.
Approved by the owner, 2026-10-02. Each rule says whether a check enforces it today, or could.

## 0. Names
Sadie's house is **the clubhouse**, everywhere: in the docs, the game and what Claude says. Never
"the mansion". (One old name is left in the code on purpose: the clubhouse's own saves start with
`mansion.`, and must keep that name or every player's saved settings would be lost.)

## 1. One look
- The misremembered 90s (`docs/clubhouse/look/README.md`): loud Kid Pix colours, chunky pixels,
  dithering, flat sprite characters that turn to face you. Built from the kit's textures and palette
  (`T`, `C`, `psx`).
- **One scale.** You see from 1.6 m. Doors are 2.4 m tall (today 2.3 to 2.45). Sadie is one size
  everywhere she's a sprite (today 0.55 to 0.9 m) unless being a different size is the joke.
  *Could be checked:* the kit hands out the door and Sadie, so their size can't drift.
- Rooms can be bigger inside than outside. No loading screens.

## 2. Same controls everywhere
- Walk: WASD and mouse, or the thumb stick. Use: E, or the USE button. Leave a game: ESC, or BACK.
- A room never invents its own key or gesture; a new way of playing is a file in
  `src/clubhouse/play/` any place can use (`docs/clubhouse/rooms/controls.md`). *Checked in part*
  (the room checker knows the kinds).
- **Phones are equal:** every action has a button; every hint fits a 360 px wide screen; nothing
  needs hover or a keyboard. *Could be checked:* measure every hint and label on a phone.

## 3. Every place has an owner, a toy and a door
- **An owner:** inside the fence it's Sadie's; outside the gate it belongs to somebody else. The
  owner is there, or clearly lives there.
- **Something to play with** within a few steps of walking in.
- **An easy, obvious exit:** the way you came in is always in reach, and the pause menu always gets
  you out. Anything that holds you (a cutscene, a trip) says how long, or can be left.
- **Sadie's in it** somehow (not always the same way). An exception is said in the activity's
  README.

## 4. Kind to the ears (the owner has misophonia)
- Everything through the sound system (`docs/clubhouse/sound/README.md`). *Checked.*
- Nothing droning, constant or repetitive. Music doesn't loop the same song forever: it's composed
  as it plays, or stops after a while. *Checked for sounds standing still; could be extended to
  music.*
- The owner's exceptions (2026-10-02), both things you choose to switch on: Space Adventure's radio
  loops its song, and the Music Room tape's LOOP repeats as long as you leave it on.

## 5. Kind to the eyes
- Nothing bright flashes more than 3 times a second, and no big area goes from dark to bright in a
  blink. *Could be checked:* the screenshot checks can compare frames.

## 6. Where it goes
- A door never moves; a new room takes the next free door spot (`slot`). A building outside takes
  the next plot along the lane (`lot`) or a grounds spot (`grounds`); those never move either.
  *Checked.* (`docs/clubhouse/rooms/card.md`)
- The town grows a building at a time, packed close, next to what's there
  (`docs/clubhouse/outside/town.md`).
- Shared code names no room; a room imports only its own folder and the toolbox. *Checked.*

## 7. Small and fast
- A room's save stays small (a target: under 200 KB) and old saves always load. *Checked (old
  saves).* (`docs/clubhouse/rooms/saves.md`)
- A room hands back everything it made when it's put away. *Could be checked:* walk every room twice
  and compare the memory.

## 8. Docs
- Each activity's docs have the same shape and one topic per small file (`docs/TASKS.md` says which
  files a job reads). *Checked* (`tools/docs.mjs`).
