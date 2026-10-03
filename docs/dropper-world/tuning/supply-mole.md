# Dropper World's supply and mole numbers

The piece supply (`core/dropper.js`) and the mole (`core/mole.js`): how fast it drops, where, and
how it tires. Read before changing the mole's pace, aim or tiredness. Why it does what it does:
`docs/dropper-world/characters/mole.md`. Units: `world-solver.md`.

## Supply and flying

Up to 5 pieces, one refills every 1.5 s. The mole only lets go with a full supply, so at most one
piece every 1.5 s. It hovers 2.5 blocks above the highest point under it (±0.6 blocks), flies 6
blocks/s (slowing as it arrives; half speed when worn out), and lets go within 0.5 blocks of where
it's aiming. New pieces spawn at a random 90° rotation.

## Where

On the most restless creature once someone's at least 0.3 restless (want 1 + 2 × how restless;
each piece lands within 0.5 blocks of them), otherwise on the barn (want 1; anywhere from 2.3
blocks left of its middle to 2.3 right). Sadie's restlessness is her `impatient` feeling: it fills
in 12 s of waiting or pacing under hay, empties when she eats, and fades over 25 s otherwise.
Chooter's is how ignored he feels.

## Tired

The screen reports the share of each second the simulation takes (smoothed over about 2 s; not
counted while the dev sheet speeds the game up). Over 50%: tiredness rises, full in 8 s. Under 35%:
it falls, gone in 20 s. In between it stays put. The wait between pieces is 1.5 s × (1 + 3 ×
tired). Full: it naps (no pieces) until tiredness is down to 40%.

## A sense of scale

On this cloud computer, in Node: once settled, 120 pieces take about 1.6 ms a step, 220 about 2.3
ms, 370 about 5 ms (30% of each second at 60 steps). The mole drops about 37 pieces a minute on its
own, so on a device like that it starts slowing down somewhere past 10–15 minutes of building.
Raining 400 pieces in a headless browser here wore it out in about 17 s. With bedrock, a long game
stays around 400 pieces and 3–4 ms a step however long it runs.
