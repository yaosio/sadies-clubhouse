// The clubhouse: the shell every activity runs in. It knows each activity only by its card
// (src/activities/<name>/card.js: id, name, page, styles, start), and runs one at a time.
//
// The build finds the activities by their folders, so adding one never changes this file. There's
// no menu yet: the page goes into the activity named after the # in its address (#dropper-world),
// or the first one. Leaving an activity will mean reloading the page into the clubhouse, so an
// activity never has to tidy up after itself.
import cards from 'activities';

function enter(card) {
  const style = document.createElement('style');
  style.textContent = card.styles;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML('afterbegin', card.page);
  return card.start();
}

const wanted = location.hash.slice(1);
enter(cards.find(c => c.id === wanted) || cards[0]);
