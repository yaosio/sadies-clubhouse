// A plain-words note over the page when the game can't carry on (no 3D, a part that won't load,
// the picture stuck), so nobody is left looking at a blank screen. The first note stays: a later one
// (say, the page also failing to start) never replaces the reason.
//   oops(text)   puts the note up (the page keeps its look: a purple card, big readable letters)
//   unoops()     takes it down again (the picture came back by itself)
export const NO_3D = "Sadie's Clubhouse needs 3D graphics, and this browser can't start them. Try another browser, turn on hardware acceleration in its settings, or reload the page.";
export const STUCK = "The picture stopped working. Reload the page to carry on: anything you saved is still there.";

export function oops(text) {
  try {
    if (document.getElementById('clubOops')) return;
    document.body.insertAdjacentHTML('beforeend', `<p id="clubOops" style="position:fixed;left:16px;right:16px;top:50%;transform:translateY(-50%);margin:0;padding:18px;z-index:99;` +
      `text-align:center;font:16px/1.5 system-ui,sans-serif;color:#1a0f40;background:#fff4e4;border:3px solid #3a2a8e;box-shadow:4px 4px 0 rgba(26,15,64,.45)"></p>`);
    document.getElementById('clubOops').textContent = text;
  } catch {}
}
export function unoops() { try { document.getElementById('clubOops')?.remove(); } catch {} }
