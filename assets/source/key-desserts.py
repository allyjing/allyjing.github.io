"""Turn generated dessert and drink art into drop-in sprites.

Takes the eight images from `assets/source/generated/`, keys out their magenta
background, puts them all on one baseline, crops them to one shared box, and writes
them over `assets/sprites/`.

    python3 assets/source/key-desserts.py

The prompts that produce the input are in assets/PROMPTS.md §10-17. This replaces
draw-desserts.py, which drew the same eight in code; that script stays in the repo
because its output is the fallback if a generation goes wrong.

⚠️ ALL EIGHT OR NONE. The baseline shift and the crop box are computed across the
whole set, so processing a subset would put those on a different baseline from the
rest — which is the bug that had the croissant hovering a visible gap above its plate
the first time round. Keep all eight files present in generated/ and re-run; leave the
ones you are happy with alone.

Keying is three passes and all three earn their place:

  1. A BORDER FLOOD FILL at a generous tolerance. Connectivity to the frame edge is
     what makes a loose tolerance safe — it cannot reach anything the subject
     encloses or shields.
  2. A POCKET pass at a tighter tolerance, for background the fill cannot reach: the
     hole in a cup handle, the gap between two macarons. Without it those stayed
     solid magenta — 7,494 pixels across the set on the first run.
  3. A FRINGE pass for the blended half-magenta pixels a generator leaves where the
     subject meets the background, which otherwise survive as a pink halo.

Passes 2 and 3 test colour without the safety of connectivity, so both are tighter
than pass 1. That is safe HERE — and only here — because nothing in this palette is
near magenta: the closest is the berry filling #B84A6E, whose green channel sits 74
away from zero. Do not copy these thresholds to art with a magenta-ish subject; see
make-cutout-mask.py, where exactly that cost a hole in the bougainvillea.
"""
import sys, os, subprocess
from collections import deque

# png.py lives beside this script. Resolve it relative to THIS FILE so the script
# stays runnable from anywhere, including a fresh clone.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from png import read_png, write_rgba

HERE = os.path.dirname(os.path.abspath(__file__))
IN_DIR = os.path.join(HERE, 'generated')
OUT_DIR = os.path.normpath(os.path.join(HERE, '..', 'sprites'))

NAMES = [
    'dessert-croissant', 'dessert-souffle', 'dessert-macarons',
    'dessert-bao', 'dessert-cake',
    'drink-coffee', 'drink-milk-tea', 'drink-matcha',
]

# How far from pure magenta still counts as background. Generated backgrounds are
# never perfectly flat — JPEG-ish ringing and the generator's own dithering push it
# around by a few levels — but they are nowhere near the subject.
TOLERANCE = 60

# A pixel is only background if it is BOTH near-magenta and reachable from the frame
# edge. Kept generous because the fill cannot leak into the subject: it stops at the
# outline, which every prompt asks for explicitly.
KEY = (255, 0, 255)

# Tighter than TOLERANCE, for the two passes that test colour WITHOUT the safety of
# connectivity to the frame edge.
POCKET_TOL = 45
FRINGE_GAP = 60

WORK = 1024          # everything is scaled to this before keying, for one crop box


