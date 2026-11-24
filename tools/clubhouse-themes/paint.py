#!/usr/bin/env python3
"""r100 B7 premium clubhouses: build a clubhouse's room plates from Team V's repainted masters (paintings/).

Each painting is Team V's same-composition repaint of a Wooden plate for one clubhouse:
  desktop  ENV_<ROOM>_PLATE_<SILVER|BLACK|MATTE>_P1_2X.webp   (HO-098 onwards; replaces ENV_<ROOM>_PLATE_HC_V3_{1920,1X,2X})
  phone    ENV_<ROOM>_PHONE_<SILVER|BLACK|MATTE>_P1.webp      (r100 Duet P1; aligned to the Wooden 9:16 phone plate, 1179x2096)
For every size the game uses, this lays the ORIGINAL Daniel and Nik pixels of the Wooden plate at that size back on top of
the painting, through the existing hero mask pulled in a few px (so the faces stay pixel-identical to Wooden and the edge is
the painting's own relit edge), and writes plates-hc/<theme>/<name>.webp. Painted plates replace the recoloured copies from
build.py, which skips them.

Phone band -> files (phone_out): the 9:16 band becomes ENV_<ROOM>_PHONE_HC_V3 and its _590W, and for BOX, COACHES and HALL
also the TALL upright (1179x2620) and its _590W where the game has one. TALL is a different framing, not a resize: it is the
same picture down to the top of the counter and a longer counter below it, so the band is laid 1:1 above TALL_KNEE and the
counter below is stretched to the TALL height (tall_rows; measured on the Wooden pairs, see `--check-tall`). CLUB's band
becomes ENV_CLUB_PHONE_HC_V4 and LOADING's becomes assets/loading/<theme>/ENV_LOADING_PHONE_HC (+ _590W); neither has the
men in it, so they take the painting as it is.
The other phone pictures have nobody in them, so they take their painting as it is too (no mask; OTHER_MASTERS):
  ENV_BOX_PHONE_V4_<LOOK>_P1        (HO-162..164) -> ENV_BOX_PHONE_HC_V4 (+_590W) and its TALL (+_590W), same knee as BOX V3
  ENV_BOX_PLATE_EMPTY_<LOOK>_P1_2X  (HO-165..167) -> ENV_BOX_SIDEWAYS_HC_V4: the empty desktop room cut to 2:1 (BOX_SIDE_CUT)
  ENV_CLUB_SIDEWAYS_<LOOK>_P1       (HO-168..170) -> ENV_CLUB_SIDEWAYS_HC_V4 (its own picture, same size)
  ENV_SLAB_<LOOK>_P1_2X             (HO-112/131/150) -> ENV_SLAB_PHONE_HC_V1 (+_590W): the desktop slab turned upright (rot90)
B7 builds the desktop files from the same deliveries (desk_out, paint_desk):
  ENV_<ROOM>_PLATE_<LOOK>_P1_2X   -> ENV_<ROOM>_PLATE_HC_V3_{1920,1X,2X} with the men laid back (hero mask, as the pilot);
                                     CLUB -> ENV_CLUB_PLATE_HC_V3_{1X,2X} and LOADING -> assets/loading/<theme>/ENV_LOADING_PLATE_HC_{1X,2X}
                                     (nobody in them: the painting as it is)
  ENV_SLAB_<LOOK>_P1_2X           -> ENV_SLAB_HC_V1_{1920,1X,2X} and TILE_SLAB_HC_V1_512 (the Wooden tile is the 2X slab's
                                     1024 px square at SLAB_TILE_BOX, halved; made seamless across its edges, tile_from)
  ENV_BOX_PLATE_EMPTY_<LOOK>_P1_2X -> ENV_BOX_PLATE_HC_V4_{1920,1X,2X}: the Wooden V4 men (placed apart, HO-097 part 2) laid
                                     on the painted empty room through masks/ENV_BOX_PLATE_HC_V4_1920.png
Each desktop file gets the same checks as a phone file: alignment, 0 face pixels changed before encoding, face drift after
WebP, file size against Wooden.

Every phone file is checked as it is written (paint_phone): the painting's alignment to the Wooden plate (phase correlation;
a master off by a whole pixel is shifted, never the Wooden), 0 changed pixels in the fully Wooden core of the hero mask before
encoding (asserted), the decoded mean difference in that core after WebP (at most FACE_DRIFT_MAX, asserted; 4x face crops
against Wooden with --crops), and the file size against the Wooden file (the
quality steps down from 90 until it is within PHONE_SIZE_SLACK of Wooden).

  python3 tools/clubhouse-themes/paint.py [--crops DIR]    # then: python3 tools/clubhouse-themes/pin.py (DIR: 4x face crops)
  python3 tools/clubhouse-themes/paint.py --stand-in DIR   # prove the phone path on today's recoloured plates, into DIR
  python3 tools/clubhouse-themes/paint.py --check-tall     # how well the TALL row map fits the Wooden TALL plates
"""
import io, json, os, re, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "visual-assets", "v10_1", "plates-hc")
LOADING = os.path.join(ROOT, "assets", "loading")
MASKS = os.path.join(os.path.dirname(__file__), "masks")
PAINTINGS = os.path.join(os.path.dirname(__file__), "paintings")
THEME = {"SILVER": "silver", "BLACK": "black", "MATTE": "matte"}
NAME = re.compile(r"^ENV_([A-Z]+)_PLATE_(SILVER|BLACK|MATTE)_P1_2X\.webp$")
PHONE = re.compile(r"^ENV_([A-Z]+)_PHONE_(SILVER|BLACK|MATTE)_P1\.webp$")
PULL_IN = 3      # px at 1920 wide: the hero mask is pulled in this much, so no old wooden edge survives around the men
FEATHER = 0.8    # px at 1920 wide
PHONE_W = 1179   # the phone masters' width: phone pull-in and feather are the same px at this width
PHONE_SIZE_SLACK = 0.10  # a phone plate may be at most this much bigger than the Wooden file it replaces
# Lead decision 2026-11-24 19:15 UTC: small files win. After WebP the faces may drift up to this many levels (mean, inside the
# fully Wooden core of the mask) as long as a 4x side-by-side of each face against Wooden shows no visible change (face_crops).
FACE_DRIFT_MAX = 3.0
PHONE_ROOMS = ("HOME", "BOARD", "OFFICE", "HALL", "ARCHIVE", "BOX", "COACHES", "TUNNEL", "CLUB", "LOADING")
# The first TALL row that is not the 9:16 band's own row: the top of the counter's front face (Duet P1, 2026-11-24: measured
# on the Wooden V3/TALL pairs by a monotone row match; above it the two Wooden plates differ by 0-1.4 levels, i.e. only WebP).
TALL_KNEE = {"BOX": 1227, "COACHES": 827, "HALL": 1421}
LOOKS = "(SILVER|BLACK|MATTE)"
# kind: (room, Team V's file name, master size). Men-free phone pictures (Duet P1 lead answers 2026-11-24 19:15/19:35 UTC).
OTHER_MASTERS = {
    "lr_phone": ("BOX", re.compile(rf"^ENV_BOX_PHONE_V4_{LOOKS}_P1\.webp$"), (1179, 2096)),
    "lr_desk": ("BOX", re.compile(rf"^ENV_BOX_PLATE_EMPTY_{LOOKS}_P1_2X\.webp$"), (3072, 1728)),
    "club_side": ("CLUB", re.compile(rf"^ENV_CLUB_SIDEWAYS_{LOOKS}_P1\.webp$"), (2532, 1170)),
    "slab": ("SLAB", re.compile(rf"^ENV_SLAB_{LOOKS}_P1_2X\.webp$"), (3072, 1728)),
}
# ENV_BOX_SIDEWAYS_HC_V4 is the Wooden empty desktop room (HO-097 ENV_BOX_PLATE_EMPTY_HC_V4_2X, 3072x1728) cut at
# (left, top, right, bottom) and scaled to 2400x1200 (matched 2026-11-24: mean difference 1.24 levels against the Wooden file,
# its WebP noise; 0.5 px either way doubles it).
BOX_SIDE_CUT = (0, 60, 3072, 1596)
# TILE_SLAB_HC_V1_512 is the Wooden 2X slab's square at this box, halved (matched 2026-11-24: normalised correlation 0.84; the
# rest is its seamless edges).
SLAB_TILE_BOX = (1024, 352, 2048, 1376)
TILE_SEAM = 40   # px of the 512 tile blended across each edge so the tile repeats without a seam
DESK_SIZE_SLACK = 0.10  # a desktop plate may be at most this much bigger than the Wooden file it replaces
# The phone slab is the desktop slab turned upright (ROTATE_90) and resized: 1.49 levels against Wooden ENV_SLAB_PHONE_HC_V1.

