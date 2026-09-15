"""Cut a keyed character sprite into a body and two legs.

The legs are emitted FULL WIDTH, with the divide between them carried in their own
transparency rather than by cropping to a box. That is the whole point: a box forces
the divide to be a straight vertical line, and in profile that is wrong.

  head-on  the two legs have a real gap between them, so a straight line down the
           middle lands in the gap and each leg keeps its shoe.

  profile  NOT CUT AT ALL, and that is a finding rather than a shortcut. Every row
           through the shoe band is solid: measured, there is not one interior gap
           anywhere between y=648 and the sole. The two shoes are drawn as a single
           continuous mass, so no boundary — vertical, slanted, or traced along the
           outlines — can leave both of them whole. Three were tried: a vertical cut
           halves a shoe, a right-slanting one gives both shoes to the back leg, a
           left-slanting one gives both to the front.

           A side pose drawn MID-STRIDE, with the feet apart and daylight between
           them, would cut cleanly. That is an art fix, not a code one.

The body is cut well past the hip so the top of a leg stays hidden behind it while
the leg translates upward during a step; see the step keyframes in scenes.css.
"""
import sys
sys.path.insert(0, '/Users/jingwenhuang/.claude/jobs/41521682/tmp')
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

def cut(src, prefix, points):
    w, h, n, px = read_png(src)
    hip, body_end = round(h * HIP_PCT / 100), round(h * BODY_PCT / 100)

    out = bytearray(w * body_end * 4)
    for y in range(body_end):
        for x in range(w):
            i, o = (y*w + x) * 4, (y*w + x) * 4
            out[o:o+4] = px[i:i+4]
    write_rgba(f'assets/sprites/{prefix}-body.png', w, body_end, out)

    legh = h - hip
    for side in ('left', 'right'):
        out = bytearray(w * legh * 4)
        for yy in range(legh):
            f = yy / max(1, legh - 1)
            bound = boundary_at(points, f)
            for x in range(w):
                if (x < bound) != (side == 'left'):
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

    print('jingwen-side: not cut — the shoes overlap with no gap; see the note above')
