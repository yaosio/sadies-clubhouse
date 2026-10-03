// Space Adventure: the room behind the sixth door. The first time, the door opens straight onto the
// cockpit of Sadie's spaceship, with stars and a small planet out of the windscreen. Walk in and you're
// strapped into the pilot's seat (you can't get up or look away): Sadie hops up onto the dashboard and
// off you go, slowly, to the planet, while she talks the whole way about space, and being small, and
// alone, and a sad synthwave song builds. The planet grows until it fills the windscreen, the air
// glows, you go into the clouds, and (while there's nothing but white out there) space is swapped for
// the land, which you come down through the clouds onto: a beach by the sea, mountains behind. The song
// peaks as you touch down. Then Sadie is disappointed with it all, and with you, comes closer, and
// closer, and flies at your face. Black. When it clears you're standing in the doorway of her space
// room, where she sits by a radio playing the happy version of the song, saying I LOVE SPACE!, and a
// big red button (FUN SPACE ADVENTURE) takes you on the trip again.
//
// It's one place to the mansion, one scene with everything in it (the cockpit, space, the land, the
// space room), only the parts you should see shown. `watch` (with `at`) is how you're strapped in: the
// mansion puts you in the seat and keeps your eyes on the way ahead. The trip's timing and Sadie's
// words are in trip.js; the pieces in cockpit.js, space.js, land.js and hangout.js; her words on
// screen in talk.js; the music in music/.
import { Scene, Mesh, PlaneGeometry } from 'three';
import { RW, RD, RH, DASH, SEAT, EYE, LOCK_Z, T, lineAt, AFTER, planetSize, PLANET_FROM, entry, shipAt, sadieAt, SAVE, readSave, smooth } from './trip.js';
import { buildCockpit } from './cockpit.js';
import { buildSpace } from './space.js';
import { buildLand } from './land.js';
import { buildHangout, RADIO, BUTTON, CUSHION } from './hangout.js';
import { cockpitPics, spacePics, landPics, roomPics } from './pictures.js';
import { makeTalk } from './talk.js';
import { makeMusic } from './music/player.js';
import { tripSong, radioSong } from './music/song.js';
import { soundsFor, nearness } from '../../shared/sound.js';

