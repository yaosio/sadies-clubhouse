# Checks test fatal errors only (2026-10-03)

The owner: "I only care about fatal errors" and "we don't need tests for style choices like sound,
being able to back out of activities. What I'm really looking for is to minimize test time by
checking the minimum amount of things." A full check had grown to 16.5 minutes (about 6 of them the
calm-sounds check).

## Dropped on purpose (don't add back without the owner's say)
- **Sound:** the calm-sounds check (30 s standing still in every room and outside), every room's
  music and sound-effect checks in its browser test, the clubhouse's theme checks and volume
  buttons (the sound system's own headless rules stay: they cost nothing).
- **Looks:** the not-one-colour picture check, fonts, credits, the weather in every place, the far
  houses, the levels outside, two doors showing side by side.
- **Timings:** every room built under a time limit, a bit at a time, same few materials,
  Dropper World's slow-phone speed floor.
- **Polish and wording:** the pause menu's labels and how-full note, hints fitting the screen, the
  thumb stick dragging, doors staying open, stepping through without a jump, the view staying
  upright, the main theme fading, Sadie's lines word for word.
- **Backing out:** ESC and BACK inside a game (the clubhouse's ESC BACK from a computer stays, since
  it is how you get home).
- **How it plays:** every instrument, Sadie's walks and the SHH sign (Music Room), the three other
  rounds and the weather levers (Clyde's browser test; the rounds stay in its headless test), the
  stamp, bucket, dynamite, plunger and Sadie's prints (Paint Shop), Brickbuster's music, winces and
  hall sounds, Space Adventure's talk, music and radio, Dropper World's thoughts, dashboard, dev
  sheet and its tuning sections (hay, barn, Chooter, thoughts, bedrock: `--all` runs them).

## What the break-it audit (review/test-value-audit-2026-10-03) found, and was left alone
Walls not being solid, the pause menu's volume buttons not really turning things down, only W being
tested on a desktop and many "kept after a reload" checks not proving the game *used* the save.
Walls were asked to wait; the rest are polish by this rule.

## How to apply
New checks must pass the question in `docs/clubhouse/checks/fatal-only.md`. A bug that was
fatal, once it happens, gets a check; a bug in a dropped area gets fixed without one.
