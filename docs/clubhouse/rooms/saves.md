# Saves

How anything saves, through the save director (`src/shared/storage.js`), the one thing that touches
the browser's storage. Read when a room or activity saves anything.

## Where saves live
- In the browser's IndexedDB (database `sadies-clubhouse`), one record per save, gzip-squeezed when
  over 1 KB (a plain fallback where the browser can't). Old saves from localStorage are NOT carried over.
- Everything is answered at once from a copy in memory, so `get` and `set` stay plain, not async.
  `src/main.js` waits for `ready()` (reads the lot in) before the clubhouse or an activity starts.
- A change is written to the disk about a second later, and as the page is hidden or closed. IndexedDB
  can be cut off mid-write as a page closes, so a note of what's unconfirmed is also left in
  localStorage (`sadies-clubhouse-journal`) and finished by the next page.
- If the browser won't keep saves at all, the game plays on and the pause menu says so.
- The checks plant saves with `window.__plantSaves` and read them with `window.__saves.all()`.
- The notes kept about the saves (`sadies-clubhouse-meta.`: when a backup was last made, whether
  persistence was asked) aren't saves: no backup holds them and no start-over erases them.

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
It says how much the saves take and when the last backup was (yellow when the browser hasn't promised
to keep the saves and the last backup is over a month old or never: Claude's choice). It warns when the
browser says it's nearly out of room, a save didn't fit, or the browser won't keep saves. The game asks
the browser once to keep its saves (`navigator.storage.persist()`). It saves or loads a backup file of every save. On a touch device SAVE A BACKUP opens the phone's share sheet with the same contents as a `.txt` file (share sheets turn `.json` away); a cancel saves nothing, and no share support or a failed share falls back to the normal download. Loading takes `.json` or `.txt`. Loading looks the file over first
(`inspectBackup`) and turns it away, changing nothing, if it isn't a backup (a backup has no size cap),
is from a newer version, has no saves in it or has any save that can't be read. Then it asks, saying
the file's date and how many saves it holds. Loading is all or nothing and never wipes a save put
aside as unreadable.

## Checked
The clubhouse's checks put every room away and build it again three times over, and fail if any save
changed.
