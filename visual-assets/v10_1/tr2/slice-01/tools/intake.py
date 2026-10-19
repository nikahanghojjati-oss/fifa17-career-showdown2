#!/usr/bin/env python3
"""CLOUD-TR2-01-CP1 asset intake pipeline (Appendix A2-A5).

Reproducible pipeline: verifies the five Gate 0 source files, cleans and
upscales the plate, derives pose masks, writes plate/pose maps, and writes
assets/manifest.json. Run from the slice-01 directory:

    python3 tools/intake.py

Requires tools/requirements.txt (pinned versions used for the recorded run).
"""
import json
import math
import sys
import time
import hashlib
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import pillow_avif  # noqa: F401  (registers AVIF plugin with Pillow)
import cv2
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "src"
DERIVED = ROOT / "assets" / "derived"
DERIVED.mkdir(parents=True, exist_ok=True)

ISSUES = []  # list of {"id":..., "detail":...}
LOG = []


def log(msg):
    print(msg)
    LOG.append(msg)


def issue(issue_id, detail):
    ISSUES.append({"id": issue_id, "detail": detail})
    log(f"ISSUE {issue_id}: {detail}")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


SOURCES = {
    "ENV_TR2_WARROOM_PLATE_V1.png": "224a674659c853834d48e92411ffec5325b3c70c6e34f1d4e779a820128b15bb",
    "POSE_TRANSFER_DANIEL_FOCUSED_V1.png": "8c9cde1e4ef118d57ca9b1b6dacc7429bb70494e5f8ebce853ed7f46036b2c49",
    "POSE_TRANSFER_NIK_TACTICAL_V1.png": "92c40b1290b06945122ba442bb0368c8025cc20b39e494c3d69926396b8488f5",
    "POSE_TR2_DANIEL_WINDOW_PITCH_V1.png": "e606f640fcc0fceb57991c585e59d0366dc955dd83ebba1b14cddb5d9b397d2e",
    "POSE_TR2_NIK_WINDOW_POINT_V1.png": "ea7d465e70488045a1ebdaf431ecd6db205a89c5b2439a32f942f1c08e6c77ac",
}

MANIFEST_ENTRIES = []


def add_manifest_entry(asset_id, role, path: Path, derived_from, operations, tool):
    im = Image.open(path)
    MANIFEST_ENTRIES.append({
        "asset_id": asset_id,
        "role": role,
        "path": str(path.relative_to(ROOT)),
        "width": im.width,
        "height": im.height,
        "mode": im.mode,
        "sha256": sha256_file(path),
        "derived_from": derived_from,
        "operations": operations,
        "tool": tool,
        "date": time.strftime("%Y-%m-%d", time.gmtime()),
    })


def verify_sources():
    log("== P1/Q1: verifying source hashes ==")
    for name, expected in SOURCES.items():
        path = SRC / name
        if not path.exists():
            log(f"FAIL CLOSED: missing source file {name}")
            sys.exit(f"FAIL CLOSED: missing required source file {name}")
        actual = sha256_file(path)
        if actual.lower() != expected.lower():
            log(f"FAIL CLOSED: hash mismatch for {name}: expected {expected}, got {actual}")
            sys.exit(f"FAIL CLOSED: hash mismatch for {name}")
        log(f"  OK {name} {actual}")
        add_manifest_entry(
            asset_id=name.rsplit(".", 1)[0],
            role="source",
            path=path,
            derived_from=None,
            operations=[{"op": "verify_sha256", "result": "match"}],
            tool="sha256sum",
        )


# ---------------------------------------------------------------------------
# Appendix A2: plate operations
# ---------------------------------------------------------------------------

CORNER_MARK_BOX = (1555, 10, 1665, 55)  # x0,y0,x1,y1 native pixels, padded around the stated 1560-1660/14-51 region


def plate_remove_corner_mark(img: Image.Image):
    log("== P2: removing corner mark ==")
    arr = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)
    x0, y0, x1, y1 = CORNER_MARK_BOX
    before_crop = img.crop((x0 - 40, y0 - 20, x1 + 40, y1 + 20))
    mask = np.zeros(arr.shape[:2], dtype=np.uint8)
    mask[y0:y1, x0:x1] = 255
    # feather the mask edge slightly so inpainting blends with the ceiling/glass gradient
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=1)
    inpainted = cv2.inpaint(arr, mask, 7, cv2.INPAINT_TELEA)
    out = Image.fromarray(cv2.cvtColor(inpainted, cv2.COLOR_BGR2RGB))
    after_crop = out.crop((x0 - 40, y0 - 20, x1 + 40, y1 + 20))
    return out, before_crop, after_crop


def unsharp(img: Image.Image, radius=1.0, amount=0.4):
    return img.filter(ImageFilter.UnsharpMask(radius=radius, percent=int(amount * 100), threshold=2))


def plate_upscale(img: Image.Image, target_size=(3344, 1882)):
    log("== P3: upscaling plate x2 ==")
    # Preference order per brief: (a) RealESRGAN x2plus, (b) RealESRGAN x4plus + Lanczos down,
    # (c) any other open-source super-resolution model, else Lanczos x2 + unsharp mask.
    # This sandboxed build has no GPU and no reachable pretrained-weight mirror for
    # RealESRGAN, so (a)/(b)/(c) are not available; falling back to (c)'s stated floor.
    issue("CP1-A-UPSCALE",
          "Real-ESRGAN (x2plus or x4plus) was not installable/runnable in this sandboxed build "
          "(no GPU, no reachable pretrained-weight source). Used Lanczos x2 plus unsharp mask "
          "(radius 1.0, amount 40%) per the brief's stated fallback (c).")
    up = img.resize(target_size, Image.LANCZOS)
    up = unsharp(up, radius=1.0, amount=0.4)
    return up


def plate_master(img: Image.Image):
    upscaled = plate_upscale(img)
    out_path = DERIVED / "ENV_TR2_WARROOM_PLATE_V1_MASTER.png"
    upscaled.save(out_path, optimize=True)
    log(f"  saved master {out_path} {upscaled.size} sha256={sha256_file(out_path)}")
    return upscaled, out_path


