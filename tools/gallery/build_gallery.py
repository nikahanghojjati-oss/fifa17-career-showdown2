#!/usr/bin/env python3
"""Build the release gallery page (changed screens only, one desktop + one phone shot each).

Usage:
  python3 -I tools/gallery/build_gallery.py tools/gallery/r87-manifest.json OUT_DIR

Manifest keys:
  title, lede, notes (path to a release-notes .md, shown at the top), checklist_url (optional link),
  shots_dir (folder made by shot-hook.cjs; holds desktop/, phone/ and shots.jsonl),
  screens: [{title, note, prs, desktop, phone, before_desktop?, before_phone?}]
    Each picture is a file path (relative to the repo root), or {"match": "<regex>"} to pick the LAST shot in
    shots_dir whose signature matches (use "first": true for the first), or null when that size is not changed.
Output: OUT_DIR/index.html and OUT_DIR/img/*.webp (max 1440 px wide, quality 80), ready for an Artifact publish
with files = every img/*.webp. A screen whose picture can't be found is listed under "Missing shots", never faked.
"""
import html, json, os, re, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def load_shots(shots_dir):
    rows = []
    path = os.path.join(shots_dir, "shots.jsonl")
    if os.path.exists(path):
        for line in open(path, encoding="utf8"):
            try:
                r = json.loads(line)
            except ValueError:
                continue
            if r.get("file"):
                r["path"] = os.path.join(shots_dir, r["file"])
                rows.append(r)
    return rows


def resolve(spec, device, shots):
    if not spec:
        return None
    if isinstance(spec, str):
        p = spec if os.path.isabs(spec) else os.path.join(ROOT, spec)
        return p if os.path.exists(p) else None
    rx = re.compile(spec["match"], re.I)
    dev = spec.get("device", device)
    hits = [r for r in shots if r["device"] == dev and rx.search(r["sig"])]
    if not hits:
        return None
    return (hits[0] if spec.get("first") else hits[-1])["path"]


def to_webp(src, out_dir, name):
    os.makedirs(os.path.join(out_dir, "img"), exist_ok=True)
    rel = f"img/{name}.webp"
    im = Image.open(src).convert("RGB")
    if im.width > 1440:
        im = im.resize((1440, round(im.height * 1440 / im.width)), Image.LANCZOS)
    im.save(os.path.join(out_dir, rel), "WEBP", quality=80, method=6)
    return rel


def md_to_html(md):
    out, in_list = [], False
    def inline(s):
        s = html.escape(s)
        s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
        s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
        return s
    for line in md.splitlines():
        if line.startswith("- "):
            if not in_list:
                out.append("<ul>"); in_list = True
            out.append(f"<li>{inline(line[2:])}</li>")
            continue
        if in_list:
            out.append("</ul>"); in_list = False
        if line.startswith("# "):
            continue  # page has its own h1
        if line.startswith("## "):
            out.append(f"<h3>{inline(line[3:])}</h3>")
        elif line.strip():
            out.append(f"<p>{inline(line)}</p>")
    if in_list:
        out.append("</ul>")
    return "\n".join(out)


CSS = """
:root{--bg:#111013;--panel:#1b1a1e;--fg:#ece8df;--muted:#a9a397;--gold:#d4b35f;--line:#2e2c31;color-scheme:dark;
--display:"Cinzel",Georgia,serif;--body:"Source Sans 3",system-ui,sans-serif}
:root[data-theme="light"]{--bg:#f6f3ec;--panel:#fff;--fg:#1c1b1f;--muted:#5d584f;--gold:#8a6a1d;--line:#ddd6c8;color-scheme:light}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--bg:#f6f3ec;--panel:#fff;--fg:#1c1b1f;--muted:#5d584f;--gold:#8a6a1d;--line:#ddd6c8;color-scheme:light}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--body);font-size:16px;line-height:1.5}
main{max-width:1200px;margin:0 auto;padding:28px 16px 60px;display:grid;gap:28px}
h1{font-family:var(--display);color:var(--gold);font-size:clamp(26px,4vw,38px);margin:0;letter-spacing:.04em;text-wrap:balance}
.lede{color:var(--muted);margin:6px 0 0;max-width:65ch}
a{color:var(--gold)}
.box{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:16px 18px}
.box h3{font-family:var(--display);color:var(--gold);font-size:15px;letter-spacing:.08em;margin:16px 0 6px}
.box h3:first-child{margin-top:0}
.box ul{margin:0;padding-left:20px;display:grid;gap:4px}
.box p{margin:4px 0}
details.box summary{cursor:pointer;font-family:var(--display);color:var(--gold);letter-spacing:.06em}
nav.toc{display:flex;flex-wrap:wrap;gap:6px}
nav.toc a{font-size:13px;border:1px solid var(--line);border-radius:999px;padding:3px 10px;text-decoration:none}
.screen{border-top:1px solid var(--line);padding-top:18px;display:grid;gap:12px;scroll-margin-top:12px}
.screen h2{font-family:var(--display);font-size:20px;margin:0;color:var(--gold);letter-spacing:.03em}
.screen p{margin:2px 0 0;color:var(--muted)}
.prs{font-size:12px;color:var(--muted)}
.shots{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,1fr);gap:14px;align-items:start}
.shots.one{grid-template-columns:minmax(0,260px)}
.shots.one.wide{grid-template-columns:minmax(0,1fr)}
figure{margin:0;min-width:0}
figure img{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:4px}
figcaption{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:4px}
.ba{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media (max-width:640px){.shots{grid-template-columns:minmax(0,1fr)}.shots figure.phone{max-width:260px}}
.missing li{color:var(--muted)}
"""


