# Adding an activity

The files a new activity needs. Adding one never touches the shared code: the build finds every
`src/activities/*/card.js`. (A new plot or grounds spot is the exception:
`docs/clubhouse/outside/plots.md`.) Check the idea against `docs/clubhouse/RULEBOOK.md` first.

- `src/activities/<id>/card.js` (`card.md`): its door, plot or spot is the next free one.
- For one on a computer: `page.html`, `styles.css` and a `main.js`. For a room: `room.js`
  (`kit.md`, `place.md`).
- `tests/<id>/run.mjs` and `tests/<id>/browser.mjs` (`docs/clubhouse/checks/activity.md`).
- `docs/<id>/`, in the shape every activity's docs have: `README.md` (what it is in a few lines,
  `## Design pillars`, `## Its pages`), `playing.md`, `how-built.md`, `parked.md`, and `history.md`
  once there is some. `tools/docs.mjs` checks the shape.
- A line in the main `README.md`'s table of activities.

Nothing else changes. A new kind of control is a file of its own in `src/clubhouse/play/`
(`controls.md`).
