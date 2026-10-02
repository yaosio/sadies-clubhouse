// The clubhouse: the shell every activity runs in. It knows each activity only by its card
// (src/activities/<name>/card.js: id, name, where it is, and page, styles and start for one on a
// computer, or room for a game that lives in its room or building: docs/clubhouse/ROOMS.md),
// and runs one at a time.
//
// The build finds the activities by their folders, so adding one never changes this file. The page
// opens in Sadie's mansion (src/clubhouse/), with a room per activity; using an activity's computer
// takes the mansion out and puts the activity in. An address naming an activity after the # (#dropper-world)
// goes straight into it. Every activity gets an ESC BACK key in its top left corner (Escape does the
// same, unless the activity used it for something, like closing a panel): it reloads the page into
// the clubhouse, so an activity never has to tidy up after itself (it saves when the page goes away).
//
// The mansion and every activity's code are files of their own, fetched when they're needed (the
// build splits them). If one won't come (the network hiccuped), it's tried again a few times, and if
// it still won't, the page says so instead of staying blank.
import cards from 'activities';

const BACK_STYLE = `
#clubBack{position:fixed;left:calc(10px + env(safe-area-inset-left));top:calc(10px + env(safe-area-inset-top));z-index:50;
  display:flex;align-items:center;gap:7px;padding:6px 10px 6px 7px;cursor:pointer;color:#fff;
  font:13px/1 'Silkscreen',ui-monospace,monospace;letter-spacing:.04em;text-shadow:1px 1px 0 #1a0f40;
  background:#3a2a8e;border:2px solid;border-color:#9a8cff #1a0f40 #1a0f40 #9a8cff;box-shadow:2px 2px 0 rgba(26,15,64,.45)}
#clubBack kbd{font:11px/1 'Silkscreen',ui-monospace,monospace;color:#1a0f40;text-shadow:none;
  background:linear-gradient(#e8e0ff 40%,#c8bcff 40%);padding:3px 5px;border:2px solid;border-color:#fff #6a58d8 #6a58d8 #fff}
#clubBack:active kbd{border-color:#6a58d8 #fff #fff #6a58d8}`;

async function fetchPiece(get) {
  for (let i = 0; ; i++) {
    try { return await get(); } catch (e) {
      if (i >= 3) {
        document.body.insertAdjacentHTML('afterbegin', `<p id="clubOops" style="position:fixed;inset:40% 16px auto;margin:0;text-align:center;` +
          `font:16px/1.4 system-ui,sans-serif;color:#3a2a8e">Part of the clubhouse didn't load. Check the internet connection and reload the page.</p>`);
        throw e;
      }
      await new Promise(ok => setTimeout(ok, 1000 * (i + 1)));
    }
  }
}

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
  document.title = document.title.replace("Sadie's Clubhouse", card.name);
  document.getElementById('clubBack').addEventListener('click', leave);
  await fetchPiece(card.start);
  // listening after the activity has, so its own Escape (closing a panel) comes first
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !e.defaultPrevented) leave(); });
  document.getElementById('clubBack').dataset.ready = '';   // (it's all here: the checks wait for this)
}

const wanted = cards.find(c => c.id === location.hash.slice(1) && c.start);   // (a game that lives in its room has no page of its own)
if (wanted) enter(wanted);
else {
  // The buildings outside (on the lane, or in the grounds) are built before the mansion opens, as you
  // can see them from the gate: their code is asked for now, alongside the mansion's, not one after
  // another once it's here. (If one doesn't come, the mansion asks again when it builds it.)
  for (const c of cards) if (c.room && (Number.isInteger(c.lot) || Number.isInteger(c.grounds))) c.room().catch(() => {});
  fetchPiece(() => import('./clubhouse/mansion.js')).then(mansion => mansion.open(cards, enter));
}
