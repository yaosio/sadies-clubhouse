# Still mock-up 2 of the 90s style (the approved one): Sadie + a landed jelly piece inside a
# home-made DOS-game interface. See docs/dropper-world/look.md for the rules this follows.
# Drawn at 320x240 with a small palette and ordered dithering, then scaled up with hard pixels.
# Run: pip install pillow, then python3 art/90s-style/mockup-2.py
import math
from PIL import Image

W, H = 320, 240
SCALE = 4
OUT = __file__.replace('.py', '.png')
img = [[(255, 0, 255)] * W for _ in range(H)]

def hx(s):
    s = s.lstrip('#'); return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))

BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
def thr(x, y): return (BAYER[y & 3][x & 3] + 0.5) / 16

def put(x, y, c):
    if 0 <= x < W and 0 <= y < H: img[y][x] = hx(c) if isinstance(c, str) else c

def get(x, y): return img[y][x]

def dmix(x, y, a, b, t):  # ordered-dither between two colours
    return b if t > thr(x, y) else a

def ramp(x, y, stops, t):  # stops: [(pos, colour)], dithered between neighbours
    t = max(0.0, min(1.0, t))
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        if t <= p1:
            return dmix(x, y, c0, c1, (t - p0) / (p1 - p0) if p1 > p0 else 0)
    return stops[-1][1]

def tone(x, y, tones, v):  # v in 0..len-1, dithered between tone steps
    v = max(0.0, min(len(tones) - 1.001, v))
    i = int(v); return dmix(x, y, tones[i], tones[i + 1], v - i)

def rect(x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): put(x, y, c)

def bevel(x0, y0, x1, y1, raised=True, face='#c0c0c0', thick=1):
    rect(x0, y0, x1, y1, face)
    hi, lo = ('#ffffff', '#404040') if raised else ('#404040', '#ffffff')
    mid = '#808080'
    for i in range(thick):
        for x in range(x0 + i, x1 - i + 1): put(x, y0 + i, hi); put(x, y1 - i, lo if i == 0 else mid)
        for y in range(y0 + i, y1 - i + 1): put(x0 + i, y, hi); put(x1 - i, y, lo if i == 0 else mid)

# ---------- tiny 3x5 font ----------
FONT = {
 'A': '010101111101101', 'B': '110101110101110', 'C': '011100100100011', 'D': '110101101101110',
 'E': '111100110100111', 'F': '111100110100100', 'G': '011100101101011', 'H': '101101111101101',
 'I': '111010010010111', 'J': '001001001101010', 'K': '101101110101101', 'L': '100100100100111',
 'M': '101111111101101', 'N': '110101101101101', 'O': '010101101101010', 'P': '110101110100100',
 'Q': '010101101110011', 'R': '110101110101101', 'S': '011100010001110', 'T': '111010010010010',
 'U': '101101101101111', 'V': '101101101101010', 'W': '101101111111101', 'X': '101101010101101',
 'Y': '101101010010010', 'Z': '111001010100111', '0': '111101101101111', '1': '010110010010111',
 '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110',
 '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110',
 '.': '000000000000010', '!': '010010010000010', "'": '010010000000000', '(': '001010010010001',
 ')': '100010010010100', '-': '000000111000000', '$': '011110010011110', ':': '000010000010000',
 '?': '110001010000010', '/': '001001010100100', ' ': '000000000000000', '&': '010101010101011', '*': '000101010101000',
}
def text(x, y, s, c, shadow=None, s2=1):
    for ch in s:
        g = FONT[ch]
        for j in range(5):
            for i in range(3):
                if g[j * 3 + i] == '1':
                    for a in range(s2):
                        for b in range(s2):
                            if shadow: put(x + i * s2 + a + 1, y + j * s2 + b + 1, shadow)
                            put(x + i * s2 + a, y + j * s2 + b, c)
        x += 4 * s2
def text_w(s, s2=1): return len(s) * 4 * s2 - s2

# ---------- home-made DOS chrome: candy-purple panels, gold rivets, raster-bar logo ----------
FACE, FACE2, HI, HI2, LO, LO2, GOLD = '#3b2a8c', '#34257e', '#8a78ff', '#c8bcff', '#1c1050', '#0a0628', '#ffd23a'
def panel(x0, y0, x1, y1, raised=True, thick=2, face=None):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(x, y, face or (FACE2 if (x + 2 * y) % 5 == 0 else FACE))  # faint woven texture
    rings = [(HI2, LO2), (HI, LO)] if raised else [(LO2, HI2), (LO, HI)]
    for i in range(thick):
        a, b = rings[min(i, 1)]
        for x in range(x0 + i, x1 - i + 1): put(x, y0 + i, a); put(x, y1 - i, b)
        for y in range(y0 + i, y1 - i + 1): put(x0 + i, y, a); put(x1 - i, y, b)
