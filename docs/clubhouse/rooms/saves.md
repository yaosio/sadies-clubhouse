# Saves

How anything saves, through the save director (`src/shared/storage.js`), the one thing that touches
the browser's storage. Read when a room or activity saves anything.

## Saving
- A room saves with its kit's box, `m.saves`: `get(name, fallback)`, `set(name, value)`,
  `remove(name)`, each kept as `sadies-clubhouse.<id>.<name>`. A room never touches storage itself
  (the room checker fails it).
- An activity on a computer uses `saveBox('<id>')` from the toolbox. (Older keys from before the save director,
  `sadies-dropper-world.save`, a few starting `jellystack.`, and a few more starting `sadie.`, use `store`.)
- Its card's `keeps` lists what its keys start with. The pause menu's start-over buttons and backups
  use it, and a start-over erases all of it. EVERYTHING erases every card's `keeps` and the clubhouse's own
  keys, never the rest of the browser's storage (other pages may share the address). The clubhouse's own keys start with `mansion.`.
- **Never rename a key that's already in use:** everyone's saves would be lost.

## Saving on the way out
Something kept to save later (a paint job, a game going) is saved on the way out with the box's
`onLeave(fn)` (it hands back how to stop: call that in `putAway`), never the room's own `pagehide`.
After a start-over or a backup's put back the page reloads, and the director lets nobody save on
the way out then, so nothing erased comes back.

## Old and unreadable saves
- A save that can't be read is **put aside, never wiped**: `get` keeps it as `<its key>.unreadable`
  and hands back the fallback.
- An activity that can't make sense of an old save calls `putAside(name)` before starting fresh.
- When a save's shape changes, read the old one and turn it into the new: never throw away
  someone's progress. Old saves are checked: `docs/clubhouse/checks/shared.md`.

## The pause menu's YOUR SAVES
It says how full the browser's room for saves (about 5 MB for everything) is, warns when it's nearly
full or a save didn't fit, and saves or loads a backup file of every save. Loading looks the file over first
(`inspectBackup`) and turns it away, changing nothing, if it's too big (over 6 MB), isn't a backup,
is from a newer version, has no saves in it or has any save that can't be read. Then it asks, saying
the file's date and how many saves it holds. Loading is all or nothing and never wipes a save put
aside as unreadable.

## Checked
The clubhouse's checks put every room away and build it again three times over, and fail if any save
changed.
