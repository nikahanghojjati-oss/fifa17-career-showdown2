import json, html, os
from PIL import Image
S="/tmp/claude-0/-home-claude-fifa17-career-showdown2/7a7e8a39-a0e1-56bd-bcc0-a5ef7b6559ea/scratchpad"
OUT=S+"/r75-gallery"
m=json.load(open(S+"/r75-gal-tools/manifest.json"))
notes=json.load(open(S+"/r75-gal-tools/notes.json")) if os.path.exists(S+"/r75-gal-tools/notes.json") else {}
SCREENS=[("home","Home"),("connect-players","Connect Players"),("select-league","Select League"),("club","Club"),("transfer-challenge","Transfer Challenge"),("season-results","Season Results"),("standings","Standings"),("final-winner","Final Winner"),("rivalry","Rivalry"),("legacy","Legacy"),("trophy-room","Trophy Room"),("career-stats","Career Stats"),("rule-book","Rule Book"),("settings","Settings")]
SIZES=[("desktop-1920x1080","Desktop 1920x1080","desktop"),("desktop-1280x650","Desktop 1280x650","desktop"),("phone-393x660","Phone 393x660","phone"),("phone-844x390","Phone sideways 844x390","land")]
GROUPS=[("desktop","Desktop"),("phone","Phone"),("land","Phone sideways")]
sizeinfo={k:(l,g) for k,l,g in SIZES}
by={}
for s in m["shots"]: by.setdefault(s["slug"],[]).append(s)
fails={}
for f in m["failures"]: fails.setdefault(f["slug"],[]).append(f)
def esc(t): return html.escape(t,quote=True)
def fig(s):
    label,_=sizeinfo[s["size"]]
    cap=label+(" · "+s["caption"] if s.get("extra") else "")
    p="shots/"+s["file"]
    w,h=Image.open(OUT+"/"+p).size
    return f'<figure><a href="{p}" target="_blank" rel="noopener"><img src="{p}" width="{w}" height="{h}" loading="lazy" alt="{esc(s["title"])} - {esc(cap)}"></a><figcaption>{esc(cap)}</figcaption></figure>'
def strip(file,cap):
    p="shots/"+file
    w,h=Image.open(OUT+"/"+p).size
    return f'<figure class="wide"><a href="{p}" target="_blank" rel="noopener"><img src="{p}" width="{w}" height="{h}" loading="lazy" alt="{esc(cap)}"></a><figcaption>{esc(cap)}</figcaption></figure>'
def quotafig(file,cap):
    p="shots/"+file
    w,h=Image.open(OUT+"/"+p).size
    return f'<figure><a href="{p}" target="_blank" rel="noopener"><img src="{p}" width="{w}" height="{h}" loading="lazy" alt="{esc(cap)}"></a><figcaption>{esc(cap)}</figcaption></figure>'
X=json.load(open(S+"/r75-gal-tools/extra-notes.json"))
slow=['<section id="slow-start"><h2><span class="num">A</span>Slow cold start (Reus Gate)</h2>']
for line in X["slow"]["info"]: slow.append(f'<p class="info">{esc(line)}</p>')
for line in X["slow"].get("verdict",[]): slow.append(f'<p class="verdict">{esc(line)}</p>')
slow.append('<h3>Fresh strip from the release tree</h3>')
slow.append(f'<p class="info">{esc(X["slow"]["fresh"])}</p>')
slow.append('<div class="grid strips">'+strip("slowstart-r75-1920x910.jpg","r75 release tree, slow network, frame every 250 ms")+'</div>')
slow.append('<h3>Before (r74): old Home shows under the loading screen</h3>')
slow.append(f'<p class="info">{esc(X["slow"]["before"])}</p>')
slow.append('<div class="grid strips">'+"".join(strip(f,c) for f,c in [("strip-before-first-visit-1920x910.jpg","Before (r74), first visit, 1920x910"),("strip-before-repeat-visit-sw-1920x910.jpg","Before (r74), repeat visit with service worker, 1920x910"),("strip-before-new-release-1920x910.jpg","Before (r74), first open after a new release, 1920x910")])+'</div>')
slow.append('<h3>After (r75): loading screen until the real Home is ready</h3>')
slow.append(f'<p class="info">{esc(X["slow"]["after"])}</p>')
slow.append('<div class="grid strips">'+"".join(strip(f,c) for f,c in [("strip-after-first-c6-1920x910.jpg","After (r75), first visit, 1920x910"),("strip-after-sw-c6-1920x910.jpg","After (r75), repeat visit with service worker, 1920x910"),("strip-after-update-c6-1920x910.jpg","After (r75), first open after an update, 1920x910")])+'</div>')
slow.append('<div class="grid strips2">'+"".join(strip(f,c) for f,c in [("strip-after-first-c6-393x660.jpg","After (r75), first visit, phone 393x660"),("strip-after-first-c6-844x390.jpg","After (r75), first visit, phone sideways 844x390")])+'</div>')
slow.append('</section>')
quota=['<section id="free-limit"><h2><span class="num">B</span>Free limit message</h2>']
for line in X["quota"]["info"]: quota.append(f'<p class="info">{esc(line)}</p>')
for line in X["quota"].get("issues",[]): quota.append(f'<p class="issue"><b>Spotted:</b> {esc(line)}</p>')
quota.append('<h3>Home</h3><div class="grid desktop">'+quotafig("quota-home-desktop.jpg","Home after the limit is hit: tap START A SHOWDOWN, desktop 1920x1080")+'</div><div class="grid phone">'+quotafig("quota-home-phone.jpg","Home after the limit is hit: tap START A SHOWDOWN, phone 393x660")+'</div>')
quota.append('<h3>Connect Players</h3><div class="grid desktop">'+quotafig("quota-connect-desktop.jpg","Connect Players with the limit used up, desktop 1920x1080")+'</div><div class="grid phone">'+quotafig("quota-connect-phone.jpg","Connect Players with the limit used up, phone 393x660")+'</div>')
quota.append('</section>')
secs=[]
for i,(slug,title) in enumerate(SCREENS,1):
    shots=by.get(slug,[])
    parts=[f'<section id="{slug}"><h2><span class="num">{i:02d}</span>{esc(title)}</h2>']
    for line in notes.get(slug,{}).get("info",[]): parts.append(f'<p class="info">{esc(line)}</p>')
    for line in notes.get(slug,{}).get("issues",[]): parts.append(f'<p class="issue"><b>Spotted:</b> {esc(line)}</p>')
    missing=[]
    for sk,label,g in SIZES:
        if not any(s["size"]==sk and not s.get("extra") for s in shots): missing.append(label)
    if not shots:
        parts.append('<p class="missing">Not reachable in the test harness.</p>')
    else:
        for g,gl in GROUPS:
            items=[s for s in shots if sizeinfo[s["size"]][1]==g]
            order={k:n for n,(k,_,_) in enumerate(SIZES)}
            items.sort(key=lambda s:(order[s["size"]],1 if s.get("extra") else 0))
            if items: parts.append(f'<div class="grid {g}">'+"".join(fig(s) for s in items)+'</div>')
        for label in missing: parts.append(f'<p class="missing">{esc(label)}: not reachable in the test harness.</p>')
    parts.append('</section>')
    secs.append("\n".join(parts))
