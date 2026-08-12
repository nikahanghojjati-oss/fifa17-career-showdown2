from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one integration target in {path}, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


screens = ROOT / "js" / "screens.js"
replace_once(
    screens,
    'const REQUIRED_FOOTBALL_VISUAL_SCREENS = new Set(["createShowdown","transferChallenge","careerStatistics","trophyRoom"]);',
    'const REQUIRED_FOOTBALL_VISUAL_SCREENS = new Set(["createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary","careerStatistics","trophyRoom","legacy","ruleBook"]);'
)

optional = ROOT / "js" / "optionalModules.js"
replace_once(
    optional,
    'async function ensureFootballVisualModule(){\n    const stylePromise = loadRuntimeStyle("football-visual-ui", "css/footballVisuals.css");\n    await loadRuntimeScript("football-visual-data","data/footballVisuals.js",() => Boolean(window.FOOTBALL_VISUALS && window.FOOTBALL_VISUAL_SCREEN_PLAN));',
    'async function ensureFootballVisualModule(){\n    const baseStylePromise = loadRuntimeStyle("football-visual-ui", "css/footballVisuals.css");\n    const cinematicStylePromise = baseStylePromise.then(() => loadRuntimeStyle("football-visual-v113-ui", "css/footballVisuals-v113.css"));\n    await loadRuntimeScript("football-visual-data","data/footballVisuals.js",() => Boolean(window.FOOTBALL_VISUALS && window.FOOTBALL_VISUAL_SCREEN_PLAN));'
)
replace_once(
    optional,
    '    await stylePromise;\n    await window.initializeFootballVisuals();',
    '    await cinematicStylePromise;\n    await window.initializeFootballVisuals();'
)

visual_css = ROOT / "css" / "footballVisuals-v113.css"
replace_once(
    visual_css,
    'html[data-motion-reduced="true"] .footballVisualCinematicBand .footballVisualMedia,\n@media(prefers-reduced-motion:reduce){',
    'html[data-motion-reduced="true"] .footballVisualCinematicBand .footballVisualMedia{transition:none;}\n\n@media(prefers-reduced-motion:reduce){'
)

print("v1.1.3 runtime visual integration applied deterministically")
