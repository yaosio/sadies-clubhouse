# Dropper World's toy and ground numbers

The thrown ball (`core/toys.js`) and what counts as ground (`core/surface.js`). Read before
changing toys or what characters can stand on. Units: `world-solver.md`.

## Toys (`core/toys.js`)

One out at a time. The mole throws it, taking 0.6–1.3 s to land near where you tapped. Ball radius
0.26 blocks, gravity 1400, keeps 55% of its speed on each bounce, rolls downhill.

## What counts as ground (`core/surface.js`)

Asleep, or older than 0.4 s with a smoothed speed under 0.6. The smoothing stops a ball at the top
of its bounce from counting.