def rivet(x, y):
    put(x, y, '#fff6b0'); put(x + 1, y, GOLD); put(x, y + 1, GOLD); put(x + 1, y + 1, '#9a6a08')
def groove_v(x, y0, y1):
    for y in range(y0, y1 + 1): put(x, y, LO2); put(x + 1, y, HI)
def groove_h(x0, x1, y):
    for x in range(x0, x1 + 1): put(x, y, LO2); put(x, y + 1, HI)

panel(0, 0, W - 1, H - 1, True, 3)
for (x, y) in ((4, 4), (W - 6, 4), (4, H - 6), (W - 6, H - 6)):
    rivet(x, y)

LOGO_ROWS = ['#fffbd0', '#fff27a', '#ffe23a', '#ffc81e', '#ffa41e', '#ff7a2a', '#ff5446', '#ff3a78',
             '#f030a8', '#c830d0', '#9a3ce8', '#7a52f4', '#fff27a', '#ffc81e', '#ff7a2a']
def logo(x, y, s, sx=2, sy=3):
    lit = {}
    cx = x
    for ch in s:
        g = FONT[ch]
        for j in range(5):
            for i in range(3):
                if g[j * 3 + i] == '1':
                    for a in range(sx):
                        for b in range(sy): lit[(cx + i * sx + a, y + j * sy + b)] = j * sy + b
        cx += 4 * sx
    for (px, py) in lit:  # hard drop shadow
        for d in (1, 2, 3): put(px + d, py + d, LO2)
    for (px, py) in lit:  # thick outline
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                if (px + dx, py + dy) not in lit: put(px + dx, py + dy, '#12082e')
    for (px, py), row in lit.items():  # copper-bar gradient, one colour per scanline
        put(px, py, LOGO_ROWS[row])
    for (px, py), row in lit.items():  # a chrome glint on the top edge of each letter
        if (px, py - 1) not in lit and row < 3 and (px + py) % 3 == 0: put(px, py, '#ffffff')
logo(10, 8, "SADIE'S DROPPER WORLD")
panel(222, 6, 313, 25, False, 1, '#140a3a')
text(226, 9, 'SHAREWARE V0.9 BETA', '#2ee6d6')
text(226, 17, 'PLEASE COPY & SHARE!', '#ff8ce0')
groove_h(3, W - 4, 28)

# ---------- scene ----------
SX0, SY0, SX1, SY1 = 31, 32, 315, 175
GROUND = 146  # top of grass (absolute y)

def in_scene(x, y): return SX0 <= x <= SX1 and SY0 <= y <= SY1

sky = [(0, '#2438e8'), (0.3, '#2f86ff'), (0.62, '#62d6ff'), (0.86, '#ffb2ea'), (1, '#ffe6a6')]
for y in range(SY0, GROUND):
    for x in range(SX0, SX1 + 1):
        put(x, y, ramp(x, y, sky, (y - SY0) / (GROUND - SY0 - 10)))

# sun + lens flare (a late-90s effect in an early-90s sky)
sunx, suny = 62, 54
for y in range(SY0, GROUND):
    for x in range(SX0, SX1 + 1):
        d = math.hypot(x - sunx, y - suny)
        if d < 14: put(x, y, ramp(x, y, [(0, '#ffffff'), (0.45, '#fff45a'), (0.8, '#ffc81e'), (1, '#ff8a1e')], d / 14))
        elif d < 22 and (x + y) % 2 == 0 and thr(x, y) < (22 - d) / 10: put(x, y, '#fff6b0')
for k in range(12):  # chunky rays
    a = k * math.pi / 6 + 0.12
    for r in range(17, 25 if k % 2 else 21):
        put(int(sunx + math.cos(a) * r), int(suny + math.sin(a) * r), '#fff45a')
