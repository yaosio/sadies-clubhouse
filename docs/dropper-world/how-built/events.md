# Dropper World's events and tick order

The events the simulation sends the screen, and what runs in each tick, in order. Read before
adding an event or something that runs every tick.

## Events

| Event | Sent by | Heard by |
|---|---|---|
| `hayEaten` (bundle) | sadie/brain | nobody right now* |
| `homeRush` | sadie/brain | nobody right now* |
| `barnHome` | sadie/brain | nobody right now* |
| `friendMet` (name) | friends/chooter | dashboard (the LED sign), toybox (shows the TOYS button) |
| `friendMovedIn` (name) | friends/chooter | nobody right now |
| `zoomies` | friends/chooter | nobody right now* |
| `ballBack` | friends/chooter | nobody right now* |
| `hayStolen` (bundle) | friends/chooter | sadie/brain ("hey!") |
| `toyThrown` (kind) | toys | nobody yet |
| `reset` | game | main (camera follows Sadie again), toybox (hides TOYS until a friend's met) |

*Pop-ups other than a new friend were removed.

## Tick order (`core/game.js`)

physics → piece bookkeeping (rest time, age, smoothed speed, top heights) → surface heightmap →
hay rides the pile → fossils → bedrock (the deepest fossils melt) → Sadie's brain → barn (dragged
or dropping) → Chooter → toys → Sadie's mood → Sadie's best height → particles and emotes → the
mole (tiredness, what to bury, flying there, letting go) → dropper (supply refill, hover, flying,
spawn) → debug rain. The camera and drawing happen after all steps in `loop.js`.
