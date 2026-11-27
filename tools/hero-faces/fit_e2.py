#!/usr/bin/env python3
"""F-1 Legacy Nik, step 1: fit the E2 picture (Nik picked 2026-11-26 18:19 UTC) into the Wooden 2X Archive plate as it was
before F-1, giving E2_FULL.png, the input tools/hero-faces/build_legacy_nik.py takes.

This is the fit the shipped Wooden plates were built with (blend/fit.py on branch claude-duet/p4-faces-inputs, minus its
comparison pictures): E2 is resized to the 900 px head square at (1930, 0), aligned to the plate on the room only (ORB +
RANSAC, outside the hero mask), and laid in through the hero mask with a ~6 px feather. Nothing outside the square changes.

  python3 tools/hero-faces/fit_e2.py E2_RAW.png BEFORE_2X.webp OUT_E2_FULL.png
"""
import os, sys
import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MASK = os.path.join(ROOT, "tools", "clubhouse-themes", "masks", "ENV_ARCHIVE_PLATE_HC_V3_1920.png")
X0, Y0, S = 1930, 0, 900


def fit(raw_path, before_2x_path, out_path):
    plate = np.array(Image.open(before_2x_path).convert("RGB"))
    H, W = plate.shape[:2]
    ref = plate[Y0:Y0 + S, X0:X0 + S].copy()
    raw = np.array(Image.open(raw_path).convert("RGB"))
    r0 = cv2.resize(raw, (S, S), interpolation=cv2.INTER_LANCZOS4)
    g1 = cv2.cvtColor(ref, cv2.COLOR_RGB2GRAY); g2 = cv2.cvtColor(r0, cv2.COLOR_RGB2GRAY)
    # match on the room only (outside the hero) so the face change does not pull the fit
    mfull = Image.open(MASK).convert("L").resize((W, H), Image.LANCZOS)
    hm = np.asarray(mfull, np.float32)[Y0:Y0 + S, X0:X0 + S] / 255
    room = (cv2.dilate((hm > 0.05).astype(np.uint8), np.ones((25, 25))) == 0).astype(np.uint8) * 255
    orb = cv2.ORB_create(8000); k1, d1 = orb.detectAndCompute(g1, room); k2, d2 = orb.detectAndCompute(g2, None)
    m = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2), key=lambda x: x.distance)[:1500]
    p1 = np.float32([k1[x.queryIdx].pt for x in m]); p2 = np.float32([k2[x.trainIdx].pt for x in m])
    A, inl = cv2.estimateAffinePartial2D(p2, p1, method=cv2.RANSAC, ransacReprojThreshold=3)
    al = cv2.warpAffine(r0, A, (S, S), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    # likeness lock: edited pixels only inside the hero zone, ~6 px feather
    lock = np.asarray(Image.fromarray((hm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)), np.float32) / 255
    lock = np.clip(lock * np.clip(hm * 1.0 + 0.0, 0, 1) ** 0, 0, 1)
    out = ref * (1 - lock[..., None]) + al * lock[..., None]
    full = plate.copy(); full[Y0:Y0 + S, X0:X0 + S] = np.clip(out, 0, 255).astype(np.uint8)
    assert (full[:, :X0] == plate[:, :X0]).all()
    Image.fromarray(full).save(out_path)
    return {"affine": np.round(A, 4).tolist(), "inliers": int(inl.sum()), "matches": len(m)}


if __name__ == "__main__":
    print(fit(*sys.argv[1:4]))
