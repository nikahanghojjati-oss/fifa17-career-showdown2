# Seam audit (owner follow-up to the HLC intake tone-match run) + G8 fingertip containment.
# 1. g8_finger.json: in 1X plate px, where the wheel paint (rim + bezel, r <= 268 around the slot)
#    meets Daniel's hand box: Daniel pixels under the wheel, how many are restored by the finger
#    overlay alpha, and how many old-rim / old-wheel remnant pixels (goal pixels kept by the intake
#    hard-restore) stay visible.
# 2. seam_report.json: for every intake seam (zone edges, slot circle, protected-box edges) the step
#    across the line minus the step beside it ("excess"), on the raw plate and on each rendered
#    screenshot (render-qa evidence), so a seam the UI does not hide shows up as a positive excess.
# Usage (from visual-assets/v10_1/league, after render-qa): python3 tools/seam_audit.py [edit.png]
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw

M = json.load(open("assets/platemap.json"))
plate = np.asarray(Image.open("assets/ENV_LEAGUE_PLATE_V1_1X.png").convert("RGB")).astype(float)
CX, CY = 762, 496
BEZEL_R, RIM_R = 268, 240
yy, xx = np.mgrid[0:864, 0:1536]
rr = np.hypot(xx - CX, yy - CY)

# ---------- 1. fingertip / old rim strip ----------
KEEP = [440, 410, 560, 500]  # finger overlay rect (keep_rects[0] widened to the hand-box rows, LEAGUE-M1)
HB = M["protected_boxes"]["hand_daniel"]
ovl = np.zeros((864, 1536))
a = np.asarray(Image.open("assets/OVL_DANIEL_FINGER_V1_1X.png"))[..., 3] / 255.0
ovl[KEEP[1]:KEEP[3], KEEP[0]:KEEP[2]] = a
hand = np.zeros((864, 1536), bool); hand[HB[1]:HB[3], HB[0]:HB[2]] = True
# Every wheel-paint pixel inside hand_daniel is classified: restored by the overlay (alpha >= 0.5), or
# not restored. Not-restored pixels are split with the intake input (plates-in edit, resized like intake):
# old-rim/old-wheel remnant (differs from the edit by > 45, x >= 506: the goal's wheel kept by the intake
# hard-restore), background glow (equals the edit: no Daniel there in either image), or OTHER (would be
# Daniel pixels left under the wheel; must be 0 or explained).
k = np.zeros_like(hand); k[KEEP[1]:KEEP[3], KEEP[0]:KEEP[2]] = True
wheel = rr <= BEZEL_R
paint = hand & wheel
restored = paint & (ovl >= 0.5)
g8 = {"wheel_paint_radius_plate_px": BEZEL_R, "rim_radius_plate_px": RIM_R, "overlay_rect_1x": KEEP,
      "wheel_paint_px_in_hand_box": int(paint.sum()), "restored_by_overlay_alpha_ge_0_5": int(restored.sum())}
edit_path = sys.argv[1] if len(sys.argv) > 1 else None
if edit_path:
    e = np.asarray(Image.open(edit_path).convert("RGB").resize((1536, 864), Image.LANCZOS)).astype(float)
    diff = np.abs(plate - e).sum(2)
    left = paint & (ovl < 0.5)
    remnant = left & (diff > 45) & (xx >= 506)
    glow = left & (diff <= 45)
    other = left & ~remnant & ~glow
    g8.update({"not_restored_old_rim_remnant_px": int(remnant.sum()), "not_restored_background_glow_px": int(glow.sum()), "not_restored_other_px": int(other.sum())})
    if other.any():
        ys, xs = np.nonzero(other); g8["other_bbox"] = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
    rem_all = hand & (diff > 45) & (xx >= 506) & (ovl < 0.5)
    g8["old_rim_remnant_px_total"] = int(rem_all.sum())
    g8["old_rim_remnant_visible_outside_wheel_paint"] = int((rem_all & ~wheel).sum())
    if (rem_all & ~wheel).any():
        ys, xs = np.nonzero(rem_all & ~wheel); g8["remnant_visible_bbox"] = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
    # Daniel's sleeve just below the hand box (not protected, reported for the look): wheel paint over
    # pixels that are dark jacket in the plate (luma < 60) left of x 507, rows 500-520
    luma = plate @ np.array([.2126, .7152, .0722])
    below = (yy >= 500) & (yy < 520) & (xx < 507) & wheel & (luma < 60)
    g8["below_hand_box_dark_sleeve_px_under_wheel_paint"] = int(below.sum())
json.dump(g8, open("evidence/g8_finger.json", "w"), indent=1)
print("g8", g8)

# ---------- 2. seams ----------
R = M["remove_rects"]
def edges(name, r):
    x0, y0, x1, y1 = r
    return [(f"{name} left", "v", x0, y0, y1), (f"{name} right", "v", x1, y0, y1), (f"{name} top", "h", y0, x0, x1), (f"{name} bottom", "h", y1, x0, x1)]
