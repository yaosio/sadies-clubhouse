# The clubhouse menu again, in pseudo-3D: a real room in perspective (back wall, side walls, a
# checkered floor running off into the distance, a cubby shelf with depth), worked out per pixel
# like a 90s raycaster, then shaded with the same dithered tones as everything else. Sadie and the
# cursor are flat sprites on top, the way 90s games mixed 3D rooms with 2D characters.
# Run: pip install pillow, then python3 art/play-place/clubhouse3d.py
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit
from kit import put, ramp, tone, thr, text, text_w, panel, groove_h, logo, build_sadie, outline, whiskers, ICONS, PADLOCK, GOLD, INK
import clubhouse as cb

HERE = os.path.dirname(os.path.abspath(__file__))

def hx(c): return kit.hx(c) if isinstance(c, str) else c

def grab(w, h, draw):
    """Draw a little picture with the kit and keep it as a texture (rows of colours)."""
    kit.start(w, h); draw()
    return [row[:] for row in kit.img]

def sample(tex, s, t):  # s, t in 0..1 (wrapping), nearest pixel
    h, w = len(tex), len(tex[0])
    return tex[int((t % 1) * h) % h][int((s % 1) * w) % w]

def shade(x, y, c, k):
    """Light a colour by k (1 = as drawn), in dithered steps so it stays 90s."""
    c = hx(c)
    steps = [0.42, 0.56, 0.7, 0.85, 1.0, 1.12]
    k = max(steps[0], min(steps[-1], k))
    for a, b in zip(steps, steps[1:]):
        if k <= b:
            f = a if (k - a) / (b - a) < thr(x, y) else b
            break
    if f <= 1: return (int(c[0] * f), int(c[1] * f * 0.97), int(min(255, c[2] * f + (1 - f) * 40)))  # shadows lean purple
    return tuple(min(255, int(v + (255 - v) * (f - 1) * 1.6)) for v in c)

# ---------- textures, drawn with the same kit as the flat mock-up ----------
def _wall():
    kit.rect(0, 0, 41, 41, '#2ed0c0')
    for (gx, gy, k) in ((3, 4, 0), (24, 6, 1), (14, 18, 2), (33, 24, 0), (5, 30, 1), (22, 34, 2)):
        if k == 0:
            for i in range(7): put(gx + i, gy + (1 if i % 4 in (1, 2) else 0), '#ff4fb0')
        elif k == 1:
            for j in range(3):
                for i in range(-j, j + 1): put(gx + 3 + i, gy + j, '#ffe030')
        else:
            put(gx, gy, '#7a3ce8'); put(gx + 1, gy, '#7a3ce8'); put(gx + 3, gy + 2, '#ff7a2a')
WALLTEX = grab(42, 42, _wall)
POSTER = grab(30, 30, lambda: [kit.rect(0, 0, 29, 29, '#9a3ce8'),
                                [put(x, y, ramp(x, y, [(0, '#ff84cc'), (1, '#9a3ce8')], y / 30)) for y in range(30) for x in range(30)],
                                cb.sprite_px(ICONS['mole'], 10, 4), text(3, 17, 'DIG IT', '#fff27a', '#3a1040')])