fl_dx, fl_dy = 230 - sunx, GROUND - 24 - suny
for t, r, col in [(0.22, 4, '#ffffff'), (0.38, 8, '#ff9ef0'), (0.5, 3, '#b0ffff'), (0.72, 12, '#c8a0ff')]:
    cx, cy = sunx + fl_dx * t, suny + fl_dy * t
    for y in range(int(cy - r - 1), int(cy + r + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            d = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
            if in_scene(x, y) and y < GROUND - 1:
                if abs(d - r) < 0.6: put(x, y, col)
                elif d < r and (x + y) % 2 == 0 and (x // 2 + y) % 2 == 0: put(x, y, col)

# clouds: lumpy, outlined, dither-shaded underneath
def cloud(cx, cy, puffs):
    mask = set()
    for dx, dy, r in puffs:
        for y in range(int(cy + dy - r - 1), int(cy + dy + r + 2)):
            for x in range(int(cx + dx - r - 1), int(cx + dx + r + 2)):
                if math.hypot(x + 0.5 - cx - dx, y + 0.5 - cy - dy) < r: mask.add((x, y))
    for (x, y) in mask:
        put(x, y, ramp(x, y, [(0, '#ffffff'), (0.55, '#ffffff'), (1, '#b8d4ff')], (y - cy + 6) / 12))
    for (x, y) in mask:
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if (nx, ny) not in mask and in_scene(nx, ny): put(nx, ny, '#3050d8')
cloud(160, 48, [(-14, 3, 7), (-4, -2, 9), (8, 0, 8), (17, 4, 6), (0, 5, 7)])
cloud(262, 70, [(-10, 2, 6), (0, -2, 8), (10, 2, 6)])
cloud(118, 90, [(-5, 1, 4), (2, -1, 5), (8, 1, 4)])

# rolling hills, far then near
for x in range(SX0, SX1 + 1):
    far = GROUND - 34 + 7 * math.sin(x * 0.045) + 4 * math.sin(x * 0.11 + 1)
    near = GROUND - 16 + 6 * math.sin(x * 0.03 + 2) + 3 * math.sin(x * 0.09)
    for y in range(int(far), GROUND):
        put(x, y, ramp(x, y, [(0, '#9af0c8'), (1, '#52c89a')], (y - far) / 18) if y > far + 0.5 else '#2c9c78')
    for y in range(int(near), GROUND):
        put(x, y, ramp(x, y, [(0, '#6ef06a'), (1, '#28b048')], (y - near) / 14) if y > near + 0.5 else '#16804a')

# grass + dirt with candy bits (the candy bedrock, deep down)
for x in range(SX0, SX1 + 1):
    tuft = 2 if (x * 7 % 11) < 3 else (1 if x % 3 == 0 else 0)
    for y in range(GROUND - tuft, GROUND):
        put(x, y, '#a8ff64')
    for y in range(GROUND, SY1 + 1):
        dy = y - GROUND
        if dy == 0: c = '#a8ff64'
        elif dy < 4: c = '#34d04a'
        elif dy < 6: c = dmix(x, y, '#34d04a', '#18903a', 0.5)
        elif dy == 6: c = '#6a2c10'
        else:
            n = (math.sin(x * 0.7 + y * 1.3) + math.sin(x * 0.23 - y * 0.5)) * 0.25 + 0.5
            c = ramp(x, y, [(0, '#d0782e'), (0.6, '#a85424'), (1, '#7a3814')], n * 0.6 + dy / 60)
        put(x, y, c)
import random
random.seed(7)
for _ in range(38):
    x, y = random.randint(SX0 + 2, SX1 - 3), random.randint(GROUND + 9, SY1 - 2)
    kind = random.random()
    if kind < 0.5:  # pebble
        put(x, y, '#ffd08a'); put(x + 1, y, '#e0a060'); put(x, y + 1, '#c07a40'); put(x + 1, y + 1, '#8a4a1c')
    else:  # candy speck
        col = random.choice(['#ff4fc0', '#40e8ff', '#fff050', '#b070ff'])
        put(x, y, '#ffffff'); put(x + 1, y, col); put(x, y + 1, col); put(x + 1, y + 1, col)

# ---------- sprites (drawn into a label map, then outlined and shaded) ----------
L3 = (-0.45, -0.75, 0.5); _l = math.sqrt(sum(v * v for v in L3)); L3 = tuple(v / _l for v in L3)
def light(nx, ny, nz):
    return nx * L3[0] + ny * L3[1] + nz * L3[2]
def ell_n(x, y, cx, cy, rx, ry):
    nx, ny = (x - cx) / rx, (y - cy) / ry
    nz = math.sqrt(max(0.0, 1 - nx * nx - ny * ny)); return nx, ny, nz

def shadow_ellipse(cx, cy, rx, ry):
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            e = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2
            if e < 1 and thr(x, y) < 0.55 * (1 - e) + 0.25:
                r, g, b = get(x, y); put(x, y, (int(r * 0.55), int(g * 0.6), int(b * 0.75)))

def outline(sprite, ink, clip=None):
    clip = clip or in_scene
    # sprite: {(x,y): (group, colour)}. Outer outline outside; inner lines on the back part.
    out = {}
    for (x, y), (g, c) in sprite.items():
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            o = sprite.get((nx, ny))
            if o is None: out[(nx, ny)] = ink
            elif o[0] > g: out[(x, y)] = ink
    for (x, y), (g, c) in sprite.items():
        if (x, y) not in out and clip(x, y): put(x, y, c)
    for (x, y), c in out.items():
        if clip(x, y): put(x, y, c)

# --- Sadie (white dilute calico, grey cap/back patch/eye patch, split nose, unimpressed) ---
WHITE = ['#9c8cc4', '#d4c6ec', '#fff3ea', '#ffffff']
GRAY = ['#4a4462', '#6a6480', '#8f8a9b', '#b4aec4']
PINK = ['#c87898', '#f4a7b6', '#ffd0dc']
INK = '#3a2658'

def tri(p, a, b, c):
    def s(p1, p2, p3): return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])
    d1, d2, d3 = s(p, a, b), s(p, b, c), s(p, c, a)
    return not ((d1 < 0 or d2 < 0 or d3 < 0) and (d1 > 0 or d2 > 0 or d3 > 0))

def build_sadie(OX, OY, S=1):
    sad = {}
    def sp(x, y, g, c): sad[(OX + x, OY + y)] = (g, c)
    def spd(x, y, g, c):  # a detail pixel at base size, stretched to S
        for fy in range(round(y * S), round((y + 1) * S)):
            for fx in range(round(x * S), round((x + 1) * S)):
                cc = c
                if c == 'BLUSH':
                    if (OX + fx + OY + fy) % 2: continue
                    cc = '#ff9cc0'
                sad[(OX + fx, OY + fy)] = (g, cc)
    for y in range(int(-42 * S), int(S) + 1):
        for x in range(int(-26 * S), int(26 * S)):
            px, py = (x + 0.5) / S, (y + 0.5) / S
            X, Y = OX + x, OY + y
            # tail (group 0): curls up behind her
            for i in range(24):
                t = i / 23
                bx = (1 - t) ** 2 * -11 + 2 * (1 - t) * t * -24 + t * t * -18
                by = (1 - t) ** 2 * -15 + 2 * (1 - t) * t * -16 + t * t * -31
                if math.hypot(px - bx, py - by) < 2.1 - 0.4 * t:
                    sp(x, y, 0, tone(X, Y, GRAY, 1.6 + 0.8 * (1 - t) * 0 + (0.6 if px - bx < 0 else 0)))
                    break
            # far legs (group 1), shaded darker
            for lx in (-6, 9):
                if abs(px - lx) < 2.1 and -9 < py <= 0: sp(x, y, 1, tone(X, Y, WHITE, 1.1 + 0.2 * (px - lx)))
            # body (group 2)
            e = ((px + 1) / 13.5) ** 2 + ((py + 13) / 7.5) ** 2
            if e < 1:
                n = ell_n(px, py, -1, -13, 13.5, 7.5)
                v = 1.5 + 1.9 * light(*n)
                patch = ((px + 5) / 8.5) ** 2 + ((py + 18.5 + 0.8 * math.sin(px * 0.9)) / 4.6) ** 2 < 1
                sp(x, y, 2, tone(X, Y, GRAY if patch else WHITE, v))
            # near legs + paws (group 3)
            for lx in (-10, 5):
                if (abs(px - lx) < 2.2 and -10 < py <= -1) or (((px - lx - 0.6) / 2.9) ** 2 + ((py + 1.2) / 1.6) ** 2 < 1):
                    sp(x, y, 3, tone(X, Y, WHITE, 1.9 - 0.35 * (px - lx) + (0.4 if py > -3 else 0)))
            # head + ears (group 4): face always toward the viewer
            hcx, hcy = 13, -24
            head = ((px - hcx) / 9.2) ** 2 + ((py - hcy) / 8) ** 2 < 1 or ((px - hcx) / 10) ** 2 + ((py + 20) / 4.6) ** 2 < 1
            earL, earR = ((4.5, -27), (6, -38), (11.5, -30.5)), ((14.5, -30.5), (20, -38), (21.5, -27))
            inL = tri((px, py), (6.5, -29), (7, -35), (10, -30.5))
            inR = tri((px, py), (16, -30.5), (19, -35), (19.5, -29))
            if head or tri((px, py), *earL) or tri((px, py), *earR):
                n = ell_n(px, py, hcx, hcy - 1, 11, 11)
                v = 1.4 + 2.0 * light(*n)
                cap = py < -27.2 + 1.3 * math.sin((px - 6) * 0.7) or not head
                patch = ((px - 16.4) / 3.9) ** 2 + ((py + 24.2) / 3.4) ** 2 < 1
                if inL or inR: c = tone(X, Y, PINK, 1.2 - (0.3 if py < -33 else 0))
                else: c = tone(X, Y, GRAY if (cap or patch) else WHITE, v)
                sp(x, y, 4, c)

    # face details
    for (ex, ey) in ((8, -24), (15, -24)):
        for i in range(4):
            spd(ex + i, ey, 4, INK)                          # heavy upper lid: half-lidded stare
        spd(ex, ey + 1, 4, '#c4c96a'); spd(ex + 1, ey + 1, 4, '#2b2233')
        spd(ex + 2, ey + 1, 4, '#2b2233'); spd(ex + 3, ey + 1, 4, '#9aa048')
        spd(ex + 1, ey - 1, 4, tone(OX + ex, OY + ey, GRAY if ex > 12 else WHITE, 1.2))  # lid fur
        spd(ex + 2, ey - 1, 4, tone(OX + ex, OY + ey, GRAY if ex > 12 else WHITE, 1.2))
    spd(12, -21, 4, '#6a6480'); spd(13, -21, 4, '#e7b688')    # nose, split grey and tan
    spd(12, -20, 4, '#4a3440'); spd(13, -20, 4, '#4a3440')
    spd(11, -19, 4, INK); spd(14, -19, 4, INK)                 # flat little "w" mouth
    for (bx, by) in ((6, -20), (19, -20)):                   # cheek blush, checker dithered
        for dx in range(-1, 3):
            for dy in range(0, 2):
                spd(bx + dx, by + dy, 4, 'BLUSH')
    if S > 1:  # at portrait size there's room for a catchlight
        for (ex, ey) in ((8, -24), (15, -24)): sad[(OX + round((ex + 1) * S), OY + round((ey + 1) * S))] = (4, '#ffffff')
    return sad

def whiskers(OX, OY, S, clip):
    for (ax, ay, bx2, by2) in ((3, -21, -2, -22), (3, -19, -2, -18), (23, -21, 28, -22), (23, -19, 28, -18)):
        n = int(6 * S)
        for i in range(n):
            t = i / (n - 1)
            x, y = OX + round((ax + (bx2 - ax) * t) * S), OY + round((ay + (by2 - ay) * t) * S)
            if clip(x, y): put(x, y, '#6a6480')

SX, SY = 128, GROUND  # her feet
sad = build_sadie(SX, SY)
shadow_ellipse(SX + 1, SY + 1, 17, 3)
outline(sad, INK)
whiskers(SX, SY, 1, in_scene)

# --- jelly piece: an L piece, just landed and squished wide ---
JEL = ['#6a0048', '#b8127a', '#ff34a4', '#ff84cc', '#ffd0ec']
JINK = '#4a0036'
CELL = 15
BX, BY = 176, GROUND  # left edge of piece, sitting on the ground
cells = [(0, 0), (1, 0), (2, 0), (2, 1)]  # (col, row-up)
def sd_box(px, py, cx, cy, h, r):
    qx, qy = abs(px - cx) - h + r, abs(py - cy) - h + r
    return math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0) - r
