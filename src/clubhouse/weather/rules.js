// The weather's rules, with no screen (the tests run them): the kinds of weather there are, how each
// looks out of doors (how bright the sun is, the clouds, what falls), what Sadie on the gatepost
// says about it, and what's saved. The weather is the whole world's, over every place out of doors;
// whoever makes it (Clyde's Weather Machine) just says which (the kit's `weather.set(kind)`).

export const KEY = 'mansion.weather';   // (its save: the clubhouse's, so a backup has it and EVERYTHING starts it over)
export const KINDS = ['rain', 'snow', 'sun', 'cats', 'tornado'];

// how each looks: `sun`, how bright the sunlight is (clear is 0.5; a place out of doors with a light
// of its own is brightened or dimmed in the same proportion); `clouds`, the colour of the cloud
// cover (none for no cover); `falls`, what comes down
export const LOOK = {
  clear: { sun: 0.5, clouds: null, falls: null },
  rain: { sun: 0.12, clouds: 0x5e5c80, falls: 'rain' },
  snow: { sun: 0.3, clouds: 0xc9c6e0, falls: 'snow' },
  sun: { sun: 0.95, clouds: null, falls: null },
  cats: { sun: 0.45, clouds: 0xffb8e0, falls: 'cats' },
  tornado: { sun: 0.2, clouds: 0x56705f, falls: 'tornado' },   // (a sickly green sky, and a funnel far off with Sadie in it: twister.js)
};

// what Sadie, on the gatepost, says about it (and what she wears: in sky.js)
export const SADIE = { clear: 'MRRP.', rain: 'MEW!', snow: 'MRRP?', sun: '...', cats: 'MINE.', tornado: 'THAT IS ME.' };

// a weather from a save, or asked for (anything odd is just clear)
export const loaded = v => (KINDS.includes(v) ? v : 'clear');
