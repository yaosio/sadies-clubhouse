# Dropper World's physics files (core/physics/)

Which file in `core/physics/` does what. Read before changing piece types or the soft-body solver.
The solver's numbers and why: `docs/dropper-world/tuning/world-solver.md`; materials:
`docs/dropper-world/tuning/materials.md`.

- `core/physics/pieceTypes.js`: every piece type: shape, color, name, and material numbers.
  **Add new piece types here.**
- `core/physics/templates.js`: builds each type's rest shape (point lattice per block, or rings for
  the ball).
- `core/physics/body.js`: creates a live piece; bounding boxes. Every piece starts with every field
  anything fills in later (`LATER`; the barn too), so the browser sees one kind of object and the
  physics stays fast: add a new piece field there, not on the fly.
- `core/physics/solver.js`: the soft-body solver. Pure math.
  - Integration, shape matching, finding nearby pairs (a grid for sleepers, another for awake
    pieces), collisions, friction, walls, bounce, sleeping.
  - The floor: the bedrock heightmap, or flat ground. A point that runs into the side of a step in
    the bedrock is pushed out sideways, like off a wall.
  - Fixed pieces (the barn) that only move when told to.
  - Its two grids only empty the cells they filled (they remember every cell the tower has ever
    reached, and emptying all of them got slower as the tower grew).
