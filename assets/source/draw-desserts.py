"""Draw the dessert and drink sprites.

These are DRAWN, not generated. Everything else in assets/ came out of an image
generator; these did not, for two reasons:

  They have to match the token palette exactly. A generator gives you approximately
  the colour you asked for, and these sit next to CSS-drawn plates that are exactly
  --dessert-plate. Approximately is visible.

  There are eight of them and they have to agree with each other — same outline
  weight, same light direction, same level of detail. That is the thing generators
  are worst at, and it is the only thing that matters for a set.

They replace a pair of CSS pseudo-elements per dessert. The CSS versions were
silhouettes: one rounded shape plus one line. That was the right call while the
tables were bare, but a silhouette cannot show lamination on a croissant or feet on
a macaron, and those are what make the dessert readable at 80px.

Run:  python3 assets/source/draw-desserts.py
Out:  assets/sprites/dessert-*.png, assets/sprites/drink-*.png

Style, matching assets/PROMPTS.md: flat cel shading — one base tone, one shade tone,
no gradients — with a gentle dark outline. Light comes from the upper left, so the
shade sits lower right on every single piece. Consistency there is what makes eight
separate drawings read as one set.
"""
import sys, os, math
# png.py lives beside this script. Resolve it relative to THIS FILE so the script
# stays runnable from anywhere, including a fresh clone.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from png import write_rgba

SIZE = 448          # output edge, square. Downscaled in the browser; see PROMPTS.md.
SS = 4              # vertical supersampling. Horizontal coverage is analytic.
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'sprites')

# ---------------------------------------------------------------------------
# Palette. THESE MUST MATCH src/styles/tokens.css.
#
# ⚠️ This is the one place in the project outside tokens.css that names a colour,
# and it is not an exception to the rule — a PNG cannot read a CSS variable. The
# rule it does have to follow: if a token changes, change it here and re-run, or
# the sprite and the plate under it will disagree.
# ---------------------------------------------------------------------------
INK        = (0x3E, 0x30, 0x38)   # --ink, every outline
BAKE       = (0xE8, 0xC4, 0x89)   # --dessert-bake
BAKE_DARK  = (0xD3, 0xA7, 0x6A)   # its shade. Not a token: shading is local.
BAKE_LIGHT = (0xF2, 0xD7, 0xA6)
GLAZE      = (0xE9, 0xA7, 0xB4)   # --dessert-glaze
GLAZE_DARK = (0xD4, 0x8B, 0x9A)
CREAM      = (0xFB, 0xF7, 0xF4)   # --surface-wall: ramekins, filling, frosting
CREAM_DARK = (0xE7, 0xDE, 0xD8)
BERRY      = (0xB8, 0x4A, 0x6E)   # --accent-berry: jam, one macaron shell
GLASS      = (0xEA, 0xF1, 0xF4)   # --room-drink-glass
GLASS_DARK = (0xD3, 0xE0, 0xE6)
TEA        = (0xD9, 0xA0, 0x6B)   # --room-drink-tea
TEA_DARK   = (0xC2, 0x88, 0x55)
MATCHA     = (0xA8, 0xC4, 0x8A)   # --room-drink-matcha
MATCHA_DARK = (0x8F, 0xAD, 0x70)
LEAF       = (0x8F, 0xBA, 0x73)   # --ground-shade, for the matcha leaf garnish

STROKE = 7.0        # outline width in output pixels, the same on every sprite


