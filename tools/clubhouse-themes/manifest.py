#!/usr/bin/env python3
"""Write tools/clubhouse-themes/PREMIUM_FILES.json: every Platinum, Metallic Black and Premium Matte Black room file the game
can draw, with its sha256 and the premium painting it was painted from (and that painting's sha256). Run after paint.py and
pin.py. tests/contracts/r99-clubhouse-themes-contracts.cjs fails the Gate when a themed folder holds a file that is not listed
here, a file that no longer matches its hash, or a file whose painting is missing or changed (Nik 2026-11-25: the game only
ever loads the premium versions, never an old recolour)."""
import hashlib, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import paint
ROOT = paint.ROOT
OUT = os.path.join(os.path.dirname(__file__), "PREMIUM_FILES.json")
sha = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()
rel = lambda p: os.path.relpath(p, ROOT).replace(os.sep, "/")
files, paintings = {}, {}
for theme, name, painting, room, folder, *_ in paint._targets():
    f = os.path.join(folder, theme, name + ".webp")
    if not os.path.exists(f): sys.exit(f"missing painted file {rel(f)}: run paint.py first")
    files[rel(f)] = {"sha256": sha(f), "painting": rel(painting), "room": room}
    paintings[rel(painting)] = sha(painting)
for theme in ("silver", "black", "matte", "ruby", "emerald", "lapis"):  # each clubhouse's panel marble, cut from its painted slab (panel_tiles.py)
    t = os.path.join(ROOT, "css", f"r78-marble-tile-{theme}.webp")
    slab = files[f"visual-assets/v10_1/plates-hc/{theme}/TILE_SLAB_HC_V1_512.webp"]
    files[rel(t)] = {"sha256": sha(t), "painting": slab["painting"], "room": "PANEL_MARBLE"}
json.dump({"note": "written by tools/clubhouse-themes/manifest.py; do not edit by hand",
           "files": dict(sorted(files.items())), "paintings": dict(sorted(paintings.items()))},
          open(OUT, "w"), indent=1)
open(OUT, "a").write("\n")
print("premium files", len(files), "paintings", len(paintings))
