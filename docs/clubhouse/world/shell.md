# The page shell

The shell every activity runs in (`src/main.js`). Read when changing how the page opens an activity
or comes back from one.

- It gets every card from the build (`import cards from 'activities'`: `tools/build.mjs` makes that
  list from the folders, in folder order, so adding an activity never touches it).
- The page opens in the clubhouse. An address naming an activity after the `#` (`#dropper-world`,
  used by its checks) goes straight into it.
- It runs one activity at a time: it puts that activity's styles and page in, then calls `start()`.
- It puts an ESC BACK key in the activity's top left corner (its own look, in a candy keycap
  style). An activity keeps that corner free, with the toolbox's `roomForBack(strip, host)`
  (`src/shared/back.js`).
- Pressing it, or Escape when the activity didn't use the key for something itself
  (`preventDefault()`, like closing a dev sheet), reloads the page into the clubhouse. So an
  activity never has to tidy up after itself (its timers, listeners and loop just stop). It must
  save when the page goes away, through the save director's `onLeave(fn)`
  (`docs/clubhouse/rooms/saves.md`).
- **The test version's label** goes where an activity's `page.html` (or the clubhouse's
  `mansion.html`) says `<!--@badge-->` (at the end of the page if none does).
- If the clubhouse's file or an activity's own page won't load, it's tried again, and then the page
  says it couldn't load rather than staying blank (`building-rooms.md`).