def _dropper(w, h):
    band = 8
    for y in range(h):
        for x in range(w): put(x, y, ramp(x, y, [(0, '#62d6ff'), (1, '#2f86ff')], y / h))
    cb.dropper_art(1, 1, w - 2, h - band - 2)
    for y in range(h - band - 1, h):
        for x in range(w): put(x, y, tone(x, y, ['#8a0a50', '#c8127a', '#ff34a4'], 1.5))
    text(w // 2 - text_w('DROPPER') // 2, h - band + 1, 'DROPPER', '#ffffff', '#12082e')
    for x in range(w): put(x, 0, '#ffffff')
    for y in range(h): put(0, y, '#ffffff')
def _card(w, h):
    kit.rect(0, 0, w - 1, h - 1, '#fff6b0')
    for k, s in enumerate(('SOON', '1996!')): text(w // 2 - text_w(s) // 2, h // 2 - 7 + k * 8, s, '#ff3a78' if k else '#2438e8')
    for i in range(4): put(2 + i, 0, '#b8d4ff'); put(w - 6 + i, 0, '#b8d4ff')
# Box fronts and the card are drawn at exactly the size they come out on screen (worked out from
# the camera), so their writing stays sharp: the 90s trick of pre-drawn art pasted into 3D.
TEX = {}
DRAW = {'dropper': _dropper, 'card': _card}

# ---------- the room (metres; y up, z away from the camera) ----------
RW, RH, ZB = 1.6, 2.4, 3.3           # half width, ceiling height, back wall
FLOOR = [('#ffe27a', '#ff84cc')]      # checker tiles
LIGHT = (-0.45, 0.75, -0.5); _l = math.sqrt(sum(v * v for v in LIGHT)); LIGHT = tuple(v / _l for v in LIGHT)

def lit(n): return 0.62 + 0.55 * max(0.0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2])

def build_shelf(x0, cols, rows, cw=0.58, ch=0.46, t=0.05, depth=0.4, kick=0.07):
    W = cols * cw + (cols + 1) * t
    Hs = kick + rows * ch + (rows + 1) * t
    zf = ZB - depth
    parts = [((x0, 0, ZB - 0.03), (x0 + W, Hs, ZB), 'back'),
             ((x0, 0, zf), (x0 + W, kick + t, ZB), 'wood'),
             ((x0, Hs - t, zf), (x0 + W, Hs, ZB), 'wood'),
             ((x0, 0, zf), (x0 + t, Hs, ZB), 'wood'),
             ((x0 + W - t, 0, zf), (x0 + W, Hs, ZB), 'wood')]
    for r in range(1, rows):
        y = kick + r * (ch + t)
        parts.append(((x0, y, zf), (x0 + W, y + t, ZB), 'wood'))
    for c in range(1, cols):
        x = x0 + c * (cw + t)
        parts.append(((x, 0, zf), (x + t, Hs, ZB), 'wood'))
    cells = []  # front opening of each cubby, top row first
    for r in range(rows):
        for c in range(cols):
            cx = x0 + t + c * (cw + t)
            cy = kick + t + (rows - 1 - r) * (ch + t)
            cells.append((cx, cy, cx + cw, cy + ch))
    return parts, cells, (x0, 0, zf, x0 + W, Hs, ZB)

def stock(cells, zf):
    """Put a box in each cubby: Dropper World, two locked ones, the SOON card, then empties."""
    items = []
    for k, (a, b, c, d) in enumerate(cells):
        if k == 0: items.append(((a + 0.05, b, zf + 0.08), (c - 0.09, d - 0.05, ZB - 0.07), 'dropper'))
        elif k in (1, 2): items.append(((a + 0.05, b, zf + 0.1), (c - 0.09, d - 0.07, ZB - 0.07), 'locked'))
        elif k == 3: items.append(((a + 0.06, b + 0.07, ZB - 0.05), (c - 0.06, d - 0.08, ZB - 0.03), 'card'))
    return items

def ray_box(o, d, lo, hi):
    tmin, tmax, ax = -1e9, 1e9, -1
    for i in range(3):
        if abs(d[i]) < 1e-9:
            if o[i] < lo[i] or o[i] > hi[i]: return None
            continue
        t1, t2 = (lo[i] - o[i]) / d[i], (hi[i] - o[i]) / d[i]
        if t1 > t2: t1, t2 = t2, t1
        if t1 > tmin: tmin, ax = t1, i
        tmax = min(tmax, t2)
        if tmin > tmax: return None
    if tmax < 0 or tmin < 0: return None
    n = [0, 0, 0]; n[ax] = -1 if d[ax] > 0 else 1
    return tmin, tuple(n)

class Camera:
    def __init__(self, pos, yaw, pitch, f, cx, cy):
        self.p, self.f, self.cx, self.cy = pos, f, cx, cy
        cy_, sy_, cp, sp = math.cos(yaw), math.sin(yaw), math.cos(pitch), math.sin(pitch)
        self.fw = (sy_ * cp, sp, cy_ * cp)
        self.rt = (cy_, 0, -sy_)
        self.up = (-sy_ * sp, cp, -cy_ * sp)
    def ray(self, px, py):
        u, v = (px + 0.5 - self.cx) / self.f, -(py + 0.5 - self.cy) / self.f
        return tuple(self.fw[i] + u * self.rt[i] + v * self.up[i] for i in range(3))
    def project(self, P):
        d = [P[i] - self.p[i] for i in range(3)]
        z = sum(d[i] * self.fw[i] for i in range(3))
        return (self.cx + self.f * sum(d[i] * self.rt[i] for i in range(3)) / z,
                self.cy - self.f * sum(d[i] * self.up[i] for i in range(3)) / z, z)

def render(cam, X0, Y0, X1, Y1, parts, items, sb, window, poster, rug):
    sx0, _, szf, sx1, sHs, _ = sb
    boxes = [(lo, hi, m) for (lo, hi, m) in parts + items]
    for py in range(Y0, Y1 + 1):
        for px in range(X0, X1 + 1):
            d = cam.ray(px, py); o = cam.p
            best, hit = 1e9, None
            # the room's own surfaces
            for (axis, val, n, name) in ((1, 0.0, (0, 1, 0), 'floor'), (1, RH, (0, -1, 0), 'ceil'),
                                         (0, -RW, (1, 0, 0), 'lwall'), (0, RW, (-1, 0, 0), 'rwall'), (2, ZB, (0, 0, -1), 'back')):
                if abs(d[axis]) < 1e-9: continue
                t = (val - o[axis]) / d[axis]
                if 0 < t < best:
                    P = tuple(o[i] + d[i] * t for i in range(3))
                    if -RW - 1e-6 <= P[0] <= RW + 1e-6 and -1e-6 <= P[1] <= RH + 1e-6 and P[2] <= ZB + 1e-6:
                        best, hit = t, (name, n, P)
            for lo, hi, m in boxes:
                r = ray_box(o, d, lo, hi)
                if r and r[0] < best:
                    best, hit = r[0], (m, r[1], tuple(o[i] + d[i] * r[0] for i in range(3)), lo, hi)
            if hit: put(px, py, surface(px, py, hit, sb, window, poster, rug))

def ao(P, sb):
    """Fake soft shadows: darker into corners, under and inside the shelf (too careful for 1993)."""
    x, y, z = P
    k = 1.0
    k *= 0.72 + 0.28 * min(1, (RW - abs(x)) / 0.35)
    k *= 0.75 + 0.25 * min(1, (ZB - z) / 0.3) if y < 0.02 or abs(abs(x) - RW) < 0.02 else 1
    k *= 0.8 + 0.2 * min(1, y / 0.25) if abs(z - ZB) < 0.02 or abs(abs(x) - RW) < 0.02 else 1
    sx0, _, szf, sx1, sHs, _ = sb
    if y < 0.01:  # contact shadow in front of the shelf
        dx = max(sx0 - x, 0, x - sx1); dz = max(szf - z, 0)
        k *= 0.55 + 0.45 * min(1, math.hypot(dx, dz) / 0.22)
    if sx0 < x < sx1 and z > szf + 0.005 and y < sHs:  # inside a cubby
        k *= 0.45 + 0.4 * (1 - (z - szf) / (ZB - szf))
    return k

def surface(px, py, hit, sb, window, poster, rug):
    name, n, P = hit[0], hit[1], hit[2]
    x, y, z = P
    k = lit(n) * ao(P, sb)
    if name == 'floor':
        if rug:
            cx, cz, rx, rz = rug
            e = math.sqrt(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2)
            if e < 1:
                rings = ['#ff3a78', '#ffa41e', '#fff27a', '#36e04e', '#2f86ff', '#9a3ce8']
                return shade(px, py, rings[min(5, int(e * 6))], k)
            if e < 1.08: return shade(px, py, '#3a1040', k)
        tile = (math.floor(x / 0.36) + math.floor(z / 0.36)) % 2
        return shade(px, py, FLOOR[0][tile], k * (0.93 + 0.07 * min(1, z / ZB)))
    if name == 'ceil': return shade(px, py, '#fff3ea', k * 0.8)
    if name in ('lwall', 'rwall', 'back'):
        s = z if name != 'back' else x
        if y > RH - 0.12:  # the zigzag border under the ceiling
            return shade(px, py, '#ff4fb0' if (math.floor(s / 0.06) + math.floor(y / 0.04)) % 2 else '#ffe030', k)
        if y < 0.1: return shade(px, py, '#ffffff' if y > 0.06 else ('#d4c6ec' if y > 0.03 else '#6a58a0'), k)  # baseboard
        if window and name == window[0]:
            _, w0, w1, h0, h1 = window
            if w0 - 0.06 <= s <= w1 + 0.06 and h0 - 0.06 <= y <= h1 + 0.06:
                if not (w0 <= s <= w1 and h0 <= y <= h1) or abs(s - (w0 + w1) / 2) < 0.02 or abs(y - (h0 + h1) / 2) < 0.02:
                    return shade(px, py, '#fff3ea', k)
                tt = (y - h0) / (h1 - h0)
                hill = 0.28 + 0.06 * math.sin(s * 9)
                if tt < hill: return ramp(px, py, [(0, '#28b048'), (1, '#6ef06a')], tt / hill)
                return ramp(px, py, [(0, '#ffb2ea'), (0.35, '#62d6ff'), (1, '#2438e8')], (tt - hill) / (1 - hill))
            if (w0 - 0.2 <= s < w0 - 0.06 or w1 + 0.06 < s <= w1 + 0.2) and h0 - 0.12 <= y <= h1 + 0.1:  # curtains
                fold = math.sin(s * 70)
                return shade(px, py, tone(px, py, ['#b8127a', '#ff5aa8', '#ff9ed0', '#ffe0f0'], 1.5 + fold), k)
            if w0 - 0.24 <= s <= w1 + 0.24 and h1 + 0.1 < y < h1 + 0.14: return shade(px, py, GOLD, k)
        if poster and name == poster[0]:
            _, p0, p1, q0, q1 = poster
            if p0 <= s <= p1 and q0 <= y <= q1:
                return shade(px, py, sample(POSTER, (s - p0) / (p1 - p0), 1 - (y - q0) / (q1 - q0)), k)
        return shade(px, py, sample(WALLTEX, s / 0.6, -y / 0.6), k)
    lo, hi = hit[3], hit[4]
    if name in ('wood', 'back'):
        grain = 0.03 * math.sin((x + z) * 60 + y * 7)
        base = cb.WOOD[3] if name == 'wood' else cb.WOOD[2]
        if n[2] == -1 and name == 'wood':  # front edges catch the light
            edge = min(x - lo[0], hi[0] - x, y - lo[1], hi[1] - y)
            if edge < 0.012: base = cb.WOOD[4]
        return shade(px, py, base, k * (1 + grain))
    if name == 'dropper':
        if n[2] == -1:
            return shade(px, py, sample(TEX['dropper'], (x - lo[0]) / (hi[0] - lo[0]), 1 - (y - lo[1]) / (hi[1] - lo[1])), k * 1.05)
        return shade(px, py, '#c8127a' if n[0] else '#ffffff', k)
    if name == 'locked':
        return shade(px, py, '#2c2070' if n[2] == -1 else '#1e1458', k * 1.2)
    if name == 'card':
        return shade(px, py, sample(TEX['card'], (x - lo[0]) / (hi[0] - lo[0]), 1 - (y - lo[1]) / (hi[1] - lo[1])), k * 1.4)
    return (255, 0, 255)

def line(p0, p1, col, w=1):
    n = int(max(abs(p1[0] - p0[0]), abs(p1[1] - p0[1]))) + 1
    for i in range(n + 1):
        t = i / n
        x, y = p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t
        for a in range(w):
            for b in range(w): put(int(x) + a, int(y) + b, col(int(x) + a, int(y) + b) if callable(col) else col)

def overlays(cam, cells, zf, clip):
    # hazard tape across the locked cubbies (flat stripes, following the perspective)
    for k in (1, 2):
        a, b, c, d = cells[k]
        for (p, q) in (((a + 0.02, d - 0.08), (c - 0.03, b + 0.12)), ((a + 0.02, b + 0.1), (c - 0.03, d - 0.14))):
            P0, P1 = cam.project((p[0], p[1], zf - 0.005)), cam.project((q[0], q[1], zf - 0.005))
            line(P0, P1, lambda x, y: '#ffe030' if ((x + y) // 3) % 2 else '#1a1030', 3)
        lx, ly, _ = cam.project(((a + c) / 2, b + 0.07, zf))
        cb.sprite_px(PADLOCK, int(lx) - 2, int(ly) - 5, 1, {'o': '#c8c8d8', 'g': '#9a6a08', 'G': GOLD, 'k': '#12082e'})
    # the chosen cubby: a gold ring round its opening, sparkles on two corners
    a, b, c, d = cells[0]
    q = [cam.project((a - 0.01, d + 0.01, zf - 0.01)), cam.project((c + 0.01, d + 0.01, zf - 0.01)),
         cam.project((c + 0.01, b - 0.01, zf - 0.01)), cam.project((a - 0.01, b - 0.01, zf - 0.01))]
    for i in range(4): line(q[i], q[(i + 1) % 4], GOLD, 2)
    for (sx, sy, _) in (q[1], q[3]):
        for i in range(-3, 4):
            put(int(sx) + i, int(sy), '#ffffff' if abs(i) < 2 else '#fff6b0'); put(int(sx), int(sy) + i, '#ffffff' if abs(i) < 2 else '#fff6b0')
    hx_, hy_, _ = cam.project((c - 0.08, b - 0.02, zf - 0.05))
    cb.hand(int(hx_), int(hy_))

def room(cam, X0, Y0, X1, Y1, shelf_x0, cols, rows, window, poster, rug, sadie_dx):
    global SIZE, SAVED
    SIZE, SAVED = (kit.W, kit.H), [row[:] for row in kit.img]
    parts, cells, sb = build_shelf(shelf_x0, cols, rows)
    items = stock(cells, sb[2])
    for lo, hi, m in items:
        if m in DRAW:
            zf = lo[2]
            a, b = cam.project((lo[0], hi[1], zf)), cam.project((hi[0], lo[1], zf))
            w, h = max(8, round(b[0] - a[0]) + 1), max(8, round(b[1] - a[1]) + 1)
            TEX[m] = grab(w, h, lambda: DRAW[m](w, h))
    kit.start(*SIZE)
    kit.img[:] = [row[:] for row in SAVED]
    render(cam, X0, Y0, X1, Y1, parts, items, sb, window, poster, rug)
    clip = lambda x, y: X0 <= x <= X1 and Y0 <= y <= Y1
    overlays(cam, cells, sb[2], clip)
    # Sadie on top of the shelf, a flat sprite standing in the 3D room, sized by her distance
    fx, fy, fz = cam.project((sb[0] + sadie_dx, sb[4], (sb[2] + ZB) / 2))
    S = max(0.8, min(1.3, cam.f * 0.5 / fz / 42))
    sad = build_sadie(int(fx), int(fy), S)
    cb.shadow_ellipse(int(fx) + 1, int(fy), 17 * S, 2)
    outline(sad, INK, clip)
    whiskers(int(fx), int(fy), S, clip)
    cb.sunken(X0, Y0, X1, Y1)

def main():
    # 1. wide
    kit.start(320, 240)
    cb.frame()
    logo(10, 8, "SADIE'S PLAY PLACE")
    panel(222, 6, 313, 25, False, 1, '#140a3a')
    text(226, 9, 'SHAREWARE V0.9 BETA', '#2ee6d6')
    text(226, 17, 'PLEASE COPY & SHARE!', '#ff8ce0')
    groove_h(3, kit.W - 4, 28)
    X0, Y0, X1, Y1 = 6, 32, 313, 175
    cam = Camera((-0.4, 1.32, -0.05), math.radians(8), math.radians(-10), 212, (X0 + X1) / 2, (Y0 + Y1) / 2 - 6)
    room(cam, X0, Y0, X1, Y1, -0.42, 3, 2, ('lwall', 1.6, 2.75, 0.85, 1.7), ('back', -1.4, -0.85, 1.0, 1.55), (-0.85, 2.35, 0.55, 0.38), 0.42)
    groove_h(3, kit.W - 4, 178)
    cb.led_board(8, 183, 250, 220, [("SADIE'S DROPPER WORLD", '#ffd23a'), ('A MOLE DROPS JELLY ON EVERYTHING.', '#4aff6a'),
                                    ('SADIE CLIMBS THE PILE FOR HAY.', '#4aff6a'), ('CHOOTER NEXT DOOR HATES THE THUDS.', '#4aff6a')])
    cb.play_button(258, 184, 312, 219)
    groove_h(3, kit.W - 4, 222)
    cb.keybar(8, 225, 312, [('F1', 'HELP'), ('F3', 'SOUND'), ('F5', 'ABOUT'), ('PGDN', 'MORE SHELVES'), ('ESC', 'QUIT')])
    kit.save(os.path.join(HERE, 'clubhouse3d-wide.png'))

    # 2. phone
    kit.start(180, 360)
    cb.frame()
    for (y, s) in ((8, "SADIE'S"), (27, 'PLAY PLACE')):
        logo((kit.W - (len(s) * 12 - 3)) // 2, y, s, 3, 3)
    panel(8, 47, 171, 64, False, 1, '#140a3a')
    for k, (s, c) in enumerate((('SHAREWARE V0.9 BETA', '#2ee6d6'), ('PLEASE COPY & SHARE!', '#ff8ce0'))):
        text(90 - text_w(s) // 2, 50 + k * 7, s, c)
    groove_h(3, kit.W - 4, 67)
    X0, Y0, X1, Y1 = 6, 71, 173, 278
    cam = Camera((-0.55, 1.5, 0.3), math.radians(13), math.radians(-14), 188, (X0 + X1) / 2, (Y0 + Y1) / 2 - 4)
    room(cam, X0, Y0, X1, Y1, -0.9, 2, 3, ('rwall', 2.0, 2.9, 1.0, 1.75), ('back', 0.55, 1.1, 1.3, 1.85), (-0.2, 2.45, 0.75, 0.4), 0.38)
    groove_h(3, kit.W - 4, 281)
    cb.led_board(8, 286, 118, 321, [('DROPPER WORLD', '#ffd23a'), ('A MOLE DROPS JELLY', '#4aff6a'), ('ON EVERYTHING!', '#4aff6a'), ('SADIE WANTS HAY.', '#4aff6a')])
    cb.play_button(124, 286, 171, 321)
    groove_h(3, kit.W - 4, 325)
    cb.keybar(9, 330, 172, [('F1', 'HELP'), ('F3', 'SOUND'), ('F5', 'ABOUT'), ('PGDN', 'MORE'), ('ESC', 'QUIT')], 13)
    kit.save(os.path.join(HERE, 'clubhouse3d-phone.png'))
    print('ok')

if __name__ == '__main__':
    main()