def sd_rect(px, py, cx, cy, hx_, hy_):
    qx, qy = abs(px - cx) - hx_, abs(py - cy) - hy_
    return math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0)
def smin(a, b, k):
    h = max(k - abs(a - b), 0) / k; return min(a, b) - h * h * k * 0.25
HW = 3 * CELL / 2
def jelly_sd(px, py):
    # undo the squash: wider and shorter, bulging most at mid-height
    hgt = (BY - py) / (2 * CELL * 0.8)
    sx = 1.12 + 0.07 * math.sin(math.pi * max(0, min(1, hgt)))
    ux = (px - (BX + HW)) / sx + HW
    uy = (BY - py) / 0.8
    R = 4.5  # one gummy shape: sharp bars shrunk by R, filleted together, then puffed back out
    bar = sd_rect(ux, uy, 1.5 * CELL, CELL / 2, 1.5 * CELL - R, CELL / 2 - R)
    col = sd_rect(ux, uy, 2.5 * CELL, CELL, CELL / 2 - R, CELL - R)
    return smin(bar, col, 7) - R
jel = {}
for y in range(BY - 30, BY + 1):
    for x in range(BX - 8, BX + 60):
        px, py = x + 0.5, y + 0.5
        d = jelly_sd(px, py)
        if d < 0:
            e = 0.6
            gx = (jelly_sd(px + e, py) - jelly_sd(px - e, py)) / (2 * e)
            gy = (jelly_sd(px, py + e) - jelly_sd(px, py - e)) / (2 * e)
            gl = math.hypot(gx, gy) or 1
            depth = min(1, -d / 5.5)
            nz = depth; s = math.sqrt(max(0, 1 - nz * nz))
            n = (gx / gl * s, gy / gl * s, nz)
            v = 2.0 + 1.6 * light(*n)
            if -d < 1.8 and gx > 0.3 and gy > 0.3: v = 3.0  # glossy rim light, bottom-right
            jel[(x, y)] = (0, tone(x, y, JEL, v))
