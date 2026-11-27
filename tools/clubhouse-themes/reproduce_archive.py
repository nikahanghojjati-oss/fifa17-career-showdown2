#!/usr/bin/env python3
"""N3 for every themed Archive plate (lead A-41, 2026-11-27): the shipped file is exactly what paint.py builds.

Each themed ENV_ARCHIVE plate (every clubhouse but Wooden, every size the game uses) is rebuilt with paint.py from its
approved painting (paintings/) and the CURRENT Wooden men, into a temporary folder. Both pictures are decoded, and the room
(everything outside the hero mask paint.py lays the men through) must be identical: 0 pixels different. Anything that
touches the room after paint.py (a retouch, a re-save, a pasted object, a stray line) shows up as different pixels, however
small. The men are checked by N2 (never slimmer, tools/hero-faces/never_slimmer.py) and paint.py's own face asserts.

The rebuild is only exact with the encoder the plates were built with (paint.ENCODER). Any other Pillow, libwebp or numpy is
a SETUP ERROR (exit 2), never a pass or a skip: install exactly those versions (the Showdown Gate does, in L1).

  python3 tools/clubhouse-themes/reproduce_archive.py                 # exit 0 all match, 1 a file differs, 2 setup error
  python3 tools/clubhouse-themes/reproduce_archive.py --json OUT       # also write the per-file result
  python3 tools/clubhouse-themes/reproduce_archive.py --prove-plants THEME [THEME...]
      makes the three A-36 changes in the room of the 1X and phone Archive files of each clubhouse, inside paint.py just
      before WebP (paint.before_encode), and shows each one FAILS while a no-change control matches: (a) a 40x40 patch 15 levels lighter, (b) a 25 px round piece pasted from
      elsewhere in the picture, (c) a 2x200 px line 30 levels darker.
"""
import argparse, io, json, os, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)


PIP = "Pillow==13.0.0 numpy==2.5.3"  # paint.ENCODER_PIP; repeated here so the hint shows even when paint.py won't import


def setup_error(why):
    print(f"SETUP ERROR: {why}. N3 rebuilds the plates byte for byte, so it needs exactly the encoder they were built with:"
          f" pip install {PIP} (paint.ENCODER_PIP).", file=sys.stderr)
    sys.exit(2)


try:
    import numpy as np
    import PIL
    from PIL import Image, features
    import paint
except ImportError as e:  # numpy or Pillow missing
    setup_error(f"cannot import {e.name}")

if PIP != paint.ENCODER_PIP:
    setup_error(f"reproduce_archive.PIP {PIP!r} is not paint.ENCODER_PIP {paint.ENCODER_PIP!r}")
have = {"Pillow": PIL.__version__, "libwebp": features.version("webp"), "numpy": np.__version__}
if have != paint.ENCODER:
    setup_error(f"this machine has {have}, the plates were built with {paint.ENCODER}")


def archive_targets():
    return [t for t in paint._targets() if t[3] == "ARCHIVE" and t[0] != "wooden"]


def rebuild(target, tmp):
    """(rel path, rebuilt decoded RGB, room mask, quality) for one target."""
    theme, name, painting, room, folder, mask, framing, kind = target
    wood_size = Image.open(os.path.join(folder, name + ".webp")).size
    if framing in ("desk", "tile"):
        d = paint.paint_desk(theme, name, painting, room, folder, mask, framing, dest_root=tmp)
        m = paint.hero_mask(None if mask is None else room, wood_size, mask)
    else:
        d = paint.paint_phone(theme, name, painting, room, folder, mask, framing, dest_root=tmp, kind=kind)
        m = paint.phone_mask(mask, wood_size)
    rebuilt = np.asarray(Image.open(d["file"]).convert("RGB"))
    rel = os.path.relpath(os.path.join(folder, theme, name + ".webp"), paint.ROOT)
    return rel, rebuilt, m[..., 0] == 0, d["quality"]


def compare(shipped, rebuilt, room):
    diff = np.any(shipped != rebuilt, axis=-1)
    return int(diff[room].sum()), int(diff.sum()), int(room.sum())