SEAMS = []
SEAMS += [s for s in edges("header zone A", R[0]) if s[0].endswith(("bottom", "right"))]
SEAMS += [s for s in edges("header zone B", R[1]) if s[0].endswith(("bottom", "left", "right"))]
SEAMS += [s for s in edges("header zone C", R[2]) if s[0].endswith(("bottom", "left"))]
SEAMS += edges("title zone", R[3]) + edges("left slogan zone", R[4]) + edges("right slogan zone", R[5]) + edges("button zone", R[6])
SEAMS += [("footer zone top", "h", R[7][1], 0, 1536)]
SEAMS += [("hand_daniel right (old wheel patch)", "v", 560, 410, 500), ("hand_daniel top (old rim strip)", "h", 410, 500, 560), ("hand_daniel bottom (old rim strip)", "h", 500, 500, 560),
          ("face_nik right", "v", 1270, 100, 360), ("face_daniel left", "v", 205, 95, 340)]

def sample(img, x, y):
    h, w = img.shape[:2]
    x = min(max(x, 0), w - 1); y = min(max(y, 0), h - 1)
    x0, y0 = int(math.floor(x)), int(math.floor(y)); x1, y1 = min(x0 + 1, w - 1), min(y0 + 1, h - 1); fx, fy = x - x0, y - y0
    return (img[y0, x0] * (1 - fx) * (1 - fy) + img[y0, x1] * fx * (1 - fy) + img[y1, x0] * (1 - fx) * fy + img[y1, x1] * fx * fy)

def seam_excess(img, tf, seam, d=1.5, n=60):
    name, kind, pos, a0, a1 = seam
    k, ox, oy = tf
    vals = []
    for i in range(n):
        t = a0 + (a1 - a0) * (i + .5) / n
        if kind == "v": X, Y = ox + pos * k, oy + t * k; P = lambda o: sample(img, X + o, Y)
        else: X, Y = ox + t * k, oy + pos * k; P = lambda o: sample(img, X, Y + o)
        if not (0 <= X < img.shape[1] and 0 <= Y < img.shape[0]): continue
        across = np.abs(P(d) - P(-d)).sum(); beside = (np.abs(P(d + 3) - P(d)).sum() + np.abs(P(-d) - P(-d - 3)).sum()) / 2
        vals.append(across - beside)
    return round(float(np.mean(vals)), 1) if vals else None

def circle_excess(img, tf, r=250, n=180):
    k, ox, oy = tf; vals = []
    for i in range(n):
        th = 2 * math.pi * i / n; cx, cy = ox + CX * k, oy + CY * k
        P = lambda rad: sample(img, cx + rad * math.cos(th), cy + rad * math.sin(th))
        X, Y = cx + r * k * math.cos(th), cy + r * k * math.sin(th)
        if not (0 <= X < img.shape[1] and 0 <= Y < img.shape[0]): continue
        rk = r * k
        vals.append(np.abs(P(rk + 1.5) - P(rk - 1.5)).sum() - (np.abs(P(rk + 4.5) - P(rk + 1.5)).sum() + np.abs(P(rk - 1.5) - P(rk - 4.5)).sum()) / 2)
    return round(float(np.mean(vals)), 1) if vals else None

report = {"method": "mean over the seam of |px(+1.5) - px(-1.5)| minus the same step measured 3 px beside it (sum of RGB, 0-765); >= 12 = visible line",
          "threshold_visible": 12, "plate": {}, "renders": {}}
for s in SEAMS: report["plate"][s[0]] = seam_excess(plate, (1, 0, 0), s, d=1)
report["plate"]["slot circle r=250"] = circle_excess(plate, (1, 0, 0))
qa = json.load(open("evidence/qa_report.json"))
for r in qa["results"]:
    sh = r["shot"]
    if sh.get("grid") or sh["frame"] not in ("L1", "L3") or (sh["dpr"] > 1 and sh["vw"] > 760): continue
    dd = r["data"]; dpr = sh["dpr"]
    img = np.asarray(Image.open(f"evidence/{sh['file']}").convert("RGB")).astype(float)
    k, ox, oy = float(dd["k"]) * dpr, float(dd["ox"]) * dpr, float(dd["oy"]) * dpr
    band = None
    if dd.get("band"):
        b = [int(v) * dpr for v in dd["band"].split(",")]; band = b
    res = {}
    for s in SEAMS:
        name, kind, pos, a0, a1 = s
        if band:  # phone: only the part of the seam inside the visible band
            ys = [oy + pos * k] if kind == "h" else [oy + a0 * k, oy + a1 * k]
            if max(ys) < band[1] or min(ys) > band[3] - 28 * dpr: res[name] = "out of frame"; continue
        res[name] = seam_excess(img, (k, ox, oy), s, d=1.5 * dpr)
    res["slot circle r=250"] = circle_excess(img, (k, ox, oy)) if not band else "behind wheel / veil (phone)"
    report["renders"][sh["file"]] = res
vis = {}
for f, res in report["renders"].items():
    v = [n for n, x in res.items() if isinstance(x, (int, float)) and x >= 12]
    if v: vis[f] = v
report["render_steps_ge_threshold_any_cause"] = vis  # includes UI edges (header hairline, text, panels) that sit on a zone line
report["plate_seams_still_visible_in_render"] = {f: [n for n in v if (report["plate"].get(n) or 0) >= 12] for f, v in vis.items() if any((report["plate"].get(n) or 0) >= 12 for n in v)}
report["visible_on_plate"] = [n for n, x in report["plate"].items() if x is not None and x >= 12]
json.dump(report, open("evidence/seam_report.json", "w"), indent=1)
print("plate visible:", report["visible_on_plate"])
print("plate seams still visible in render:", json.dumps(report["plate_seams_still_visible_in_render"]))