class Canvas:
    """Straight-alpha RGBA canvas with a scanline rasteriser.

    Coverage is analytic across x — a span contributes its exact overlap to the
    pixels at each end — and supersampled SS times down y. That pairing is what gives
    clean curves without sampling SS*SS points per pixel, which in pure Python is the
    difference between ten seconds and several minutes.

    Two fill rules, and picking the wrong one is the trap here:

      'nonzero'  one pass over every subpath at once. Use for a shape with a HOLE:
                 wind the outer ring one way and the inner ring the other.

      'union'    each subpath rasterised separately, coverage combined by max. Use
                 for STROKES. A stroke is a pile of overlapping quads and discs whose
                 winding direction follows each segment's direction, so under nonzero
                 the overlaps cancel to winding 0 and the line comes out beaded — it
                 looks like a dotted line, and that is exactly what it was.

    Clipping is done by MULTIPLYING coverage maps, never by winding. Filling
    "inner plus reversed outer" under nonzero does not intersect them: outside the
    inner shape the reversed outer still has winding -1, which is nonzero, so the
    whole clip rectangle fills. That bug painted a tan block behind the croissant.
    """

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[0.0, 0.0, 0.0, 0.0] for _ in range(w * h)]

    def _rows(self, pts):
        """Coverage of ONE closed polygon, as {row: [w floats]} over touched rows."""
        edges = [(x0, y0, x1, y1) for (x0, y0), (x1, y1)
                 in zip(pts, pts[1:] + pts[:1]) if y0 != y1]
        if not edges:
            return {}

        top = max(0, int(math.floor(min(min(e[1], e[3]) for e in edges))))
        bot = min(self.h - 1, int(math.ceil(max(max(e[1], e[3]) for e in edges))))

        rows = {}
        for y in range(top, bot + 1):
            cov = None
            for sy in range(SS):
                yy = y + (sy + 0.5) / SS
                xs = []
                for x0, y0, x1, y1 in edges:
                    if (y0 <= yy < y1) or (y1 <= yy < y0):
                        xs.append((x0 + (x1 - x0) * (yy - y0) / (y1 - y0),
                                   1 if y1 > y0 else -1))
                if not xs:
                    continue
                xs.sort()

                wind, start, spans = 0, 0.0, []
                for x, d in xs:
                    was = wind
                    wind += d
                    if was == 0 and wind != 0:
                        start = x
                    elif was != 0 and wind == 0:
                        spans.append((start, x))

                for xa, xb in spans:
                    xa, xb = max(0.0, xa), min(float(self.w), xb)
                    if xb <= xa:
                        continue
                    if cov is None:
                        cov = [0.0] * self.w
                    ia, ib = int(xa), int(min(xb, self.w - 1e-9))
                    if ia == ib:
                        cov[ia] += xb - xa
                    else:
                        cov[ia] += ia + 1 - xa
                        for i in range(ia + 1, ib):
                            cov[i] += 1.0
                        cov[ib] += xb - ib
            if cov is not None:
                rows[y] = [c / SS for c in cov]
        return rows

    def coverage(self, shape, rule='nonzero'):
        """Coverage of a shape (a list of closed subpaths) as {row: [w floats]}."""
        if rule == 'nonzero':
            # One polygon list, wound together — holes work, overlaps cancel.
            flat = []
            for pts in shape:
                flat.append(pts)
            if len(flat) == 1:
                return self._rows(flat[0])
            # Concatenating subpaths for a single nonzero pass means joining them
            # with a zero-height seam, which contributes no edges. Safe here because
            # _rows drops horizontal edges outright.
            merged = {}
            joined = []
            for pts in flat:
                joined += pts + [pts[0]]
            return self._rows(joined)

        merged = {}
        for pts in shape:
            for y, cov in self._rows(pts).items():
                if y not in merged:
                    merged[y] = cov
                else:
                    row = merged[y]
                    for x, c in enumerate(cov):
                        if c > row[x]:
                            row[x] = c
        return merged

    def paint(self, rows, colour, alpha=1.0, clip=None, erase=None):
        """Composite a coverage map. `clip` multiplies it, `erase` inverts-multiplies.

        Both take coverage maps, not paths, so a shade patch is "the dessert's own
        silhouette, times a half-plane" — it cannot spill past the outline however
        crudely the half-plane is drawn."""
        r, g, b = [c / 255.0 for c in colour]
        for y, cov in rows.items():
            crow = clip.get(y) if clip is not None else None
            erow = erase.get(y) if erase is not None else None
            if clip is not None and crow is None:
                continue
            base = y * self.w
            for x, c in enumerate(cov):
                if c <= 0.002:
                    continue
                if crow is not None:
                    c *= crow[x]
                if erow is not None:
                    c *= 1.0 - min(1.0, erow[x])
                if c <= 0.002:
                    continue
                a = min(1.0, c) * alpha
                dst = self.px[base + x]
                na = a + dst[3] * (1 - a)
                if na <= 0:
                    continue
                dst[0] = (r * a + dst[0] * dst[3] * (1 - a)) / na
                dst[1] = (g * a + dst[1] * dst[3] * (1 - a)) / na
                dst[2] = (b * a + dst[2] * dst[3] * (1 - a)) / na
                dst[3] = na

    # --- the three calls the drawings actually use -------------------------

    def fill(self, shape, colour, alpha=1.0, clip=None, erase=None):
        self.paint(self.coverage(shape, 'nonzero'), colour, alpha, clip, erase)

    def stroke(self, pts, colour=None, width=None, closed=False):
        width = STROKE if width is None else width
        colour = INK if colour is None else colour
        self.paint(self.coverage(stroke_shape(pts, width, closed), 'union'), colour)

    def shade(self, shape, colour, half_plane, alpha=1.0):
        """Shade part of a shape. `half_plane` is a polygon covering the LIT side;
        the shade lands on everything else inside the shape.

        Every sprite is lit from the upper left, so every half_plane here opens to
        the upper left. Consistency there is what makes eight drawings read as a set.
        """
        self.paint(self.coverage(shape, 'nonzero'), colour, alpha,
                   erase=self.coverage([half_plane], 'nonzero'))

    def rgba_bytes(self):
        out = bytearray()
        for p in self.px:
            out += bytes((int(p[0] * 255 + 0.5), int(p[1] * 255 + 0.5),
                          int(p[2] * 255 + 0.5), int(p[3] * 255 + 0.5)))
        return bytes(out)