def _plates(folder, pattern):
    return [g[:-5] for g in sorted(os.listdir(folder)) if re.match(pattern, g)] if os.path.isdir(folder) else []

def phone_out(room):
    """(folder, Wooden name, mask name or None, framing) for every phone file a band for ROOM becomes."""
    if room == "LOADING":
        return [(LOADING, n, None, "band") for n in _plates(LOADING, r"^ENV_LOADING_PHONE_HC(_590W)?\.webp$")]
    if room == "CLUB":
        return [(SRC, n, None, "band") for n in _plates(SRC, r"^ENV_CLUB_PHONE_HC_V4\.webp$")]
    out = [(SRC, n, f"ENV_{room}_PHONE_HC_V3", "band") for n in _plates(SRC, rf"^ENV_{room}_PHONE_HC_V3(_590W)?\.webp$")]
    if room in TALL_KNEE:
        out += [(SRC, n, f"ENV_{room}_PHONE_HC_V3_TALL", "tall") for n in _plates(SRC, rf"^ENV_{room}_PHONE_HC_V3_TALL(_590W)?\.webp$")]
    return out

def other_out(kind):
    """(folder, Wooden name, mask, framing) for a men-free picture's phone files."""
    if kind == "lr_phone":
        return ([(SRC, n, None, "band") for n in _plates(SRC, r"^ENV_BOX_PHONE_HC_V4(_590W)?\.webp$")] +
                [(SRC, n, None, "tall") for n in _plates(SRC, r"^ENV_BOX_PHONE_HC_V4_TALL(_590W)?\.webp$")])
    if kind == "lr_desk":
        return [(SRC, n, None, "box_side") for n in _plates(SRC, r"^ENV_BOX_SIDEWAYS_HC_V4\.webp$")]
    if kind == "club_side":
        return [(SRC, n, None, "same") for n in _plates(SRC, r"^ENV_CLUB_SIDEWAYS_HC_V4\.webp$")]
    if kind == "slab":
        return [(SRC, n, None, "rot90") for n in _plates(SRC, r"^ENV_SLAB_PHONE_HC_V1(_590W)?\.webp$")]
    raise KeyError(kind)

