#!/usr/bin/env python3
"""HO-073 Home crowd intake (Team V).

Takes the 3 ChatGPT stand edits (A, B, C) and puts ONLY the new stands into the
Home plates. Everything outside the stand bands, and the two managers, keep the
original pixels (alpha 0). Phone + 1X + 590W are derived from the same new
stands, so desktop and phone show one crowd.

  python3 -I ho073_intake.py guides   # build guide pictures (already in guides/)
  python3 -I ho073_intake.py intake   # in/HOME_STANDS_{A,B,C}_V1.png -> out/
  python3 -I ho073_intake.py selftest # feed the ORIGINAL plate back in; proves
                                      # the pipeline changes nothing by itself

Needs: pillow, numpy, opencv-python-headless.
"""
import json, sys, hashlib
from pathlib import Path
import numpy as np, cv2
from PIL import Image

HERE = Path(__file__).resolve().parent.parent          # .../ho073
PLATES = HERE.parent                                    # .../plates-hc
Z = json.loads((HERE / "zones.json").read_text())
import os
# Base plates to build on (default: today's V2 next to this folder). HO-074 relit
# heads first, so the final run uses: HO073_BASE=<dir with V3 files> HO073_TAG=V3
BASE = Path(os.environ.get("HO073_BASE", PLATES))
TAG = os.environ.get("HO073_TAG", "V2")
def plate(kind):
    return BASE / {"2X": f"ENV_HOME_PLATE_HC_{TAG}_2X.webp", "1X": f"ENV_HOME_PLATE_HC_{TAG}_1X.webp",
                   "PH": f"ENV_HOME_PHONE_HC_{TAG}.webp", "590": f"ENV_HOME_PHONE_HC_{TAG}_590W.webp"}[kind]

def load_rgb(p):
    return np.asarray(Image.open(p).convert("RGB")).astype(np.float32)

def save_webp(arr, p, q):
    Image.fromarray(np.clip(arr + 0.5, 0, 255).astype(np.uint8)).save(p, "WEBP", quality=q, method=6)

def people(name):
    m = np.asarray(Image.open(HERE / "masks" / name).convert("L")).astype(np.float32) / 255
    m = cv2.dilate((m > 0.35).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
    return cv2.GaussianBlur(m, (0, 0), 2.0)              # 1 = keep original manager

def protect_edits(P, base_img, v2_name):
    """Keep every pixel an earlier pass (e.g. HO-074 head relight) changed vs V2."""
    if TAG == "V2":
        return P
    v2 = load_rgb(PLATES / v2_name)
    d = (np.abs(base_img - v2).max(2) > 10).astype(np.uint8)
    near = cv2.dilate((P > 0.5).astype(np.uint8), np.ones((81, 81), np.uint8))   # heads only, not WebP noise
    d = d * near
    d = cv2.dilate(d, np.ones((7, 7), np.uint8)).astype(np.float32)
    return np.maximum(P, cv2.GaussianBlur(d, (0, 0), 2.0))

def band_weight(shape, box, pane, feather):
    """1 inside crop box ∩ pane, soft ramp of `feather` px at the crop's top/bottom."""
    h, w = shape
    wgt = np.zeros((h, w), np.float32)
    x0, y0, x1, y1 = box
    px0, py0, px1, py1 = pane
    ys = np.arange(h, dtype=np.float32)
    ylo, yhi = Z["band_y"]
    y0, y1 = max(y0, ylo), min(y1, yhi)
    ramp = np.clip(np.minimum(ys - y0, y1 - 1 - ys) / feather, 0, 1)
    xa, xb = max(x0, px0), min(x1, px1)
    ya, yb = max(y0, py0), min(y1, py1)
    wgt[ya:yb, xa:xb] = ramp[ya:yb, None]
    return wgt

def guides():
    D = load_rgb(PLATES / "ENV_HOME_PLATE_HC_V2_2X.webp")
    P = people("home_people_mask_2x.png") > 0.05
    out = D.copy(); out[P] = (255, 0, 255)
    for k, c in Z["crops"].items():
        x0, y0, x1, y1 = c["box"]
        g = cv2.resize(out[y0:y1, x0:x1], tuple(c["send_size"]), interpolation=cv2.INTER_LANCZOS4)
        Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).save(HERE / "guides" / f"GUIDE_HOME_STANDS_{k}.png")
        print("guide", k)