shadow_ellipse(BX + HW + 1, BY + 1, 33, 3)
outline(jel, JINK)
# gummy shine per block (solid core, dithered falloff) + one sparkle
def squashed(cx_u, cy_u):
    hgt = cy_u / (2 * CELL)
    sx = 1.12 + 0.07 * math.sin(math.pi * max(0, min(1, hgt)))
    return BX + HW + (cx_u - HW) * sx, BY - cy_u * 0.8
for (c, r) in cells:
    sx_, sy_ = squashed(c * CELL + 4.5, r * CELL + CELL - 4.5)
    for y in range(int(sy_ - 3), int(sy_ + 3)):
        for x in range(int(sx_ - 4), int(sx_ + 5)):
            e = ((x + 0.5 - sx_) / 3.6) ** 2 + ((y + 0.5 - sy_) / 1.9) ** 2
            if e < 0.45: put(x, y, '#ffffff')
            elif e < 1 and thr(x, y) < 0.5: put(x, y, '#ffffff')
spx, spy = squashed(2 * CELL + 5, 2 * CELL - 3)
spx, spy = int(spx) + 3, int(spy) - 4
for i in range(-4, 5):
    c = '#ffffff' if abs(i) < 3 else '#ffe6f6'
    put(spx + i, spy, c); put(spx, spy + i, c)
