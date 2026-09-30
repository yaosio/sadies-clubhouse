// The mock-up page around the 3D scene: the view buttons, computer/phone, the little on-screen
// bits (all the game would show), and what to look for in each view.
import { start } from './mockup.js';

const $ = s => document.querySelector(s);
const SAYS = {
  room: `Walking in. It's the next door on the landing, and the room itself is the game, like Brickbuster: no computer. Every instrument is played right where it stands. The toy piano against the back wall (its maker's name is TINKLE-TONE JR., and it's got claw marks), the tape deck on its little table, the drum kit on its rug (there's a blanket stuffed in the bass drum, and the snare's covered in fur: it's her bed), the xylophone with fish for bars and pom-pom mallets, the KEYCAT 3000 synth, and the theremin and wind chimes by the window. On the wall: the band poster (SADIE & THE PAWS, LIVE! 1 NITE ONLY 1996) and the big VOLUME dial. The sign on the door's handle says SADIE WELCOME; turn it round and it says SHH, SADIE NAPPING, and she stays off the instruments. Sadie's on her cushion by the piano.`,
  piano: `Stepping up to the piano (E, or PLAY on a phone): the view eases in until the keys fill the screen. Each key has a sticker with the computer key that plays it (A to ; for the white keys, W E T Y U O P for the black ones), and on a phone you just tap them. The lit key is the one being played. The pink ? key is the out-of-tune one (Sadie's favourite), and one key has a bite out of it. Holding a key plays it once, never over and over. Esc steps you back.`,
  sadie: `Every so often (not on a timer you can hear coming), and never while you're playing that instrument, Sadie walks across one. On the piano she makes 4 to 6 slow, clumsy notes, sometimes two keys at once, a different walk every time. Then she sits on the end and one low note rings out, or she lies down on the keys (one soft chord) and naps there until she's ready to move. Then she leaves it alone for a long while. The tape deck keeps her last walk.`,
  tape: `The TAPE-O-MATIC. Press REC, play something, then PLAY to hear it back once. It only goes round again if you press LOOP, and STOP is right there. The tape in it, SADIE LIVE!, is her last walk across the piano. The volume dial on the wall remembers where you leave it.`,
};

const scene = await start($('#view'));
let view = 'room', device = 'computer';
function show() {
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === view));
  document.querySelectorAll('[data-device]').forEach(b => b.setAttribute('aria-pressed', b.dataset.device === device));
  const stage = $('#stage'); stage.dataset.device = device; stage.dataset.view = view;
  $('#says').textContent = SAYS[view];
  scene.show(view);
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { view = b.dataset.view; show(); }));
document.querySelectorAll('[data-device]').forEach(b => b.addEventListener('click', () => { device = b.dataset.device; show(); scene.resize(); }));
addEventListener('resize', () => scene.resize());
const first = location.hash.slice(1).split('-');
if (SAYS[first[0]]) view = first[0];
if (first[1] === 'phone') device = 'phone';
show();
window.__roomReady = true;
