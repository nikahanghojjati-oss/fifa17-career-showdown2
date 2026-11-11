"""HO-071 title family renderer: three matte handcrafted options.
Usage: python3 -I title_family.py <option A|B|C> "<TEXT>" <cap_px> <out.png>
Renders letters only (alpha). No glow, no bevel, no shine."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONTS = "/tmp/claude-0/fonts/"
OPT = {
    # Honours Board: gold leaf sign-writing on walnut, with a sign-writer's dark shade
    "A": dict(font="cormorant_sc_700.ttf", case="upper", track=0.06,
              base=(196, 160, 92), var=0.06, grain="leaf",
              shade=(0.045, 0.045), shade_col=(48, 30, 18), keyline=0.0),
    # Brass Inlay: condensed caps cut into stone/wood, brushed matte brass
    "B": dict(font="bigshoulders_800.ttf", case="upper", track=0.035,
              base=(170, 136, 80), var=0.05, grain="brushed",
              shade=None, shade_col=None, keyline=0.022, inset=0.03),
    # Sign-writer's script: hand-painted matte ochre, thin dark keyline
    "C": dict(font="yellowtail.ttf", case="title", track=0.0,
              base=(206, 170, 104), var=0.07, grain="paint",
              shade=None, shade_col=None, keyline=0.03),
}


def cap_scale(font_file, size):
    f = ImageFont.truetype(FONTS + font_file, size)
    l, t, r, b = f.getbbox("H")
    return (b - t) / size


def text_mask(o, text, cap):
    ss = 2
    size = int(round(cap / cap_scale(o["font"], 1000) * ss))
    f = ImageFont.truetype(FONTS + o["font"], size)
    track = o["track"] * size
    widths = [f.getlength(ch) for ch in text]
    total = sum(widths) + track * (len(text) - 1)
    asc, desc = f.getmetrics()
    pad = int(size * 0.35)
    W, H = int(total + 2 * pad), int(asc + desc + 2 * pad)
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    x = pad
    if track == 0:
        d.text((pad, pad), text, font=f, fill=255)
    else:
        for ch, w in zip(text, widths):
            d.text((x, pad), ch, font=f, fill=255)
            x += w + track
    m = m.resize((W // ss, H // ss), Image.LANCZOS)
    return m


def noise(h, w, blur_x, blur_y, seed):
    rng = np.random.default_rng(seed)
    n = Image.fromarray((rng.random((h, w)) * 255).astype(np.uint8))
    n = n.filter(ImageFilter.BoxBlur(0)) if blur_x == blur_y == 0 else n
    if blur_x or blur_y:
        n = n.resize((max(1, w // max(1, blur_x)), max(1, h // max(1, blur_y))), Image.BILINEAR).resize((w, h), Image.BICUBIC)
    a = np.asarray(n, np.float32) / 255.0
    return (a - a.mean()) / (a.std() + 1e-6)


def render(opt, text, cap):
    o = OPT[opt]
    if o["case"] == "upper":
        text = text.upper()
    else:
        text = " ".join(w.capitalize() for w in text.split())
    m = text_mask(o, text, cap)
    W, H = m.size
    a = np.asarray(m, np.float32) / 255.0
    base = np.array(o["base"], np.float32)
    # low-frequency tone drift (hand-laid material, never a gradient shine)
    low = noise(H, W, max(2, cap // 2), max(2, cap // 2), 1) * o["var"]
    if o["grain"] == "leaf":
        fine = noise(H, W, 0, 0, 2) * 0.025 + noise(H, W, 3, 3, 3) * 0.03
    elif o["grain"] == "brushed":
        fine = noise(H, W, max(4, cap // 3), 1, 4) * 0.028
    else:  # paint: streaks along the brush direction (slightly slanted)
        fine = noise(H, W, max(3, cap // 2), 2, 5) * 0.03
    tone = 1.0 + low + fine
    rgb = np.clip(base[None, None, :] * tone[..., None], 0, 255)
    out = np.zeros((H, W, 4), np.float32)
    # optional keyline (dark contour hugging the letter)
    if o.get("keyline"):
        r = max(1, int(round(cap * o["keyline"])))
        k = np.asarray(m.filter(ImageFilter.MaxFilter(2 * r + 1)).filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255.0
        out[..., :3] = np.array((34, 24, 16), np.float32)
        out[..., 3] = k * 0.92
    # optional sign-writer's shade (solid offset, hard edged: paint, not light)
    if o.get("shade"):
        dx, dy = int(round(cap * o["shade"][0])), int(round(cap * o["shade"][1]))
        s = np.zeros_like(a)
        s[dy:, dx:] = a[:H - dy, :W - dx]
        sc = np.array(o["shade_col"], np.float32)
        sa = s * 0.95
        oa = out[..., 3]
        na = sa + oa * (1 - sa)
        out[..., :3] = (sc * sa[..., None] + out[..., :3] * (oa * (1 - sa))[..., None]) / np.maximum(na, 1e-6)[..., None]
        out[..., 3] = na
    # inlay: thin inner shadow on the top-left edge (recessed into the surface)
    if o.get("inset"):
        r = max(1, int(round(cap * o["inset"])))
        sh = np.zeros_like(a)
        sh[r:, r:] = a[:H - r, :W - r]
        inner = np.clip(a - sh, 0, 1)
        inner = np.asarray(Image.fromarray((inner * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r * 0.6)), np.float32) / 255.0
        rgb = rgb * (1 - 0.45 * inner[..., None])
    # letters over keyline/shade
    oa = out[..., 3]
    na = a + oa * (1 - a)
    out[..., :3] = (rgb * a[..., None] + out[..., :3] * (oa * (1 - a))[..., None]) / np.maximum(na, 1e-6)[..., None]
    out[..., 3] = na
    out[..., 3] *= 255.0
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")
    return img.crop(img.getbbox())


if __name__ == "__main__":
    opt, text, cap, dst = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
    render(opt, text, cap).save(dst)
