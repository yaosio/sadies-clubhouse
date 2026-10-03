# Clyde's House: checks and picture tools

Its tests and the tools that take pictures of it. Read before changing a check or when checking a
change by eye.

## Tests

- `tests/clydes-house/run.mjs`: the rules, the weather machine's rules, the lines fitting the
  bubble, every bit of junk reacting its own way, every sound soft and short.
- `tests/clydes-house/browser.mjs`: walking out to the house and in, junk in a gap, the four rounds
  and the finale, every sound played, the phone's taps and swipe, kept after a reload; then each
  weather lever outside, Sadie's reactions, the jingles, and the weather kept after a reload.

## Picture tools

- `node tools/clydes-house/weather.mjs [desktop|phone] [rain|snow|sun|cats|clear]` takes pictures
  of the weather machine and of each weather from the lane, at Sadie, the sky, and from the hall.
- `node tools/clydes-house/shots.mjs [desktop|phone]` (after a build) saves the house from the
  gate, the lane and the door, the castle from the lane, the room, and a run of the machine, in
  `dist/shots/clydes-house/`.
- `node tools/clydes-house/junk.mjs [part]` takes two of each bit of junk reacting.
- `node tools/clydes-house/tags.mjs [part]` puts the same part (FLOPPY DISK, the longest name,
  unless you name one) in every gap at once and takes a picture on a big desktop, a laptop and a
  phone, to check the name tags are readable and don't run into each other or the machine. The tags
  are drawn big (1.6 m wide) so they read on a wide screen, where the view pulls back to fit the
  whole machine.
