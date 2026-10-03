# How the clubhouse is drawn

The PS1 look in code, and the tricks that keep it from flickering or jumping. Read when changing how
anything is drawn. What it should look like: `docs/clubhouse/look/README.md`.

## Materials and textures (`look.js`)
- The PS1 material: corners snapping to the pixel grid, light per corner, few colours with
  dithering. No swimming textures (the owner found them far too distracting).
- The doorway and sky materials, and every texture, drawn on little canvases when it opens.
- `pictures.js` (Sadie's sprite; drawn by `art/clubhouse/pictures.py`, never edited by hand) is
  where her picture comes from.
- Every word painted in the clubhouse (signs, labels) uses the kit's 3x5 pixel font, drawn straight
  in (`words`), so none of them waits for a web font.
- It only resizes the drawing when the screen's size really changes, and draws again at once.

## No flicker
- Things painted on a floor (the path, rugs, the sunbeam) skip the depth test and are drawn straight
  after their floor (`onFloor`, floor `renderOrder` -2, them -1).
- Things on walls stand at least 4 cm off them.
- The camera's near plane is 0.1 m (phones' depth is coarse).
- Decals (`decal`, nudged toward the camera) are only for things seen up close: seen from far off
  the nudge is big enough to draw them over what's in front, and a phone's depth is too coarse to
  keep even 15 cm between a window and its wall. So the outside windows are painted into their
  walls' pictures (`painted()` in `outside.js`).
- A doorway's see-through box sits a hair above any ground that runs on under it, or the ground
  shows through.

## Nothing jumps at a doorway
Nothing flickers as you go through a doorway, and nothing jumps (the owner saw even a few
centimetres as a stutter). Standing on a doorway's line, corners of the walls and floor along it sit
almost exactly level with your eye, and the maths loses so much precision that whole walls drew
wrong for a frame. So in `look.js`:
- a corner that close to level with your eye counts as just behind you, and isn't snapped to the
  pixel grid;
- exactly on the line (to 0.1 mm) the view is drawn from 0.1 mm off it;
- within 40 cm of a doorway the far side is drawn without the tilted near plane (its own door bits
  are always hidden).
