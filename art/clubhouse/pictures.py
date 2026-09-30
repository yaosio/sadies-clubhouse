# Draws the clubhouse's pictures with the same 90s kit as the
# mock-ups, and writes them where the game's build picks them up, as small PNGs inside JS files:
#   src/clubhouse/pictures.js                 Sadie's sprite (on the gatepost and in her portraits)
#   src/activities/dropper-world/box.js       the front of Dropper World's box (on its computer's screen and poster)
#   src/activities/typefitter/box.js          the front of TypeFitter's box (the same)
#   src/activities/<name>/door.js             each activity's door on the mansion's landing
#   src/activities/brickbuster/poster.js      Sadie's angry NO NOISE poster in Brickbuster's room
# Run after changing a drawing (pip install pillow): python3 art/clubhouse/pictures.py
import base64, io, json, math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from PIL import Image
import kit
from kit import put, ramp, tone, text, text_w, build_sadie, outline, whiskers, GOLD, INK
import clubhouse3d as c3

KEY = (255, 0, 255)  # the kit's empty colour: see-through in the page

def png(draw, w, h):
    kit.start(w, h); draw()
    im = Image.new('RGBA', (w, h))
    im.putdata([(0, 0, 0, 0) if p == KEY else (*p, 255) for row in kit.img for p in row])
    b = io.BytesIO(); im.save(b, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

A = {}  # Sadie's sprite for the mansion, awake and blinking
BOX = png(lambda: c3._dropper(40, 44), 40, 44)
def typefitter_box(w=40, h=44):
    # TypeFitter's box: a white page, a red dashed box, big letters spilling out of it, a gold band
    band = 8
    for y in range(h):
        for x in range(w): put(x, y, ramp(x, y, [(0, '#6a44c8'), (1, '#2a1766')], y / h))
    for y in range(3, h - band - 3):
        for x in range(4, w - 4): put(x, y, '#dfe8ff' if (y - 3) % 5 == 4 else '#fffef8')
    for x in range(4, w - 4): put(x, h - band - 3, '#1a0f40')
    for y in range(3, h - band - 2): put(w - 4, y, '#1a0f40')
    for x in range(8, 27):
        if x % 3 != 2: put(x, 10, '#e0103a'); put(x, 23, '#e0103a')
    for y in range(10, 24):
        if y % 3 != 2: put(8, y, '#e0103a'); put(26, y, '#e0103a')
    text(10, 12, 'ABC', '#111111', '#9a96b8', 2)
    for y in range(h - band - 1, h):
        for x in range(w): put(x, y, tone(x, y, ['#9a6a00', '#ffcf3a', '#fff3a8'], 1.4))
    text(w // 2 - text_w('TYPEFITTER') // 2, h - band + 1, 'TYPEFITTER', '#1a0f40')
    for x in range(w): put(x, 0, '#ffffff')
    for y in range(h): put(0, y, '#ffffff')
TF_BOX = png(typefitter_box, 40, 44)
def sadie_frame(blink):
    def draw():
        sad = build_sadie(28, 45)
        if blink:  # close the half-lidded eyes: the lid comes down one more row
            for (ex, ey) in ((8, -24), (15, -24)):
                for i in range(4):
                    fur = sad.get((28 + ex + i, 45 + ey - 1), (4, '#fff3ea'))
                    sad[(28 + ex + i, 45 + ey)] = fur
                    sad[(28 + ex + i, 45 + ey + 1)] = (4, INK)
        outline(sad, INK, lambda x, y: True)
        whiskers(28, 45, 1, lambda x, y: True)
    return draw
A['sadie'] = png(sadie_frame(False), 58, 47)
A['sadieBlink'] = png(sadie_frame(True), 58, 47)
# The activities' doors on the mansion's landing (40 x 64, one door that swings open)
def box_(x0, y0, w, h, c):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w): put(x, y, c)
def door_base(col, dark, light):
    box_(0, 0, 40, 64, '#8a5a10'); box_(1, 1, 38, 63, '#c89018')
    box_(3, 3, 34, 61, col)
    for y in range(3, 64): put(3, y, light); put(36, y, dark)
    for (y0, h) in ((30, 14), (47, 14)):
        box_(7, y0, 26, h, dark); box_(8, y0 + 1, 24, h - 2, light); box_(9, y0 + 2, 22, h - 4, col)
    box_(31, 36, 3, 3, GOLD); put(31, 36, '#fff6b0')
def dropper_door():
    door_base('#3aa04a', '#1f6a2a', '#5ac86a')
    # the sign, in jelly pink, and hay poking out under the door
    box_(5, 7, 30, 19, INK); box_(6, 8, 28, 17, '#ff8ec8'); box_(6, 8, 28, 1, '#ffd0ea')
    text(20 - text_w('DROPPER') // 2, 10, 'DROPPER', '#ffffff', '#a02a70')
    text(20 - text_w('WORLD') // 2, 17, 'WORLD', '#fff08a', '#a02a70')
    for x in range(4, 36, 2):
        h = 2 + (x * 7) % 4
        for y in range(64 - h, 64): put(x, y, '#ffd23a' if x % 4 else '#f8e070')
def typefitter_door():
    door_base('#2a3aa0', '#1a2468', '#4a5ad0')
    # a brass nameplate whose name doesn't fit: it runs right off the plate
    box_(9, 9, 22, 15, '#8a5a10'); box_(10, 10, 20, 13, '#ffd23a'); box_(10, 10, 20, 1, '#fff6b0')
    text(1, 11, 'TYPEFITTER', '#1c1238')
    text(1, 17, 'DELUXE 3.1', '#e83a3a')
def brickbuster_door():
    door_base('#3a2a8e', '#1a0f40', '#6a58d8')
    # an arcade marquee for a sign, a wall of bricks, and a ball of yarn that got loose
    box_(4, 5, 32, 17, INK); box_(5, 6, 30, 15, '#12082e')
    text(20 - text_w('BRICK') // 2, 7, 'BRICK', '#ffe23a', '#ff3a78')
    text(20 - text_w('BUSTER') // 2, 14, 'BUSTER', '#ff8ec8', '#7a52f4')
    for row, c in enumerate(('#ff3a3a', '#ffa41e', '#58d04a')):
        for col in range(4):
            x0 = 7 + col * 7
            box_(x0, 24 + row * 2, 6, 1, c)
    for y in range(-3, 4):
        for x in range(-3, 4):
            if x * x + y * y <= 10: put(29 + x, 56 + y, '#ff5ab4' if (x + y) % 3 else '#a02a70')
    for x in range(12, 27): put(x, 59 + (x % 3 == 0), '#ff5ab4')   # its loose end
    text(4, 57, "'96", '#ffe23a', INK)
def poster():
    # QUIET!! : a speaker, crossed out in red, and Sadie underneath, cross about it
    for y in range(84):
        for x in range(64): put(x, y, ramp(x, y, [(0, '#fff08a'), (0.55, '#ffc81e'), (1, '#ff7a2a')], y / 84))
    for x in range(64): put(x, 0, INK); put(x, 83, INK)
    for y in range(84): put(0, y, INK); put(63, y, INK)
    text(32 - text_w('QUIET!!', 2) // 2, 4, 'QUIET!!', '#e83a3a', INK, 2)
    cx, cy = 32, 30
    box_(cx - 9, cy - 4, 5, 9, '#4a4462'); box_(cx - 8, cy - 3, 3, 7, '#8f8a9b')        # the speaker
    for i in range(6):
        for y in range(cy - 4 - i, cy + 5 + i): put(cx - 4 + i, y, '#4a4462' if i == 5 or y in (cy - 4 - i, cy + 4 + i) else '#b4aec4')
    for r in (4, 7):                                                                  # its noise
        for a in range(-5, 6):
            t = a / 12
            put(cx + 3 + round(r * math.cos(t * 2)), cy + round(r * math.sin(t * 2)), '#1c1238')
    for y in range(-13, 14):                                                          # crossed out
        for x in range(-13, 14):
            d = math.hypot(x, y)
            if 10.5 < d < 13.5 or (abs(x - y) < 2.2 and d < 11): put(cx + x, cy + y, '#e83a3a')
    sad = build_sadie(30, 81)
    for (bx, dx) in ((37, 1), (48, -1)):                                              # cross eyebrows
        for i in range(6):
            for j in (0, 1): sad[(bx + dx * i, 53 + i // 2 + j)] = (4, INK)
    outline(sad, INK, lambda x, y: 0 < x < 63 and 0 < y < 83)
    whiskers(30, 81, 1, lambda x, y: 0 < x < 63 and 0 < y < 83)
    for (x, y) in ((50, 44), (52, 42), (54, 44)):                                     # fuming
        put(x, y, INK); put(x + 1, y - 1, INK)
def music_door():
    door_base('#38b0c8', '#1a7890', '#70e0e8')
    # a sign with piano keys along it, and music notes floating off the door
    box_(5, 6, 30, 20, INK); box_(6, 7, 28, 18, '#fff4e4')
    text(20 - text_w('MUSIC') // 2, 8, 'MUSIC', '#a02a70', '#ffd23a')
    for i in range(7):   # the keys
        box_(7 + i * 4, 15, 3, 9, '#ffffff'); put(7 + i * 4, 15, '#e8dcff')
    for i in (0, 1, 3, 4, 5):
        box_(9 + i * 4, 15, 2, 5, INK)
    for (x, y, c) in ((12, 50, '#ffd23a'), (24, 46, '#ff8ec8'), (29, 55, '#ffd23a')):   # notes
        for j in range(6): put(x + 2, y + j, c)
        box_(x, y + 5, 3, 2, c); put(x + 3, y, c); put(x + 4, y + 1, c)
DW_DOOR = png(dropper_door, 40, 64)
MR_DOOR = png(music_door, 40, 64)
BB_DOOR = png(brickbuster_door, 40, 64)
POSTER = png(poster, 64, 84)
TF_DOOR = png(typefitter_door, 40, 64)

def write(path, what, body):
    with open(os.path.join(ROOT, path), 'w') as f:
        f.write(f'// {what}\n// Drawn by art/clubhouse/pictures.py: change the drawing there and run it, never edit this file.\n{body}\n')
    print(path, os.path.getsize(os.path.join(ROOT, path)) // 1024, 'KB')

write('src/clubhouse/pictures.js', "The clubhouse's pictures: Sadie's sprite, awake and blinking, as PNGs.",
      'export default {\n' + ''.join(f'  {k}: {json.dumps(v)},\n' for k, v in A.items()) + '};')
write('src/activities/dropper-world/box.js', "The front of Dropper World's box (on its computer's screen and poster in the mansion), as a PNG.",
      f'export default {json.dumps(BOX)};')
write('src/activities/dropper-world/door.js', "Dropper World's door on the mansion's landing, as a PNG.",
      f'export default {json.dumps(DW_DOOR)};')
write('src/activities/typefitter/door.js', "TypeFitter's door on the mansion's landing, as a PNG.",
      f'export default {json.dumps(TF_DOOR)};')
write('src/activities/brickbuster/door.js', "Brickbuster '96's door on the mansion's landing, as a PNG.",
      f'export default {json.dumps(BB_DOOR)};')
write('src/activities/music-room/door.js', "The music room's door on the mansion's landing, as a PNG.",
      f'export default {json.dumps(MR_DOOR)};')
write('src/activities/brickbuster/poster.js', "Sadie's QUIET!! poster in Brickbuster's room: a speaker crossed out, and her, cross about it. A PNG.",
      f'export default {json.dumps(POSTER)};')
write('src/activities/typefitter/box.js', "The front of TypeFitter's box (on its computer's screen and poster in the mansion), as a PNG.",
      f'export default {json.dumps(TF_BOX)};')
