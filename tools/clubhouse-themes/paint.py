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
men in it, so they take the painting as it is. The people-free League Roulette box (ENV_BOX_PHONE_HC_V4*, ENV_BOX_SIDEWAYS_HC_V4)
and ENV_CLUB_SIDEWAYS_HC_V4 are other framings with nobody in them: a band with the men painted in cannot make them, so they
keep their recoloured copies until Team V paints them (NOT_FROM_BAND).

Every phone file is checked as it is written (paint_phone): the painting's alignment to the Wooden plate (phase correlation;
a master off by a whole pixel is shifted, never the Wooden), 0 changed pixels in the fully Wooden core of the hero mask before
encoding (asserted), the decoded mean difference in that core after WebP, and the file size against the Wooden file (the
quality steps down from 90 until it is within PHONE_SIZE_SLACK of Wooden).

  python3 tools/clubhouse-themes/paint.py                  # then: python3 tools/clubhouse-themes/pin.py
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
PHONE_ROOMS = ("HOME", "BOARD", "OFFICE", "HALL", "ARCHIVE", "BOX", "COACHES", "TUNNEL", "CLUB", "LOADING")
# The first TALL row that is not the 9:16 band's own row: the top of the counter's front face (Duet P1, 2026-11-24: measured
# on the Wooden V3/TALL pairs by a monotone row match; above it the two Wooden plates differ by 0-1.4 levels, i.e. only WebP).
TALL_KNEE = {"BOX": 1227, "COACHES": 827, "HALL": 1421}
NOT_FROM_BAND = ("ENV_BOX_PHONE_HC_V4", "ENV_BOX_SIDEWAYS_HC_V4", "ENV_CLUB_SIDEWAYS_HC_V4")

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
    for (room, theme, kind), path in sorted(masters.items()):
        if kind == "desk":
            for g in _plates(SRC, rf"^ENV_{room}_PLATE_HC_V3_(1920|1X|2X)\.webp$"):
                out.append((theme, g, path, room, SRC, None, "desk", kind))
        else:
            for folder, g, mask, framing in phone_out(room):
                out.append((theme, g, path, room, folder, mask, framing, kind))
    return out

def hero_mask(room, size):
    path = os.path.join(MASKS, f"ENV_{room}_PLATE_HC_V3_1920.png")
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
    return master if master.size == size else master.resize(size, Image.LANCZOS)

def encode(img, limit):
    """WebP at q90 method 6, stepping down to q76 until the file is within limit bytes."""
    for q in range(90, 74, -2):
        buf = io.BytesIO(); img.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= limit or q == 76:
            return buf.getvalue(), q

def paint_phone(theme, name, path, room, folder, mask, framing, dest_root=None):
    wood = Image.open(os.path.join(folder, name + ".webp")).convert("RGB")
    master = Image.open(path).convert("RGB")
    if master.size != (PHONE_W, 2096):
        master = master.resize((PHONE_W, round(PHONE_W * master.height / master.width)), Image.LANCZOS)
    # alignment against the Wooden 9:16 plate the band was painted over (Team V's Image 1)
    ref_name = name.split("_TALL")[0] if framing == "tall" else name.replace("_590W", "")
    ref = Image.open(os.path.join(folder, ref_name + ".webp")).convert("RGB")
    ref = ref if ref.size == master.size else ref.resize(master.size, Image.LANCZOS)
    dx, dy = shift_of(master, ref)
    if dx or dy: master = shifted(master, dx, dy)
    paint = np.asarray(phone_source(master, room, framing, wood.size), np.float32)
    m = phone_mask(mask, wood.size)
    w8 = np.asarray(wood); w = w8.astype(np.float32)
    out = np.clip(paint * (1 - m) + w * m + .5, 0, 255).astype(np.uint8)
    core = m[..., 0] >= 1.0
    changed = int(np.any(out[core] != w8[core], axis=-1).sum()) if core.any() else 0
    assert changed == 0, f"{theme}/{name}: {changed} face pixels changed before encoding"
    wood_bytes = os.path.getsize(os.path.join(folder, name + ".webp"))
    data, q = encode(Image.fromarray(out), int(wood_bytes * (1 + PHONE_SIZE_SLACK)))
    dec = np.asarray(Image.open(io.BytesIO(data)).convert("RGB"), np.float32)
    dest_dir = os.path.join(dest_root or folder, theme)
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, name + ".webp")
    with open(dest, "wb") as fh: fh.write(data)
    return {"file": dest if dest_root else os.path.relpath(dest, ROOT), "shift": [dx, dy], "quality": q,
            "bytes": len(data), "wooden_bytes": wood_bytes, "size_vs_wooden": round(len(data) / wood_bytes - 1, 3),
            "core_px": int(core.sum()), "core_changed_pre_encode": changed,
            "core_decoded_mean_diff": round(float(np.abs(dec[core] - w[core]).mean()), 3) if core.any() else None}

def build(masters=None, dest_root=None):
    done = []
    for theme, name, painting, room, folder, mask, framing, kind in _targets(masters):
        if kind == "phone":
            done.append(paint_phone(theme, name, painting, room, folder, mask, framing, dest_root))
            continue
        wood = Image.open(os.path.join(SRC, name + ".webp")).convert("RGB")
        paint = Image.open(painting).convert("RGB")
        if paint.size != wood.size: paint = paint.resize(wood.size, Image.LANCZOS)
        m = hero_mask(room, wood.size)
        out = np.asarray(paint, np.float32) * (1 - m) + np.asarray(wood, np.float32) * m
        dest = os.path.join(SRC, theme, name + ".webp")
        Image.fromarray(np.clip(out + .5, 0, 255).astype(np.uint8)).save(dest, quality=90, method=6)
        done.append({"file": os.path.relpath(dest, ROOT)})
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
        print(json.dumps(build(stand_in_masters(), sys.argv[sys.argv.index("--stand-in") + 1]), indent=1))
    else:
        for d in build(): print("painted", json.dumps(d))
