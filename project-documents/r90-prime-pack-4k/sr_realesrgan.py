# Real-ESRGAN (RRDBNet) inference, architecture written here; weights loaded tensor-only (weights_only=True, no pickle code).
import sys, time, torch, torch.nn as nn, torch.nn.functional as F, numpy as np
from PIL import Image

class RDB(nn.Module):
    def __init__(s, nf=64, gc=32):
        super().__init__()
        s.conv1 = nn.Conv2d(nf, gc, 3, 1, 1); s.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1); s.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1)
        s.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1); s.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1); s.l = nn.LeakyReLU(0.2, True)
    def forward(s, x):
        x1 = s.l(s.conv1(x)); x2 = s.l(s.conv2(torch.cat((x, x1), 1))); x3 = s.l(s.conv3(torch.cat((x, x1, x2), 1)))
        x4 = s.l(s.conv4(torch.cat((x, x1, x2, x3), 1))); x5 = s.conv5(torch.cat((x, x1, x2, x3, x4), 1))
        return x5 * 0.2 + x

class RRDB(nn.Module):
    def __init__(s, nf=64):
        super().__init__(); s.rdb1 = RDB(nf); s.rdb2 = RDB(nf); s.rdb3 = RDB(nf)
    def forward(s, x): return s.rdb3(s.rdb2(s.rdb1(x))) * 0.2 + x

class Net(nn.Module):
    def __init__(s, scale):
        super().__init__(); s.scale = scale; inc = 3 * (4 if scale == 2 else 1)
        s.conv_first = nn.Conv2d(inc, 64, 3, 1, 1); s.body = nn.Sequential(*[RRDB() for _ in range(23)]); s.conv_body = nn.Conv2d(64, 64, 3, 1, 1)
        s.conv_up1 = nn.Conv2d(64, 64, 3, 1, 1); s.conv_up2 = nn.Conv2d(64, 64, 3, 1, 1); s.conv_hr = nn.Conv2d(64, 64, 3, 1, 1)
        s.conv_last = nn.Conv2d(64, 3, 3, 1, 1); s.l = nn.LeakyReLU(0.2, True)
    def forward(s, x):
        if s.scale == 2: x = F.pixel_unshuffle(x, 2)
        f = s.conv_first(x); f = f + s.conv_body(s.body(f))
        f = s.l(s.conv_up1(F.interpolate(f, scale_factor=2, mode='nearest')))
        f = s.l(s.conv_up2(F.interpolate(f, scale_factor=2, mode='nearest')))
        return s.conv_last(s.l(s.conv_hr(f)))

src, dst, scale, wpath = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
T = int(sys.argv[5]) if len(sys.argv) > 5 else 256
net = Net(scale)
sd = torch.load(wpath, map_location='cpu', weights_only=True)
sd = sd.get('params_ema', sd.get('params', sd))
net.load_state_dict(sd); net.eval()
img = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255; H, W, _ = img.shape
x = torch.from_numpy(img).permute(2, 0, 1)[None]
out = np.zeros((H * scale, W * scale, 3), np.float32); P = 16; t0 = time.time()
with torch.no_grad():
    for y0 in range(0, H, T):
        for x0 in range(0, W, T):
            ya, xa = max(y0 - P, 0), max(x0 - P, 0); yb, xb = min(y0 + T + P, H), min(x0 + T + P, W)
            o = net(x[:, :, ya:yb, xa:xb])[0].permute(1, 2, 0).numpy()
            ty, tx = (y0 - ya) * scale, (x0 - xa) * scale
            hh, ww = (min(y0 + T, H) - y0) * scale, (min(x0 + T, W) - x0) * scale
            out[y0 * scale:y0 * scale + hh, x0 * scale:x0 * scale + ww] = o[ty:ty + hh, tx:tx + ww]
        print(y0, round(time.time() - t0), flush=True)
Image.fromarray((np.clip(out, 0, 1) * 255 + .5).astype(np.uint8)).save(dst)
