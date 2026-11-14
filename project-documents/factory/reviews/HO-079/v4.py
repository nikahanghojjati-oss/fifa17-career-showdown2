import sys, os
from PIL import Image, ImageDraw, ImageFont
FONT, OUT = sys.argv[1], sys.argv[2]
GOLD = (201, 164, 92); FEAT = ["lnum"]
def F(px): return ImageFont.truetype(FONT, px)
def tw(fn, t, tr): return sum(fn.getlength(c, features=FEAT) for c in t) + tr * (len(t) - 1)
def put(d, x, y, t, fn, tr):
    for c in t:
        d.text((x, y), c, font=fn, fill=255, anchor="ls", features=FEAT); x += fn.getlength(c, features=FEAT) + tr
def flat(mask):
    im = Image.new("RGBA", mask.size, GOLD + (0,)); im.putalpha(mask); return im
# logo A, supersampled x2
k = 2; W, H = 2080 * k, 420 * k
m = Image.new("L", (W, H), 0); d = ImageDraw.Draw(m)
big, small = F(230 * k), F(64 * k)
t = "SHOWDOWN 17"; w = tw(big, t, 18 * k); base = 360 * k
put(d, (W - w) / 2, base, t, big, 18 * k)
st = "CAREER MODE"; w2 = tw(small, st, 26 * k); put(d, (W - w2) / 2, base - 185 * k, st, small, 26 * k)
b = m.getbbox(); pad = 16 * k
m = m.crop((b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad))
logo = flat(m)
for w in (2080, 1040, 640):
    r = logo.resize((w, round(logo.height * w / logo.width)), Image.LANCZOS)
    r.save(f"{OUT}/LOGO_CM17_WORDMARK_V4_{w}.webp", lossless=False, quality=90, method=6, exact=False)
# title samples, V3 geometry: one canvas height 300 at 3840 step, cap 150, baseline 210
def title(text, h=300, cap=150, base=210, ss=2):
    probe = F(1000); l, tt, r, bb = probe.getbbox("H"); px = round(cap / ((bb - tt) / 1000) * ss)
    fn = F(px); tr = 0.06 * px
    w = tw(fn, text.upper(), tr); W = int(w + 40 * ss)
    m = Image.new("L", (W, h * ss), 0); put(ImageDraw.Draw(m), 20 * ss, base * ss, text.upper(), fn, tr)
    im = flat(m); return im.resize((W // ss, h), Image.LANCZOS)
for name, text in (("HISTORY", "History"), ("TRANSFER", "Transfer War"), ("FINAL_WINNER", "Showdown Champion")):
    title(text).save(f"{OUT}/TITLE_{name}_FLAT_SAMPLE.png")
