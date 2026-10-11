// Toots at her upstairs window: what she does, worked out every frame from where you are.
// Plain numbers in, a pose name and a few numbers out, so the same thing runs in the game and here.
//
// - Far off (over 22 m), she watches the town: looks slowly about, soft ears, the odd blink.
// - Closer, she's spotted you: ears up, her eyes and head follow you, now and then a head tilt. She
//   doesn't roo from up here (the owner's call: not over and over across the square); she roos when
//   her front door opens (house.js).
// - At the bottom of her path (under 7 m) she's thrilled: her paw goes up and down on the sill, then
//   she drops out of sight (off downstairs to meet you at the door), and pops back up once you've
//   wandered off again.
// - There's only one Toots: while you're in her house she's in there with you, not at the window, and
//   she stays downstairs by the door until you've wandered off again.
// The distances are Claude's numbers, not the owner's: change them freely.

export const SPOT = 22, THRILL = 7;

export function makeWatcher(rand = Math.random) {
  let state = 'watch', since = 0, tiltUntil = -1, tilt = 0, nextTilt = 4;
  let blinkAt = 2, gone = 0, glance = 0, glanceAt = 0;
  return function update(t, dt, you) {
    // you: { x, z } where you are in the house's own terms (x across, z out from the front door; the
    // window is at x 0, a little way up), or { home: true } when you're inside her house; `door`:
    // her front door's open (she's heard it: she's gone from the window, on her way down)
    const d = you.home ? 0 : Math.hypot(you.x, you.z), look = Math.max(-1, Math.min(1, you.x / Math.max(2, you.z) * 2.2));
    const pose = { name: 'softC', sink: gone, bob: Math.sin(t * 2.1) > 0.92 ? 1 : 0 };
    const was = state;
    if (you.home || you.door) { state = 'away'; gone = 1; }   // (in her house, or her door's open: she's not up here)
    else if (state === 'away') { if (d > 10) state = 'back'; }
    else if (state === 'back') { gone = Math.max(0, gone - dt * 1.4); if (!gone) state = d < SPOT ? 'seen' : 'watch'; }
    else if (d < THRILL && you.z > 0) state = 'thrilled';
    else if (d < SPOT) state = 'seen';
    else state = 'watch';
    if (state !== was) since = t;
    const L = look < -0.33 ? 'L' : look > 0.33 ? 'R' : 'C';

    if (state === 'watch') {
      if (t > glanceAt) { glance = [-1, 0, 1, 0][Math.floor(rand() * 4)]; glanceAt = t + 2.5 + rand() * 4; }
      pose.name = 'soft' + (glance < 0 ? 'L' : glance > 0 ? 'R' : 'C');
    } else if (state === 'seen') {
      pose.name = 'perk' + L;
      if (t > nextTilt) { tilt = rand() < 0.5 ? -1 : 1; tiltUntil = t + 1.1; nextTilt = t + 5 + rand() * 6; }
      if (t < tiltUntil) pose.name = tilt < 0 ? 'tiltL' : 'tiltR';
    } else if (state === 'thrilled') {
      pose.name = Math.floor((t - since) * 3.2) % 2 ? 'bounce' : 'perkC';
      if (t - since > 1.4) { gone = Math.min(1, gone + dt * 2.2); pose.name = 'perkC'; if (gone === 1) state = 'away'; }
    } else if (state === 'back') pose.name = 'perkC';
    // a blink every few seconds (not while she's away)
    if (t > blinkAt) { if (pose.name.startsWith('perk') || pose.name.startsWith('soft')) pose.name = pose.name.startsWith('perk') ? 'blink' : 'blinkSoft'; if (t > blinkAt + 0.14) blinkAt = t + 2.5 + rand() * 3.5; }
    pose.sink = gone;
    pose.state = state;
    return pose;
  };
}
