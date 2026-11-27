#!/usr/bin/env python3
"""N3 for the Wooden Archive plates (lead A-43, 2026-11-27): the shipped files are exactly what F-1 builds.

The five Wooden ENV_ARCHIVE files (2X, 1X, 1920, phone and its 590W cut) are rebuilt from tools/hero-faces/inputs/F-1: the
E2 picture Nik picked and the Wooden files as they were before F-1 (commit 5485f7f4). fit_e2.py fits E2 into the 2X plate,
then build_legacy_nik.py lays the head into every size, into a temporary folder. Both pictures are decoded, and the WHOLE
picture must be identical to what ships: 0 pixels different. This is the same exact rebuild every themed Archive plate has
(tools/clubhouse-themes/reproduce_archive.py, lead A-41); Wooden used to have only the looser 0.1% allowance.

The rebuild is only exact with the encoder and OpenCV the files were built with (ENCODER below). Any other version is a
SETUP ERROR (exit 2), never a pass or a skip: install exactly ENCODER_PIP (the Showdown Gate does, in L1). OpenCV 5.x gives
a different phone fit, so it is pinned too.

  python3 tools/hero-faces/reproduce_wooden_archive.py                 # exit 0 all match, 1 a file differs, 2 setup error
  python3 tools/hero-faces/reproduce_wooden_archive.py --json OUT      # also write the per-file result
  python3 tools/hero-faces/reproduce_wooden_archive.py --prove-plants  # the A-36 changes on the 1X and phone files all FAIL
"""
import argparse, contextlib, hashlib, io, json, os, runpy, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
PLATES = os.path.join(ROOT, "visual-assets", "v10_1", "plates-hc")
MASKS = os.path.join(ROOT, "tools", "clubhouse-themes", "masks")
INPUTS = os.path.join(HERE, "inputs", "F-1")

ENCODER = {"Pillow": "13.0.0", "libwebp": "1.6.0", "numpy": "2.5.3", "opencv": "4.14.0"}
ENCODER_PIP = "Pillow==13.0.0 numpy==2.5.3 opencv-python-headless==4.14.0.94"

E2_RAW = "ENV_ARCHIVE_PLATE_HC_V4_2X_F1E2_RAW.png"
INPUT_SHA256 = {  # the inputs are part of the picture: a changed input is a FAIL, not a new truth
    E2_RAW: "2d8c586c9d5844983ebd072f397a32a7529a22238e094e3b3583f889743e4ee5",
    "before/ENV_ARCHIVE_PLATE_HC_V3_2X.webp": "3cdf27a053cc7c8d30ea06ed1769bc9283df81c951e13393226a3f2399634943",
    "before/ENV_ARCHIVE_PLATE_HC_V3_1X.webp": "95355a855e6d39b0e4c4a4ad766f1fdccbd98a1f2412121a6e80bef8aebc49dc",
    "before/ENV_ARCHIVE_PLATE_HC_V3_1920.webp": "78291f3d62058543854d00ee2645f55463946e0da5a3463f56876bfda54a68b0",
    "before/ENV_ARCHIVE_PHONE_HC_V3.webp": "75726ad65752665ad0e3b0a06840a52f065a7ecbfd7958844de56a199ccf2a28",
    "before/ENV_ARCHIVE_PHONE_HC_V3_590W.webp": "0cb46ce4a97cf074c0e42217d70e4f719186fb322a481c8d916afecba7ff4991",
}
FILES = [n.split("/")[1] for n in INPUT_SHA256 if n.startswith("before/")]
ROOM_MASK = {"ENV_ARCHIVE_PLATE_HC_V3_2X.webp": "ENV_ARCHIVE_PLATE_HC_V3_1920", "ENV_ARCHIVE_PLATE_HC_V3_1X.webp": "ENV_ARCHIVE_PLATE_HC_V3_1920",
             "ENV_ARCHIVE_PLATE_HC_V3_1920.webp": "ENV_ARCHIVE_PLATE_HC_V3_1920", "ENV_ARCHIVE_PHONE_HC_V3.webp": "ENV_ARCHIVE_PHONE_HC_V3",
             "ENV_ARCHIVE_PHONE_HC_V3_590W.webp": "ENV_ARCHIVE_PHONE_HC_V3"}


def setup_error(why):
    print(f"SETUP ERROR: {why}. N3 rebuilds the Wooden Archive files byte for byte, so it needs exactly the encoder and OpenCV"
          f" they were built with: pip install {ENCODER_PIP}.", file=sys.stderr)
    sys.exit(2)


try:
    import cv2
    import numpy as np
    import PIL
    from PIL import Image, features
except ImportError as e:
    setup_error(f"cannot import {e.name}")
have = {"Pillow": PIL.__version__, "libwebp": features.version("webp"), "numpy": np.__version__, "opencv": cv2.__version__}
if have != ENCODER:
    setup_error(f"this machine has {have}, the Wooden Archive files were built with {ENCODER}")
sys.path.insert(0, HERE)
import fit_e2


def decode(path):
    return np.asarray(Image.open(path).convert("RGB"))


def room_of(name, shape):
    m = Image.open(os.path.join(MASKS, ROOM_MASK[name] + ".png")).convert("L").resize((shape[1], shape[0]), Image.LANCZOS)
    return np.asarray(m) == 0


