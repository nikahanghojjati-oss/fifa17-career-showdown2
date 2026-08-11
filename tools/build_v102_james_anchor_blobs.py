#!/usr/bin/env python3
import base64
import json
import os
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
if not TOKEN:
    raise SystemExit("GITHUB_TOKEN is required")


def exact(text, old, new, label, count=1):
    found = text.count(old)
    if found != count:
        raise SystemExit(f"{label}: expected {count}, found {found}: {old[:180]!r}")
    return text.replace(old, new)


def blob(path, content):
    payload = json.dumps({
        "content": base64.b64encode(content.encode()).decode(),
        "encoding": "base64"
    }).encode()
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/git/blobs",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "career-mode-showdown-v102-james-anchor"
        }
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        sha = json.load(response)["sha"]
    print(f"V102_JAMES_BLOB {path} {sha}")

# CSS: top identity rail + full-width lower photograph on desktop/windowed.
path = "css/footballVisuals.css"
text = (ROOT / path).read_text(encoding="utf-8")
old = '''.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame{
    width:60%;
}

.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualCopy{
    width:36%;
}
'''
new = '''.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame{
    top:30%;
    right:0;
    bottom:0;
    width:100%;
}

.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualCopy{
    top:14px;
    left:14px;
    right:14px;
    bottom:auto;
    width:auto;
}
'''
text = exact(text, old, new, path)
old = '''    .footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame{width:58%;}
    .footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualCopy{width:38%;left:11px;top:15px;padding:9px 9px 10px;}
'''
new = '''    .footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame{top:30%;width:100%;}
    .footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualCopy{width:auto;left:11px;right:11px;top:15px;padding:9px 9px 10px;}
'''
text = exact(text, old, new, path)
old = '''    .footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame{
        width:58%;
    }
    .footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualCopy{
        width:37%;
        left:10px;
        top:12px;
        padding:8px 8px 9px;
    }
'''
new = '''    .footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame{
        top:0;
        bottom:0;
        width:58%;
    }
    .footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualCopy{
        width:37%;
        left:10px;
        right:auto;
        top:12px;
        padding:8px 8px 9px;
    }
'''
text = exact(text, old, new, path)
blob(path, text)

# Browser audit: allow either horizontal or vertical separation while still forbidding copy/photo overlap.
path = "tests/browser/football-visual-audit.cjs"
text = (ROOT / path).read_text(encoding="utf-8")
old = '''                    copyRight: copyRect.right,
                    frameLeft: frameRect.left
'''
new = '''                    copyLeft: copyRect.left,
                    copyRight: copyRect.right,
                    copyTop: copyRect.top,
                    copyBottom: copyRect.bottom,
                    frameLeft: frameRect.left,
                    frameRight: frameRect.right,
                    frameTop: frameRect.top,
                    frameBottom: frameRect.bottom
'''
text = exact(text, old, new, path)
old = '''            assert.ok(
                panel.copyRight <= panel.frameLeft + 2,
                `${screenName}/${panel.asset}: text/caption intrudes into the clean photographic anchor.`
            );
'''
new = '''            const horizontallySeparated = panel.copyRight <= panel.frameLeft + 2 || panel.copyLeft >= panel.frameRight - 2;
            const verticallySeparated = panel.copyBottom <= panel.frameTop + 2 || panel.copyTop >= panel.frameBottom - 2;
            assert.ok(
                horizontallySeparated || verticallySeparated,
                `${screenName}/${panel.asset}: text/caption intrudes into the clean photographic anchor.`
            );
'''
text = exact(text, old, new, path)
blob(path, text)

# Permanent contract follows the new James layout rather than an obsolete side-column percentage.
path = ".github/workflows/validate-football-visuals.yml"
text = (ROOT / path).read_text(encoding="utf-8")
old = '''          assert.ok(/footballVisualHeroSetup\\[data-photo-treatment="clean-anchor"\\] \\.footballVisualMediaFrame\\{\\s*width:60%;/.test(visualCss), 'James desktop clean-anchor photo stage changed unexpectedly.');
          assert.ok(/@media\\(min-width:701px\\) and \\(max-width:1020px\\)\\{[\\s\\S]*?footballVisualHeroSetup\\[data-photo-treatment="clean-anchor"\\] \\.footballVisualMediaFrame\\{width:58%;\\}[\\s\\S]*?footballVisualHeroSetup\\[data-photo-treatment="clean-anchor"\\] \\.footballVisualCopy\\{width:38%;/.test(visualCss), 'James near-breakpoint clean-anchor stage must retain the browser-tuned 58% photo / 38% copy geometry.');
'''
new = '''          assert.ok(/footballVisualHeroSetup\\[data-photo-treatment="clean-anchor"\\] \\.footballVisualMediaFrame\\{[\\s\\S]*?top:30%;[\\s\\S]*?width:100%;/.test(visualCss), 'James desktop clean-anchor must retain the full-width lower photo stage.');
          assert.ok(/footballVisualHeroSetup\\[data-photo-treatment="clean-anchor"\\] \\.footballVisualCopy\\{[\\s\\S]*?top:14px;[\\s\\S]*?right:14px;[\\s\\S]*?width:auto;/.test(visualCss), 'James desktop identity plate must remain above and separate from the photograph.');
          assert.ok(/@media\\(min-width:701px\\) and \\(max-width:1020px\\)\\{[\\s\\S]*?footballVisualHeroSetup\\[data-photo-treatment="clean-anchor"\\] \\.footballVisualMediaFrame\\{top:30%;width:100%;\\}[\\s\\S]*?footballVisualHeroSetup\\[data-photo-treatment="clean-anchor"\\] \\.footballVisualCopy\\{width:auto;left:11px;right:11px;/.test(visualCss), 'James near-breakpoint must retain the full-width lower photo / full-width top identity layout.');
          assert.ok(/@media\\(max-width:700px\\)\\{[\\s\\S]*?footballVisualHeroSetup\\[data-photo-treatment="clean-anchor"\\] \\.footballVisualMediaFrame\\{[\\s\\S]*?top:0;[\\s\\S]*?width:58%;/.test(visualCss), 'James mobile path must explicitly reset the desktop vertical-stage geometry.');
'''
text = exact(text, old, new, path)
blob(path, text)

print("V102_JAMES_BLOB_COUNT=3")