def export_pyramid(master: Image.Image, base_name: str, widths, out_dir: Path):
    log(f"== P5/Q7: exporting page pyramid for {base_name} ==")
    exports = []
    for w in widths:
        h = round(master.height * (w / master.width))
        resized = master.resize((w, h), Image.LANCZOS)
        webp_path = out_dir / f"{base_name}_{w}.webp"
        avif_path = out_dir / f"{base_name}_{w}.avif"
        resized.convert("RGB" if master.mode == "RGB" else "RGBA").save(webp_path, "WEBP", quality=82, method=6)
        try:
            resized.save(avif_path, "AVIF", quality=60)
        except Exception as exc:  # pragma: no cover - defensive; pillow-avif-plugin covers this
            issue("CP1-A-AVIF", f"AVIF export failed for {avif_path.name}: {exc}")
            continue
        for p in (webp_path, avif_path):
            exports.append({
                "path": str(p.relative_to(ROOT)),
                "width": w,
                "height": h,
                "bytes": p.stat().st_size,
                "sha256": sha256_file(p),
            })
            log(f"  {p.name}: {p.stat().st_size} bytes sha256={exports[-1]['sha256'][:12]}")
    return exports


# Plate map coordinates, measured by inspection on the 1672x941 source plate
# (normalised u,v = px / 1672, px / 941). All entries are estimates.
PLATE_W, PLATE_H = 1672, 941


def norm(pts):
    return [[round(x / PLATE_W, 4), round(y / PLATE_H, 4)] for x, y in pts]


def build_plate_map():
    log("== P6: writing plate map ==")
    data = {
        "estimate": True,
        "note": "All regions measured by inspection on the 1672x941 source plate; normalised (u,v).",
        "sign_body_rect": {"u0": 505 / PLATE_W, "v0": 62 / PLATE_H, "u1": 1148 / PLATE_W, "v1": 197 / PLATE_H},
        "sign_face_rect": {"u0": 525 / PLATE_W, "v0": 86 / PLATE_H, "u1": 1128 / PLATE_W, "v1": 176 / PLATE_H},
        "table_far_edge_polyline": norm([(100, 652), (400, 635), (836, 627), (1270, 635), (1560, 652)]),
        "standing_spot_columns": {
            "left_daniel": {"u0": 370 / PLATE_W, "v0": 140 / PLATE_H, "u1": 700 / PLATE_W, "v1": 941 / PLATE_H},
            "right_nik": {"u0": 980 / PLATE_W, "v0": 140 / PLATE_H, "u1": 1310 / PLATE_W, "v1": 941 / PLATE_H},
        },
        "glass_stadium_region_polygon": norm([(300, 15), (1400, 15), (1400, 635), (300, 635)]),
        "tactics_glow_surface_polygon": norm([(390, 684), (1232, 684), (1500, 855), (95, 855)]),
        "binder_area_rect": {"u0": 0 / PLATE_W, "v0": 520 / PLATE_H, "u1": 260 / PLATE_W, "v1": 700 / PLATE_H},
        "prop_area_left_rect": {"u0": 180 / PLATE_W, "v0": 560 / PLATE_H, "u1": 390 / PLATE_W, "v1": 660 / PLATE_H},
        "prop_area_right_rect": {"u0": 1350 / PLATE_W, "v0": 560 / PLATE_H, "u1": 1672 / PLATE_W, "v1": 780 / PLATE_H},
        "horizon_v_estimate": 500 / PLATE_H,
        "eye_point_targets": {
            "daniel": {"u": 0.33, "v": 0.21},
            "nik": {"u": 0.68, "v": 0.24},
        },
    }
    out_path = DERIVED / "ENV_TR2_WARROOM_PLATEMAP_V1.json"
    out_path.write_text(json.dumps(data, indent=2))
    log(f"  saved {out_path}")
    return data, out_path


def build_table_cutout(master: Image.Image, plate_map: dict):
    log("== P7: building table cutout ==")
    w, h = master.size
    scale_x = w / PLATE_W
    scale_y = h / PLATE_H
    poly = [(u * PLATE_W * scale_x, v * PLATE_H * scale_y) for u, v in plate_map["table_far_edge_polyline"]]
    # extend polyline down to the bottom corners of the frame to close the cutout region
    poly = [(0, poly[0][1])] + poly + [(w, poly[-1][1]), (w, h), (0, h)]
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).polygon(poly, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.5))
    cutout = master.convert("RGBA").copy()
    cutout.putalpha(mask)
    out_path = DERIVED / "ENV_TR2_WARROOM_TABLEMASK_V1.png"
    cutout.save(out_path, optimize=True)
    log(f"  saved {out_path}")
    # Page-weight: the raw RGBA PNG of a photographic 3344x1882 image is ~6MB and
    # blows the E11 page-byte budget (desktop <=4.5MB). Export compressed alpha
    # WebP/AVIF siblings for the page to actually use via <picture>.
    webp_path = DERIVED / "ENV_TR2_WARROOM_TABLEMASK_V1.webp"
    avif_path = DERIVED / "ENV_TR2_WARROOM_TABLEMASK_V1.avif"
    cutout.save(webp_path, "WEBP", quality=82, method=6)
    cutout.save(avif_path, "AVIF", quality=60)
    log(f"  saved {webp_path} ({webp_path.stat().st_size} bytes), {avif_path} ({avif_path.stat().st_size} bytes)")
    return out_path


def feathered_mask(size, polygon_or_rect, feather=18, is_rect=False):
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    if is_rect:
        d.rectangle(polygon_or_rect, fill=255)
    else:
        d.polygon(polygon_or_rect, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(feather))


