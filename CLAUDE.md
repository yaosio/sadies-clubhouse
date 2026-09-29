# Sadie's Play Place

A lost 90s shareware activity center. Sadie is the owner's late cat, and she's in every activity
(not always in the same way). The first activity is Sadie's Dropper World, a cozy physics toy, not a
game. The design pillars below are Dropper World's.

## The owner
- Doesn't code, installs nothing, and doesn't know GitHub. Claude does all building, testing,
  committing, merging and publishing.
- Talk plainly and casually. No jargon.
- After every change, say what to look for in-game.
- Don't narrate the work step by step (they can see Claude is working, and the details mean nothing
  to them). Before building, explain how the thing will work in the game; after, say what changed
  and what to look for.

## Before changing anything
Read `README.md`, `docs/ARCHITECTURE.md` and `docs/TUNING.md`. Before changing how a character behaves,
also read `docs/CHARACTERS.md`: who they are and why they do things comes first. Before changing
how anything looks, also read `docs/ART_STYLE.md` (the approved 90s look, going in step by step).

## Making a change
1. `npm install`, then edit only the modules involved.
2. Each activity lives in `src/activities/<name>/` and never imports from another activity or the
   clubhouse; only from its own folder and `src/shared/` (the toolbox, kept small: a change there
   retests every activity). In Dropper World, `core/` never touches the DOM or imports from
   `render/`, `ui/` or `input/`.
3. `npm run check -- --preview` must pass: it runs `npm test`, builds the test version, and plays
   it in headless Chromium as a phone and a desktop (any page error fails). Look at the screenshots
   in `dist/check/`. While working, `--quick` skips the tests (Dropper World's take about a
   minute). Each activity's checks (and the mansion's) are skipped anyway if they already passed on exactly its code; the check prints how long each stage took. If a change is meant to move
   a test's numbers, explain why in plain words and update `docs/TUNING.md`.
4. Commit with a plain-English message saying what changed and what to look for in-game. Push to
   the working branch. Never commit `dist/`, `node_modules/` or `package-lock.json`.
5. Publish that build to the test page (below) and give the owner the link, so they can try it.
   Build it again after committing (`npm run build -- --preview`): its label names the commit it
   was built at, and a build from before the commit shows the previous one, which confuses the owner.
6. When the owner says to, open a pull request, merge it into `main`, and publish the real game.
7. Checking something new by hand? If the script would be useful again, put it in `tools/<activity>/`
   (or add it to `tests/<activity>/browser.mjs`), not the scratchpad, which is gone next session.

## Publishing
- GitHub `main` is the source of truth. The game page is https://claude.ai/artifact/3vqbn276s3a4hCN462QjsB
- Only publish a build of `main` (`npm run check`, no `--preview`), to that same URL.
  Before publishing, make sure `grep -c '<div id="testBadge"' dist/index.html` is 0 (that's the test
  version's label; the bare word also appears in the embedded source of the build tool).
  If main's code is exactly what already passed on the branch, the check skips those tests by
  itself, so this is quick.
- Read the live page first. If its embedded source differs from `main`, stop and ask. Then pass
  the saved copy of it to the check (`npm run check -- --live <file>`): an activity whose code is
  exactly what's already live (say, only docs or art changed) skips its tests even in a fresh
  session.
- The test page is https://claude.ai/artifact/N7uvNgLxdePKW72SsM3NFX : the working branch, built
  with `--preview`, published after every pushed change without asking. It's never the source of
  truth and can be overwritten any time. Publish it from a copy outside `dist/` (the scratchpad),
  always passing its URL, so it can never land on the real game page. It keeps its own save, so
  the owner's real tower is never touched by a test build.

## Design pillars (these win over any feature idea)
- The satisfying part is watching pieces squish, pile up, and topple. Protect that above all.
- Unhurried: the mole drops at most one piece every 1.5 s (slower when it's tired), so every
  squish and topple can be watched.
- Physics feel is tuned by us, never by the player. Variety comes from piece types.
- The mole decides where pieces go, for its own reasons (everything belongs underground). It never
  means to help Sadie; when it does, it's by accident.
- Sadie is a character with moods, not a cursor.
- The player controls the camera. Once they've moved it, it never moves or zooms by itself.
- Believable, not accurate: the physics only has to look real, so cheat wherever nobody can tell
  (never on the squish itself). It's a lost 90s shareware toy pushing the hardware too hard, and
  sometimes the hardware pushes back: slowing down is fine, stuttering isn't.
- One feature at a time. Make sure it's fun before the next.

## The second activity: TypeFitter Deluxe 3.1 (built 2026-09-28)
A text-fitting activity where the text can never fit its box, on purpose (a joke on the long fight
to make Dropper World's dashboard text fit). The owner's rules for it: it's obviously broken on
purpose, never by accident; the player always wins anyway; it shows off 90s text tricks (fresh
after DOS); no puzzle, nothing for the game or the player to keep track of; nothing carried over
from Dropper World's mechanics; Sadie is a flat, static picture traced from her real photo
(dithered, few colors, badly compressed, no outline round her) with a speech bubble of made-up
facts. The design pillars above are Dropper World's; TypeFitter's are these. Details in
`docs/ARCHITECTURE.md`, `docs/TUNING.md` and `docs/ART_STYLE.md`; the approved mock-up is
`art/typefitter/mockup.html`.

## Parked ideas (don't start unless asked)
Sadie batting pieces around, upgrading Sadie's barn, more friends after Chooter, friends building
things out of dropped pieces, sky zones with different physics, unlocking piece types, prestige by
melting the tower, a desktop-toy version, other ideas for the dashboard (it shows one
character's thoughts at a time, and only their strongest feeling).
