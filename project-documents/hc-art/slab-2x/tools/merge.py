# HO-077: build ENV_SLAB_HC_V1_2X.webp (3072x1728) from the HC 03 raw.
# crop.png = HC03_SLAB_RAW.png rows 80-944 (same crop as ENV_SLAB_HC_V1_1X), up4.png = esr.py x4 of crop.png.
import numpy as np
from PIL import Image, ImageFilter
f = lambda im: np.asarray(im).astype(float)
u = Image.open('up4.png').resize((3072, 1728), Image.LANCZOS)
l = Image.open('crop.png').resize((3072, 1728), Image.LANCZOS)
U, L = f(u), f(l)
Ub, Lb = f(u.filter(ImageFilter.GaussianBlur(3))), f(l.filter(ImageFilter.GaussianBlur(3)))
out = Lb + 0.6 * (L - Lb) + 0.85 * (U - Ub)          # colour/shape from original, fine detail from ESRGAN
out += np.random.default_rng(7).normal(0, 1.2, out.shape[:2])[..., None]  # fine grain
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save('ENV_SLAB_HC_V1_2X.webp', quality=80, method=6)
