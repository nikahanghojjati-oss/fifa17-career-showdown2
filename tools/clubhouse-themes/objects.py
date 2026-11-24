#!/usr/bin/env python3
"""R99-01 clubhouse themes, objects (Nik 2026-11-23 19:46 UTC): "coloring goes only to background and objects should have their
own coloring". The theme recolours the room itself (walls, wood panels, floor, desk top, door, stairs); every object in the room
keeps its own colours: balls, scarves, coats, sofa and armchairs, books and papers, lamps, trophies, pennants, the rug, the bag,
the boots, the decanter, the olive tree, the brass rails.

Each room composition lists its objects as boxes in percent of the picture (left, top, right, bottom). A "sam" box is cut to the
object's own outline with the Segment Anything model (rembg's "sam" session: one image encode, one decode per box); a "box"
object (a display niche, a glass cabinet, a brass rail) keeps the whole box; a "cutout" box (a group of furniture, a plant
with thin leaves) is cut out with rembg's isnet-general-use model on that part of the picture; "leaves" keeps the green of a
plant inside its box. The masks are made once and kept in
masks/objects/<composition>.png, like the hero masks:

  python3 tools/clubhouse-themes/objects.py            # every composition
  python3 tools/clubhouse-themes/objects.py ENV_HOME_PLATE_HC_V3 ...

Needs rembg (sam), Pillow, numpy. build.py reads the masks; it needs only Pillow and numpy.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "visual-assets", "v10_1", "plates-hc")
LOADING = os.path.join(ROOT, "assets", "loading")
OUT = os.path.join(os.path.dirname(__file__), "masks", "objects")

def rail(top, bottom):
    return ("box", (0, top, 100, bottom))

# Display cases and stands follow the clubhouse (Nik 2026-11-23 21:45 UTC: "objects that are in wooden stand and display needs
# color matching of its display and stand with club house theme"): only what stands in a case is an object, never the case,
# its shelves or the table under a lamp.
CABINET = ("sam", (88.2, 22, 90.8, 33.8)), ("sam", (93.5, 30.7, 95.9, 33.8)), ("sam", (95.4, 28.3, 97.8, 33.8))

OBJECTS = {
    # the loading screen's tunnel (assets/loading, Reus stands in front of it as his own picture): the wall lamp
    "ENV_LOADING_PLATE_HC": [("sam", (92.5, 6, 98.2, 18.5))],
    "ENV_ARCHIVE_PLATE_HC_V3": [("sam", (3.5, 19.5, 9, 29.5)), ("sam", (90.4, 22.3, 93.5, 29.2)), rail(54.6, 57)],
    "ENV_ARCHIVE_PHONE_HC_V3": [("sam", (1.5, 25, 5.5, 33)), ("sam", (94, 27, 98.5, 32)), rail(49.8, 51.3)],
    "ENV_BOARD_PLATE_HC_V3": [("sam", (6.5, 11.5, 12.5, 29)), ("sam", (89.5, 44, 93.5, 47.5)), rail(73.6, 75.4)],
    "ENV_BOARD_PHONE_HC_V3": [("sam", (0, 20.5, 7.5, 31)), ("sam", (95, 40.8, 100, 42.4)), rail(52.1, 53.5)],
    "ENV_BOX_PLATE_HC_V3": [("sam", (1.5, 17, 7.5, 40.5)), ("sam", (7.5, 17, 12.5, 37.5)), *CABINET, rail(74.7, 76.6)],
    "ENV_BOX_PLATE_HC_V4": [("sam", (1.5, 17, 7.5, 40.5)), ("sam", (7.5, 17, 12, 35.5)), *CABINET, rail(74.7, 76.6)],
    "ENV_BOX_PHONE_HC_V3": [rail(57.7, 59.3)],
    "ENV_BOX_PHONE_HC_V3_TALL": [rail(45.9, 47.6)],
    "ENV_BOX_PHONE_HC_V4": [rail(57.7, 59.6)],
    "ENV_BOX_PHONE_HC_V4_TALL": [rail(45.9, 47.6)],
    "ENV_BOX_SIDEWAYS_HC_V4": [("sam", (1, 15, 7.5, 41.5)), ("sam", (7.5, 15, 12.5, 37.5)), ("sam", (88.1, 20.6, 90.7, 34.2)), ("sam", (93, 31.6, 95.2, 34.5)), ("sam", (95, 29.2, 97.2, 34.5)), rail(80.3, 82.6)],
    "ENV_CLUB_PLATE_HC_V3": [("sam", (3.5, 7.5, 8.5, 21.5)), ("sam", (91.5, 7.5, 96.5, 21.5)), ("sam", (2.5, 23.5, 10.5, 47.5)), ("sam", (89.5, 23.5, 97.5, 47.5)),
                             ("sam", (1.5, 49.5, 6.5, 60)), ("sam", (5, 52.5, 8.5, 60)), ("sam", (7, 54, 11.5, 60)), ("sam", (89.5, 54, 93.5, 60)), ("sam", (93, 49.5, 98, 60)),
                             ("cutout", (30, 44, 70, 63))],
    "ENV_CLUB_PHONE_HC_V3": [("sam", (2.5, 10, 11, 18.5)), ("sam", (89, 10, 97.5, 18.5)), ("sam", (1.5, 19.5, 12, 36)), ("sam", (88, 19.5, 98.5, 36)),
                             ("cutout", (0.5, 43, 13.5, 50.4)), ("cutout", (86.5, 43, 99.5, 50.4)), ("cutout", (19, 41.5, 81, 53))],
    "ENV_CLUB_PHONE_HC_V4": [("sam", (8.5, 1, 19.5, 12.5)), ("sam", (79.5, 1, 91, 12.5)), ("sam", (19.5, 12.3, 36.5, 16.6)), ("sam", (63, 12.3, 80.5, 16.6)),
                             ("sam", (11.5, 91, 20, 98)), ("sam", (20, 89.5, 32, 98.5)), ("sam", (67, 89.5, 78.5, 98.5)), ("sam", (78, 91, 89, 98))],
    "ENV_CLUB_SIDEWAYS_HC_V4": [("sam", (59, 0, 63.5, 13)), ("sam", (92, 0, 96.5, 13)), ("sam", (89, 16, 97.5, 47)), ("sam", (85, 71, 91.5, 86.5)), ("sam", (90.5, 75, 95.5, 85.5)),
                                ("cutout", (8.5, 59, 48, 84))],
    "ENV_COACHES_PLATE_HC_V3": [("sam", (1.5, 7.5, 13.5, 15.5)), ("sam", (13.5, 12, 19.5, 15)), ("sam", (84, 5.3, 92.5, 21.8)), ("sam", (0, 28, 3.5, 37.5)),
                                ("sam", (24, 49.5, 33.5, 56)), rail(61.8, 64.2)],
    "ENV_COACHES_PHONE_HC_V3": [("sam", (0, 7.5, 20.5, 13.2)), ("sam", (15.5, 17.5, 22, 24)), rail(38.6, 40)],
    "ENV_COACHES_PHONE_HC_V3_TALL": [("sam", (0, 5.8, 20.5, 10.2)), ("sam", (15.5, 14, 22, 19.2)), rail(30.7, 31.8)],
    "ENV_HALL_PLATE_HC_V3": [("sam", (0, 49.5, 6.5, 59.5)), ("sam", (31.5, 35, 39.5, 47.5)), ("sam", (37, 64.5, 63.5, 87)),
                             ("sam", (93, 4.5, 98.5, 20)), ("sam", (48, 36.5, 51.5, 43)), rail(89.3, 91)],
    "ENV_HALL_PHONE_HC_V3": [("sam", (31, 38.5, 40, 47)), ("sam", (97, 22.5, 100, 27.8)), ("sam", (49.5, 39.5, 55.5, 43.8)), rail(66.9, 68.4)],
    "ENV_HALL_PHONE_HC_V3_TALL": [("sam", (31, 30.5, 40, 37.5)), ("sam", (97, 19, 100, 22.6)), ("sam", (49.5, 32, 55.5, 35.2)), rail(53.7, 55.1)],
    "ENV_HOME_PLATE_HC_V3": [("sam", (7.5, 48, 12.5, 59)), ("sam", (13, 53.5, 19.8, 59)), ("cutout", (0, 46.3, 29.2, 92.6)), ("sam", (83, 22, 88.5, 38.5))],
    "ENV_HOME_PHONE_HC_V3": [("sam", (73, 21.5, 80, 29)), rail(49.7, 51.5)],
    "ENV_OFFICE_PLATE_HC_V3": [("sam", (0, 43.5, 10.8, 63.5)), ("sam", (4.5, 62, 15, 72.5), [(8, 66), (12.5, 66)]), ("sam", (0, 70.5, 16, 91)), ("sam", (16.5, 58.5, 45.8, 67.2)), ("sam", (51.4, 58.5, 84, 67.2)),
                               ("cutout", (81, 0, 99, 52)), ("sam", (89, 19.5, 100, 66.5))],
    "ENV_OFFICE_PHONE_HC_V3": [("sam", (0, 26.5, 2.8, 34.5)), ("sam", (95.3, 19.8, 100, 34.5)), ("sam", (4.5, 35.8, 46, 40.8)), ("sam", (53, 35.8, 95.5, 40.8))],
    "ENV_TUNNEL_PLATE_HC_V3": [("sam", (92.5, 7, 97.8, 24.5)), ("sam", (0, 64, 9.5, 72.5)), ("sam", (29.5, 50.5, 42.5, 58.5)), ("sam", (58.5, 50.5, 66.5, 56.5))],
    "ENV_TUNNEL_PHONE_HC_V3": [rail(49.5, 50.8)],
}

SIZE_SUFFIXES = ("_590W", "_1X", "_2X", "_1920")

def composition(name):
    """ENV_HOME_PLATE_HC_V3_1920 -> ENV_HOME_PLATE_HC_V3 (every size of one composition shares its object mask)."""
    for suffix in SIZE_SUFFIXES:
        if name.endswith(suffix):
            return name[: -len(suffix)]
    return name

def reference(comp):
    """The plate a composition's mask is drawn on: its biggest single-size file."""
    for folder in (SRC, LOADING):
        for suffix in ("_1920", "_1X", ""):
            path = os.path.join(folder, comp + suffix + ".webp")
            if os.path.exists(path):
                return path
    raise FileNotFoundError(comp)

