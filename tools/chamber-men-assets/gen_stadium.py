"""Stadium kit for Chamber Men: crowd cards, ad boards, grass, net cell, seats, concrete, floodlight flare.

All drawn here in code (numpy + Pillow). Ad boards carry only our own marks (CHAMBER MEN, CMS, CAREER MODE SHOWDOWN),
set in Inter (SIL Open Font Licence 1.1; the letters are baked into the images, no font file ships).
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from common import save_webp, resize, blur, normal_from_height

FONT_DIR = '/usr/share/fonts/opentype/inter/'
rng = np.random.default_rng(1717)


def font(name, size):
    for n in (name, 'Inter-ExtraBold.otf', 'Inter-Bold.otf'):
        p = os.path.join(FONT_DIR, n)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def to_f(img):
    return np.asarray(img).astype(np.float32) / 255


# ---------------------------------------------------------------- crowd
CARD_W, CARD_H, COLS, ROWS = 128, 160, 16, 12  # 2048 x 1920 atlas; even columns arms down, odd columns arms up
SKIN = [(241, 205, 175), (225, 182, 146), (198, 148, 108), (160, 110, 75), (118, 78, 52), (82, 55, 38)]
HAIR = [(25, 20, 18), (45, 32, 24), (80, 55, 35), (120, 90, 55), (170, 140, 95), (60, 60, 62), (190, 185, 175)]
OWN = [(28, 28, 32), (230, 230, 228), (40, 60, 120), (120, 30, 35), (35, 80, 50), (70, 70, 75), (200, 170, 60), (30, 90, 160)]


def shade_rgb(c, k):
    return tuple(int(max(0, min(255, v * k))) for v in c)


def draw_fan(seed, arms_up):
    """One fan, chest-up, facing the pitch. Returns (RGBA image, tint-mask image) at 2x, downsized by the caller."""
    r = np.random.default_rng(seed)
    S = 2
    W, H = CARD_W * S, CARD_H * S
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    msk = Image.new('L', (W, H), 0)
    d, m = ImageDraw.Draw(img), ImageDraw.Draw(msk)
    cx = W / 2 + r.uniform(-8, 8) * S
    skin = SKIN[r.integers(len(SKIN))]
    hair = HAIR[r.integers(len(HAIR))]
    tinted = r.random() < .62  # shirt takes the home club colour in the builder
    shirt = (236, 236, 236) if tinted else OWN[r.integers(len(OWN))]
    build = r.uniform(.88, 1.12)
    sw = 40 * S * build  # half shoulder width
    top = H * (.5 if arms_up else .43) + r.uniform(-4, 4) * S  # shoulder line (lower card room for raised arms)
    head_r = 17 * S * r.uniform(.92, 1.06)
    # Arms (behind the torso when down; raised above the head when up).
    def arm(side):
        sx, sy = cx + side * (sw - 8 * S), top + 10 * S
        if arms_up:
            ex, ey = sx + side * r.uniform(8, 16) * S, sy - r.uniform(26, 34) * S
            hx, hy = ex + side * r.uniform(-4, 6) * S, ey - r.uniform(22, 28) * S
        else:
            ex, ey = sx + side * 10 * S, sy + 40 * S
            hx, hy = ex - side * 2 * S, ey + 30 * S
        sl = shade_rgb(shirt, .82)
        d.line([(sx, sy), (ex, ey)], fill=sl + (255,), width=int(19 * S * build))
        m.line([(sx, sy), (ex, ey)], fill=255 if tinted else 0, width=int(19 * S * build))
        d.line([(ex, ey), (hx, hy)], fill=shade_rgb(skin, .9) + (255,), width=int(13 * S * build))
        d.ellipse([hx - 8 * S, hy - 8 * S, hx + 8 * S, hy + 8 * S], fill=skin + (255,))
        return (hx, hy)
    hands = [arm(-1), arm(1)]
    # Torso: rounded shoulders down to the card bottom (the seat row hides the rest).
    d.rounded_rectangle([cx - sw, top, cx + sw, H + 30 * S], radius=int(22 * S), fill=shirt + (255,))
    m.rounded_rectangle([cx - sw, top, cx + sw, H + 30 * S], radius=int(22 * S), fill=255 if tinted else 0)
    # Shirt detail: collar, a side-light falloff, sometimes a stripe or a scarf round the neck.
    d.polygon([(cx - 11 * S, top), (cx + 11 * S, top), (cx, top + 14 * S)], fill=shade_rgb(skin, .8) + (255,))
    if r.random() < .3:
        sc = OWN[r.integers(len(OWN))]
        d.rounded_rectangle([cx - 20 * S, top - 2 * S, cx + 20 * S, top + 9 * S], radius=6 * S, fill=sc + (255,))
        m.rounded_rectangle([cx - 20 * S, top - 2 * S, cx + 20 * S, top + 9 * S], radius=6 * S, fill=0)
        d.rectangle([cx + 4 * S, top, cx + 14 * S, top + 46 * S], fill=sc + (255,))
        m.rectangle([cx + 4 * S, top, cx + 14 * S, top + 46 * S], fill=0)
    # Held-up scarf between the hands on some arms-up fans.
    if arms_up and r.random() < .35:
        (x0, y0), (x1, y1) = hands
        sc = (236, 236, 236)
        d.line([(x0, y0), (x1, y1)], fill=sc + (255,), width=int(12 * S))
        m.line([(x0, y0), (x1, y1)], fill=255, width=int(12 * S))
    # Neck and head.
    hy = top - head_r * .95
    d.rectangle([cx - 7 * S, hy, cx + 7 * S, top + 2 * S], fill=shade_rgb(skin, .85) + (255,))
    d.ellipse([cx - head_r * .86, hy - head_r, cx + head_r * .86, hy + head_r], fill=skin + (255,))
    style = r.integers(4)
    if style == 0:  # short hair
        d.chord([cx - head_r * .9, hy - head_r * 1.08, cx + head_r * .9, hy + head_r * .5], 180, 360, fill=hair + (255,))
    elif style == 1:  # longer hair
        d.ellipse([cx - head_r * .98, hy - head_r * 1.1, cx + head_r * .98, hy + head_r * .3], fill=hair + (255,))
        d.rectangle([cx - head_r * .98, hy - head_r * .3, cx - head_r * .6, hy + head_r * 1.4], fill=hair + (255,))
        d.rectangle([cx + head_r * .6, hy - head_r * .3, cx + head_r * .98, hy + head_r * 1.4], fill=hair + (255,))
        d.ellipse([cx - head_r * .7, hy - head_r * .55, cx + head_r * .7, hy + head_r * .95], fill=skin + (255,))
    elif style == 2:  # beanie in a scarf colour
        bc = OWN[r.integers(len(OWN))]
        d.chord([cx - head_r * .95, hy - head_r * 1.2, cx + head_r * .95, hy + head_r * .35], 180, 360, fill=bc + (255,))
    # style 3: shaved head, nothing drawn
    # Faces are far away: two soft eye shadows and a mouth line, never a likeness.
    for s in (-1, 1):
        d.ellipse([cx + s * head_r * .32 - 2.4 * S, hy - 1 * S, cx + s * head_r * .32 + 2.4 * S, hy + 3 * S], fill=shade_rgb(skin, .45) + (255,))
    d.line([(cx - 5 * S, hy + head_r * .52), (cx + 5 * S, hy + head_r * .52)], fill=shade_rgb(skin, .55) + (255,), width=2 * S)
    # Lighting: floodlights from above and in front, so the top is brighter and the bottom falls into the stand's shade.
    a = np.asarray(img).astype(np.float32)
    ys = np.linspace(0, 1, H)[:, None]
    k = 1.08 - .5 * np.clip((ys - .35) / .65, 0, 1)
    a[..., :3] *= k[..., None]
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
    return img, msk


def crowd_atlas():
    atlas = Image.new('RGBA', (CARD_W * COLS, CARD_H * ROWS), (0, 0, 0, 0))
    mask = Image.new('L', (CARD_W * COLS, CARD_H * ROWS), 0)
    for row in range(ROWS):
        for pair in range(COLS // 2):
            seed = 1000 + row * 31 + pair
            for up in (0, 1):
                im, mk = draw_fan(seed, bool(up))
                im = im.resize((CARD_W, CARD_H), Image.LANCZOS)
                mk = mk.resize((CARD_W, CARD_H), Image.LANCZOS)
                x, y = (pair * 2 + up) * CARD_W, row * CARD_H
                atlas.paste(im, (x, y))
                mask.paste(mk, (x, y))
    a = to_f(atlas)
    # Premultiply-friendly edges: bleed colour under transparent pixels so mipmaps do not grey the outlines.
    rgb, al = a[..., :3], a[..., 3:]
    bled = blur(rgb * al, 3) / np.maximum(blur(al, 3), 1e-3)
    a[..., :3] = np.where(al > .02, rgb, np.clip(bled, 0, 1))
    sizes = {}
    sizes['crowd_atlas_2k.webp'] = save_webp(a, 'crowd_atlas_2k.webp', 90)
    sizes['crowd_atlas_1k.webp'] = save_webp(np.dstack([resize(a[..., :3], 1024, 960), np.clip(resize(a[..., 3], 1024, 960), 0, 1)]), 'crowd_atlas_1k.webp', 88)
    m = to_f(mask)
    sizes['crowd_tint_1k.webp'] = save_webp(resize(m, 1024, 960), 'crowd_tint_1k.webp', 85)
    return sizes


# ---------------------------------------------------------------- ad boards
def gold_text(base, text, fnt, box, skew=.18):
    """Draw text with a vertical gold gradient into box (x0,y0,x1,y1), centred, with a faux-italic skew."""
    W, H = base.size
    layer = Image.new('L', (W, H), 0)
    ld = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    bb = ld.textbbox((0, 0), text, font=fnt)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    ld.text(((x0 + x1 - tw) / 2 - bb[0], (y0 + y1 - th) / 2 - bb[1]), text, font=fnt, fill=255)
    if skew:
        layer = layer.transform((W, H), Image.AFFINE, (1, skew, -skew * H / 2, 0, 1, 0), Image.BICUBIC)
    g = np.linspace(0, 1, H)[:, None]
    grad = np.stack([1.0 - .12 * g, .86 - .3 * g, .5 - .3 * g], -1) * np.ones((1, W, 1))
    a = to_f(layer)[..., None]
    out = to_f(base)[..., :3]
    return out * (1 - a) + grad * a


def led_grid(arr, pitch=4):
    """LED board look: a fine dot grid (each 'pixel' a soft rounded cell) multiplied over the art."""
    H, W = arr.shape[:2]
    y = (np.arange(H) % pitch)[:, None]
    x = (np.arange(W) % pitch)[None, :]
    c = (pitch - 1) / 2
    d = np.sqrt(((x - c) / pitch) ** 2 + ((y - c) / pitch) ** 2)
    cell = np.clip(1.25 - d * 1.6, .55, 1)
    return arr * cell[..., None]


def chevrons(W, H, color, step=96, alpha=.5, offset=0):
    a = np.zeros((H, W, 3), np.float32)
    ys, xs = np.mgrid[0:H, 0:W]
    u = (xs + np.abs(ys - H / 2) * .9 + offset) % step
    band = ((u > 8) & (u < 26)).astype(np.float32) * alpha
    return band[..., None] * np.array(color)[None, None, :]


def ad_boards():
    W, H = 2048, 256
    sizes = {}
    big = font('InterDisplay-Black.otf', 168)
    mid = font('Inter-ExtraBold.otf', 118)
    small = font('Inter-Bold.otf', 54)
    # 1: CHAMBER MEN, gold on black with gold chevrons at both ends.
    base = Image.new('RGB', (W, H), (6, 6, 7))
    a = gold_text(base, 'CHAMBER MEN', big, (360, 0, W - 360, H))
    ch = chevrons(W, H, (.85, .62, .22), 110, .55)
    ends = ((np.arange(W) < 330) | (np.arange(W) > W - 330)).astype(np.float32)[None, :, None]
    a = np.maximum(a, ch * ends)
    a[:10] = [.75, .55, .2]; a[-10:] = [.75, .55, .2]
    sizes['board_chamber_men.webp'] = save_webp(led_grid(a), 'board_chamber_men.webp', 88)
    # 2: CMS monogram and CAREER MODE SHOWDOWN, gold field with black type (an inverse board breaks up the row).
    g = np.linspace(0, 1, W)[None, :, None]
    field = np.array([.92, .7, .3]) * (1 - .25 * g) + np.array([.6, .42, .14]) * .25 * g
    field = np.ones((H, 1, 1)) * field
    base = Image.fromarray((field * 255).astype(np.uint8))
    lay = Image.new('L', (W, H), 0)
    ld = ImageDraw.Draw(lay)
    ld.rounded_rectangle([60, 40, 420, 216], radius=30, outline=255, width=12)
    bb = ld.textbbox((0, 0), 'CMS', font=mid)
    ld.text((240 - (bb[2] - bb[0]) / 2 - bb[0], 128 - (bb[3] - bb[1]) / 2 - bb[1]), 'CMS', font=mid, fill=255)
    bb = ld.textbbox((0, 0), 'CAREER MODE SHOWDOWN', font=font('Inter-ExtraBold.otf', 104))
    f2 = font('Inter-ExtraBold.otf', 104)
    ld.text((480 + (W - 540 - (bb[2] - bb[0])) / 2 - bb[0], 128 - (bb[3] - bb[1]) / 2 - bb[1]), 'CAREER MODE SHOWDOWN', font=f2, fill=255)
    m = to_f(lay)[..., None]
    a = field * (1 - m) + np.array([.03, .03, .035]) * m
    sizes['board_cms.webp'] = save_webp(led_grid(a), 'board_cms.webp', 88)
    # 3: a motion board: black with sweeping gold chevrons and a small CMS at each end (reads well when scrolled).
    a = chevrons(W, H, (.95, .72, .3), 128, .9)
    a += chevrons(W, H, (.5, .36, .1), 128, .6, offset=40)
    base = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    a = gold_text(base, 'CMS', mid, (0, 0, 420, H), 0)
    a = np.maximum(a, gold_text(Image.new('RGB', (W, H)), 'CMS', mid, (W - 420, 0, W, H), 0))
    sizes['board_chevrons.webp'] = save_webp(led_grid(a), 'board_chevrons.webp', 88)
    return sizes


# ---------------------------------------------------------------- grass
def grass():
    N = 1024  # tiles every 2 m: 2 mm a pixel
    n1 = rng.standard_normal((N, N)).astype(np.float32)
    # Blades: noise stretched along v (blades stand up; seen from low they streak toward the camera).
    blades = blur(n1, 0.7)
    stretch = np.real(np.fft.ifft2(np.fft.fft2(rng.standard_normal((N, N))) * np.exp(-2 * np.pi ** 2 * ((np.fft.fftfreq(N)[None, :] * 1.1) ** 2 + (np.fft.fftfreq(N)[:, None] * 2.2) ** 2))))
    clumps = blur(rng.standard_normal((N, N)).astype(np.float32), 18)
    patches = blur(rng.standard_normal((N, N)).astype(np.float32), 90)
    def z(a):
        return (a - a.mean()) / (a.std() + 1e-6)
    blades, stretch, clumps, patches = z(blades), z(stretch), z(clumps), z(patches)
    h = .3 * stretch + .6 * blades + .12 * clumps
    base = np.array([.16, .36, .11])
    tipc = np.array([.32, .55, .2])
    dark = np.array([.06, .17, .05])
    t = np.clip(h * .25 + .5, 0, 1)[..., None]
    col = dark * (1 - t) + base * t
    col = col * (1 - np.clip(h - 1.3, 0, 1)[..., None]) + tipc * np.clip(h - 1.3, 0, 1)[..., None]
    col *= (1 + .035 * patches[..., None])
    sizes = {}
    sizes['grass_color_1k.webp'] = save_webp(col, 'grass_color_1k.webp', 86)
    nrm = normal_from_height(h * .0012, .002, .002)
    sizes['grass_normal_1k.webp'] = save_webp(nrm, 'grass_normal_1k.webp', 86)
    n5 = resize(nrm * 2 - 1, 512, 512)
    n5 /= np.linalg.norm(n5, axis=-1, keepdims=True)
    sizes['grass_normal_512.webp'] = save_webp(n5 * .5 + .5, 'grass_normal_512.webp', 82)
    return sizes


# ---------------------------------------------------------------- net cell
def net_cell():
    """One knotted mesh cell (12 cm square in the builder), white cord with soft shading, RGBA. Tiles in both directions."""
    S = 512
    img = Image.new('L', (S * 2, S * 2), 0)
    d = ImageDraw.Draw(img)
    w = int(S * 2 * .085)
    for k in (-1, 0, 1):
        d.line([(0 + k * S * 2, S), (S * 2 + k * S * 2, S)], fill=255, width=w)
        d.line([(S, 0 + k * S * 2), (S, S * 2 + k * S * 2)], fill=255, width=w)
    d.ellipse([S - w * .9, S - w * .9, S + w * .9, S + w * .9], fill=255)  # knot
    img = img.resize((S, S), Image.LANCZOS)
    a = to_f(img)
    # Round cord shading: brighter along the middle of each cord.
    shade = .72 + .28 * blur(a, 4) / max(blur(a, 4).max(), 1e-3)
    tw = rng.standard_normal((S, S)).astype(np.float32)
    twist = blur(tw, 1.2)
    twist = (twist - twist.mean()) / twist.std()
    c = np.clip(shade + .04 * twist, 0, 1)
    rgb = np.stack([c * .97, c * .96, c * .93], -1)
    sizes = {'net_cell_512.webp': save_webp(np.dstack([rgb, a]), 'net_cell_512.webp', 92)}
    return sizes


# ---------------------------------------------------------------- seats, concrete, flare
def seats():
    """One step of the stand: 0.5 m wide seat (2 seats per tile), riser below. 512 x 512: u = 1 m, v = one step."""
    W, H = 512, 512
    a = np.zeros((H, W, 3), np.float32) + np.array([.16, .16, .17])  # concrete step
    img = Image.new('RGB', (W, H), (40, 40, 43))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 300, W, H], fill=(70, 70, 74))  # riser face (lit by floodlights)
    for i, x in enumerate((0, 256)):
        col = (12, 12, 13) if i == 0 else (176, 128, 40)  # black and gold seats, alternating
        d.rounded_rectangle([x + 24, 40, x + 232, 250], radius=34, fill=col)
        d.rounded_rectangle([x + 34, 210, x + 222, 300], radius=20, fill=tuple(int(v * .7) for v in col))
    a = to_f(img)
    n = blur(rng.standard_normal((H, W)).astype(np.float32), 1.5)
    a *= (1 + .05 * n / n.std())[..., None]
    return {'seats_512.webp': save_webp(a, 'seats_512.webp', 86)}


def concrete():
    N = 512
    n = sum(blur(rng.standard_normal((N, N)).astype(np.float32), s) * w for s, w in ((1, .3), (6, .5), (40, 1.)))
    n = (n - n.mean()) / n.std()
    c = np.clip(.42 + .05 * n, 0, 1)
    rgb = np.stack([c, c * .99, c * 1.02], -1)
    return {'concrete_512.webp': save_webp(rgb, 'concrete_512.webp', 84)}


def flare():
    N = 256
    y, x = np.mgrid[0:N, 0:N]
    r = np.hypot(x - N / 2 + .5, y - N / 2 + .5) / (N / 2)
    core = np.exp(-(r / .08) ** 2)
    halo = np.exp(-(r / .35) ** 2) * .45
    ang = np.arctan2(y - N / 2, x - N / 2)
    streak = (np.abs(np.cos(ang)) ** 60) * np.exp(-r / .5) * .5
    a = np.clip(core + halo + streak, 0, 1) * np.clip(1.1 - r, 0, 1)
    rgb = np.stack([a, a * .96, a * .88], -1)
    return {'flare_256.webp': save_webp(rgb, 'flare_256.webp', 90)}


def main():
    sizes = {}
    for f in (crowd_atlas, ad_boards, grass, net_cell, seats, concrete, flare):
        sizes.update(f())
    return sizes


if __name__ == '__main__':
    for k, v in main().items():
        print(k, round(v / 1024), 'KB')
