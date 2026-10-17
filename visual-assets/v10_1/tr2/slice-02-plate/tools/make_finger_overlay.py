# Cuts Nik's fingertip out of the locked plate so it can sit ABOVE the live text layer
# (finger in front of the glass). Pixels are the plate's own; only alpha is added.
import numpy as np, cv2, json
from PIL import Image
im = np.asarray(Image.open('assets/ENV_TR2_PLATE_G_LOCKED_V1_1672.png').convert('RGB')).astype(int)
x0, y0, x1, y1 = 1040, 578, 1090, 608
z = im[y0:y1, x0:x1]; R, G, B = z[..., 0], z[..., 1], z[..., 2]
skin = ((R > 105) & (R > G) & (G > B) & (R - B > 30) & (R - B < 150) & (G > 55)).astype(np.uint8)
# keep the connected component that contains the fingertip
n, lab = cv2.connectedComponents(skin)
tip = lab[599 - y0, 1062 - x0]
m = (lab == tip).astype(np.uint8) * 255 if tip else skin * 255
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
m = cv2.dilate(m, np.ones((2, 2), np.uint8))
a = cv2.GaussianBlur(m, (0, 0), 0.8)
rgba = np.dstack([z.astype(np.uint8), a])
for scale, name in ((1, '1672'), (2, '3344')):
    img = Image.fromarray(rgba, 'RGBA')
    if scale == 2:
        big = np.asarray(Image.open('assets/ENV_TR2_PLATE_G_LOCKED_V1_3344.png').convert('RGB'))[y0*2:y1*2, x0*2:x1*2]
        alpha = cv2.resize(a, ((x1-x0)*2, (y1-y0)*2), interpolation=cv2.INTER_LINEAR)
        img = Image.fromarray(np.dstack([big, alpha]), 'RGBA')
    img.save(f'assets/OVL_NIK_FINGERTIP_V1_{name}.png', optimize=True)
print('rect', [x0, y0, x1, y1], 'alpha px', int((a > 128).sum()))