def align(res, ref, valid):
    """ECC affine of the ChatGPT result onto the original crop (magenta excluded)."""
    g1 = cv2.cvtColor(ref.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    g2 = cv2.cvtColor(np.clip(res, 0, 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        cc, warp = cv2.findTransformECC(g1, g2, warp, cv2.MOTION_AFFINE,
                                        (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6),
                                        valid.astype(np.uint8), 5)
    except cv2.error:
        cc = -1
    h, w = ref.shape[:2]
    return cv2.warpAffine(res, warp, (w, h), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                          borderMode=cv2.BORDER_REPLICATE), float(cc), warp

def build_view(src):
    """Desktop-2X-sized layer holding the new stands, plus its weight."""
    D = load_rgb(plate("2X"))
    P = protect_edits(people("home_people_mask_2x.png"), D, "ENV_HOME_PLATE_HC_V2_2X.webp")
    view = D.copy(); wgt = np.zeros(D.shape[:2], np.float32); report = {}
    for k, c in Z["crops"].items():
        x0, y0, x1, y1 = c["box"]
        res = src(k)
        if res is None:
            report[k] = "missing, original kept"; continue
        res = cv2.resize(res, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
        valid = P[y0:y1, x0:x1] < 0.05
        res, cc, warp = align(res, D[y0:y1, x0:x1], valid)
        w = band_weight(D.shape[:2], c["box"], Z["desktop_panes"][c["pane"]], Z["feather_px"])
        view[y0:y1, x0:x1] = np.where(w[y0:y1, x0:x1, None] > 0, res, view[y0:y1, x0:x1])
        wgt = np.maximum(wgt, w)
        report[k] = {"ecc": round(cc, 4), "shift_px": [round(float(warp[0, 2]), 2), round(float(warp[1, 2]), 2)]}
    return D, P, view, wgt, report

def warp_to_phone(img, piece, size):
    m = Z["phone_map"][piece]
    s, bx, by = m["s"], m["bx"], m["by"]
    w, h = size
    xs, ys = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(img, bx + xs * s, by + ys * s, cv2.INTER_AREA if img.ndim == 2 else cv2.INTER_LINEAR,
                     borderMode=cv2.BORDER_CONSTANT, borderValue=0)

def compose(src, outdir):
    outdir.mkdir(exist_ok=True)
    D, P, view, wgt, report = build_view(src)
    a2 = wgt * (1 - P)
    new2 = D * (1 - a2[..., None]) + view * a2[..., None]
    # 1X: original 1X everywhere alpha is 0
    O1 = load_rgb(plate("1X"))
    a1 = cv2.resize(a2, (O1.shape[1], O1.shape[0]), interpolation=cv2.INTER_AREA)
    n1 = cv2.resize(new2, (O1.shape[1], O1.shape[0]), interpolation=cv2.INTER_LANCZOS4)
    new1 = O1 * (1 - a1[..., None]) + n1 * a1[..., None]
    # phone: same new stands, mapped per pane piece
    Ph = load_rgb(plate("PH"))
    PP = protect_edits(people("phone_people_mask.png"), Ph, "ENV_HOME_PHONE_HC_V2.webp")
    H, W = Ph.shape[:2]
    newp = Ph.copy(); ap_all = np.zeros((H, W), np.float32)
    for piece, rect in Z["phone_panes"].items():
        x0, y0, x1, y1 = rect
        v = warp_to_phone(view, piece, (W, H)); wv = warp_to_phone(wgt, piece, (W, H))
        ap = np.zeros((H, W), np.float32); ap[y0:y1, x0:x1] = wv[y0:y1, x0:x1]
        ap *= (1 - PP)
        newp = newp * (1 - ap[..., None]) + v * ap[..., None]
        ap_all = np.maximum(ap_all, ap)
    O5 = load_rgb(plate("590"))
    a5 = cv2.resize(ap_all, (O5.shape[1], O5.shape[0]), interpolation=cv2.INTER_AREA)
    n5 = cv2.resize(newp, (O5.shape[1], O5.shape[0]), interpolation=cv2.INTER_LANCZOS4)
    new5 = O5 * (1 - a5[..., None]) + n5 * a5[..., None]
    files = {plate("2X").name: (new2, 88), plate("1X").name: (new1, 86),
             plate("PH").name: (newp, 86), plate("590").name: (new5, 86)}
    for n, (arr, q) in files.items():
        save_webp(arr, outdir / n, q)
        report[n] = {"bytes": (outdir / n).stat().st_size,
                     "sha256": hashlib.sha256((outdir / n).read_bytes()).hexdigest()}
    # pixel check: outside alpha the picture must equal the original (before WebP)
    report["max_change_outside_desktop"] = float(np.abs(new2 - D)[a2 == 0].max())
    report["max_change_outside_phone"] = float(np.abs(newp - Ph)[ap_all == 0].max())
    Image.fromarray((a2 * 255).astype(np.uint8)).save(outdir / "alpha_desktop_2x.png")
    Image.fromarray((ap_all * 255).astype(np.uint8)).save(outdir / "alpha_phone.png")
    # before/after crops at 1920 wide (Team G's accept check)
    def side(old, new, box, scale):
        x0, y0, x1, y1 = box
        a = cv2.resize(old[y0:y1, x0:x1], None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        b = cv2.resize(new[y0:y1, x0:x1], None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        return np.concatenate([a, np.full((a.shape[0], 8, 3), 128, np.float32), b], 1)
    s19 = 1920 / 3072
    ev = np.concatenate([side(D, new2, (880, 520, 3072, 920), s19)], 0)
    Image.fromarray(np.clip(ev, 0, 255).astype(np.uint8)).save(outdir / "BEFORE_AFTER_STANDS_1920.png")
    full = np.concatenate([cv2.resize(D, (1920, 1080), interpolation=cv2.INTER_AREA),
                           cv2.resize(new2, (1920, 1080), interpolation=cv2.INTER_AREA)], 0)
    Image.fromarray(np.clip(full, 0, 255).astype(np.uint8)).save(outdir / "BEFORE_AFTER_FULL_1920.jpg", quality=88)
    ph = side(Ph, newp, (0, 380, 1179, 840), 1.0)
    Image.fromarray(np.clip(ph, 0, 255).astype(np.uint8)).save(outdir / "BEFORE_AFTER_PHONE.png")
    (outdir / "REPORT.json").write_text(json.dumps(report, indent=1))
    print(json.dumps(report, indent=1))

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "intake"
    if cmd == "guides":
        guides(); return
    if cmd == "selftest":
        D = load_rgb(plate("2X"))
        def src(k):
            x0, y0, x1, y1 = Z["crops"][k]["box"]
            return cv2.resize(D[y0:y1, x0:x1], tuple(Z["crops"][k]["send_size"]), interpolation=cv2.INTER_LANCZOS4)
        compose(src, HERE / "evidence" / "selftest"); return
    def src(k):
        f = HERE / "in" / f"HOME_STANDS_{k}_V1.png"
        return load_rgb(f) if f.exists() else None      # missing pane keeps its original stands
    compose(src, HERE / "out")

if __name__ == "__main__":
    main()
