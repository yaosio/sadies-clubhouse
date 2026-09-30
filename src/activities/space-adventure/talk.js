// What Sadie says comes up in a box at the bottom of the screen, typed out a letter at a time (with no
// sound: a blip per letter would never stop), with her face in the corner. And the black the screen
// goes when she flies at you. Both sit just over the 3D view, under the mansion's pause menu.
import { portrait } from './pictures.js';

const CSS = `
#saTalk{position:absolute;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(620px,calc(100% - 20px));
  display:flex;gap:10px;align-items:flex-start;padding:8px 12px 10px 8px;background:#1c1238ec;border:3px solid;border-color:#c8bcff #0a0628 #0a0628 #c8bcff;
  box-shadow:4px 4px 0 #0a0628a0;pointer-events:none;color:#fff4e4;font:19px/1.25 "Patrick Hand","Comic Sans MS","Trebuchet MS",sans-serif;min-height:78px}
#saTalk canvas{width:56px;height:56px;flex:none;image-rendering:pixelated;border:2px solid #ffd23a}
#saTalk b{display:block;font:11px/1.4 "Silkscreen","Courier New",monospace;color:#ffd23a;letter-spacing:.06em;margin-bottom:2px}
#saTalk p{margin:0}
#saTalk i{font-style:normal;visibility:hidden}
#saBlack{position:absolute;inset:0;background:#000;pointer-events:none;opacity:0}
#saTalk[hidden],#saBlack[hidden]{display:none}
@media (max-width:520px){#saTalk{font-size:17px}}
`;
const CPS = 40;   // letters a second, as it types

export function makeTalk(sadieImage) {
  const root = document.getElementById('mansion') || document.body;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const box = document.createElement('div'); box.id = 'saTalk'; box.hidden = true;
  box.innerHTML = '<canvas width="26" height="26"></canvas><div><b>SADIE</b><p><span></span><i></i></p></div>';
  portrait(box.querySelector('canvas'), sadieImage);
  const black = document.createElement('div'); black.id = 'saBlack'; black.hidden = true;
  // (just over the 3D view, so the pause menu and the buttons still come on top)
  const view = root.querySelector('#view');
  if (view) { view.after(black); view.after(box); } else root.append(box, black);
  const shown = box.querySelector('span'), rest = box.querySelector('i');
  let text = null, n = -1;
  return {
    // show `line` ({ text, since }: how long it's been up), or nothing
    say(line) {
      if (!line) { if (text !== null) { box.hidden = true; text = null; } return; }
      if (line.text !== text) { text = line.text; n = -1; box.hidden = false; }
      const k = Math.min(text.length, Math.floor(line.since * CPS));
      // (the rest of the line is there but hidden, so the box is its full size from the start)
      if (k !== n) { n = k; shown.textContent = text.slice(0, k); rest.textContent = text.slice(k); }
    },
    showing: () => (box.hidden ? null : text),
    // how black the screen is (0 to 1)
    black(k) { black.hidden = k <= 0; black.style.opacity = k; },
  };
}
