# Dropper World's piece materials

Each piece type's material numbers (`core/physics/pieceTypes.js`) and how bounce works. Read
before changing how a piece type feels or adding one. Units and how to change tuning:
`world-solver.md`.

| Piece | Name | kMul | bendMul | invMass | bounce | drag | grip |
|---|---|---|---|---|---|---|---|
| I | Ice bar | 1.6 | 1.5 | 1 | 0 | 1 | 0.08 |
| O | Sponge | 0.45 | 1 | 1.4 | 0 | 1 | 1.6 |
| T | Grape gum | 1.3 | 1.5 | 1 | 0.45 | 0.5 | 1 |
| S | Lime grip | 1 | 1 | 1 | 0 | 1 | 3 |
| Z | Cherry brick | 1.8 | 2 | 0.5 | 0 | 1 | 1 |
| L | Wobbler | 0.7 | 0.7 | 1 | 0 | 0.25 | 1 |
| J | Marshmallow | 0.35 | 0.6 | 1.8 | 0 | 1 | 1.3 |
| 6×1 | Noodle | 0.9 | 0 | 1 | 0 | 1 | 1 |
| 2×2 | Boulder | 4 | 5 | 0.25 | 0 | 1 | 1 |
| round | Bouncy ball | 2.5 | 7 | 0.7 | 0.75 | 0.15 | 1 |

Bounce is whole-body: if a bouncy piece touched something this substep while approaching faster
than 0.4 px/substep, its outgoing speed along the contact is set to bounce × incoming.
