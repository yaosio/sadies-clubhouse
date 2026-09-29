// TypeFitter's card for the clubhouse: its name, its screen and its look, and its box on the
// menu's shelf. Nothing of the activity runs until the clubhouse calls start().
import page from './page.html';
import styles from './styles.css';
import front from './box.js';
import door from './door.js';

export default {
  id: 'typefitter',
  name: 'TypeFitter Deluxe 3.1',
  page, styles, door,   // door: its door on the mansion's landing
  box: { front, side: 0x2a1766, top: 0xffcf3a },
  blurb: ["FIT THE TEXT IN THE BOX. IT WON'T.", 'SADIE LOVES FONTS. YOU WIN ANYWAY.'],
  start: () => import('./main.js'),
};
