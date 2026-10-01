// The stamps on the stamp rack, and the paw print Sadie leaves: little pictures, a letter per dot
// (top row first), each letter one of the paints (layer.js), '.' left alone. One dot is one pixel of
// the paint, so a stamp is about 65 cm across on a wall and half that on the things in the room.
const KEY = { R: 1, O: 2, Y: 3, L: 4, G: 5, S: 6, B: 7, U: 8, P: 9, H: 10, N: 11, K: 12, W: 13, E: 14 };

export const STAMPS = {
  fish: { name: 'FISH', key: KEY, pic: [
    '................',
    '.....OOOOO......',
    '...OOOOOOOOO...O',
    '..OOWKOOOOOOO.OO',
    '.OOOKKOOOYOOOOOO',
    'OOOOOOOOOYOOOOO.',
    '.OOOOOOOOYOOOOOO',
    '..OOOOOOOOOOO.OO',
    '...OOOOOOOOO...O',
    '.....OOOOO......',
    '................',
  ] },
  yarn: { name: 'YARN BALL', key: KEY, pic: [
    '....HHHHH.....',
    '..HHPPPPPHH...',
    '.HPPHPPPPPPH..',
    '.HPPPHPPPHPH..',
    'HPPPPPHPHPPPH.',
    'HPHPPPPHPPPPH.',
    'HPPHPPPHPPPHH.',
    'HPPPHPHPPPHPH.',
    '.HPPPHPPPHPH..',
    '.HPPPPHPHPPH..',
    '..HHPPPHPHH...',
    '....HHHHH.H...',
    '..........H...',
    '...........HHH',
  ] },
  clyde: { name: "CLYDE'S FACE", key: KEY, pic: [
    '.......O.......',
    '..O....O....O..',
    '...O..OOO..O...',
    '....OOOOOOO....',
    '...OOOOOOOOO...',
    '..OOWWOOOWWOO..',
    'OOOOWKOOOWKOOOO',
    '..OOWKOOOWKOO..',
    '..OOOOOOOOOOO..',
    '...OHOOOOOHO...',
    '....OOKKKOO....',
    '...O.OOOOO.O...',
    '..O....O....O..',
    '.......O.......',
  ] },
  paw: { name: 'PAW PRINT', key: KEY, pic: [
    '..KK....KK..',
    '.KKKK..KKKK.',
    '.KKKK..KKKK.',
    '..KK....KK..',
    'KK........KK',
    'KKK..KK..KKK',
    'KK.KKKKKK.KK',
    '...KKKKKK...',
    '..KKKKKKKK..',
    '..KKKKKKKK..',
    '...KKKKKK...',
  ] },
};

// Sadie's own paw print, the size of a cat's (well, nearly): painted in whatever she stepped in
export const SADIE_PAW = ['X.X', '.X.', 'XXX'];
