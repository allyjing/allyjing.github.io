"""Remove leftover key colour from a keyed scene by RECOLOURING, not cutting.

After the mask is built, a few small specks of background survive inside the
subject: in the mouth of the downspout, and between the fountain's tiers. They are
too small for the mask's size rule and too blended for its tolerance.

They cannot simply be cut. The bougainvillea's blossoms are shaded with the same
colour, so anything aggressive enough to remove a speck also punches holes through
the flowers. Recolouring is safe in a way that cutting is not: the worst case for a
flower pixel is that it takes the colour of the flower next to it, which is
invisible, while a speck of trapped background takes the colour of the stone or
metal around it and disappears.

Groups are capped in size so the flowers' own large shaded areas are never touched.

    python3 despill-scene.py <source.png> <mask.png> <out.png>
"""
import sys, os
# png.py lives beside this script. It used to be imported from a scratch directory
# outside the repo, which meant every script here stopped working as soon as that
# directory was cleaned up. Resolve it relative to THIS FILE so the scripts stay
# runnable from anywhere, including a fresh clone.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from png import read_png, write_rgba

NEAR = 44        # counts as "still looks like the background"
CLEAN = 52       # far enough from it to be a safe colour to sample
MAX_GROUP = 900
RADIUS = 6

# Where to look, as fractions of the frame: x0, x1, y0, y1.
#
# Scoped ON PURPOSE, after two attempts to find a general rule failed. The leftover
# specks and the bougainvillea's shading are the same colour, so colour cannot
# separate them; size cannot either, because the specks on the water jets are as
# large as the shading inside a blossom; and context cannot, because a blossom is
# ringed by leaves, which reads as "not pink" exactly like stone does. Each attempt
# either left the specks or left muddy brown patches through the flowers.
#
# The defects are in two known places in one painting, so the honest fix is to say
# where. Re-derive this box if the exterior is ever regenerated — or drop the script
# entirely, since a cleaner generation would not need it.
REGIONS = [
    (0.56, 0.84, 0.36, 0.78),   # the fountain and the right-hand downspout
    (0.11, 0.21, 0.19, 0.35),   # the gutter elbow at the left roof corner
]

# Both boxes sit clear of the bougainvillea, which is what makes them safe: the
# planting starts below y=0.40, so nothing here can reach a blossom.

def despill(src, maskpath, dst):
    w, h, n, px = read_png(src)
    mask = read_png(maskpath)[3]
    kr, kg, kb = px[0], px[1], px[2]

    def d2(i):
        o = i * n
        return (px[o]-kr)**2 + (px[o+1]-kg)**2 + (px[o+2]-kb)**2

    kept = lambda i: mask[i*4+3] >= 128
    near = bytearray(w * h)
    for i in range(w * h):
        if kept(i) and d2(i) < NEAR*NEAR:
            near[i] = 1

    out = bytearray(w * h * 4)
    for i in range(w * h):
        o, s = i*4, i*n
        out[o], out[o+1], out[o+2], out[o+3] = px[s], px[s+1], px[s+2], 255

    boxes = [(int(a*w), int(b*w), int(c*h), int(d*h)) for a, b, c, d in REGIONS]

    def inside(x, y):
        return any(x0 <= x < x1 and y0 <= y < y1 for x0, x1, y0, y1 in boxes)

    seen = bytearray(w * h)
    fixed = 0
    for start in range(w * h):
        if not near[start] or seen[start]:
            continue
        sx, sy = start % w, start // w
        if not inside(sx, sy):
            continue
        blob, stack, seen[start] = [], [start], 1
        while stack:
            i = stack.pop()
            blob.append(i)
            x, y = i % w, i // w
            for j in ((i-1 if x else -1), (i+1 if x < w-1 else -1),
                      (i-w if y else -1), (i+w if y < h-1 else -1)):
                if j >= 0 and near[j] and not seen[j]:
                    seen[j] = 1; stack.append(j)
        if len(blob) > MAX_GROUP:
            continue

        for i in blob:
            x0, y0 = i % w, i // w
            acc, k = [0, 0, 0], 0
            for dy in range(-RADIUS, RADIUS+1):
                for dx in range(-RADIUS, RADIUS+1):
                    x, y = x0+dx, y0+dy
                    if not (0 <= x < w and 0 <= y < h):
                        continue
                    j = y*w + x
                    if not kept(j) or d2(j) < CLEAN*CLEAN:
                        continue
                    acc[0] += px[j*n]; acc[1] += px[j*n+1]; acc[2] += px[j*n+2]; k += 1
            if k:
                o = i*4
                out[o], out[o+1], out[o+2] = acc[0]//k, acc[1]//k, acc[2]//k
                fixed += 1
    write_rgba(dst, w, h, out)
    return fixed

if __name__ == '__main__':
    print(f'{sys.argv[3]}: recoloured {despill(*sys.argv[1:4])} px')
