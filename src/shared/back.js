// For an activity played at a computer (the clubhouse leaves the page): the clubhouse's ESC BACK key
// sits over the top left corner of the page (src/main.js), so the activity's top strip leaves room
// for it. roomForBack(strip, host) keeps `--back-w` on `host` as wide as the key reaches into the
// strip, measured again whenever the key changes size (its font coming in, a phone turning).
export function roomForBack(strip, host) {
  const back = document.getElementById('clubBack');
  if (!back || !strip) return;
  new ResizeObserver(() => host.style.setProperty('--back-w',
    Math.max(0, Math.ceil(back.getBoundingClientRect().right - strip.getBoundingClientRect().left)) + 'px')).observe(back);
}
