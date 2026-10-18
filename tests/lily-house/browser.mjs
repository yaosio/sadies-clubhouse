// Lily's House in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs (never on
// its own) with the built page. It's built into the clubhouse (outside the gate), so these run whenever
// the clubhouse changes too.
//
// It walks up to her house on the top ledge of Dog City's hydrant and in through the door, looks at her
// friends' pictures, then goes through to the game room and steps up to Lily's Big Climb: the view eases
// back to fit the wall, the game starts, and on a phone the picture buttons are up (STEP BACK moved to the
// top left, away from them), on a desktop they're not. A press moves her. Then a win (put there by
// the check): the fanfare plays and you step back on your own. Screenshots in dist/check/lily-house/.
// Any error on the page is a failure.
import { bothDevices } from '../shared/browser.mjs';

const ROOM = 'room:lily-house';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, opts, p, errors, shot, M, up, walk, use, modeIs, until }) => {
    const S = () => p.evaluate(() => window.__lily.state());

    await p.goto(page);
    if (!await up()) { check(`${device}: the clubhouse opens`, false, errors[0]); return; }
    await p.click('#ok');

    // up on the hydrant, to her door, and in
    check(`${device}: Lily's house is on the hydrant, with its door`, await M('faceDoor', 'outside', 'lily-house', 3));
    await p.waitForTimeout(700);
    await shot('1-house');
    await walk(300); await p.waitForTimeout(500);
    check(`${device}: ...which opens onto her house`, await M('looking') === ROOM);
    await walk(1400);
    check(`${device}: walking through it, you're inside`, (await M('where')).place === ROOM);
    await p.waitForTimeout(400);
    await shot('2-inside');
    await M('put', ROOM, 'pictures'); await p.waitForTimeout(400);
    await shot('3-pictures');

    // the game room: step up to the wall
    await M('put', ROOM, 'play'); await p.waitForTimeout(400);
    check(`${device}: in the game room, the wall offers to play`, /BIG CLIMB/.test(await M('target') || ''), await M('target'));
    await use();
    const playing = await modeIs('arcade');
    check(`${device}: ...stepping up starts the game`, playing && (await S()).playing, JSON.stringify((await S()).game));
    const pad = await p.evaluate(() => ({ pad: !document.querySelector('#clubhouse #pad').hidden, top: document.querySelector('#clubhouse #use').classList.contains('top') }));
    check(`${device}: ${opts.hasTouch ? 'the picture buttons are up, and STEP BACK moved to the top left' : 'no picture buttons on a computer'}`, opts.hasTouch ? pad.pad && pad.top : !pad.pad && !pad.top, JSON.stringify(pad));
    await until(() => window.__lily.state().game.state === 'play', null, 6000);
    await shot('4-playing');
    // a press moves her (the right button on a phone, the right arrow on a computer)
    const x0 = await p.evaluate(() => window.__lily.state().game);
    if (opts.hasTouch) { await p.dispatchEvent('#clubhouse #pad [data-b="right"]', 'pointerdown', { pointerId: 21 }); await p.waitForTimeout(500); await p.dispatchEvent('#clubhouse #pad [data-b="right"]', 'pointerup', { pointerId: 21 }); }
    else { await p.keyboard.down('ArrowRight'); await p.waitForTimeout(500); await p.keyboard.up('ArrowRight'); }
    const moved = await p.evaluate(() => window.__lily.state());
    check(`${device}: ...and a press moves her`, moved.game.state !== 'play' || moved.game.x > x0.x + 3, JSON.stringify(moved.game));

    // a win: the fanfare, then you step back on your own
    await p.evaluate(() => window.__lily.win());
    check(`${device}: reaching her chicken wins, with the fanfare`, await until(() => window.__lily.state().heard.includes('fanfare'), null, 4000), JSON.stringify((await S()).heard));
    await shot('5-won');
    check(`${device}: ...and once it's over you step back`, await until(() => window.__clubhouse.mode() === 'play', null, 12000), await M('mode'));
    const after = await p.evaluate(() => !document.querySelector('#clubhouse #pad').hidden);
    check(`${device}: ...with the picture buttons put away`, !after);
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
  });
}
