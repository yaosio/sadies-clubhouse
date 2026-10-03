# Dropper World's tests and tools

Its own checks and the tools for measuring it. Read before changing a test, or when you need a
big tower, a profile or a timing. What the tests expect:
`docs/dropper-world/tuning/tests-world.md` and `docs/dropper-world/tuning/tests-characters.md`.

## Tests

- `tests/dropper-world/run.mjs`: Dropper World's headless checks: the real simulation in Node,
  seeded. Each numbered section runs in its own process, several at once, longest first: about 60 s
  in all on Claude's cloud machine (4 processors), most of it the bedrock and Chooter sections
  (`--section=N` runs one).
- `tests/dropper-world/browser.mjs`: Dropper World in headless Chromium as a phone and a desktop,
  side by side (run by `tools/check.mjs`).
  - It checks: new game (the mole digging up the first hay), the frame giving the board most of
    the screen with none of the old modern bits left, tapping Sadie and the mole (the dashboard
    shows them, faces drawn), Chooter peeking in, the dev sheet, a full board loaded from a save
    and reloaded, and how smooth that board is on a phone 4x slower (on its own, after the rest,
    so nothing skews it).
  - Its `prepare()` makes the full board; `tools/check.mjs` starts it before the headless tests so
    it's ready by the time it's needed.
  - Fails on any page error; screenshots in `dist/check/dropper-world/`.

## Tools

- `tools/dropper-world/fullboard.mjs`: a save of a full board (14 minutes of real play, about 400
  pieces, bedrock melting). About a minute to make. Its browser checks make one when `core/`
  changes (in the background, during the headless tests) and keep it in
  `dist/prepared/dropper-world/`. Handy for any experiment that needs a big tower.
- `tools/dropper-world/profile.mjs`: where the time goes.
  - It builds the game unsqueezed first (`--readable`, so the function names show), then plays the
    full board in headless Chromium as a phone slowed down 4x (`--slow N`, `--desktop`,
    `--seconds N`, `--zoom` to keep zooming in and out, `--zoomed-out` to look at the whole tower).
  - It prints how even the frames are, the game speed (under 100% when it slows down to keep up),
    which functions take the most time overall and in the slowest frames, and what the browser
    does besides (garbage collection, putting the picture on screen).
  - A hidden browser has no graphics card, so it blows the pixels up to screen size on the
    processor ("Commit" in its main-thread events), which a real phone's graphics chip does for
    free; the game's own code is measured fairly. (Its `--use-angle=swiftshader` pretend graphics
    chip was tried: far too slow to tell anything.) `--slow 2` is the better guide to a real phone.
- `tools/dropper-world/physics-load.mjs`: how hard the physics works on the full board, in Node:
  one step's cost with few, some and many pieces awake, and how many pieces each drop wakes and for
  how long. For judging physics speed-ups.
- `tools/dropper-world/board-shot.mjs`: pictures of the bare board (a tall pile, Chooter met,
  nothing on top), as a phone and a desktop, for mock-ups. Needs a build.
- `tools/dropper-world/arrival.mjs`: when Chooter first peeks in and bursts in on new boards, for a
  few random seeds (`node tools/dropper-world/arrival.mjs [seeds]`). For tuning how friends turn
  up.