put(spx - 1, spy - 1, '#ffe6f6'); put(spx + 1, spy + 1, '#ffe6f6'); put(spx + 1, spy - 1, '#ffe6f6'); put(spx - 1, spy + 1, '#ffe6f6')

# impact: dust puffs at the base and "boing" marks
def puff(cx, cy, r):
    m = {}
    for y in range(int(cy - r - 1), int(cy + r + 1)):
        for x in range(int(cx - r - 1), int(cx + r + 1)):
            d = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
            if d < r: m[(x, y)] = (0, dmix(x, y, '#fff6dc', '#e8c49a', (y - cy + r) / (2 * r)))
    outline(m, '#8a5a3a')
lx0, rx0 = int(squashed(0, 0)[0]), int(squashed(3 * CELL, 0)[0])
for (cx, cy, r) in ((lx0 - 4, GROUND - 3, 3.2), (lx0 - 9, GROUND - 2, 2.2), (rx0 + 4, GROUND - 3, 3.2), (rx0 + 9, GROUND - 2, 2.4)):
    puff(cx, cy, r)
for (x0, y0, dx, dy) in ((lx0 - 6, GROUND - 13, -1, -1), (lx0 - 3, GROUND - 19, 0, -1), (rx0 + 5, GROUND - 13, 1, -1), (rx0 + 2, GROUND - 19, 0, -1)):
    for i in range(4): put(x0 + dx * i, y0 + dy * i, '#ffffff'); put(x0 + dx * i + 1, y0 + dy * i, INK)

# sunken border round the scene
for x in range(SX0 - 1, SX1 + 2): put(x, SY0 - 1, '#12082e'); put(x, SY1 + 1, HI2)
for y in range(SY0 - 1, SY1 + 2): put(SX0 - 1, y, '#12082e'); put(SX1 + 1, y, HI2)
for x in range(SX0 - 2, SX1 + 3): put(x, SY0 - 2, LO); put(x, SY1 + 2, HI)
for y in range(SY0 - 2, SY1 + 3): put(SX0 - 2, y, LO); put(SX1 + 2, y, HI)

