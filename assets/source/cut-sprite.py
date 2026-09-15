"""Cut a keyed character sprite into a body and two legs.

The legs are emitted FULL WIDTH, with the divide between them carried in their own
transparency rather than by cropping to a box. That is the whole point: a box forces
the divide to be a straight vertical line, and in profile that is wrong.

  head-on  the two legs have a real gap between them, so a straight line down the
           middle lands in the gap and each leg keeps its shoe.

  profile  the shoes overlap and the SILHOUETTE has no gap, so no straight or
           slanted line can divide them — a vertical cut halves a shoe, and slanting
           it either way hands both shoes to one leg. All three were tried.

           But the shoes are separated by the artwork's own dark outline, which a
           bright-enough threshold finds: at min-channel > 200 the two resolve into
           distinct regions. So the divide is not drawn at all. Each shoe is found by
           flood fill, and then every remaining pixel is assigned to whichever shoe is
           NEARER, by a multi-source breadth-first search. The boundary that falls out
           follows the drawing exactly, curves and all, and each leg keeps a whole
           shoe.

The body is cut well past the hip so the top of a leg stays hidden behind it while
the leg translates upward during a step; see the step keyframes in scenes.css.
"""
import sys
sys.path.insert(0, '/Users/jingwenhuang/.claude/jobs/41521682/tmp')
from collections import deque

from png import read_png, write_rgba

HIP_PCT = 61.806     # where the legs begin
BODY_PCT = 72.0      # how far down the body piece reaches: a ~10% overlap

def boundary_at(points, f):
    """Piecewise-linear boundary: [(fraction down the leg, x), ...]."""
    for (f0, x0), (f1, x1) in zip(points, points[1:]):
        if f <= f1:
            span = (f1 - f0) or 1
            return x0 + (x1 - x0) * (f - f0) / span
    return points[-1][1]

def shoe_labels(px, w, h, band_top, bright=200, min_blob=200):
    """Label the two shoes by flood-filling the bright interiors, which the artwork's
    dark outline separates, then hand every other pixel in the band to whichever shoe
    is nearer. Returns a per-pixel label: 0 = unassigned, 1 = left leg, 2 = right."""
    def bright_at(i):
        return px[i*4+3] > 128 and min(px[i*4], px[i*4+1], px[i*4+2]) > bright

    seen = bytearray(w*h); blobs = []
    for y in range(band_top, h):
        for x in range(w):
            i = y*w + x
            if not bright_at(i) or seen[i]:
                continue
            q, cells = deque([i]), []
            seen[i] = 1
            while q:
                j = q.popleft(); cells.append(j)
                jx, jy = j % w, j // w
                for k in ((j-1 if jx else -1), (j+1 if jx < w-1 else -1),
                          (j-w if jy else -1), (j+w if jy < h-1 else -1)):
                    if k >= 0 and bright_at(k) and not seen[k]:
                        seen[k] = 1; q.append(k)
            if len(cells) >= min_blob:
                blobs.append(cells)

    # The two shoes are the blobs furthest apart horizontally.
    blobs.sort(key=len, reverse=True)
    blobs = blobs[:3]
    blobs.sort(key=lambda c: sum(i % w for i in c) / len(c))
    left_blob, right_blob = blobs[0], blobs[-1]

    label = bytearray(w*h)
    q = deque()
    for lab, blob in ((1, left_blob), (2, right_blob)):
        for i in blob:
            label[i] = lab; q.append(i)
    while q:                       # nearest-shoe assignment
        i = q.popleft()
        ix, iy = i % w, i // w
        for k in ((i-1 if ix else -1), (i+1 if ix < w-1 else -1),
                  (i-w if iy else -1), (i+w if iy < h-1 else -1)):
            if k < 0 or label[k] or px[k*4+3] <= 128 or k // w < band_top:
                continue
            label[k] = label[i]; q.append(k)
    return label

def cut(src, prefix, points, shoe_band=None):
    w, h, n, px = read_png(src)
    hip, body_end = round(h * HIP_PCT / 100), round(h * BODY_PCT / 100)

    out = bytearray(w * body_end * 4)
    for y in range(body_end):
        for x in range(w):
            i, o = (y*w + x) * 4, (y*w + x) * 4
            out[o:o+4] = px[i:i+4]
    write_rgba(f'assets/sprites/{prefix}-body.png', w, body_end, out)

    label = shoe_labels(px, w, h, round(h * shoe_band / 100)) if shoe_band else None

    legh = h - hip
    for side in ('left', 'right'):
        out = bytearray(w * legh * 4)
        for yy in range(legh):
            f = yy / max(1, legh - 1)
            bound = boundary_at(points, f)
            for x in range(w):
                src_i = (hip + yy) * w + x
                if label is not None and label[src_i]:
                    # inside the shoe band the segmentation decides, not the line
                    if (label[src_i] == 1) != (side == 'left'):
                        continue
                elif (x < bound) != (side == 'left'):
                    continue
                i = ((hip + yy) * w + x) * 4
                o = (yy * w + x) * 4
                out[o:o+4] = px[i:i+4]
        write_rgba(f'assets/sprites/{prefix}-leg-{side}.png', w, legh, out)

if __name__ == '__main__':
    for name in ('jingwen', 'jingwen-back'):
        w = read_png(f'assets/sprites/{name}.png')[0]
        cut(f'assets/sprites/{name}.png', name, [(0, w/2), (1, w/2)])
        print(f'{name}: straight split at {w/2:.0f}')

    # Straight down the trousers; inside the shoe band the flood-fill segmentation
    # takes over and the boundary follows the drawing.
    cut('assets/sprites/jingwen-side.png', 'jingwen-side',
        [(0, 113), (1, 113)], shoe_band=88)
    print('jingwen-side: trousers split at 113, shoes segmented by flood fill')
