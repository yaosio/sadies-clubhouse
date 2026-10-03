# Dropper World's saving

How the game is saved and loaded, and what comes back. Read before adding anything to the save or
changing its format. Adding something new to it: `common-changes.md`. How the clubhouse keeps
saves: `docs/clubhouse/rooms/saves.md`.

When the format changes, bump `SAVE_VERSION` and add the step that turns the old version into the new
one to `UPGRADES` in `core/save.js` (`restore()` runs every step in turn): never lose anyone's tower.

## The files

- `core/save.js`: saving and loading.
  - `snapshot()` turns the board, the bedrock, Sadie, barn, hay, the mole's piece and Chooter into
    plain data; `restore()` puts it back.
  - `restore()` throws on a save it can't read, and `loadGame()` then puts it aside as
    `.unreadable`, never wiped, and starts fresh; kept in the browser through `store`,
    `src/shared/storage.js`.
  - `clearTower()` (keeps friends and bests) and `startOver()` (forgets everything).
  - Saved under `sadies-dropper-world.save`, format `SAVE_VERSION`, once a minute and on the way
    out (`onLeave`).
- `core/saves.js`: every name it saves under, in one list (`SAVES`): the board, bests, friends, the
  dev sheet's physics and speed meter. A new save gets its name here (its test fails on a name
  written anywhere else), under one of its card's `keeps`.

## When and where

Saved in the browser once a minute, and when the page is hidden or closed (those are the saves that
matter; the timed one only covers a crash, losing at most a minute). Not more often: a full board's
save takes a slow phone about 30 ms, a small hitch. Saved under the key `sadies-dropper-world.save`
(a name nothing else in the clubhouse uses). A save it can't read is put aside
(`sadies-dropper-world.save.unreadable`), never wiped, and it starts fresh; the pause menu's SAVE A
BACKUP keeps a copy of it with everything else. Each browser and device keeps its own game.

## Size

Piece positions are kept to 1/100 px; a 50-piece board is about 24 KB. The bedrock keeps the board
to about 400 pieces however tall the tower gets (about 200 KB), far under the browser's ~5 MB
limit. The bedrock is saved as its height every quarter block (193 numbers) plus the flecks
(`docs/dropper-world/tuning/bedrock.md`).

## What comes back

What comes back exactly: every piece (squish, speed, asleep, fossil), the bedrock, the barn, the hay
and the hay trail, the mole's spot and the piece it holds, the supply, Sadie and Chooter. What
starts over: any trip home Sadie was on, the hay she was heading for, what the mole was doing (and
how tired it was), a thrown ball, particles, and the debug speed and rain.

## Clear tower and Start over

Clear tower: fresh board, keeps Chooter and bests. Start over: forgets every save in its one list
(`core/saves.js`): the board, bests, friends and the dev sheet's physics, as the pause menu's does.
Both need a second tap within 3 s.
