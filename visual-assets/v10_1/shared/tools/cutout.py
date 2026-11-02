#!/usr/bin/env python3
"""Registered, straight-alpha PNG cut-outs. Runtime dependencies: Pillow, NumPy.

Coordinates are 1X plate pixels, even with --source-scale 2. Masks are refined
locally; geometry remains authoritative where foreground/background are alike.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def select_key(document, key):
    value = document
    for part in key.split('.'):
        value = value[int(part)] if isinstance(value, list) else value[part]
    return value


def polygons_from(value):
    if isinstance(value, dict):
        value = value.get('polygons', value.get('polygon'))
    a = np.asarray(value, dtype=object)
    if a.ndim == 2 and a.shape[-1] == 2:
        value = [value]
    if not isinstance(value, list) or not value:
        raise ValueError('Expected a polygon or list of polygons, not a box')
    result = []
    for poly in value:
        p = np.asarray(poly, dtype=np.float64)
        if p.ndim != 2 or p.shape[1] != 2 or len(p) < 3 or not np.isfinite(p).all():
            raise ValueError('Each polygon needs at least three finite [x,y] points')
        area = abs(np.sum(p[:, 0] * np.roll(p[:, 1], -1)
                          - p[:, 1] * np.roll(p[:, 0], -1))) / 2
        if area < 0.5:
            raise ValueError('Polygon has no useful area')
        result.append(p)
    return result


def linear(rgb):
    rgb = rgb / 255.0
    return np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + .055) / 1.055) ** 2.4)


def srgb(rgb):
    rgb = np.clip(rgb, 0, 1)
    return np.where(rgb <= .0031308, 12.92 * rgb, 1.055 * rgb ** (1 / 2.4) - .055)


def box_sum(array, radius):
    """O(pixels) local sums without SciPy/OpenCV or huge sliding-window arrays."""
    a = np.pad(array, ((radius, radius), (radius, radius)), mode='constant')
    s = np.pad(a.cumsum(0, dtype=np.float64).cumsum(1), ((1, 0), (1, 0)))
    n = 2 * radius + 1
    return s[n:, n:] - s[:-n, n:] - s[n:, :-n] + s[:-n, :-n]


def local_colour(rgb, samples, radius, fallback):
    count = box_sum(samples.astype(np.float64), radius)
    mean = np.stack([box_sum(rgb[..., k] * samples, radius)
                     / np.maximum(count, 1) for k in range(3)], axis=-1)
    mean[count == 0] = fallback
    return mean, count


def morph(mask, radius, grow=False):
    if radius <= 0:
        return mask.copy()
    # Integer kernel radii are scaled with the plate density.
    return mask.filter((ImageFilter.MaxFilter if grow else ImageFilter.MinFilter)
                       (2 * radius + 1))


def extract(plate, polygons, scale=1, erode=1, feather=1):
    """Return a full-size RGBA layer, preserving interior plate RGB exactly."""
    width, height = plate.size
    points = np.concatenate(polygons) * scale
    margin = int(math.ceil((14 + feather * 4 + erode) * scale))
    x0, y0 = np.maximum(np.floor(points.min(0)).astype(int) - margin, 0)
    x1, y1 = np.minimum(np.ceil(points.max(0)).astype(int) + margin + 1,
                        [width, height])
    size = (int(x1 - x0), int(y1 - y0))
    ss = 4
    high = Image.new('L', (size[0] * ss, size[1] * ss))
    draw = ImageDraw.Draw(high)
    for poly in polygons:
        draw.polygon([((x * scale - x0) * ss, (y * scale - y0) * ss)
                      for x, y in poly], fill=255)
    coverage = high.resize(size, Image.Resampling.LANCZOS)
    binary = coverage.point(lambda a: 255 if a >= 128 else 0)
    inside = morph(binary, 2 * scale)
    grown = morph(binary, 2 * scale, grow=True)
    core = np.asarray(inside) > 0
    exterior = (np.asarray(morph(binary, 8 * scale, grow=True)) > 0) & (np.asarray(grown) == 0)
    rgba = np.asarray(plate.crop((x0, y0, x1, y1))).copy()
    source_alpha = rgba[..., 3] / 255.0
    core &= source_alpha > .99
    exterior &= source_alpha > .99
    if not core.any():
        raise ValueError('Polygon too thin for 2 px edge refinement; enlarge the contour')
    rgb = linear(rgba[..., :3].astype(np.float64))
    fg, nf = local_colour(rgb, core, 6 * scale, rgb[core].mean(0))
    bg_default = rgb[exterior].mean(0) if exterior.any() else rgb[core].mean(0)
    bg, nb = local_colour(rgb, exterior, 6 * scale, bg_default)
    delta = fg - bg
    contrast = np.sum(delta * delta, axis=-1)
    distance_fg = np.sum((rgb - fg) ** 2, axis=-1)
    distance_bg = np.sum((rgb - bg) ** 2, axis=-1)
    band = (np.asarray(grown) > 0) & ~core
    supported = (nf >= 3) & (nb >= 3) & (contrast > .008)
    geometry = np.asarray(coverage).astype(np.float64)
    refined = geometry.copy()
    decide = band & supported
    choice = np.where(distance_fg < distance_bg, 255, 0)
    # Colour is guidance, not permission to invent a jagged silhouette. A plate
    # often has skin, pinstripes and gold light in one tiny neighbourhood. Keep
    # the hand-drawn contour authoritative and adjust only its subpixel edge.
    refined[decide] = .8 * geometry[decide] + .2 * choice[decide]
    smoothed = Image.fromarray(np.rint(refined).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(.35 * scale))
    refined = smoothed.point(lambda a: 255 if a >= 128 else 0)
    # Geometry-only where local colour cannot distinguish foreground/background.
    clean = morph(refined, int(round(erode * scale)))
    alpha = np.asarray(clean.filter(ImageFilter.GaussianBlur(feather * scale))).astype(np.float64) / 255
    alpha *= source_alpha
    # Flattened plate edge = t*foreground + (1-t)*background. Estimate t from
    # colour projection, NOT from the new feather alpha (straight RGB must never
    # be divided by the new output alpha). Recover in linear light, clamp, then
    # pull toward the nearby interior colour to suppress unstable matte spill.
    t = np.clip(np.sum((rgb - bg) * delta, axis=-1) / np.maximum(contrast, 1e-8), .2, 1)
    original = np.asarray(coverage).astype(np.float64) / 255
    edge = (alpha > 0) & (alpha < .995)
    mixed = edge & supported & ((original < .999) | (t < .98))
    recovered = np.clip((rgb - (1 - t[..., None]) * bg) / t[..., None], 0, 1)
    # Unmatting is ill-conditioned near tiny highlights. Bound recovery around
    # the inside estimate to prevent saturated green/red single-pixel speckles.
    recovered = np.clip(recovered, np.maximum(fg - .08, 0), np.minimum(fg + .08, 1))
    strength = np.clip(1 - alpha, 0, 1)[..., None]
    corrected = recovered * (1 - .6 * strength) + fg * (.6 * strength)
    rgb[mixed] = (rgb * (1 - strength) + corrected * strength)[mixed]
    # Only fringe RGB changes. Opaque original pixels stay byte-identical.
    rgba[mixed, :3] = np.rint(srgb(rgb[mixed]) * 255).astype(np.uint8)
    rgba[..., 3] = np.rint(alpha * 255).astype(np.uint8)
    rgba[rgba[..., 3] == 0, :3] = 0
    result = Image.new('RGBA', plate.size)
    result.paste(Image.fromarray(rgba), (int(x0), int(y0)))
    if result.getbbox() is None:
        raise ValueError('Erosion removed the entire cut-out')
    return result


def resize_rgba(im, size):
    """Resample premultiplied channels, then return straight alpha; no black halo."""
    # Pillow RGBA Lanczos resampling performs the necessary premultiplication.
    out = im.resize(size, Image.Resampling.LANCZOS)
    a = np.asarray(out).copy()
    a[a[..., 3] == 0, :3] = 0
    return Image.fromarray(a)


def report(path, im, role):
    im.save(path, optimize=True)
    return {'role': role, 'path': str(path), 'size': list(im.size),
            'bbox': list(im.getbbox()) if im.getbbox() else None,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def rim_mask(layer, scale):
    """Outer-only 3 logical px alpha band; white RGB so CSS can tint it."""
    alpha = layer.getchannel('A')
    outer = np.asarray(morph(alpha, 3 * scale, grow=True)).astype(np.int16)
    band = np.maximum(outer - np.asarray(alpha).astype(np.int16), 0).astype(np.uint8)
    rgba = np.zeros((layer.height, layer.width, 4), dtype=np.uint8)
    rgba[band > 0, :3] = 255
    rgba[..., 3] = band
    return Image.fromarray(rgba)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plate', required=True, type=Path)
    parser.add_argument('--map', type=Path, help='Platemap JSON; keys use dot-separated paths')
    parser.add_argument('--key', help='Polygon/list key, or bounds key with --polygon')
    parser.add_argument('--polygon', help='Inline JSON points, or @file containing points')
    parser.add_argument('--output', required=True, type=Path, help='Filename stem, without _1X/_2X')
    parser.add_argument('--source-scale', type=int, choices=(1, 2), default=1)
    parser.add_argument('--erode', type=int, choices=(0, 1, 2), default=1, help='1X pixels; 0 for hair')
    parser.add_argument('--feather', type=float, default=1, help='Gaussian radius in 1X px, 0..3')
    parser.add_argument('--rim', action='store_true', help='Also export a white outer 3 px alpha band at both densities')
    args = parser.parse_args()
    try:
        if not 0 <= args.feather <= 3 or not math.isfinite(args.feather):
            raise ValueError('--feather must be finite and between 0 and 3')
        if bool(args.map) != bool(args.key):
            raise ValueError('--map and --key must be supplied together')
        if not args.polygon and not args.map:
            raise ValueError('Supply --polygon or --map with --key')
        mapped = None
        document = None
        if args.map:
            document = json.loads(args.map.read_text())
            mapped = select_key(document, args.key)
        value = mapped
        if args.polygon:
            value = json.loads(Path(args.polygon[1:]).read_text()
                               if args.polygon.startswith('@') else args.polygon)
        polygons = polygons_from(value)
        with Image.open(args.plate) as src:
            if src.format != 'PNG':
                raise ValueError('The plate must be a PNG master')
            plate = src.convert('RGBA')
        scale = args.source_scale
        if any(v % scale for v in plate.size):
            raise ValueError('Source dimensions must divide evenly by source scale')
        one_size = tuple(v // scale for v in plate.size)
        if document and 'plate_1x_size' in document and tuple(document['plate_1x_size']) != one_size:
            raise ValueError('Plate size does not match platemap plate_1x_size')
        if mapped is not None and args.polygon:
            bounds = np.asarray(mapped, dtype=np.float64)
            if bounds.shape != (4,) or not np.isfinite(bounds).all() or np.any(bounds[2:] <= bounds[:2]):
                raise ValueError('With --polygon, --key must select [x0,y0,x1,y1] bounds')
        else:
            bounds = np.array([0, 0, *one_size], dtype=np.float64)
        for poly in polygons:
            if np.any(poly < bounds[:2]) or np.any(poly > bounds[2:]) or np.any(poly < 0) or np.any(poly > one_size):
                raise ValueError('Polygon lies outside the plate or selected map bounds')
        stem = args.output
        if stem.suffix.lower() == '.png':
            stem = stem.with_suffix('')
        if stem.name.endswith(('_1X', '_2X')):
            raise ValueError('--output is a stem; omit the _1X/_2X suffix')
        stem.parent.mkdir(parents=True, exist_ok=True)
        native = extract(plate, polygons, scale, args.erode, args.feather)
        outputs = []
        for density in (1, 2):
            size = tuple(v * density for v in one_size)
            layer = native if size == native.size else resize_rgba(native, size)
            path = stem.with_name(stem.name + f'_{density}X.png')
            outputs.append(report(path, layer, 'cutout'))
            if args.rim:
                path = stem.with_name(stem.name + f'_RIM_{density}X.png')
                outputs.append(report(path, rim_mask(layer, density), 'rim'))
        print(json.dumps({'source': str(args.plate), 'source_scale': scale,
                          'coordinate_units': '1X plate px', 'polygons': len(polygons),
                          'erode_px_1x': args.erode, 'feather_radius_px_1x': args.feather,
                          'outputs': outputs}, indent=2))
    except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
        parser.exit(2, f'cutout: {error}\n')


if __name__ == '__main__':
    main()
