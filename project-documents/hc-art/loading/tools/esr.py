# Real-ESRGAN x4plus (RRDBNet) upscaler, CPU, tiled. Weights loaded with weights_only=True (no pickle code).
import sys, torch, torch.nn as nn, torch.nn.functional as F, numpy as np
from PIL import Image

class RDB(nn.Module):
    def __init__(s, nf=64, gc=32):
        super().__init__()
        s.conv1 = nn.Conv2d(nf, gc, 3, 1, 1); s.conv2 = nn.Conv2d(nf+gc, gc, 3, 1, 1)
        s.conv3 = nn.Conv2d(nf+2*gc, gc, 3, 1, 1); s.conv4 = nn.Conv2d(nf+3*gc, gc, 3, 1, 1)
        s.conv5 = nn.Conv2d(nf+4*gc, nf, 3, 1, 1); s.l = nn.LeakyReLU(0.2, True)
    def forward(s, x):
        x1 = s.l(s.conv1(x)); x2 = s.l(s.conv2(torch.cat((x, x1), 1)))
        x3 = s.l(s.conv3(torch.cat((x, x1, x2), 1))); x4 = s.l(s.conv4(torch.cat((x, x1, x2, x3), 1)))
        return s.conv5(torch.cat((x, x1, x2, x3, x4), 1)) * 0.2 + x

class RRDB(nn.Module):
    def __init__(s, nf=64):
        super().__init__(); s.rdb1 = RDB(nf); s.rdb2 = RDB(nf); s.rdb3 = RDB(nf)
    def forward(s, x): return s.rdb3(s.rdb2(s.rdb1(x))) * 0.2 + x

class Net(nn.Module):
    def __init__(s, nf=64, nb=23):
        super().__init__()
        s.conv_first = nn.Conv2d(3, nf, 3, 1, 1); s.body = nn.Sequential(*[RRDB(nf) for _ in range(nb)])
        s.conv_body = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1)
        s.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1)
        s.conv_last = nn.Conv2d(nf, 3, 3, 1, 1); s.l = nn.LeakyReLU(0.2, True)
    def forward(s, x):
        f = s.conv_first(x); f = f + s.conv_body(s.body(f))
        f = s.l(s.conv_up1(F.interpolate(f, scale_factor=2, mode='nearest')))
        f = s.l(s.conv_up2(F.interpolate(f, scale_factor=2, mode='nearest')))
        return s.conv_last(s.l(s.conv_hr(f)))

def main(src, dst, weights):
    torch.set_num_threads(4)
    m = Net()
    sd = torch.load(weights, map_location='cpu', weights_only=True)
    sd = sd.get('params_ema', sd)
    m.load_state_dict(sd); m.eval()
    img = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
    H, W, _ = img.shape; T = 192; P = 16
    out = np.zeros((H*4, W*4, 3), np.float32)
    x = torch.from_numpy(img).permute(2, 0, 1)[None]
    with torch.no_grad():
        for y0 in range(0, H, T):
            for x0 in range(0, W, T):
                y1, x1 = min(y0+T, H), min(x0+T, W)
                ya, xa = max(y0-P, 0), max(x0-P, 0); yb, xb = min(y1+P, H), min(x1+P, W)
                o = m(x[:, :, ya:yb, xa:xb])[0].permute(1, 2, 0).numpy()
                oy, ox = (y0-ya)*4, (x0-xa)*4
                out[y0*4:y1*4, x0*4:x1*4] = o[oy:oy+(y1-y0)*4, ox:ox+(x1-x0)*4]
            print('row', y0, flush=True)
    Image.fromarray((out.clip(0, 1)*255 + 0.5).astype(np.uint8)).save(dst)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
