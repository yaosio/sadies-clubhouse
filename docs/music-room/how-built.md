# How the Music Room is built

Which code file does what, how it plugs into the clubhouse, its saves and its checks. Read before
changing the code. Its sounds and rules for them are in `docs/clubhouse/sound/system.md`.

## The files (`src/activities/music-room/`)

| File | What it does |
|---|---|
| `card.js` | Its card: no page and no `start()`, just `room` (loads `room.js`), `door`, `slot` 3, `keeps`. |
| `room.js` | The room (12 x 10 m, 4.6 m tall), every instrument, Sadie drawn where `sadie.js` has her, the notes floating up off whatever's played, the chimes, the dial and the sign. Hands the clubhouse its place: a `play` on each instrument (`view` with `down`, looking down on it; `key` and `touch`, see `docs/clubhouse/rooms/controls.md`) and an `act` on the dial and the sign. `window.__musicRoom` for the checks (`sadieNow` sends her off). |
| `art.js` | Its pictures, drawn when it opens (from the mock-up), and the ones drawn again as things change: the lit keys, the synth's screen, the tape deck's buttons and reels, the dial, the sign. |
| `layout.js` | Which computer key plays what, and which key is where on the keyboards' picture (for presses). |
| `sadie.js` | Sadie, with no screen (the tests run it): when she goes, where, her steps and notes, napping, sulking, hopping off. `FAVOURITES` and `TIMING` are her numbers. |
| `tape.js` | The tape deck, with no screen: recording, playing, looping, the two tapes, what's saved. |
| `sounds/` | One file per instrument (`piano.js`, `drums.js`, `xylophone.js`, `synth.js`, `chimes.js`), all made in code as 8-bit 11 kHz samples with the toolbox's kit, `src/shared/retro.js` (gentle: soft starts, clean fades, a whisper of echo); `player.js` plays them through the volume dial on the clubhouse's sound system (`src/shared/sound.js`, the pause menu's SOUNDS volume), and makes the theremin's voice (it can't be a sample: it slides while you hold it); `index.js` names them all and how loud each is. A new instrument gets its own file and a line in `index.js`. |
| `door.js` | Its door on the landing. Drawn by `art/clubhouse/pictures.py`. |

## The clubhouse's main theme

It fades out as you come in (its place's `hush` is always on: this room is for your music; the
instruments are sounds, not music, so the MUSIC button never silences them; SOUNDS does) and back
in once you've left.

## Saves

Saves (`sadies-clubhouse.music-room.`): `tape` (both tapes, and which is in), `sign`, `volume`.

## Put away when you're far off

The clubhouse puts the room away when you've been three doors or more from it for a while, but
never with a tune or anything else still to happen in it (`busy()`). It needs no `putAway()`: the
clubhouse stops its sounds, and the tape and the settings are already saved, so it's the same when
built again.

## Its checks

- `tests/music-room/run.mjs`: headless. Every sound (8-bit, soft, no click, fading to nothing),
  which key plays what, three hours of Sadie (how often, how many notes, never on what you're
  playing, never while SHH or while you're out), the tape deck. A few seconds.
- `tests/music-room/browser.mjs`: phone and desktop, fatal errors only. Through its door, the piano
  (keys, a tap), recording and playing back a tune, the dial, kept after a reload (the other
  instruments, the sign, Sadie's walks and the chimes are not played: `docs/clubhouse/decisions/fatal-only.md`).
