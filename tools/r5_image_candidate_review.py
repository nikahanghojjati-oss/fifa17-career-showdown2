from __future__ import annotations

import io
import os
from pathlib import Path
from urllib.parse import quote

import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps

OUT = Path("test-results")
OUT.mkdir(parents=True, exist_ok=True)

SOURCES = [
    ("JAMES · Real Madrid 2019", "James Rodríguez in 2019.jpg"),
    ("RASHFORD · Man Utd v Feyenoord 2016 (23)", "Manchester United v Feyenoord, November 2016 (23).JPG"),
    ("MARTIAL A · Man Utd v Chelsea 2019 · 48520614866", "Manchester Utd 4 Chelsea 0 (48520614866).jpg"),
    ("MARTIAL B · Man Utd v Chelsea 2019 · 48520618321", "Manchester Utd 4 Chelsea 0 (48520618321).jpg"),
    ("MARTIAL C · Man Utd v Chelsea 2019 · 48520622561", "Manchester Utd 4 Chelsea 0 (48520622561).jpg"),
    ("MARTIAL D · Man Utd v Chelsea 2019 · 48520788537", "Manchester Utd 4 Chelsea 0 (48520788537).jpg"),
    ("MARTIAL E · Man Utd v Chelsea 2019 · 48520789097", "Manchester Utd 4 Chelsea 0 (48520789097).jpg"),
    ("MARTIAL F · Man Utd v Chelsea 2019 · 48520789617", "Manchester Utd 4 Chelsea 0 (48520789617).jpg"),
]

HEADERS = {"User-Agent": "CareerModeShowdown/1.0 licensed-asset-review"}


def source_url(filename: str) -> str:
    return f"https://commons.wikimedia.org/wiki/Special:Redirect/file/{quote(filename)}"


def download(filename: str) -> Image.Image:
    response = requests.get(source_url(filename), headers=HEADERS, timeout=60)
    response.raise_for_status()
    image = Image.open(io.BytesIO(response.content))
    return ImageOps.exif_transpose(image).convert("RGB")


def fit_into(image: Image.Image, width: int, height: int) -> Image.Image:
    copy = image.copy()
    copy.thumbnail((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (width, height), "#101820")
    x = (width - copy.width) // 2
    y = (height - copy.height) // 2
    canvas.paste(copy, (x, y))
    return canvas


def main() -> None:
    font = ImageFont.load_default()
    tile_w, image_h, label_h = 640, 430, 68
    tile_h = image_h + label_h
    cols = 2
    rows = (len(SOURCES) + cols - 1) // cols
    sheet = Image.new("RGB", (tile_w * cols, tile_h * rows), "#20282e")
    draw = ImageDraw.Draw(sheet)

    report = []
    for index, (label, filename) in enumerate(SOURCES):
        image = download(filename)
        report.append(f"{label}\t{filename}\t{image.width}x{image.height}\t{source_url(filename)}")
        preview = fit_into(image, tile_w, image_h)
        col = index % cols
        row = index // cols
        x = col * tile_w
        y = row * tile_h
        sheet.paste(preview, (x, y))
        draw.rectangle((x, y + image_h, x + tile_w, y + tile_h), fill="#eef3f4")
        draw.text((x + 12, y + image_h + 10), label, fill="#15232b", font=font)
        draw.text((x + 12, y + image_h + 30), f"source {image.width} × {image.height}", fill="#42545e", font=font)
        draw.text((x + 12, y + image_h + 47), filename[:88], fill="#42545e", font=font)

    sheet.save(OUT / "r5-player-source-contact-sheet.jpg", quality=93, optimize=True)
    (OUT / "r5-player-source-report.txt").write_text("\n".join(report) + "\n", encoding="utf-8")
    print("Generated", OUT / "r5-player-source-contact-sheet.jpg")


if __name__ == "__main__":
    main()
