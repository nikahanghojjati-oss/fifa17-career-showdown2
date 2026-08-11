from __future__ import annotations

import io
import time
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit

import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps

OUT = Path('test-results')
OUT.mkdir(parents=True, exist_ok=True)
API = 'https://commons.wikimedia.org/w/api.php'
HEADERS = {
    'User-Agent': 'CareerModeShowdownAssetReview/1.0 (https://github.com/nikahanghojjati-oss/fifa17-career-showdown2; contact via repository)',
    'Referer': 'https://commons.wikimedia.org/'
}
SESSION = requests.Session()

SOURCES = [
    ('R31 Leicester', 'Manchester United v Leicester City, 26 August 2017 (26).JPG'),
    ('R40 Anderlecht touchline', 'Manchester United v RSC Anderlecht, 20 April 2017 (04).jpg'),
    ('R44 Anderlecht portrait', 'Manchester United v RSC Anderlecht, 20 April 2017 (29).jpg'),
]


def strip_query(url: str) -> str:
    p = urlsplit(url)
    return urlunsplit((p.scheme, p.netloc, p.path, '', ''))


def resolve(filename: str) -> dict:
    r = SESSION.get(API, headers=HEADERS, params={
        'action':'query','format':'json','formatversion':'2','prop':'imageinfo',
        'iiprop':'url|size','iiurlwidth':'1600','titles':f'File:{filename}'
    }, timeout=60)
    r.raise_for_status()
    page = r.json()['query']['pages'][0]
    info = page['imageinfo'][0]
    return {
        'url': strip_query(info['url']),
        'thumb': strip_query(info.get('thumburl') or info['url']),
        'width': int(info['width']),
        'height': int(info['height'])
    }


def fetch(url: str) -> bytes:
    r = SESSION.get(url, headers=HEADERS, timeout=60)
    if r.status_code != 429:
        r.raise_for_status()
        return r.content
    upstream = strip_query(url).replace('https://','',1)
    proxy = f"https://wsrv.nl/?url={quote(upstream, safe='/:()%,-._')}&w=1600&we&output=jpg&q=94"
    r = SESSION.get(proxy, headers=HEADERS, timeout=90)
    r.raise_for_status()
    return r.content


def load(meta: dict) -> Image.Image:
    last = None
    for attempt in range(5):
        try:
            return ImageOps.exif_transpose(Image.open(io.BytesIO(fetch(meta['thumb'])))).convert('RGB')
        except Exception as exc:
            last = exc
            time.sleep(3 + attempt * 3)
    raise RuntimeError(last)


def grid_image(image: Image.Image, meta: dict, label: str) -> Image.Image:
    img = image.copy()
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    sx = img.width / meta['width']
    sy = img.height / meta['height']
    step_x = 400
    step_y = 400
    for source_x in range(0, meta['width'] + 1, step_x):
        x = round(source_x * sx)
        draw.line((x,0,x,img.height), fill='yellow', width=2)
        draw.text((x+3,4), str(source_x), fill='yellow', font=font, stroke_width=2, stroke_fill='black')
    for source_y in range(0, meta['height'] + 1, step_y):
        y = round(source_y * sy)
        draw.line((0,y,img.width,y), fill='cyan', width=2)
        draw.text((4,y+3), str(source_y), fill='cyan', font=font, stroke_width=2, stroke_fill='black')
    draw.rectangle((0,img.height-34,img.width,img.height), fill=(0,0,0,180))
    draw.text((8,img.height-26), f'{label} · source {meta["width"]}x{meta["height"]}', fill='white', font=font)
    return img


def main():
    report=[]
    for index,(label,filename) in enumerate(SOURCES,1):
        meta=resolve(filename)
        image=load(meta)
        out=grid_image(image,meta,label)
        name=f'r5-rashford-grid-{index}.jpg'
        out.save(OUT/name,quality=94,optimize=True)
        report.append(f'{index}\t{label}\t{filename}\t{meta["width"]}x{meta["height"]}\t{meta["url"]}')
        time.sleep(1)
    (OUT/'r5-rashford-grid-report.txt').write_text('\n'.join(report)+'\n',encoding='utf-8')
    print('Generated final Rashford coordinate grids')

if __name__ == '__main__':
    main()
