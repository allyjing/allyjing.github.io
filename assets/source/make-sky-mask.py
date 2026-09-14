"""Build the alpha mask that punches the sky out of the exterior painting.

The painting is opaque edge to edge, so without this the landmark backdrop behind it
is never visible. Regenerating the exterior as a real transparent cutout replaces
this entirely -- see assets/PROMPTS.md.

Two constraints make this fiddly, and both were learned by getting it wrong:

  * The bakery wall (56 from sky), the fountain water (45) and the fountain stone
    (57) are all CLOSE to the sky colour. A generous tolerance removes them, which
    is how the fountain ended up showing the sunset through it. Tolerance 40 keeps
    every one of them and still covers the sky's own variation (~25).

  * Sky trapped between the trees is not reachable by a flood fill from the border,
    so a fill alone leaves blue pockets that do not change with the backdrop. Above
    the horizon the tight tolerance makes an unconditional colour test safe, so the
    pockets go too.

Nothing below the horizon is ever removed. That is what protects the fountain.
"""
import sys
sys.path.insert(0, '/Users/jingwenhuang/.claude/jobs/41521682/tmp')
from png import read_png, write_rgba
from collections import deque

SKY = (195, 223, 233)
TOL = 40
HORIZON = 0.52          # fraction of height; the fountain starts just below this

def build(src, dst):
    w, h, n, px = read_png(src)
    limit = int(h * HORIZON)
    t2 = TOL * TOL
    bg = bytearray(w * h)

    def near_sky(i):
        o = i * n
        return ((px[o]-SKY[0])**2 + (px[o+1]-SKY[1])**2 + (px[o+2]-SKY[2])**2) < t2

    # Pass A -- sky by colour, anywhere above the horizon, pockets included.
    q = deque()
    for y in range(limit):
        for x in range(w):
            i = y*w + x
            if near_sky(i):
                bg[i] = 1
                q.append(i)

    # Pass B -- grow into the clouds. Cloud cores are too bright for the sky
    # tolerance, but they touch the sky, so reach them by connectivity instead.
    #
    # The test has to be tight. A first attempt at "light and near-neutral" also
    # matched the bakery's cream wall (246,244,222) and dissolved it -- the dark
    # outlines did NOT stop it, because the white gable trim touches the sky. Clouds
    # are almost perfectly neutral (spread ~5) while the cream wall is visibly warm
    # (spread 24), so the channel spread is the discriminator, not brightness.
    def cloudish(i):
        o = i * n
        r, g, b = px[o], px[o+1], px[o+2]
        return min(r, g, b) > 200 and (max(r, g, b) - min(r, g, b)) < 15

    while q:
        i = q.popleft()
        x, y = i % w, i // w
        for j in ((i-1 if x else -1), (i+1 if x < w-1 else -1),
                  (i-w if y else -1), (i+w if y < limit-1 else -1)):
            if j >= 0 and not bg[j] and cloudish(j):
                bg[j] = 1
                q.append(j)

    # One feathered pixel so the cut is not a hard staircase.
    edge = bytearray(w*h)
    for y in range(1, h-1):
        for x in range(1, w-1):
            i = y*w + x
            if not bg[i] and (bg[i-1] or bg[i+1] or bg[i-w] or bg[i+w]):
                edge[i] = 1

    out = bytearray(w*h*4)
    for i in range(w*h):
        o = i*4
        out[o] = out[o+1] = out[o+2] = 255      # only alpha carries the mask
        out[o+3] = 0 if bg[i] else (150 if edge[i] else 255)
    write_rgba(dst, w, h, out)
    return sum(bg), w*h

if __name__ == '__main__':
    cut, total = build(sys.argv[1], sys.argv[2])
    print(f'{sys.argv[2]}: {cut} px transparent ({100*cut/total:.1f}%)')
