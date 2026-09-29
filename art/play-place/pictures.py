# Draws the clubhouse's pictures (the 3D room's textures and sprites) with the same 90s kit as the
# mock-ups, and writes them where the game's build picks them up, as small PNGs inside JS files:
#   src/clubhouse/pictures.js                 the room, Sadie, the locked boxes, the logo...
#   src/activities/dropper-world/box.js       the front of Dropper World's box on the shelf
#   src/activities/typefitter/box.js          the front of TypeFitter's box on the shelf
# Run after changing a drawing (pip install pillow): python3 art/play-place/pictures.py
import base64, io, json, math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from PIL import Image
import kit
from kit import put, ramp, tone, text, text_w, logo, build_sadie, outline, whiskers, ICONS, PADLOCK, GOLD, INK
import clubhouse as cb
import clubhouse3d as c3

KEY = (255, 0, 255)  # the kit's empty colour: see-through in the page

def png(draw, w, h):
    kit.start(w, h); draw()
    im = Image.new('RGBA', (w, h))
    im.putdata([(0, 0, 0, 0) if p == KEY else (*p, 255) for row in kit.img for p in row])
    b = io.BytesIO(); im.save(b, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

A = {}
A['wall'] = png(c3._wall, 42, 42)
def floor():
    for y in range(16):
        for x in range(16): put(x, y, '#ffe27a' if (x // 8 + y // 8) % 2 == 0 else '#ff84cc')
A['floor'] = png(floor, 16, 16)
def wood():
    for y in range(32):
        for x in range(32):
            g = math.sin(y * 0.9 + 2.5 * math.sin(x * 0.2)) * 0.5 + 0.5
            put(x, y, tone(x, y, cb.WOOD, 2.4 + 0.9 * g - (0.6 if (y % 11 == 0) else 0)))
A['wood'] = png(wood, 32, 32)
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
A['card'] = png(lambda: c3._card(34, 26), 34, 26)
def locked():
    for y in range(44):
        for x in range(40): put(x, y, ramp(x, y, [(0, '#2c2070'), (1, '#1e1458')], y / 44))
    for x in range(40): put(x, 0, '#4a3ca0')
    for y in range(44): put(0, y, '#4a3ca0')
    text(20 - text_w('?', 3) // 2, 14, '?', '#4a3ca0', '#120a38', 3)
A['locked'] = png(locked, 40, 44)
def tape():
    for y in range(6):
        for x in range(36):
            put(x, y, '#12082e' if y in (0, 5) else ('#ffe030' if ((x + y) // 3) % 2 else '#1a1030'))
A['tape'] = png(tape, 36, 6)
A['padlock'] = png(lambda: cb.sprite_px(PADLOCK, 0, 0, 1, {'o': '#c8c8d8', 'g': '#9a6a08', 'G': GOLD, 'k': '#12082e'}), 6, 7)
A['poster'] = png(lambda: [[put(x, y, p) for x, p in enumerate(row)] for y, row in enumerate(c3.POSTER)], 30, 30)
def window():
    for y in range(36):
        for x in range(44):
            t = 1 - y / 36
            hill = 0.3 + 0.06 * math.sin(x * 0.3)
            put(x, y, ramp(x, y, [(0, '#28b048'), (1, '#6ef06a')], t / hill) if t < hill else
                ramp(x, y, [(0, '#ffb2ea'), (0.35, '#62d6ff'), (1, '#2438e8')], (t - hill) / (1 - hill)))
    for y in range(4, 12):
        for x in range(30, 40):
            if math.hypot(x - 35, y - 8) < 3.6: put(x, y, '#fff45a')
    for (cx, cy) in ((10, 9), (15, 8), (19, 10)):
        for y in range(cy - 3, cy + 3):
            for x in range(cx - 4, cx + 5):
                if math.hypot((x - cx) / 4.5, (y - cy) / 2.6) < 1: put(x, y, '#ffffff' if y < cy + 1 else '#b8d4ff')
    for i in range(44): put(i, 0, '#ffffff'); put(i, 1, '#d4c6ec'); put(i, 34, '#d4c6ec'); put(i, 35, '#6a58a0'); put(i, 17, '#fff3ea'); put(i, 18, '#9c8cc4')
    for j in range(36): put(0, j, '#ffffff'); put(1, j, '#d4c6ec'); put(42, j, '#d4c6ec'); put(43, j, '#6a58a0'); put(21, j, '#fff3ea'); put(22, j, '#9c8cc4')
A['window'] = png(window, 44, 36)
def curtain():
    for y in range(40):
        for x in range(10):
            put(x, y, tone(x, y, ['#b8127a', '#ff5aa8', '#ff9ed0', '#ffe0f0'], 1.5 + math.sin(x * 1.3)))
A['curtain'] = png(curtain, 10, 40)
def zigzag():
    for y in range(6):
        for x in range(12): put(x, y, '#ff4fb0' if (x // 3 + y // 3) % 2 else '#ffe030')
A['zigzag'] = png(zigzag, 12, 6)
def rug():
    rings = ['#ff3a78', '#ffa41e', '#fff27a', '#36e04e', '#2f86ff', '#9a3ce8']
    for y in range(64):
        for x in range(64):
            e = math.hypot(x + 0.5 - 32, y + 0.5 - 32) / 31
            if e < 0.94: put(x, y, rings[min(5, int(e / 0.94 * 6))])
            elif e < 1: put(x, y, '#3a1040')
A['rug'] = png(rug, 64, 64)
def door():
    for y in range(80):
        for x in range(36):
            put(x, y, tone(x, y, ['#2a1a6a', '#4a32a8', '#6a58d8', '#8a78ff'], 1.6 + 0.6 * math.sin(x * 0.15)))
    for (x0, y0, x1, y1) in ((5, 6, 30, 34), (5, 42, 30, 74)):
        for x in range(x0, x1 + 1): put(x, y0, '#1c1050'); put(x, y1, '#c8bcff')
        for y in range(y0, y1 + 1): put(x0, y, '#1c1050'); put(x1, y, '#c8bcff')
    for (x, y) in ((29, 38), (30, 38), (29, 39), (30, 39)): put(x, y, GOLD)
    kit.rect(7, 12, 28, 26, '#fff6b0')
    text(9, 14, 'NO', '#ff2a2a'); text(9, 20, 'MOLES', '#ff2a2a')
A['door'] = png(door, 36, 80)
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
def blob():
    for y in range(12):
        for x in range(32):
            e = ((x + 0.5 - 16) / 16) ** 2 + ((y + 0.5 - 6) / 6) ** 2
            if e < 1 and kit.thr(x, y) < 0.7 * (1 - e) + 0.15: put(x, y, '#1c1050')
A['blob'] = png(blob, 32, 12)
A['hand'] = png(lambda: cb.sprite_px(cb.HAND, 0, 0, 2, {'k': '#12082e', 'w': '#ffffff'}, shadow=None), 20, 24)
A['logo'] = png(lambda: logo(1, 1, "SADIE'S PLAY PLACE"), 150, 20)
A['logo2'] = png(lambda: [logo(1, 1, "SADIE'S"), logo(1, 20, 'PLAY PLACE')], 82, 38)
def weave():
    for y in range(5):
        for x in range(5): put(x, y, '#34257e' if (x + 2 * y) % 5 == 0 else '#3b2a8c')
A['weave'] = png(weave, 5, 5)

def write(path, what, body):
    with open(os.path.join(ROOT, path), 'w') as f:
        f.write(f'// {what}\n// Drawn by art/play-place/pictures.py: change the drawing there and run it, never edit this file.\n{body}\n')
    print(path, os.path.getsize(os.path.join(ROOT, path)) // 1024, 'KB')

write('src/clubhouse/pictures.js', "The clubhouse's pictures: the 3D room's textures and sprites, as PNGs.",
      'export default {\n' + ''.join(f'  {k}: {json.dumps(v)},\n' for k, v in A.items()) + '};')
write('src/activities/dropper-world/box.js', "The front of Dropper World's box on the clubhouse shelf, as a PNG.",
      f'export default {json.dumps(BOX)};')
write('src/activities/typefitter/box.js', "The front of TypeFitter's box on the clubhouse shelf, as a PNG.",
      f'export default {json.dumps(TF_BOX)};')
