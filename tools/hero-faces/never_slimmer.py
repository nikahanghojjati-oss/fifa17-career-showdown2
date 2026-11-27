#!/usr/bin/env python3
"""Duet P4 hero faces: the never-slimmer check (Nik 2026-11-24 / 2026-11-26) for a fixed hero picture.

A fixed hero must never be smaller or thinner than today's outline: where it shrinks, the room shows through as a ghost.
The room right behind the man is the same in both pictures (fixes only paint inside the hero mask), so this walks the hero
outline (tools/clubhouse-themes/masks/<mask>.png) on the fixed man's side and, at every outline point, reads the room just
outside it, then steps inward until the picture stops looking like that room: a colour change of more than 12, or more
fine texture than the room has (a dark beard on a dark wall is still beard: it has hair texture, the wall has none).
That inward distance is measured on today's picture (BEFORE, a git ref) and on the new one; where the new hero starts more
than 1 px (at 1536 wide) further in, along a run of 4 of 5 neighbouring outline points, the hero got slimmer there.
  short_pts  = outline points in such runs (must be 0);
  room_moved = pixels outside the outline, beyond 1 px, that changed by more than 12 (WebP noise allowance).
GrabCut was used before 2026-11-26 and read a dark beard against the dark archive wall as room; do not go back to it.
Writes the result with each file's sha256 to --out, for the contract to read.

  python3 tools/hero-faces/never_slimmer.py --before <ref> --side right --out tests/fixtures/team-v/<NAME>.json \
      <file.webp>:<mask> [more...]
"""
import argparse, hashlib, io, json, os, subprocess
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MASKS = os.path.join(ROOT, "tools", "clubhouse-themes", "masks")
T = 12

def old_bytes(ref, rel):
    return subprocess.run(["git", "-C", ROOT, "show", f"{ref}:{rel}"], capture_output=True, check=True).stdout

def mask_at(mask, W, H):
    return np.asarray(Image.open(os.path.join(MASKS, mask + ".png")).convert("L").resize((W, H), Image.LANCZOS)) > 127

def outline(mask, W, H, side):
    """outline points of the hero mask on one side, with unit normals pointing out into the room."""
    m = mask_at(mask, W, H)
    cnt, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    P, N = [], []
    for c in cnt:
        c = c[:, 0, :].astype(np.float32)
        if len(c) < 20: continue
        t = np.roll(c, -3, 0) - np.roll(c, 3, 0); n = np.stack([t[:, 1], -t[:, 0]], 1)
        n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-6
        x = np.clip((c + n * 3).round().astype(int), 0, [W - 1, H - 1]); n[m[x[:, 1], x[:, 0]]] *= -1
        P.append(c); N.append(n)
    P, N = np.concatenate(P), np.concatenate(N)
    keep = ((P[:, 0] >= W / 2) if side == "right" else (P[:, 0] < W / 2)) & (P[:, 1] < H - 3) & (P[:, 0] > 2) & (P[:, 0] < W - 3)
    return P[keep], N[keep]

def depth(img, P, N, sc):
    """per outline point: how far inside the outline (negative = outside it) the picture first stops looking like the room."""
    H, W = img.shape[:2]; f = img.astype(np.float32)
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32)
    tx = cv2.GaussianBlur(np.abs(g - cv2.GaussianBlur(g, (0, 0), 1.2)), (0, 0), 1.5)
    def at(a, xy):
        x = np.clip(np.round(xy[:, 0]).astype(int), 0, W - 1); y = np.clip(np.round(xy[:, 1]).astype(int), 0, H - 1); return a[y, x]
    out = np.arange(5, 15) * sc
    room = np.median(np.stack([at(f, P + N * d) for d in out]), 0)
    troom = np.max(np.stack([at(tx, P + N * d) for d in out]), 0)
    k0 = int(3 * sc); ks = range(-k0, int(24 * sc))
    dif = np.stack([np.maximum(np.abs(at(f, P - N * k) - room).max(1), (at(tx, P - N * k) - troom - 1.5) * T) for k in ks])
    dif = np.stack([dif[max(0, i - 1):i + 2].mean(0) for i in range(len(dif))])
    hit = dif > T
    return np.where(hit.any(0), hit.argmax(0), len(dif)) - k0

