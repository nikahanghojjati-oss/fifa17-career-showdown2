"""r90 big stadium for Chamber Men (High and above): Innerscene "Football stadium" (CC0 1.0, innerscene.com; Nik's download
2026-11-07), trimmed to what the penalty camera can see and re-packed small.

    python3 gen_bowl.py <source football stadium .glb>

Writes visual-assets/v10_1/chamber-men/assets/stadium_bowl_V1_1k.glb (High, Extra and Ultra):
- keeps the bowl (lower and upper tiers, concourse, hospitality band, roof, trusses, floodlights, facade, stair cores) and
  drops what Chamber Men draws itself or never sees (pitch, pitch surround, goals, perimeter boards, dugouts, gates);
- textures re-encoded as WebP (EXT_texture_webp, in the vendored three r187), colour maps at 1k, normal maps at 512;
- glass loses KHR_materials_transmission (three draws a whole extra pass for it) and becomes a plain see-through tint;
- no tangents (three derives them for normal maps), 16-bit indices;
- the seat rows' centre lines go in the scene's extras (cmRows: [[y, x0, z0, x1, z1, ...], ...]), so the card crowd sits
  on the real rows without the browser reading the mesh.
Coordinates stay the source's (metres, Y up, goals on the x axis); js/chamberMenStadium3d.js turns the bowl onto its axes.
"""
import io
import json
import os
import struct
import sys

import numpy as np
from PIL import Image

KEEP = ["Concourse", "Facade screen", "Floodlights", "Hospitality boxes", "Hospitality glass", "Lower tier", "Roof",
        "Roof translucent edge", "Roof trusses", "Screen fins", "Stair cores", "Stair core windows", "Upper tier"]
OUT = os.path.join(os.path.dirname(__file__), "../../visual-assets/v10_1/chamber-men/assets")


def read_glb(path):
    b = open(path, "rb").read()
    n = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + n])
    m = struct.unpack("<I", b[20 + n:24 + n])[0]
    return j, b[28 + n:28 + n + m]


def accessor(j, binary, i):
    a = j["accessors"][i]
    bv = j["bufferViews"][a["bufferView"]]
    comp = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}[a["componentType"]]
    nc = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[a["type"]]
    off = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    assert not bv.get("byteStride") or bv["byteStride"] == np.dtype(comp).itemsize * nc
    return np.frombuffer(binary, dtype=comp, count=a["count"] * nc, offset=off).reshape(-1, nc)


def seat_rows(j, binary):
    """Each seat row's tread centre line: at every tread height the inner and outer edge loops; their mid line, ordered
    round the bowl."""
    rows = []
    for mesh in j["meshes"]:
        if mesh["name"] not in ("Lower tier", "Upper tier"):
            continue
        for p in mesh["primitives"]:
            if "seat" not in j["materials"][p["material"]]["name"].lower():
                continue
            P = accessor(j, binary, p["attributes"]["POSITION"])
            for y in np.unique(np.round(P[:, 1], 2)):
                s = P[np.abs(P[:, 1] - y) < .005]
                ang = np.arctan2(s[:, 2], s[:, 0])
                # Inner and outer loops: per direction, the two smallest "rectangular radii" at this height.
                r = np.maximum(np.abs(s[:, 0]) - 55, 0) ** 2 + np.maximum(np.abs(s[:, 2]) - 35, 0) ** 2
                inner = s[r <= np.median(r)]
                outer = s[r > np.median(r)]
                if len(inner) < 8 or len(outer) < 8:
                    continue
                ai = np.arctan2(inner[:, 2], inner[:, 0])
                order = np.argsort(ai)
                inner = inner[order]
                ao = np.arctan2(outer[:, 2], outer[:, 0])
                mids = []
                for v in inner:
                    a = np.arctan2(v[2], v[0])
                    k = np.argmin(np.abs(np.angle(np.exp(1j * (ao - a)))))
                    mids.append(((v[0] + outer[k][0]) / 2, (v[2] + outer[k][2]) / 2))
                flat = [round(float(y), 3)]
                for x, z in mids:
                    flat += [round(float(x), 3), round(float(z), 3)]
                rows.append(flat)
    return rows


def webp(data, size, normal):
    im = Image.open(io.BytesIO(data))
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    if max(im.size) > size:
        k = size / max(im.size)
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, "WEBP", quality=90 if normal else 82, method=6)
    return out.getvalue()


