# Dropper World's Sadie numbers

Sadie's reach, speeds, climbing, pacing and moods (`core/sadie/brain.js`). Read before changing how
she moves. Her trips with the barn: `barn.md`. Why she does things:
`docs/dropper-world/characters/sadie.md`. Units: `world-solver.md`.

- Reach 1.6 blocks above her feet. Walk 1.7 blocks/s, climb 0.8 blocks/s.
- Steps up to 0.5 blocks; anything more than 0.55 blocks higher just ahead is a wall she climbs.
- Uses solid spans in a vertical slice (spans closer than 0.25 blocks merge), so overhangs above
  her head don't count as floor.
- Targets the nearest hay by |dx| + 1.5 × |dy|.
- Runs (2.5× speed) when her hay is more than 6 blocks away sideways; walks again under 2.5.
- Can't reach her hay: waits 1.5 s, then paces 1.5 blocks out, turning and going 1 block further
  each lap, up to 12.
- Moods: neutral, lookup (waiting), mad (pacing), happy (climbing), excited (ate hay or got her
  barn home), scared (falling or lurching ground), run, haul (dragging her barn).
