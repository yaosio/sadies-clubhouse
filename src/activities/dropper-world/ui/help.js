// F1 HELP: a little HELP.TXT window over the board saying what's going on and how to look around.
const win = document.getElementById('helpWin'), key = document.getElementById('helpKey');
export const isHelpOpen = () => !win.hidden;
export function showHelp(open = win.hidden) { win.hidden = !open; key.setAttribute('aria-expanded', open); }
key.addEventListener('click', () => showHelp());
document.getElementById('helpX').addEventListener('click', () => showHelp(false));
