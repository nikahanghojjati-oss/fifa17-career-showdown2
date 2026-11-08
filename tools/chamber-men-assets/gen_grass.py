"""Chamber Men pitch grass (r90): TextureCan "Ground 0040", football grass with alternating bands, CC0.

Source: https://texturecan.com/details/469 (Nik downloaded the 2K and 4K zips on 2026-11-07; the zips are not in the repo).
One size per device level (js/gfxTier.js; js/chamberMenStadium3d.js GRASS):
  grass_color_V2_{1k,2k,4k}.webp   colour (sRGB), from ground_0040_color_4k.jpg
  grass_normal_V2_{512,1k,2k}.webp normal (OpenGL +Y), from ground_0040_normal_opengl_4k.png

Run: python3 -I gen_grass.py <ground_0040_4k zip or folder> [out dir]
"""
import os
import sys
import tempfile
import zipfile

from PIL import Image


def main(src, out):
    if zipfile.is_zipfile(src):
        tmp = tempfile.mkdtemp()
        zipfile.ZipFile(src).extractall(tmp)
        src = tmp
    colour = Image.open(os.path.join(src, 'ground_0040_color_4k.jpg')).convert('RGB')
    normal = Image.open(os.path.join(src, 'ground_0040_normal_opengl_4k.png')).convert('RGB')
    os.makedirs(out, exist_ok=True)
    sizes = {}
    for size, tag, q in ((4096, '4k', 72), (2048, '2k', 80), (1024, '1k', 80)):
        name = f'grass_color_V2_{tag}.webp'
        (colour if size == 4096 else colour.resize((size, size), Image.LANCZOS)).save(os.path.join(out, name), quality=q, method=6)
        sizes[name] = os.path.getsize(os.path.join(out, name))
    for size, tag in ((2048, '2k'), (1024, '1k'), (512, '512')):
        name = f'grass_normal_V2_{tag}.webp'
        normal.resize((size, size), Image.LANCZOS).save(os.path.join(out, name), quality=75, method=6)
        sizes[name] = os.path.getsize(os.path.join(out, name))
    for k, v in sizes.items():
        print(f'{k} {v // 1024} KB')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '../../visual-assets/v10_1/chamber-men/assets'))
