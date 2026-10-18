# Dog City

The giant red fire hydrant past the town square, where the dogs' buildings stand. Read when changing
the hydrant, its doors, or what stands on its landings.

- Numbers: `HYDRANT` and `HYDRANT_DOORS` in `src/clubhouse/town/layout.js`. Walking: `hydrant-walk.js`
  (pure numbers: the ramp's height at every turn, the ledges, the deck). Drawing: `hydrant.js` and
  `hydrant-art.js` (signs and textures).
- **The ramp** winds up round the barrel from a foot a little round from the square's side (`th0` is turned so the row of four doors at the base, which fans the other way, sits dead ahead as you come from the square). At each landing it levels
  off into a ledge; a dog's building stands there, its front door facing the hydrant, in line with the door that comes out of the barrel (`HOUSE_AT`), so you step out looking at its front. The top is the lookout deck. There is no edge to
  walk off: the floor just stops (rails are for looking at). Near the foot the ground is not a floor
  (`onTheFoot`), or you'd stay on the ground and never climb.
- **Landings are plots.** Lots 1 and 3 (two dogs' buildings) are on ledges (`ledge(i)`
  in `layout.js`, with their height as the plot's `y`). Lot 5 is Lily's ledge (`LILY_LOT`): with no
  card on it, it shows a COMING SOON sign, and the outside never offers it as the next free plot.
  Buildings on raised plots are lifted by `outside.raise(group)`.
- **The doors** are four pairs of portals: one at the foot and one on its landing (or the deck). They
  are plain portals, not rooms: no card, no activity, nothing for the room system to know. They are
  the clubhouse's ordinary portals (`outside.links`, a portal each in `clubhouse.js`), joining two
  places in the same outside. Step through one and you stand by its partner. The barrel has no flare at its foot: it showed up through the doors.
  The lookout door faces the clubhouse.
- Their ids are `dog-city.<id>.down` and `.up` (`DOOR_SIDES`).
- The plots those two used by the square are empty. A new one goes on the end of
  `LOTS` as usual.
- Checked by `checkHydrant` (`tests/clubhouse/hydrant.mjs`): the lookout and every ledge are reachable
  on foot, nothing past an edge is, the foot is clear, and every door pair walks through both ways.
- Pictures for looking at it: `node tools/clubhouse/hydrant.mjs`, into `dist/shots/hydrant/`.
- **The path** from the square's 43 degree path is its own curve (`hydrant.js`, "the path from the square to the foot"): out in front of the row of doors, where a paved apron lets you stand, then curving in to the ramp's foot. It isn't built from straight pieces.
- **Flat pictures on a landing** (a house's path, the pad) have no depth test, so each landing has its own draw order (`ledgeTop(i)`, `onLedge(i)` in `hydrant-walk.js`): above everything on the ground, and each higher landing a step later, so nothing painted on a low floor shows through a higher one. A house on a landing is lifted into its tier by `outside.raise(group, y)`.
