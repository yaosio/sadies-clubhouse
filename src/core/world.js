// All of the game's changing state lives here, so every system reads and writes the same thing.
// (Sadie's own state is in sadie/brain.js, the dropper's in dropper.js.)
import { store } from '../platform/storage.js';

export const world = {
  pieces: [],          // every piece on the board
  held: null,          // the piece hanging from the dropper
  nextType: null,      // the piece after that
  bag: [],             // shuffled piece types still to come
  stars: [],
  particles: [],       // sparkles, dust
  emotes: [],          // Sadie's floating notes, hearts, steam
  supply: 0,           // pieces ready to drop (fractional while refilling)
  gameTime: 0,
  lastInteract: -99,   // when the player last touched the dropper
  spawnTimer: 0,
  holdingDropper: false, // player is dragging the dropper right now (set by input)
  topAll: 0,           // highest point of any piece
  topSettled: 0,       // highest point of settled pieces
  fossils: 0,          // pieces buried deep enough to be permanent ground (core/fossil.js)
  best: +store.get('jellystack.best', 0) || 0,
  climbBest: +store.get('jellystack.climbBest', 0) || 0,
};
