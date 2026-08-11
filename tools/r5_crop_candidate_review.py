from __future__ import annotations

import io
import time
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit

import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps

OUT = Path("test-results")
OUT.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "CareerModeShowdownAssetReview/1.0 (https://github.com/nikahanghojjati-oss/fifa17-career-showdown2; contact via repository)",
    "Referer": "https://commons.wikimedia.org/",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
}
API = "https://commons.wikimedia.org/w/api.php"
SESSION = requests.Session()

SOURCES = {
    "james": "James Rodríguez in 2019.jpg",
    "rashford": "Man Utd v Everton, August 2016 (08).JPG",
    "martial_action": "Man Utd v Everton, August 2016 (13).JPG",
    "martial_touchline": "Manchester United v Zorya Luhansk, September 2016 (26).JPG",
}

# Explicit source-pixel crop rectangles. These are candidate art-direction boxes,
# not runtime cover crops. The winning derivative will retain its complete crop
# at runtime with object-fit: contain.
CANDIDATES = [
    ("J1 · James balanced portrait", "james", (20, 0, 540, 705)),
    ("J2 · James tighter hero", "james", (55, 0, 540, 660)),
    ("R1 · Rashford upper/full body", "rashford", (0, 0, 1750, 3050)),
    ("R2 · Rashford wider context", "rashford", (0, 0, 2050, 3050)),
    ("R3 · Rashford upper-body hero", "rashford", (0, 0, 1650, 2450)),
    ("M1 · Martial action balanced", "martial_action", (2050, 250, 4896, 3550)),
    ("M2 · Martial action tighter", "martial_action", (2400, 350, 4800, 3500)),
    ("M3 · Martial action upper hero", "martial_action", (2300, 250, 4700, 3000)),
    ("M4 · Martial touchline balanced", "martial_touchline", (0, 0, 2200, 3150)),
    ("M5 · Martial touchline tighter", "martial_touchline", (250, 0, 2050, 2850)),
]


def strip_query(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


def resolve(filename: str, width: int = 1600) -> dict:
    response = SESSION.get(
        API,
        headers=HEADERS,
        params={
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "prop": "imageinfo",
            "iiprop": "url|size|mime",
            "iiurlwidth": str(width),
            "titles": f"File:{filename}",
        },
        timeout=60,
    )
    response.raise_for_status()
    page = response.json()["query"]["pages"][0]
    info = page["imageinfo"][0]
    return {
        "page": f"https://commons.wikimedia.org/wiki/{page['title'].replace(' ', '_')}",
        "original_url": strip_query(info["url"]),
        "thumb_url": strip_query(info.get("thumburl") or info["url"]),
        "source_width": int(info["width"]),
        "source_height": int(info["height"]),
    }


def fetch_bytes(url: str, width: int = 1600) -> bytes:
    response = SESSION.get(url, headers=HEADERS, timeout=60)
    if response.status_code != 429:
        response.raise_for_status()
        return response.content
    upstream = strip_query(url).replace("https://", "", 1)
    proxy = f"https://wsrv.nl/?url={quote(upstream, safe='/:()%,-._')}&w={width}&we&output=jpg&q=94"
    response = SESSION.get(proxy, headers=HEADERS, timeout=90)
    response.raise_for_status()
    return response.content


def load_preview(filename: str) -> tuple[dict, Image.Image]:
    meta = resolve(filename)
    last_error = None
    for attempt in range(4):
        try:
            image = Image.open(io.BytesIO(fetch_bytes(meta["thumb_url"])))
            return meta, ImageOps.exif_transpose(image).convert("RGB")
        except Exception as exc:
            last_error = exc
            time.sleep(2 + attempt * 2)
    raise RuntimeError(last_error)


def crop_scaled(image: Image.Image, meta: dict, box: tuple[int, int, int, int]) -> Image.Image:
    sx = image.width / meta["source_width"]
    sy = image.height / meta["source_height"]
    scaled = (
        round(box[0] * sx), round(box[1] * sy),
        round(box[2] * sx), round(box[3] * sy),
    )
    return image.crop(scaled)


def contain(image: Image.Image, width: int, height: int) -> Image.Image:
    image = image.copy()
    image.thumbnail((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (width, height), "#17232a")
    canvas.paste(image, ((width - image.width) // 2, (height - image.height) // 2))
    return canvas


def main() -> None:
    loaded = {key: load_preview(filename) for key, filename in SOURCES.items()}
    font = ImageFont.load_default()
    tile_w, image_h, label_h, cols = 460, 350, 82, 2
    rows = (len(CANDIDATES) + cols - 1) // cols
    sheet = Image.new("RGB", (tile_w * cols, (image_h + label_h) * rows), "#20282e")
    draw = ImageDraw.Draw(sheet)
    report = []

    for index, (label, source_key, box) in enumerate(CANDIDATES):
        meta, preview = loaded[source_key]
        crop = crop_scaled(preview, meta, box)
        frame = contain(crop, tile_w, image_h)
        col, row = index % cols, index // cols
        x, y = col * tile_w, row * (image_h + label_h)
        sheet.paste(frame, (x, y))
        draw.rectangle((x, y + image_h, x + tile_w, y + image_h + label_h), fill="#eef3f4")
        draw.text((x + 10, y + image_h + 9), label, fill="#15232b", font=font)
        draw.text((x + 10, y + image_h + 30), f"source crop {box}", fill="#42545e", font=font)
        draw.text((x + 10, y + image_h + 51), f"aspect {(box[2]-box[0])/(box[3]-box[1]):.3f} · runtime contain", fill="#42545e", font=font)
        report.append(f"{label}\t{SOURCES[source_key]}\t{box}\t{meta['page']}")

    sheet.save(OUT / "r5-explicit-crop-candidates.jpg", quality=94, optimize=True)
    (OUT / "r5-explicit-crop-candidates.txt").write_text("\n".join(report) + "\n", encoding="utf-8")
    print("Generated explicit crop candidate sheet")


if __name__ == "__main__":
    main()
