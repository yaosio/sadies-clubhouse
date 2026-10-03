# Decisions: sound, look and saves

Why sound, the look and saves work as they do. Read before undoing one of these; add a line when a big choice is made or changed (saying when and why).

## Sound
| Decision | Why |
|---|---|
| One sound system, one audio engine; a check fails on any other | The kind-to-the-ears rules live in one place (the owner has misophonia) |
| The main theme is composed as it plays and never repeats; no drums, drones or held notes | The owner asked for it; misophonia |
| The theme makes way by itself for any other music | No room has to manage it |

## Look
| Decision | Why |
|---|---|
| PS1-style materials, no swimming textures | The approved look; the owner found swimming far too distracting |
| No fog for far things | The PS1 material has none; adding it would change the approved look |
| Words in the clubhouse use the 3x5 pixel font, drawn in | Nothing waits for a web font |
| Pixels are read only from canvases made with `willReadFrequently` | Reading a drawn canvas froze the game up to half a second per room |

## Saves
| Decision | Why |
|---|---|
| `src/shared/storage.js` is the only thing touching browser storage; rooms save through their kit's box | A new home for saves (itch.io, a desktop app) changes one file |
| A save that can't be read is put aside (`.unreadable`), never wiped; old save shapes are upgraded | Nobody loses progress to a bug or a change |
| Backups are a file the owner saves and loads from the pause menu, all or nothing | Browsers can clear saves; a half-loaded backup would mix two games |
| Never rename a save key in use | Everyone's saves would be lost |
| The test page keeps its own save | A test build never touches the owner's real progress |