class Sam:
    def __init__(self):
        from rembg import new_session
        self.s = new_session("sam")
        import rembg.sessions.sam as m
        self.m = m

    def masks(self, img, boxes):
        m, s = self.m, self.s
        input_size, target = (684, 1024), 1024
        cv = np.array(img.convert("RGB"))
        h, w = cv.shape[:2]
        scale = min(input_size[1] / w, input_size[0] / h)
        T = np.array([[scale, 0, 0], [0, scale, 0], [0, 0, 1]])
        warped = m.warp_affine(cv, T[:2], (input_size[0], input_size[1]))
        emb = s.encoder.run(None, {s.encoder.get_inputs()[0].name: warped.astype(np.float32)})[0]
        out = []
        for (x1, y1, x2, y2), inside in boxes:
            pts = np.array([[x1, y1], [x2, y2]] + [list(p) for p in inside] + [[0.0, 0.0]])[None, :, :]
            lab = np.array([[2, 3] + [1] * len(inside) + [-1]], np.float32)
            pts = m.apply_coords(pts, input_size, target).astype(np.float32)
            pts = np.concatenate([pts, np.ones((1, pts.shape[1], 1), np.float32)], axis=2)
            pts = np.matmul(pts, T.T)[:, :, :2].astype(np.float32)
            res = s.decoder.run(None, {"image_embeddings": emb, "point_coords": pts, "point_labels": lab,
                                       "mask_input": np.zeros((1, 1, 256, 256), np.float32), "has_mask_input": np.zeros(1, np.float32),
                                       "orig_im_size": np.array(input_size, np.float32)})[0]
            mk = m.transform_masks(res, (h, w), np.linalg.inv(T))[0]
            one = mk.max(0) > 0
            # an object has no holes (SAM at 1024 px leaves some in a ball's panels or a cup's body)
            from scipy import ndimage
            one = ndimage.binary_fill_holes(ndimage.binary_closing(one, iterations=2))
            # never far outside its box: a box drawn a little tight must not cut the object (Nik 2026-11-23 21:45 UTC: the
            # top of Transfer War's ball took the room's colour), so the outline may run a quarter of the box past it, but
            # only as the same piece that is inside the box
            mx, my = int(0.01 * w + 0.25 * (x2 - x1)), int(0.01 * h + 0.25 * (y2 - y1))
            keep = np.zeros(one.shape, bool)
            keep[max(0, int(y1) - my): int(y2) + my, max(0, int(x1) - mx): int(x2) + mx] = True
            lab, _ = ndimage.label(one & keep)
            inbox = np.unique(lab[int(y1): int(y2) + 1, int(x1): int(x2) + 1])
            one = np.isin(lab, inbox[inbox > 0])
            out.append(one.astype(np.uint8) * 255)
        return out

