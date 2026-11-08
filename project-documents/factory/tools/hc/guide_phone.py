"""HC phone guides: put the approved men cut-outs on one phone grid (1024x1536), cyan everywhere else.
python3 project-documents/factory/tools/hc/guide_phone.py DANIEL.webp NIK.webp OUT.png
Grid: hair top at 16% height, lip (cut line) at 50%, Nik in front of Daniel's right shoulder, the phone crop is the centre 864 px (x 80-944)."""
import sys, json
import cv2, numpy as np
from PIL import Image
W, H = 1024, 1536
TOP, LIP, S = round(H * 0.16), round(H * 0.50), 0.90
def solid(im):
    """Keep only the biggest piece of the cut-out (drops loose bits floating next to it)."""
    a = np.asarray(im).copy()
    k, lab, st, _ = cv2.connectedComponentsWithStats((a[:, :, 3] > 40).astype(np.uint8), 8)
    big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    keep = cv2.dilate((lab == big).astype(np.uint8), np.ones((3, 3), np.uint8))
    a[:, :, 3] = a[:, :, 3] * keep
    return Image.fromarray(a)


d, n = solid(Image.open(sys.argv[1]).convert("RGBA")), solid(Image.open(sys.argv[2]).convert("RGBA"))
DX_OVER, NIK_L = 340, 72          # Daniel x where Nik's left edge sits; Nik's alpha starts at x 72
span = (DX_OVER - NIK_L) * S + n.getbbox()[2] * S - 6   # alpha right edge, 6 px past the crop
# Nik's cut right edge sits on the phone crop edge (x 944), so it is never seen
x0 = round(944 - span); y0 = TOP - round(10 * S)
c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
for im, x in ((d, x0), (n, x0 + round((DX_OVER - NIK_L) * S))):
    im = im.resize((round(im.width * S), round(im.height * S)), Image.LANCZOS)
    c.alpha_composite(im, (x, y0))
# close the small cyan gaps between the two men (Nik's shoulder, Daniel's lapel) with coat pixels
A = np.asarray(c).copy()
A[:LIP][A[:LIP, :, 3] == 0] = 0
men = (A[:, :, 3] > 200).astype(np.uint8)
closed = cv2.morphologyEx(men, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
closed[LIP:] = 0
NECK = TOP + round(H * 0.15)            # above this (heads, hair) the cut-outs stay exactly as they are
closed[:NECK] = men[:NECK]
gap = (closed & (1 - men)).astype(np.uint8)
unk = ((gap > 0) | ((A[:, :, 3] > 0) & (A[:, :, 3] <= 200) & (closed > 0))).astype(np.uint8)
rgb = cv2.inpaint(np.ascontiguousarray(A[:, :, :3]), unk * 255, 9, cv2.INPAINT_TELEA)
a = np.where(closed > 0, 1.0, A[:, :, 3] / 255.0)[:, :, None]
rgb = (rgb * a + np.array([0, 255, 255]) * (1 - a)).astype(np.uint8)
c = Image.fromarray(rgb)
c.paste((0, 255, 255), (0, LIP, W, H))     # below the lip is all cyan
c.save(sys.argv[3])
json.dump({"W": W, "H": H, "top": TOP, "lip": LIP, "scale": S, "daniel_x": x0, "nik_x": x0 + round((DX_OVER - NIK_L) * S), "y": y0},
          open(sys.argv[3].replace(".png", ".json"), "w"), indent=1)
print("ok", x0, y0)
