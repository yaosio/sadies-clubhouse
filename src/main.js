// The clubhouse: the shell every activity runs in. It knows each activity only by its card
// (src/activities/<name>/card.js: id, name, page, styles, start, and for the menu its box and blurb),
// and runs one at a time.
//
// The build finds the activities by their folders, so adding one never changes this file. The page
// opens on the clubhouse menu (src/clubhouse/), a 3D room with a box per activity; PLAY! takes the
// menu out and puts the activity in. An address naming an activity after the # (#dropper-world)
// goes straight into it. Leaving an activity will mean reloading the page into the clubhouse, so an
// activity never has to tidy up after itself.
import cards from 'activities';

function enter(card) {
  const style = document.createElement('style');
  style.textContent = card.styles;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML('afterbegin', card.page);
  document.title = document.title.replace("Sadie's Play Place", card.name);
  return card.start();
}

const wanted = cards.find(c => c.id === location.hash.slice(1));
if (wanted) enter(wanted);
else import('./clubhouse/menu.js').then(menu => menu.open(cards, enter));
