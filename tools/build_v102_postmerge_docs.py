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

RUNTIME_MERGE = "7a573ff2691b6143ecbc53df589822d5609f5e05"
PREMERGE_HEAD = "057586128d00812feee8681392a088e8c27a1e75"
PAGES_DEPLOYMENT = "5852810024"
LICENSED_RUN = "31503795213"
STABILITY_RUN = "31503795725"


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def exact(text, old, new, label, count=1):
    found = text.count(old)
    if found != count:
        raise SystemExit(f"{label}: expected {count} occurrence(s), found {found}: {old[:180]!r}")
    return text.replace(old, new)


def create_blob(path, content):
    payload = json.dumps({
        "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
        "encoding": "base64"
    }).encode("utf-8")
    request = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/git/blobs",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "career-mode-showdown-v102-postmerge-docs"
        }
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.load(response)
    print(f"V102_POSTMERGE_BLOB {path} {result['sha']}")
    return result["sha"]


outputs = {}

# PROJECT_STATE: move from candidate language to deployed technical-complete authority.
path = "PROJECT_STATE.md"
text = read(path)
text = exact(text,
    "**Current milestone:** v1.0.x finite visual-maintenance lane\n**Current activity:** v1.0.2 clean-anchor footballer photography maintenance candidate; owner real-device acceptance remains open until the public build is inspected\n",
    "**Current milestone:** v1.0.x finite owner visual-acceptance gate\n**Current activity:** v1.0.2 clean-anchor footballer photography maintenance is merged, deployed and post-merge green; owner real-device acceptance remains open until the owner inspects the public build\n",
    path)
needle = "**Runtime change class:** presentation + cache/release identity only; no gameplay, scoring, route, storage schema/key or state-machine change\n"
insert = needle + f"**v1.0.2 runtime merge:** `{RUNTIME_MERGE}`\n**GitHub Pages deployment:** `{PAGES_DEPLOYMENT}` — success\n**Post-merge Licensed Football Visuals:** run `{LICENSED_RUN}` — success\n**Post-merge Stability Lane:** run `{STABILITY_RUN}` — success, including exact deployed bytes and complete public journey\n"
text = exact(text, needle, insert, path)
outputs[path] = text

# NEXT_TASK: release work is complete; only owner review remains before v1.1 Candidate A.
path = "NEXT_TASK.md"
text = read(path)
start = text.index("## 2. Current technical gate")
end = text.index("## 4. Decision after v1.0.2 deployment")
replacement = f"""## 2. v1.0.2 technical completion

PR #13 is merged.

Final pre-merge candidate:

`{PREMERGE_HEAD}`

All eleven permanent PR workflows passed on that exact SHA.

Runtime merge on `main`:

`{RUNTIME_MERGE}`

GitHub Pages deployment:

`{PAGES_DEPLOYMENT}` — success.

Post-merge Licensed Football Visuals:

run `{LICENSED_RUN}` — success, including the real Chromium visual audit.

Post-merge Stability Lane:

run `{STABILITY_RUN}` — success, including:

- storage/release/CI contracts;
- two consecutive complete Chromium/provenance/Home/photo cycles;
- exact deployed runtime-byte verification;
- deployed runtime-error provenance;
- deployed Home / Marco Reus audit;
- deployed clean-anchor football-photo audit;
- complete deployed gameplay/navigation journey.

Technical status:

`COMPLETE, MERGED, DEPLOYED, POST-MERGE GREEN`

Do not rerun this evidence merely to rediscover the same state unless source changes or a new defect is reported.

## 3. Current owner gate

Owner art-direction status:

`PENDING REAL-DEVICE REVIEW OF DEPLOYED V1.0.2`

Automated/browser/deployment success is not owner acceptance.

The owner should now inspect the public build for:

- Home — desktop Marco Reus clean rectangular player anchor;
- Create Showdown — James Rodríguez facial contrast and top-identity/full-width-photo composition;
- Transfer Challenge — Marcus Rashford face clarity;
- Transfer Challenge — Anthony Martial consistency;
- loading screen — regression check only; its design was intentionally protected.

"""
text = text[:start] + replacement + text[end:]
outputs[path] = text

# README: public status no longer says deployment is in progress.
path = "README.md"
text = read(path)
text = exact(text,
    "**Current phase:** finite clean-anchor footballer-photography maintenance; technical validation/deployment gate in progress and owner real-device acceptance remains separate",
    "**Current phase:** v1.0.2 clean-anchor maintenance is technically complete, merged, deployed and post-merge green; owner real-device acceptance remains separate",
    path)
