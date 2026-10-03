# Common changes to Dropper World

Recipes for the changes that come up most. Read before adding a piece type, a behavior, a friend,
a solid thing, a debug button, or anything that changes over time.

## New piece type

Add it to `SHAPES`, `COLORS`, `NAMES` and `MATERIALS` in `core/physics/pieceTypes.js`. It joins the
bag automatically. Optional decoration: add a flag in `templates.js` and draw it in
`render/jelly.js`.

## New behavior or interaction

Read `docs/dropper-world/characters/minds.md` first. Work out why the character would do it, then
add a feeling, an offer on the thing they'd want, or an activity (in `SADIE_DOES` /
`CHOOTER_DOES`), rather than a rule naming another character. If it needs a new look, add a mood
(`core/sadie/mood.js`, drawn in `render/sadieView.js`; Chooter's in `render/chooterView.js`).

## New friend

- A module in `core/friends/` like `chooter.js`: a reason they turn up, from something happening in
  the world, never a height or a time; their feelings and activities using `core/mind/`, their
  offers, their thoughts for the dashboard via `mindsFrom`, a reset. Called from `core/game.js`.
- Add them to `docs/dropper-world/characters/` (a page of their own, listed in
  `docs/dropper-world/README.md`).
- A drawing in `render/` (and where their face is, for the dashboard: `faceShot` in
  `ui/dashboard.js`, and a stamp in `page.html`).
- Their toy in `ui/toybox.js`'s `TOYS` list and `core/toys.js`.
- Anything random they do must wait until they've been met, so the seeded tests before the meeting
  stay the same.
- A friend can move pieces the way Chooter's zoomies do: `wake()` the piece, then give its points a
  speed by moving `px`/`py`.

## Something solid that isn't a jelly piece (like the barn)

Put it in `world.pieces` with `asleep: true, fixed: true` and move it by setting `kvx`/`kvy` (px per
second). The solver never wakes, pushes or tips it, and nothing above it turns to fossil.

## New debug button

The action goes in `core/debug.js` (so the tests can press it too), the button in the Debug tab in
`page.html`, wired up in `ui/devPanel.js` (`act(...)`, plus its on/off state in `refresh()`).

## Feel of the physics

The dev panel defaults in `config.js`, or a piece's material numbers. Never expose these to the
player.

## Anything new that changes over time

It goes in `core/`, is driven from `update()` in `core/game.js`, and gets drawn by something in
`render/`. If it should survive closing the page, add it to `snapshot()` and `restore()` in
`core/save.js` (and the save test). When the save's format changes, bump `SAVE_VERSION` and add the
step from the old version to `UPGRADES` in `core/save.js`: a format change must never lose anyone's tower.
