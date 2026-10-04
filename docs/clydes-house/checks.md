# Clyde's House: checks and picture tools

Its tests and the tools that take pictures of it. Read before changing a check or when checking a
change by eye.

## Tests

- `tests/clydes-house/run.mjs`: the rules, the weather machine's rules, the lines fitting the
  bubble, every bit of junk reacting its own way, every sound soft and short.
- `tests/clydes-house/browser.mjs`: fatal errors only: walking out to the house and in, junk in a
  gap, the first round (the other three and the finale are in the headless tests), the phone's
  taps, and the treat kept after a reload. The weather levers are not played in the browser.

## Picture tools

- `node tools/clydes-house/weather.mjs [desktop|phone] [rain|snow|sun|cats|clear]` takes pictures
  of the weather machine and of each weather from the town square, at Sadie, the sky, and from the hall.
- `node tools/clydes-house/shots.mjs [desktop|phone]` (after a build) saves the house from the
  gate, the square and the door, the castle from the town square, the room, and a run of the machine, in
  `dist/shots/clydes-house/`.
- `node tools/clydes-house/junk.mjs [part]` takes two of each bit of junk reacting.
- `node tools/clydes-house/tags.mjs [part]` puts the same part (FLOPPY DISK, the longest name,
  unless you name one) in every gap at once and takes a picture on a big desktop, a laptop and a
  phone, to check the name tags are readable and don't run into each other or the machine. The tags
  are drawn big (1.6 m wide) so they read on a wide screen, where the view pulls back to fit the
  whole machine.