text = exact(text,
    "The original release path **v0.95 → v1.0** is complete. v1.0.2 is the finite maintenance response to the owner's August 11 real-device visual rejection: footballers are being integrated as clean player anchors, while the loading screen remains protected. Owner acceptance still remains separate from automated validation before the staged v1.1 data-safety lane becomes Current.",
    "The original release path **v0.95 → v1.0** is complete. v1.0.2 is the deployed finite maintenance response to the owner's August 11 real-device visual rejection: footballers now use clean player anchors, while the loading screen remains protected. The release is technically complete and post-merge green; owner real-device acceptance remains the only open visual gate before the staged v1.1 data-safety lane becomes Current.",
    path)
marker = "Permanent visual/browser gates enforce the clean-anchor layering, crop safety, responsive geometry, source provenance and Home/loading separation at Chromebook, near-breakpoint and mobile sizes.\n"
insert = marker + f"\nRuntime merge `{RUNTIME_MERGE}` and Pages deployment `{PAGES_DEPLOYMENT}` are verified. Post-merge Licensed Football Visuals and Stability Lane both passed, including exact deployed-byte verification and the complete public journey. Owner art-direction acceptance remains open.\n"
text = exact(text, marker, insert, path)
outputs[path] = text

# Start Here: remove active branch/candidate language and expose exact production proof.
path = "00_DEVELOPER_START_HERE.md"
text = read(path)
old = """Current maintenance branch/PR while candidate validation is active:

- branch: `agent/v1.0.2-footballer-tile-maintenance`;
- PR: `#13`.

"""
new = f"""Current runtime implementation merge:

`{RUNTIME_MERGE}`

GitHub Pages deployment:

`{PAGES_DEPLOYMENT}` — success.

PR #13 final candidate `{PREMERGE_HEAD}` passed all eleven permanent workflows before exact-head merge.

Post-merge Licensed Football Visuals run `{LICENSED_RUN}` and Stability Lane run `{STABILITY_RUN}` both passed on the runtime merge.

"""
text = exact(text, old, new, path)
text = exact(text, "Technical candidate state:\n\n`IN FULL VALIDATION`", "Technical v1.0.2 state:\n\n`COMPLETE, MERGED, DEPLOYED, POST-MERGE GREEN`", path)
text = exact(text, "`PENDING REAL-DEVICE REVIEW AFTER DEPLOYMENT`", "`PENDING REAL-DEVICE REVIEW OF DEPLOYED V1.0.2`", path)
outputs[path] = text

# Release record: correct the discarded James geometry and stamp final technical evidence.
path = "RELEASE_V1.0.2.md"
text = read(path)
old = """James:

- desktop clean-anchor photo stage: `60%`;
- desktop copy plate: `36%`;
- 701–1020 clean-anchor photo stage: `58%`;
- 701–1020 copy plate: `38%`.

Transfer desktop:

- Rashford photo stage: `34%`;
- Martial photo stage: `36%`;
- copy remains left of the photo anchor.
"""
new = """James desktop/windowed:

- full-width identity plate above the photograph;
- photo frame begins at `top:30%`;
- photo frame width: `100%`;
- copy and photograph are vertically separated;
- mobile explicitly resets to the compact side layout.

Transfer desktop:

- Rashford photo stage: `34%`;
- Martial photo stage: `36%`;
- copy remains left of the photo anchor.

Transfer 701–1020 windowed:

- copy plate: `52%`;
- Rashford photo stage: `40%`;
- Martial photo stage: `42%`;
- the larger anchors preserve the permanent 150px photo-frame quality floor.
"""
text = exact(text, old, new, path)
marker = "## Rollback\n"
evidence = f"""## Final technical release evidence

Final pre-merge candidate:

`{PREMERGE_HEAD}`

All eleven permanent PR workflows passed on that exact SHA.

Runtime merge:

`{RUNTIME_MERGE}`

GitHub Pages deployment:

`{PAGES_DEPLOYMENT}` — success.

Post-merge Licensed Football Visuals:

run `{LICENSED_RUN}` — success, including real desktop/near-breakpoint/mobile Chromium presentation.

Post-merge Stability Lane:

run `{STABILITY_RUN}` — success, including storage/release contracts, two consecutive Chromium cycles, exact deployed-byte verification, deployed runtime-error provenance, Home/Reus, football-photo and complete public gameplay/navigation journey.

Technical release status:

`COMPLETE, MERGED, DEPLOYED, POST-MERGE GREEN`

Owner art-direction acceptance remains explicitly open.

"""
if marker not in text:
    raise SystemExit(f"{path}: rollback marker missing")
text = text.replace(marker, evidence + marker, 1)
outputs[path] = text

