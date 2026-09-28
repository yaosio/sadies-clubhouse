# Mock-ups of Sadie's Play Place: the clubhouse menu (landscape and phone) and what an activity
# looks like inside the frame (phone). Same 90s look as art/90s-style/mockup-2.png.
# Run: pip install pillow, then python3 art/play-place/clubhouse.py
import math, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit
from kit import (put, get, rect, dmix, ramp, tone, thr, text, text_w, panel, rivet, groove_h, groove_v,
                 logo, cbutton, build_sadie, outline, whiskers, shadow_ellipse, light, ICONS, IC, PADLOCK,
                 FONT, FACE, HI, HI2, LO, LO2, GOLD, INK)

HERE = os.path.dirname(os.path.abspath(__file__))
FONT.update({',': '000000000010100', '>': '100010001010100', '<': '001010100010001', '+': '000010111010000'})

def sunken(x0, y0, x1, y1):  # the sunken border round a picture area
    for x in range(x0 - 1, x1 + 2): put(x, y0 - 1, '#12082e'); put(x, y1 + 1, HI2)
    for y in range(y0 - 1, y1 + 2): put(x0 - 1, y, '#12082e'); put(x1 + 1, y, HI2)
    for x in range(x0 - 2, x1 + 3): put(x, y0 - 2, LO); put(x, y1 + 2, HI)
    for y in range(y0 - 2, y1 + 3): put(x0 - 2, y, LO); put(x1 + 2, y, HI)

def frame():
    panel(0, 0, kit.W - 1, kit.H - 1, True, 3)
    for (x, y) in ((4, 4), (kit.W - 6, 4), (4, kit.H - 6), (kit.W - 6, kit.H - 6)): rivet(x, y)

def sprite_px(rows, x0, y0, s=1, pal=IC, shadow='#12082e', dark=False):
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == '.': continue
            for a in range(s):
                for b in range(s):
                    X, Y = x0 + i * s + a, y0 + j * s + b
                    if shadow: put(X + 1, Y + 1, shadow)
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == '.': continue
            for a in range(s):
                for b in range(s):
                    put(x0 + i * s + a, y0 + j * s + b, '#120a38' if dark else pal[ch])

# ---------- the room ----------
WALL = ['#1aa89c', '#2ed0c0', '#5ae8d4']
WOOD = ['#4a200c', '#7a3a16', '#a85a26', '#d0843c', '#f0b060']

