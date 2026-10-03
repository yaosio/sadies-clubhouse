// The pause menu's CREDITS: what the game uses that somebody else made, and their licences. Add
// to it when something new comes in (a check fails if a font in src/shared/fonts/fonts.css isn't
// named here). No sound or picture files from anyone else are used: it's all drawn and made in code.
const OFL = 'SIL Open Font License 1.1 (openfontlicense.org)';
export const CREDITS = [
  { name: 'three.js', by: 'Copyright © 2010-2026 three.js authors', licence: 'MIT License (threejs.org)' },
  { name: 'Silkscreen', by: 'Copyright 2001 The Silkscreen Project Authors', licence: OFL },
  { name: 'Patrick Hand', by: 'Copyright © 2012 Patrick Wagesreiter', licence: OFL },
  { name: 'VT323', by: 'Copyright 2011 The VT323 Project Authors', licence: OFL },
  { name: 'Pacifico', by: 'Copyright 2018 The Pacifico Project Authors', licence: OFL },
  { name: 'Bungee', by: 'Copyright 2023 The Bungee Project Authors', licence: OFL },
  { name: 'UnifrakturMaguntia', by: "Copyright © 2010 j. 'mach' wust, © 2009 Peter Wiegel", licence: OFL },
  { name: 'Courier Prime', by: 'Copyright 2015 The Courier Prime Project Authors', licence: OFL },
  { name: 'Old Standard TT', by: 'Copyright 2011 The Old Standard Project Authors', licence: OFL },
  { name: 'Comic Neue', by: 'Copyright 2014 The Comic Neue Project Authors', licence: OFL },
];

export const MIT = 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.';

// Fills a box with them, one paragraph each (text only, nothing is read as markup).
export function showCredits(box) {
  box.replaceChildren(...CREDITS.map(c => {
    const p = document.createElement('p'), b = document.createElement('b');
    b.textContent = c.name;
    p.append(b, ` ${c.by}. ${c.licence}.`);
    return p;
  }).concat((() => { const p = document.createElement('p'); p.textContent = `three.js, in full: ${MIT}`; return p; })()));
}
