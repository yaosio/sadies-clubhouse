# Walking, controls and the pause menu

You, the controls, and the rest of `clubhouse.js`. Read when changing how you walk, look, use things,
or the pause menu. Ways of playing a thing in a room: `docs/clubhouse/rooms/controls.md`.

## You and the controls
The keys, mouse and stick are in `src/clubhouse/controls.js`; what they do next is in `clubhouse.js`.
- Walking, the eye following steps smoothly.
- WASD or the arrows; the mouse, locked to the view after a click, or dragging if the browser won't
  lock it.
- On a phone, a thumb stick that stays in the bottom left corner (only a touch starting on it walks),
  and dragging anywhere else to look.
- The camera turns round the upright first, then looks up or down, so the view never tips over.
- E, or the button on a phone, to use.

## The view on a phone
At most 68 degrees tall, looking at most 43 degrees up or down (more made the walls lean like the
view had tipped over), dragging up and down slower than sideways, and your gaze drifting back to
level while you walk with the thumb stick.

## The rest of `clubhouse.js`
- The doorways (`places-and-doorways.md`).
- Using the computer: you lean in until the screen fills the view, then the clubhouse leaves the
  page and the activity comes in. It notes which one in `sessionStorage`, so coming back puts you at
  that computer.
- Easing your view somewhere (`glideTo`).
- Passing keys, presses and frames to the ways of playing.
- Sadie's letter (`mansion.invited`: the first time only).
- The pause menu (Esc or the pause button). It also starts over everything, the invitation, or an
  activity's saves, each only after a YES on its "are you sure?"; and YOUR SAVES: how full they are,
  and backups (`docs/clubhouse/rooms/saves.md`); and CREDITS (`credits.js`): whatever the game uses
  that someone else made (three.js, the fonts) and its licence. A new one is added there (a check
  fails if a font isn't, and if three.js's notice goes missing from the build).
- `window.__clubhouse`, for the checks.

## The ways of playing (`play/`)
Each is lent only what it needs (`you`: the view, the controls held, the mode, `glideTo`).
- `arcade.js`: playing a game that lives in its room (mode `arcade`).
- `paint.js`: painting a place with a `brush` (its LOOK and PAINT buttons, box and dot are its own
  HTML and CSS beside it).
What each does for a room: `docs/clubhouse/rooms/controls.md`.

## What a room is lent (`neighbours.js`)
What a room is lent of the hall, the outside and its landing door: only what
`docs/clubhouse/rooms/kit.md` lists; anything else a room asks the kit or them for is an error on the
spot.
