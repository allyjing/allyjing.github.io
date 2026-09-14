"""Build the alpha mask that punches the sky out of the exterior painting.

The painting is opaque edge to edge, so without this the landmark backdrop behind it
is never visible. Regenerating the exterior as a real transparent cutout replaces
this entirely -- see assets/PROMPTS.md.

WHAT MAKES THIS FIDDLY, learned by getting it wrong three times:

  * A plain RGB distance from the sky colour does not work. The bakery wall sits 56
    away, the fountain water 45, the fountain stone 57 -- all closer than the clouds.
    Cutting by distance alone removed the fountain.

  * Testing colour GLOBALLY, without connectivity, removes the dormer window glass:
    it is genuinely sky-coloured, it is just not the sky.

  * Cutting the sky but not the clouds leaves their outlines floating as empty
    strokes, because the outline is darker than the cloud body.

So: the test is COOL AND LIGHT rather than near-some-colour, and it is applied by
flood fill from the top edge. Cool-and-light matches the sky, the clouds and the pale
cloud outlines, and excludes everything warm -- the cream wall, the fountain, the
stonework, the path. Connectivity then protects anything cool that is not the sky:
the slate roof and the window glass are both fenced off by the artwork's dark
outlines, which the fill cannot cross.

Nothing below the horizon is ever cut, which protects the fountain structurally.
"""
import sys
sys.path.insert(0, '/Users/jingwenhuang/.claude/jobs/41521682/tmp')
from png import read_png, write_rgba
from collections import deque

LIGHT = 150     # a sky pixel is light; the dark outlines that fence things off are not
COOL = 8        # blue above red. The sky is cool, the bakery and its stone are warm.
HORIZON = 0.56  # fraction of height; the fountain's bowl starts below this

def build(src, dst):
    w, h, n, px = read_png(src)
    limit = int(h * HORIZON)
    bg = bytearray(w * h)

    def skyish(i):
        o = i * n
        r, g, b = px[o], px[o + 1], px[o + 2]
        return min(r, g, b) > LIGHT and b > r + COOL

    # Flood fill inward from the top edge. Only sky reachable from above is cut.
    q = deque()
    for x in range(w):
        if skyish(x):
            bg[x] = 1
            q.append(x)
    while q:
        i = q.popleft()
        x, y = i % w, i // w
        for j in ((i - 1 if x else -1), (i + 1 if x < w - 1 else -1),
                  (i - w if y else -1), (i + w if y < limit - 1 else -1)):
            if j >= 0 and not bg[j] and skyish(j):
                bg[j] = 1
                q.append(j)


    # Remove leftover islands: cloud outlines and highlights now surrounded by cut
    # sky. Anything above the horizon that is not connected DOWNWARD to the rest of
    # the painting is sky furniture and should go with it.
    keep = bytearray(w * h)
    q = deque()
    for x in range(w):                       # seed from the horizon line itself
        i = limit * w + x
        if not bg[i]:
            keep[i] = 1
            q.append(i)
    while q:
        i = q.popleft()
        x, y = i % w, i // w
        for j in ((i - 1 if x else -1), (i + 1 if x < w - 1 else -1),
                  (i - w if y else -1), (i + w if y < h - 1 else -1)):
            if j >= 0 and not bg[j] and not keep[j]:
                keep[j] = 1
                q.append(j)
    for i in range(limit * w):
        if not bg[i] and not keep[i]:
            bg[i] = 1

    # A feathered ramp inward from the cut, rather than one soft pixel. One pixel is
    # still a hard line at any real display size, and the join between the painting
    # and the backdrop behind it was reading as cut-out paper. Measured in from the
    # boundary so the silhouette keeps its shape and only the last few pixels soften.
    RAMP = (70, 130, 185, 225)       # alpha at 1, 2, 3, 4 px in from the cut
    dist = bytearray(w * h)
    frontier = [i for i in range(w * h) if not bg[i] and (
        (i % w and bg[i - 1]) or (i % w < w - 1 and bg[i + 1]) or
        (i >= w and bg[i - w]) or (i < w * (h - 1) and bg[i + w]))]
    for i in frontier:
        dist[i] = 1
    cur = frontier
    for d in range(2, len(RAMP) + 1):
        nxt = []
        for i in cur:
            x, y = i % w, i // w
            for j in ((i - 1 if x else -1), (i + 1 if x < w - 1 else -1),
                      (i - w if y else -1), (i + w if y < h - 1 else -1)):
                if j >= 0 and not bg[j] and not dist[j]:
                    dist[j] = d
                    nxt.append(j)
        cur = nxt

    out = bytearray(w * h * 4)
    for i in range(w * h):
        o = i * 4
        out[o] = out[o + 1] = out[o + 2] = 255     # only alpha carries the mask
        if bg[i]:
            out[o + 3] = 0
        elif dist[i]:
            out[o + 3] = RAMP[dist[i] - 1]
        else:
            out[o + 3] = 255
    write_rgba(dst, w, h, out)
    return sum(bg), w * h

if __name__ == '__main__':
    cut, total = build(sys.argv[1], sys.argv[2])
    print(f'{sys.argv[2]}: {cut} px transparent ({100 * cut / total:.1f}%)')
