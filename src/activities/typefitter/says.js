// What Sadie and TypeFitter say. Sadie loves text and knows everything about how computers do it;
// all of it is wrong. Each change to the text gets its name and one of her made-up facts; whether
// she's gushing or unsure depends only on which way the meter just went. No DOM here.

// For each button: what she calls the result (from the text's style after the change), and her facts.
export const SAYS = {
  font: { name: s => s.fontName, facts: ['Every font lives in its own tiny folder. They fight if you put two together.', 'Fonts are made by pressing real letters into a warm floppy disk.', 'This font came on 11 floppy disks. The 11th one was just the letter Q.'] },
  bold: { name: s => s.bold ? 'BOLD' : 'NOT BOLD', facts: ['Bold letters are regular letters that ate a big breakfast.', 'To make bold, the computer types every letter twice, really fast.'] },
  italic: { name: s => s.italic ? 'ITALICS' : 'STRAIGHT LETTERS', facts: ['Italics are typed on a keyboard tilted exactly 12 degrees.', 'Italic letters lean because they are running late.'] },
  underline: { name: s => s.underline ? 'UNDERLINE' : 'NO UNDERLINE', facts: ['The underline is its own letter. It is the widest letter there is.', 'Underlines hold the words up so they do not fall off the screen.'] },
  outline: { name: s => s.outline ? 'OUTLINE' : 'FILLED IN', facts: ['Outline letters are hollowed out by hand with a tiny eraser.', 'The insides of outline letters get saved for later. Nothing is wasted.'] },
  shadow: { name: s => s.shadow ? 'SHADOW' : 'NO SHADOW', facts: ['Shadows need a light bulb inside your monitor. Do not touch it, it is HOT.', 'Every shadow is really another letter wearing a gray coat.'] },
  warp: { name: s => s.warpName, facts: ['Letters bend easier when the computer is warm. That is why it hums.', 'WarpArt was invented when somebody sat on a floppy disk. I was there.', 'The arch is load-bearing. Please do not remove it.'] },
  bigger: { name: () => 'BIGGER', facts: ['Big letters use more electricity. You can hear it.', 'Every size of every letter is stored separately. There are 4,000 of them.'] },
  smaller: { name: () => 'SMALLER', facts: ['Small letters are the same letters, just farther away.', 'Shrink a letter enough and it turns into a dot. Dots are letters too.'] },
  squeeze: { name: () => 'SPACING', facts: ['Moving letters apart is called kerning. Kern is my cousin.', 'Letters do not mind being squeezed. They are used to living on disks.'] },
  color: { name: s => s.colorName, facts: ['Color text needs a color monitor AND a color keyboard.', 'Red letters are 3% heavier. It is science.', 'Chrome letters are polished once a week by the computer.'] },
  symbols: { name: s => s.symbols ? 'SECRET SYMBOLS' : 'REGULAR LETTERS', facts: ['These are the secret letters. Only cats and printers can read them.', 'The computer hides these under the regular letters. Now you know.'] },
};
export const UP = ['I LOVE this!', 'YES. More of that.', 'Ooh!', 'Beautiful!', 'THIS is what computers are for.', 'Gorgeous.'];
export const DOWN = ['Hmm.', 'Not sure about this.', 'Ehh...', 'I liked it before.', 'Interesting choice.', 'Oh. Okay.'];
export const HELLO = "Hi! I'm Sadie. I <b>LOVE</b> text. Make this text fancy and I'll tell you how the computer does it.";
export const NEW_SENTENCE = ["New sentence! It's so plain. Make it BEAUTIFUL.", 'Ooh, fresh words. Do something to them.', "This one looks like it's never been bolded. Poor thing."];
export const FITTING = 'Here we go! <b>Fingers crossed.</b> Paws crossed.';
export const WON = ['<b>WE DID IT!!</b> Put it on the fridge.', "I knew it would fit. It didn't. <b>But I knew.</b>", '<b>A WINNER!</b> I will tell every cat I know.'];
export const BRAGS = ['Did you SEE that anti-aliasing??', 'Rendered in only 0.4 seconds!', 'Letters: perfect. Box: probably fine.', 'No jaggies! (some jaggies)', 'Powered by the TurboType engine.', 'That kerning, though.', 'Smooth as a brand new mouse ball.'];
export const FIT_STEPS = ['Measuring letters...', 'Calculating kerning...', 'Asking the box nicely...', 'Pushing...', 'Pushing HARDER...', 'Almost...'];
export const SENTENCES = ['Sadie thought she was a cow.', 'Please copy and share!', 'Hay is a vegetable.', 'Fonts! Fonts! Fonts!', 'Now with 256 colors.', 'This sentence fits.', 'The box is fine.', 'Coming soon: 1994!'];

const pick = (a, random) => a[Math.floor(random() * a.length)];

// Sadie's line after a change: `style` describes the text after it, `up` is which way the meter
// went, `nowFull` whether this change filled it, `wasFull` whether it already was.
export function reaction(fx, style, { up, nowFull, wasFull }, random = Math.random) {
  const S = SAYS[fx], name = S.name(style), fact = pick(S.facts, random);
  if (nowFull && !wasFull) return `<b>${name}!!</b> PERFECT!! It's the most beautiful text I've ever seen. <b>PRESS THE BUTTON!!</b>`;
  if (wasFull) return `<b>${name}!</b> Still perfect. ${fact} <b>Press FIT IT!</b>`;
  if (up) return `<b>${name}!</b> ${pick(UP, random)} ${fact}`;
  return `<b>${name}?</b> ${pick(DOWN, random)} ${fact}`;
}
export { pick };

export const README = `TYPEFITTER DELUXE 3.1
(c) 1993 Pixley Type Works. Please copy & share!

Hi! Thank you for trying TypeFitter.

I spent two years on the text engine and about
ten minutes on the box. So: the text does not
fit in the box. It will never fit in the box.
I checked. Many times.

But LOOK at that kerning.

You win anyway. Every time. That's the deal.

 - Dale Pixley, author

P.S. Sadie is my cat. She knows everything
about fonts. Most of it is wrong.`;

export const HELP = `HOW TO PLAY TYPEFITTER

1. Make the text fancy with the buttons.
2. Sadie tells you what she thinks.
3. When her TEXT LOVE meter is full,
   press FIT IT!
4. It won't fit.
5. You win.`;
