# Dropper World's drawing files (render/)

Which file in `render/` draws what, and how the camera and chunky pixels work. Read before
changing how anything is drawn (and `docs/dropper-world/look.md` before changing how it looks).

## The camera and the pixels

- `render/view.js`: canvas, viewport, camera (`cam`), world/screen conversion.
  - Follow-Sadie camera: dragging or zooming stops it following for good (after that the camera
    only moves when the player moves it). The camera never looks more than 2 blocks below the
    lowest point of the bedrock.
  - The chunky pixels: everything draws on a small canvas (`#pixels`, `ctx`, still in screen
    pixels; `vp.P` is one big pixel, a whole number of the screen's own pixels), and the browser
    blows it up to fill the screen with hard edges (CSS `image-rendering: pixelated`), which the
    phone's graphics chip does for free. (We used to blow it up ourselves each frame: over half of
    every frame's time in the profile.)
  - Numbers and emotes go on sharp afterwards (`crisp`), on the full-size `#world` canvas on top,
    which also takes the touches; `present()` draws them, and only clears it when something was on
    it. There's no effect over the whole screen (one was tried and made phones stutter).
  - `resize()` only resizes the canvases when the board's size really changed (resizing wipes
    them), and the board is drawn again straight away, so it never shows a black frame.
  - `drawFace` points the camera at a character's head for a moment and runs their drawing code
    into a little canvas: the faces in the dashboard (`ctx` is the board's small canvas the rest of
    the time).
- `render/pixels.js`: the 90s dotted shading, drawn into each thing: `dots(color, amount)` (a
  see-through pattern of big pixels), `bands()` (colors fading in dotted bands, for sky, hills,
  ground, bedrock), `snap()` (round to the pixel grid).
- `render/color.js`: color helpers.

## The scene

- `render/scene.js`: draws a frame back to front: sky (sun, drifting clouds, each drawn once into
  its own little picture and stamped after that, and two rows of hills that move slower than the
  board), ruler (numbers in the blocky pixel font), walls, ground, hay, barn, pieces, the bedrock
  (marbled candy rock with flecks of what melted in), Sadie's rope, Sadie, held piece, the mole,
  particles. Skips pieces and hay that are off screen.
- `render/jelly.js`: draws one jelly piece as a gummy shape (darker rim, rim light on the bottom
  right, dark outline in its own color, white shine, material decorations).
  - A sleeping piece is drawn once into its own little picture (`p.spr`) and stamped after that
    (`drawPiece`), redrawn only when it wakes or the zoom changes: with a big tower most pieces are
    asleep, so this is what keeps drawing cheap.
  - While the zoom is moving (a pinch), the pictures are only stretched; once it holds still
    they're redrawn, about 2 ms' worth a frame (`mayRedraw`; redrawing them all every frame of a
    pinch made drawing 4x slower).
- `render/hayView.js`: draws the hay bales: tumbling while flung, then glowing and floating with a
  twinkle under them (the mystery float, drawn under the mole too).
- `render/barnView.js`: draws Sadie's barn and the rope she drags it with.
- `render/sadieView.js`: draws Sadie in every mood, and her emotes.
- `render/moleView.js`: draws the mole (squinting, drooping when tired, snoozing when napping,
  aghast at hay it dug up) holding its piece or the hay.
- `render/chooterView.js`: draws Chooter in every mood, his face in the barn's hayloft window while
  he's home, and his head peeking in over a wall before they meet (mirrored for the left one).
- `render/toyView.js`: draws the toys (the tennis ball).