# ---------------------------------------------------------------------------
# Path builders. Everything is flattened to points here, so the rasteriser only
# ever sees polygons and never has to know what a curve is.
# ---------------------------------------------------------------------------

def ellipse(cx, cy, rx, ry, start=0.0, end=360.0, steps=96):
    n = max(8, int(steps * abs(end - start) / 360.0))
    return [(cx + rx * math.cos(math.radians(start + (end - start) * i / n)),
             cy + ry * math.sin(math.radians(start + (end - start) * i / n)))
            for i in range(n + 1)]


def circle(cx, cy, r):
    return ellipse(cx, cy, r, r)


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def bezier(p0, p1, p2, p3, steps=40):
    out = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        out.append((u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
                    u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]))
    return out


def thick_arc(cx, cy, radius, a0, a1, half_at, steps=64):
    """A closed band following a circular arc, with a width that varies along it.

    `half_at(t)` gives the half-width at parameter t in 0..1. Built by walking the
    outer edge forward and the inner edge back, which is how the croissant gets
    tapered horns without any offset-curve maths.
    """
    outer, inner = [], []
    for i in range(steps + 1):
        t = i / steps
        a = math.radians(a0 + (a1 - a0) * t)
        ca, sa = math.cos(a), math.sin(a)
        hw = half_at(t)
        outer.append((cx + (radius + hw) * ca, cy + (radius + hw) * sa))
        inner.append((cx + (radius - hw) * ca, cy + (radius - hw) * sa))
    inner.reverse()
    return outer + inner


def stroke_shape(pts, width, closed=True):
    """A stroke, as subpaths to be combined with the 'union' rule.

    A quad per segment plus a disc per vertex, which gives round joins and round caps
    without any offset-curve maths. ⚠️ Must be rasterised with rule='union' — the
    quads' winding follows each segment's direction, so under nonzero the overlaps
    cancel and the line comes out beaded. See Canvas.
    """
    half = width / 2.0
    parts = []
    seq = pts + pts[:1] if closed else pts

    for (x0, y0), (x1, y1) in zip(seq, seq[1:]):
        dx, dy = x1 - x0, y1 - y0
        length = math.hypot(dx, dy)
        if length < 1e-9:
            continue
        nx, ny = -dy / length * half, dx / length * half
        parts.append([(x0 + nx, y0 + ny), (x1 + nx, y1 + ny),
                      (x1 - nx, y1 - ny), (x0 - nx, y0 - ny)])
    for (x, y) in seq:
        parts.append(circle(x, y, half))
    return parts


def outlined(canvas, path, colour, width=STROKE):
    """Fill a closed path, then put its outline ON TOP.

    On top, not underneath: underneath, the fill covers the inner half of the stroke
    and the line comes out half as thick as asked for — and thinner on a tight curve
    than on a straight run, which is where it shows.
    """
    canvas.fill([path], colour)
    canvas.stroke(path, INK, width, closed=True)


