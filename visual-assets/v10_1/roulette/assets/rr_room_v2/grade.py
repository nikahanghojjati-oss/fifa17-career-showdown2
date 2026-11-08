# RR_ROOM_V2 grade: x4 AI upscale + lanczos detail blend, dimmer moody grade, calm dark upper centre,
# key light from above slightly right, lamp highlight roll-off, fine grain. Outputs 4K + 1080 WebP.
import sys, numpy as np
from PIL import Image, ImageFilter

src_x4, src_orig, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = 3840, 2160

x4 = Image.open(src_x4).convert('RGB')          # 6688x3764
x4 = x4.crop((0, 1, 6688, 3763))                 # 6688x3762 = 16:9
a = np.asarray(x4.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
orig = Image.open(src_orig).convert('RGB')
o = orig.crop((0, 0, 1672, 940)) if False else orig
b = np.asarray(o.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
# keep crisp AI edges, borrow some natural texture back from the source
img = 0.78 * a + 0.22 * b

def lin(v): return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)
def srgb(v): v = np.clip(v, 0, None); return np.where(v <= 0.0031308, v * 12.92, 1.055 * v ** (1 / 2.4) - 0.055)

L = lin(img)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
u, v = xx / W, yy / H

# 1) overall dimmer (~0.8 stop down)
L *= 0.58
# 2) key light from above, slightly right: soft lift centred at (0.60, 0.05), fall-off to left/bottom
key = np.exp(-(((u - 0.60) / 0.55) ** 2 + ((v - 0.05) / 0.75) ** 2))
L *= (0.78 + 0.32 * key)[..., None]
# 3) calm, darker upper centre (title zone): ellipse centred (0.5, 0.20)
calm = np.exp(-(((u - 0.50) / 0.20) ** 2 + ((v - 0.20) / 0.16) ** 2))
L *= (1 - 0.60 * calm)[..., None]
# 4) edge vignette
vig = np.clip(1 - 0.55 * (((u - 0.5) / 0.62) ** 2 + ((v - 0.47) / 0.75) ** 2), 0.3, 1)
L *= vig[..., None]
# 5) floor below bar (y > 0.60): slightly calmer, lower local contrast of veins/reflections
floor = np.clip((v - 0.60) / 0.06, 0, 1)
blur = lin(np.asarray(Image.fromarray((img * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255) * 0.58
blur *= ((0.78 + 0.32 * key) * (1 - 0.60 * calm) * vig)[..., None]
L = L * (1 - 0.35 * floor[..., None]) + blur * (0.35 * floor[..., None])
L *= (1 - 0.12 * floor - 0.30 * np.clip((v - 0.62) / 0.38, 0, 1))[..., None]
# 6) highlight roll-off so lamps never clip (soft shoulder above 0.35 linear)
k = 0.35
lum = 0.2126 * L[..., 0] + 0.7152 * L[..., 1] + 0.0722 * L[..., 2]
nl = np.where(lum > k, k + (lum - k) / (1 + (lum - k) / (0.92 - k)), lum)
L *= (nl / np.maximum(lum, 1e-6))[..., None]
# 7) warm-moody colour: slightly warmer mids, cooler deep shadows (keeps window night blue)
L[..., 0] *= 1.04; L[..., 2] *= 0.94
out = srgb(L)
# gentle S-curve for mood
out = np.clip(out, 0, 1); out = out + 0.06 * (out - 0.5) * (1 - np.abs(2 * out - 1))
# 8) mild unsharp on luminance for 4K crispness
im = Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))
im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=45, threshold=2))
# 9) fine grain (hides AI waxiness)
rng = np.random.default_rng(1851)
g = rng.normal(0, 1, (H, W)).astype(np.float32)
g = np.asarray(Image.fromarray(((g * 32) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) - 128
arr = np.asarray(im).astype(np.float32) + (g / 32 * 2.2)[..., None]
im = Image.fromarray(np.clip(arr + 0.5, 0, 255).astype(np.uint8))
im.save(out_dir + '/RR_ROOM_V2_master.png')
for name, size, q in (('RR_ROOM_V2_4K.webp', (3840, 2160), int(sys.argv[4]) if len(sys.argv) > 4 else 80),
                      ('RR_ROOM_V2_1080.webp', (1920, 1080), int(sys.argv[5]) if len(sys.argv) > 5 else 86)):
    t = im if size == im.size else im.resize(size, Image.LANCZOS)
    t.save(out_dir + '/' + name, 'WEBP', quality=q, method=6)
print('ok')
