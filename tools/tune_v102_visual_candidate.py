#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def exact(path, old, new, count=1):
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    found = text.count(old)
    if found != count:
        raise SystemExit(f"{path}: expected {count} occurrences, found {found}: {old!r}")
    target.write_text(text.replace(old, new), encoding="utf-8")
    print(f"updated {path}: {old!r} -> {new!r}")


exact("css/footballVisuals.css", '.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame{\n    width:66%;\n}', '.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame{\n    width:60%;\n}')
exact("css/footballVisuals.css", '.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualCopy{\n    width:30%;\n}', '.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualCopy{\n    width:36%;\n}')
exact("css/footballVisuals.css", 'font-size:clamp(26px,2.8vw,37px);', 'font-size:clamp(24px,2.35vw,32px);')
exact("css/footballVisuals.css", '.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame{width:64%;}', '.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame{width:58%;}')
exact("css/footballVisuals.css", '.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualCopy{width:33%;left:11px;top:15px;padding:9px 9px 10px;}', '.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualCopy{width:38%;left:11px;top:15px;padding:9px 9px 10px;}')
exact("css/footballVisuals.css", '.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualName{font-size:clamp(23px,3vw,31px);}', '.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualName{font-size:clamp(22px,2.4vw,29px);}')

exact("package.json", '"version": "1.0.1"', '"version": "1.0.2"')
exact("package-lock.json", '"version": "1.0.1"', '"version": "1.0.2"', count=2)

print("v1.0.2 visual candidate tuning complete")
