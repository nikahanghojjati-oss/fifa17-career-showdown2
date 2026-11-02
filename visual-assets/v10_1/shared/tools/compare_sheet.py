#!/usr/bin/env python3
"""Build a single visual QA compare sheet.

Usage:
  python3 compare_sheet.py MOCKUP SCREENSHOT OUTPUT.png \
    --box daniel-face:120,90,260,250 \
    --box nik-face:980,80,1120,245 \
    --box daniel-hand:300,350,420,480 \
    --box nik-hand:920,360,1040,500

Each --box is expressed in MOCKUP source pixels. The same normalized region is
sampled from the screenshot. The sheet contains:
  1) mockup and screenshot side by side at the same rendered height,
  2) a true 50% alpha overlay on a shared same-scale canvas,
  3) 4x mockup/build crop pairs for each supplied box.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont

GUTTER = 24
LABEL_H = 28
SECTION_GAP = 28
BG = (16, 16, 16)
FG = (240, 240, 240)
MUTED = (170, 170, 170)


@dataclass(frozen=True)
class Box:
    name: str
    x1: int
    y1: int
    x2: int
    y2: int

    @property
    def width(self) -> int:
        return self.x2 - self.x1

    @property
    def height(self) -> int:
        return self.y2 - self.y1


def parse_box(raw: str) -> Box:
    if ":" not in raw:
        raise argparse.ArgumentTypeError("box must be NAME:x1,y1,x2,y2")
    name, coords = raw.split(":", 1)
    try:
        x1, y1, x2, y2 = (int(v.strip()) for v in coords.split(","))
    except Exception as exc:
        raise argparse.ArgumentTypeError("box coordinates must be four integers") from exc
    if not name.strip() or x2 <= x1 or y2 <= y1 or min(x1, y1) < 0:
        raise argparse.ArgumentTypeError("invalid box bounds")
    return Box(name.strip(), x1, y1, x2, y2)


def fit_height(img: Image.Image, target_h: int) -> Image.Image:
    w = max(1, round(img.width * target_h / img.height))
    return img.resize((w, target_h), Image.Resampling.LANCZOS)


def label(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, fill=FG) -> None:
    draw.text(xy, text, fill=fill, font=ImageFont.load_default())


def centered_on(img: Image.Image, width: int, height: int) -> Image.Image:
    canvas = Image.new("RGB", (width, height), BG)
    canvas.paste(img, ((width - img.width) // 2, (height - img.height) // 2))
    return canvas


def clamp_box(box: Box, width: int, height: int) -> tuple[int, int, int, int]:
    x1 = max(0, min(width - 1, box.x1))
    y1 = max(0, min(height - 1, box.y1))
    x2 = max(x1 + 1, min(width, box.x2))
    y2 = max(y1 + 1, min(height, box.y2))
    return x1, y1, x2, y2


def mapped_box(box: Box, src_size: tuple[int, int], dst_size: tuple[int, int]) -> tuple[int, int, int, int]:
    sw, sh = src_size
    dw, dh = dst_size
    return (
        round(box.x1 / sw * dw),
        round(box.y1 / sh * dh),
        round(box.x2 / sw * dw),
        round(box.y2 / sh * dh),
    )


def crop_zoom_pair(mockup: Image.Image, build: Image.Image, box: Box, zoom: int = 4) -> Image.Image:
    mb = clamp_box(box, mockup.width, mockup.height)
    sb = mapped_box(box, mockup.size, build.size)
    sb = (
        max(0, min(build.width - 1, sb[0])),
        max(0, min(build.height - 1, sb[1])),
        max(1, min(build.width, sb[2])),
        max(1, min(build.height, sb[3])),
    )
    if sb[2] <= sb[0] or sb[3] <= sb[1]:
        raise ValueError(f"box {box.name!r} maps outside screenshot")

    m = mockup.crop(mb).resize(((mb[2] - mb[0]) * zoom, (mb[3] - mb[1]) * zoom), Image.Resampling.NEAREST)
    s = build.crop(sb).resize((m.width, m.height), Image.Resampling.NEAREST)
    tile = Image.new("RGB", (m.width * 2 + GUTTER, m.height + LABEL_H), BG)
    tile.paste(m, (0, LABEL_H))
    tile.paste(s, (m.width + GUTTER, LABEL_H))
    d = ImageDraw.Draw(tile)
    label(d, (0, 8), f"{box.name} · mockup 4x")
    label(d, (m.width + GUTTER, 8), f"{box.name} · build 4x")
    return tile


def hstack(images: Iterable[Image.Image], gutter: int = GUTTER) -> Image.Image:
    items = list(images)
    if not items:
        return Image.new("RGB", (1, 1), BG)
    h = max(i.height for i in items)
    w = sum(i.width for i in items) + gutter * (len(items) - 1)
    out = Image.new("RGB", (w, h), BG)
    x = 0
    for item in items:
        out.paste(item, (x, 0))
        x += item.width + gutter
    return out


def build_sheet(mockup_path: Path, screenshot_path: Path, output_path: Path, boxes: list[Box]) -> None:
    mockup = Image.open(mockup_path).convert("RGB")
    build = Image.open(screenshot_path).convert("RGB")

    target_h = min(mockup.height, build.height)
    m_fit = fit_height(mockup, target_h)
    b_fit = fit_height(build, target_h)

    top_h = target_h + LABEL_H
    top = Image.new("RGB", (m_fit.width + GUTTER + b_fit.width, top_h), BG)
    top.paste(m_fit, (0, LABEL_H))
    top.paste(b_fit, (m_fit.width + GUTTER, LABEL_H))
    td = ImageDraw.Draw(top)
    label(td, (0, 8), f"MOCKUP · {mockup.width}x{mockup.height} → h={target_h}")
    label(td, (m_fit.width + GUTTER, 8), f"BUILD · {build.width}x{build.height} → h={target_h}")

    overlay_w = max(m_fit.width, b_fit.width)
    m_canvas = centered_on(m_fit, overlay_w, target_h)
    b_canvas = centered_on(b_fit, overlay_w, target_h)
    overlay_img = Image.blend(m_canvas, b_canvas, 0.5)
    overlay = Image.new("RGB", (overlay_w, target_h + LABEL_H), BG)
    overlay.paste(overlay_img, (0, LABEL_H))
    od = ImageDraw.Draw(overlay)
    label(od, (0, 8), "50% OVERLAY · same rendered height / centered registration")

    zoom_tiles = [crop_zoom_pair(mockup, build, b) for b in boxes]
    zoom_strip = hstack(zoom_tiles) if zoom_tiles else Image.new("RGB", (overlay_w, LABEL_H + 1), BG)
    if not zoom_tiles:
        zd = ImageDraw.Draw(zoom_strip)
        label(zd, (0, 8), "No zoom boxes supplied", fill=MUTED)

    sections = [top, overlay, zoom_strip]
    sheet_w = max(i.width for i in sections)
    sheet_h = sum(i.height for i in sections) + SECTION_GAP * (len(sections) - 1)
    sheet = Image.new("RGB", (sheet_w, sheet_h), BG)
    y = 0
    for section in sections:
        sheet.paste(section, ((sheet_w - section.width) // 2, y))
        y += section.height + SECTION_GAP

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output_path, "PNG", optimize=True)


def main() -> int:
    p = argparse.ArgumentParser(description="Create a Showdown Factory visual compare sheet")
    p.add_argument("mockup", type=Path)
    p.add_argument("screenshot", type=Path)
    p.add_argument("output", type=Path)
    p.add_argument("--box", action="append", default=[], type=parse_box, help="NAME:x1,y1,x2,y2 in mockup pixels")
    args = p.parse_args()

    for source in (args.mockup, args.screenshot):
        if not source.is_file():
            p.error(f"file not found: {source}")
    build_sheet(args.mockup, args.screenshot, args.output, args.box)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