def wallpaper(x0, y0, x1, y1):
    # loud early-90s wallpaper: mint with pink squiggles, yellow triangles and purple confetti
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(x, y, tone(x, y, WALL, 1.4 + 0.5 * (y - y0) / max(1, y1 - y0)))
    rnd = random.Random(3)
    for gy in range(y0 + 4, y1 - 2, 14):
        for gx in range(x0 + 4 + (gy // 14 % 2) * 7, x1 - 4, 14):
            k = rnd.random()
            if k < 0.4:  # squiggle
                for i in range(7):
                    put(gx + i, gy + (1 if i % 4 in (1, 2) else 0), '#ff4fb0')
            elif k < 0.7:  # triangle
                for j in range(3):
                    for i in range(-j, j + 1): put(gx + 3 + i, gy + j, '#ffe030')
            else:  # confetti
                put(gx + 2, gy, '#7a3ce8'); put(gx + 3, gy, '#7a3ce8'); put(gx + 5, gy + 2, '#ff7a2a')
    for x in range(x0, x1 + 1):  # a border strip under the ceiling
        for y in range(y0, y0 + 3): put(x, y, '#ff4fb0' if (x // 3 + y) % 2 else '#ffe030')
        put(x, y0 + 3, '#8a1a60')

def floor(x0, y0, x1, y1):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            plank = (y - y0) // 5
            seam = (x + plank * 17) % 38 == 0 or (y - y0) % 5 == 0
            put(x, y, WOOD[1] if seam else tone(x, y, WOOD, 2.2 + 0.6 * (y - y0) / max(1, y1 - y0) + 0.3 * ((plank % 2) - 0.5)))
    for x in range(x0, x1 + 1):  # baseboard
        put(x, y0 - 3, '#ffffff'); put(x, y0 - 2, '#d4c6ec'); put(x, y0 - 1, '#6a58a0')

def rug(cx, cy, rx, ry):
    rings = ['#ff3a78', '#ffa41e', '#fff27a', '#36e04e', '#2f86ff', '#9a3ce8']
    for y in range(int(cy - ry - 1), int(cy + ry + 2)):
        for x in range(int(cx - rx - 1), int(cx + rx + 2)):
            e = math.sqrt(((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2)
            if e < 1:
                k = min(5, int(e * 6))
                c = rings[k]
                if e * 6 - k > 0.8 and thr(x, y) < 0.5: c = rings[min(5, k + 1)]
                put(x, y, c)
            elif e < 1.12: put(x, y, '#3a1040')

def window(x0, y0, x1, y1):
    sky = [(0, '#2438e8'), (0.4, '#2f86ff'), (0.75, '#62d6ff'), (1, '#ffb2ea')]
    hz = y0 + int((y1 - y0) * 0.72)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(x, y, ramp(x, y, sky, (y - y0) / max(1, hz - y0)))
    for x in range(x0, x1 + 1):
        hill = hz + 3 * math.sin(x * 0.12) - 2
        for y in range(int(hill), y1 + 1):
            put(x, y, ramp(x, y, [(0, '#6ef06a'), (1, '#28b048')], (y - hill) / 8) if y > hill + 0.5 else '#16804a')
    sx, sy = x1 - 9, y0 + 8  # sun
    for y in range(sy - 5, sy + 6):
        for x in range(sx - 5, sx + 6):
            d = math.hypot(x - sx, y - sy)
            if d < 4.5: put(x, y, ramp(x, y, [(0, '#ffffff'), (0.5, '#fff45a'), (1, '#ffc81e')], d / 4.5))
    cl = {(x, y) for y in range(y0 + 10, y0 + 18) for x in range(x0 + 6, x0 + 24)
          if math.hypot((x - x0 - 15) / 9, (y - y0 - 15) / 3.5) < 1 or math.hypot((x - x0 - 13) / 5, (y - y0 - 12) / 3) < 1}
    for (x, y) in cl: put(x, y, '#ffffff' if y < y0 + 15 else '#b8d4ff')
    mx, my = (x0 + x1) // 2, (y0 + y1) // 2  # white frame and cross bars
    for t in range(-1, 1):
        for y in range(y0, y1 + 1): put(mx + t, y, '#fff3ea' if t else '#9c8cc4')
        for x in range(x0, x1 + 1): put(x, my + t, '#fff3ea' if t else '#9c8cc4')
    for i in range(3):
        for x in range(x0 - 3 + i, x1 + 4 - i): put(x, y0 - 3 + i, '#ffffff' if i < 2 else '#9c8cc4'); put(x, y1 + 3 - i, '#d4c6ec' if i else '#6a58a0')
        for y in range(y0 - 3 + i, y1 + 4 - i): put(x0 - 3 + i, y, '#ffffff' if i < 2 else '#9c8cc4'); put(x1 + 3 - i, y, '#d4c6ec' if i else '#6a58a0')
    for side in (0, 1):  # pink curtains, gathered at the sides
        for y in range(y0 - 5, y1 + 6):
            w = 7 - int(3 * math.sin(math.pi * (y - y0 + 5) / (y1 - y0 + 10)))
            for i in range(w):
                x = x0 - 6 + i if side == 0 else x1 + 6 - i
                v = 1.2 + 0.9 * math.sin(i * 1.3 + side)
                put(x, y, tone(x, y, ['#b8127a', '#ff5aa8', '#ff9ed0', '#ffe0f0'], v))
    for x in range(x0 - 8, x1 + 9): put(x, y0 - 6, '#ffd23a'); put(x, y0 - 5, '#9a6a08')  # curtain rod

# ---------- the cubby shelf: one box per activity ----------
def cubby_shelf(x0, y0, cols, rows, cw, ch, t=4):
    """Returns the inside rectangle of each cubby, left to right, top to bottom."""
    w, h = cols * cw + (cols + 1) * t, rows * ch + (rows + 1) * t
    for y in range(y0, y0 + h + 4):
        for x in range(x0, x0 + w):
            put(x, y, tone(x, y, WOOD, 3.0 - 1.4 * (x - x0) / w + (0.4 if y < y0 + 2 else 0)))
    for x in range(x0, x0 + w): put(x, y0, WOOD[4]); put(x, y0 + h + 3, WOOD[0])
    for y in range(y0, y0 + h + 4): put(x0, y, WOOD[4]); put(x0 + w - 1, y, WOOD[0])
    cells = []
    for r in range(rows):
        for c in range(cols):
            cx0, cy0 = x0 + t + c * (cw + t), y0 + t + r * (ch + t)
            for y in range(cy0, cy0 + ch):
                for x in range(cx0, cx0 + cw):  # dark inside, lit from the top left
                    put(x, y, tone(x, y, ['#1a0a06', '#3a1a0a', '#5a2a10'], 1.7 - 1.3 * (y - cy0) / ch - 0.4 * (x - cx0) / cw))
            for x in range(cx0, cx0 + cw): put(x, cy0, '#12060a'); put(x, cy0 + ch - 1, WOOD[3])
            for y in range(cy0, cy0 + ch): put(cx0, y, '#12060a')
            cells.append((cx0, cy0, cx0 + cw - 1, cy0 + ch - 1))
    return (x0, y0, x0 + w - 1, y0 + h + 3), cells

def box(cell, face, band, title, art=None, dark=False):
    """A software box standing in a cubby: front with art, a title band, and its side in shade."""
    x0, y0, x1, y1 = cell
    bw, bh = x1 - x0 - 6, y1 - y0 - 5
    bx0, by0 = x0 + 2, y1 - bh
    for y in range(by0, y1 + 1):
        for x in range(bx0, bx0 + bw + 3):
            if x >= bx0 + bw:  # the side
                put(x, y, '#120a38' if dark else tone(x, y, band, 0.3))
            else:
                t = (y - by0) / bh
                put(x, y, '#1e1458' if dark else ramp(x, y, face, t))
    for x in range(bx0, bx0 + bw + 3): put(x, by0, '#3a2a88' if dark else '#ffffff')
    for y in range(by0, y1 + 1): put(bx0, y, '#3a2a88' if dark else '#ffffff')
    if not dark:
        ty = y1 - 8
        for y in range(ty, ty + 7):
            for x in range(bx0 + 1, bx0 + bw): put(x, y, tone(x, y, band, 1.5))
        text(bx0 + (bw - text_w(title)) // 2 + 1, ty + 1, title, '#ffffff', '#12082e')
        if art: art(bx0 + 1, by0 + 1, bx0 + bw - 1, ty - 1)
    return bx0, by0, bx0 + bw + 2, y1

def dropper_art(x0, y0, x1, y1):
    # a little mole in its beanie over a stack of jelly
    sprite_px(ICONS['mole'], (x0 + x1) // 2 - 5, y0 + 1)
    cols = ['#ff34a4', '#36e04e', '#ffe030', '#2f86ff']
    for k, (dx, dy) in enumerate(((-9, 0), (1, 0), (-4, -6), (6, -6))):
        bx, by = (x0 + x1) // 2 + dx, y1 - 5 + dy
        if by < y0 + 11: continue
        for y in range(by, by + 6):
            for x in range(bx, bx + 8):
                if (x in (bx, bx + 7)) and (y in (by, by + 5)): continue
                edge = x in (bx, bx + 7) or y in (by, by + 5)
                put(x, y, '#12082e' if edge else cols[k])
        put(bx + 1, by + 1, '#ffffff'); put(bx + 2, by + 1, '#ffffff')

def hazard_tape(cell):
    # "UNDER CONSTRUCTION": yellow and black tape across a locked cubby, with a padlock
    x0, y0, x1, y1 = cell
    for x in range(x0, x1 + 1):
        for k in (0, 1):
            yc = y0 + 8 + k * 10 + (x - x0) * (1 if k == 0 else -1) * (y1 - y0 - 24) / (x1 - x0) + (0 if k == 0 else y1 - y0 - 24)
            for y in range(int(yc), int(yc) + 5):
                put(x, y, '#12082e' if y in (int(yc), int(yc) + 4) else ('#ffe030' if ((x + y) // 3) % 2 else '#1a1030'))
    sprite_px(PADLOCK, (x0 + x1) // 2 - 2, y1 - 9, 1, {'o': '#c8c8d8', 'g': '#9a6a08', 'G': GOLD, 'k': '#12082e'})

def coming_card(cell):
    x0, y0, x1, y1 = cell
    cx0, cy0, cx1, cy1 = x0 + 4, y0 + 7, x1 - 4, y1 - 7
    for y in range(cy0, cy1 + 1):
        for x in range(cx0, cx1 + 1): put(x, y, '#fff6b0' if (x + y) % 7 else '#ffe6a6')
    for x in range(cx0, cx1 + 1): put(x, cy1 + 1, '#3a1a0a')
    for (tx, ty) in ((cx0 + 1, cy0 - 1), (cx1 - 4, cy0 - 1)):  # tape
        for i in range(4): put(tx + i, ty, '#d8f0ff'); put(tx + i, ty + 1, '#b8d4ff')
    for k, s in enumerate(('SOON', '1996!')):
        text((cx0 + cx1) // 2 - text_w(s) // 2 + 1, cy0 + 3 + k * 7, s, '#ff3a78' if k else '#2438e8')

HAND = ['..kk......', '.kwwk.....', '.kwwk.....', '.kwwkkk...', '.kwwkwwkk.', 'kkwwkwwkwk', 'kwwwwwwwwk',
        'kwwwwwwwwk', '.kwwwwwwk.', '.kwwwwwwk.', '..kwwwwk..', '..kkkkkk..']
def hand(x, y):  # the 90s pointing-hand cursor
    sprite_px(HAND, x, y, 1, {'k': '#12082e', 'w': '#ffffff'}, shadow=None)

def glow(cell, pad=2):  # the chosen cubby: a gold ring, dotted on the outside
    x0, y0, x1, y1 = cell
    for i in range(2):
        for x in range(x0 - pad + i, x1 + pad - i + 1):
            put(x, y0 - pad + i, GOLD if i == 0 else '#fff6b0'); put(x, y1 + pad - i, GOLD if i == 0 else '#ff9a1e')
        for y in range(y0 - pad + i, y1 + pad - i + 1):
            put(x0 - pad + i, y, GOLD if i == 0 else '#fff6b0'); put(x1 + pad - i, y, GOLD if i == 0 else '#ff9a1e')
    for (sx, sy) in ((x1 + pad, y0 - pad), (x0 - pad, y1 + pad)):
        for i in range(-3, 4):
            put(sx + i, sy, '#ffffff' if abs(i) < 2 else '#fff6b0'); put(sx, sy + i, '#ffffff' if abs(i) < 2 else '#fff6b0')

def fill_shelf(cells, chosen=0):
    box(cells[0], [(0, '#62d6ff'), (1, '#2f86ff')], ['#8a0a50', '#c8127a', '#ff34a4'], 'DROPPER', dropper_art)
    for c in cells[1:3]:
        box(c, None, None, '', dark=True); hazard_tape(c)
    coming_card(cells[3])
    glow(cells[chosen])

# ---------- the LED board, the PLAY! button, keycaps ----------
def led_board(x0, y0, x1, y1, lines):
    panel(x0 - 1, y0 - 1, x1 + 1, y1 + 1, False, 1, '#06140a')
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): put(x, y, '#0e2a14' if (x % 2 == 0 and y % 2 == 0) else '#06140a')
    for k, (s, c) in enumerate(lines):
        text(x0 + 4, y0 + 3 + k * 8, s, c)
    for x in range(x0, x1 + 1):
        if x % 2 == 0: put(x, y0, '#1c4a24')

def play_button(x0, y0, x1, y1):
    cbutton(x0, y0, x1, y1, 'on')
    for y in range(y0 + 2, y1 - 1):
        put(x0 - 1, y, '#8a4a00')
    s = 'PLAY!'
    tw = text_w(s, 2)
    text((x0 + x1) // 2 - tw // 2 + 1, (y0 + y1) // 2 - 5, s, '#ffffff', '#8a2a00', 2)
    for i in range(-3, 4):  # a sparkle on its corner
        put(x1 - 3 + i, y0 + 3, '#ffffff'); put(x1 - 3, y0 + 3 + i, '#ffffff')

def keycap(x, y, key, label, dim=False):
    kw = text_w(key) + 5
    for yy in range(y, y + 10):
        for xx in range(x, x + kw):
            c = '#e8e0ff' if yy < y + 4 else '#c8bcff'
            if yy == y or xx == x: c = '#ffffff'
            if yy == y + 9 or xx == x + kw - 1: c = '#6a58d8'
            put(xx, yy, c)
    text(x + 3, y + 2, key, '#12082e')
    if label: text(x + kw + 3, y + 3, label, '#6a58d8' if dim else '#ffffff', '#12082e')
    return x + kw + (text_w(label) + 12 if label else 6)

def keybar(x0, y0, x1, keys, row_h=12):
    x, y = x0, y0
    for key, label, *dim in keys:
        need = text_w(key) + 5 + text_w(label) + 12
        if x + need - 9 > x1: x, y = x0, y + row_h
        x = keycap(x, y, key, label, bool(dim))

TAG = [('SADIE\'S DROPPER WORLD', '#ffd23a')]

def main():
    # =====================================================================================
    # 1. The clubhouse menu, landscape (320x240, like the first mock-ups)
    kit.start(320, 240)
    frame()
    logo(10, 8, "SADIE'S PLAY PLACE")
    panel(222, 6, 313, 25, False, 1, '#140a3a')
    text(226, 9, 'SHAREWARE V0.9 BETA', '#2ee6d6')
    text(226, 17, 'PLEASE COPY & SHARE!', '#ff8ce0')
    groove_h(3, kit.W - 4, 28)

    RX0, RY0, RX1, RY1 = 6, 32, 313, 175
    FY = 150
    wallpaper(RX0, RY0, RX1, FY - 4)
    floor(RX0, FY, RX1, RY1)
    window(30, 52, 96, 108)
    rug(78, 163, 52, 9)
    (shx0, shy0, shx1, shy1), cells = cubby_shelf(152, 84, 3, 2, 42, 34)
    shadow_ellipse((shx0 + shx1) // 2, shy1 + 2, (shx1 - shx0) // 2 + 6, 4)
    fill_shelf(cells)
    # a poster on the wall: the mole's own motto
    px0, py0 = 112, 50
    for y in range(py0, py0 + 30):
        for x in range(px0, px0 + 30):
            put(x, y, ramp(x, y, [(0, '#ff84cc'), (1, '#9a3ce8')], (y - py0) / 30))
    for x in range(px0, px0 + 30): put(x, py0, '#ffffff'); put(x, py0 + 29, '#3a1040')
    for y in range(py0, py0 + 30): put(px0, y, '#ffffff'); put(px0 + 29, y, '#3a1040')
    sprite_px(ICONS['mole'], px0 + 10, py0 + 4)
    text(px0 + 3, py0 + 17, 'DIG IT', '#fff27a', '#3a1040')
    put(px0 + 14, py0 - 1, '#ff2a2a'); put(px0 + 15, py0 - 1, '#ff2a2a')  # push pin
    sad = build_sadie(shx0 + 30, shy0)
    shadow_ellipse(shx0 + 31, shy0 + 1, 17, 2)
    clip_room = lambda x, y: RX0 <= x <= RX1 and RY0 <= y <= RY1
    outline(sad, INK, clip_room)
    whiskers(shx0 + 30, shy0, 1, clip_room)
    c0 = cells[0]
    hand(c0[2] - 4, c0[3] + 1)
    sunken(RX0, RY0, RX1, RY1)

    groove_h(3, kit.W - 4, 178)
    led_board(8, 183, 250, 220, TAG[:1] + [('A MOLE DROPS JELLY ON EVERYTHING.', '#4aff6a'), ('SADIE CLIMBS THE PILE FOR HAY.', '#4aff6a'),
                                            ('CHOOTER NEXT DOOR HATES THE THUDS.', '#4aff6a')])
    play_button(258, 184, 312, 219)
    groove_h(3, kit.W - 4, 222)
    keybar(8, 225, 312, [('F1', 'HELP'), ('F3', 'SOUND'), ('F5', 'ABOUT'), ('PGDN', 'MORE SHELVES'), ('ESC', 'QUIT')])
    kit.save(os.path.join(HERE, 'clubhouse-wide.png'))

    # =====================================================================================
    # 2. The clubhouse menu on a phone (portrait, 180x360)
    kit.start(180, 360)
    frame()
    def center_logo(y, s, sx):
        logo((kit.W - (len(s) * 4 * sx - sx)) // 2, y, s, sx, 3)
    center_logo(8, "SADIE'S", 3)
    center_logo(27, 'PLAY PLACE', 3)
    panel(8, 47, 171, 64, False, 1, '#140a3a')
    for k, (s, c) in enumerate((('SHAREWARE V0.9 BETA', '#2ee6d6'), ('PLEASE COPY & SHARE!', '#ff8ce0'))):
        text(90 - text_w(s) // 2, 50 + k * 7, s, c)
    groove_h(3, kit.W - 4, 67)

    RX0, RY0, RX1, RY1 = 6, 71, 173, 278
    FY = 250
    wallpaper(RX0, RY0, RX1, FY - 4)
    floor(RX0, FY, RX1, RY1)
    window(128, 92, 160, 124)
    rug(90, 273, 56, 4)
    (shx0, shy0, shx1, shy1), cells = cubby_shelf(44, 132, 2, 3, 42, 34)
    shadow_ellipse((shx0 + shx1) // 2, shy1 + 2, (shx1 - shx0) // 2 + 5, 3)
    fill_shelf(cells)
    sad = build_sadie(shx0 + 30, shy0)
    shadow_ellipse(shx0 + 31, shy0 + 1, 17, 2)
    clip_room = lambda x, y: RX0 <= x <= RX1 and RY0 <= y <= RY1
    outline(sad, INK, clip_room)
    whiskers(shx0 + 30, shy0, 1, clip_room)
    c0 = cells[0]
    hand(c0[2] - 4, c0[3] + 1)
    # page arrows either side of the shelf: the shelf goes on past this one (dim when there's no more)
    ay = (shy0 + shy1) // 2
    for (ax, d, col) in ((shx0 - 5, -1, '#1aa89c'), (shx1 + 5, 1, '#1aa89c')):
        for i in range(7):
            for j in range(-6 + i, 7 - i): put(ax + d * i, ay + j, col)
    text((shx0 + shx1) // 2 - text_w('SHELF 1 OF 1') // 2 + 1, shy1 + 6, 'SHELF 1 OF 1', '#ffffff', '#3a1a0a')
    sunken(RX0, RY0, RX1, RY1)

    groove_h(3, kit.W - 4, 281)
    led_board(8, 286, 118, 321, [('DROPPER WORLD', '#ffd23a'), ('A MOLE DROPS JELLY', '#4aff6a'), ('ON EVERYTHING!', '#4aff6a'), ('SADIE WANTS HAY.', '#4aff6a')])
    play_button(124, 286, 171, 321)
    groove_h(3, kit.W - 4, 325)
    keybar(9, 330, 172, [('F1', 'HELP'), ('F3', 'SOUND'), ('F5', 'ABOUT'), ('PGDN', 'MORE'), ('ESC', 'QUIT')], 13)
    kit.save(os.path.join(HERE, 'clubhouse-phone.png'))

    # =====================================================================================
    # 3. Inside an activity on a phone: the frame shrinks to a strip, the activity gets the screen
    kit.start(180, 360)
    frame()
    keycap(7, 7, 'ESC', '')
    text(26, 9, 'BACK', '#ffffff', '#12082e')
    logo(52, 6, 'DROPPER WORLD', 1, 2)
    groove_h(3, kit.W - 4, 20)
    BX0, BY0, BX1, BY1 = 6, 24, 173, 330
    GROUND = 300
    sky = [(0, '#2438e8'), (0.3, '#2f86ff'), (0.62, '#62d6ff'), (0.86, '#ffb2ea'), (1, '#ffe6a6')]
    for y in range(BY0, GROUND):
        for x in range(BX0, BX1 + 1):
            put(x, y, ramp(x, y, sky, (y - BY0) / (GROUND - BY0 - 20)))
    for x in range(BX0, BX1 + 1):
        far = GROUND - 40 + 7 * math.sin(x * 0.07) + 3 * math.sin(x * 0.2 + 1)
        for y in range(int(far), GROUND):
            put(x, y, ramp(x, y, [(0, '#9af0c8'), (1, '#52c89a')], (y - far) / 18) if y > far + 0.5 else '#2c9c78')
        for y in range(GROUND, BY1 + 1):
            dy = y - GROUND
            c = '#a8ff64' if dy == 0 else '#34d04a' if dy < 4 else '#6a2c10' if dy == 4 else ramp(x, y, [(0, '#d0782e'), (1, '#7a3814')], dy / 30)
            put(x, y, c)
    # a small pile of gummy pieces, Sadie on top, the mole overhead with one more
    PCOL = [['#6a0048', '#b8127a', '#ff34a4', '#ff84cc'], ['#0c5a18', '#18a038', '#36e04e', '#9aff9a'],
            ['#8a5a00', '#d0a000', '#ffe030', '#fff6a0'], ['#0a1a8a', '#1a4ae0', '#2f86ff', '#9ad0ff'],
            ['#4a0a8a', '#7a2ad0', '#b070ff', '#e0c8ff']]
    def gummy(x0, y0, w, h, pal):
        m = {}
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                if (x in (x0, x0 + w - 1)) and (y in (y0, y0 + h - 1)): continue
                n = (-(x - x0) / w + 0.5, -(y - y0) / h + 0.5, 0.7)
                m[(x, y)] = (0, tone(x, y, pal, 1.6 + 1.6 * (n[0] * 0.5 + n[1] * 0.9)))
        outline(m, pal[0], lambda x, y: BX0 <= x <= BX1 and BY0 <= y <= BY1)
        for i in range(3): put(x0 + 2 + i, y0 + 2, '#ffffff')
        put(x0 + 2, y0 + 3, '#ffffff')
    rnd = random.Random(5)
    for (gx, gy, w, h) in ((40, 286, 22, 14), (63, 288, 30, 12), (95, 284, 16, 16), (112, 290, 26, 10), (139, 286, 20, 14),
                           (52, 272, 16, 14), (70, 276, 24, 12), (96, 270, 18, 14), (118, 276, 24, 14),
                           (62, 260, 22, 16), (86, 258, 14, 12), (102, 256, 22, 14), (80, 246, 26, 12)):
        gummy(gx, gy, w, h, PCOL[rnd.randrange(5)])
    clip_b = lambda x, y: BX0 <= x <= BX1 and BY0 <= y <= BY1
    sad = build_sadie(88, 246)
    outline(sad, INK, clip_b); whiskers(88, 246, 1, clip_b)
    sprite_px(ICONS['mole'], 118, 70, 2)
    gummy(122, 92, 12, 14, PCOL[4])
    sunken(BX0, BY0, BX1, BY1)
    groove_h(3, kit.W - 4, 333)
    x = keycap(8, 339, 'F1', 'HELP')
    x = keycap(x, 339, 'F3', 'SOUND')
    # the activity's own stamp: the Toys button, in the same bar
    cbutton(128, 336, 171, 352, 'up')
    text(150 - text_w('TOYS') // 2 + 5, 342, 'TOYS', '#ffffff', '#12082e')
    for y in range(339, 350):
        for x in range(133, 143):
            d = math.hypot(x - 137.5, y - 344)
            if d < 4.8: put(x, y, '#d8ff30' if (x + y) % 3 else '#a0d010')
    kit.save(os.path.join(HERE, 'activity-phone.png'))
    print('ok')


if __name__ == '__main__':
    main()