def check(out_json=None):
    rows, bad = {}, 0
    with tempfile.TemporaryDirectory() as tmp:
        for t in archive_targets():
            rel, rebuilt, room, q = rebuild(t, tmp)
            shipped_b = open(os.path.join(paint.ROOT, rel), "rb").read()
            shipped = np.asarray(Image.open(io.BytesIO(shipped_b)).convert("RGB"))
            if shipped.shape != rebuilt.shape:
                room_diff, all_diff, room_px = -1, -1, int(room.sum())
            else:
                room_diff, all_diff, room_px = compare(shipped, rebuilt, room)
            same_bytes = shipped_b == open(os.path.join(tmp, t[0], t[1] + ".webp"), "rb").read()
            ok = room_diff == 0
            bad += not ok
            rows[rel] = {"room_px": room_px, "room_px_different": room_diff, "picture_px_different": all_diff,
                         "same_bytes": same_bytes, "quality": q, "pass": ok}
            print(f"{'PASS' if ok else 'FAIL'} {rel}: room {room_diff} of {room_px} px different,"
                  f" whole picture {all_diff} px, bytes {'identical' if same_bytes else 'differ'}", flush=True)
    if out_json:
        json.dump({"encoder": paint.ENCODER, "files": rows}, open(out_json, "w"), indent=1)
    print(f"{len(rows) - bad} of {len(rows)} themed Archive plates are exactly what paint.py builds")
    if not rows:
        print("no themed Archive plate found: paint.py lists none", file=sys.stderr); return 1
    return 1 if bad else 0


def plant_spot(room, H, W, box_h=90, box_w=250):
    """the middle of the places where a box_h x box_w box is all room, in the left half, 10-60% down."""
    r = room.astype(np.int32)
    ii = np.pad(r.cumsum(0).cumsum(1), ((1, 0), (1, 0)))
    full = (ii[box_h:, box_w:] - ii[:-box_h, box_w:] - ii[box_h:, :-box_w] + ii[:-box_h, :-box_w]) == box_h * box_w
    ys, xs = np.nonzero(full[int(H * .1):int(H * .6), int(W * .05):int(W * .5)])
    assert len(ys), "no plant spot in the room"
    return ys[len(ys) // 2] + int(H * .1) + 10, xs[len(xs) // 2] + int(W * .05) + 10


def plants(new, room):
    """the three A-36 changes, each made to the room of the picture paint.py is about to encode."""
    H, W = new.shape[:2]
    y0, x0 = plant_spot(room, H, W)
    a = new.astype(int).copy(); a[y0:y0 + 40, x0:x0 + 40] += 15
    b = new.astype(int).copy()
    src = new[int(H * .8):int(H * .8) + 25, int(W * .5):int(W * .5) + 25].astype(int)
    yy, xx = np.mgrid[:25, :25]; disc = (yy - 12) ** 2 + (xx - 12) ** 2 <= 144
    reg = b[y0:y0 + 25, x0 + 80:x0 + 105]; reg[disc] = src[disc]
    c = new.astype(int).copy(); c[y0 + 55:y0 + 57, x0:x0 + 200] -= 30
    return {"(a) 40x40 patch +15": a, "(b) 25 px pasted piece": b, "(c) 2x200 px line -30": c}


def prove_plants(themes):
    """Each change is made inside paint.py, after the men are laid back and before WebP, so the planted file is encoded
    exactly as a real one would be; a control run with no change must still match (0 px), so a FAIL is the change itself."""
    caught = total = 0
    with tempfile.TemporaryDirectory() as tmp:
        for t in archive_targets():
            if t[0] not in themes or t[1] not in ("ENV_ARCHIVE_PLATE_HC_V3_1X", "ENV_ARCHIVE_PHONE_HC_V3"): continue
            rel, rebuilt, room, q = rebuild(t, tmp)
            paint.before_encode = lambda theme, name, out: out.copy()
            _, control, _, _ = rebuild(t, tmp)
            assert compare(control, rebuilt, room)[1] == 0, f"{rel}: the control rebuild does not match, so this proves nothing"
            names = list(plants(rebuilt, room))
            for k in names:
                paint.before_encode = lambda theme, name, out, k=k: np.clip(plants(out, room)[k], 0, 255).astype(np.uint8)
                _, planted, _, pq = rebuild(t, tmp)
                paint.before_encode = None
                room_diff, all_diff, room_px = compare(planted, rebuilt, room)
                total += 1; caught += room_diff > 0
                print(f"{'FAILS' if room_diff else 'PASSES (missed)'} {t[0]} {t[1]} {k}: room {room_diff} of {room_px} px"
                      f" different (control 0; q{pq})", flush=True)
    print(f"{caught} of {total} planted cases fail N3")
    return 0 if total and caught == total else 1


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--json"); ap.add_argument("--prove-plants", nargs="+", metavar="THEME")
    a = ap.parse_args()
    sys.exit(prove_plants(set(a.prove_plants)) if a.prove_plants else check(a.json))
