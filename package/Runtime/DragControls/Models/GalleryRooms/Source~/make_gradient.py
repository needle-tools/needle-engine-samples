# Vertical wall gradient for the gallery rooms: bottom row = floor, top row = top of the back wall.
# Dithered against 8-bit banding; tiles horizontally (U follows the wall, see build_rooms.py).
import random, struct, sys, zlib

W, H = 128, 512
STOPS = [  # (height 0..1, sRGB)
    (0.00, (0.70, 0.67, 0.63)),
    (0.12, (0.79, 0.77, 0.73)),
    (0.45, (0.87, 0.86, 0.83)),
    (1.00, (0.95, 0.96, 0.97)),
]

def color(t):
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        if t <= t1:
            s = (t - t0) / (t1 - t0)
            s = s * s * (3 - 2 * s)
            return [a + (b - a) * s for a, b in zip(c0, c1)]
    return list(STOPS[-1][1])

# triangular noise of +-1 step, the same offset on all channels so it reads as grain, not color speckle
rng = random.Random(1)
rows = bytearray()
for y in range(H):  # PNG rows go top to bottom
    c = [v * 255 for v in color(1 - (y + 0.5) / H)]
    rows.append(0)
    for x in range(W):
        n = rng.random() - rng.random()
        rows += bytes(min(255, max(0, round(v + n))) for v in c)

def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0)) \
    + chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + chunk(b"IEND", b"")
open(sys.argv[1], "wb").write(png)
