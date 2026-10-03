# Dropper World's hay numbers

How the mole digs up and flings hay, and how it floats (`core/hay.js`). Read before changing how
often Sadie gets hay or how hard it is to reach. Units: `world-solver.md`.

## Digging it up

The mole digs it up. Whenever fewer than 3 bundles are about (counting one in its paws), the next
time it reaches for a piece it comes up with hay instead: it stares at it for 1.1 s ("?!", eyes
wide, "ew" mouth), then flings it once its supply is full, and that takes the place of a piece (so
pieces and hay together are still never faster than one every 1.5 s). After Sadie eats one, it
waits 3 s before it can dig up another. A new game starts with it digging up the first 3 (all out
after about 4 s); saved hay stays where it was.

## The throw

It aims along a trail: each bundle 10–18 blocks sideways from the last aim, carrying on the same way
until it would hit a wall (keeps 1.5 blocks clear), then the trail turns around. So Sadie grazes
back and forth across the board. The throw takes 0.7–1.4 s. The bundle is a real thing: it bounces
off the pile (keeping 30% of its speed, floppy; about 3 bounces each) and the walls, tumbles, rolls
a little downhill and settles lying flat, without shoving any pieces (like the ball). So it doesn't
land exactly where the mole aimed, and while it's flying Sadie doesn't go for it.

## The float

Lying still for 0.4 s (or after 8 s anyway), the mole's mystery float gets hold of it (it's not the
hat): it glows, twinkles underneath, and floats up at up to 1.5 blocks a second to 0.7 blocks above
the pile under it, plus 1.5–4.5 blocks extra, so 2.2–5.2 blocks above the pile. If Sadie is right
there when it lands, she can grab it before it floats off: an easy snack now and then. She reaches
1.6 blocks up, so a floating bundle is never in reach: she needs 0.6–3.6 blocks built under it, and
she gets impatient while she waits (which brings the mole over to bury her, building the pile she
needs). Because height is measured from the pile, hay keeps up as the tower grows.

(Tried and set aside: 5–12 apart and 0–3 up, which the owner found too close and too easy. A middle
setting of 8–15 apart and 1–3.5 up made her impatient about 25% of the time instead of about 45%.)

Covered by the pile for 0.5 s: float up to 0.7 blocks above the surface. Pile drops away for 0.5 s:
sink back, never below where it floated up to.