nav='<a href="#slow-start">Slow cold start</a><a href="#free-limit">Free limit message</a>'+"".join(f'<a href="#{s}">{esc(t)}</a>' for s,t in SCREENS)
doc=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>r75 Screen Check</title>
<style>
:root{{--bg:#0b0d10;--panel:#14181d;--line:#2a3039;--text:#e9ecef;--muted:#9aa4b0;--accent:#f4c320;--warn:#ff9f6e;--chip:#1c2128}}
:root[data-theme="light"]{{--bg:#f5f6f8;--panel:#ffffff;--line:#d5d9df;--text:#16191d;--muted:#5a6572;--accent:#9a6f00;--warn:#b3441a;--chip:#eceef2}}
*{{box-sizing:border-box}}
html{{background:var(--bg)}}
body{{margin:0;padding:24px 16px 64px;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow-x:hidden}}
main{{max-width:1500px;margin:0 auto}}
h1{{margin:0 0 6px;font-size:clamp(1.6rem,5vw,2.4rem);line-height:1.15}}
.intro{{margin:0 0 18px;color:var(--muted)}}
nav{{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 28px}}
nav a{{padding:6px 12px;border:1px solid var(--line);border-radius:999px;background:var(--chip);color:var(--text);text-decoration:none;font-size:.88rem}}
nav a:hover{{border-color:var(--accent)}}
section{{margin:0 0 40px;padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--panel);scroll-margin-top:12px}}
h2{{margin:0 0 10px;font-size:1.3rem;display:flex;align-items:baseline;gap:10px}}
.num{{color:var(--accent);font-variant-numeric:tabular-nums;font-size:.95rem}}
.info,.issue,.missing{{margin:0 0 10px;font-size:.92rem;color:var(--muted)}}
.issue{{color:var(--warn)}}
.missing{{padding:10px 12px;border:1px dashed var(--line);border-radius:8px}}
.grid{{display:grid;gap:14px;margin:0 0 14px}}
.grid.desktop{{grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr))}}
.grid.phone{{grid-template-columns:repeat(auto-fill,minmax(min(100%,190px),230px))}}
.grid.strips,.grid.strips2{{grid-template-columns:1fr}}
.grid.strips2{{grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}}
figure.wide a{{background:#fff}}
h3{{margin:18px 0 8px;font-size:1.02rem}}
.verdict{{margin:0 0 10px;font-size:.95rem;color:var(--text);padding:10px 12px;border-left:3px solid var(--accent);background:var(--chip);border-radius:0 8px 8px 0}}
.grid.land{{grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),460px))}}
figure{{margin:0;min-width:0}}
figure a{{display:block;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#000}}
figure img{{display:block;width:100%;height:auto}}
figcaption{{margin-top:6px;font-size:.82rem;color:var(--muted);overflow-wrap:anywhere}}
</style>
</head>
<body>
<main>
<h1>r75 Screen Check</h1>
<p class="intro">Every page going live in r75, rendered in Chromium from the release tree, desktop and phone. Tap a picture to open it full size.</p>
<nav aria-label="Screens">{nav}</nav>
{chr(10).join(slow)}
{chr(10).join(quota)}
{chr(10).join(secs)}
</main>
</body>
</html>
'''
open(OUT+"/index.html","w").write(doc)
tot=sum(os.path.getsize(OUT+"/shots/"+f) for f in os.listdir(OUT+"/shots"))
print("written; shots",len(os.listdir(OUT+"/shots")),"bytes",tot, round(tot/1048576,2),"MB")
