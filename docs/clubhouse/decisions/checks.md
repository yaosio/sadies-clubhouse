# Decisions: checks and tools

Why the checks and tools work as they do. Read before undoing one of these; add a line when a big choice is made or changed (saying when and why).

| Decision | Why |
|---|---|
| Each activity's checks are skipped when its exact code already passed | Merges stay quick |
| On GitHub (when run by hand), one computer per activity, all at once | A full retest takes as long as the slowest activity, not all of them |
| Never run several activities' browser checks side by side on one computer | The hidden browser draws on the processor; games slow down and checks trip |
| Browser checks wait in game time or for the thing itself, never a clock-timed pause | Slower computers (GitHub's) run fewer frames and fall behind the clock |
| `package-lock.json` is committed | Every tool at an exact version, so builds are repeatable |
| No auto-formatter | Only Claude writes the code; reformatting every file gains little and clashes with work in progress |
| The real game is published once `npm run check -- --live` passes on main's latest commit | GitHub's checks are off (below); `--live` skips what the live page already passed, so it's quick |
| GitHub's checks (and the Safari look) run only when started by hand; Claude's `npm run check` before every push, merge and publish is the check (2026-10-03) | The repository is private, so GitHub's computers cost minutes, and a run on every push used the owner's free month up in two days; the owner wants none used |
| Every card is checked against the clubhouse's rules (`tests/clubhouse/cards.mjs`) | A misplaced or misspelt card shows up as a plain reason, not a broken game |
| Each kind of control (a way of playing) is a file of its own in `src/clubhouse/play/`, lent only what it needs; the clubhouse just passes it keys, presses and frames | They used to be written into `clubhouse.js` one by one, so it grew with every new kind of play, inside or out |
| The shared code (the clubhouse, outside, shell, toolbox) never names an activity, and a check fails if it does | Reviews noted controls piling up in the clubhouse but only listed it as a limit; a check catches it the day it happens |
| Docs are laid out by task: `docs/TASKS.md` says which few files a job reads, one topic per small file, the same shape for every activity's folder (`tools/docs.mjs` checks it) (2026-10-02) | A job reads only what it needs, so reading stays small however many rooms there are; before this each change read 45 to 60 KB, mostly about other things |

