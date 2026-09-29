// Dropper World's card for the clubhouse: its name, its screen and its look, and its box on the
// menu's shelf. Nothing of the game itself runs until the clubhouse calls start().
import page from './page.html';
import styles from './styles.css';
import front from './box.js';
import door from './door.js';

export default {
  id: 'dropper-world',
  name: "Sadie's Dropper World",
  page, styles, door,   // door: its door on the mansion's landing
  box: { front, side: 0xc8127a, top: 0xffffff },
  blurb: ['A MOLE DROPS JELLY ON EVERYTHING.', 'SADIE CLIMBS THE PILE FOR HAY.'],
  keeps: ['sadies-dropper-world.', 'jellystack.', 'sadie.'],   // what it saves in the browser (the test version can clear it)
  start: () => import('./main.js'),
};
