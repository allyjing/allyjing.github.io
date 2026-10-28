"""Builds assets/scenes/interior-window-mask.png: the GLASS of the interior's arched
window and French doors, so the time of day can show through it.

Usage:
    sips -s format png assets/scenes/interior.webp --out /tmp/interior.png
    python3 assets/source/make-window-mask.py /tmp/interior.png

The mask is cropped to the window's bounding box (BOX below). scenes.css places the
overlay at that same box in image percentages, so if you change BOX you must change
the --window-* numbers in scenes.css too. The script prints them.

How it finds the glass: a flood fill from seed points inside the panes, stopped by
the window FRAME — the tan wood and the dark-brown outline around it. That is what
keeps it from leaking onto the cream wall around the arch. Small islands left
inside the glass (tree trunks, the lamp post's outline) are then filled in, because
they are outdoors too and should darken with everything else out there.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from png import read_png, write_rgba

# The window's bounding box in the 1376x768 artwork, measured off the image.
BOX = (497, 158, 902, 420)          # left, top, right, bottom (right/bottom exclusive)

# Rectangles safely INSIDE the panes. Seeds are a grid of points within these.
PANES = [
    (512, 200, 588, 398),           # left arched window
    (602, 175, 792, 212),           # transom over the doors
    (606, 228, 792, 400),           # the doors' glass
    (806, 200, 884, 398),           # right arched window
]

# Enclosed non-glass islands smaller than this many pixels are counted as glass.
HOLE_MAX = 900


def is_frame(r, g, b):
    """The wood (about 200,150,111) or the dark-brown outline (about 75,30,0).

    The wood range is wide enough to take the CHAIR BACKS too (up to about
    236,183,135): two chairs and a table stand in front of the bottom of the window,
    and they are in the lit room, not outdoors."""
    wood = 140 <= r <= 250 and 60 <= r - b <= 130 and b + 25 <= g <= r - 35
    outline = r < 130 and g < 95 and b < 75 and r > b + 20
    return wood or outline


def main(src):
    w, h, n, px = read_png(src)
    left, top, right, bottom = BOX
    bw, bh = right - left, bottom - top

    def rgb(x, y):
        i = (y * w + x) * n
        return px[i], px[i + 1], px[i + 2]

    # Frame map for the box only.
    frame = [[is_frame(*rgb(left + x, top + y)) for x in range(bw)] for y in range(bh)]
    glass = [[False] * bw for _ in range(bh)]

    # Flood fill from every seed, 4-connected, blocked by the frame.
    stack = []
    for (x0, y0, x1, y1) in PANES:
        for y in range(y0, y1, 6):
            for x in range(x0, x1, 6):
                bx, by = x - left, y - top
                if not frame[by][bx]:
                    stack.append((bx, by))
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= bw or y >= bh: continue
        if glass[y][x] or frame[y][x]: continue
        glass[y][x] = True
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    # Fill small islands that are completely surrounded by glass.
    seen = [[False] * bw for _ in range(bh)]
    for sy in range(bh):
        for sx in range(bw):
            if glass[sy][sx] or seen[sy][sx]: continue
            blob, touches_edge, stack = [], False, [(sx, sy)]
            seen[sy][sx] = True
            while stack:
                x, y = stack.pop()
                blob.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if nx < 0 or ny < 0 or nx >= bw or ny >= bh:
                        touches_edge = True
                        continue
                    if not glass[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if not touches_edge and len(blob) <= HOLE_MAX:
                for x, y in blob: glass[y][x] = True

    out = bytearray()
    for y in range(bh):
        for x in range(bw):
            out += bytes((255, 255, 255, 255 if glass[y][x] else 0))

    dest = os.path.join(os.path.dirname(__file__), '..', 'scenes', 'interior-window-mask.png')
    write_rgba(dest, bw, bh, out)
    print('wrote', os.path.normpath(dest), f'{bw}x{bh}')
    print(f'  --window-x: {left / w * 100:.3f}%;  --window-y: {top / h * 100:.3f}%;')
    print(f'  --window-w: {bw / w * 100:.3f}%;  --window-h: {bh / h * 100:.3f}%;')


if __name__ == '__main__':
    main(sys.argv[1])