def desk_out(room):
    """(folder, Wooden name, mask name or None) for every desktop file a desktop painting for ROOM becomes."""
    if room == "LOADING":
        return [(LOADING, n, None) for n in _plates(LOADING, r"^ENV_LOADING_PLATE_HC_(1X|2X)\.webp$")]
    if room == "CLUB":
        return [(SRC, n, None) for n in _plates(SRC, r"^ENV_CLUB_PLATE_HC_V3_(1X|2X)\.webp$")]
    return [(SRC, n, f"ENV_{room}_PLATE_HC_V3_1920") for n in _plates(SRC, rf"^ENV_{room}_PLATE_HC_V3_(1920|1X|2X)\.webp$")]

def desk_extra(kind):
    """(folder, Wooden name, mask, framing) for the desktop files B7 builds from a men-free master."""
    if kind == "slab":
        return ([(SRC, n, None, "desk") for n in _plates(SRC, r"^ENV_SLAB_HC_V1_(1920|1X|2X)\.webp$")] +
                [(SRC, n, None, "tile") for n in _plates(SRC, r"^TILE_SLAB_HC_V1_512\.webp$")])
    if kind == "lr_desk":
        return [(SRC, n, "ENV_BOX_PLATE_HC_V4_1920", "desk") for n in _plates(SRC, r"^ENV_BOX_PLATE_HC_V4_(1920|1X|2X)\.webp$")]
    return []

def painted():
    """(theme, plate name, painting, room) for every plate a painting replaces (build.py skips these)."""
    return [t[:4] for t in _targets()]