def figure(rel, cls, caption, alt):
    return (f'<figure class="{cls}"><a href="{rel}" target="_blank"><img src="{rel}" alt="{html.escape(alt)}" loading="lazy"></a>'
            f'<figcaption>{html.escape(caption)}</figcaption></figure>')


def main():
    manifest_path, out_dir = sys.argv[1], sys.argv[2]
    m = json.load(open(manifest_path, encoding="utf8"))
    shots_dir = m.get("shots_dir")
    shots = load_shots(os.path.join(ROOT, shots_dir)) if shots_dir else []
    os.makedirs(out_dir, exist_ok=True)
    sections, toc, missing = [], [], []
    for i, s in enumerate(m["screens"], 1):
        slug = f"{i:02d}-" + re.sub(r"[^a-z0-9]+", "-", s["title"].lower()).strip("-")
        figs = {}
        for key, device in (("desktop", "desktop"), ("phone", "phone"), ("before_desktop", "desktop"), ("before_phone", "phone")):
            if key not in s or s[key] is None:
                continue
            src = resolve(s[key], device, shots)
            if src:
                figs[key] = to_webp(src, out_dir, f"{slug}-{key}")
            else:
                missing.append(f'{s["title"]}: {key.replace("_", " ")}')
        if not figs:
            continue
        toc.append(f'<a href="#{slug}">{html.escape(s["title"])}</a>')
        parts = [f'<section class="screen" id="{slug}"><header><h2>{html.escape(s["title"])}</h2><p>{html.escape(s.get("note", ""))}</p>']
        if s.get("prs"):
            parts.append(f'<div class="prs">PRs: {html.escape(", ".join("#" + str(p) for p in s["prs"]))}</div>')
        parts.append("</header>")
        if "before_desktop" in figs or "before_phone" in figs:
            for dev in ("desktop", "phone"):
                if f"before_{dev}" in figs and dev in figs:
                    parts.append('<div class="ba">' + figure(figs[f"before_{dev}"], dev, f"{dev} before", f'{s["title"]} {dev} before')
                                 + figure(figs[dev], dev, f"{dev} after", f'{s["title"]} {dev} after') + "</div>")
        else:
            got = [d for d in ("desktop", "phone") if d in figs]
            cls = "shots" if len(got) == 2 else ("shots one wide" if got == ["desktop"] else "shots one")
            parts.append(f'<div class="{cls}">' + "".join(figure(figs[d], d, d.capitalize(), f'{s["title"]} {d}') for d in got) + "</div>")
        parts.append("</section>")
        sections.append("".join(parts))
    notes_html = ""
    if m.get("notes"):
        notes_html = md_to_html(open(os.path.join(ROOT, m["notes"]), encoding="utf8").read())
    checklist = f'<p><a href="{html.escape(m["checklist_url"])}">Open the real-phone check list</a></p>' if m.get("checklist_url") else ""
    miss = ""
    if missing:
        miss = '<div class="box missing"><h3>MISSING SHOTS</h3><ul>' + "".join(f"<li>{html.escape(x)}</li>" for x in missing) + "</ul></div>"
    page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(m["title"])}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Source+Sans+3:wght@400;600&display=swap">
<style>{CSS}</style></head><body><main>
<div><h1>{html.escape(m["title"])}</h1><p class="lede">{html.escape(m.get("lede", ""))}</p>{checklist}</div>
<details class="box"><summary>RELEASE NOTES</summary>{notes_html}</details>
<nav class="toc">{"".join(toc)}</nav>
{miss}
{"".join(sections)}
</main></body></html>"""
    open(os.path.join(out_dir, "index.html"), "w", encoding="utf8").write(page)
    print(f"{len(sections)} screens, {len(missing)} missing -> {out_dir}/index.html")


if __name__ == "__main__":
    main()
