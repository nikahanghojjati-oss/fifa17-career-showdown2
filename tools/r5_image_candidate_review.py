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


def strip_query(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


def category_files(category: str) -> list[str]:
    response = SESSION.get(
        API,
        headers=HEADERS,
        params={
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "list": "categorymembers",
            "cmtitle": f"Category:{category}",
            "cmnamespace": "6",
            "cmlimit": "100",
        },
        timeout=60,
    )
    response.raise_for_status()
    return [item["title"].removeprefix("File:") for item in response.json()["query"]["categorymembers"]]


def resolve(filename: str) -> dict:
    response = SESSION.get(
        API,
        headers=HEADERS,
        params={
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "prop": "imageinfo",
            "iiprop": "url|size|mime",
            "iiurlwidth": "800",
            "titles": f"File:{filename}",
        },
        timeout=60,
    )
    response.raise_for_status()
    page = response.json()["query"]["pages"][0]
    if page.get("missing"):
        raise RuntimeError(f"Commons file not found: {filename}")
    info = page["imageinfo"][0]
    return {
        "page": f"https://commons.wikimedia.org/wiki/{page['title'].replace(' ', '_')}",
        "original_url": strip_query(info["url"]),
        "thumb_url": strip_query(info.get("thumburl") or info["url"]),
        "source_width": int(info["width"]),
        "source_height": int(info["height"]),
    }


def fetch_image_bytes(url: str) -> bytes:
    response = SESSION.get(url, headers=HEADERS, timeout=60)
    if response.status_code != 429:
        response.raise_for_status()
        return response.content
    upstream = strip_query(url).replace("https://", "", 1)
    proxy = f"https://wsrv.nl/?url={quote(upstream, safe='/:()%,-._')}&w=800&we&output=jpg&q=92"
    proxied = SESSION.get(proxy, headers=HEADERS, timeout=90)
    proxied.raise_for_status()
    return proxied.content


def download_preview(meta: dict) -> Image.Image:
    last_error = None
    for attempt in range(4):
        try:
            image = Image.open(io.BytesIO(fetch_image_bytes(meta["thumb_url"])))
            return ImageOps.exif_transpose(image).convert("RGB")
        except Exception as exc:
            last_error = exc
            time.sleep(2 + attempt * 2)
    raise RuntimeError(f"preview download exhausted retries: {last_error}")


def fit_into(image: Image.Image, width: int, height: int) -> Image.Image:
    copy = image.copy()
    copy.thumbnail((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (width, height), "#101820")
    canvas.paste(copy, ((width - copy.width) // 2, (height - copy.height) // 2))
    return canvas


def make_sheet(slug: str, files: list[str], report: list[str], failures: list[str]) -> None:
    font = ImageFont.load_default()
    tile_w, image_h, label_h, cols = 420, 300, 80, 3
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (tile_w * cols, (image_h + label_h) * rows), "#20282e")
    draw = ImageDraw.Draw(sheet)

    for index, filename in enumerate(files):
        col = index % cols
        row = index // cols
        x = col * tile_w
        y = row * (image_h + label_h)
        try:
            meta = resolve(filename)
            image = download_preview(meta)
            sheet.paste(fit_into(image, tile_w, image_h), (x, y))
            report.append("\t".join([slug, filename, f"{meta['source_width']}x{meta['source_height']}", meta["page"], meta["original_url"]]))
            detail = f"{meta['source_width']} × {meta['source_height']}"
        except Exception as exc:
            failures.append(f"{slug} · {filename}: {type(exc).__name__}: {exc}")
            draw.rectangle((x, y, x + tile_w, y + image_h), fill="#612b2b")
            detail = f"FAILED: {type(exc).__name__}"

        draw.rectangle((x, y + image_h, x + tile_w, y + image_h + label_h), fill="#eef3f4")
        draw.text((x + 9, y + image_h + 8), f"{index + 1:02d} · {slug.upper()}", fill="#15232b", font=font)
        draw.text((x + 9, y + image_h + 28), detail, fill="#42545e", font=font)
        draw.text((x + 9, y + image_h + 49), filename[:62], fill="#42545e", font=font)
        time.sleep(.6)

    sheet.save(OUT / f"r5-{slug}-source-contact-sheet.jpg", quality=92, optimize=True)


def main() -> None:
    report: list[str] = []
    failures: list[str] = []

    james = ["James Rodríguez in 2019.jpg"]
    rashford = category_files("Marcus Rashford in 2016")
    martial = category_files("Anthony Martial in 2016")

    # Do not reconsider the two r4 portrait derivatives the owner has just asked to replace.
    rashford = [name for name in rashford if name not in {"Marcus Rashford September 2016 (cropped).jpg", "Marcus Rashford.jpg"}]

    make_sheet("james", james, report, failures)
    make_sheet("rashford", rashford, report, failures)
    make_sheet("martial", martial, report, failures)

    (OUT / "r5-player-source-report.txt").write_text("\n".join(report) + "\n", encoding="utf-8")
    (OUT / "r5-player-source-failures.txt").write_text("\n".join(failures) + "\n", encoding="utf-8")
    print(f"Reviewed James={len(james)}, Rashford={len(rashford)}, Martial={len(martial)}")
    if failures:
        for failure in failures:
            print(" -", failure)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
