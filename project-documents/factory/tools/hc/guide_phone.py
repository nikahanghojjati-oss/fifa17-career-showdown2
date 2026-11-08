"""HC phone guides: put the approved men cut-outs on one phone grid (1024x1536), cyan everywhere else.
python3 project-documents/factory/tools/hc/guide_phone.py DANIEL.webp NIK.webp OUT.png
Grid: hair top at 16% height, lip (cut line) at 50%, Nik in front of Daniel's right shoulder, the phone crop is the centre 864 px (x 80-944)."""
import sys, json
from PIL import Image
W, H = 1024, 1536
TOP, LIP, S = round(H * 0.16), round(H * 0.50), 0.90
d, n = Image.open(sys.argv[1]).convert("RGBA"), Image.open(sys.argv[2]).convert("RGBA")
DX_OVER, NIK_L = 340, 72          # Daniel x where Nik's left edge sits; Nik's alpha starts at x 72
span = (DX_OVER - NIK_L) * S + n.getbbox()[2] * S - 6   # alpha right edge, 6 px past the crop
# Nik's cut right edge sits on the phone crop edge (x 944), so it is never seen
x0 = round(944 - span); y0 = TOP - round(10 * S)
c = Image.new("RGBA", (W, H), (0, 255, 255, 255))
for im, x in ((d, x0), (n, x0 + round((DX_OVER - NIK_L) * S))):
    im = im.resize((round(im.width * S), round(im.height * S)), Image.LANCZOS)
    c.alpha_composite(im, (x, y0))
c = c.convert("RGB")
c.paste((0, 255, 255), (0, LIP, W, H))     # below the lip is all cyan
c.save(sys.argv[3])
json.dump({"W": W, "H": H, "top": TOP, "lip": LIP, "scale": S, "daniel_x": x0, "nik_x": x0 + round((DX_OVER - NIK_L) * S), "y": y0},
          open(sys.argv[3].replace(".png", ".json"), "w"), indent=1)
print("ok", x0, y0)
