"""The Showdown match ball: an original design (no real maker's graphics), 32-panel thermo-bonded build.

Panel layout is the classic truncated icosahedron (12 pentagons, 20 hexagons). Graphics: on every pentagon a black
three-blade gold-edged star that sweeps out over the neighbouring hexagons, the way a 2016-17 match ball reads at
speed, on a warm pearl-white skin with a fine pebble grain.

Maps (equirectangular, for THREE.SphereGeometry's own uv, flipY true):
  ball_color_{4k,2k}.webp   sRGB colour
  ball_normal_{4k,2k}.webp  tangent-space normal (OpenGL +Y), seams pressed in, print slightly raised, pebble grain
  ball_orm_{4k,2k}.webp    G roughness, B metalness (the gold foil), R unused: use it as roughnessMap AND metalnessMap
"""
import numpy as np
from common import save_webp, resize, normal_from_height, value_noise3

R = 0.11  # ball radius in metres (size 5: 68-70 cm round)


def centres():
    p = (1 + 5 ** .5) / 2
    ico = np.array([[0, 1, p], [0, -1, p], [0, 1, -p], [0, -1, -p], [1, p, 0], [-1, p, 0], [1, -p, 0], [-1, -p, 0],
                    [p, 0, 1], [-p, 0, 1], [p, 0, -1], [-p, 0, -1]], float)
    ico /= np.linalg.norm(ico, axis=1)[:, None]
    faces = []
    for a in range(12):
        for b in range(a + 1, 12):
            for c in range(b + 1, 12):
                if ico[a] @ ico[b] > .4 and ico[a] @ ico[c] > .4 and ico[b] @ ico[c] > .4:
                    v = ico[a] + ico[b] + ico[c]
                    faces.append(v / np.linalg.norm(v))
    # Tilt the whole ball so no pentagon sits on a texture pole (keeps the print crisp where the uv pinches).
    ang = .37
    rot = np.array([[1, 0, 0], [0, np.cos(ang), -np.sin(ang)], [0, np.sin(ang), np.cos(ang)]]) @ \
        np.array([[np.cos(.21), 0, np.sin(.21)], [0, 1, 0], [-np.sin(.21), 0, np.cos(.21)]])
    return ico @ rot.T, np.array(faces) @ rot.T


