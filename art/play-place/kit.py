# Shared drawing kit for the Play Place mock-ups: the approved 90s look from
# art/90s-style/mockup-2.py (palette, dithering, 3x5 font, candy-purple panels, raster-bar logo,
# stamp buttons, Sadie), made to draw on any canvas size. Needs pillow (pip install pillow).
import math
from PIL import Image

W, H = 320, 240
img = []
def start(w, h):
    global W, H, img
    W, H = w, h
    img[:] = [[(255, 0, 255)] * w for _ in range(h)]
def save(path, scale=4):
    big = Image.new('RGB', (W, H))
    big.putdata([p for row in img for p in row])
    big.resize((W * scale, H * scale), Image.NEAREST).save(path)
def in_scene(x, y): return 0 <= x < W and 0 <= y < H  # default clip; callers pass their own

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
