// Dropper World's card for the clubhouse: its name, its screen and its look, its box and its door
// in the clubhouse. Nothing of the game itself runs until the clubhouse calls start().
import page from './page.html';
import styles from './styles.css';
import front from './box.js';
import door from './door.js';

export default {
  id: 'dropper-world',
  name: "Sadie's Dropper World",
  page, styles, door,   // door: its door on the clubhouse's landing
  slot: 1, doorstep: 'dirt',   // which door on the landing is its (they never move), and the mole's dirt pile by it
  box: { front, side: 0xc8127a },   // box: its picture (on its computer's screen and poster) and its room's colour
  keeps: ['sadies-dropper-world.', 'jellystack.', 'sadie.'],   // what it saves in the browser (the pause menu can start it over)
  start: () => import('./main.js'),
};