def _targets(masters=None):
    """(theme, name, painting, room, folder, mask, framing, kind). masters: {(room, theme, kind): path} to use instead of
    paintings/ (the stand-in proof)."""
    out = []
    if masters is None:
        masters = {}
        for f in sorted(os.listdir(PAINTINGS)) if os.path.isdir(PAINTINGS) else []:
            m = NAME.match(f) or PHONE.match(f)
            if m:
                masters[(m.group(1), THEME[m.group(2)], "desk" if m.re is NAME else "phone")] = os.path.join(PAINTINGS, f)
                continue
            for kind, (room, rx, _) in OTHER_MASTERS.items():
                m = rx.match(f)
                if m: masters[(room, THEME[m.group(1)], kind)] = os.path.join(PAINTINGS, f)
    for (room, theme, kind), path in sorted(masters.items()):
        if kind == "desk":
            for folder, g, mask in desk_out(room):
                out.append((theme, g, path, room, folder, mask, "desk", kind))
        else:
            for folder, g, mask, framing in (phone_out(room) if kind == "phone" else other_out(kind)):
                out.append((theme, g, path, room, folder, mask, framing, kind))
            for folder, g, mask, framing in desk_extra(kind):
                out.append((theme, g, path, room, folder, mask, framing, kind))
    return out

def hero_mask(room, size, mask=None):
    """The desktop hero mask (masks/<mask>.png, a 1920 cut) at this size, pulled in and feathered. mask None and room None:
    nobody in the room, all painting."""
    if mask is None and room is None:
        return np.zeros((size[1], size[0], 1), np.float32)
    path = os.path.join(MASKS, (mask or f"ENV_{room}_PLATE_HC_V3_1920") + ".png")
    m = Image.open(path).convert("L").resize(size, Image.LANCZOS)
    k = max(3, 2 * round(PULL_IN * size[0] / 1920) + 1)
    m = m.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.GaussianBlur(FEATHER * size[0] / 1920))
    return np.asarray(m, np.float32)[..., None] / 255

def phone_mask(mask, size):
    """The phone hero mask at this size: the full-size cut (masks/<mask>.png) resized, pulled in PULL_IN px and feathered
    FEATHER px at the 1179 master width. None (no men in the room): all painting."""
    if not mask:
        return np.zeros((size[1], size[0], 1), np.float32)
    m = Image.open(os.path.join(MASKS, mask + ".png")).convert("L")
    if m.size != size: m = m.resize(size, Image.LANCZOS)
    k = max(3, 2 * round(PULL_IN * size[0] / PHONE_W) + 1)
    m = m.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.GaussianBlur(FEATHER * size[0] / PHONE_W))
    return np.asarray(m, np.float32)[..., None] / 255

def shift_of(master, wood):
    """Whole-pixel (dx, dy) that moves master onto wood (phase correlation on grey, Hann window)."""
    a = np.asarray(master.convert("L"), np.float32); b = np.asarray(wood.convert("L"), np.float32)
    w = np.outer(np.hanning(a.shape[0]), np.hanning(a.shape[1])).astype(np.float32)
    F = np.fft.rfft2(b * w) * np.conj(np.fft.rfft2(a * w))
    r = np.fft.irfft2(F / np.maximum(np.abs(F), 1e-9), s=a.shape)
    dy, dx = np.unravel_index(int(np.argmax(r)), r.shape)
    if dy > a.shape[0] // 2: dy -= a.shape[0]
    if dx > a.shape[1] // 2: dx -= a.shape[1]
    return int(dx), int(dy)

def shifted(img, dx, dy):
    a = np.asarray(img)
    ys = np.clip(np.arange(a.shape[0]) - dy, 0, a.shape[0] - 1); xs = np.clip(np.arange(a.shape[1]) - dx, 0, a.shape[1] - 1)
    return Image.fromarray(a[ys][:, xs])

def tall_rows(band, room, height):
    """The TALL framing from a 9:16 band at the band's width: rows 1:1 down to TALL_KNEE, the counter below it stretched
    to the TALL height (linear in rows, bilinear between them)."""
    a = np.asarray(band, np.float32); H = a.shape[0]
    k = TALL_KNEE[room] * a.shape[1] / PHONE_W
    y = np.arange(height, dtype=np.float32)
    src = np.where(y < k, y, k + (y - k) * (H - 1 - k) / max(height - 1 - k, 1))
    y0 = np.floor(src).astype(int); y1 = np.minimum(y0 + 1, H - 1); f = (src - y0)[:, None, None]
    return Image.fromarray(np.clip(a[y0] * (1 - f) + a[y1] * f + .5, 0, 255).astype(np.uint8))

