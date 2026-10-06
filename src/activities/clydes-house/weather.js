// Clyde's Weather Machine's rules, with no screen (the tests run them): the five kinds of weather its
// levers make, and what the machine's little screen says. The weather itself is the world's (it
// shows over everywhere out of doors, and saves it): the machine just says which, through its kit's
// `weather`.
//
// One weather at a time: pulling a lever brings its weather (and puts every other lever back up);
// pulling it again clears the sky.

// (where the weather was saved before it was the world's: brought in once, then let go)
export const OLD = 'weather';
export const KINDS = ['rain', 'snow', 'sun', 'cats', 'tornado'];
export const NAMES = { rain: 'RAIN', snow: 'SNOW', sun: '2ND SUN', cats: 'CATS', tornado: 'TORNADO' };

// the forecast on the machine's screen: two lines of at most 18 letters
export const FORECAST = {
  clear: ['TODAY: NICE', '(I CHECKED 40X)'],
  rain: ['TODAY: RAIN', 'FOR THE PLANTS'],
  snow: ['TODAY: SNOW', 'EACH FLAKE UNIQUE'],
  sun: ['TODAY: 2 SUNS', 'TWICE AS NICE?'],
  cats: ['TODAY: CATS', 'THEY LAND ON FEET'],
  tornado: ['TODAY: TORNADO', 'SADIE HAS A TUNA'],
};
// the weather after pulling a lever: its own, or clear if it was already on
export const pull = (now, lever) => (now === lever ? 'clear' : lever);
// the weather an old save says (anything odd: none to bring in)
export const loaded = v => (KINDS.includes(v) || v === 'clear' ? v : null);