def to_png(path):
    """Accept whatever the generator produced. sips converts and normalises to PNG."""
    out = os.path.join(IN_DIR, '.converted.png')
    subprocess.run(['sips', '-s', 'format', 'png', '-Z', str(WORK), path, '--out', out],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return out


def key_magenta(w, h, nch, px):
    """RGBA bytes with the background removed, plus the two pass counts."""
    def is_key(i):
        r, g, b = px[i], px[i + 1], px[i + 2]
        return (abs(r - KEY[0]) < TOLERANCE
                and abs(g - KEY[1]) < TOLERANCE
                and abs(b - KEY[2]) < TOLERANCE)

    background = bytearray(w * h)          # 1 where the pixel is background
    queue = deque()

    # Seed from every edge pixel that is near-magenta.
    for x in range(w):
        for y in (0, h - 1):
            i = (y * w + x)
            if is_key(i * nch) and not background[i]:
                background[i] = 1
                queue.append(i)
    for y in range(h):
        for x in (0, w - 1):
            i = (y * w + x)
            if is_key(i * nch) and not background[i]:
                background[i] = 1
                queue.append(i)

    while queue:
        i = queue.popleft()
        x, y = i % w, i // w
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                j = ny * w + nx
                if not background[j] and is_key(j * nch):
                    background[j] = 1
                    queue.append(j)

    # ---- pocket pass ----------------------------------------------------
    #
    # ⚠️ The border fill CANNOT REACH BACKGROUND THE SUBJECT ENCLOSES: the hole in a
    # cup handle, the gap between two macarons, the space under a croissant's curve.
    # Without this pass those stay solid magenta — 7,494 pixels of it across the set
    # on the first run, which looks like a rendering fault rather than a keying one.
    #
    # Safe as a GLOBAL colour test here, unlike the exterior scene, because nothing
    # in this palette is anywhere near magenta: the closest is the berry filling
    # #B84A6E, whose green channel sits 74 from zero. The tolerance below is tighter
    # than the fill's for margin.
    pockets = 0
    for i in range(w * h):
        if not background[i]:
            s = i * nch
            r, g, b = px[s], px[s + 1], px[s + 2]
            if r > 255 - POCKET_TOL and g < POCKET_TOL and b > 255 - POCKET_TOL:
                background[i] = 1
                pockets += 1

    # ---- fringe pass ----------------------------------------------------
    #
    # Where the subject meets the background a generator leaves blended pixels —
    # half magenta, half pastry — and they survive both passes above as a pink halo
    # around every sprite. Cut the ones that touch the background AND are genuinely
    # magenta-tinted.
    #
    # The test is `r` AND `b` both well clear of `g`, which is what a magenta blend
    # looks like and what the palette does not: rose #E9A7B4 has blue only 13 above
    # green, and the berry only 36. A blend of magenta with anything clears 60.
    fringe = 0
    edge = []
    for i in range(w * h):
        if background[i]:
            continue
        x, y = i % w, i // w
        touching = False
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and background[ny * w + nx]:
                touching = True
                break
        if not touching:
            continue
        s = i * nch
        r, g, b = px[s], px[s + 1], px[s + 2]
        if r > g + FRINGE_GAP and b > g + FRINGE_GAP:
            edge.append(i)
    for i in edge:
        background[i] = 1
        fringe += 1

    out = bytearray()
    for i in range(w * h):
        s = i * nch
        if background[i]:
            out += b'\x00\x00\x00\x00'
        else:
            out += bytes(px[s:s + 3]) + b'\xff'
    return out, pockets, fringe


def alpha_box(px, w, h):
    x0 = y0 = 10 ** 9
    x1 = y1 = -1
    for y in range(h):
        row = y * w
        for x in range(w):
            if px[(row + x) * 4 + 3] > 8:
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
    return x0, y0, x1, y1


def shift_rows(px, w, h, dy):
    """Move a sprite dy rows down. An integer row shift, so nothing is resampled."""
    if dy == 0:
        return px
    blank = bytes(w * 4)
    rows = [bytes(px[y * w * 4:(y + 1) * w * 4]) for y in range(h)]
    if dy > 0:
        rows = [blank] * dy + rows[:-dy]
    else:
        rows = rows[-dy:] + [blank] * (-dy)
    return bytearray(b''.join(rows))


def main():
    if sys.argv[1:]:
        raise SystemExit('this script takes no arguments: it processes all eight or '
                         'none, because the baseline and the crop box are computed '
                         'across the whole set.')

    missing = [n for n in NAMES if not os.path.exists(os.path.join(IN_DIR, n + '.png'))]
    if missing:
        raise SystemExit(
            'missing from ' + IN_DIR + ':\n  ' + '\n  '.join(n + '.png' for n in missing) +
            '\n\nAll eight must be present. Keep the ones you are happy with in place and '
            're-run; see assets/PROMPTS.md sections 10-17.')

    keyed = []
    for name in NAMES:
        src = to_png(os.path.join(IN_DIR, name + '.png'))
        w, h, nch, px = read_png(src)
        rgba, pockets, fringe = key_magenta(w, h, nch, px)
        box = alpha_box(rgba, w, h)
        if box[2] < 0:
            raise SystemExit(f'{name}: everything keyed out. Is the background really '
                             f'magenta? Try lowering TOLERANCE.')
        covered = ((box[2] - box[0]) * (box[3] - box[1])) / float(w * h)
        print(f'{name:20} {w}x{h}  subject {covered * 100:5.1f}%  '
              f'pockets {pockets:6d}  fringe {fringe:5d}')
        if covered > 0.98:
            print(f'  ⚠️  almost nothing keyed out — check the background colour')
        keyed.append([name, rgba, w, h])

    # ---- one baseline for the whole set ----------------------------------
    height = max(k[3] for k in keyed)
    width = max(k[2] for k in keyed)
    target = int(height * 0.96)
    print()
    for k in keyed:
        bottom = alpha_box(k[1], k[2], k[3])[3]
        dy = target - bottom
        if dy:
            print(f'{k[0]:20} baseline shift {dy:+d}px')
        k[1] = shift_rows(k[1], k[2], k[3], dy)

    # ---- one crop box ----------------------------------------------------
    boxes = [alpha_box(k[1], k[2], k[3]) for k in keyed]
    margin = 8
    x0 = max(0, min(b[0] for b in boxes) - margin)
    y0 = max(0, min(b[1] for b in boxes) - margin)
    x1 = min(width - 1, max(b[2] for b in boxes) + margin)
    y1 = min(height - 1, max(b[3] for b in boxes) + 2)
    cw, ch = x1 - x0 + 1, y1 - y0 + 1
    print(f'\nshared crop: x {x0}..{x1}  y {y0}..{y1}  -> {cw}x{ch}')

    for name, rgba, w, h in keyed:
        out = bytearray()
        for y in range(y0, y1 + 1):
            start = (y * w + x0) * 4
            out += rgba[start:start + cw * 4]
        path = os.path.join(OUT_DIR, name + '.png')
        write_rgba(path, cw, ch, bytes(out))
        print(f'{name:20} {cw}x{ch}  {os.path.getsize(path):7d} bytes')

    tmp = os.path.join(IN_DIR, '.converted.png')
    if os.path.exists(tmp):
        os.remove(tmp)

    print(f'\n--sprite-aspect for scenes.css: {cw} / {ch} = {cw / ch:.4f}')
    print('Put that number in .setting in src/styles/scenes.css, then look at the room.')


if __name__ == '__main__':
    main()
