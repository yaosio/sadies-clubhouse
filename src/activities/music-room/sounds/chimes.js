// The wind chimes by the window, the one thing in the room that sounds without you playing it: only
// when you walk under them, a few soft notes, and not again for a good while (room.js has when).
import { blank, ring, finish, hz } from './retro.js';

export const TUBES = [79, 81, 84, 86, 88];   // a pentatonic handful, high and gentle
export const REST = 25;                      // seconds before they'll chime again

export function chime(i) {
  const f = hz(TUBES[i]), a = blank(2.2);
  ring(a, f, 1.8, 0.28); ring(a, f * 2.76, 4, 0.08); ring(a, f * 1.003, 1.8, 0.12);
  return finish(a, 0.15);
}
