# Dropper World's Chooter numbers

Chooter's numbers (`core/friends/chooter.js`): arrival, speeds, play, zoomies, the ball, getting
tired. Read before changing any of them. Teasing Sadie: `chooter-teasing.md`. His feelings and why:
`docs/dropper-world/characters/chooter.md`. Units: `world-solver.md`.

## Arriving

Before they meet he's next door, listening (`heard`, 0 to 1, saved with the board). Every tick,
each awake piece that slows down adds how much it slowed (in px per substep, divided by its
lightness, so heavy pieces thud louder), and the barn scraping along behind Sadie adds 60 a second.
3500 of that winds him all the way up; a new board makes about 850 a minute. What he hears rings in
his ears and winds him up at most 1/150 a second, so even a downpour takes at least 2.5 minutes.

At 60% he starts peeking in (his head, from behind whichever wall is nearer Sadie as the peek
starts, at the top of the pile there), every 22 s at first and every 8 s near the end; you can tap
him while his head is in. At 100% he bursts in over that wall with a leap and a bark. With the mole
building, `node tools/dropper-world/arrival.mjs` gives a first peek at about 3:15–3:50 and an
arrival at about 4:50–5:20 (between 165 and 185 pieces). A slow device whose mole gets tired drops
fewer pieces, so he takes longer. Once met, he stays met (saved in the browser), even after clearing
the tower; Start over sends him back next door, from quiet.

## Getting around and playing

- Trots 2.2 blocks/s, runs 4.2 when he has somewhere to be, 6.5 with the zoomies.
- Leaps up ledges up to 2.6 blocks tall (3.2 with the zoomies); anything taller stops him and he
  barks. Walks off drops and falls (gravity 1400). If a piece lands on him he wriggles out on top.
- Playing: picks a spot 1.4–3.6 blocks to one side of Sadie every 2–4.5 s and goes there; hops for
  joy or sends her a heart now and then.
- Feelings: `energy` winds up while he's out, `tired` builds while he's out, `missing` makes him
  greet a new friend.

## Zoomies

When his energy is full. It starts 20 s from full on a fresh board (30 s after meeting him), then
takes 40–75 s to wind up again (chosen after each bout). His energy lasts 7–10 s. He dashes 7–14
blocks one way, then the other, hopping every 0.6–1.8 s. Any piece that isn't a fossil in the space
just ahead of his body gets knocked forward 5 blocks/s and up 3.5 (times its lightness, up to 1.5×;
a boulder barely moves), at most once per 0.6 s per piece. In test runs each bout moves between 1
and about 25 pieces more than a block.

## The ball

He chases it unless he has the zoomies, grabs it once it's near his mouth and coming down, and
carries it to Sadie (she's not impressed). Gives up if he can't get to it for 5 s (25 s in all), or
can't reach Sadie within 18 s. The ball vanishes 1.5 s after he drops it (3 s if he gave up), or
after 40 s regardless.

## Tired and home

Worn out after 70–120 s out (chosen each time he comes out; the zoomies tire him twice as fast, so
outings with zoomies are shorter). Too tired for the zoomies then; he heads home once no toy is
out: in through the cat flap if the side of the barn is clear, or he digs in from on top if it's
buried (or if he can't get there in 30 s). Home for 25–45 s (until rested), poking his head out of
the hayloft window; a thrown ball gets him out straight away.
