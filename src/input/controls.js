// The Follow Sadie button, and Escape to close the dev sheet. There are no keyboard controls: it's
// a toy you play with by tapping or clicking the board (see pointer.js).
import { setFollow } from '../render/view.js';
import { isSheetOpen, closeSheet } from '../ui/devPanel.js';

document.getElementById('topBtn').addEventListener('click', () => setFollow(true));

window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isSheetOpen()) { closeSheet(); e.preventDefault(); }
});
