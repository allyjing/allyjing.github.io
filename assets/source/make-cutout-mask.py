"""Build an alpha mask for a scene generated as a cutout on a flat background.

The exterior is now generated with everything above the ground painted flat magenta,
so the landmark backdrop shows through. This turns that into a mask, which is paired
with the artwork as a JPEG: the mask is a few KB of almost-flat alpha, where the
equivalent RGBA PNG of the same picture runs close to a megabyte.

Two passes, because neither alone is right.

A border flood fill at a generous tolerance catches the background and the blended
pixels along every edge, and its connectivity is what protects the bougainvillea —
which is pink and lands within ~30 of the key colour.

But the fill cannot reach background that is ENCLOSED by the subject: the gaps
between the fountain's tiers and its water streams, and the slot between the
downspout and the wall. Those were left as bright magenta patches. So a second pass
cuts key colour anywhere, at a much tighter tolerance, and is kept independent of the
fill so it cannot seed further spreading. Measured on this art: the pure background
spans distance 0-7, so 10 is safe. Re-measure before reusing this.

    python3 make-cutout-mask.py <source.png> <mask.png> [tolerance] [tight]
"""
import sys
sys.path.insert(0, '/Users/jingwenhuang/.claude/jobs/41521682/tmp')
from png import read_png, write_rgba
from collections import deque

RAMP = (70, 130, 185, 225)      # alpha at 1..4 px in from the cut, so the edge is
                                # a ramp rather than a staircase

def build(src, dst, tol=38, tight=10, min_pocket=120, loose=34):
    w, h, n, px = read_png(src)
    kr, kg, kb = px[0], px[1], px[2]
    t2, tight2 = tol * tol, tight * tight

    def dist2(i):
        o = i * n
        return (px[o]-kr)**2 + (px[o+1]-kg)**2 + (px[o+2]-kb)**2

    def is_key(i):
        return dist2(i) < t2

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

    # Second pass: the pockets of background the fill cannot reach, because they are
    # enclosed by the subject -- between the fountain's tiers and its water streams,
    # and in the slot behind the downspout.
    #
    # Colour alone cannot find these. The bougainvillea's blossoms are shaded with
    # LITERALLY the background colour, so any tolerance that catches a pocket also
    # punches holes through the flowers. What separates them is size: a pocket is a
    # contiguous region of a few hundred pixels, the speckles inside a blossom are a
    # handful each.
    #
    # So: mark key-coloured pixels at a tight tolerance, group them, and cut only the
    # groups big enough to be real gaps. Kept strictly INDEPENDENT of the flood fill
    # above -- seeding the fill from these let it spread outward at the looser
    # tolerance and eat the blossoms wholesale.
    seed = bytearray(w * h)
    for i in range(w * h):
        if not bg[i] and dist2(i) < tight2:
            seed[i] = 1

    seen = bytearray(w * h)
    for start in range(w * h):
        if not seed[start] or seen[start]:
            continue
        blob, stack, seen[start] = [], [start], 1
        while stack:
            i = stack.pop()
            blob.append(i)
            x, y = i % w, i // w
            for j in ((i-1 if x else -1), (i+1 if x < w-1 else -1),
                      (i-w if y else -1), (i+w if y < h-1 else -1)):
                if j >= 0 and seed[j] and not seen[j]:
                    seen[j] = 1; stack.append(j)
        if len(blob) >= min_pocket:
            for i in blob:
                bg[i] = 1

    # Third pass: the small stubborn ones -- inside the downspout, and in the middle
    # of the fountain between the tiers. Too small for the size rule above and too
    # blended for its tolerance, so neither size nor colour finds them.
    #
    # What does: WHAT SURROUNDS THEM. A near-key patch inside a bougainvillea blossom
    # is ringed by more pink, because it is flower shading. A patch of trapped
    # background is ringed by whatever encloses it -- stone, metal, dark outline --
    # which is all near-neutral. So group the leftovers, look at the ring just
    # outside each group, and cut only the ones that are not sitting in pink.
    loose2 = loose * loose
    near = bytearray(w * h)
    for i in range(w * h):
        if not bg[i] and dist2(i) < loose2:
            near[i] = 1

    def pinkish(i):
        o = i * n
        r, g, b = px[o], px[o+1], px[o+2]
        return r > g + 25 and b > g + 10

    seen = bytearray(w * h)
    for start in range(w * h):
        if not near[start] or seen[start]:
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
        if len(blob) < 12:
            continue
        cells = set(blob)
        ring, pink = 0, 0
        for i in blob:
            x, y = i % w, i // w
            for j in ((i-1 if x else -1), (i+1 if x < w-1 else -1),
                      (i-w if y else -1), (i+w if y < h-1 else -1)):
                if j < 0 or j in cells or bg[j]:
                    continue
                ring += 1
                if pinkish(j):
                    pink += 1
        if ring and pink / ring < 0.45:
            for i in blob:
                bg[i] = 1

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
    tight = int(sys.argv[4]) if len(sys.argv) > 4 else 10
    cut, total = build(sys.argv[1], sys.argv[2], tol, tight)
    print(f'{sys.argv[2]}: {cut} px transparent ({100*cut/total:.1f}%)')
