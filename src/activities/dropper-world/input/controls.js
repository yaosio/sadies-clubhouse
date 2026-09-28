// Keys: Escape closes whatever's open (the dev sheet, help, the toy box) before the clubhouse
// gets it; F1 opens help. There are no game controls: it's a toy you play with by tapping or
// clicking the board (see pointer.js).
import { isSheetOpen, closeSheet } from '../ui/devPanel.js';
import { isHelpOpen, showHelp } from '../ui/help.js';
import { isTrayOpen, closeTray } from '../ui/toybox.js';

window.addEventListener('keydown', e => {
  if (e.key === 'F1') { showHelp(); e.preventDefault(); return; }
  if (e.key !== 'Escape') return;
  if (isSheetOpen()) closeSheet();
  else if (isHelpOpen()) showHelp(false);
  else if (isTrayOpen()) closeTray();
  else return;
  e.preventDefault();
});
