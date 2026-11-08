"""r90 M1: the Light and Balanced bodies (body_*_phone.glb) carry their hair / eyelash card texture at 512 px instead of
1024 (premultiplied Lanczos, colour WebP q86, alpha lossless). Nearly all of that file is the soft strand alpha, so a
lossy re-encode alone saved little. At the broadcast framing the hair spans a few dozen pixels, so the GPU already
samples a mip level well under 512; a cold first open at 10 Mbps saves about 0.8 MB. High and above
(body_*_desktop.glb) keep the 2k texture. Close-ups before/after are in PR #1310.
Run after pack-meshopt.mjs:  python3 tools/chamber-men-players/hair-light.py visual-assets/v10_1/chamber-men/players/body_ch38_phone.glb ...
A hair texture already 512 px or smaller is left as it is."""
import io, json, struct, sys
from PIL import Image

QUALITY = 86
SIZE = 512

def pad4(b, fill=b"\0"):
    return b + fill * ((4 - len(b) % 4) % 4)

def run(path):
    raw = open(path, "rb").read()
    jlen = struct.unpack("<I", raw[12:16])[0]
    j = json.loads(raw[20:20 + jlen])
    bin_at = 20 + jlen
    blen = struct.unpack("<I", raw[bin_at:bin_at + 4])[0]
    bin_ = raw[bin_at + 8:bin_at + 8 + blen]
    src = lambda t: j["textures"][t]["extensions"]["EXT_texture_webp"]["source"]
    hair = {src(m["pbrMetallicRoughness"]["baseColorTexture"]["index"]) for m in j["materials"]
            if m.get("name") in ("Hairmat", "Eyelashmat") and m.get("pbrMetallicRoughness", {}).get("baseColorTexture")}
    swap = {}
    for i in hair:
        v = j["bufferViews"][j["images"][i]["bufferView"]]
        data = bin_[v.get("byteOffset", 0):v.get("byteOffset", 0) + v["byteLength"]]
        im = Image.open(io.BytesIO(data)).convert("RGBA")
        if max(im.size) <= SIZE:
            print(f"{path}: image {i} already {im.size[0]} px"); continue
        small = im.convert("RGBa").resize((SIZE, SIZE), Image.LANCZOS).convert("RGBA")
        out = io.BytesIO(); small.save(out, "WEBP", quality=QUALITY, alpha_quality=100, method=4)
        swap[j["images"][i]["bufferView"]] = out.getvalue()
        print(f"{path}: image {i} {len(data)} -> {len(out.getvalue())}")
    if not swap: return
    # Every byte range in buffer 0: plain views, and meshopt's compressed ranges (EXT_meshopt_compression.buffer 0).
    ranges = []
    for k, v in enumerate(j["bufferViews"]):
        if v.get("buffer", 0) == 0: ranges.append((v.get("byteOffset", 0), v["byteLength"], ("view", k)))
        e = v.get("extensions", {}).get("EXT_meshopt_compression")
        if e and e.get("buffer", 0) == 0: ranges.append((e.get("byteOffset", 0), e["byteLength"], ("mo", k)))
    ranges.sort()
    new = b""; moved = {}
    for off, ln, key in ranges:
        if (off, ln) in moved: continue
        data = swap.get(key[1]) if key[0] == "view" and key[1] in swap else bin_[off:off + ln]
        new = pad4(new); moved[(off, ln)] = (len(new), len(data)); new += data
    for off, ln, key in ranges:
        no, nl = moved[(off, ln)]
        if key[0] == "view": j["bufferViews"][key[1]]["byteOffset"] = no; j["bufferViews"][key[1]]["byteLength"] = nl
        else: j["bufferViews"][key[1]]["extensions"]["EXT_meshopt_compression"]["byteOffset"] = no
    new = pad4(new); j["buffers"][0]["byteLength"] = len(new)
    js = pad4(json.dumps(j, separators=(",", ":")).encode(), b" ")
    body = struct.pack("<I", len(js)) + b"JSON" + js + struct.pack("<I", len(new)) + b"BIN\0" + new
    open(path, "wb").write(b"glTF" + struct.pack("<II", 2, 12 + len(body)) + body)
    print(f"{path}: {len(raw)} -> {12 + len(body)}")

for p in sys.argv[1:]: run(p)
