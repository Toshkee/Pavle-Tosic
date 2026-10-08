"""Cuts the landing Memoji into the layers MemojiGaze.tsx moves: the face
with both irises painted out (memoji-still.webp), one iris cutout per eye
and one eye-opening mask per eye, all in public/images/. Input: a 448x448
RGBA PNG of the neutral frame (the first frame of the Messages recording,
see CLAUDE.md). Geometry below is measured on that frame; re-measure if
the frame changes.  usage: python3 scripts/memoji-gaze.py frame.png"""
import sys
import numpy as np
from PIL import Image, ImageFilter

SRC = sys.argv[1]
OUT = "public/images"
# Per eye: iris circle, and the window (x, y, w, h) the mask and cutout cover.
EYES = {
    "left": dict(cx=163, cy=263, r=22, win=(124, 242, 76, 44), limit=(161, 264, 36, 19)),
    "right": dict(cx=282, cy=263, r=24, win=(244, 240, 76, 44), limit=(282, 262, 37, 19)),
}
LASH_MAX = 6  # px of dark lash line stripped off the top of each column

im = Image.open(SRC).convert("RGBA")
arr = np.array(im).astype(int)
R, G, B, A = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
skin = (R > 185) & (G > 130) & (B > 105) & (R - B > 30) & (A > 200)
dark = (R + G + B) < 170
H, W = R.shape
yy, xx = np.mgrid[0:H, 0:W]

def disc(cx, cy, r):
    return (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r

def flood(seed_mask, start):
    out = np.zeros_like(seed_mask)
    stack = [start]
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= W or y >= H or out[y, x] or not seed_mask[y, x]:
            continue
        out[y, x] = True
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return out

still = arr.copy()
for name, eye in EYES.items():
    cx, cy, r = eye["cx"], eye["cy"], eye["r"]
    lx, ly, lrx, lry = eye["limit"]
    inside = ((xx - lx) / lrx) ** 2 + ((yy - ly) / lry) ** 2 <= 1
    opening = flood(~skin & inside & (A > 200), (cx, cy))
    # The lash line: in each column, from the top of the opening (lid
    # shadow included) down through the first dark run, if one starts
    # within LASH_MAX rows of the top.
    lash = np.zeros_like(opening)
    for x in range(W):
        col = np.where(opening[:, x])[0]
        if len(col) == 0:
            continue
        top = col[0]
        start = next((y for y in range(top, top + LASH_MAX) if y < H and opening[y, x] and dark[y, x]), None)
        if start is None:
            continue
        end = start
        while end < start + LASH_MAX and end < H and opening[end, x] and dark[end, x]:
            end += 1
        lash[top:end, x] = True
    eye_area = opening & ~lash
    cut = disc(cx, cy, r + 2) & eye_area
    # Paint the sclera back in: each row blends from the sclera colour just
    # left of the iris to the one just right of it, and the samples are
    # smoothed down the rows so the fill has no banding.
    sclera = eye_area & ~disc(cx, cy, r + 4) & (np.minimum(np.minimum(R, G), B) > 150)
    fallback = arr[sclera][:, :3].mean(axis=0)
    rows = np.unique(yy[cut])
    def side(y, left):
        xs = np.where(sclera[y])[0]
        xs = xs[xs < cx] if left else xs[xs > cx]
        xs = xs[-4:] if left else xs[:4]
        return arr[y, xs, :3].mean(axis=0) if len(xs) else None
    samples = {}
    for y in rows:
        l, rr = side(y, True), side(y, False)
        samples[y] = (l if l is not None else (rr if rr is not None else fallback), rr if rr is not None else (l if l is not None else fallback))
    def smooth(y, k):
        near = [samples[v][k] for v in rows if abs(v - y) <= 2]
        return np.mean(near, axis=0)
    for y in rows:
        xs = np.where(cut[y])[0]
        l, rr = smooth(y, 0), smooth(y, 1)
        t = (xs - xs.min()) / max(xs.max() - xs.min(), 1)
        still[y, xs, :3] = (l[None, :] * (1 - t[:, None]) + rr[None, :] * t[:, None])
    wx, wy, ww, wh = eye["win"]
    # Iris cutout: original pixels inside the disc, feathered 1px at the rim.
    feather = Image.fromarray((disc(cx, cy, r + 2) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    iris = arr.copy()
    iris[..., 3] = np.minimum(A, np.array(feather)) * eye_area
    Image.fromarray(iris.astype(np.uint8)).crop((wx, wy, wx + ww, wy + wh)).save(f"{OUT}/memoji-iris-{name}.webp", "WEBP", lossless=True)
    # Mask: where the iris may show (alpha).
    mask = np.zeros((H, W, 4), dtype=np.uint8)
    mask[..., 3] = eye_area * 255
    Image.fromarray(mask).crop((wx, wy, wx + ww, wy + wh)).filter(ImageFilter.GaussianBlur(0.5)).save(f"{OUT}/memoji-eye-{name}-mask.webp", "WEBP", lossless=True)
    print(name, "opening px", int(opening.sum()), "lash px", int(lash.sum()), "fill px", int(cut.sum()), "sclera", fallback.round())

Image.fromarray(still.astype(np.uint8)).save(f"{OUT}/memoji-still.webp", "WEBP", quality=90, method=6)
print("written")
