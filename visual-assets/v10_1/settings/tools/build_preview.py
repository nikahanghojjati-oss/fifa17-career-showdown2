# Builds preview.html for Settings review. Run from visual-assets/v10_1/settings.
import base64, json, re, sys, html

commit = sys.argv[1] if len(sys.argv) > 1 else "working tree"
page = open("index.html").read()
css = open("settings.css").read()
js = open("settings.js").read()
fx = json.load(open("fixtures.json"))

def text(path):
    return open(path, encoding="utf-8").read()

def data_uri(path, mime):
    raw = open(path, "rb").read()
    return "data:%s;base64,%s" % (mime, base64.b64encode(raw).decode())

shared_css = "\n".join(text("../shared/" + p) for p in [
    "showdown-tokens.css", "showdown-type.css", "showdown-ui.css", "stage.css", "motion.css"
])
shared_js = "\n".join(text("../shared/" + p) for p in ["stage.js", "motion.js"])
plate1 = data_uri("../shared/plates/ENV_SYS_PLATE_V1_1X.webp", "image/webp")
plate2 = data_uri("../shared/plates/ENV_SYS_PLATE_V1_2X.webp", "image/webp")
phone = data_uri("../shared/plates/ENV_SYS_PHONE_V1.webp", "image/webp")
wordmark = data_uri("../shared/wordmarks/TITLE_SETTINGS_V1.webp", "image/webp")

for href in [
    '<link rel="stylesheet" href="../shared/showdown-tokens.css">',
    '<link rel="stylesheet" href="../shared/showdown-type.css">',
    '<link rel="stylesheet" href="../shared/showdown-ui.css">',
    '<link rel="stylesheet" href="../shared/stage.css">',
    '<link rel="stylesheet" href="../shared/motion.css">',
    '<link rel="stylesheet" href="settings.css">'
]:
    page = page.replace(href, "")
page = page.replace("</head>", "<style>" + shared_css + "\n" + css + "</style></head>")
page = page.replace('<script src="../shared/stage.js" defer></script>', "")
page = page.replace('<script src="../shared/motion.js" defer></script>', "")
page = page.replace('<script src="settings.js" defer></script>', "")
page = page.replace('../shared/wordmarks/TITLE_SETTINGS_V1.webp', wordmark)
page = page.replace('../shared/plates/ENV_SYS_PHONE_V1.webp', phone)
page = page.replace('../shared/plates/ENV_SYS_PLATE_V1_1X.webp', plate1)
page = page.replace('../shared/plates/ENV_SYS_PLATE_V1_2X.webp', plate2)

boot = """<script>
window.SETTINGS_QS="__QS__";
window.fetch=(url)=>url==="fixtures.json"
 ? Promise.resolve({json:()=>Promise.resolve(__FX__)})
 : Promise.reject(new Error("preview blocks network"));
</script><script>__SHARED__</script><script>__APP__</script>"""
boot = boot.replace("__FX__", json.dumps(fx, ensure_ascii=False))
boot = boot.replace("__SHARED__", shared_js).replace("__APP__", js)
page = page.replace("</body>", boot + "</body>")
template = json.dumps(page)

frames = [("ST1","Default"),("ST2","Reduced motion"),("ST3","Confirm"),
          ("ST4","Loading"),("ST5","Empty"),("ST6","Unavailable"),("ST7","Partial")]
buttons = "".join('<button data-frame="%s">%s</button>' % x for x in frames)

out = """<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Settings Build Preview</title>
<style>
body{margin:0;padding:18px;background:#080808;color:#eee;font:14px system-ui}
.wrap{max-width:1366px;margin:auto}.bar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
button{min-height:40px;padding:0 12px;background:#171717;color:#eee;border:1px solid #8a713d}
button.on{background:#d9b15f;color:#080808}.screen{position:relative;width:100%;aspect-ratio:1366/768;background:#000}
.screen.phone{width:min(100%,393px);aspect-ratio:393/660;margin:auto}
iframe{border:0;width:1366px;height:768px;transform-origin:0 0}
.phone iframe{width:393px;height:660px}
</style><div class="wrap"><h1>Settings</h1>
<div class="bar"><button data-device="desktop" class="on">Desktop</button><button data-device="phone">Phone</button>__BUTTONS__</div>
<div id="screen" class="screen"><iframe id="view" title="Settings preview"></iframe></div>
<p>Build __COMMIT__</p></div><script>
const TPL=__TPL__, s={d:"desktop",f:"ST1"}, screen=document.getElementById("screen"), view=document.getElementById("view");
function fit(){const w=s.d==="phone"?393:1366;view.style.transform="scale("+screen.clientWidth/w+")"}
function render(){screen.classList.toggle("phone",s.d==="phone");view.srcdoc=TPL.replace("__QS__","?frame="+s.f);fit()}
document.querySelectorAll("[data-device]").forEach(b=>b.onclick=()=>{s.d=b.dataset.device;document.querySelectorAll("[data-device]").forEach(x=>x.classList.toggle("on",x===b));render()});
document.querySelectorAll("[data-frame]").forEach(b=>b.onclick=()=>{s.f=b.dataset.frame;document.querySelectorAll("[data-frame]").forEach(x=>x.classList.toggle("on",x===b));render()});
addEventListener("resize",fit);render();
</script>"""
out = out.replace("__BUTTONS__", buttons).replace("__COMMIT__", html.escape(commit))
out = out.replace("__TPL__", template.replace("</script>", "<\\/script>"))
open("preview.html","w",encoding="utf-8").write(out)
print("wrote preview.html", len(out))