# ---------- stamp toolbar: chunky home-made buttons (two locked: "full version only") ----------
ICONS = {
 'mole': ['....RB....', '...RRBB...', '..RRRBBB..', '.YYYYYYYY.', '.bbbbbbbb.', 'bbbwbbwbbb',
          'bbbkbbkbbb', 'bbbbppbbbb', '.bbbbbbbb.', '..bbbbbb..'],
 'jelly': ['.gggggggg.', 'gwwGGGGGGg', 'gwGGGGGGGg', 'gGGGGGGGGg', 'gGGGGGGGGg', 'gGGGGGGGGg',
           'gGGGGGGGhg', 'gGGGGGGhhg', '.gggggggg.', '..........'],
 'hay': ['..........', '.yyyyyyyy.', 'yYYYYYYYYy', 'yYyYYyYYYy', 'yrrrrrrrry', 'yYYyYYYyYy',
         'yYYYYyYYYy', 'yrrrrrrrry', 'yYyYYYyYYy', '.yyyyyyyy.'],
 'paw': ['..k..k....', '.kpk.kpk..', '..k..k....', 'k......k..', 'pk.kk.kp..', 'k.kppk.k..',
         '..kpppk...', '..kpppk...', '...kkk....', '..........'],
 'boom': ['......o.o.', '.......y..', '......k...', '.....k....', '..RRRRR...', '.RRwRRRR..',
          '.RRRRRRR..', '.RRRRRRR..', '..RRRRR...', '..........'],
 'star': ['....y.....', '....y.....', '...yyy....', 'yyyyYyyyy.', '.yyYYYyy..', '..yYYYy...',
          '..yy.yy...', '.yy...yy..', '.y.....y..', '..........'],
}
IC = {'R': '#ff2a2a', 'B': '#2a5cff', 'Y': '#ffe030', 'b': '#9a5a2e', 'w': '#ffffff', 'k': '#1a1030',
      'p': '#ff8cb8', 'g': '#0c7a20', 'G': '#36e04e', 'h': '#1aa838', 'y': '#c89a10', 'r': '#a87408',
      'o': '#ff9020'}
PADLOCK = ['.ooo.', 'o...o', 'ggggg', 'gGkGg', 'gGGGg', 'ggggg']
def cbutton(x0, y0, x1, y1, state):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if (x in (x0, x1)) and (y in (y0, y1)): continue  # rounded corners
            t = (y - y0) / (y1 - y0)
            if state == 'on':
                c = ramp(x, y, [(0, '#fff6b0'), (0.5, '#ffd23a'), (1, '#ff9a1e')], t)
                edge_hi, edge_lo = '#fffbe0', '#8a4a00'
            elif state == 'locked':
                c = ramp(x, y, [(0, '#2c2070'), (1, '#1e1458')], t); edge_hi, edge_lo = '#4a3ca0', LO2
            else:
                c = ramp(x, y, [(0, '#6a58d8'), (1, '#4432a8')], t); edge_hi, edge_lo = HI2, LO2
            if y == y0 or x == x0: c = edge_hi
            if y == y1 or x == x1: c = edge_lo
            put(x, y, c)
panel(3, 30, 28, 177, False, 1)
for k, name in enumerate(['mole', 'jelly', 'hay', 'paw', 'boom', 'star']):
    x0, y0 = 5, 33 + k * 24
    state = 'on' if name == 'jelly' else ('locked' if name in ('boom', 'star') else 'up')
    cbutton(x0, y0, x0 + 21, y0 + 21, state)
    for j, row in enumerate(ICONS[name]):
        for i, ch in enumerate(row):
            if ch == '.': continue
            X, Y = x0 + 6 + i, y0 + 6 + j
            if state == 'locked': put(X + 1, Y + 1, '#4a3ca0'); put(X, Y, '#120a38')
            else: put(X + 1, Y + 1, '#12082e'); put(X, Y, IC[ch])
    if state == 'locked':
        for j, row in enumerate(PADLOCK):
            for i, ch in enumerate(row):
                if ch != '.': put(x0 + 15 + i, y0 + 14 + j, {'o': '#c8c8d8', 'g': '#9a6a08', 'G': GOLD, 'k': '#12082e'}[ch])

# ---------- status panel (a DOS action-game dashboard, for a cat) ----------
groove_h(3, W - 4, 178)
# portrait: Sadie's face, redrawn bigger
PX0, PY0, PX1, PY1 = 6, 183, 45, 220
panel(PX0 - 1, PY0 - 1, PX1 + 1, PY1 + 1, False, 1)
for y in range(PY0, PY1 + 1):
    for x in range(PX0, PX1 + 1):
        put(x, y, ramp(x, y, [(0, '#2ee6d6'), (0.55, '#3a8cf0'), (1, '#3b2a8c')], (y - PY0) / (PY1 - PY0)))
in_port = lambda x, y: PX0 <= x <= PX1 and PY0 <= y <= PY1
portrait = build_sadie(9, 241, 1.5)
outline(portrait, INK, in_port)
whiskers(9, 241, 1.5, in_port)
for (x, y) in ((PX0 - 1, PY0 - 1), (PX1 + 1, PY0 - 1), (PX0 - 1, PY1 + 1), (PX1 + 1, PY1 + 1)):
    put(x, y, GOLD)