def build(src, size):
    j, binary = read_glb(src)
    rows = seat_rows(j, binary)
    keep_mesh = [i for i, m in enumerate(j["meshes"]) if m["name"] in KEEP]
    mesh_map = {old: new for new, old in enumerate(keep_mesh)}
    nodes = [n for n in j["nodes"] if n.get("mesh") in mesh_map]
    for n in nodes:
        n["mesh"] = mesh_map[n["mesh"]]
    meshes = [j["meshes"][i] for i in keep_mesh]

    # Materials and textures the kept meshes use.
    used_mats = sorted({p["material"] for m in meshes for p in m["primitives"] if "material" in p})
    mat_map = {old: new for new, old in enumerate(used_mats)}
    materials = []
    for old in used_mats:
        m = json.loads(json.dumps(j["materials"][old]))
        ext = m.get("extensions", {})
        if "KHR_materials_transmission" in ext:
            ext.pop("KHR_materials_transmission", None)
            ext.pop("KHR_materials_ior", None)
            pbr = m.setdefault("pbrMetallicRoughness", {})
            c = pbr.get("baseColorFactor", [1, 1, 1, 1])
            pbr["baseColorFactor"] = [c[0] * .35, c[1] * .4, c[2] * .45, .35]
            m["alphaMode"] = "BLEND"
        if not ext:
            m.pop("extensions", None)
        materials.append(m)
    for m in meshes:
        for p in m["primitives"]:
            if "material" in p:
                p["material"] = mat_map[p["material"]]

    tex_used = []

    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k.endswith("Texture") and isinstance(v, dict) and "index" in v:
                    tex_used.append((v, k))
                else:
                    walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(materials)
    tex_old = sorted({v["index"] for v, _ in tex_used})
    tex_map = {old: new for new, old in enumerate(tex_old)}
    normal_tex = {v["index"] for v, k in tex_used if k == "normalTexture"}
    for v, _ in tex_used:
        v["index"] = tex_map[v["index"]]

    out_bin = bytearray()
    views = []

    def add_view(data, target=None):
        while len(out_bin) % 4:
            out_bin.append(0)
        views.append({"buffer": 0, "byteOffset": len(out_bin), "byteLength": len(data), **({"target": target} if target else {})})
        out_bin.extend(data)
        return len(views) - 1

    images, textures = [], []
    img_done = {}
    for old in tex_old:
        t = j["textures"][old]
        src_img = t.get("source")
        if src_img not in img_done:
            im = j["images"][src_img]
            bv = j["bufferViews"][im["bufferView"]]
            data = binary[bv.get("byteOffset", 0):bv.get("byteOffset", 0) + bv["byteLength"]]
            normal = old in normal_tex
            v = add_view(webp(data, size // 2 if normal else size, normal))
            images.append({"name": im.get("name", ""), "mimeType": "image/webp", "bufferView": v})
            img_done[src_img] = len(images) - 1
        nt = {"extensions": {"EXT_texture_webp": {"source": img_done[src_img]}}}
        if "sampler" in t:
            nt["sampler"] = 0
        textures.append(nt)

    accessors = []
    acc_map = {}

    def take(i, target, small=False):
        if i in acc_map:
            return acc_map[i]
        a = json.loads(json.dumps(j["accessors"][i]))
        arr = accessor(j, binary, i)
        if small and arr.max() < 65536 and a["componentType"] == 5125:
            arr = arr.astype(np.uint16)
            a["componentType"] = 5123
        a["bufferView"] = add_view(arr.tobytes(), target)
        a.pop("byteOffset", None)
        accessors.append(a)
        acc_map[i] = len(accessors) - 1
        return acc_map[i]
    for m in meshes:
        for p in m["primitives"]:
            # three needs no tangents for these normal maps (it derives them per pixel), and one bowl index fits 16 bits.
            p["attributes"] = {k: take(v, 34962) for k, v in p["attributes"].items() if k != "TANGENT"}
            if "indices" in p:
                p["indices"] = take(p["indices"], 34963, small=True)

    root = {"name": "cmBowl", "children": list(range(len(nodes)))}
    out = {
        "asset": {"version": "2.0", "generator": "tools/chamber-men-assets/gen_bowl.py",
                  "copyright": "Innerscene Corp (innerscene.com) Football stadium, CC0 1.0; trimmed and re-packed for Chamber Men"},
        "extensionsUsed": ["EXT_texture_webp"], "extensionsRequired": ["EXT_texture_webp"],
        "scene": 0, "scenes": [{"name": "cmBowl", "nodes": [len(nodes)], "extras": {"cmRows": rows}}],
        "nodes": nodes + [root], "meshes": meshes, "materials": materials, "textures": textures, "images": images,
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}],
        "accessors": accessors, "bufferViews": views, "buffers": [{"byteLength": len(out_bin)}],
    }
    js = json.dumps(out, separators=(",", ":")).encode()
    js += b" " * ((4 - len(js) % 4) % 4)
    while len(out_bin) % 4:
        out_bin.append(0)
    glb = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out_bin))
    glb += struct.pack("<II", len(js), 0x4E4F534A) + js + struct.pack("<II", len(out_bin), 0x004E4942) + bytes(out_bin)
    return glb, len(rows)


if __name__ == "__main__":
    for size, tag in ((1024, "1k"),):
        glb, n = build(sys.argv[1], size)
        path = os.path.join(OUT, f"stadium_bowl_V1_{tag}.glb")
        open(path, "wb").write(glb)
        print(path, len(glb) // 1024, "KB,", n, "seat rows")
