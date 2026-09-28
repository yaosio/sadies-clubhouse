// Escape closes the dev sheet. There are no keyboard controls: it's a toy you play with by tapping
// or clicking the board (see pointer.js).
import { isSheetOpen, closeSheet } from '../ui/devPanel.js';

window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isSheetOpen()) { closeSheet(); e.preventDefault(); }
});