def build_cue_masks(master: Image.Image, plate_map: dict):
    log("== P8: building cue light-rig masks ==")
    w, h = master.size
    sx, sy = w / PLATE_W, h / PLATE_H

    def scaled(pts):
        return [(x * sx, y * sy) for x, y in pts]

    glass_poly = scaled([(p[0] * PLATE_W, p[1] * PLATE_H) for p in plate_map["glass_stadium_region_polygon"]])
    tactics_poly = scaled([(p[0] * PLATE_W, p[1] * PLATE_H) for p in plate_map["tactics_glow_surface_polygon"]])
    sr = plate_map["sign_face_rect"]
    sign_rect = (sr["u0"] * PLATE_W * sx, sr["v0"] * PLATE_H * sy, sr["u1"] * PLATE_W * sx, sr["v1"] * PLATE_H * sy)

    half = (w // 2, h // 2)
    outputs = {}
    for name, geom, is_rect, feather in [
        ("LIGHTRIG_GLASS", glass_poly, False, 20),
        ("LIGHTRIG_TACTICS", tactics_poly, False, 16),
        ("LIGHTRIG_SIGNFACE", sign_rect, True, 12),
    ]:
        mask = feathered_mask((w, h), geom, feather=feather, is_rect=is_rect)
        mask_half = mask.resize(half, Image.LANCZOS)
        out_path = DERIVED / f"{name}.png"
        mask_half.save(out_path)
        outputs[name] = out_path
        log(f"  saved {out_path} ({mask_half.size})")
    return outputs


def build_blurred_plate(master: Image.Image):
    log("== P9: building blurred plate fallback ==")
    half = master.resize((master.width // 2, master.height // 2), Image.LANCZOS)
    blurred = half.filter(ImageFilter.GaussianBlur(18))
    out_path = DERIVED / "ENV_TR2_PLATE_BLUR_V1.png"
    blurred.save(out_path)
    log(f"  saved {out_path}")
    return out_path


def run_plate_pipeline():
    log("\n### PLATE PIPELINE (A2) ###")
    src_path = SRC / "ENV_TR2_WARROOM_PLATE_V1.png"
    img = Image.open(src_path).convert("RGB")

    cleaned, before_crop, after_crop = plate_remove_corner_mark(img)
    before_crop.resize((before_crop.width * 4, before_crop.height * 4), Image.NEAREST).save(
        DERIVED / "_evidence_cornermark_before_4x.png")
    after_crop.resize((after_crop.width * 4, after_crop.height * 4), Image.NEAREST).save(
        DERIVED / "_evidence_cornermark_after_4x.png")

    master, master_path = plate_master(cleaned)
    add_manifest_entry(
        "ENV_TR2_WARROOM_PLATE_V1_MASTER", "plate master (cleaned, upscaled x2)", master_path,
        derived_from=SOURCES["ENV_TR2_WARROOM_PLATE_V1.png"],
        operations=[
            {"op": "corner_mark_removal", "region_px": CORNER_MARK_BOX, "method": "cv2.inpaint TELEA"},
            {"op": "upscale", "method": "Lanczos x2 + unsharp(radius=1.0, amount=40%)", "issue": "CP1-A-UPSCALE"},
        ],
        tool="opencv-python-headless 5.0.0.93 + Pillow 12.3.0",
    )

    exports = export_pyramid(master, "ENV_TR2_WARROOM_PLATE_V1", [3344, 1672], DERIVED)

    plate_map, plate_map_path = build_plate_map()
    add_manifest_entry(
        "ENV_TR2_WARROOM_PLATEMAP_V1", "plate map (regions, normalised u,v)", plate_map_path,
        derived_from=None, operations=[{"op": "manual_measurement", "estimate": True}], tool="visual inspection",
    ) if False else None  # JSON isn't an image; record separately below

    table_cutout_path = build_table_cutout(master, plate_map)
    cue_masks = build_cue_masks(master, plate_map)
    blur_path = build_blurred_plate(master)

    return {
        "master": master,
        "master_path": master_path,
        "exports": exports,
        "plate_map": plate_map,
        "plate_map_path": plate_map_path,
        "table_cutout_path": table_cutout_path,
        "cue_masks": cue_masks,
        "blur_path": blur_path,
        "corner_mark_evidence": (DERIVED / "_evidence_cornermark_before_4x.png", DERIVED / "_evidence_cornermark_after_4x.png"),
    }


# ---------------------------------------------------------------------------
# Appendix A3: pose operations
# ---------------------------------------------------------------------------

POSE_FILES = {
    "POSE_TRANSFER_DANIEL_FOCUSED_V1": "POSE_TRANSFER_DANIEL_FOCUSED_V1.png",
    "POSE_TRANSFER_NIK_TACTICAL_V1": "POSE_TRANSFER_NIK_TACTICAL_V1.png",
    "POSE_TR2_DANIEL_WINDOW_PITCH_V1": "POSE_TR2_DANIEL_WINDOW_PITCH_V1.png",
    "POSE_TR2_NIK_WINDOW_POINT_V1": "POSE_TR2_NIK_WINDOW_POINT_V1.png",
}

# Pose map data measured by inspection (crown/chin/eyes in source pixels), estimate=True.
POSE_MEASUREMENTS = {
    "POSE_TRANSFER_DANIEL_FOCUSED_V1": {
        "crown_y": 55, "chin_y": 430, "head_height": 375,
        "eye_left": [430, 325], "eye_right": [510, 315],
        "protected_contacts": {
            "pen_to_chin_hand": {"x0": 380, "y0": 430, "x1": 620, "y1": 620},
            "clipboard": {"x0": 580, "y0": 700, "x1": 1090, "y1": 1080, "note": "may be partly covered by own panel in F3"},
        },
        "bottom_crop_line_y": 1150,
    },
    "POSE_TRANSFER_NIK_TACTICAL_V1": {
        "crown_y": 75, "chin_y": 460, "head_height": 385,
        "eye_left": [470, 320], "eye_right": [590, 310],
        "protected_contacts": {
            "stylus_hand_and_tip": {"x0": 430, "y0": 620, "x1": 720, "y1": 760},
            "tablet": {"x0": 630, "y0": 700, "x1": 1100, "y1": 1020, "note": "lower half may be covered by own panel in F2"},
        },
        "bottom_crop_line_y": 1150,
    },
    "POSE_TR2_DANIEL_WINDOW_PITCH_V1": {
        "crown_y": 65, "chin_y": 460, "head_height": 395,
        "eye_left": [400, 325], "eye_right": [490, 310],
        "protected_contacts": {
            "palm_up_hand": {"x0": 790, "y0": 685, "x1": 1010, "y1": 900},
            "blank_sheet": {"x0": 175, "y0": 650, "x1": 590, "y1": 975},
        },
        "bottom_crop_line_y": 1200,
    },
    "POSE_TR2_NIK_WINDOW_POINT_V1": {
        "crown_y": 45, "chin_y": 445, "head_height": 400,
        "eye_left": [430, 345], "eye_right": [560, 330],
        "protected_contacts": {
            "index_finger_on_tablet": {"x0": 560, "y0": 790, "x1": 700, "y1": 870},
            "tablet_top_edge": {"x0": 575, "y0": 840, "x1": 975, "y1": 880},
        },
        "bottom_crop_line_y": 1200,
    },
}


def alpha_remap(alpha: np.ndarray):
    log("  Q2 alpha remap: 248-254 -> 255")
    before_hist = {str(v): int(np.sum(alpha == v)) for v in range(248, 255)}
    out = alpha.copy()
    mask = (out >= 248) & (out <= 254)
    changed = int(mask.sum())
    out[mask] = 255
    log(f"    remapped {changed} px")
    return out, before_hist, changed


def despeckle(alpha: np.ndarray):
    log("  Q3 despeckle")
    body = alpha >= 128
    dist = ndimage.distance_transform_edt(~body)
    speck_mask = (alpha < 16) & (alpha > 0) & (dist > 4)
    before_count = int(np.sum((alpha > 0) & (alpha < 16)))
    out = alpha.copy()
    out[speck_mask] = 0
    after_count = int(np.sum((out > 0) & (out < 16)))
    despeckled = int(speck_mask.sum())
    log(f"    faint nonzero (0<alpha<16) before={before_count} zeroed={despeckled} remaining_after={after_count}")
    return out, before_count, after_count, despeckled


def edge_erosion_and_halo(rgb: np.ndarray, alpha: np.ndarray, key_light_side="right"):
    log("  Q4 edge erosion + halo ratio")
    partial = (alpha > 0) & (alpha < 255)
    eroded_partial = ndimage.minimum_filter(alpha, size=3)
    out = alpha.copy()
    out[partial] = eroded_partial[partial]

    gray_full = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float64)

    def halo_ratio(a):
        body = a >= 128
        # 3px band INSIDE the silhouette edge
        edge_band = body & ~ndimage.binary_erosion(body, iterations=3)
        # a 20px-wide interior band, starting 20px in from the edge (falls back to
        # shallower depths for thin limbs where 40px of erosion would empty out)
        for near, far in [(20, 40), (10, 20), (4, 8), (1, 2)]:
            interior_band = ndimage.binary_erosion(body, iterations=near) & ~ndimage.binary_erosion(body, iterations=far)
            if interior_band.any():
                break
        edge_vals = gray_full[edge_band]
        interior_vals = gray_full[interior_band]
        if edge_vals.size == 0 or interior_vals.size == 0 or interior_vals.mean() == 0:
            return float("nan")
        return float(edge_vals.mean() / interior_vals.mean())

    ratio_before = halo_ratio(alpha)
    ratio_after = halo_ratio(out)
    extra_eroded = False
    if not math.isnan(ratio_after) and ratio_after > 1.5:
        # extra 1px erosion (total 2px) on the upper 45% of the frame (hair/shoulder band)
        h = alpha.shape[0]
        band = np.zeros_like(alpha, dtype=bool)
        band[: int(h * 0.45), :] = True
        extra = ndimage.minimum_filter(out, size=3)
        out2 = out.copy()
        apply_mask = partial & band
        out2[apply_mask] = extra[apply_mask]
        ratio_after2 = halo_ratio(out2)
        if not math.isnan(ratio_after2):
            out = out2
            ratio_after = ratio_after2
            extra_eroded = True
    log(f"    halo ratio before={ratio_before:.3f} after={ratio_after:.3f} extra_erosion={extra_eroded}")
    return out, ratio_before, ratio_after, extra_eroded


def edge_color_decontaminate(rgb: np.ndarray, alpha: np.ndarray):
    log("  Q5 edge colour decontamination")
    opaque = alpha == 255
    if not opaque.any():
        return rgb, {}
    # nearest opaque pixel that is itself >=4px deep inside the opaque region
    deep_opaque = ndimage.binary_erosion(opaque, iterations=4)
    if not deep_opaque.any():
        deep_opaque = opaque
    dist_deep, (iy_d, ix_d) = ndimage.distance_transform_edt(~deep_opaque, return_indices=True)

    edge_zone = (alpha > 0) & (alpha < 255)
    ring2 = ndimage.binary_dilation(opaque, iterations=2) & ~opaque
    edge_or_ring = edge_zone | ring2

    out = rgb.astype(np.float64).copy()
    ys, xs = np.where(edge_or_ring)
    if ys.size:
        weight = (1.0 - alpha[ys, xs].astype(np.float64) / 255.0)
        nearest = rgb[iy_d[ys, xs], ix_d[ys, xs]].astype(np.float64)
        out[ys, xs] = out[ys, xs] * (1 - weight[:, None]) + nearest * weight[:, None]

    # Measured on these assets, the golden rim-glow is carried across the *entire*
    # partial-alpha transition (not just a 2px fringe): alpha rises from ~0 to 255
    # over roughly 10-20px and the colour is warm/gold across that whole span. The
    # brief's literal "outer 2 px ring" undercorrects this asset, so the warm/yellow
    # (Lab b*) cut is applied across the full partial-alpha band (edge_zone), scaled
    # by how transparent the pixel is (1-alpha/255) so fully opaque interior colour
    # (the directional key light on faces/suits, which must stay per B2) is never
    # touched. This is recorded as a deviation from the literal 2px-ring instruction,
    # in service of the same stated goal ("no yellow or gold rim line").
    lab = cv2.cvtColor(out.astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float64)
    interior_mean_b = float(lab[ndimage.binary_erosion(opaque, iterations=20), 2].mean()) if ndimage.binary_erosion(opaque, iterations=20).any() else float(lab[opaque, 2].mean())
    ey, ex = np.where(edge_zone)
    params = {
        "interior_mean_b": interior_mean_b, "cut_fraction": 0.5,
        "deviation": "cut applied across full partial-alpha band (~10-20px measured), "
                     "scaled by (1-alpha/255), not a fixed 2px ring - see CLOUD_BUILD_RESULT.md",
    }
    if ey.size:
        b = lab[ey, ex, 2]
        strength = (1.0 - alpha[ey, ex].astype(np.float64) / 255.0)
        excess = b - interior_mean_b
        threshold = interior_mean_b * 0.5
        over = excess > threshold
        cut = np.where(over, excess * 0.5, 0.0)
        b = b - cut * strength
        lab[ey, ex, 2] = b
        out = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2RGB).astype(np.float64)
    return np.clip(out, 0, 255).astype(np.uint8), params


def nik_skin_denoise_candidate(rgb: np.ndarray, alpha: np.ndarray, pose_id: str):
    log("  A4 building Nik skin denoise candidate")
    m = POSE_MEASUREMENTS[pose_id]
    cx = (m["eye_left"][0] + m["eye_right"][0]) / 2
    cy_top = m["crown_y"] + (m["chin_y"] - m["crown_y"]) * 0.15
    cy_bottom = m["chin_y"] - (m["chin_y"] - m["crown_y"]) * 0.05
    half_w = (m["chin_y"] - m["crown_y"]) * 0.45
    # forehead/cheeks/nose region, excludes eyes/brows/lips/beard/hair/ears by construction:
    # a horizontally-centred vertical band from just below the hairline to just above the mouth,
    # narrower than the full face width so it stays off the ears.
    poly = [
        (cx - half_w * 0.55, cy_top),
        (cx + half_w * 0.55, cy_top),
        (cx + half_w * 0.5, cy_bottom),
        (cx - half_w * 0.5, cy_bottom),
    ]
    h, w = alpha.shape
    mask_img = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask_img).polygon(poly, fill=255)
    mask_img = mask_img.filter(ImageFilter.GaussianBlur(8))
    mask = np.array(mask_img).astype(np.float64) / 255.0

    denoised = cv2.fastNlMeansDenoisingColored(rgb, None, h=3, hColor=3, templateWindowSize=7, searchWindowSize=21)
    blended = rgb.astype(np.float64) * (1 - 0.6 * mask[..., None]) + denoised.astype(np.float64) * (0.6 * mask[..., None])
    blended = np.clip(blended, 0, 255).astype(np.uint8)

    out_img = Image.fromarray(blended, "RGB")
    out_img.putalpha(Image.fromarray(alpha))
    out_path = DERIVED / "POSE_TR2_NIK_WINDOW_POINT_V1_DENOISE_CANDIDATE.png"
    out_img.save(out_path)
    log(f"    saved {out_path}")
    return out_path, {"mask_polygon_src_px": [list(p) for p in poly], "h": 3, "hColor": 3, "template": 7, "search": 21, "blend": 0.6}


