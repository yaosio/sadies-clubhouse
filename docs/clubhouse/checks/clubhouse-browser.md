# The clubhouse's browser checks

`tests/clubhouse/browser.mjs`: the clubhouse in headless Chromium as a phone and a desktop. Read
this when changing the page, a room's building, the sound rules, the pause menu or saves, since
these checks run again on any change in `src/`. `tools/check.mjs` runs it whenever anything in the
page changed: the phone and the desktop side by side. It fails on any page
error; screenshots are in `dist/check/clubhouse/`.

It names no activity: which rooms, doors and saves it uses all come from the cards, so it keeps
working as rooms come and go.

## Opening and walking
- It opens at the gate with Sadie's letter (and only the first time).
- Walking: keys, and the thumb stick.
- Walking through the front door into the hall.
- Climbing the stairs to the landing and on round to the second.

## Building rooms
- The rooms are built after the clubhouse opens, without the first picture waiting for them.
- A room put away and built again as you walk up to its door, with nothing piling up.
- A place that throws an error in a frame doesn't freeze the game.
- A room whose file won't come keeping its door shut (the others still built), and built once it does.
- Every landing door leading into its own room, and every building outside (a plot along the lane, a
  spot in the grounds) leading into its own room when you walk in through its door from outside.

## Playing an activity
- Every activity played at a computer (found from the cards) opens with the clubhouse gone from the
  page, and ESC BACK comes back to that computer.
- Escape coming back from a page opened at `#<its id>`.
- Pausing.

## Every room can be put away and built again
Found from the cards, so a new room is checked with no new test:
- Put away and built again three times over with nothing piling up (on the graphics card or the
  page), and its save unchanged.
- The same loop forces a memory clean-up each round: memory may not grow by more than 3 MB over the
  last two rounds, and no listener may be left on the window or the page.

## The pause menu and saves
- The start-over buttons: NO keeps things, YES starts the letter over, and each activity's START
  OVER erases its own saves and nobody else's.
- YOUR SAVES: a backup file holding every save, loading one asking first and putting it all back.
- Every save written along the way belongs to a card's `keeps` or the clubhouse.
