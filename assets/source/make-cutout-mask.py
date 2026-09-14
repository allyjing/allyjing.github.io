"""Build an alpha mask for a scene generated as a cutout on a flat background.

The exterior is now generated with everything above the ground painted flat magenta,
so the landmark backdrop shows through. This turns that into a mask, which is paired
with the artwork as a JPEG: the mask is a few KB of almost-flat alpha, where the
equivalent RGBA PNG of the same picture runs close to a megabyte.

Flood fill from the borders rather than a global colour test, because the
bougainvillea is pink and lands within ~30 of the key colour. Only background that is
actually connected to the edge of the frame is ever cut, so enclosed pink stays.

    python3 make-cutout-mask.py <source.png> <mask.png> [tolerance]
"""
import sys
sys.path.insert(0, '/Users/jingwenhuang/.claude/jobs/41521682/tmp')
from png import read_png, write_rgba
from collections import deque

RAMP = (70, 130, 185, 225)      # alpha at 1..4 px in from the cut, so the edge is
                                # a ramp rather than a staircase

def build(src, dst, tol=38):
    w, h, n, px = read_png(src)
    kr, kg, kb = px[0], px[1], px[2]
    t2 = tol * tol

    def is_key(i):
        o = i * n
        return ((px[o]-kr)**2 + (px[o+1]-kg)**2 + (px[o+2]-kb)**2) < t2

    bg = bytearray(w * h)
    q = deque()
    for x in range(w):
        for i in (x, (h-1)*w + x):
            if not bg[i] and is_key(i):
                bg[i] = 1; q.append(i)
    for y in range(h):
        for i in (y*w, y*w + w-1):
            if not bg[i] and is_key(i):
                bg[i] = 1; q.append(i)
    while q:
        i = q.popleft()
        x, y = i % w, i // w
        for j in ((i-1 if x else -1), (i+1 if x < w-1 else -1),
                  (i-w if y else -1), (i+w if y < h-1 else -1)):
            if j >= 0 and not bg[j] and is_key(j):
                bg[j] = 1; q.append(j)

    dist = bytearray(w * h)
    frontier = [i for i in range(w*h) if not bg[i] and (
        (i % w and bg[i-1]) or (i % w < w-1 and bg[i+1]) or
        (i >= w and bg[i-w]) or (i < w*(h-1) and bg[i+w]))]
    for i in frontier:
        dist[i] = 1
    cur = frontier
    for d in range(2, len(RAMP) + 1):
        nxt = []
        for i in cur:
            x, y = i % w, i // w
            for j in ((i-1 if x else -1), (i+1 if x < w-1 else -1),
                      (i-w if y else -1), (i+w if y < h-1 else -1)):
                if j >= 0 and not bg[j] and not dist[j]:
                    dist[j] = d; nxt.append(j)
        cur = nxt

    out = bytearray(w * h * 4)
    for i in range(w * h):
        o = i * 4
        out[o] = out[o+1] = out[o+2] = 255      # only alpha carries the mask
        out[o+3] = 0 if bg[i] else (RAMP[dist[i]-1] if dist[i] else 255)
    write_rgba(dst, w, h, out)
    return sum(bg), w * h

if __name__ == '__main__':
    tol = int(sys.argv[3]) if len(sys.argv) > 3 else 38
    cut, total = build(sys.argv[1], sys.argv[2], tol)
    print(f'{sys.argv[2]}: {cut} px transparent ({100*cut/total:.1f}%)')