_cut = None
def cutout(img, box):
    """Soft cut-out (0-255) of what stands in front of the wall inside the box."""
    global _cut
    from rembg import new_session, remove
    if _cut is None:
        _cut = new_session("isnet-general-use")
    x1, y1, x2, y2 = [int(round(v)) for v in box]
    return np.asarray(remove(img.crop((x1, y1, x2, y2)), session=_cut, only_mask=True), np.uint8)

def make(comp, sam):
    img = Image.open(reference(comp)).convert("RGB")
    w, h = img.size
    total = np.zeros((h, w), np.uint8)
    sam_boxes, plain, leaves = [], [], []
    for spec in OBJECTS.get(comp, []):
        kind, (a, b, c, d) = spec[0], spec[1]
        px = (a * w / 100, b * h / 100, c * w / 100, d * h / 100)
        inside = [(x * w / 100, y * h / 100) for x, y in (spec[2] if len(spec) > 2 else [])]
        if kind == "sam":
            sam_boxes.append((px, inside))
        elif kind == "leaves":
            leaves.append(px)
        elif kind == "cutout":
            x1, y1, x2, y2 = [int(round(v)) for v in px]
            sub = total[y1:y2, x1:x2]
            np.maximum(sub, cutout(img, px)[: sub.shape[0], : sub.shape[1]], out=sub)
        else:
            plain.append(px)
    for (x1, y1, x2, y2) in plain:
        total[int(y1): int(y2) + 1, int(x1): int(x2) + 1] = 255
    # a plant: its leaves are thin, so inside its box it is every green pixel (olive green, low saturation)
    a = np.asarray(img).astype(np.float32) / 255
    for (x1, y1, x2, y2) in leaves:
        crop = a[int(y1): int(y2), int(x1): int(x2)]
        r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]
        mx, mn = crop.max(-1), crop.min(-1)
        green = (g >= r * 0.92) & (g > b * 1.08) & ((mx - mn) > 0.035) & (mx > 0.06)
        from scipy import ndimage
        green = ndimage.binary_dilation(ndimage.binary_opening(green), iterations=1)
        sub = total[int(y1): int(y2), int(x1): int(x2)]
        sub[green] = 255
    if sam_boxes:
        for one in sam.masks(img, sam_boxes):
            total = np.maximum(total, one)
    os.makedirs(OUT, exist_ok=True)
    Image.fromarray(total).filter(ImageFilter.GaussianBlur(max(1, w / 1400))).save(os.path.join(OUT, comp + ".png"), optimize=True)
    print("objects", comp, len(OBJECTS.get(comp, [])))

if __name__ == "__main__":
    names = sys.argv[1:] or sorted(OBJECTS)
    sam = Sam()
    for n in names:
        make(n, sam)
