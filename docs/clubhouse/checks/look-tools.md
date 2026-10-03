# Tools that look at the clubhouse

Picture-taking and measuring tools in `tools/clubhouse/`, all run on the built page. Read this when
you want to see or time something, or change one of them. The other tools are in `tools.md`.

- `tools/clubhouse/shots.mjs`: pictures from its main spots (the gate, the front door from both
  sides, the hall, the stairs, the landing, an activity's door and room), as a desktop and a phone,
  from the built page: `dist/shots/clubhouse/`.
- `tools/clubhouse/speed.mjs`: how quick it is, from the built page: how long the first picture
  took, how long each place took to build (and its longest bit), what's on the graphics card, each
  frame's work standing in each place, and three rounds of putting every room away and building it
  again (the numbers must come back the same).
  - It draws with a pretend graphics chip, so it shows what the checks can't: anything that makes the
    browser wait for the graphics card, like reading a pixel back from a drawn canvas (that held the
    game up for half a second per room until it was fixed; read pixels only from a canvas made with
    `willReadFrequently`).
- `tools/clubhouse/weather.mjs`: pictures of the world's weather in every place out of doors (each
  place with a `sky`), each weather, as a desktop and a phone, in `dist/shots/clubhouse/`
  (`[desktop|phone] [rain|snow|sun|cats|clear]`).
- `tools/clubhouse/startup.mjs`: how long the game takes to start, from the built page: from asking
  for the page to the clubhouse's first picture (the middle of a few runs), with every file held up
  as a real connection would (`--delay <ms>`, 100 by default) and when each came, so files fetched
  one after another show up. `--delay 0` for the building alone, `--phone`.
- `tools/clubhouse/spot.mjs`: a picture from anywhere: `node tools/clubhouse/spot.mjs <name> <place>
  <x> <z> <y> <lookX> <lookY> <lookZ>` stands there and looks at that point
  (`dist/shots/clubhouse/spot-<name>.png`), for checking how one thing looks.