def tangent_frame(c):
    up = np.array([0, 1, 0.]) if abs(c[1]) < .9 else np.array([1, 0, 0.])
    t = np.cross(up, c); t /= np.linalg.norm(t)
    b = np.cross(c, t)
    return t, b


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def build(W, H):
    pents, hexes = centres()
    allc = np.vstack([pents, hexes])
    bias = np.concatenate([np.full(12, -.035), np.zeros(20)])  # pentagons are smaller in angle
    frames = [tangent_frame(c) for c in pents]
    col = np.zeros((H, W, 3), np.float32)
    hgt = np.zeros((H, W), np.float32)
    rough = np.zeros((H, W), np.float32)
    metal = np.zeros((H, W), np.float32)
    xs = (np.arange(W) + .5) / W * 2 * np.pi
    for y0 in range(0, H, 128):
        rows = np.arange(y0, min(H, y0 + 128))
        th = ((rows + .5) / H * np.pi)[:, None]
        st, ct = np.sin(th), np.cos(th)
        v = np.stack([-np.cos(xs)[None, :] * st, np.repeat(ct, W, 1), np.sin(xs)[None, :] * st], -1)  # (h,W,3)
        dots = v @ allc.T + bias  # (h,W,32)
        order = np.argsort(-dots, axis=-1)
        best = np.take_along_axis(dots, order[..., :1], -1)[..., 0]
        second = np.take_along_axis(dots, order[..., 1:2], -1)[..., 0]
        edge = best - second
        # Nearest pentagon (for the print), any panel.
        pd = v @ pents.T
        pi = np.argmax(pd, -1)
        pc = pents[pi]
        cosd = np.clip(np.sum(v * pc, -1), -1, 1)
        r = np.arccos(cosd)  # angular distance to pentagon centre
        tt = np.stack([frames[i][0] for i in range(12)])[pi]
        bb = np.stack([frames[i][1] for i in range(12)])[pi]
        a = np.arctan2(np.sum(v * bb, -1), np.sum(v * tt, -1))
        # Three swept blades: radius grows with a twist, so each blade curls like a turbine.
        twist = 2.1
        phase = 3 * (a - twist * r) + pi * 1.7
        lobe = np.maximum(0, np.cos(phase)) ** 2.4
        rad = .2 + .34 * lobe  # angular radius of the star at this angle
        d = r - rad
        inside = smooth(.003, -.003, d)  # 1 inside the star, anti-aliased edge
        rim = smooth(.0035, .0005, np.abs(d - .0075))  # thin gold keyline just outside the edge
        grain = value_noise3(v, 260, 3) * .6 + value_noise3(v, 610, 9) * .4
        pearl = np.array([.95, .94, .915]) * (0.985 + .03 * value_noise3(v, 6, 1)[..., None])
        black = np.array([.03, .029, .03])
        gold = np.array([.86, .64, .25])
        goldHi = np.array([1.0, .84, .47])
        c = pearl * (1 - inside[..., None]) + black * inside[..., None]
        # A gold streak along the middle of each blade, out toward the tip (a printed metallic foil line).
        mid = smooth(.05, .0, np.abs(np.sin((phase - np.round(phase / (2 * np.pi)) * 2 * np.pi) / 2))) * smooth(.2, .32, r) * inside
        c = c * (1 - mid[..., None]) + gold * mid[..., None]
        c = c * (1 - rim[..., None]) + goldHi * rim[..., None]
        # Pentagon core: a gold ring on black with a fine guilloche.
        ring = smooth(.006, .002, np.abs(r - .085))
        c = c * (1 - ring[..., None]) + goldHi * ring[..., None]
        guill = (np.sin(r * 900) * .5 + .5) * smooth(.08, .07, r) * .08
        c = c + guill[..., None] * gold
        foil = np.maximum.reduce([rim, ring, mid])
        # Seams: a soft crease between panels (the normal map does the real shading).
        seam = smooth(.009, .0, edge)
        c = c * (1 - .28 * seam[..., None])
        c = c * (1 - .04 * (grain[..., None] - .5))
        col[rows] = c
        # Height (metres): seam groove ~0.6 mm deep, print raised 0.04 mm, pebble 0.05 mm.
        hgt[rows] = (-.0007 * seam ** 1.5 + .00004 * np.maximum(inside, foil) + .00005 * (grain - .5)).astype(np.float32)
        rough[rows] = np.clip(.44 + .2 * seam - .08 * inside - .22 * foil + .06 * (grain - .5), 0, 1)
        metal[rows] = foil
    th = (np.arange(H) + .5) / H * np.pi
    px_u = (2 * np.pi * R * np.maximum(np.sin(th), .05) / W)[:, None]
    px_v = np.pi * R / H
    nrm = normal_from_height(hgt, px_u, px_v)
    orm = np.stack([np.ones_like(rough), rough, metal], -1)  # glTF order: R occlusion (unused), G roughness, B metalness
    return col, nrm, orm


def main():
    col, nrm, orm = build(4096, 2048)
    sizes = {}
    sizes['ball_color_4k.webp'] = save_webp(col, 'ball_color_4k.webp', 90)
    sizes['ball_normal_4k.webp'] = save_webp(nrm, 'ball_normal_4k.webp', 90)
    sizes['ball_orm_4k.webp'] = save_webp(orm, 'ball_orm_4k.webp', 85)
    sizes['ball_color_2k.webp'] = save_webp(resize(col, 2048, 1024), 'ball_color_2k.webp', 88)
    n2 = resize(nrm * 2 - 1, 2048, 1024)
    n2 /= np.linalg.norm(n2, axis=-1, keepdims=True)
    sizes['ball_normal_2k.webp'] = save_webp(n2 * .5 + .5, 'ball_normal_2k.webp', 88)
    sizes['ball_orm_2k.webp'] = save_webp(resize(orm, 2048, 1024), 'ball_orm_2k.webp', 85)
    return sizes


if __name__ == '__main__':
    for k, v in main().items():
        print(k, round(v / 1024), 'KB')
