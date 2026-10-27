"""Vectorise the Starbucks siren from the supplied logo PNG into extrudable shapes.

Output: src/siren.json with parts {center, L1..L3, R1..R3}; each part holds
"white" (raised siren pieces) and "back" (green linework plate) shapes in
logo units (circle radius = 1, y up), plus the hinge x of every arm segment.
"""
import json
import sys

import cv2
import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "assets/logo/starbucks_logo.png"
OUT = sys.argv[2] if len(sys.argv) > 2 else "src/siren.json"
UP = 2  # supersample for smoother contours
CX, CY, R = 638.6, 643.1, 634.0
HINGE_L, HINGE_R = 395, 884          # logo px: where the tails meet the body
CUTS_L = [HINGE_L, 268, 138, -10]    # segment borders, inner -> outer
CUTS_R = [HINGE_R, 1011, 1141, 1300]

im = np.array(Image.open(SRC).convert("RGBA")).astype(np.float32)
H, W = im.shape[:2]
whiteness = im[..., :3].min(-1) * (im[..., 3] / 255.0)
big = cv2.resize(whiteness, (W * UP, H * UP), interpolation=cv2.INTER_CUBIC)
yy, xx = np.mgrid[0 : H * UP, 0 : W * UP] / UP
inside = ((xx - CX) ** 2 + (yy - CY) ** 2) < R * R
white = ((big > 140) & inside).astype(np.uint8)

n, lab, st, cen = cv2.connectedComponentsWithStats(white, 8)
left = np.zeros_like(white)
right = np.zeros_like(white)
center = np.zeros_like(white)
for i in range(1, n):
    if st[i, 4] < 300 * UP * UP:
        continue  # rim slivers
    cx = cen[i][0] / UP
    target = left if cx < 380 else right if cx > 900 else center
    target[lab == i] = 1


def plate(mask, k, vertical=0):
    """Linework backing: close the gaps between strands/scallops, fill holes."""
    ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k * UP, k * UP))
    closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, ker)
    if vertical:  # tails: bridge the stripes between stacked scallops only
        vk = cv2.getStructuringElement(cv2.MORPH_RECT, (3 * UP, vertical * UP))
        closed = cv2.morphologyEx(closed, cv2.MORPH_CLOSE, vk)
    cnts, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = np.zeros_like(mask)
    cv2.drawContours(out, cnts, -1, 1, thickness=cv2.FILLED)
    return out & inside.astype(np.uint8)


def shapes(mask, min_area=60):
    cnts, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    res = []
    if hier is None:
        return res
    hier = hier[0]

    def conv(c):
        c = cv2.approxPolyDP(c, 0.9 * UP, True)[:, 0, :].astype(float) / UP
        return [[round((x - CX) / R, 5), round(-(y - CY) / R, 5)] for x, y in c]

    for i, h in enumerate(hier):
        if h[3] != -1 or cv2.contourArea(cnts[i]) < min_area * UP * UP:
            continue
        holes = []
        j = h[2]
        while j != -1:
            if cv2.contourArea(cnts[j]) > 8 * UP * UP:
                holes.append(conv(cnts[j]))
            j = hier[j][0]
        res.append({"outer": conv(cnts[i]), "holes": holes})
    return res


def band(mask, x0, x1):
    lo, hi = sorted((x0, x1))
    m = mask.copy()
    m[:, : max(0, int(lo * UP))] = 0
    m[:, int(hi * UP) :] = 0
    return m


parts = {}
parts["center"] = {"white": shapes(center), "back": shapes(plate(center, 46)), "hinge": 0}
for side, mask, cuts in (("L", left, CUTS_L), ("R", right, CUTS_R)):
    back = plate(mask, 18, vertical=46)
    for s in range(3):
        a, b = cuts[s], cuts[s + 1]
        parts[f"{side}{s + 1}"] = {
            "white": shapes(band(mask, a, b), 20),
            "back": shapes(band(back, a, b), 20),
            "hinge": round((a - CX) / R, 5),
        }

json.dump({"parts": parts}, open(OUT, "w"))
for k, v in parts.items():
    pts = sum(len(s["outer"]) + sum(len(h) for h in s["holes"]) for s in v["white"] + v["back"])
    print(k, len(v["white"]), len(v["back"]), pts, v["hinge"])

# debug preview
vis = np.zeros((H * UP, W * UP, 3), np.uint8)
vis[plate(center, 46) > 0] = (0, 90, 60)
vis[center > 0] = (255, 255, 255)
for side, mask in (("L", left), ("R", right)):
    vis[plate(mask, 18, vertical=46) > 0] = (0, 60, 120)
    vis[mask > 0] = (255, 200, 220)
Image.fromarray(vis).resize((640, 644)).save("cache/siren_parts.png")