def phone_source(master, room, framing, size):
    """The painting framed and sized for one phone file."""
    if framing == "tall":
        band = master.resize((size[0], round(size[0] * master.height / master.width)), Image.LANCZOS)
        return tall_rows(band, room, size[1])
    if framing == "box_side":
        return master.resize(size, Image.LANCZOS, box=BOX_SIDE_CUT)
    if framing == "rot90":
        return master.transpose(Image.ROTATE_90).resize(size, Image.LANCZOS)
    return master if master.size == size else master.resize(size, Image.LANCZOS)

def encode(img, limit, floor=76):
    """WebP at q90 method 6, stepping down to q<floor> until the file is within limit bytes. Plates with faces stop at q76;
    men-free plates may go to q40 (the phone slab at 590 wide needs about q46: its Wooden file is very soft)."""
    for q in range(90, floor - 2, -2):
        buf = io.BytesIO(); img.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= limit or q == floor:
            return buf.getvalue(), q

def face_crops(wood, new, m, dest):
    """4x zoom, nearest neighbour, of each man's head and face (the top of each half of the mask): Wooden left, new right."""
    on = m[..., 0] > 0.5
    if not on.any(): return None
    W = on.shape[1]; tiles = []
    for x0, x1 in ((0, W // 2), (W // 2, W)):
        ys, xs = np.nonzero(on[:, x0:x1])
        if not len(ys): continue
        top, h = ys.min(), ys.max() - ys.min()
        cols = np.nonzero(on[top:top + max(4, int(h * 0.08)), x0:x1].any(0))[0]  # the crown of the head
        hw = cols.max() - cols.min() + 1; cx = x0 + (cols.min() + cols.max()) // 2; half = int(hw * 0.8)
        box = (max(0, cx - half), top, min(W, cx + half), min(on.shape[0], top + int(hw * 1.9)))  # head, face and chin
        a, b = wood.crop(box), new.crop(box)
        z = 4 * min(1.0, 220 / max(a.size))
        size = (max(1, round(a.width * z)), max(1, round(a.height * z)))
        tiles += [a.resize(size, Image.NEAREST), b.resize(size, Image.NEAREST)]
    sheet = Image.new("RGB", (sum(t.width for t in tiles) + 8 * len(tiles), max(t.height for t in tiles)), (255, 0, 255))
    x = 0
    for t in tiles: sheet.paste(t, (x, 0)); x += t.width + 8
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    sheet.save(dest, quality=92)
    return dest

def paint_phone(theme, name, path, room, folder, mask, framing, dest_root=None, crops_root=None, kind="phone"):
    wood = Image.open(os.path.join(folder, name + ".webp")).convert("RGB")
    master = Image.open(path).convert("RGB")
    want = OTHER_MASTERS[kind][2] if kind in OTHER_MASTERS else (PHONE_W, 2096)
    if master.size != want:
        master = master.resize((want[0], round(want[0] * master.height / master.width)), Image.LANCZOS)
    dx = dy = 0
    if framing in ("band", "tall", "same"):
        # alignment against the Wooden plate the picture was painted over (Team V's Image 1)
        ref_name = name.split("_TALL")[0] if framing == "tall" else name.replace("_590W", "")
        ref = Image.open(os.path.join(folder, ref_name + ".webp")).convert("RGB")
        ref = ref if ref.size == master.size else ref.resize(master.size, Image.LANCZOS)
        dx, dy = shift_of(master, ref)
        if dx or dy: master = shifted(master, dx, dy)
    src = phone_source(master, room, framing, wood.size)
    if framing == "box_side":
        # Image 1 (the empty desktop room) is not in the repo, so the cut is checked against the Wooden sideways plate
        dx, dy = shift_of(src, wood)
        if dx or dy: src = shifted(src, dx, dy)
    # rot90 (the slab): a whole-surface repaint with nothing to align to (Team V resized it, not aligned)
    paint = np.asarray(src, np.float32)
    m = phone_mask(mask, wood.size)
    w8 = np.asarray(wood); w = w8.astype(np.float32)
    out = np.clip(paint * (1 - m) + w * m + .5, 0, 255).astype(np.uint8)
    core = m[..., 0] >= 1.0
    changed = int(np.any(out[core] != w8[core], axis=-1).sum()) if core.any() else 0
    assert changed == 0, f"{theme}/{name}: {changed} face pixels changed before encoding"
    wood_bytes = os.path.getsize(os.path.join(folder, name + ".webp"))
    data, q = encode(Image.fromarray(out), int(wood_bytes * (1 + PHONE_SIZE_SLACK)), 76 if core.any() else 40)
    dec = np.asarray(Image.open(io.BytesIO(data)).convert("RGB"), np.float32)
    drift = round(float(np.abs(dec[core] - w[core]).mean()), 3) if core.any() else None
    assert drift is None or drift <= FACE_DRIFT_MAX, f"{theme}/{name}: faces drift {drift} levels after WebP (max {FACE_DRIFT_MAX})"
    crop = face_crops(wood, Image.fromarray(dec.astype(np.uint8)), m, os.path.join(crops_root, theme, name + ".jpg")) if crops_root else None
    dest_dir = os.path.join(dest_root or folder, theme)
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, name + ".webp")
    with open(dest, "wb") as fh: fh.write(data)
    return {"file": dest if dest_root else os.path.relpath(dest, ROOT), "shift": [dx, dy], "quality": q,
            "bytes": len(data), "wooden_bytes": wood_bytes, "size_vs_wooden": round(len(data) / wood_bytes - 1, 3),
            "core_px": int(core.sum()), "core_changed_pre_encode": changed,
            "core_decoded_mean_diff": drift, "face_crops": crop}

def tile_from(master):
    """TILE_SLAB_HC_V1_512 from a 2X slab painting: the same square as the Wooden tile, halved, then made seamless: a copy
    rolled by half a tile (its own edges meet in the middle, so it repeats) takes over in a TILE_SEAM band at each edge."""
    m = master if master.size == (3072, 1728) else master.resize((3072, 1728), Image.LANCZOS)
    a = np.asarray(m.crop(SLAB_TILE_BOX).resize((512, 512), Image.LANCZOS), np.float32)
    r = np.roll(a, (256, 256), axis=(0, 1))
    d = np.minimum(np.arange(512), np.arange(512)[::-1]).astype(np.float32)
    w1 = np.clip(d / TILE_SEAM, 0, 1); w1 = w1 * w1 * (3 - 2 * w1)  # 0 at the edge, 1 a band in
    w = (w1[:, None] * w1[None, :])[..., None]
    return Image.fromarray(np.clip(a * w + r * (1 - w) + .5, 0, 255).astype(np.uint8))

def paint_desk(theme, name, path, room, folder, mask, framing, crops_root=None):
    """One desktop file: the painting aligned to the Wooden plate at this size, the Wooden men laid back through the hero
    mask (if the room has them), the same checks as paint_phone, written to <folder>/<theme>/<name>.webp."""
    wood = Image.open(os.path.join(folder, name + ".webp")).convert("RGB")
    master = Image.open(path).convert("RGB")
    dx = dy = 0
    if framing == "tile":
        src = tile_from(master)
    else:
        src = master if master.size == wood.size else master.resize(wood.size, Image.LANCZOS)
        if not name.startswith("ENV_SLAB_"):  # the slab is a whole-surface repaint with nothing to align to
            dx, dy = shift_of(src, wood)
            assert abs(dx) <= 4 and abs(dy) <= 4, f"{theme}/{name}: painting is {dx},{dy} px off the Wooden plate"
            if dx or dy: src = shifted(src, dx, dy)
    m = hero_mask(None if mask is None else room, wood.size, mask)
    w8 = np.asarray(wood); w = w8.astype(np.float32)
    out = np.clip(np.asarray(src, np.float32) * (1 - m) + w * m + .5, 0, 255).astype(np.uint8)
    core = m[..., 0] >= 1.0
    changed = int(np.any(out[core] != w8[core], axis=-1).sum()) if core.any() else 0
    assert changed == 0, f"{theme}/{name}: {changed} face pixels changed before encoding"
    wood_bytes = os.path.getsize(os.path.join(folder, name + ".webp"))
    data, q = encode(Image.fromarray(out), int(wood_bytes * (1 + DESK_SIZE_SLACK)), 76 if core.any() else 40)
    dec = np.asarray(Image.open(io.BytesIO(data)).convert("RGB"), np.float32)
    drift = round(float(np.abs(dec[core] - w[core]).mean()), 3) if core.any() else None
    assert drift is None or drift <= FACE_DRIFT_MAX, f"{theme}/{name}: faces drift {drift} levels after WebP (max {FACE_DRIFT_MAX})"
    crop = face_crops(wood, Image.fromarray(dec.astype(np.uint8)), m, os.path.join(crops_root, theme, name + ".jpg")) if crops_root else None
    os.makedirs(os.path.join(folder, theme), exist_ok=True)
    dest = os.path.join(folder, theme, name + ".webp")
    with open(dest, "wb") as fh: fh.write(data)
    return {"file": os.path.relpath(dest, ROOT), "shift": [dx, dy], "quality": q, "bytes": len(data),
            "wooden_bytes": wood_bytes, "size_vs_wooden": round(len(data) / wood_bytes - 1, 3), "core_px": int(core.sum()),
            "core_changed_pre_encode": changed, "core_decoded_mean_diff": drift, "face_crops": crop}

def build(masters=None, dest_root=None, crops_root=None):
    done = []
    for theme, name, painting, room, folder, mask, framing, kind in _targets(masters):
        if framing in ("desk", "tile"):
            if dest_root: continue  # the stand-in proof covers the phone files only
            done.append(paint_desk(theme, name, painting, room, folder, mask, framing, crops_root))
        else:
            done.append(paint_phone(theme, name, painting, room, folder, mask, framing, dest_root, crops_root, kind))
    return done

def stand_in_masters():
    """Today's recoloured phone plates as stand-in bands (Duet P1 step 0): every room, every clubhouse."""
    out = {}
    for room in PHONE_ROOMS:
        for theme in THEME.values():
            src = {"CLUB": os.path.join(SRC, theme, "ENV_CLUB_PHONE_HC_V4.webp"),
                   "LOADING": os.path.join(LOADING, theme, "ENV_LOADING_PHONE_HC.webp")}.get(room, os.path.join(SRC, theme, f"ENV_{room}_PHONE_HC_V3.webp"))
            out[(room, theme, "phone")] = src
    return out

def check_tall():
    """How well the TALL row map rebuilds each Wooden TALL plate from its Wooden 9:16 plate (mean level difference above
    the knee with the men left out, and on the counter below it)."""
    res = {}
    for room in TALL_KNEE:
        v3 = Image.open(os.path.join(SRC, f"ENV_{room}_PHONE_HC_V3.webp")).convert("RGB")
        tall = np.asarray(Image.open(os.path.join(SRC, f"ENV_{room}_PHONE_HC_V3_TALL.webp")).convert("RGB"), np.float32)
        made = np.asarray(tall_rows(v3, room, tall.shape[0]), np.float32)
        men = np.asarray(Image.open(os.path.join(MASKS, f"ENV_{room}_PHONE_HC_V3_TALL.png")).convert("L")) > 0
        d = np.abs(made - tall).mean(-1); k = TALL_KNEE[room]
        res[room] = {"above_knee": round(float(d[:k][~men[:k]].mean()), 2), "counter": round(float(d[k:].mean()), 2),
                     "counter_mean_level_made_vs_wooden": [round(float(made[k:].mean()), 1), round(float(tall[k:].mean()), 1)]}
    return res

if __name__ == "__main__":
    if "--check-tall" in sys.argv:
        print(json.dumps(check_tall(), indent=1))
    elif "--stand-in" in sys.argv:
        out = sys.argv[sys.argv.index("--stand-in") + 1]
        print(json.dumps(build(stand_in_masters(), out, os.path.join(out, "face-crops")), indent=1))
    else:
        crops = sys.argv[sys.argv.index("--crops") + 1] if "--crops" in sys.argv else None
        for d in build(crops_root=crops): print("painted", json.dumps(d))
