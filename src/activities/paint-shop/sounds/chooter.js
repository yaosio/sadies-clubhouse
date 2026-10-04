// Chooter's woo: the one sound he makes, cut from the owner's own recording of a dog wooing
// (woo-data.js, made by tools/paint-shop/make-woo.mjs). About a second, one long soft "wooo".
import { decode } from './adpcm.js';
import data from './woo-data.js';

export const woo = () => decode(Uint8Array.from(atob(data), c => c.charCodeAt(0)));
// (the test button in the shop uses a second name for the same woo, so it can be pressed again
// straight away: the sound system never plays one voice sound twice within 10 s)
export const woo2 = woo;
