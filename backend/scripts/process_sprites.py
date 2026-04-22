"""Post-process Gemini sprites to add alpha channel and trim whitespace.

Gemini Nano Banana returned RGB PNGs with solid-color backgrounds instead of
transparent. This script:
 1. Samples the 4 corner pixels to estimate the background color.
 2. Converts pixels within tolerance to transparent.
 3. Trims the transparent border.
 4. Saves an RGBA PNG back in place.

Run once after each generation pass. Idempotent — safe to re-run.
"""
import os
from PIL import Image, ImageChops

SPRITE_DIRS = [
    "/app/frontend/public/sprites",
    "/app/godot_project/HyperAxel/sprites",
]

TOLERANCE = 42          # chroma-key tolerance per channel
ERODE_ALPHA_PX = 1      # shave 1 px of semi-transparent fringe


def bg_color(im):
    """Guess background color from corners (majority vote)."""
    w, h = im.size
    corners = [im.getpixel(p) for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]]
    # use the mode/most-common corner
    from collections import Counter
    return Counter(corners).most_common(1)[0][0][:3]


def process(path):
    im = Image.open(path).convert("RGBA")
    r0, g0, b0 = bg_color(im)
    data = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = data[x, y]
            if (abs(r - r0) <= TOLERANCE and
                abs(g - g0) <= TOLERANCE and
                abs(b - b0) <= TOLERANCE):
                data[x, y] = (r, g, b, 0)
    # trim fully-transparent borders
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    im.save(path, "PNG")
    return im.size


if __name__ == "__main__":
    for d in SPRITE_DIRS:
        if not os.path.isdir(d):
            continue
        print(f"\n== {d} ==")
        for fn in sorted(os.listdir(d)):
            if not fn.endswith(".png"):
                continue
            p = os.path.join(d, fn)
            before = Image.open(p).size
            after = process(p)
            print(f"  {fn}: {before} -> {after}")
