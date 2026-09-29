# Draws the clubhouse's pictures with the same 90s kit as the
# mock-ups, and writes them where the game's build picks them up, as small PNGs inside JS files:
#   src/clubhouse/pictures.js                 Sadie's sprite (on the gatepost and in her portraits)
#   src/activities/dropper-world/box.js       the front of Dropper World's box (on its computer's screen and poster)
#   src/activities/typefitter/box.js          the front of TypeFitter's box (the same)
#   src/activities/<name>/door.js             each activity's door on the mansion's landing
# Run after changing a drawing (pip install pillow): python3 art/play-place/pictures.py
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
DW_DOOR = png(dropper_door, 40, 64)
TF_DOOR = png(typefitter_door, 40, 64)

def write(path, what, body):
    with open(os.path.join(ROOT, path), 'w') as f:
        f.write(f'// {what}\n// Drawn by art/play-place/pictures.py: change the drawing there and run it, never edit this file.\n{body}\n')
    print(path, os.path.getsize(os.path.join(ROOT, path)) // 1024, 'KB')

write('src/clubhouse/pictures.js', "The clubhouse's pictures: Sadie's sprite, awake and blinking, as PNGs.",
      'export default {\n' + ''.join(f'  {k}: {json.dumps(v)},\n' for k, v in A.items()) + '};')
write('src/activities/dropper-world/box.js', "The front of Dropper World's box (on its computer's screen and poster in the mansion), as a PNG.",
      f'export default {json.dumps(BOX)};')
write('src/activities/dropper-world/door.js', "Dropper World's door on the mansion's landing, as a PNG.",
      f'export default {json.dumps(DW_DOOR)};')
write('src/activities/typefitter/door.js', "TypeFitter's door on the mansion's landing, as a PNG.",
      f'export default {json.dumps(TF_DOOR)};')
write('src/activities/typefitter/box.js', "The front of TypeFitter's box (on its computer's screen and poster in the mansion), as a PNG.",
      f'export default {json.dumps(TF_BOX)};')
