# Dropper World's character files

Which file holds which part of the characters' minds and bodies. Read before changing a
character's code; who they are and why they act comes first:
`docs/dropper-world/characters/minds.md` and the pages beside it.

## The shared mind (`core/mind/`)

- `core/mind/feelings.js`: feelings: 0–1 numbers on each character that drift over time and get
  nudged by events.
- `core/mind/offers.js`: offers: things register what they're good for (`food`, `home`, `fetch`,
  `friend`, `restless`); characters look for offers, not particular things.
- `core/mind/thoughts.js`: what each character is thinking, in plain words, for the dashboard.
  Characters register `{ who, name, x, y, h, think() }` (`mindsFrom`); `think()` returns what
  they're doing, why, and their feelings as 0–1 bars (4 at most). Reading it never changes
  anything.
- `core/mind/think.js`: choosing: each tick every activity says how much the character wants it;
  the biggest want wins (small bonus for the current one; `busy` activities can't be interrupted).

## The characters

- `core/sadie/brain.js`: Sadie (`sadie` object): feelings (hunger, settled, impatient), activities (`eat`:
  nearest hay, wait, pace; `fetchBarn`: drag the barn up), her body (walk, run, climb, fall).
  Offers `friend` (and `restless`, which the mole reads).
- `core/sadie/mood.js`: Sadie's mood from her state and events, blinking, emote timing.
- `core/mole.js`: the mole, who drops the pieces.
  - Its feeling (`tired`, from how hard the game is working: `feelStrain`).
  - Activities (`bury` anyone restless, `barn`, `nap`), where it aims and when it lets go.
  - Digging up hay instead of a piece now and then and flinging it away (`drp.hay` while it holds
    it), its thoughts.
- `core/friends/chooter.js`: Chooter, Sadie's first friend.
  - Feelings (energy, tired, missing, ignored).
  - Activities (`greet`, `play`, `zoom` knocking pieces aside, `fetch` the ball, `home` to rest in
    the barn), his body (trot, leap, fall).
  - Before they meet he listens from next door (`listen`: the pieces thudding and the barn
    scraping wind him up), peeks in over the wall nearer Sadie, and bursts in once he can't stand
    it.
  - Offers `friend` once met, and `restless` while he's out.
