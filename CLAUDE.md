# Sadie's Clubhouse

A lost 90s shareware activity center: Sadie's mansion and the world round it, with activities behind
doors in the mansion and in buildings outside. Sadie is the
owner's late cat, and she's in every activity (not always in the same way). The activities so far
are Sadie's Dropper World (a cozy physics toy), TypeFitter Deluxe 3.1 (text that never fits),
Brickbuster '96 (Breakout in the wall of its room, whose ball escapes into the house) and the Music
Room (instruments to play where they stand, which Sadie walks across now and then), the aquarium and
Space Adventure (a spaceship trip with Sadie, who talks the whole way); beside the house is the
Hedge Maze (made as you walk, letting you out into the backyard where Sadie naps); outside the
front gate, along a lane with plots for more buildings, is Clyde's House (the Good Morning Machine, and the Weather Machine beside it), and across the path
Chooter's Paint Shop (paint the room itself). Everything outside the gate belongs to somebody else; inside the fence is Sadie's.

## The owner
- Doesn't code, installs nothing, and doesn't know GitHub. Claude does all building, testing,
  committing, merging and publishing.
- Talk plainly and casually. No jargon.
- After every change, say what to look for in-game.
- Don't narrate the work step by step (they can see Claude is working, and the details mean nothing
  to them). Before building, explain how the thing will work in the game; after, say what changed
  and what to look for.

## Before changing anything
Read `README.md` (the clubhouse and its activities) and `docs/clubhouse/ARCHITECTURE.md` (the short
overview: how they fit together, and which page to read for what). Then only the docs of what you're
changing:
- **An activity:** its `docs/<activity>/README.md` first: what it is and its design pillars, which
  win over any feature idea. It lists its other pages; in Dropper World always read
  `ARCHITECTURE.md` and `TUNING.md`, plus `CHARACTERS.md` before changing how a character behaves
  (who they are and why they do things comes first) and `ART_STYLE.md` before changing how
  anything looks.
- **How anything looks:** also `docs/clubhouse/ART_STYLE.md` (the approved misremembered-90s look).
- **The mansion, the outside, the page shell, the toolbox, the build or the checks:** the page in `docs/clubhouse/`
  that `ARCHITECTURE.md` points to for it is enough.
- **Undoing or changing a big choice:** `docs/clubhouse/DECISIONS.md` first, and update it.

**The architect step:** before building a feature, say in the first reply (in plain words) which
shared systems it touches, whether another room would want the same thing (then it goes in the
toolbox, the building kit or the mansion, not the room; and the other way round, nothing only one room
needs goes in the shared files), and whether it uses up a spot or hits one
of the known limits (`DECISIONS.md`). When a doc says "never X", ask whether a check could enforce it.

**Sound:** everything that makes sound plays through the sound system, `src/shared/sound.js` (never
its own AudioContext; a check fails otherwise). A room gets `soundsFor('room:<id>')` and plays sounds
by name on a bus (`sounds`, `voices` for Sadie and Clyde); music it streams goes on `line('music')`.
Then the main theme makes way for its music, the pause menu's volumes work on it, the kind-to-the-ears
rules (no buzzing, no voice twice running, distance fade, a cap) apply, and it all stops when the room's
put away, with nothing more to do. The owner has misophonia: nothing droning, constant or repetitive.

Don't start a parked idea (each activity's README lists them) unless asked. Never move a room: a
new activity's door takes the next free spot on the landings (its card's `slot`), and anything by a
door (like the dirt pile by Dropper World's) stays with it. A building outside the gate takes the
next free plot along the lane instead (its card's `lot`), and one in the grounds round the house a
spot of its own (its card's `grounds`, `GROUNDS` in `outside.js`); plots and spots never move either.

## Making a change
1. `npm install` (esbuild, the bundler, three.js, for the mansion, ESLint and Playwright, at the exact
   versions `package-lock.json` locks), then edit only the modules
   involved. Keep the docs true: a change to an activity updates its own docs folder. Keep
   `ARCHITECTURE.md` short: a room's special cases go in its own docs, a system's details in its
   reference page (`tools/docs.mjs`, part of the check, limits the size of the docs every change reads).
2. Each activity lives in `src/activities/<name>/` and never imports from another activity or the
   clubhouse; only from its own folder and `src/shared/` (the toolbox, kept small: a change there
   retests every activity). In Dropper World, `core/` never touches the DOM or imports from
   `render/`, `ui/` or `input/`.
3. `npm run check -- --preview` must pass: it runs the code checker (`npm run lint`), `npm test`, builds the test version, and plays
   it in headless Chromium as a phone and a desktop (any page error fails). Look at the screenshots
   in `dist/check/`. While working, `--quick` skips the tests (Dropper World's take about a
   minute). Each activity's checks (and the mansion's) are skipped anyway if they already passed on exactly its code; the check prints how long each stage took. If a change is meant to move
   a test's numbers, explain why in plain words and update that activity's tuning notes (`docs/dropper-world/TUNING.md`).
4. Commit with a plain-English message saying what changed and what to look for in-game. Push to
   the working branch. Never commit `dist/` or `node_modules/`; do commit `package-lock.json` (it locks
   every tool's exact version). GitHub then runs the same checks on the pull request, each activity on
   its own computer at once (`.github/workflows/check.yml`); its tick must be green before a merge.
5. Publish that build to the test page (below) and give the owner the link, so they can try it.
   Build it again after committing (`npm run build -- --preview`): its label names the commit it
   was built at, and a build from before the commit shows the previous one, which confuses the owner.
6. When the owner says to, open a pull request, merge it into `main`, and publish the real game.
7. Checking something new by hand? If the script would be useful again, put it in `tools/<activity>/`
   (or add it to `tests/<activity>/browser.mjs`), not the scratchpad, which is gone next session.

## Publishing
- GitHub `main` is the source of truth. The game page is https://claude.ai/artifact/3vqbn276s3a4hCN462QjsB
- Only publish a build of `main`, to that same URL, once GitHub's check on main's latest commit is
  green (the run the merge started; on code the pull request already passed it takes a few
  minutes). Don't run the checks again here. First read the live page and its copy of the project
  (`game/source-*.json`, named in the page) into a folder, and list its files into a text file;
  then `node tools/publish.mjs --live <folder> --published <list>` builds the real game and checks
  it: main's latest commit, no test label, and the live copy is one of main's commits (if not, the
  game was changed some other way: stop and ask). It writes what to pass to the Artifact tool:
  the page, every game file as `game/<name>`, `null` for the page's old ones, and
  `capabilities: {downloads: true}` (the pause menu's SAVE A BACKUP needs it, on both pages).
- The test page is https://claude.ai/artifact/N7uvNgLxdePKW72SsM3NFX : the working branch, built
  with `--preview`, published after every pushed change without asking. It's never the source of
  truth and can be overwritten any time. `node tools/publish.mjs --preview --to <scratchpad folder>
  --published <list>` builds it and copies it outside `dist/`; publish that, always passing the
  test page's URL, so it can never land on the real game page. It keeps its own save, so
  the owner's real tower is never touched by a test build.
