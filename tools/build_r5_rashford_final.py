from __future__ import annotations

import hashlib
import html
import io
import json
import time
from pathlib import Path

import requests
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "football"
MANIFEST_PATH = ASSET_DIR / "asset-manifest.json"
API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {
    "User-Agent": "CareerModeShowdownAssetBuilder/1.0 (https://github.com/nikahanghojjati-oss/fifa17-career-showdown2; contact via repository)",
    "Referer": "https://commons.wikimedia.org/",
}
SESSION = requests.Session()

OLD_ID = "marcus-rashford-man-utd-2016-smart-r5"
OLD_OUTPUT = "marcus-rashford-man-utd-2016-smart-r5.webp"
SOURCE_FILE = "Manchester United v RSC Anderlecht, 20 April 2017 (29).jpg"
NEW_ID = "marcus-rashford-man-utd-2017-smart-r5"
NEW_OUTPUT = "marcus-rashford-man-utd-2017-smart-r5.webp"
CROP_BOX = [1050, 300, 2350, 2200]
MAX_SIZE = [800, 1100]
QUALITY = 92


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def clean_artist(value: str) -> str:
    value = html.unescape(value or "")
    while "<" in value and ">" in value:
        start = value.find("<")
        end = value.find(">", start)
        if end == -1:
            break
        value = value[:start] + value[end + 1 :]
    return " ".join(value.split())


def metadata(filename: str) -> dict:
    response = SESSION.get(API, headers=HEADERS, params={
        "action": "query", "format": "json", "formatversion": "2",
        "prop": "imageinfo", "iiprop": "url|size|mime|sha1|extmetadata",
        "titles": f"File:{filename}",
    }, timeout=60)
    response.raise_for_status()
    page = response.json()["query"]["pages"][0]
    if page.get("missing"):
        raise RuntimeError(f"Commons source missing: {filename}")
    info = page["imageinfo"][0]
    ext = info.get("extmetadata", {})
    return {
        "page": f"https://commons.wikimedia.org/wiki/{page['title'].replace(' ', '_')}",
        "url": info["url"].split("?", 1)[0],
        "width": int(info["width"]),
        "height": int(info["height"]),
        "sha1": info.get("sha1", ""),
        "artist": clean_artist(ext.get("Artist", {}).get("value", "")),
        "license": ext.get("LicenseShortName", {}).get("value", ""),
    }


def download(url: str) -> bytes:
    last = None
    for attempt in range(7):
        try:
            response = SESSION.get(url, headers=HEADERS, timeout=120)
            if response.status_code == 429:
                retry = int(response.headers.get("Retry-After", "0") or "0")
                time.sleep(max(retry, 8 + attempt * 8))
                continue
            response.raise_for_status()
            return response.content
        except Exception as exc:
            last = exc
            time.sleep(5 + attempt * 5)
    raise RuntimeError(f"Could not download Rashford source after retries: {last}")


def main() -> None:
    meta = metadata(SOURCE_FILE)
    if [meta["width"], meta["height"]] != [3672, 4896]:
        raise RuntimeError(f"Rashford source dimensions changed: {meta['width']}x{meta['height']}")
    if "ardfern" not in meta["artist"].lower():
        raise RuntimeError(f"Rashford attribution changed: {meta['artist']!r}")
    if "CC BY-SA 4.0" not in meta["license"]:
        raise RuntimeError(f"Rashford license changed: {meta['license']!r}")

    source_bytes = download(meta["url"])
    source = ImageOps.exif_transpose(Image.open(io.BytesIO(source_bytes))).convert("RGB")
    if [source.width, source.height] != [3672, 4896]:
        raise RuntimeError(f"Downloaded/normalized source geometry changed: {source.width}x{source.height}")

    x1, y1, x2, y2 = CROP_BOX
    crop = source.crop((x1, y1, x2, y2))
    scale = min(1.0, MAX_SIZE[0] / crop.width, MAX_SIZE[1] / crop.height)
    if scale < 1.0:
        crop = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.LANCZOS)

    buffer = io.BytesIO()
    crop.save(buffer, format="WEBP", quality=QUALITY, method=6)
    output_bytes = buffer.getvalue()
    if len(output_bytes) > 360_000:
        raise RuntimeError(f"Final Rashford derivative exceeds budget: {len(output_bytes)}")
    (ASSET_DIR / NEW_OUTPUT).write_bytes(output_bytes)

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    found = False
    for index, asset in enumerate(manifest["assets"]):
        if asset["id"] != OLD_ID:
            continue
        found = True
        manifest["assets"][index] = {
            "id": NEW_ID,
            "source_file": SOURCE_FILE,
            "output": NEW_OUTPUT,
            "max_size": MAX_SIZE,
            "quality": QUALITY,
            "author": "Ardfern",
            "license": "CC BY-SA 4.0",
            "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
            "source_page": meta["page"],
            "context": "Marcus Rashford for Manchester United v RSC Anderlecht at Old Trafford, 20 April 2017; hand-reviewed upper-body source-pixel crop deliberately prioritizes his face, red shirt and club identity while removing the unused grass and full-leg area.",
            "special_redirect_url": f"https://commons.wikimedia.org/wiki/Special:Redirect/file/{requests.utils.quote(SOURCE_FILE, safe='')}",
            "source_dimensions": [meta["width"], meta["height"]],
            "source_sha1_commons": meta["sha1"],
            "source_sha256": sha256(source_bytes),
            "crop_box_on_source": CROP_BOX,
            "crop_policy": "hand-reviewed face-and-upper-body source-pixel crop; complete derivative shown at runtime with object-fit: contain",
            "output_dimensions": [crop.width, crop.height],
            "output_bytes": len(output_bytes),
            "output_sha256": sha256(output_bytes),
        }
        break
    if not found:
        raise RuntimeError(f"Active rejected Rashford candidate {OLD_ID} not found in manifest")

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    old_path = ASSET_DIR / OLD_OUTPUT
    if old_path.exists():
        old_path.unlink()

    print(f"Built final Rashford derivative: {NEW_OUTPUT} {crop.width}x{crop.height} {len(output_bytes)} bytes")
    print(f"Crop: {CROP_BOX}; source SHA256: {sha256(source_bytes)}; output SHA256: {sha256(output_bytes)}")


if __name__ == "__main__":
    main()
