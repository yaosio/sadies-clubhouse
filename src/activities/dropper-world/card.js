// Dropper World's card for the clubhouse: its name, its screen and its look, and its box on the
// menu's shelf. Nothing of the game itself runs until the clubhouse calls start().
import page from './page.html';
import styles from './styles.css';
import front from './box.js';

export default {
  id: 'dropper-world',
  name: "Sadie's Dropper World",
  page, styles,
  box: { front, side: 0xc8127a, top: 0xffffff },
  blurb: ['A MOLE DROPS JELLY ON EVERYTHING.', 'SADIE CLIMBS THE PILE FOR HAY.'],
  start: () => import('./main.js'),
};