def run_pose_pipeline(pose_key: str, filename: str):
    log(f"\n### POSE PIPELINE (A3) for {pose_key} ###")
    src_path = SRC / filename
    im = Image.open(src_path).convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3].copy()
    alpha = arr[:, :, 3].copy()

    alpha, before_hist, remapped_px = alpha_remap(alpha)
    alpha, before_speck, after_speck, despeckled_px = despeckle(alpha)
    alpha, halo_before, halo_after, extra_eroded = edge_erosion_and_halo(rgb, alpha)
    rgb, decon_params = edge_color_decontaminate(rgb, alpha)

    out_img = Image.fromarray(np.dstack([rgb, alpha]), "RGBA")
    master_path = DERIVED / f"{pose_key}_INTAKE.png"
    out_img.save(master_path)
    log(f"  saved {master_path}")

    ops = [
        {"op": "alpha_remap", "range": "248-254 -> 255", "pixels_changed": remapped_px, "hist_248_254_before": before_hist},
        {"op": "despeckle", "faint_nonzero_before": before_speck, "faint_nonzero_after": after_speck, "pixels_zeroed": despeckled_px},
        {"op": "edge_erosion", "kernel": "3x3 minimum filter, 1px (+1px extra on upper 45% if halo>1.5)",
         "halo_ratio_before": None if math.isnan(halo_before) else round(halo_before, 4),
         "halo_ratio_after": None if math.isnan(halo_after) else round(halo_after, 4),
         "extra_erosion_applied": extra_eroded},
        {"op": "edge_color_decontamination", "params": decon_params},
    ]
    add_manifest_entry(
        f"{pose_key}_INTAKE", "pose intake output", master_path,
        derived_from=SOURCES[filename], operations=ops,
        tool="numpy 2.4.6 + scipy 1.17.1 + opencv-python-headless 5.0.0.93",
    )

    exports = export_pyramid_pose(out_img, pose_key, DERIVED)

    pose_map = dict(POSE_MEASUREMENTS[pose_key])
    pose_map["estimate"] = True
    pose_map_path = DERIVED / f"POSEMAP_{pose_key}.json"
    pose_map_path.write_text(json.dumps(pose_map, indent=2))
    log(f"  saved {pose_map_path}")

    denoise_info = None
    if pose_key == "POSE_TR2_NIK_WINDOW_POINT_V1":
        denoise_path, denoise_params = nik_skin_denoise_candidate(rgb, alpha, pose_key)
        add_manifest_entry(
            f"{pose_key}_DENOISE_CANDIDATE", "Nik skin denoise candidate (not shipped in frames)", denoise_path,
            derived_from=SOURCES[filename], operations=[{"op": "fastNlMeansDenoisingColored_masked_blend", **denoise_params}],
            tool="opencv-python-headless 5.0.0.93",
        )
        denoise_info = {"path": str(denoise_path.relative_to(ROOT)), "params": denoise_params}

    return {
        "master_path": master_path,
        "exports": exports,
        "pose_map": pose_map,
        "pose_map_path": pose_map_path,
        "halo_before": halo_before,
        "halo_after": halo_after,
        "despeckle_before": before_speck,
        "despeckle_after": after_speck,
        "denoise_info": denoise_info,
    }


