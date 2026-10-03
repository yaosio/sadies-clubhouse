# The clubhouse's browser checks

`tests/clubhouse/browser.mjs`: the clubhouse in headless Chromium as a phone and a desktop. Read
this when changing the page, a room's building, the sound rules, the pause menu or saves, since
these checks run again on any change in `src/`. `tools/check.mjs` runs it whenever anything in the
page changed: about half a minute, the phone and the desktop side by side. It fails on any page
error; screenshots are in `dist/check/clubhouse/`.

It names no activity: which rooms, doors and saves it uses all come from the cards, so it keeps
working as rooms come and go.

## Opening and walking
- It opens at the gate with Sadie's letter (and only the first time).
- Walking: keys, and the thumb stick.
- The front door showing the hall through it, and walking through it.
- Climbing the stairs to the landing and on round to the second.
- The outside's ground having levels (a bridge with a crate under it).

## Building rooms
- The rooms are built after the clubhouse opens: each under a time limit, never holding the game up
  more than 200 ms at a time, all drawn with the same few materials.
- The buildings built before the first picture are the start-up's, timed by
  `tools/clubhouse/startup.mjs`, and held to the limit when built again.
- A room put away and built again as you walk up to its door, with nothing piling up.
- Two doors open side by side both showing their rooms.
- A room whose file won't come keeping its door shut (the others still built), and built once it does.
- Every landing door leading into its own room.

## Playing an activity
- Every activity played at a computer (found from the cards) opens with the clubhouse gone from the
  page, and ESC BACK comes back to that computer.
- Escape coming back from a page opened at `#<its id>`.
- Pausing, the main theme playing, and fading out in a room that hushes the theme, and back after.

## Every room keeps the sound rules
Found from the cards, so a new room is checked with no new test:
- Its music is not heard once you've left, nothing is left once it's put away, nothing starts up after.
- Put away and built again three times over with nothing piling up (on the graphics card or the
  page), its save unchanged, and each rebuild as quick as a first build.
- The same loop forces a memory clean-up each round: memory may not grow by more than 3 MB over the
  last two rounds, and no listener may be left on the window or the page.

## The pause menu and saves
- The MUSIC, SOUNDS and VOICES buttons (SOFT, OFF, ON, remembered).
- The start-over buttons: NO keeps things, YES starts the letter over, and each activity's START
  OVER erases its own saves and nobody else's.
- YOUR SAVES: how full, a backup file holding every save, loading one asking first and putting it
  all back, the nearly-full warning.
- Every save written along the way belongs to a card's `keeps` or the clubhouse.
