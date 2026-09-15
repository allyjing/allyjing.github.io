"""Give a sprite the same outline weight as the rest of the artwork.

Junnie came back in a softer style than everything else: measured against the scene
he had 2.7% dark-line pixels where the painting and Jingwen both have ~10%. His
outlines were light brown rather than the crisp near-black the artwork uses
everywhere, which is what read as "a different art style".

This deepens the pixels that are ALREADY the darkest -- his existing linework and
shadow -- and leaves the fur alone, so the ginger stays the warmest thing on screen
(design.md reserves that deliberately). It adds line weight; it does not repaint him.

The real fix is regenerating him with the exterior as an img2img style reference,
which is what assets/PROMPTS.md §3 asks for.
"""
import sys, os
# png.py lives beside this script. It used to be imported from a scratch directory
# outside the repo, which meant every script here stopped working as soon as that
# directory was cleaned up. Resolve it relative to THIS FILE so the scripts stay
# runnable from anywhere, including a fresh clone.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import colorsys
from png import read_png, write_rgba

LINE_BELOW = 0.62      # value under which a pixel counts as linework or shadow
LINE_SCALE = 0.58      # how far to push those down
FUR_SCALE  = 0.97      # the rest, barely touched

def match(src, dst):
    w, h, n, px = read_png(src)
    out = bytearray(w * h * 4)
    for i in range(w * h):
        o = i * 4
        a = px[o + 3] if n == 4 else 255
        r, g, b = px[o] / 255, px[o + 1] / 255, px[o + 2] / 255
        hh, ss, vv = colorsys.rgb_to_hsv(r, g, b)
        if vv < LINE_BELOW:
            # Ramp the effect in, so there is no visible step where the rule starts.
            t = vv / LINE_BELOW
            scale = LINE_SCALE + (1 - LINE_SCALE) * t
            vv *= scale
            ss *= 0.88          # the artwork's outlines are dark and fairly neutral
        else:
            vv *= FUR_SCALE
        r, g, b = colorsys.hsv_to_rgb(hh, min(1, ss), max(0, min(1, vv)))
        out[o], out[o + 1], out[o + 2], out[o + 3] = round(r*255), round(g*255), round(b*255), a
    write_rgba(dst, w, h, out)

if __name__ == '__main__':
    match(sys.argv[1], sys.argv[2])
    print(f'{sys.argv[2]}: line weight matched')
