"""Chamber Men match ball (r90 art brief: "a scuffed 32-panel ball"): Innerscene "Soccer ball" (CC0 1.0), Nik's download 2026-11-07.

Source: https://www.innerscene.com/tools/library/3d-parts/soccer-ball-f39dfd50 (the GLB is not in the repo). Its 12,288-triangle mesh
carries the 32-panel UV layout; its two 2048 px JPEG maps (base colour, normal) are re-made here as one size per device level, with
match wear (scuffs, grass stains, grey grime in the seams) baked into the colour and the roughness. Deterministic: seed 90.

  ball_mesh_V3.glb                 the mesh only (positions, normals, UVs, indices; no images or materials)
  ball_color_V3_{512,1k,2k}.webp   colour (sRGB), scuffed
  ball_normal_V3_{512,1k,2k}.webp  normal (glTF/OpenGL +Y), from the source
  ball_orm_V3_{512,1k,2k}.webp     R occlusion 1, G roughness (worn panels rougher), B metalness 0

Run: python3 -I gen_ball_v3.py <soccer-ball.glb> [out dir]
"""
import io
import json
import os
import struct
import sys

import numpy as np
from PIL import Image, ImageFilter


def read_glb(path):
    b = open(path, 'rb').read()
    n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n])
    off = 20 + n + 8
    return j, b[off:]


def view(j, binary, i):
    bv = j['bufferViews'][i]
    o = bv.get('byteOffset', 0)
    return binary[o:o + bv['byteLength']]


def mesh_only(j, binary):
    prim = j['meshes'][0]['primitives'][0]
    acc_ids = [prim['attributes']['POSITION'], prim['attributes']['NORMAL'], prim['attributes']['TEXCOORD_0'], prim['indices']]
    chunks, views, accs = [], [], []
    for k, a in enumerate(acc_ids):
        acc = dict(j['accessors'][a])
        data = view(j, binary, acc['bufferView'])
        off = sum(len(c) for c in chunks)
        chunks.append(data + b'\0' * ((4 - len(data) % 4) % 4))
        v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
        if 'target' in j['bufferViews'][acc['bufferView']]:
            v['target'] = j['bufferViews'][acc['bufferView']]['target']
        views.append(v)
        acc['bufferView'] = k
        acc.pop('byteOffset', None)
        accs.append(acc)
    blob = b''.join(chunks)
    out = {'asset': {'version': '2.0', 'generator': 'gen_ball_v3.py (Innerscene Soccer ball, CC0 1.0)'},
           'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': 'cmBallMesh'}],
           'meshes': [{'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2}, 'indices': 3}]}],
           'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(blob)}]}
    js = json.dumps(out, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(blob)
    return struct.pack('<III', 0x46546C67, 2, total) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(blob), b'BIN\0') + blob


def noise(size, scale, rng):
    small = rng.random((max(2, size // scale), max(2, size // scale))).astype(np.float32)
    img = Image.fromarray((small * 255).astype(np.uint8)).resize((size, size), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255


def wear(colour, rng):
    size = colour.shape[0]
    blot = noise(size, 64, rng) * .6 + noise(size, 16, rng) * .4  # grime patches
    grime = np.clip((blot - .55) * 3.2, 0, 1)
    grass = np.clip((noise(size, 96, rng) - .72) * 5, 0, 1) * np.clip((noise(size, 24, rng) - .4) * 3, 0, 1)
    scratch = np.zeros((size, size), np.float32)
    for _ in range(160):  # short boot scuffs: thin bright-grey strokes
        x, y = rng.integers(0, size, 2)
        ang, ln = rng.random() * np.pi, rng.integers(size // 60, size // 18)
        for t in range(ln):
            xx, yy = int(x + np.cos(ang) * t) % size, int(y + np.sin(ang) * t) % size
            scratch[yy, xx] = 1
    scratch = np.asarray(Image.fromarray((scratch * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(size / 1400)), np.float32) / 255
    c = colour.astype(np.float32) / 255
    light = (c.mean(axis=2) > .5)[..., None]
    dirt = np.array([.62, .6, .55], np.float32)
    turf = np.array([.42, .5, .3], np.float32)
    c = c * (1 - .16 * grime[..., None] * light) + dirt * .16 * grime[..., None] * light
    c = c * (1 - .22 * grass[..., None] * light) + turf * .22 * grass[..., None] * light
    c = c * (1 - .5 * scratch[..., None]) + np.array([.78, .77, .74], np.float32) * .5 * scratch[..., None]
    rough = .42 + .22 * grime + .2 * scratch + .12 * grass
    return (np.clip(c, 0, 1) * 255).astype(np.uint8), np.clip(rough, 0, 1)


def main(src, out):
    j, binary = read_glb(src)
    imgs = {im['name']: Image.open(io.BytesIO(view(j, binary, im['bufferView']))).convert('RGB') for im in j['images']}
    base = next(v for k, v in imgs.items() if 'base' in k)
    normal = next(v for k, v in imgs.items() if 'normal' in k)
    os.makedirs(out, exist_ok=True)
    rng = np.random.default_rng(90)
    colour, rough = wear(np.asarray(base.resize((2048, 2048), Image.LANCZOS)), rng)
    orm = np.stack([np.full_like(rough, 1), rough, np.zeros_like(rough)], axis=2)
    maps = {'color': Image.fromarray(colour), 'normal': normal.resize((2048, 2048), Image.LANCZOS), 'orm': Image.fromarray((orm * 255).astype(np.uint8))}
    sizes = {}
    for size, tag in ((2048, '2k'), (1024, '1k'), (512, '512')):
        for kind, im in maps.items():
            name = f'ball_{kind}_V3_{tag}.webp'
            im.resize((size, size), Image.LANCZOS).save(os.path.join(out, name), quality=82 if kind == 'color' else 78, method=6)
            sizes[name] = os.path.getsize(os.path.join(out, name))
    glb = mesh_only(j, binary)
    open(os.path.join(out, 'ball_mesh_V3.glb'), 'wb').write(glb)
    sizes['ball_mesh_V3.glb'] = len(glb)
    for k, v in sizes.items():
        print(f'{k} {v // 1024} KB')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '../../visual-assets/v10_1/chamber-men/assets'))
