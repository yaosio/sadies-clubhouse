// Clyde's Weather Machine's rules, with no screen (the tests run them): the four kinds of weather its
// levers make, what each one looks like outside (how bright the sun is, the clouds, what falls), what
// the machine's little screen says, what Sadie says about it, and what's saved.
//
// One weather at a time: pulling a lever brings its weather (and puts every other lever back up);
// pulling it again clears the sky. It's saved, so the weather's still there after a reload.

export const NAME = 'weather', KEY = 'sadies-clubhouse.clydes-house.' + NAME;   // (its name in the room's saves, and its whole key)
export const KINDS = ['rain', 'snow', 'sun', 'cats'];
export const NAMES = { rain: 'RAIN', snow: 'SNOW', sun: '2ND SUN', cats: 'CATS' };

// how each looks: `sun`, how bright the sunlight is (clear is 0.5); `clouds`, the colour of the
// cloud cover (none for no cover); `falls`, what comes down
export const LOOK = {
  clear: { sun: 0.5, clouds: null, falls: null },
  rain: { sun: 0.12, clouds: 0x5e5c80, falls: 'rain' },
  snow: { sun: 0.3, clouds: 0xc9c6e0, falls: 'snow' },
  sun: { sun: 0.95, clouds: null, falls: null },
  cats: { sun: 0.45, clouds: 0xffb8e0, falls: 'cats' },
};

// the forecast on the machine's screen: two lines of at most 18 letters
export const FORECAST = {
  clear: ['TODAY: NICE', '(I CHECKED 40X)'],
  rain: ['TODAY: RAIN', 'FOR THE PLANTS'],
  snow: ['TODAY: SNOW', 'EACH FLAKE UNIQUE'],
  sun: ['TODAY: 2 SUNS', 'TWICE AS NICE?'],
  cats: ['TODAY: CATS', 'THEY LAND ON FEET'],
};
// what Sadie, on the gatepost, says about it (and what she wears: in weather-machine.js)
export const SADIE = { clear: 'MRRP.', rain: 'MEW!', snow: 'MRRP?', sun: '...', cats: 'MINE.' };

// the weather after pulling a lever: its own, or clear if it was already on
export const pull = (now, lever) => (now === lever ? 'clear' : lever);
// the weather a save says (anything odd is just clear)
export const loaded = v => (KINDS.includes(v) ? v : 'clear');
