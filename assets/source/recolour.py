"""Match one sprite's colours to another's, region by region.

Generated views drift in colour from the anchor sheet -- PRD §8.5 lists this as an
expected failure, and both the hair and the skin drifted on the back and side views.
Naming a hex value in the prompt does not reliably hold it, so the workable approach
is to generate, then measure and correct.

Statistical transfer per channel: shift the mean and rescale the spread, so internal
shading (base tone, shadow, highlight, outline) stays distinct rather than being
flattened to one colour.

    python3 recolour.py <sprite> <out> <anchor> hair
    python3 recolour.py <sprite> <out> <anchor> skin

Both regions are identified by colour, which works because nothing else on her is
brown or is a light warm tone: the top and jeans are blue, the shoes are neutral
white. CHECK THESE ASSUMPTIONS before reusing this on a different character.
"""
import sys, os
# png.py lives beside this script. It used to be imported from a scratch directory
# outside the repo, which meant every script here stopped working as soon as that
# directory was cleaned up. Resolve it relative to THIS FILE so the scripts stay
# runnable from anywhere, including a fresh clone.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import math
from png import read_png, write_rgba

def is_hair(r, g, b):
    return r > g > b and 40 < r < 215 and b < 165 and (r - b) > 25

def is_skin(r, g, b):
    # r-b > 12 keeps the near-neutral white shoes out of it.
    return r > 195 and r > g >= b and 12 < (r - b) < 85

REGIONS = {'hair': is_hair, 'skin': is_skin}

def is_rose_spill(r, g, b):
    """Dusty-rose background trapped inside the silhouette.

    The back and side sheets were generated on (191, 97, 140). Pockets of it get
    enclosed by the hair -- between strands, or in the curve where hair meets the
    shoulder -- and a flood fill from the border cannot reach them. They read as
    bright pink against dark brown.

    Skin is excluded because skin has blue BELOW green; this background has blue
    well above it. That is the discriminator.
    """
    return r > g + 30 and b > g + 15 and 120 < r < 235 and g < 170

def despill(src, dst, radius=4):
    """Inpaint trapped background from the surrounding pixels."""
    w, h, n, px = read_png(src)
    px = bytearray(px)
    bad = [i for i in range(w * h)
           if px[i*4+3] >= 200 and is_rose_spill(px[i*4], px[i*4+1], px[i*4+2])]
    for i in bad:
        x0, y0 = i % w, i // w
        acc, k = [0, 0, 0], 0
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                x, y = x0 + dx, y0 + dy
                if not (0 <= x < w and 0 <= y < h): continue
                j = (y * w + x) * 4
                if px[j+3] < 200: continue
                if is_rose_spill(px[j], px[j+1], px[j+2]): continue
                acc[0] += px[j]; acc[1] += px[j+1]; acc[2] += px[j+2]; k += 1
        if k:
            o = i * 4
            px[o], px[o+1], px[o+2] = acc[0]//k, acc[1]//k, acc[2]//k
    write_rgba(dst, w, h, px)
    return len(bad)

def stats(path, match):
    w, h, n, px = read_png(path)
    ch = [[], [], []]
    for i in range(w * h):
        o = i * 4
        if px[o + 3] < 200: continue
        r, g, b = px[o], px[o + 1], px[o + 2]
        if match(r, g, b):
            ch[0].append(r); ch[1].append(g); ch[2].append(b)
    out = []
    for c in ch:
        m = sum(c) / len(c)
        sd = math.sqrt(sum((v - m) ** 2 for v in c) / len(c))
        out.append((m, sd))
    return out

def recolour(src, dst, anchor, region):
    match = REGIONS[region]
    s, t = stats(src, match), stats(anchor, match)
    w, h, n, px = read_png(src)
    px = bytearray(px)
    changed = 0
    for i in range(w * h):
        o = i * 4
        if px[o + 3] == 0: continue
        r, g, b = px[o], px[o + 1], px[o + 2]
        if not match(r, g, b): continue
        for k, v in enumerate((r, g, b)):
            sm, ssd = s[k]
            tm, tsd = t[k]
            scale = (tsd / ssd) if ssd > 1 else 1.0
            px[o + k] = max(0, min(255, round((v - sm) * scale + tm)))
        changed += 1
    write_rgba(dst, w, h, px)
    return changed

if __name__ == '__main__':
    if sys.argv[1] == 'despill':
        src, dst = sys.argv[2:4]
        print(f'{dst}: despilled {despill(src, dst)} px')
    else:
        src, dst, anchor, region = sys.argv[1:5]
        print(f'{dst}: {recolour(src, dst, anchor, region)} {region} px')
