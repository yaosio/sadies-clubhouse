// All of the game's changing state lives here, so every system reads and writes the same thing.
// (Sadie's own state is in sadie/brain.js, the mole's in mole.js and dropper.js.)
import { store } from '../../../shared/storage.js';
import { SAVES } from './saves.js';

export const world = {
  pieces: [],          // every piece on the board
  held: null,          // the piece the mole is carrying
  nextType: null,      // the piece after that
  bag: [],             // shuffled piece types still to come
  hay: [],             // Sadie's hay bundles (core/hay.js)
  hayEaten: 0,
  particles: [],       // sparkles, dust
  emotes: [],          // Sadie's floating notes, hearts, steam
  supply: 0,           // pieces ready to drop (fractional while refilling)
  gameTime: 0,
  spawnTimer: 0,
  topAll: 0,           // highest point of any piece
  topSettled: 0,       // highest point of settled pieces
  fossils: 0,          // pieces buried deep enough to be permanent ground (core/fossil.js)
  best: +store.get(SAVES.best, 0) || 0,
  climbBest: +store.get(SAVES.climbBest, 0) || 0,
};
