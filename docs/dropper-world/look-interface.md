# Dropper World's interface look

The frame, dashboard and keys: the mock-up's plan, and what was built. Read before changing the
screen around the board. The rest of its look: `look.md`; the shared rules:
`docs/clubhouse/look/README.md`.

## The plan: a DOS game that built its own

(The mock-up's plan. Some of it was dropped: what was built is in the next section.)
No gray Windows look. It's a DOS program that had no Windows to copy, so it invented its own and
tried way too hard:

- **Panels:** candy purple with a faint woven texture, raised and sunken edges in lavender and
  deep indigo, gold rivets in the corners.
- **Logo:** big blocky letters with a stripe of color per scanline (yellow, orange, pink, purple),
  a thick dark outline and a hard drop shadow.
- **Tag plaque:** "SHAREWARE V0.9 BETA / PLEASE COPY & SHARE!"
- **Stamp toolbar:** chunky rounded buttons with little pictures (mole in beanie, jelly, hay,
  paw). The selected one glows gold; "full version only" ones are dark with a padlock.
- **Dashboard** (like a 90s action game's status bar, but for a cat): Sadie's face drawn bigger
  on the left (her mood shows here), the piece supply as slots with a refill bar, her mood in
  words and a hunger meter, and a green LED message board.
- **F-key bar:** "F1 HELP, F2 SAVE (FULL VER.), F3 SOUND, F5 ABOUT, ESC QUIT" with little keycaps.
- **The never-finished feeling:** "CHAPTER 2 COMING SOON 1996!", locked tools, save only in the
  full version (no prices and no order buttons: `docs/clubhouse/look/README.md`).

## As built

Mock-up in `art/90s-style/interface-mockup.html` (published at
https://claude.ai/artifact/JeTXaHsXxnPpSYe37qBbMY).

- Every modern bit left the board: the thought bubble, tip, pop-ups, round Toys and dev buttons,
  Sadie's "↑ 3.1" pill (gone altogether: the owner said how far she is from the hay doesn't
  matter), the light strip under the mole, the rounded font.
- The frame: top strip with ESC BACK and logo, a key bar with F1 HELP, F12 DEV and TOYS (no F3
  SOUND, the owner said drop it).
- In the middle, Dropper World's own dashboard: stamps (who you're watching) and their face (drawn
  live by their own drawing code, so it shows their mood), name, mood word, what they're doing,
  their strongest feeling only (one LED meter; the owner's call) and why, plus an LED sign for news
  and hints.
- On a phone it's one slim strip (tap it for why), the stamps sit in the key bar, and the LED sign
  only shows over the strip for news; on a wide screen, sideways, it's a column down the right.
- Fonts: Silkscreen (blocky capitals, which the owner loves) for labels, VT323 (a DOS screen) for
  sentences.
- No next-piece display (the owner said no).
- Board pictures for mock-ups come from `tools/dropper-world/board-shot.mjs`.
- The frame lives in Dropper World; TypeFitter has its own copy of its look.
