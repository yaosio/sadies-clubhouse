// The two screens everything is tried on, written once: a phone (touch, 390 x 844) and a desktop
// (keys and mouse, 1280 x 800). The checks play both side by side (tests/shared/browser.mjs) and the
// picture-taking tools use them (tools/browser.mjs). A change here changes every check.
export const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
export const DESKTOP = { viewport: { width: 1280, height: 800 } };