# ---------------------------------------------------------------------------
# The sprites.
#
# Sized for how they are actually SEEN: about 90px across on a desktop table and
# less on a phone. That is the whole design constraint, and it is why these are
# bold shapes with two or three details rather than careful little illustrations —
# a crackle pattern of seven fine lines turned into grey mush at display size, and
# macaron feet disappeared entirely. Each sprite now carries the smallest number of
# marks that still says which dessert it is.
#
# Every one sits on the same baseline and is lit from the upper left.
# ---------------------------------------------------------------------------

BASE = 356.0        # the surface everything stands on
LIT = rect(-40, -40, 250, 250)   # the upper-left half-plane every shade is cut from


def croissant():
    """A crescent, built as a LUNE: an outer edge bulging up and an inner edge that
    also bulges up, more tightly, so the underside is concave and the two meet at
    points. A band of constant-ish width along a single arc was tried first and read
    as a bread roll — the underside curved the wrong way, which is the whole
    difference between a crescent and a mound."""
    c = Canvas(SIZE, SIZE)

    left, right = (78, 292), (370, 292)

    # Sampled at matching parameters so a seam can be drawn straight across the band
    # by pairing index k of one edge with index k of the other.
    over = bezier(left, (94, 202), (166, 160), (224, 160), steps=30)
    over += bezier((224, 160), (282, 160), (354, 202), right, steps=30)
    under = bezier(left, (148, 270), (192, 256), (224, 256), steps=30)
    under += bezier((224, 256), (256, 256), (300, 270), right, steps=30)

    body = over + list(reversed(under))
    c.fill([body], BAKE)
    c.shade([body], BAKE_DARK, rect(-40, -40, SIZE + 40, 222), alpha=0.85)
    c.stroke(body, INK, STROKE, closed=True)

    # Three roll seams, drawn across the band rather than along it. Lamination is
    # what says croissant; without these it is just a tan crescent.
    for k in (len(over) // 4, len(over) // 2, 3 * len(over) // 4):
        (ox, oy), (ix, iy) = over[k], under[k]
        c.stroke([(ix + (ox - ix) * 0.10, iy + (oy - iy) * 0.10),
                  (ix + (ox - ix) * 0.90, iy + (oy - iy) * 0.90)], INK, STROKE * 0.72)

    return c


def souffle():
    """A ramekin with a dome risen well over the rim. The overhang is the tell — a
    souffle level with the rim has already collapsed."""
    c = Canvas(SIZE, SIZE)

    # A WIDE, barely tapered ramekin. The first pass was narrow and steeply tapered
    # under a tall dome, and the whole thing read as a mushroom.
    cup = [(138, 224), (310, 224), (298, BASE), (150, BASE)]
    outlined(c, cup, CREAM)
    c.shade([cup], CREAM_DARK, rect(-40, -40, 240, SIZE + 40), alpha=0.8)
    c.stroke([(138, 248), (310, 248)], INK, STROKE * 0.6)     # the ramekin rim

    # ⚠️ NO FLUTES. A fluted white cup is a paper muffin case, and with a risen
    # dome on top that is exactly what this read as. A ceramic ramekin gets a plain
    # side and a foot ring at the bottom instead, which is what tells them apart.
    c.stroke([(154, BASE - 18), (294, BASE - 18)], CREAM_DARK, STROKE * 0.8)

    # The dome: BROAD and only moderately tall, overhanging the rim on both sides.
    # Height is what made it a mushroom; the overhang is what says it has risen.
    dome = bezier((122, 226), (126, 148), (176, 112), (224, 112))
    dome += bezier((224, 112), (272, 112), (322, 148), (326, 226))
    c.fill([dome], BAKE)
    c.shade([dome], BAKE_DARK, rect(-40, -40, 238, 176), alpha=0.85)
    c.stroke(dome, INK, STROKE, closed=True)

    # Icing sugar as discs: flat cel shading has no gradients to dust with.
    for x, y, r in [(180, 150, 10), (224, 130, 8), (270, 148, 9), (202, 174, 6), (250, 176, 6)]:
        c.fill([circle(x, y, r)], CREAM)

    return c


def macarons():
    """Two macarons, seen from the side, with the filling squeezing out between the
    shells. Two rather than one so the row reads as a set, like a contact sheet."""
    c = Canvas(SIZE, SIZE)

    def macaron(cx, cy, rx, ry, shell, shell_dark, filling):
        # Filling first: the shells then overlap it, so it reads as squeezed between
        # them rather than as a stripe painted across the front.
        band = rect(cx - rx * 0.94, cy - ry * 0.34, cx + rx * 0.94, cy + ry * 0.34)
        outlined(c, band, filling, STROKE * 0.8)

        for sign in (-1, 1):
            half = ellipse(cx, cy + sign * ry * 0.30, rx, ry * 0.92,
                           180 if sign < 0 else 0, 360 if sign < 0 else 180)
            c.fill([half], shell)
            c.shade([half], shell_dark, rect(-40, -40, cx, SIZE + 40), alpha=0.55)
            c.stroke(half, INK, STROKE, closed=True)

    macaron(292, 250, 78, 58, GLAZE, GLAZE_DARK, CREAM)     # behind and to the right
    macaron(166, 286, 96, 70, GLAZE, GLAZE_DARK, BERRY)     # in front, drawn last
    return c


def bao():
    """Bolo bao: a round bun under a crackled sugar crust. Four bold cracks, not
    seven fine ones — the fine version disappeared at display size."""
    c = Canvas(SIZE, SIZE)

    # The bun is the DARKER tone and the crust cap the lighter one. With the bun in
    # --dessert-bake and the cap in the light tint, the cap covered most of the bun
    # and the two were within a few percent of each other: the edge that makes it a
    # bolo bao was invisible.
    bun = ellipse(224, 252, 122, 104)
    c.fill([bun], BAKE_DARK)
    c.stroke(bun, INK, STROKE, closed=True)

    # The crust cap, covering most of the bun with only a shallow wave along its
    # lower edge. A deep scallop high on the bun read as a lid sitting on a bowl.
    cap = ellipse(224, 250, 116, 96, 180, 360)
    cap += bezier((340, 250), (330, 300), (118, 300), (108, 250))
    c.fill([cap], BAKE)
    c.stroke(cap, INK, STROKE * 0.85, closed=True)

    # Craquelure: three arcs, deliberately ASYMMETRIC. A symmetric pair high on the
    # cap sat exactly where eyebrows go and the bun read as a face.
    for cx, cy, rx, ry, a0, a1 in [(214, 300, 92, 104, 206, 262),
                                   (250, 286, 58, 82, 228, 300),
                                   (186, 250, 66, 54, 190, 250)]:
        c.stroke(ellipse(cx, cy, rx, ry, a0, a1, steps=40), INK, STROKE * 0.62)

    return c


def cake():
    """A slice from the side, because the cross-section is the point: sponge, two
    bands of jam, and frosting on top."""
    c = Canvas(SIZE, SIZE)

    body = rect(110, 152, 338, BASE)
    c.fill([body], BAKE)

    for y0, y1 in [(200, 222), (266, 288)]:
        c.fill([rect(110, y0, 338, y1)], BERRY)
        c.stroke([(110, y0), (338, y0)], INK, STROKE * 0.5)
        c.stroke([(110, y1), (338, y1)], INK, STROKE * 0.5)

    c.shade([body], BAKE_DARK, rect(-40, -40, 262, SIZE + 40), alpha=0.42)
    c.stroke(body, INK, STROKE, closed=True)

    # Frosting: a swagged slab across the top, then a swirl on the crown.
    top = [(106, 158)]
    top += bezier((106, 158), (140, 118), (184, 118), (224, 130))
    top += bezier((224, 130), (266, 142), (312, 116), (342, 154))
    top += [(342, 158)]
    outlined(c, top, CREAM)

    c.fill([circle(212, 118, 20)], GLAZE)
    c.stroke(circle(212, 118, 20), INK, STROKE * 0.7, closed=True)

    return c


def _glass(liquid, liquid_dark, tall, straw=None, garnish=None):
    """A glass with something in it. Shared by all three drinks, so the three cannot
    drift apart in width, rim weight, or how full they are."""
    c = Canvas(SIZE, SIZE)

    if tall:
        x0, x1, y0, taper = 160, 288, 120, 8
    else:
        x0, x1, y0, taper = 146, 302, 176, 14
    body = [(x0, y0), (x1, y0), (x1 - taper, BASE), (x0 + taper, BASE)]

    # The straw goes down BEFORE the glass, so the translucent glass draws over the
    # submerged part and it reads as in the drink rather than beside it.
    if straw:
        c.stroke([(272, 92), (240, 310)], straw, STROKE * 2.0)
        c.stroke([(272, 92), (240, 310)], INK, STROKE * 0.5)

    top = y0 + 30
    drink = [(x0 + 3, top), (x1 - 3, top), (x1 - taper - 1, BASE - 5), (x0 + taper + 1, BASE - 5)]
    c.fill([drink], liquid)
    c.shade([drink], liquid_dark, rect(-40, -40, (x0 + x1) / 2, SIZE + 40), alpha=0.5)
    c.stroke([(x0 + 3, top), (x1 - 3, top)], INK, STROKE * 0.55)

    # The glass: translucent, so low alpha over whatever is behind it.
    c.fill([body], GLASS, alpha=0.28)
    c.shade([body], GLASS_DARK, rect(-40, -40, (x0 + x1) / 2 + 22, SIZE + 40), alpha=0.32)
    c.stroke(body, INK, STROKE, closed=True)
    c.stroke([(x0, y0 + 14), (x1, y0 + 14)], INK, STROKE * 0.5)   # the rim

    if garnish:
        garnish(c)
    return c


def drink_coffee():
    """A teacup, and deliberately NOT another tall glass.

    It does not go through _glass at all. Two reasons: a hot drink is served in an
    opaque cup, so the translucent body the glasses use is wrong for it; and the
    handle has to MEET the cup. Drawn as a free-floating arc beside the body it read
    as a letter C sitting next to a tumbler, which is what the first pass looked
    like. The arc's endpoints are placed on the cup's own edge instead.
    """
    c = Canvas(SIZE, SIZE)

    x0, x1, y0, taper = 150, 296, 200, 16
    body = [(x0, y0), (x1, y0), (x1 - taper, BASE), (x0 + taper, BASE)]

    # The handle goes down first, so the cup's outline closes over the join and the
    # two read as one object rather than as a ring touching a box.
    handle = ellipse(310, 258, 38, 38, -118, 118, steps=48)
    c.stroke(handle, INK, STROKE * 2.1)
    c.stroke(handle, CREAM, STROKE * 0.9)

    c.fill([body], CREAM)
    c.shade([body], CREAM_DARK, rect(-40, -40, 232, SIZE + 40), alpha=0.8)
    c.stroke(body, INK, STROKE, closed=True)

    # The drink seen from above: the cup is opaque, so the only way to show what is
    # in it is the surface. An ellipse also tells you the cup has a mouth.
    surface = ellipse(223, y0 + 6, 70, 17)
    c.fill([surface], TEA)
    c.shade([surface], TEA_DARK, rect(-40, -40, 223, SIZE + 40), alpha=0.45)
    c.stroke(surface, INK, STROKE * 0.75, closed=True)

    return c


def drink_milk_tea():
    """A tall glass with a straw and the tapioca that makes it milk tea."""
    def pearls(c):
        for x, y in [(190, 320), (220, 326), (250, 320), (206, 300), (236, 304)]:
            c.fill([circle(x, y, 15)], INK, alpha=0.8)
    return _glass(TEA, TEA_DARK, tall=True, straw=GLAZE, garnish=pearls)


def drink_matcha():
    """The green one. Same glass with a leaf on the rim, so it is not merely a
    colour swap of the milk tea."""
    def leaf(c):
        blade = bezier((288, 122), (322, 88), (366, 100), (352, 134))
        blade += bezier((352, 134), (332, 158), (298, 148), (288, 122))
        outlined(c, blade, LEAF, STROKE * 0.75)
        c.stroke([(296, 128), (346, 122)], INK, STROKE * 0.45)
    return _glass(MATCHA, MATCHA_DARK, tall=True, straw=GLAZE, garnish=leaf)


SPRITES = {
    'dessert-croissant': croissant,
    'dessert-souffle':   souffle,
    'dessert-macarons':  macarons,
    'dessert-bao':       bao,
    'dessert-cake':      cake,
    'drink-coffee':      drink_coffee,
    'drink-milk-tea':    drink_milk_tea,
    'drink-matcha':      drink_matcha,
}


def alpha_box(px):
    """The opaque bounding box of one rendered sprite: (x0, y0, x1, y1)."""
    x0 = y0 = 10 ** 9
    x1 = y1 = -1
    for y in range(SIZE):
        row = y * SIZE
        for x in range(SIZE):
            if px[(row + x) * 4 + 3] > 8:
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
    return x0, y0, x1, y1


def shift_rows(px, dy):
    """Move a sprite dy rows down (negative for up). An integer row shift, so it is
    exact — nothing is resampled and no edge is softened."""
    if dy == 0:
        return px
    blank = bytes(SIZE * 4)
    rows = [px[y * SIZE * 4:(y + 1) * SIZE * 4] for y in range(SIZE)]
    if dy > 0:
        rows = [blank] * dy + rows[:-dy]
    else:
        rows = rows[-dy:] + [blank] * (-dy)
    return b''.join(rows)


def main():
    if sys.argv[1:]:
        raise SystemExit('this script writes all eight or none: the baseline shift '
                         'and the crop box are computed across the whole set, so a '
                         'partial run would put this subset on a different baseline '
                         'than the rest.\nRun with no arguments.')

    rendered = [(n, f().rgba_bytes()) for n, f in SPRITES.items()]

    # ---- put every sprite on ONE baseline, automatically ------------------
    #
    # ⚠️ This is not belt-and-braces; it is load-bearing, and it is here because the
    # first version ASSUMED each drawing ended at BASE and two of them did not. The
    # croissant's lowest point was its tips at y 292 — 64px short — and the front
    # macaron's bottom shell reached 19px past it. Cropped to a shared box, the
    # croissant then hovered a visible gap above its plate and the macarons sat
    # buried in it.
    #
    # Measuring the drawing instead of trusting it means a new sprite lands on the
    # baseline whether or not whoever drew it kept track of BASE.
    target = int(BASE) + 4          # a hair below BASE, to allow for the outline
    fixed = []
    for name, px in rendered:
        bottom = alpha_box(px)[3]
        dy = target - bottom
        if dy:
            print(f'{name:20} baseline shift {dy:+d}px')
        fixed.append((name, shift_rows(px, dy)))

    # ---- one crop box for the whole set ----------------------------------
    #
    # Shared, not per-sprite: a shared box means a shared baseline and a shared
    # aspect ratio, so `align-items: end` in CSS lines the bottom of the croissant
    # up with the bottom of the glass beside it, and ONE plate offset is right for
    # all five desserts. Cropped individually they would each need their own nudge.
    boxes = [alpha_box(px) for _, px in fixed]
    margin = 8
    x0 = max(0, min(b[0] for b in boxes) - margin)
    y0 = max(0, min(b[1] for b in boxes) - margin)
    x1 = min(SIZE - 1, max(b[2] for b in boxes) + margin)
    y1 = min(SIZE - 1, max(b[3] for b in boxes) + 2)   # tight at the bottom: the
                                                       # artwork's baseline IS the
                                                       # image's bottom edge, which
                                                       # is what the CSS relies on.
    w, h = x1 - x0 + 1, y1 - y0 + 1
    print(f'\nshared crop: x {x0}..{x1}  y {y0}..{y1}  -> {w}x{h}')

    for name, px in fixed:
        out = bytearray()
        for y in range(y0, y1 + 1):
            start = (y * SIZE + x0) * 4
            out += px[start:start + w * 4]
        path = os.path.normpath(os.path.join(OUT, name + '.png'))
        write_rgba(path, w, h, bytes(out))
        b = alpha_box_cropped(bytes(out), w, h)
        print(f'{name:20} {w}x{h}  bottom row {b}/{h - 1}  {os.path.getsize(path):7d} bytes')

    print(f'\n--sprite-aspect for scenes.css: {w} / {h} = {w / h:.4f}')


def alpha_box_cropped(px, w, h):
    """The lowest opaque row of a cropped sprite, for the check printed above."""
    for y in range(h - 1, -1, -1):
        row = y * w
        for x in range(w):
            if px[(row + x) * 4 + 3] > 8:
                return y
    return -1


if __name__ == '__main__':
    main()
