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

# The crop is authored once in source pixels. Runtime CSS must show the complete
# resulting derivative with object-fit: contain; it must never re-crop these.
# replace_ids makes this builder reproducible from either the r4 baseline, an
# earlier r5 candidate, or the final r5 manifest without deleting its own output.
SELECTIONS = {
    "james": {
        "replace_ids": [
            "james-rodriguez-real-madrid-2016-r4",
            "james-rodriguez-real-madrid-2019-smart-r5",
        ],
        "id": "james-rodriguez-real-madrid-2019-smart-r5",
        "source_file": "James Rodríguez in 2019.jpg",
        "output": "james-rodriguez-real-madrid-2019-smart-r5.webp",
        "crop_box_on_source": [20, 0, 540, 705],
        "max_size": [520, 705],
        "quality": 92,
        "author": "Real Madrid",
        "license": "CC BY 3.0",
        "license_url": "https://creativecommons.org/licenses/by/3.0/",
        "context": "James Rodríguez in Real Madrid training apparel at Real Madrid City, 23 October 2019; hand-reviewed crop retains his complete head, shoulders, shirt and club crest.",
        "crop_policy": "hand-reviewed source-pixel crop; complete derivative shown at runtime with object-fit: contain",
    },
    "rashford": {
        "replace_ids": [
            "marcus-rashford-man-utd-2016-r4",
            "marcus-rashford-man-utd-2016-smart-r5",
            "marcus-rashford-man-utd-2017-smart-r5",
        ],
        "id": "marcus-rashford-man-utd-2017-smart-r5",
        "source_file": "Manchester United v RSC Anderlecht, 20 April 2017 (29).jpg",
        "output": "marcus-rashford-man-utd-2017-smart-r5.webp",
        "crop_box_on_source": [1050, 300, 2350, 2200],
        "max_size": [800, 1100],
        "quality": 92,
        "author": "Ardfern",
        "license": "CC BY-SA 4.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
        "context": "Marcus Rashford for Manchester United v RSC Anderlecht at Old Trafford, 20 April 2017; hand-reviewed upper-body crop prioritizes his face, red shirt and club identity while removing unused grass and full-leg area.",
        "crop_policy": "hand-reviewed face-and-upper-body source-pixel crop; complete derivative shown at runtime with object-fit: contain",
    },
    "martial": {
        "replace_ids": [
            "anthony-martial-man-utd-2015-r4",
            "anthony-martial-man-utd-2016-smart-r5",
        ],
        "id": "anthony-martial-man-utd-2016-smart-r5",
        "source_file": "Manchester United v Zorya Luhansk, September 2016 (26).JPG",
        "output": "anthony-martial-man-utd-2016-smart-r5.webp",
        "crop_box_on_source": [0, 0, 1800, 2400],
        "max_size": [825, 1100],
        "quality": 90,
        "author": "Ardfern",
        "license": "CC BY-SA 4.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
        "context": "Anthony Martial for Manchester United v Zorya Luhansk at Old Trafford, 29 September 2016; hand-reviewed crop makes Martial the dominant subject while trimming the adjacent player from the presentation edge.",
        "crop_policy": "hand-reviewed source-pixel crop; complete derivative shown at runtime with object-fit: contain",
    },
}


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
    response = SESSION.get(
        API,
        headers=HEADERS,
        params={
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "prop": "imageinfo",
            "iiprop": "url|size|mime|sha1|extmetadata",
            "titles": f"File:{filename}",
        },
        timeout=60,
    )
    response.raise_for_status()
    page = response.json()["query"]["pages"][0]
    if page.get("missing"):
        raise RuntimeError(f"Commons source missing: {filename}")
    info = page["imageinfo"][0]
    return {
        "page": f"https://commons.wikimedia.org/wiki/{page['title'].replace(' ', '_')}",
        "url": info["url"].split("?", 1)[0],
        "width": int(info["width"]),
        "height": int(info["height"]),
        "sha1": info.get("sha1", ""),
        "artist": clean_artist(info.get("extmetadata", {}).get("Artist", {}).get("value", "")),
        "license": info.get("extmetadata", {}).get("LicenseShortName", {}).get("value", ""),
        "license_url": info.get("extmetadata", {}).get("LicenseUrl", {}).get("value", ""),
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
    raise RuntimeError(f"Could not download licensed source after retries: {last}")


def validate_source(selection: dict, meta: dict) -> None:
    if meta["width"] <= 0 or meta["height"] <= 0:
        raise RuntimeError("Invalid Commons source dimensions")
    x1, y1, x2, y2 = selection["crop_box_on_source"]
    if not (0 <= x1 < x2 <= meta["width"] and 0 <= y1 < y2 <= meta["height"]):
        raise RuntimeError(
            f"Crop outside source for {selection['source_file']}: "
            f"{selection['crop_box_on_source']} vs {meta['width']}x{meta['height']}"
        )
    if selection["author"].lower() not in meta["artist"].lower() and meta["artist"]:
        print(f"NOTICE: Commons artist string differs from normalized expected attribution: {meta['artist']!r}")
    expected_license = selection["license"].replace(" ", "").lower()
    actual_license = meta["license"].replace(" ", "").lower()
    if expected_license not in actual_license and actual_license not in expected_license:
        raise RuntimeError(
            f"License changed for {selection['source_file']}: "
            f"expected {selection['license']}, got {meta['license']}"
        )


def render(selection: dict, source_bytes: bytes) -> tuple[bytes, list[int]]:
    source = Image.open(io.BytesIO(source_bytes))
    source = ImageOps.exif_transpose(source).convert("RGB")
    crop = source.crop(tuple(selection["crop_box_on_source"]))
    max_w, max_h = selection["max_size"]
    scale = min(1.0, max_w / crop.width, max_h / crop.height)
    if scale < 1.0:
        crop = crop.resize(
            (round(crop.width * scale), round(crop.height * scale)),
            Image.Resampling.LANCZOS,
        )
    buffer = io.BytesIO()
    crop.save(buffer, format="WEBP", quality=selection["quality"], method=6)
    data = buffer.getvalue()
    if len(data) > 360_000:
        raise RuntimeError(f"{selection['output']} exceeds 360 KB: {len(data)}")
    return data, [crop.width, crop.height]


def find_manifest_index(assets: list[dict], selection: dict) -> int:
    for index, asset in enumerate(assets):
        if asset.get("id") in selection["replace_ids"]:
            return index
    raise RuntimeError(
        f"No replaceable manifest entry found for {selection['id']}; "
        f"expected one of {selection['replace_ids']}"
    )


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    old_outputs: set[str] = set()

    for key, selection in SELECTIONS.items():
        meta = metadata(selection["source_file"])
        validate_source(selection, meta)
        source_bytes = download(meta["url"])
        source_image = ImageOps.exif_transpose(Image.open(io.BytesIO(source_bytes)))
        if [source_image.width, source_image.height] != [meta["width"], meta["height"]]:
            raise RuntimeError(f"Downloaded source dimensions mismatch for {selection['source_file']}")

        output_bytes, output_dimensions = render(selection, source_bytes)
        (ASSET_DIR / selection["output"]).write_bytes(output_bytes)

        index = find_manifest_index(manifest["assets"], selection)
        prior_output = manifest["assets"][index].get("output")
        if prior_output and prior_output != selection["output"]:
            old_outputs.add(prior_output)

        manifest["assets"][index] = {
            "id": selection["id"],
            "source_file": selection["source_file"],
            "output": selection["output"],
            "max_size": selection["max_size"],
            "quality": selection["quality"],
            "author": selection["author"],
            "license": selection["license"],
            "license_url": selection["license_url"],
            "source_page": meta["page"],
            "context": selection["context"],
            "special_redirect_url": (
                "https://commons.wikimedia.org/wiki/Special:Redirect/file/"
                + requests.utils.quote(selection["source_file"], safe="")
            ),
            "source_dimensions": [meta["width"], meta["height"]],
            "source_sha1_commons": meta["sha1"],
            "source_sha256": sha256(source_bytes),
            "crop_box_on_source": selection["crop_box_on_source"],
            "crop_policy": selection["crop_policy"],
            "output_dimensions": output_dimensions,
            "output_bytes": len(output_bytes),
            "output_sha256": sha256(output_bytes),
        }
        print(
            f"Built {key}: {selection['output']} "
            f"{output_dimensions[0]}x{output_dimensions[1]} {len(output_bytes)} bytes"
        )
        time.sleep(2)

    manifest["generated_by"] = "r5-owner-requested-new-player-source-smart-crop-builder"
    manifest["transformation"] = (
        "James Rodríguez, Marcus Rashford and Anthony Martial are rebuilt from new licensed Commons sources using explicit, hand-reviewed source-pixel crop boxes, EXIF normalization, Lanczos downscaling only and WebP conversion. Messi and Lahm are unchanged from r4. Runtime CSS shows 100% of each finished derivative with contain; no generative alteration."
    )
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    active_outputs = {asset.get("output") for asset in manifest["assets"]}
    for output in sorted(old_outputs):
        if output in active_outputs:
            continue
        path = ASSET_DIR / output
        if path.exists():
            path.unlink()
            print("Removed rejected prior derivative", output)


if __name__ == "__main__":
    main()