def inputs_ok():
    bad = [n for n, h in INPUT_SHA256.items()
           if hashlib.sha256(open(os.path.join(INPUTS, n), "rb").read()).hexdigest() != h]
    for n in bad:
        print(f"FAIL input {n}: its sha256 is not the one the shipped files were built from", flush=True)
    return not bad


def build(tmp, before_encode=None):
    """fit E2 and run build_legacy_nik.py on the before files, in tmp; returns the output folder."""
    tree = os.path.join(tmp, "repo")
    if not os.path.isdir(tree):
        os.makedirs(os.path.join(tree, "visual-assets", "v10_1", "plates-hc"))
        os.makedirs(os.path.join(tree, "tools"))
        for n in FILES:
            with open(os.path.join(INPUTS, "before", n), "rb") as s, open(os.path.join(tree, "visual-assets", "v10_1", "plates-hc", n), "wb") as d:
                d.write(s.read())
        os.symlink(os.path.join(ROOT, "tools", "clubhouse-themes"), os.path.join(tree, "tools", "clubhouse-themes"))
        os.symlink(HERE, os.path.join(tree, "tools", "hero-faces"))
        fit_e2.fit(os.path.join(INPUTS, E2_RAW), os.path.join(INPUTS, "before", "ENV_ARCHIVE_PLATE_HC_V3_2X.webp"),
                   os.path.join(tmp, "E2_FULL.png"))
    out = tempfile.mkdtemp(dir=tmp)
    argv = sys.argv
    sys.argv = ["build_legacy_nik.py", os.path.join(tmp, "E2_FULL.png"), tree, out]
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            runpy.run_path(os.path.join(HERE, "build_legacy_nik.py"), init_globals={"before_encode": before_encode}, run_name="__main__")
    finally:
        sys.argv = argv
    return out


def check(out_json=None):
    if not inputs_ok():
        return 1
    rows, bad = {}, 0
    with tempfile.TemporaryDirectory() as tmp:
        out = build(tmp)
        for n in FILES:
            rel = os.path.relpath(os.path.join(PLATES, n), ROOT)
            shipped_b = open(os.path.join(PLATES, n), "rb").read()
            rebuilt_b = open(os.path.join(out, n), "rb").read()
            shipped = np.asarray(Image.open(io.BytesIO(shipped_b)).convert("RGB")); rebuilt = decode(os.path.join(out, n))
            if shipped.shape != rebuilt.shape:
                all_diff, room_diff, room_px = -1, -1, -1
            else:
                diff = np.any(shipped != rebuilt, axis=-1); room = room_of(n, shipped.shape)
                all_diff, room_diff, room_px = int(diff.sum()), int(diff[room].sum()), int(room.sum())
            same_bytes = shipped_b == rebuilt_b
            ok = all_diff == 0
            bad += not ok
            rows[rel] = {"picture_px": int(shipped.shape[0] * shipped.shape[1]), "picture_px_different": all_diff,
                         "room_px": room_px, "room_px_different": room_diff, "same_bytes": same_bytes, "pass": ok}
            print(f"{'PASS' if ok else 'FAIL'} {rel}: whole picture {all_diff} px different (room {room_diff} of {room_px}),"
                  f" bytes {'identical' if same_bytes else 'differ'}", flush=True)
    if out_json:
        json.dump({"encoder": ENCODER, "files": rows}, open(out_json, "w"), indent=1)
    print(f"{len(rows) - bad} of {len(FILES)} Wooden Archive files are exactly what F-1 builds")
    return 1 if bad or len(rows) != len(FILES) else 0


def prove_plants():
    """Each change is made inside build_legacy_nik.py, to the finished picture just before WebP, so the planted file is
    encoded exactly as a real one would be; a control run with no change must still match (0 px), so a FAIL is the change."""
    sys.path.insert(0, os.path.join(ROOT, "tools", "clubhouse-themes"))
    from reproduce_archive import plants  # the same three A-36 changes the themed plates are proved with
    targets = ["ENV_ARCHIVE_PLATE_HC_V3_1X.webp", "ENV_ARCHIVE_PHONE_HC_V3.webp"]
    caught = total = 0
    with tempfile.TemporaryDirectory() as tmp:
        base = build(tmp)
        control = build(tmp, lambda name, arr: arr.copy())
        for n in targets:
            assert (decode(os.path.join(base, n)) == decode(os.path.join(control, n))).all(), f"{n}: the control rebuild does not match, so this proves nothing"
        rooms = {n: room_of(n, decode(os.path.join(base, n)).shape) for n in targets}
        for k in ("(a) 40x40 patch +15", "(b) 25 px pasted piece", "(c) 2x200 px line -30"):
            def plant(name, arr, k=k):
                return np.clip(plants(arr, rooms[name])[k], 0, 255).astype(np.uint8) if name in rooms else arr
            out = build(tmp, plant)
            for n in targets:
                b, p = decode(os.path.join(base, n)), decode(os.path.join(out, n))
                diff = np.any(b != p, axis=-1)
                total += 1; caught += bool(diff.any())
                print(f"{'FAILS' if diff.any() else 'PASSES (missed)'} wooden {n[:-5]} {k}: whole picture {int(diff.sum())} px,"
                      f" room {int(diff[rooms[n]].sum())} of {int(rooms[n].sum())} px different (control 0)", flush=True)
    print(f"{caught} of {total} planted cases fail N3")
    return 0 if total and caught == total else 1


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--json"); ap.add_argument("--prove-plants", action="store_true")
    a = ap.parse_args()
    sys.exit(prove_plants() if a.prove_plants else check(a.json))