export async function buildRoom(m) {
  const { T: TX, C, psx, keep, tex, words, doorway, card, leaf } = m;
  const scene = new Scene();
  // (a breath between the big parts: the mansion builds it a bit at a time, so nothing stutters)
  const breathe = m.breathe || (async () => {});
  const cockpit = buildCockpit(m, cockpitPics(tex, C, words)); await breathe();
  const space = buildSpace(m, spacePics(tex, C)); await breathe();
  const land = buildLand(m, landPics(tex, C)); await breathe();
  const hangout = buildHangout(m, roomPics(tex, C, words, TX.sadie.image), TX); await breathe();
  scene.add(space.group, cockpit.group, land.group, land.clouds, hangout.group);
  const door = doorway(scene, { pos: [0, 0, -RD], yaw: 0, w: 1.5, h: 2.45, leaves: [leaf], hinge: 1 });
  // Sadie in the cockpit (out of sight behind the dashboard until she hops up)
  const sadie = new Mesh(keep(new PlaneGeometry(0.62, 0.5, 1, 1).translate(0, 0.25, 0)), psx(TX.sadie, { unlit: 0.45 }));
  cockpit.group.add(sadie); sadie.visible = false;

  const talk = makeTalk(TX.sadie.image, m.overlay);
  const music = makeMusic(soundsFor('room:' + card.id)), tripNotes = tripSong(T.land - T.go), radio = radioSong();
  const song = music.track(tripNotes), radioTrack = music.track(radio.notes, { loop: radio.length });

  const lights = {
    cockpit: { sun: 0.3, bulb: 0.7, lamp: [0, RH - 0.3, 0] },
    land: { sun: 0.75, bulb: 0.3, lamp: [0, RH - 0.3, 0] },
    hangout: { sun: 0.25, bulb: 0.85, lamp: [0, 3.0, 1.0] },
  };
  const P = m.walker;
  const cockpitFloor = (x, z) => {
    if (z < -RD + P - 0.01 || z > DASH.z0 - P) return null;
    return Math.abs(x) < RW - P - (z > 0.4 - P ? 0.5 : 0) ? 0 : null;
  };
  let saved = readSave(m.saves.get(SAVE, null)), stage = null, trip = null, warp = 1, afterAt = null, radioOn = true, wasPaused = false;

  // what's showing: the cockpit (with space out of the windows) or Sadie's space room
  function show(what) {
    stage = what;
    const inCockpit = what === 'cockpit';
    cockpit.group.visible = inCockpit; hangout.group.visible = !inCockpit;
    land.group.visible = land.clouds.visible = false; space.group.visible = true; cockpit.weather.visible = false;
    space.group.rotation.set(0, 0, 0);
    space.planetAt(inCockpit ? PLANET_FROM : 0.03, 0);
    for (const f of space.flares) f.visible = inCockpit;   // (a lens flare needs a sun: none out of the space room's window)
    scene.background = space.background;
    place.faces = inCockpit ? [sadie] : hangout.faces;
    place.floor = inCockpit ? cockpitFloor : hangout.floor;
    place.uses = inCockpit ? [] : uses;
    place.light = inCockpit ? lights.cockpit : lights.hangout;
    place.far = undefined;
    sadie.visible = false;
  }

  // ---------- the trip ----------
  // `fromButton`: pressed in the space room (the screen goes black while you're put in the seat);
  // otherwise you walked in, and you're eased into the seat
  const AHEAD = { x: SEAT.x, y: EYE, z: SEAT.z + 60 };
  const SEAT_AT = { x: SEAT.x, z: SEAT.z, y: SEAT.y };
  function startTrip(fromButton) {
    trip = { t: fromButton ? -1 : 0, fromButton, swapped: false, blacked: false, playing: false };
    radioTrack.stop(0.4); afterAt = null;
    place.watch = fromButton ? { x: BUTTON.x, y: BUTTON.y, z: BUTTON.z } : { ...AHEAD, at: SEAT_AT };
    if (!fromButton) show('cockpit');
    music.wake();
  }
  function tripAt(t) {
    // coming from the button: black, then the cockpit
    if (t < 0) {
      if (t >= -0.5 && stage !== 'cockpit') { show('cockpit'); place.watch = { ...AHEAD, at: { ...SEAT_AT, snap: true } }; }
      talk.black(t < -0.5 ? smooth(-1, -0.6, t) : 1 - smooth(-0.4, 0, t));
      return;
    }
    if (trip.fromButton && !trip.seated) { trip.seated = true; place.watch = { ...AHEAD, at: SEAT_AT }; }
    if (trip.blacked) return blackOut(t);   // (the space room's showing now: just the black to clear)
    // Sadie
    const s = sadieAt(t);
    sadie.visible = t >= T.hop && t < T.black;
    sadie.position.set(s.x, s.y, s.z); sadie.scale.setScalar(s.size);
    sadie.material.uniforms.map.value = t > T.hop + 1 && t < T.leap && (t % 4.7) < 0.14 ? TX.nap : TX.sadie;
    // the planet, the air glowing, the clouds, the shaking
    space.planetAt(planetSize(t), 0.3 + t * 0.012);
    const e = entry(t), jig = () => (Math.random() - 0.5) * e.shake * 0.012;
    cockpit.weather.visible = e.glow > 0.01 || e.white > 0.01;
    if (cockpit.weather.visible) {
      const u = cockpit.weather.material.uniforms, hot = e.glow / Math.max(0.001, e.glow + e.white);
      u.tint.value.setRGB(1, 1 - 0.55 * hot, 1 - 0.85 * hot);
      u.uFade.value = 1 - Math.max(e.glow * 0.4, e.white);
      u.map.value.offset.set(Math.sin(t * 3) * 0.1, t * 2.2);
    }
    space.group.rotation.set(jig(), jig(), 0);
    // deep in the clouds: space goes, the land comes
    if (t >= T.swap && !trip.swapped) {
      trip.swapped = true;
      space.group.visible = false; land.group.visible = land.clouds.visible = true;
      scene.background = land.background; place.far = 3500; place.light = lights.land;
    }
    if (trip.swapped && t < T.black) { const sh = shipAt(t); sh.pitch += jig(); land.place(sh); land.update(t); }
    // her words, and the music
    talk.say(lineAt(t));
    if (t >= T.go && !trip.playing && !wasPaused) { trip.playing = true; song.play(t - T.go); }
    blackOut(t);
  }
  // the black: she's flown at you; everything goes black, and it clears in her space room
  function blackOut(t) {
    talk.black(t < T.back ? smooth(T.leap + 0.15, T.black, t) : 1 - smooth(T.back, T.end, t));
    if (t >= T.black && !trip.blacked) {
      trip.blacked = true;
      saved.done = true; m.saves.set(SAVE, saved);
      song.stop(0.2); talk.say(null);
      show('hangout');
      place.watch = { x: CUSHION.x, y: 0.9, z: CUSHION.z, at: { x: 0, z: -RD + 1.0, y: 0, snap: true } };
    }
    if (t >= T.end) { trip = null; place.watch = null; afterAt = 0; }
  }

  // ---------- Sadie's space room: the button, and the radio ----------
  const uses = [
    { pos: BUTTON.clone(), reach: 2.4, label: 'PRESS THE BIG RED BUTTON', button: 'PRESS', act: () => startTrip(true) },
    { pos: RADIO.clone(), reach: 2.4, label: 'TURN THE RADIO OFF', button: 'RADIO', act: () => { radioOn = !radioOn; uses[1].label = radioOn ? 'TURN THE RADIO OFF' : 'TURN THE RADIO ON'; } },
  ];

  const place = {
    name: 'room:' + card.id, card, scene, doors: { door }, faces: [], uses: [], light: lights.cockpit,
    spots: {
      seat: { x: SEAT.x, z: SEAT.z, yaw: Math.PI, y: SEAT.y },
      door: { x: 0, z: -RD + 1.0, yaw: Math.PI, pitch: 0, y: 0 },
      button: { x: BUTTON.x + 0.4, z: BUTTON.z - 1.4, yaw: Math.PI + 0.3, pitch: -0.2, y: 0 },
    },
    floor: cockpitFloor,
    watch: null,
    // the main theme stays out from the moment you step in: the ship (its song starts as the engines
    // do, and is meant to start in quiet), the whole trip, and the space room while its radio's on (it
    // plays as you arrive). With the radio off, the theme comes back.
    hush: () => stage === 'cockpit' || !!trip || radioOn,
    // (the mansion puts it away when you're far off, and builds it again from its save as you come back)
    putAway() { music.close(); },   // (its talk box goes with its layer of the page)
    update(t, dt = 0) {
      const paused = !!m.paused?.();
      // paused: the song stops where it is (and starts again from there), the radio goes quiet
      if (paused !== wasPaused) { wasPaused = paused; if (paused && trip?.playing) { song.stop(0.15); trip.playing = false; } }
      const me = m.ears(), here = me.place === place;
      cockpit.update(t);
      // walked into the cockpit: strapped in, and off we go
      if (stage === 'cockpit' && !trip && here && me.z > LOCK_Z) startTrip(false);
      if (trip) {
        if (!paused) trip.t += dt * warp;
        tripAt(trip.t);
        if (trip) { music.warm(tripNotes, 2); song.tick(); }
      }
      // in the space room: Sadie says she loves space, and the radio plays (as loud as you're near it)
      if (stage === 'hangout') {
        if (afterAt !== null && !paused) {
          afterAt += dt;
          talk.say(afterAt < 3.5 ? { text: AFTER, since: afterAt } : null);
        }
        const want = !trip && radioOn && here && !paused;
        if (want && !radioTrack.playing) radioTrack.play(0);
        if (!want && radioTrack.playing) radioTrack.stop(0.5);
        if (radioTrack.playing) { radioTrack.setLevel(0.25 + 0.75 * nearness(Math.hypot(me.x - RADIO.x, me.z - RADIO.z), 1.5, 12)); radioTrack.tick(); }
        hangout.update(t, radioTrack.playing, dt);
      }
    },
  };
  show(saved.done ? 'hangout' : 'cockpit');

  // for the checks (tests/space-adventure/browser.mjs)
  m.checks('__space', {
    state: () => ({ stage, t: trip ? trip.t : null, line: talk.showing(), swapped: !!trip?.swapped, done: saved.done, watching: !!place.watch,
      radio: radioTrack.playing, radioOn, played: song.played, radioPlayed: radioTrack.played, sadie: sadie.visible ? sadie.position.toArray() : null,
      land: land.group.visible, space: space.group.visible }),
    warp(k) { warp = k; },
    jump(t) { if (trip) trip.t = t; },
  });
  return place;
}