def measure(new, old, mask, side):
    """(outline points, inward shift per point, short-run flags) for uint8 RGB arrays new and old at one size."""
    H, W = old.shape[:2]; sc = max(1.0, W / 1536)
    P, N = outline(mask, W, H, side)
    s = depth(new, P, N, sc) - depth(old, P, N, sc)
    w = int(5 * sc)
    run = np.convolve((s > sc + 1).astype(float), np.ones(w), "same") >= w * 0.8
    return P, N, s, run

def room_moved(new, old, mask):
    H, W = old.shape[:2]
    dout = cv2.distanceTransform(1 - mask_at(mask, W, H).astype(np.uint8), cv2.DIST_L2, 5)
    return (dout > 1) & (np.abs(new.astype(np.int16) - old.astype(np.int16)).max(2) > 12)

def cover(new, old, mask, side, pad=1):
    """Where the new hero stops short of today's edge along a short run, carry the hero's own edge out to today's edge:
    each missing pixel takes the new picture's pixel mirrored back across the new edge, so beard stays beard and hair
    stays hair. Touches only the short runs (and a few outline points either side). Returns (picture, pixels filled)."""
    H, W = old.shape[:2]; sc = max(1.0, W / 1536)
    P, N, s, run = measure(new, old, mask, side)
    if not run.any(): return new, 0
    do = depth(old, P, N, sc); dn = do + s
    run = np.convolve(run.astype(float), np.ones(int(6 * sc) + 1), "same") > 0
    acc = np.zeros((H, W), np.float32); val = np.zeros((H, W, 3), np.float32)
    for p, n, a, b, r in zip(P, N, do, dn, run):
        if not r or b - a <= 1: continue
        for k in np.arange(a - pad, b + 0.5, 0.5):
            q = p - n * k; src = p - n * (2 * b - k + 1)
            x, y, xs, ys = int(round(q[0])), int(round(q[1])), int(round(src[0])), int(round(src[1]))
            if 0 <= x < W and 0 <= y < H and 0 <= xs < W and 0 <= ys < H: val[y, x] += new[ys, xs]; acc[y, x] += 1
    m = acc > 0; fill = np.zeros((H, W, 3), np.float32); fill[m] = val[m] / acc[m][:, None]
    a = np.maximum(cv2.GaussianBlur(m.astype(np.float32), (0, 0), 0.8), m * 1.0)
    fb = cv2.GaussianBlur(fill, (0, 0), 0.6) / np.maximum(cv2.GaussianBlur(m.astype(np.float32), (0, 0), 0.6), 1e-3)[..., None]
    out = new.astype(np.float32) * (1 - a[..., None]) + np.where(m[..., None], fill, fb) * a[..., None]
    return np.clip(out + .5, 0, 255).astype(np.uint8), int(m.sum())

def check(rel, mask, side, ref, new_img=None):
    new_b = open(os.path.join(ROOT, rel), "rb").read()
    old_b = old_bytes(ref, rel)
    new = np.asarray(new_img if new_img is not None else Image.open(io.BytesIO(new_b)).convert("RGB"))
    old = np.asarray(Image.open(io.BytesIO(old_b)).convert("RGB"))
    P, _, s, run = measure(new, old, mask, side)
    return {"sha256": hashlib.sha256(new_b).hexdigest(), "before_sha256": hashlib.sha256(old_b).hexdigest(),
            "size": [old.shape[1], old.shape[0]], "mask": mask, "outline_pts": int(len(P)), "short_pts": int(run.sum()),
            "room_moved_px": int(room_moved(new, old, mask).sum())}

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--before", required=True); ap.add_argument("--side", choices=("left", "right"), required=True)
    ap.add_argument("--out", required=True); ap.add_argument("--note", default="")
    ap.add_argument("files", nargs="+")
    a = ap.parse_args()
    res = {}
    for spec in a.files:
        rel, mask = spec.rsplit(":", 1)
        res[rel] = check(rel, mask, a.side, a.before); print(rel, json.dumps(res[rel]))
    before = subprocess.run(["git", "-C", ROOT, "rev-parse", a.before], capture_output=True, text=True, check=True).stdout.strip()
    json.dump({"note": a.note or "written by tools/hero-faces/never_slimmer.py; do not edit by hand", "before": before,
               "side": a.side, "files": res}, open(os.path.join(ROOT, a.out), "w"), indent=1)
    open(os.path.join(ROOT, a.out), "a").write("\n")
