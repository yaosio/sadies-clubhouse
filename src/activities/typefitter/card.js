// TypeFitter's card for the clubhouse: its name, its screen and its look, its box and its door
// in the mansion. Nothing of the activity runs until the clubhouse calls start().
import page from './page.html';
import styles from './styles.css';
import front from './box.js';
import door from './door.js';

export default {
  id: 'typefitter',
  name: 'TypeFitter Deluxe 3.1',
  page, styles, door,   // door: its door on the mansion's landing
  box: { front, side: 0x2a1766 },   // box: its picture (on its computer's screen and poster) and its room's colour
  start: () => import('./main.js'),
};
