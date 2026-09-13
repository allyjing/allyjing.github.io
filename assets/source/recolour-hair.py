"""Match one sprite's hair colour to another's.

Statistical transfer per channel: shift the mean and rescale the spread, so the
internal shading of the hair (base tone, shadow, highlight, outline) is preserved
rather than being flattened to a single colour.
"""
import sys, math
sys.path.insert(0, '/Users/jingwenhuang/.claude/jobs/41521682/tmp')
from png import read_png, write_rgba

def is_hair(r, g, b):
    # Brown, and nothing else on her is brown: jeans and top are blue, skin is far
    # lighter, shoes are white. Red > green > blue with a real red-blue gap.
    return r > g > b and 40 < r < 215 and b < 165 and (r - b) > 25

def stats(path):
    w, h, n, px = read_png(path)
    ch = [[], [], []]
    for i in range(w*h):
        o = i*4
        if px[o+3] < 200: continue
        r, g, b = px[o], px[o+1], px[o+2]
        if is_hair(r, g, b):
            ch[0].append(r); ch[1].append(g); ch[2].append(b)
    out = []
    for c in ch:
        m = sum(c)/len(c)
        sd = math.sqrt(sum((v-m)**2 for v in c)/len(c))
        out.append((m, sd))
    return out

def recolour(src, dst, target):
    s, t = stats(src), stats(target)
    w, h, n, px = read_png(src)
    px = bytearray(px)
    changed = 0
    for i in range(w*h):
        o = i*4
        if px[o+3] == 0: continue
        r, g, b = px[o], px[o+1], px[o+2]
        if not is_hair(r, g, b): continue
        for k, v in enumerate((r, g, b)):
            sm, ssd = s[k]
            tm, tsd = t[k]
            scale = (tsd/ssd) if ssd > 1 else 1.0
            px[o+k] = max(0, min(255, round((v - sm)*scale + tm)))
        changed += 1
    write_rgba(dst, w, h, px)
    return changed

if __name__ == '__main__':
    src, dst, target = sys.argv[1], sys.argv[2], sys.argv[3]
    print(f'{dst}: recoloured {recolour(src, dst, target)} hair px')
