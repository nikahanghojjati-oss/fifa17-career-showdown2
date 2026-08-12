from __future__ import annotations

import argparse
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
    "User-Agent": "CareerModeShowdownAssetBuilder/1.1.3 (https://github.com/nikahanghojjati-oss/fifa17-career-showdown2; contact via repository)",
    "Referer": "https://commons.wikimedia.org/",
}
SESSION = requests.Session()

# Every crop is authored once in licensed source pixels. Runtime CSS must show
# the complete resulting derivative with object-fit: contain; it must never
# create a second semantic crop. For already-isolated Commons derivatives, the
# complete source frame is deliberately preserved.
SELECTIONS = {
    "james": {
        "replace_ids": [
            "james-rodriguez-real-madrid-2016-r4",
            "james-rodriguez-real-madrid-2019-smart-r5",
            "james-rodriguez-real-madrid-2016-smart-v111",
            "james-rodriguez-world-cup-2014-v113",
        ],
        "id": "james-rodriguez-world-cup-2014-v113",
        "source_file": "James Rodríguez (cropped).jpg",
        "output": "james-rodriguez-world-cup-2014-v113.webp",
        "crop_box_on_source": [0, 0, 1415, 3062],
        "max_size": [508, 1100],
        "quality": 92,
        "author": "Copa2014.gov.br",
        "license": "CC BY 3.0 BR",
        "license_url": "https://creativecommons.org/licenses/by/3.0/br/deed.en",
        "context": "James Rodríguez at the 2014 FIFA World Cup in Brazil, 19 June 2014; a tall match-day portrait from the tournament that made him a global football star.",
        "crop_policy": "complete licensed Commons derivative preserved; complete derivative shown at runtime with object-fit: contain",
    },
    "rashford": {
        "replace_ids": [
            "marcus-rashford-man-utd-2016-r4",
            "marcus-rashford-man-utd-2016-smart-r5",
            "marcus-rashford-man-utd-2017-smart-r5",
            "marcus-rashford-chelsea-2017-v113",
        ],
        "id": "marcus-rashford-chelsea-2017-v113",
        "source_file": "Manchester United v Chelsea, 16 April 2017 (11).jpg",
        "output": "marcus-rashford-chelsea-2017-v113.webp",
        "crop_box_on_source": [0, 0, 4896, 3672],
        "max_size": [1120, 840],
        "quality": 90,
        "author": "Ardfern",
        "license": "CC BY-SA 4.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
        "context": "Marcus Rashford in Manchester United's 2–0 Premier League win over Chelsea at Old Trafford, 16 April 2017.",
        "crop_policy": "complete high-resolution match frame preserved for first-pass authored review; complete derivative shown at runtime with object-fit: contain",
    },
    "martial": {
        "replace_ids": [
            "anthony-martial-man-utd-2015-r4",
            "anthony-martial-man-utd-2016-smart-r5",
            "anthony-martial-cska-2017-v113",
        ],
        "id": "anthony-martial-cska-2017-v113",
        "source_file": "Anthony Martial 27 September 2017 cropped.jpg",
        "output": "anthony-martial-cska-2017-v113.webp",
        "crop_box_on_source": [0, 0, 521, 999],
        "max_size": [521, 999],
        "quality": 92,
        "author": "Дмитрий Голубович",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "context": "Anthony Martial with Manchester United against CSKA Moscow in the UEFA Champions League, 27 September 2017.",
        "crop_policy": "complete player-isolated Commons derivative preserved; complete derivative shown at runtime with object-fit: contain",
    },
    "ronaldo": {
        "replace_ids": ["cristiano-ronaldo-euro-2016-v113"],
        "id": "cristiano-ronaldo-euro-2016-v113",
        "source_file": "Euro 2016 Cristiano Ronaldo.jpg",
        "output": "cristiano-ronaldo-euro-2016-v113.webp",
        "crop_box_on_source": [0, 0, 1550, 2434],
        "max_size": [700, 1100],
        "quality": 90,
        "author": "Chensiyuan",
        "license": "CC BY-SA 4.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
        "context": "Cristiano Ronaldo for Portugal against Poland in the UEFA Euro 2016 quarter-final, 1 July 2016.",
        "crop_policy": "complete extracted tournament portrait preserved; complete derivative shown at runtime with object-fit: contain",
    },
    "pogba": {
        "replace_ids": ["paul-pogba-man-utd-2016-v113"],
        "id": "paul-pogba-man-utd-2016-v113",
        "source_file": "Manchester United v Zorya Luhansk, September 2016 (07) - Paul Pogba (edited).jpg",
        "output": "paul-pogba-man-utd-2016-v113.webp",
        "crop_box_on_source": [0, 0, 2715, 3345],
        "max_size": [893, 1100],
        "quality": 90,
        "author": "Ardfern / derivative by Danyele",
        "license": "CC BY-SA 4.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
        "context": "Paul Pogba with Manchester United at Old Trafford in the Europa League against Zorya Luhansk, 29 September 2016.",
        "crop_policy": "complete player-focused Commons derivative preserved; complete derivative shown at runtime with object-fit: contain",
    },
    "zlatan": {
        "replace_ids": ["zlatan-ibrahimovic-man-utd-2016-v113"],
        "id": "zlatan-ibrahimovic-man-utd-2016-v113",
        "source_file": "Manchester United v Zorya Luhansk, September 2016 (08) - Zlatan Ibrahimović (edited).jpg",
        "output": "zlatan-ibrahimovic-man-utd-2016-v113.webp",
        "crop_box_on_source": [0, 0, 1870, 3160],
        "max_size": [651, 1100],
        "quality": 90,
        "author": "Ardfern / derivative by Danyele",
        "license": "CC BY-SA 4.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
        "context": "Zlatan Ibrahimović with Manchester United at Old Trafford against Zorya Luhansk, 29 September 2016.",
        "crop_policy": "complete player-focused Commons derivative preserved; complete derivative shown at runtime with object-fit: contain",
    },
    "griezmann": {
        "replace_ids": ["antoine-griezmann-atletico-2016-v113"],
        "id": "antoine-griezmann-atletico-2016-v113",
        "source_file": "Antoine Griezmann 2016.jpg",
        "output": "antoine-griezmann-atletico-2016-v113.webp",
        "crop_box_on_source": [0, 0, 1600, 1189],
        "max_size": [1120, 832],
        "quality": 90,
        "author": "Светлана Бекетова",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "context": "Antoine Griezmann during Rostov v Atlético Madrid in the UEFA Champions League, 19 October 2016.",
        "crop_policy": "complete licensed match frame preserved; complete derivative shown at runtime with object-fit: contain",
    },
    "neymar": {
        "replace_ids": ["neymar-brazil-olympic-gold-2016-v113"],
        "id": "neymar-brazil-olympic-gold-2016-v113",
        "source_file": "Brasil conquista primeiro ouro olímpico no futebol 1039247-20082016- mg 3424.jpg",
        "output": "neymar-brazil-olympic-gold-2016-v113.webp",
        "crop_box_on_source": [0, 0, 3800, 2533],
        "max_size": [1120, 747],
        "quality": 90,
        "author": "Fernando Frazão/Agência Brasil",
        "license": "CC BY 3.0 BR",
        "license_url": "https://creativecommons.org/licenses/by/3.0/br/deed.en",
        "context": "Neymar in Brazil's first Olympic men's football gold-medal final against Germany at Rio 2016, 20 August 2016.",
        "crop_policy": "complete historic final frame preserved; complete derivative shown at runtime with object-fit: contain",
    },
    "balotelli": {
        "replace_ids": ["mario-balotelli-euro-2012-celebration-v113"],
        "id": "mario-balotelli-euro-2012-celebration-v113",
        "source_file": "Balotelli 2nd goal celebration - Euro 2012.jpg",
        "output": "mario-balotelli-euro-2012-celebration-v113.webp",
        "crop_box_on_source": [0, 0, 4608, 2592],
        "max_size": [1200, 675],
        "quality": 90,
        "author": "Joern Fehrmann",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "context": "Italy celebrate Mario Balotelli's second goal against Germany in the UEFA Euro 2012 semi-final, 28 June 2012.",
        "crop_policy": "complete historic celebration frame preserved; complete derivative shown at runtime with object-fit: contain",
    },
    "falcao": {
        "replace_ids": ["radamel-falcao-europa-league-2012-v113"],
        "id": "radamel-falcao-europa-league-2012-v113",
        "source_file": "Falcao Celebración Europa League 2012.JPG",
        "output": "radamel-falcao-europa-league-2012-v113.webp",
        "crop_box_on_source": [0, 0, 1452, 2256],
        "max_size": [708, 1100],
        "quality": 90,
        "author": "Juanca Parce",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "context": "Radamel Falcao celebrating Atlético Madrid's 2012 Europa League title in Madrid's Puerta del Sol, 10 May 2012.",
        "crop_policy": "complete title-celebration frame preserved; complete derivative shown at runtime with object-fit: contain",
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


def find_manifest_index(assets: list[dict], selection: dict) -> int | None:
    for index, asset in enumerate(assets):
        if asset.get("id") in selection["replace_ids"]:
            return index
    return None


def build_selection(manifest: dict, key: str, selection: dict, old_outputs: set[str]) -> None:
    meta = metadata(selection["source_file"])
    validate_source(selection, meta)
    source_bytes = download(meta["url"])
    source_image = ImageOps.exif_transpose(Image.open(io.BytesIO(source_bytes)))
    if [source_image.width, source_image.height] != [meta["width"], meta["height"]]:
        raise RuntimeError(f"Downloaded source dimensions mismatch for {selection['source_file']}")

    output_bytes, output_dimensions = render(selection, source_bytes)
    (ASSET_DIR / selection["output"]).write_bytes(output_bytes)

    index = find_manifest_index(manifest["assets"], selection)
    entry = {
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

    if index is None:
        manifest["assets"].append(entry)
    else:
        prior_output = manifest["assets"][index].get("output")
        if prior_output and prior_output != selection["output"]:
            old_outputs.add(prior_output)
        manifest["assets"][index] = entry

    print(
        f"Built {key}: {selection['output']} "
        f"{output_dimensions[0]}x{output_dimensions[1]} {len(output_bytes)} bytes"
    )


def main(only: str | None = None) -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    old_outputs: set[str] = set()

    for key, selection in SELECTIONS.items():
        if only and key != only:
            continue
        build_selection(manifest, key, selection, old_outputs)
        time.sleep(2)

    manifest["generated_by"] = "licensed-football-visual-builder-v1.1.3"
    manifest["transformation"] = (
        "v1.1.3 replaces James Rodríguez, Marcus Rashford and Anthony Martial with new licensed source photographs and adds seven new licensed screen-level football visuals. Finished authored derivatives are shown with object-fit: contain and face-safe geometry; no generative alteration and no runtime network image dependency."
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Rebuild licensed Career Mode Showdown visual derivatives.")
    parser.add_argument(
        "--only",
        choices=sorted(SELECTIONS),
        default=None,
        help="Rebuild only one selected visual while leaving other active derivatives untouched.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    main(args.only)
