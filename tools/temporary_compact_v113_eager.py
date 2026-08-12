from pathlib import Path
import gzip
import re

SCREEN_PATH = Path("js/screens.js")
OPTIONAL_PATH = Path("js/optionalModules.js")
INDEX_PATH = Path("index.html")

screens = SCREEN_PATH.read_text()
optional = OPTIONAL_PATH.read_text()

screen_old = 'const REQUIRED_FOOTBALL_VISUAL_SCREENS = new Set(["createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary","careerStatistics","trophyRoom","legacy","ruleBook"]);'
screen_new = 'const REQUIRED_FOOTBALL_VISUAL_SCREENS=new Set(screens.filter(name=>name!=="mainMenu"&&name!=="statistics"));'

style_old = '    const baseStylePromise = loadRuntimeStyle("football-visual-ui", "css/footballVisuals.css");\n    const cinematicStylePromise = baseStylePromise.then(() => loadRuntimeStyle("football-visual-v113-ui", "css/footballVisuals-v113.css"));'
style_new = '    const stylePromise=loadRuntimeStyle("football-visual-ui","css/footballVisuals.css").then(()=>loadRuntimeStyle("football-visual-v113-ui","css/footballVisuals-v113.css"));'

ready_old = '        () => typeof window.initializeFootballVisuals === "function"\n            && typeof window.prepareFootballVisualScreen === "function"\n            && typeof window.preloadFootballVisualAssets === "function"'
ready_new = '        ()=>["initializeFootballVisuals","prepareFootballVisualScreen","preloadFootballVisualAssets"].every(name=>typeof window[name]==="function")'

await_old = '    await cinematicStylePromise;'
await_new = '    await stylePromise;'

for label, text, old in [
    ("visual screen ownership", screens, screen_old),
    ("visual stylesheet chain", optional, style_old),
    ("visual readiness predicate", optional, ready_old),
    ("visual stylesheet await", optional, await_old),
]:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one guarded match, got {count}")

screens = screens.replace(screen_old, screen_new, 1)
optional = optional.replace(style_old, style_new, 1)
optional = optional.replace(ready_old, ready_new, 1)
optional = optional.replace(await_old, await_new, 1)

SCREEN_PATH.write_text(screens)
OPTIONAL_PATH.write_text(optional)

html = INDEX_PATH.read_text()
revision = re.search(r'app-asset-revision"\s+content="([^"]+)', html)
if not revision or revision.group(1) != "1.1.3-r1":
    raise SystemExit("v1.1.3-r1 release identity is not coherent")

refs = re.findall(r'(?:src|href)="((?:js|css|data)/[^"?#]+)(?:\?v=([^"#]+))?', html)
if len([path for path, _ in refs if path.startswith("js/")]) != 7:
    raise SystemExit("initial shell script count drifted")
if any(asset_revision != "1.1.3-r1" for _, asset_revision in refs):
    raise SystemExit("mixed eager asset revisions")

raw = sum(Path(path).stat().st_size for path, _ in refs)
gz = sum(len(gzip.compress(Path(path).read_bytes(), compresslevel=9, mtime=0)) for path, _ in refs)
print(f"guarded eager payload: {raw} raw / {gz} gzip")
if raw > 165000:
    raise SystemExit(f"raw startup budget still exceeded: {raw} > 165000")
if gz > 37500:
    raise SystemExit(f"gzip startup budget exceeded: {gz} > 37500")

if 'new Set(screens.filter(name=>name!=="mainMenu"&&name!=="statistics"))' not in screens:
    raise SystemExit("derived visual-route set was not published")
if 'setLeagueWheelTransition' not in Path("js/leagueWheel.js").read_text():
    raise SystemExit("wheel transition regression fix disappeared")

print("Behavior-equivalent v1.1.3 eager-path compaction passed protected budgets.")