groove_v(49, 181, 221)
# piece supply: 5 slots, 3 full, refilling
text(54, 184, 'PIECES', GOLD, '#12082e')
def mini_jelly(x0, y0, full):
    for y in range(9):
        for x in range(12):
            corner = (x in (0, 11)) and (y in (0, 8))
            if corner: continue
            edge = x in (0, 11) or y in (0, 8)
            if full:
                c = '#4a0036' if edge else ramp(x0 + x, y0 + y, [(0, '#ff84cc'), (0.5, '#ff34a4'), (1, '#b8127a')], y / 8)
                if not edge and y in (1, 2) and x in (1, 2, 3) and not (y == 2 and x == 3): c = '#ffffff'
            else:
                c = HI if edge else ('#1c1050' if (x0 + x + y0 + y) % 2 else FACE)
            put(x0 + x, y0 + y, c)
for k in range(5):
    mini_jelly(54 + k * 14, 193, k < 3)
text(54, 206, 'NEXT', HI2)
for x in range(72, 121):  # refill bar, dithered fill
    for y in (206, 207, 208, 209, 210):
        edge = y in (206, 210) or x in (72, 120)
        c = HI if edge else (ramp(x, y, [(0, '#2ee6d6'), (1, '#b0fff6')], (x - 72) / 30) if x < 104 else '#140a3a')
        put(x, y, c)

groove_v(126, 181, 221)
# Sadie's mood and hunger
text(131, 184, 'SADIE', GOLD, '#12082e')
text(131, 193, 'UNIMPRESSED', '#ff8ce0')
hay = ['.yyyyy.', 'yYyYYyy', 'rrrrrrr', 'yYYyYYy', '.yyyyy.']
for j, row in enumerate(hay):
    for i, ch in enumerate(row):
        if ch != '.': put(131 + i, 204 + j, IC[ch])
for k in range(10):  # hunger meter: chunky segments, green to red
    x0 = 141 + k * 6
    col = ['#36e04e', '#36e04e', '#8ae83a', '#c8e830', '#ffe030', '#ffb01e', '#ff7a1e', '#ff4a2a', '#ff2a2a', '#d0102a'][k]
    lit = k < 6
    for y in range(203, 210):
        for x in range(x0, x0 + 5):
            edge = y in (203, 209) or x in (x0, x0 + 4)
            put(x, y, '#12082e' if edge else (col if lit else ('#1c1050' if (x + y) % 2 else FACE)))
    if lit:
        put(x0 + 1, 204, '#ffffff'); put(x0 + 2, 204, '#ffffff')
text(131, 213, 'HUNGER', HI2)

groove_v(204, 181, 221)
# LED message board
LX0, LY0, LX1, LY1 = 209, 183, 313, 220
panel(LX0 - 1, LY0 - 1, LX1 + 1, LY1 + 1, False, 1, '#06140a')
for y in range(LY0, LY1 + 1):
    for x in range(LX0, LX1 + 1):
        put(x, y, '#0e2a14' if (x % 2 == 0 and y % 2 == 0) else '#06140a')
def led(y, s, c):
    text((LX0 + LX1) // 2 - text_w(s) // 2, y, s, c)
led(186, '** CHAPTER 2 **', '#ffd23a')
led(194, 'COMING SOON 1996!', '#4aff6a')
led(202, 'MORE FRIENDS!', '#4aff6a')
led(210, 'MORE PIECES!', '#4aff6a')
for x in range(LX0, LX1 + 1):  # scanline glare across the top
    if x % 2 == 0: put(x, LY0, '#1c4a24')

# ---------- F-key bar ----------
groove_h(3, W - 4, 222)
kx = 8
for key, label, dim in (('F1', 'HELP', False), ('F2', 'SAVE (FULL VER.)', True), ('F3', 'SOUND', False),
                        ('F5', 'ABOUT', False), ('ESC', 'QUIT', False)):
    kw = text_w(key) + 5
    for y in range(225, 235):
        for x in range(kx, kx + kw):
            c = '#e8e0ff' if y < 229 else '#c8bcff'
            if y == 225 or x == kx: c = '#ffffff'
            if y == 234 or x == kx + kw - 1: c = '#6a58d8'
            put(x, y, c)
    text(kx + 3, 227, key, '#12082e')
    text(kx + kw + 3, 228, label, '#6a58d8' if dim else '#ffffff', '#12082e')
    kx += kw + text_w(label) + 12

big = Image.new('RGB', (W, H))
big.putdata([p for row in img for p in row])
big = big.resize((W * SCALE, H * SCALE), Image.NEAREST)
big.save(OUT)
print('ok')
