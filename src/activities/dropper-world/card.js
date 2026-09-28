// Dropper World's card for the clubhouse: its name, its screen and its look. Nothing of the game
// itself runs until the clubhouse calls start().
import page from './page.html';
import styles from './styles.css';

export default {
  id: 'dropper-world',
  name: "Sadie's Dropper World",
  page, styles,
  start: () => import('./main.js'),
};
