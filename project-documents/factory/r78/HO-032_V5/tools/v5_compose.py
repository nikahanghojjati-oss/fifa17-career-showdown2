# HO-032 V5 League plate: GPT ticket-1846 background (upscaled Lanczos to 1179x2096) with the exact V4 managers put back
# (V2 likeness, same V4 placement: Daniel 0.99 / Nik 0.90 cut-outs from the HO-031 mattes), so faces, hair, hands and suits
# are the approved pixels and only the stadium / plinth / floor come from the new picture.
import sys, os, json, numpy as np, cv2
sys.path.insert(0, sys.argv[1]); from h31lib import load, warp_layer, over, affine_scale_about, seg_masks
from PIL import Image
GPT, V2, MAT, PLACE, OUT = sys.argv[2:7]
FEATHER = float(os.environ.get('FEATHER', '1.5'))
H, W = 2096, 1179
g = Image.open(GPT).convert('RGB')
assert abs(g.size[0] / g.size[1] - W / H) < 0.001 * W / H, g.size
g = np.asarray(g.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
p = json.load(open(PLACE))
layers = []
for n, key in (('DANIEL', 'daniel'), ('NIK', 'nik')):
    F = np.load(f'{MAT}/LEAGUE_{n}_F.npy').astype(np.float32); A = np.load(f'{MAT}/LEAGUE_{n}_A.npy').astype(np.float32)
    m = p[key]; M = affine_scale_about(m['scale'], 0, 0, m['tx'], m['ty'])
    Fw, Aw = warp_layer(F, A, M, (H, W))
    if FEATHER > 0: Aw = np.minimum(Aw, cv2.GaussianBlur(Aw, (0, 0), FEATHER))   # soften only inward
    layers.append((n, Fw, Aw))
out = g.copy()
for n, Fw, Aw in layers: out = over(out, Fw, Aw)
# the plinth stands in front of both men (as in V4): the new picture's plinth, inside the V4 plinth silhouette
# (V2 tier back edges scaled 1.28x about the bottom centre; the new plinth lines up with it), goes back over the legs
E = np.load(f'{MAT}/LEAGUE_envelope.npy'); yy = np.arange(H)[:, None]
lm = cv2.GaussianBlur((yy >= (E[None, :] - 3)).astype(np.float32), (0, 0), 0.8)
AB = np.clip(cv2.warpAffine(lm, affine_scale_about(p['plinth'], 589.5, 2096.0), (W, H), flags=cv2.INTER_LINEAR), 0, 1)
out = over(out, g, AB)
out = np.clip(out, 0, 1)
os.makedirs(OUT, exist_ok=True)
u8 = (out * 255 + 0.5).astype(np.uint8)
Image.fromarray(u8).save(f'{OUT}/ENV_LEAGUE_PHONE_V5.png')
Image.fromarray(u8).save(f'{OUT}/ENV_LEAGUE_PHONE_V5.webp', quality=88, method=6)
np.save(f'{OUT}/men_alpha.npy', np.maximum(layers[0][2], layers[1][2]).astype(np.float16))
Image.fromarray((g * 255 + 0.5).astype(np.uint8)).save(f'{OUT}/gpt_up.png')
print('ok', os.path.getsize(f'{OUT}/ENV_LEAGUE_PHONE_V5.webp'))
