#!/usr/bin/env python3
import base64, json, os, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
if not TOKEN:
    raise SystemExit("GITHUB_TOKEN is required")


def exact(text, old, new, label, count=1):
    found = text.count(old)
    if found != count:
        raise SystemExit(f"{label}: expected {count}, found {found}: {old[:160]!r}")
    return text.replace(old, new)


def blob(path, content):
    payload = json.dumps({"content": base64.b64encode(content.encode()).decode(), "encoding": "base64"}).encode()
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/git/blobs",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "career-mode-showdown-v102-near-transfer"
        }
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        sha = json.load(response)["sha"]
    print(f"V102_NEAR_BLOB {path} {sha}")

# Increase Transfer player presence specifically at the 701–1020 windowed breakpoint.
path = "css/footballVisuals.css"
text = (ROOT / path).read_text(encoding="utf-8")
needle = '''    .footballVisualHeroTransfer{min-height:198px;}
    .footballVisualHeroTransfer .footballVisualPanel{min-height:198px;}
'''
insert = needle + '''    .footballVisualHeroTransfer .footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualCopy{width:52%;}
    .footballVisualHeroTransfer .footballVisualPanel[data-football-visual-asset="marcus-rashford-man-utd-2017-smart-r5"] .footballVisualMediaFrame{width:40%;}
    .footballVisualHeroTransfer .footballVisualPanel[data-football-visual-asset="anthony-martial-man-utd-2016-smart-r5"] .footballVisualMediaFrame{width:42%;}
'''
text = exact(text, needle, insert, path)
blob(path, text)

# Strengthen permanent visual authority around the new windowed Transfer geometry.
path = ".github/workflows/validate-football-visuals.yml"
text = (ROOT / path).read_text(encoding="utf-8")
needle = '''          assert.ok(/data-football-visual-asset="anthony-martial-man-utd-2016-smart-r5"\\] \\.footballVisualMediaFrame\\{\\s*width:36%;/.test(visualCss), 'Martial desktop clean-anchor photo stage changed unexpectedly.');
'''
insert = needle + '''          assert.ok(/@media\\(min-width:701px\\) and \\(max-width:1020px\\)\\{[\\s\\S]*?marcus-rashford-man-utd-2017-smart-r5[\\s\\S]*?width:40%;[\\s\\S]*?anthony-martial-man-utd-2016-smart-r5[\\s\\S]*?width:42%;/.test(visualCss), 'Windowed Transfer player anchors must retain the 40% Rashford / 42% Martial quality-floor geometry.');
'''
text = exact(text, needle, insert, path)
blob(path, text)

# Correct the Stability Lane release identity. v1.0.2 is revision r1, not r5.
path = "tests/contracts/stability-contracts.cjs"
text = (ROOT / path).read_text(encoding="utf-8")
old = '''assert.equal(revision, `${appVersion}-r5`, "The owner-requested smart-crop visual rebuild must use the r5 cache identity.");'''
new = '''assert.equal(revision, `${appVersion}-r1`, "The v1.0.2 maintenance release must use its r1 cache identity.");'''
text = exact(text, old, new, path)
blob(path, text)

print("V102_NEAR_BLOB_COUNT=3")
