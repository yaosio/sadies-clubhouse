# The clubhouse's world and the page shell

How Sadie's clubhouse is built as a 3D world you walk round (`src/clubhouse/`, its main file
`mansion.js`), and the page shell every activity runs in (`src/main.js`), a page per part. Read only
the part your change touches. The outside has its own folder: `docs/clubhouse/outside/README.md`.

- `shell.md`: the page shell: opening the clubhouse or an activity, ESC BACK, the test version's
  label.
- `places-and-doorways.md`: places, and the doorways that join them; doors opening and closing.
- `building-rooms.md`: building rooms as they're needed, putting them away, starting quickly, each
  room's code a file of its own.
- `walking.md`: you, the controls, the view on a phone, using a computer, the letter, the pause
  menu, and what a room is lent (`neighbours.js`).
- `hall.md`: the hall, its stairs and landings, and which wall a door goes on.
- `drawing.md`: how it's drawn: the PS1 material, textures, no flicker, no jumps at doorways, words.