# Changelog: record final deployment evidence under v1.0.2.
path = "CHANGELOG.md"
text = read(path)
marker = "Owner real-device visual acceptance remains required after the deployed build passes machine verification.\n"
insert = marker + f"\nFinal technical release evidence: pre-merge head `{PREMERGE_HEAD}` passed all eleven permanent workflows; runtime merge `{RUNTIME_MERGE}` deployed successfully as Pages deployment `{PAGES_DEPLOYMENT}`; post-merge Licensed Football Visuals `{LICENSED_RUN}` and Stability Lane `{STABILITY_RUN}` both passed, including exact deployed bytes and the complete public journey. Owner visual acceptance remains open.\n"
text = exact(text, marker, insert, path)
outputs[path] = text

# New rolling post-merge handoff.
outputs["CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_V1.0.2_POST_MERGE.md"] = f"""# Career Mode Showdown — v1.0.2 Post-Merge / Deployment Handoff

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Runtime release: `v1.0.2` / `1.0.2-r1`

## 1. Owner instruction carried through this release

The owner supplied Chromebook screenshots and an actual FIFA 17 menu reference, requested a major maintenance pass, and defined the visual direction:

- footballer photography must become a mature system;
- FIFA 17 tiles use the player as a clean visual anchor;
- James's face must not be washed out;
- Rashford's face must not be crossed by graphic lines;
- Home Reus must not have the unattractive head/neck cut;
- the cinematic loading screen is liked and must be protected;
- development should continue directly in GitHub through validation/deployment without intermediate owner work requests;
- meaningful actions/chat decisions must be recorded continuously.

GitHub access was checked at the start of the pass and was `Allow all actions`. No additional access request was required.

## 2. Final implementation principle

Old model:

`graphics over photograph`

v1.0.2 model:

`photograph as clean anchor; geometry stays behind/beside the player`

James, Rashford and Martial now declare `treatment: "clean-anchor"`.

The permanent runtime layering is:

- decorative ambience: z0/z1;
- photograph: z2;
- separated identity/copy plate: z4.

The complete authored derivatives remain crop-safe under `object-fit: contain`; no CSS colour filter is applied to these required photos.

## 3. Final visual solutions

### James Rodríguez — Create Showdown

The first side-column clean-anchor candidate still made James too inset at 940×700. The permanent coverage threshold rejected it twice; the threshold was never lowered.

Final desktop/windowed layout:

- full-width identity plate above the image;
- photograph begins at `top:30%`;
- photograph width `100%`;
- copy and photograph are vertically separated;
- mobile explicitly resets to the compact side layout.

This removes the white facial wash and makes James the tile anchor rather than a faded background.

### Marcus Rashford / Anthony Martial — Transfer Challenge

Final desktop layout remains left-copy/right-photo.

Desktop photo stages:

- Rashford `34%`;
- Martial `36%`.

The 940px browser gate found Rashford's original windowed frame below the permanent 150px quality floor. The floor was not weakened.

Final 701–1020 geometry:

- copy `52%`;
- Rashford `40%`;
- Martial `42%`.

Small phones stack the player tiles vertically.

Real browser screenshots show both faces unobstructed; decorative FIFA-inspired geometry stays in the background zone.

### Marco Reus — Home

Desktop Reus now uses a rectangular right-side photo anchor with no diagonal container clip.

Protected desktop positions:

- 940×700: `53% 2%`;
- 1100×720 / 1366×768: `53% 12%`.

No desktop CSS photo filter or competing jersey-number overlay remains.

The separate mobile treatment remains bounded.

### Loading screen

The owner-liked cinematic loading screen is explicitly protected. v1.0.2 did not redesign it; `visual-fidelity-r3.css` preserves the accepted startup composition while changing Home/menu photography separately.

## 4. Failure history preserved for future developers

1. Old frame-percentage Licensed Visual assertions failed — stale test authority; replaced with structural clean-anchor protection.
2. First James near-breakpoint candidate occupied only 54.6% of its frame — real visual failure; composition changed, threshold stayed.
3. APP/package version mismatch — release-coherence failure; package/root lock moved precisely to 1.0.2.
4. Statistics/Season Review failures — stale cache assertions; promoted without feature changes.
5. Static App failure — current docs/release still represented v1.0.1; v1.0.2 received its own release authority while v1.0.1 stayed immutable.
6. Second James side-column model occupied only 49.5% — real layout-model failure; redesigned to top identity/full-width lower photograph.
7. Windowed Rashford fell below 150px frame floor — real quality-floor failure; 701–1020 photo anchors increased to 40%/42%, threshold stayed.
8. Stability expected impossible `1.0.2-r5` — stale mechanical assertion; corrected to `1.0.2-r1`.
9. Stability rejected a temporary maintenance helper using an old checkout action — temporary CI-hygiene failure; every one-shot v1.0.2 builder/scan workflow/script was removed before final candidate.

Do not reinterpret these failures as reasons to restore rejected r3/r4/r5 presentation.

## 5. Final pre-merge evidence

PR #13:

`v1.0.2: rebuild footballer tiles around clean-anchor photography`

Final candidate:

`{PREMERGE_HEAD}`

All eleven permanent PR workflows passed on this exact immutable SHA.

Licensed Football Visuals passed contracts and real Chromium visual audits.

Stability Lane passed storage/release/CI contracts and two consecutive complete Chromium/provenance/Home/photo audit cycles.

Manual developer inspection of the final screenshots confirmed:

- James facial contrast restored and no face overlay;
- Rashford face unobstructed;
- Martial face unobstructed;
- desktop Reus free of the rejected diagonal head/neck cut;
- loading screen kept on its protected design path.

This is technical/developer evidence, not owner visual acceptance.

## 6. Merge

PR #13 was marked ready only after all eleven permanent workflows passed.

It was merged with exact expected-head protection against `{PREMERGE_HEAD}`.

Runtime merge:

`{RUNTIME_MERGE}`

Merge title:

`Merge v1.0.2 clean-anchor visual maintenance`

Current runtime tree is the exact final PR tree.

## 7. GitHub Pages deployment

Deployment ID:

`{PAGES_DEPLOYMENT}`

Environment:

`github-pages`

Deployment status:

`success`

Deployment SHA:

`{RUNTIME_MERGE}`

Public environment:

`https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## 8. Post-merge Licensed Football Visuals

Run:

`{LICENSED_RUN}`

Status:

`success`

Both jobs passed:

- licensed visual contracts;
- real browser visual audit across desktop, near-breakpoint and mobile.

Therefore the merge itself re-passed the clean-anchor photo contract.

## 9. Post-merge Stability Lane

Run:

`{STABILITY_RUN}`

Status:

`success`

Completed stages:

- storage/release/CI contracts — success;
- two consecutive complete Chromium/provenance/Home/crop-safe-photo cycles — success;
- wait for Pages and verify every runtime byte — success;
- deployed runtime-error provenance audit — success;
- deployed Home / Marco Reus audit — success;
- deployed clean-anchor football-photo audit — success;
- complete deployed gameplay/navigation journey — success.

This is the release's strongest technical/live proof.

## 10. Protected systems survived

No intentional behavior change was made to:

- gameplay/scoring/tiebreak rules;
- exactly-two-manager contract;
- League Wheel confirmation;
- Club Assignment transaction/reveal;
- Transfer Challenge state machine;
- Season Review confirmation transaction;
- Statistics calculation authority;
- Legacy/Trophy/Settings semantics;
- `js/screens.js` routing authority;
- `js/storage.js` persistence authority;
- localStorage keys/schema;
- optional-module/media lazy architecture.

All permanent workflow families stayed green through the final PR candidate and post-merge runtime.

## 11. Current status after deployment

Technical v1.0.2 status:

`COMPLETE, MERGED, DEPLOYED, POST-MERGE GREEN`

Owner visual acceptance:

`PENDING REAL-DEVICE REVIEW OF DEPLOYED V1.0.2`

Do not claim owner approval from CI, screenshots or developer inspection.

The owner should inspect:

- Home Reus desktop tile;
- Create Showdown James;
- Transfer Rashford;
- Transfer Martial;
- loading screen regression only.

## 12. Next legal development path

If the owner supplies new rejection evidence:

- remain inside the finite v1.0.x maintenance lane;
- reproduce the exact public/device failure;
- make the smallest targeted correction;
- strengthen the corresponding permanent gate;
- preserve accepted systems.

If the owner accepts v1.0.2 or explicitly defers visual review:

`v1.1.0 Data Safety and Recovery` becomes Current.

First implementation branch only:

`Candidate A — Versioned Backup Envelope + Non-Mutating Export`

Do not jump to Candidate B/C, PWA, profiles, cloud or two-device work.

## 13. Documentation finalization note

This file and the final current-state wording updates are documentation-only and were prepared only after the exact runtime merge and public deployment had already passed post-merge live verification.

The runtime release authority remains `{RUNTIME_MERGE}` / `v1.0.2` / `1.0.2-r1` even if `main` later has a documentation-only commit containing this handoff.
"""

for path, content in outputs.items():
    create_blob(path, content)

print(f"V102_POSTMERGE_BLOB_COUNT={len(outputs)}")
