"""Alpha extraction via flood-fill from corners — handles gradient backgrounds."""
import os
from PIL import Image
from collections import deque

SPRITE_DIRS = [
    "/app/frontend/public/sprites",
    "/app/godot_project/HyperAxel/sprites",
]

TOL = 55  # per-channel tolerance when growing the flood


def flood_alpha(im):
    w, h = im.size
    im = im.convert("RGBA")
    data = im.load()

    # seed from all 4 corners with their own colors
    visited = [[False] * h for _ in range(w)]
    q = deque()
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    seed_colors = [data[x, y][:3] for x, y in seeds]

    for (x, y), col in zip(seeds, seed_colors):
        visited[x][y] = True
        q.append((x, y, col))

    while q:
        x, y, col = q.popleft()
        r, g, b, a = data[x, y]
        data[x, y] = (r, g, b, 0)

        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                nr, ng, nb, _ = data[nx, ny]
                if (abs(nr - col[0]) <= TOL and
                    abs(ng - col[1]) <= TOL and
                    abs(nb - col[2]) <= TOL):
                    visited[nx][ny] = True
                    # Use a rolling reference — average seed + current to adapt to gradient
                    new_col = ((col[0] + nr) // 2, (col[1] + ng) // 2, (col[2] + nb) // 2)
                    q.append((nx, ny, new_col))

    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    return im


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
            im = flood_alpha(Image.open(p))
            im.save(p, "PNG")
            print(f"  {fn}: {before} -> {im.size}")
