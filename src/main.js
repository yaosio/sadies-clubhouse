// The clubhouse: the shell every activity runs in. It knows each activity only by its card
// (src/activities/<name>/card.js: id, name, page, styles, start, and for the menu its box and blurb),
// and runs one at a time.
//
// The build finds the activities by their folders, so adding one never changes this file. The page
// opens in Sadie's mansion (src/clubhouse/), with a room per activity; using an activity's computer
// takes the mansion out and puts the activity in. An address naming an activity after the # (#dropper-world)
// goes straight into it. Every activity gets an ESC BACK key in its top left corner (Escape does the
// same, unless the activity used it for something, like closing a panel): it reloads the page into
// the clubhouse, so an activity never has to tidy up after itself (it saves when the page goes away).
import cards from 'activities';

const BACK_STYLE = `
#clubBack{position:fixed;left:calc(10px + env(safe-area-inset-left));top:calc(10px + env(safe-area-inset-top));z-index:50;
  display:flex;align-items:center;gap:7px;padding:6px 10px 6px 7px;cursor:pointer;color:#fff;
  font:13px/1 'Silkscreen',ui-monospace,monospace;letter-spacing:.04em;text-shadow:1px 1px 0 #1a0f40;
  background:#3a2a8e;border:2px solid;border-color:#9a8cff #1a0f40 #1a0f40 #9a8cff;box-shadow:2px 2px 0 rgba(26,15,64,.45)}
#clubBack kbd{font:11px/1 'Silkscreen',ui-monospace,monospace;color:#1a0f40;text-shadow:none;
  background:linear-gradient(#e8e0ff 40%,#c8bcff 40%);padding:3px 5px;border:2px solid;border-color:#fff #6a58d8 #6a58d8 #fff}
#clubBack:active kbd{border-color:#6a58d8 #fff #fff #6a58d8}`;

function leave() {
  try { history.replaceState(null, '', location.pathname + location.search); } catch {}
  if (location.hash) location.href = location.pathname + location.search;
  else location.reload();
}

async function enter(card) {
  const style = document.createElement('style');
  style.textContent = card.styles + BACK_STYLE;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML('afterbegin', card.page +
    `<link href="https://fonts.googleapis.com/css2?family=Silkscreen&display=swap" rel="stylesheet">` +
    `<button id="clubBack" aria-label="Back to the clubhouse"><kbd>ESC</kbd>BACK</button>`);
  document.title = document.title.replace("Sadie's Play Place", card.name);
  document.getElementById('clubBack').addEventListener('click', leave);
  await card.start();
  // listening after the activity has, so its own Escape (closing a panel) comes first
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !e.defaultPrevented) leave(); });
}

const wanted = cards.find(c => c.id === location.hash.slice(1));
if (wanted) enter(wanted);
else import('./clubhouse/mansion.js').then(mansion => mansion.open(cards, enter));
