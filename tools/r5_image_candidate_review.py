from __future__ import annotations

import io
from pathlib import Path

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
API = "https://commons.wikimedia.org/w/api.php"


def resolve(filename: str) -> dict:
    response = requests.get(
        API,
        headers=HEADERS,
        params={
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "prop": "imageinfo",
            "iiprop": "url|size|mime",
            "iiurlwidth": "1600",
            "titles": f"File:{filename}",
        },
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    page = payload["query"]["pages"][0]
    if page.get("missing"):
        raise RuntimeError(f"Commons file not found: {filename}")
    info = page["imageinfo"][0]
    return {
        "page": f"https://commons.wikimedia.org/wiki/{page['title'].replace(' ', '_')}",
        "original_url": info["url"],
        "thumb_url": info.get("thumburl") or info["url"],
        "source_width": int(info["width"]),
        "source_height": int(info["height"]),
        "mime": info.get("mime", ""),
    }


def download_preview(meta: dict) -> Image.Image:
    response = requests.get(meta["thumb_url"], headers=HEADERS, timeout=60)
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
    tile_w, image_h, label_h = 640, 430, 74
    tile_h = image_h + label_h
    cols = 2
    rows = (len(SOURCES) + cols - 1) // cols
    sheet = Image.new("RGB", (tile_w * cols, tile_h * rows), "#20282e")
    draw = ImageDraw.Draw(sheet)

    report = []
    failures = []
    for index, (label, filename) in enumerate(SOURCES):
        col = index % cols
        row = index // cols
        x = col * tile_w
        y = row * tile_h
        try:
            meta = resolve(filename)
            image = download_preview(meta)
            preview = fit_into(image, tile_w, image_h)
            sheet.paste(preview, (x, y))
            report.append(
                "\t".join(
                    [
                        label,
                        filename,
                        f"{meta['source_width']}x{meta['source_height']}",
                        meta["page"],
                        meta["original_url"],
                    ]
                )
            )
            detail = f"source {meta['source_width']} × {meta['source_height']} · preview {image.width} × {image.height}"
        except Exception as exc:
            failures.append(f"{label}: {type(exc).__name__}: {exc}")
            draw.rectangle((x, y, x + tile_w, y + image_h), fill="#612b2b")
            detail = f"FAILED: {type(exc).__name__}: {str(exc)[:100]}"

        draw.rectangle((x, y + image_h, x + tile_w, y + tile_h), fill="#eef3f4")
        draw.text((x + 12, y + image_h + 9), label, fill="#15232b", font=font)
        draw.text((x + 12, y + image_h + 30), detail, fill="#42545e", font=font)
        draw.text((x + 12, y + image_h + 51), filename[:88], fill="#42545e", font=font)

    sheet.save(OUT / "r5-player-source-contact-sheet.jpg", quality=93, optimize=True)
    (OUT / "r5-player-source-report.txt").write_text("\n".join(report) + "\n", encoding="utf-8")
    (OUT / "r5-player-source-failures.txt").write_text("\n".join(failures) + "\n", encoding="utf-8")
    print("Generated", OUT / "r5-player-source-contact-sheet.jpg")
    if failures:
        print("Candidate failures:")
        for failure in failures:
            print(" -", failure)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
