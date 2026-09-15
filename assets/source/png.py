"""Minimal PNG read/write + magenta key. Stdlib only (zlib, struct)."""
import zlib, struct

def read_png(path):
    d = open(path,'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n'
    pos, idat, pal = 8, b'', None
    while pos < len(d):
        ln, typ = struct.unpack('>I4s', d[pos:pos+8])
        body = d[pos+8:pos+8+ln]
        if typ == b'IHDR':
            w,h,bd,ct,_,_,il = struct.unpack('>IIBBBBB', body)
            assert bd == 8 and il == 0, f'need 8-bit non-interlaced, got bd={bd} il={il}'
        elif typ == b'IDAT': idat += body
        elif typ == b'PLTE': pal = body
        elif typ == b'IEND': break
        pos += 12 + ln
    nch = {0:1, 2:3, 3:1, 4:2, 6:4}[ct]
    raw = zlib.decompress(idat)
    stride = w * nch
    out, prev, p = bytearray(), bytearray(stride), 0
    for _ in range(h):                      # undo per-scanline filters
        f = raw[p]; p += 1
        line = bytearray(raw[p:p+stride]); p += stride
        for i in range(stride):
            a = line[i-nch] if i >= nch else 0
            b = prev[i]
            c = prev[i-nch] if i >= nch else 0
            x = line[i]
            if   f == 1: x += a
            elif f == 2: x += b
            elif f == 3: x += (a+b)//2
            elif f == 4:                    # Paeth
                pa,pb,pc = abs(b-c), abs(a-c), abs(a+b-2*c)
                x += a if (pa<=pb and pa<=pc) else (b if pb<=pc else c)
            line[i] = x & 0xFF
        out += line; prev = line
    if ct == 3:                             # expand palette to RGB
        rgb = bytearray()
        for v in out: rgb += pal[v*3:v*3+3]
        out, nch = rgb, 3
    return w, h, nch, out

def write_rgba(path, w, h, px):
    """Adaptive row filtering: try all five, keep whichever has the smallest sum of
    absolute signed deviations. That is the standard heuristic and it roughly halves
    the output for smooth artwork versus always using filter 0."""
    bpp, stride = 4, w*4
    raw, prev = bytearray(), bytearray(stride)
    for y in range(h):
        line = px[y*stride:(y+1)*stride]
        best, bestcost = None, None
        for f in range(5):
            cur = bytearray(stride)
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i-bpp] if i >= bpp else 0
                x = line[i]
                if   f == 0: v = x
                elif f == 1: v = x - a
                elif f == 2: v = x - b
                elif f == 3: v = x - (a+b)//2
                else:
                    pa, pb, pc = abs(b-c), abs(a-c), abs(a+b-2*c)
                    v = x - (a if (pa<=pb and pa<=pc) else (b if pb<=pc else c))
                cur[i] = v & 0xFF
            cost = sum(v if v < 128 else 256-v for v in cur)
            if bestcost is None or cost < bestcost:
                best, bestcost, bestf = cur, cost, f
        raw.append(bestf); raw += best
        prev = line
    def chunk(t, b):
        return struct.pack('>I', len(b)) + t + b + struct.pack('>I', zlib.crc32(t+b) & 0xFFFFFFFF)
    open(path,'wb').write(
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
        + chunk(b'IEND', b''))
