# What sounds are made with

The shared pieces a room makes its sounds and music from. Read when making a new sound or a room's
own music. How they're played: `system.md`.

## The sound kit (`src/shared/retro.js`)
What the rooms' sounds are made with (plain numbers: 8-bit 11 kHz samples):
- `rng`, `hz`, `blank`, `ring`, `ping`, `pluck`, `swell`, a sliding `tone`, a soft `hush`,
  `resonance`;
- Sadie's `mrrp` (each room its own pitch);
- two endings: the gentle `finish`, and the same with no echo, `dry`.
The rooms share it: never a copy of it in a room, and nothing in it only one room uses (a room's
harder sound of its own stays in its folder).

## The band (`src/shared/band.js`)
What a room's own music plays through: a music line, an echo, and parts that fade in and out with
their share of the echo. The room keeps its notes and when they're due; a new room's music starts
here.