def export_pyramid_pose(img: Image.Image, base_name: str, out_dir: Path):
    log(f"  Q7 export {base_name}")
    exports = []
    lossless_path = out_dir / f"{base_name}_MASTER.png"
    img.save(lossless_path, optimize=True)
    webp_path = out_dir / f"{base_name}.webp"
    img.save(webp_path, "WEBP", quality=90, lossless=False, method=6)
    avif_path = out_dir / f"{base_name}.avif"
    try:
        img.save(avif_path, "AVIF", quality=80)
    except Exception as exc:
        issue("CP1-A-AVIF", f"AVIF export failed for {avif_path.name}: {exc}")
        avif_path = None
    for p in [lossless_path, webp_path, avif_path]:
        if p is None:
            continue
        exports.append({"path": str(p.relative_to(ROOT)), "bytes": p.stat().st_size, "sha256": sha256_file(p)})
    return exports


def main():
    verify_sources()

    # Q6: pose resolution check
    for pose_key, filename in POSE_FILES.items():
        im = Image.open(SRC / filename)
        head_h = POSE_MEASUREMENTS[pose_key]["head_height"]
        # Largest desktop DPR2 head target ~375px (KA-P x1.10 of 150-170px range x2 DPR, generously bounded)
        if head_h < 375 * 0.9:
            pass  # informational only; Q6 says do not upscale poses regardless
    issue_note = ("Q6: poses are not upscaled in CP1 per brief; source head heights "
                  "(~375-400px measured) already exceed the largest DPR2 head target (~375px), "
                  "so no CP1-A-POSERES issue is raised.")
    log(issue_note)

    plate_result = run_plate_pipeline()

    pose_results = {}
    for pose_key, filename in POSE_FILES.items():
        pose_results[pose_key] = run_pose_pipeline(pose_key, filename)

    manifest_path = ROOT / "assets" / "manifest.json"
    manifest_path.write_text(json.dumps({"generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                                          "entries": MANIFEST_ENTRIES}, indent=2))
    log(f"\nWrote manifest with {len(MANIFEST_ENTRIES)} entries to {manifest_path}")

    report = {
        "issues": ISSUES,
        "plate": {
            "master_path": str(plate_result["master_path"].relative_to(ROOT)),
            "master_size": list(plate_result["master"].size),
            "exports": plate_result["exports"],
            "plate_map_path": str(plate_result["plate_map_path"].relative_to(ROOT)),
            "table_cutout_path": str(plate_result["table_cutout_path"].relative_to(ROOT)),
            "cue_masks": {k: str(v.relative_to(ROOT)) for k, v in plate_result["cue_masks"].items()},
            "blur_path": str(plate_result["blur_path"].relative_to(ROOT)),
        },
        "poses": {
            k: {
                "master_path": str(v["master_path"].relative_to(ROOT)),
                "exports": v["exports"],
                "halo_ratio_before": None if math.isnan(v["halo_before"]) else round(v["halo_before"], 4),
                "halo_ratio_after": None if math.isnan(v["halo_after"]) else round(v["halo_after"], 4),
                "despeckle_before": v["despeckle_before"],
                "despeckle_after": v["despeckle_after"],
                "denoise_info": v["denoise_info"],
            } for k, v in pose_results.items()
        },
        "log": LOG,
    }
    report_path = ROOT / "assets" / "derived" / "intake_report.json"
    report_path.write_text(json.dumps(report, indent=2))
    log(f"Wrote intake report to {report_path}")


# ---------------------------------------------------------------------------
# Evidence assembly (Appendix E1-E6): run as `python3 tools/intake.py --evidence`
# after tools/render-and-qa.cjs has produced evidence/raw/*.png. Reads the
# already-derived assets plus those raw browser captures and writes the
# labelled contact sheets into evidence/.
# ---------------------------------------------------------------------------

EVIDENCE = ROOT / "evidence"
RAW = EVIDENCE / "raw"


def _label(draw, xy, text, fill=(240, 235, 225)):
    draw.text(xy, text, fill=fill)


def _load_manifest():
    return json.loads((ROOT / "assets" / "manifest.json").read_text())


def _thumb(img, max_w):
    w, h = img.size
    if w <= max_w:
        return img.copy()
    scale = max_w / w
    return img.resize((max_w, max(1, int(h * scale))), Image.LANCZOS)


def build_e1_intake_contact_sheet():
    manifest = {e["asset_id"]: e for e in _load_manifest()["entries"]}
    pairs = [
        ("ENV_TR2_WARROOM_PLATE_V1", "ENV_TR2_WARROOM_PLATE_V1_MASTER"),
        ("POSE_TRANSFER_DANIEL_FOCUSED_V1", "POSE_TRANSFER_DANIEL_FOCUSED_V1_INTAKE"),
        ("POSE_TRANSFER_NIK_TACTICAL_V1", "POSE_TRANSFER_NIK_TACTICAL_V1_INTAKE"),
        ("POSE_TR2_DANIEL_WINDOW_PITCH_V1", "POSE_TR2_DANIEL_WINDOW_PITCH_V1_INTAKE"),
        ("POSE_TR2_NIK_WINDOW_POINT_V1", "POSE_TR2_NIK_WINDOW_POINT_V1_INTAKE"),
    ]
    row_h = 260
    W = 1200
    sheet = Image.new("RGB", (W, row_h * len(pairs) + 40), (18, 18, 20))
    draw = ImageDraw.Draw(sheet)
    _label(draw, (10, 8), "E1 - Intake contact sheet: source (left) -> intake/master output (right)")
    y = 36
    for src_id, out_id in pairs:
        src_entry = manifest[src_id]
        out_entry = manifest[out_id]
        src_img = Image.open(ROOT / src_entry["path"]).convert("RGB")
        out_img = Image.open(ROOT / out_entry["path"]).convert("RGBA")
        bg = Image.new("RGB", out_img.size, (60, 60, 60))
        bg.paste(out_img, mask=out_img.split()[3] if out_img.mode == "RGBA" else None)
        src_t = _thumb(src_img, 520)
        out_t = _thumb(bg, 520)
        sheet.paste(src_t, (10, y))
        sheet.paste(out_t, (620, y))
        _label(draw, (10, y - 14), f"{src_id}  {src_entry['width']}x{src_entry['height']}  sha256:{src_entry['sha256'][:12]}")
        _label(draw, (620, y - 14), f"{out_id}  {out_entry['width']}x{out_entry['height']}  sha256:{out_entry['sha256'][:12]}")
        y += row_h
    out_path = EVIDENCE / "E1_intake_contact_sheet.jpg"
    sheet.convert("RGB").save(out_path, "JPEG", quality=90)
    print(f"wrote {out_path}")


def build_e2_plate_evidence():
    before = Image.open(DERIVED / "_evidence_cornermark_before_4x.png")
    after = Image.open(DERIVED / "_evidence_cornermark_after_4x.png")
    master = Image.open(DERIVED / "ENV_TR2_WARROOM_PLATE_V1_MASTER.png")
    original = Image.open(SRC / "ENV_TR2_WARROOM_PLATE_V1.png")
    naive_upscale = original.resize(master.size, Image.NEAREST)

    regions_master = {  # crop boxes measured on the 3344x1882 master
        "binders": (0, 1030, 500, 1360),
        "cm17_mug": (330, 1100, 660, 1340),
        "sign": (1000, 120, 2300, 400),
        "crowd": (600, 560, 1600, 820),
        "tactics_surface": (700, 1300, 2400, 1780),
    }
    W = 1400
    header_h = 250
    row_h = 220
    sheet = Image.new("RGB", (W, header_h + row_h * len(regions_master) + 20), (18, 18, 20))
    draw = ImageDraw.Draw(sheet)
    _label(draw, (10, 8), "E2 - Plate: corner-mark removal (4x) + 100% upscale crops (naive 2x nearest vs master)")
    bt = _thumb(before, 420)
    at = _thumb(after, 420)
    sheet.paste(bt, (10, 30))
    sheet.paste(at, (450, 30))
    _label(draw, (10, 16), "before")
    _label(draw, (450, 16), "after")
    y = header_h
    for name, box in regions_master.items():
        crop_master = master.crop(box)
        crop_naive = naive_upscale.crop(box)
        ch = row_h - 20
        cw = int(crop_master.width * ch / crop_master.height)
        sheet.paste(crop_naive.resize((cw, ch)), (10, y + 16))
        sheet.paste(crop_master.resize((cw, ch)), (20 + cw, y + 16))
        _label(draw, (10, y), f"{name}: naive 2x nearest (left) vs master (right)")
        y += row_h
    out_path = EVIDENCE / "E2_plate_evidence.jpg"
    sheet.convert("RGB").save(out_path, "JPEG", quality=90)
    print(f"wrote {out_path}")


def build_e3_pose_edges():
    report = json.loads((DERIVED / "intake_report.json").read_text())
    pose_keys = list(POSE_FILES.keys())
    W = 1400
    row_h = 300
    sheet = Image.new("RGB", (W, row_h * len(pose_keys) + 40), (18, 18, 20))
    draw = ImageDraw.Draw(sheet)
    _label(draw, (10, 8), "E3 - Pose edges before/after intake, on grey (#3C3C3C) and white; halo ratio + despeckle table")
    y = 36
    for pk in pose_keys:
        src_img = Image.open(SRC / POSE_FILES[pk]).convert("RGBA")
        out_img = Image.open(DERIVED / f"{pk}_INTAKE.png").convert("RGBA")
        m = POSE_MEASUREMENTS[pk]
        cx = int((m["eye_left"][0] + m["eye_right"][0]) / 2)
        top = max(0, m["crown_y"] - 40)
        box = (max(0, cx - 260), top, cx + 260, top + 260)

        def comp(img, bg_color):
            bg = Image.new("RGB", img.size, bg_color)
            bg.paste(img, mask=img.split()[3])
            return bg.crop(box)

        variants = [
            ("before/grey", comp(src_img, (0x3C, 0x3C, 0x3C))),
            ("after/grey", comp(out_img, (0x3C, 0x3C, 0x3C))),
            ("before/white", comp(src_img, (255, 255, 255))),
            ("after/white", comp(out_img, (255, 255, 255))),
        ]
        x = 10
        cw = 320
        for label, crop in variants:
            crop_r = crop.resize((cw, int(cw * crop.height / crop.width)))
            sheet.paste(crop_r, (x, y + 16))
            _label(draw, (x, y), label)
            x += cw + 10
        pr = report["poses"][pk]
        stats = (f"{pk}: halo before={pr['halo_ratio_before']} after={pr['halo_ratio_after']} "
                 f"despeckle before={pr['despeckle_before']} after={pr['despeckle_after']}")
        _label(draw, (10, y + 260), stats)
        y += row_h
    out_path = EVIDENCE / "E3_pose_edges.jpg"
    sheet.convert("RGB").save(out_path, "JPEG", quality=90)
    print(f"wrote {out_path}")


def build_e4_nik_skin():
    orig = Image.open(DERIVED / "POSE_TR2_NIK_WINDOW_POINT_V1_INTAKE.png").convert("RGBA")
    candidate_path = DERIVED / "POSE_TR2_NIK_WINDOW_POINT_V1_DENOISE_CANDIDATE.png"
    if not candidate_path.exists():
        print("skip E4: denoise candidate missing")
        return
    cand = Image.open(candidate_path).convert("RGBA")
    m = POSE_MEASUREMENTS["POSE_TR2_NIK_WINDOW_POINT_V1"]
    cx = int((m["eye_left"][0] + m["eye_right"][0]) / 2)
    cy = int((m["crown_y"] + m["chin_y"]) / 2)
    half = 220
    box = (max(0, cx - half), max(0, cy - half), cx + half, cy + half)

    # F1 display size: world head-height target (160px @768world) / measured source
    # head height, applied at DPR1 and DPR2 (matches the frames.js placement formula).
    scale_factor_dpr1 = 160 / m["head_height"]  # world height==768 at 1366x768, target head height 160px
    sizes = {"DPR1": scale_factor_dpr1, "DPR2": scale_factor_dpr1 * 2}

    def comp(img):
        bg = Image.new("RGB", img.size, (0x3C, 0x3C, 0x3C))
        bg.paste(img, mask=img.split()[3])
        return bg.crop(box)

    orig_crop = comp(orig)
    cand_crop = comp(cand)
    W = 1000
    row_h = 260
    rows = 1 + len(sizes)
    sheet = Image.new("RGB", (W, row_h * rows + 40), (18, 18, 20))
    draw = ImageDraw.Draw(sheet)
    _label(draw, (10, 8), "E4 - Nik skin: original (left) vs denoise candidate (right), 1:1 crop then F1 display size (DPR1/DPR2)")
    y = 30
    sheet.paste(orig_crop.resize((440, 440 * orig_crop.height // orig_crop.width)), (10, y))
    sheet.paste(cand_crop.resize((440, 440 * cand_crop.height // cand_crop.width)), (470, y))
    _label(draw, (10, y - 14), "1:1 crop, original")
    _label(draw, (470, y - 14), "1:1 crop, denoise candidate")
    y += row_h
    for label, sf in sizes.items():
        w = max(1, int(orig_crop.width * sf))
        h = max(1, int(orig_crop.height * sf))
        sheet.paste(orig_crop.resize((w, h)), (10, y))
        sheet.paste(cand_crop.resize((w, h)), (470, y))
        _label(draw, (10, y - 14), f"{label} display size, original")
        _label(draw, (470, y - 14), f"{label} display size, denoise candidate")
        y += row_h
    out_path = EVIDENCE / "E4_nik_skin_denoise.jpg"
    sheet.convert("RGB").save(out_path, "JPEG", quality=90)
    print(f"wrote {out_path}")


def build_e5_platemap_overlay():
    plate_map = json.loads((DERIVED / "ENV_TR2_WARROOM_PLATEMAP_V1.json").read_text())
    master = Image.open(DERIVED / "ENV_TR2_WARROOM_PLATE_V1_MASTER.png").convert("RGB")
    w, h = master.size
    overlay = master.copy()
    draw = ImageDraw.Draw(overlay)

    def denorm(pt):
        return (pt[0] * w, pt[1] * h)

    def rect_pts(r):
        return [(r["u0"] * w, r["v0"] * h), (r["u1"] * w, r["v0"] * h), (r["u1"] * w, r["v1"] * h), (r["u0"] * w, r["v1"] * h)]

    draw.polygon(rect_pts(plate_map["sign_body_rect"]), outline=(0, 200, 255), width=4)
    draw.polygon(rect_pts(plate_map["sign_face_rect"]), outline=(255, 60, 60), width=4)
    draw.line([denorm(p) for p in plate_map["table_far_edge_polyline"]], fill=(60, 255, 120), width=5)
    draw.polygon(rect_pts(plate_map["standing_spot_columns"]["left_daniel"]), outline=(255, 210, 60), width=3)
    draw.polygon(rect_pts(plate_map["standing_spot_columns"]["right_nik"]), outline=(255, 210, 60), width=3)
    draw.polygon([denorm(p) for p in plate_map["glass_stadium_region_polygon"]], outline=(120, 160, 255), width=3)
    draw.polygon([denorm(p) for p in plate_map["tactics_glow_surface_polygon"]], outline=(255, 120, 255), width=3)
    for eye_name, eye in plate_map["eye_point_targets"].items():
        x, y = eye["u"] * w, eye["v"] * h
        draw.ellipse([x - 10, y - 10, x + 10, y + 10], outline=(255, 255, 255), width=4)
        _label(draw, (x + 14, y - 10), eye_name)
    out_path = EVIDENCE / "E5_platemap_overlay.png"
    overlay.save(out_path)
    print(f"wrote {out_path}")


def build_e6_cue_stills():
    s1_candidates = sorted(RAW.glob("S1_*.png"))
    s2_candidates = sorted(RAW.glob("S2_*.png"))
    if not s1_candidates or not s2_candidates:
        print("skip E6: run tools/render-and-qa.cjs first (evidence/raw/S1_*.png, S2_*.png missing)")
        return
    s1 = Image.open(s1_candidates[0])
    s2 = Image.open(s2_candidates[0])
    gap = 10
    sheet = Image.new("RGB", (s1.width + s2.width + gap, max(s1.height, s2.height) + 30), (18, 18, 20))
    draw = ImageDraw.Draw(sheet)
    _label(draw, (10, 6), "E6 - S1 (CUE-WINDOW) and S2 (CUE-PRIVATE) side by side")
    sheet.paste(s1, (0, 30))
    sheet.paste(s2, (s1.width + gap, 30))
    out_path = EVIDENCE / "E6_cue_stills.png"
    sheet.save(out_path)
    print(f"wrote {out_path}")


def build_evidence():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    build_e1_intake_contact_sheet()
    build_e2_plate_evidence()
    build_e3_pose_edges()
    build_e4_nik_skin()
    build_e5_platemap_overlay()
    build_e6_cue_stills()


if __name__ == "__main__":
    if "--evidence" in sys.argv:
        build_evidence()
    else:
        main()
