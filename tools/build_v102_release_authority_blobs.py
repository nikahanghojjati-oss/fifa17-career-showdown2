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


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def exact(text, old, new, label, count=1):
    found = text.count(old)
    if found != count:
        raise SystemExit(f"{label}: expected {count} occurrences, found {found}: {old[:160]!r}")
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
            "User-Agent": "career-mode-showdown-v102-release-authority"
        }
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.load(response)
    print(f"V102_RELEASE_BLOB {path} {result['sha']}")
    return result["sha"]


outputs = {}

# Statistics and Season Review: only promote current cache identity assertions.
path = ".github/workflows/validate-statistics-workstream.yml"
text = read(path)
text = exact(text, r"/^1\.0\.1-r\d+$/", r"/^1\.0\.2-r\d+$/", path)
text = text.replace("The v1.0.1 deployment asset revision is missing from the shell.", "The v1.0.2 deployment asset revision is missing from the shell.")
outputs[path] = text

path = ".github/workflows/validate-season-review.yml"
text = read(path)
text = exact(text, r"/^1\.0\.1-r\d+$/", r"/^1\.0\.2-r\d+$/", path)
text = text.replace("Shell must expose the v1.0.1 cache revision.", "Shell must expose the v1.0.2 cache revision.")
outputs[path] = text

# Football visual authority: promote the tuned James geometry and explicitly protect near-breakpoint composition.
path = ".github/workflows/validate-football-visuals.yml"
text = read(path)
text = exact(text, "footballVisualHeroSetup\\[data-photo-treatment=\"clean-anchor\"\\] \\.footballVisualMediaFrame\\{\\s*width:66%;", "footballVisualHeroSetup\\[data-photo-treatment=\"clean-anchor\"\\] \\.footballVisualMediaFrame\\{\\s*width:60%;", path)
needle = "assert.ok(/footballVisualHeroSetup\\[data-photo-treatment=\"clean-anchor\"\\] \\.footballVisualMediaFrame\\{\\s*width:60%;/.test(visualCss), 'James desktop clean-anchor photo stage changed unexpectedly.');"
insert = needle + "\n          assert.ok(/@media\\(min-width:701px\\) and \\(max-width:1020px\\)\\{[\\s\\S]*?footballVisualHeroSetup\\[data-photo-treatment=\"clean-anchor\"\\] \\.footballVisualMediaFrame\\{width:58%;\\}[\\s\\S]*?footballVisualHeroSetup\\[data-photo-treatment=\"clean-anchor\"\\] \\.footballVisualCopy\\{width:38%;/.test(visualCss), 'James near-breakpoint clean-anchor stage must retain the browser-tuned 58% photo / 38% copy geometry.');"
text = exact(text, needle, insert, path)
outputs[path] = text

# Menu bootstrap wording only; current revision assertion was already promoted.
path = ".github/workflows/validate-menu-bootstrap.yml"
text = read(path)
text = text.replace("v1.0.1 cache revision", "v1.0.2 cache revision")
text = text.replace("v1.0.1 revision", "v1.0.2 revision")
outputs[path] = text

# Current project-state top block + v1.0.2 maintenance section.
path = "PROJECT_STATE.md"
text = read(path)
text = text.replace("implemented through the v1.0.1 stability-hardening patch", "implemented through the v1.0.2 visual-maintenance patch")
old = """**Application version:** v1.0.1 — Stable
**Runtime asset revision:** `1.0.1-r5`
**Hosting:** GitHub Pages
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage
**Product mode:** exactly two managers, one device/browser, one active showdown
**Current milestone:** v1.0.x Stability Lane
**Current activity:** owner-directed finite visual immersion correction inside the v1.0.x Stability Lane
**Preserved owner-accepted gates:** `0.95.0-r4`, `r5`, `r6`, `r8`, `r9`, `r10`, `r12`, `r13`
**Accepted deployed baseline:** r13 merge `1bae3e1fd0f5ab213846629d328024b9be2d244c`
**Owner acceptance:** r13 accepted on August 9, 2026
**Release seal:** accepted r13 behavior preserved under `v1.0.1` / `1.0.1-r1`; no new feature workstream
"""
new = """**Application version:** v1.0.2 — Stable
**Runtime asset revision:** `1.0.2-r1`
**Hosting:** GitHub Pages
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage
**Product mode:** exactly two managers, one device/browser, one active showdown
**Current milestone:** v1.0.x finite visual-maintenance lane
**Current activity:** v1.0.2 clean-anchor footballer photography maintenance candidate; owner real-device acceptance remains open until the public build is inspected
**Protected loading-screen status:** owner explicitly likes the loading presentation; v1.0.2 preserves its composition/timing and treats it as a regression-protected surface
**Runtime change class:** presentation + cache/release identity only; no gameplay, scoring, route, storage schema/key or state-machine change
**Next feature after owner acceptance or explicit deferral:** v1.1.0 Data Safety and Recovery — Candidate A only
"""
text = exact(text, old, new, path)
marker = "# v1.0.1 — stability hardening"
section = """# v1.0.2 — clean-anchor footballer photography maintenance

## Owner-reproduced defects

The owner supplied current Chromebook screenshots showing three real presentation failures after r5:

- James Rodríguez was washed by the light overlay, reducing facial detail;
- Marcus Rashford's face was crossed by decorative diagonal geometry;
- desktop Home Marco Reus used a diagonal clipped photo edge that looked unattractive around the head/neck.

The owner explicitly likes the loading screen. That presentation is protected rather than redesigned.

## Maintenance architecture

v1.0.2 changes the footballer-photo rule from **graphics over photograph** to **photograph as clean anchor**.

James/Rashford/Martial now declare `treatment: \"clean-anchor\"`. Their decorative ambience is behind the photograph, the image frame is above decorative pseudo-elements, and the copy occupies its own plate outside the photo anchor. The underlying licensed r5 derivative files remain unchanged and continue to use `object-fit: contain`.

Desktop Home Reus is integrated as a rectangular right-side player-photo anchor with no diagonal `clip-path` through the head/neck. The accepted mobile Reus treatment stays separately bounded. The startup/loading Reus presentation remains protected.

## Robustness

Permanent browser gates now protect:

- clean-anchor treatment metadata;
- decorative layers behind required player photographs;
- copy/photo non-overlap;
- crop-safe full derivative rendering;
- James tuned desktop and near-breakpoint geometry;
- desktop Reus rectangular anchor and protected mobile Reus path;
- real 1366×768, 940×700 and 390×844 visual journeys;
- existing source/license/provenance and Messi/Lahm contracts.

v1.0.2 advances application/cache identity to `v1.0.2` / `1.0.2-r1` while preserving all gameplay and persistence contracts.

Owner visual acceptance remains a separate final gate after deployment.

---

"""
if marker not in text:
    raise SystemExit(f"{path}: missing v1.0.1 marker")
text = text.replace(marker, section + marker, 1)
outputs[path] = text

# NEXT_TASK: current visual-maintenance candidate first; preserve Candidate A detail below.
path = "NEXT_TASK.md"
text = read(path)
marker = "## 5. Candidate A — exact goal"
if marker not in text:
    raise SystemExit(f"{path}: Candidate A marker missing")
tail = text[text.index(marker):]
head = """# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-11

Application version: v1.0.2

Runtime asset revision: `1.0.2-r1`

## 1. Read this first

Start with:

1. `00_DEVELOPER_START_HERE.md`
2. this file
3. `POST_V1_ROADMAP_EXECUTION.md`
4. current source files named by the active path below

Do not restart planning and do not return to rejected r3/r4/r5 presentation treatments merely because historical files describe them.

## Current baseline: v1.0.2 Stable

v1.0.2 is the finite owner-directed maintenance response to the August 11 Chromebook screenshots.

Current candidate architecture:

- James Rodríguez uses a clean-anchor photo with no above-photo white wash;
- Marcus Rashford and Anthony Martial use clean right-side photo anchors with decorative geometry behind the photographs;
- desktop Home Marco Reus uses a rectangular right-side player anchor with no diagonal head/neck clipping edge;
- the owner-liked loading screen remains protected;
- Messi and Lahm remain on their protected crop-safe presentation;
- no gameplay, scoring, navigation, storage schema/key, Transfer state-machine, Season Review or analytics behavior is intentionally changed.

## 2. Current technical gate

Branch: `agent/v1.0.2-footballer-tile-maintenance`

PR: `#13 — v1.0.2: rebuild footballer tiles around clean-anchor photography`

The release is not complete merely because source exists.

Before merge/deploy:

1. all eleven permanent workflows must pass on one frozen head;
2. Licensed Football Visuals must pass real desktop/near-breakpoint/mobile Chromium checks;
3. final screenshots must show James readable without washout, Rashford/Martial faces unobstructed, and desktop Reus free of the rejected clipped-head/neck treatment;
4. the protected loading screen must remain regression-green;
5. temporary development workflows/scripts must be removed;
6. exact Pages bytes and the deployed complete journey must pass after merge.

## 3. Current owner gate

Technical status while PR #13 is under validation:

`CANDIDATE IN VALIDATION`

Owner art-direction status:

`PENDING REAL-DEVICE REVIEW OF DEPLOYED V1.0.2`

Automated visual success is not owner acceptance.

After deployment the owner should inspect:

- Home — desktop Marco Reus clean player anchor;
- Create Showdown — James Rodríguez facial contrast and identity plate;
- Transfer Challenge — Marcus Rashford face clarity;
- Transfer Challenge — Anthony Martial consistency;
- loading screen — regression check only, not redesign approval.

## 4. Decision after v1.0.2 deployment

### Path A — owner supplies new rejection evidence

Stay inside the finite `v1.0.x` maintenance lane.

Reproduce the exact screenshot/device failure, fix only that failure class, strengthen its permanent gate, and preserve all accepted systems.

### Path B — owner accepts v1.0.2 or explicitly defers visual review

Exit the finite visual-maintenance lane.

Current feature milestone becomes:

`v1.1.0 Data Safety and Recovery`

First implementation scope remains Candidate A only:

`Versioned Backup Envelope + Non-Mutating Export`

Do not combine Candidate B/C or jump to PWA/profiles/cloud/two-device work.

"""
outputs[path] = head + tail

# README current identity and a concise v1.0.2 section while preserving history below.
path = "README.md"
text = read(path)
old = """**Application version:** v1.0.1 — Stable
**Runtime asset revision:** `1.0.1-r5`
**Current phase:** r5 technical implementation complete; final owner real-device visual acceptance gate remains open
**Current developer entry:** `00_DEVELOPER_START_HERE.md`
**Next feature after owner acceptance or explicit deferral:** v1.1.0 Candidate A — Versioned Backup Envelope + Non-Mutating Export
**Post-v1 execution roadmap:** `POST_V1_ROADMAP_EXECUTION.md`
"""
new = """**Application version:** v1.0.2 — Stable
**Runtime asset revision:** `1.0.2-r1`
**Current phase:** finite clean-anchor footballer-photography maintenance; technical validation/deployment gate in progress and owner real-device acceptance remains separate
**Protected surface:** the owner-liked cinematic loading screen remains regression-protected
**Current developer entry:** `00_DEVELOPER_START_HERE.md`
**Next feature after owner acceptance or explicit deferral:** v1.1.0 Candidate A — Versioned Backup Envelope + Non-Mutating Export
**Post-v1 execution roadmap:** `POST_V1_ROADMAP_EXECUTION.md`
"""
text = exact(text, old, new, path)
old_sentence = "The original release path **v0.95 → v1.0** is complete. The r5 photography correction is technically merged, deployed and post-merge green; owner real-device acceptance remains the only open visual gate before the staged v1.1 data-safety lane becomes Current."
new_sentence = "The original release path **v0.95 → v1.0** is complete. v1.0.2 is the finite maintenance response to the owner's August 11 real-device visual rejection: footballers are being integrated as clean player anchors, while the loading screen remains protected. Owner acceptance still remains separate from automated validation before the staged v1.1 data-safety lane becomes Current."
text = exact(text, old_sentence, new_sentence, path)
marker = "## v1.0.1 — Stability hardening"
section = """## v1.0.2 — Clean-anchor footballer photography maintenance

v1.0.2 does not add a feature workstream. It fixes reproduced real-device presentation defects while keeping Version 1 gameplay/storage/routing intact.

The footballer presentation rule is now **player first**: James, Rashford and Martial use clean photo anchors with decorative geometry behind the photograph and copy outside the image zone. Desktop Home Reus is a rectangular right-side tile photograph instead of a diagonal head/neck cut. The cinematic loading presentation remains protected.

Permanent visual/browser gates enforce the clean-anchor layering, crop safety, responsive geometry, source provenance and Home/loading separation at Chromebook, near-breakpoint and mobile sizes.

See `RELEASE_V1.0.2.md` for the exact maintenance scope and rollback boundary.

---

"""
if marker not in text:
    raise SystemExit(f"{path}: v1.0.1 marker missing")
text = text.replace(marker, section + marker, 1)
outputs[path] = text

# Changelog: prepend the new defect-only maintenance release.
path = "CHANGELOG.md"
text = read(path)
old = "The project reached **v1.0.0 Stable** on August 9, 2026. v1.0.1 begins the finite Stability Lane on August 10, 2026."
new = "The project reached **v1.0.0 Stable** on August 9, 2026. v1.0.1 began the finite Stability Lane on August 10, 2026. v1.0.2 is the August 11 defect-only visual-maintenance response to owner real-device evidence."
text = exact(text, old, new, path)
marker = "# v1.0.1 — Stability Hardening"
section = """# v1.0.2 — Clean-Anchor Visual Maintenance

Date: **August 11, 2026**

Runtime asset revision: **`1.0.2-r1`**

## Owner-reproduced defects

- James Rodríguez's light overlay washed out facial detail on the Create Showdown tile.
- Marcus Rashford's decorative diagonal lines crossed his face in Transfer Challenge.
- desktop Home Marco Reus used an unattractive diagonal crop around the head/neck.
- the owner explicitly likes the cinematic loading screen; it is protected rather than redesigned.

## Maintenance implementation

- introduces a declarative `clean-anchor` treatment for James, Rashford and Martial;
- moves decorative geometry behind those photographs instead of painting over faces;
- places copy in a dedicated plate outside the photo anchor;
- preserves the complete authored r5 derivatives with `object-fit: contain` and no CSS colour filtering;
- rebuilds desktop Home Reus as a rectangular right-side player-photo anchor with no diagonal head/neck clipping edge;
- preserves the previously accepted mobile Reus path and the loading-screen composition;
- advances application/cache identity to `v1.0.2` / `1.0.2-r1`.

## Robustness upgrade

- strengthens Licensed Football Visuals around structural face-safe layering rather than old frame percentages;
- adds browser assertions that decoration stays below the image and copy stays outside the photo anchor;
- protects tuned James desktop/near-breakpoint geometry;
- protects desktop Reus clean-anchor geometry while retaining the bounded mobile path;
- retains provenance, physical-pixel, crop-safe, accessibility, startup-budget and complete-journey gates;
- keeps v1.0.1 as historical rollback evidence and adds a dedicated v1.0.2 release record.

## Scope protection

- no gameplay/scoring/tiebreak changes;
- no route/history changes;
- no localStorage key/schema/persistence changes;
- no Transfer Challenge/Season Review/Statistics behavior changes;
- no source-photo replacement in this maintenance pass;
- Messi and Lahm remain protected;
- loading screen remains protected.

Owner real-device visual acceptance remains required after the deployed build passes machine verification.

---

"""
if marker not in text:
    raise SystemExit(f"{path}: v1.0.1 changelog marker missing")
text = text.replace(marker, section + marker, 1)
outputs[path] = text

# Start Here: update only current snapshot / visual authority framing, keep all durable architecture detail.
path = "00_DEVELOPER_START_HERE.md"
text = read(path)
start = text.index("## 0. Sixty-second project state")
end = text.index("## 1. Start every new session in this order")
new_zero = """## 0. Sixty-second project state

Application: `v1.0.2`

Runtime asset revision: `1.0.2-r1`

Current maintenance branch/PR while candidate validation is active:

- branch: `agent/v1.0.2-footballer-tile-maintenance`;
- PR: `#13`.

v1.0.2 exists because the owner supplied new real-device rejection evidence after r5. The current maintenance architecture uses footballers as **clean tile anchors** rather than placing strong geometry over their faces.

Current visual targets:

- James Rodríguez: no facial washout; clean photo anchor and separate copy plate;
- Marcus Rashford: face completely unobstructed by decorative lines;
- Anthony Martial: same consistent clean-anchor system;
- desktop Home Marco Reus: rectangular photo anchor with no rejected diagonal head/neck cut;
- loading screen: explicitly liked by the owner and protected from redesign;
- Messi/Lahm: protected prior presentation.

Technical candidate state:

`IN FULL VALIDATION`

Owner visual acceptance state:

`PENDING REAL-DEVICE REVIEW AFTER DEPLOYMENT`

Do not call v1.0.2 owner-accepted from CI/screenshots alone.

If the owner supplies another rejection after deployment, stay in the finite v1.0.x correction lane and fix only reproduced evidence.

If the owner accepts v1.0.2 or explicitly defers visual review, the next substantive feature milestone becomes:

`v1.1.0 Data Safety and Recovery`

The first implementation branch remains Candidate A only:

`Versioned Backup Envelope + Non-Mutating Export`

Do not start Candidate B, Candidate C, PWA, profiles, cloud, accounts, QR pairing, or two-device work before their dependency gate is reached.

"""
text = text[:start] + new_zero + text[end:]
# Update the explicit current visual section language without rewriting historical evidence.
text = text.replace("## 6. Current r5 visual authority", "## 6. Current v1.0.2 visual authority")
text = text.replace("Do not return automatically to rejected r3/r4 photographs or the rejected intermediate 2016 r5 Rashford candidate.", "Do not return automatically to rejected r3/r4 treatments or the rejected intermediate 2016 Rashford candidate. The current source/photo derivatives remain the authority unless new owner evidence requires a source change.")
outputs[path] = text

# New v1.0.2 release record.
outputs["RELEASE_V1.0.2.md"] = """# Career Mode Showdown — v1.0.2 Release Record

Date: 2026-08-11
Release tag: `v1.0.2`
Application version: `v1.0.2`
Runtime asset revision: `1.0.2-r1`
Release class: reproduced-defect maintenance; no new feature workstream
Owner visual acceptance: pending real-device inspection after deployment

## Why this patch exists

The owner supplied current Chromebook screenshots after the r5 deployment and rejected three presentation details:

1. James Rodríguez was too bright because the light overlay faded facial detail.
2. Marcus Rashford's face was crossed by decorative FIFA-inspired diagonal lines.
3. Home Marco Reus had an unattractive diagonal image cut around the head/neck.

The owner explicitly likes the main loading-screen presentation and instructed that it be protected.

## Visual maintenance architecture

v1.0.2 changes the footballer-photo integration rule from **graphics over photograph** to **player as clean anchor**.

James, Rashford and Martial declare `treatment: \"clean-anchor\"` in `data/footballVisuals.js`.

For clean-anchor panels:

- decorative pseudo-element ambience is behind the image;
- the photo frame is above decorative geometry;
- copy uses its own plate outside the photo anchor;
- the complete authored r5 derivative stays visible with `object-fit: contain`;
- CSS colour filtering remains disabled;
- source/license/provenance remains unchanged.

Desktop Home Reus is integrated as a rectangular right-side player photograph. The rejected diagonal desktop clip is removed. The bounded mobile Reus treatment remains separate. `css/visual-fidelity-r3.css` explicitly preserves the existing startup/loading composition.

## Tuned visual geometry

James:

- desktop clean-anchor photo stage: `60%`;
- desktop copy plate: `36%`;
- 701–1020 clean-anchor photo stage: `58%`;
- 701–1020 copy plate: `38%`.

Transfer desktop:

- Rashford photo stage: `34%`;
- Martial photo stage: `36%`;
- copy remains left of the photo anchor.

Home desktop:

- Reus clean rectangular anchor; no desktop `clip-path`;
- 940×700 crop position: `53% 2%`;
- 1100×720 / 1366×768 crop position: `53% 12%`;
- no desktop jersey-number overlay competing with the player anchor.

## Protected systems

This release must not change:

- scoring/tiebreak rules;
- two-manager/same-league/different-club contract;
- League Wheel confirmation;
- Club Assignment locking/reveal;
- Transfer Challenge state machine;
- Season Review transaction boundary;
- Statistics/Legacy/Trophy semantics;
- `js/screens.js` navigation authority;
- `js/storage.js` persistence authority;
- localStorage keys/schema;
- startup timing;
- the owner-liked loading-screen composition;
- Messi/Lahm source assets and protected presentation.

## Quality gates

The candidate is mergeable only when all permanent workflows pass on one frozen SHA, including:

- Static App;
- Home Bootstrap;
- V1 Visual Immersion;
- Season Review;
- Settings;
- League Confirmation;
- Final Polish;
- Statistics;
- Transfer;
- Licensed Football Visuals;
- Stability Lane.

Licensed Football Visuals must verify real desktop, near-breakpoint and mobile presentation. Stability Lane must complete two consecutive browser cycles and, after merge, exact Pages-byte verification plus deployed runtime-error, Home, photo and complete-journey audits.

## Rollback

Immediate runtime rollback target before v1.0.2 is the deployed r5 implementation:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

The immutable `RELEASE_V1.0.1.md` remains historical release evidence and is not rewritten to pretend v1.0.2 existed earlier.

## Acceptance boundary

Machine validation can prove structural/crop/accessibility/runtime integrity. It cannot replace the owner's art-direction judgment.

After public deployment, owner real-device acceptance remains open for Home Reus, Create Showdown James, Transfer Rashford/Martial and loading-screen regression verification.
"""

# Static App release authority: validate current v1.0.2 plus immutable v1.0.1 history.
path = ".github/workflows/validate-static-app.yml"
text = read(path)
text = exact(text, "const expectedVersion = '1.0.1';", "const expectedVersion = '1.0.2';", path)
text = exact(text, "const expectedRevision = '1.0.1-r5';", "const expectedRevision = '1.0.2-r1';", path)
text = exact(text, "const releaseRecord = fs.readFileSync('RELEASE_V1.0.1.md', 'utf8');", "const releaseRecord = fs.readFileSync('RELEASE_V1.0.2.md', 'utf8');\n          const previousReleaseRecord = fs.readFileSync('RELEASE_V1.0.1.md', 'utf8');", path)
text = text.replace("v1.0.1 · Stable", "v1.0.2 · Stable")
text = text.replace("**Application version:** v1.0.1 — Stable", "**Application version:** v1.0.2 — Stable")
text = text.replace("**Runtime asset revision:** `1.0.1-r5`", "**Runtime asset revision:** `1.0.2-r1`")
text = text.replace("## Current baseline: v1.0.1 Stable", "## Current baseline: v1.0.2 Stable")
text = text.replace("# v1.0.1 — Stability Hardening", "# v1.0.2 — Clean-Anchor Visual Maintenance")
text = text.replace("Release tag: `v1.0.1`", "Release tag: `v1.0.2`")
old_loop = """          [projectState, nextTask, readme, changelog].forEach((document, index) => {
            assert.ok(document.includes('1.0.1-r5'), `Current authority document ${index + 1} is missing the r4 runtime identity.`);
          });
          assert.ok(releaseRecord.includes('1.0.1-r1'), 'The immutable v1.0.1 release record must retain its original r1 evidence.');
"""
new_loop = """          [projectState, nextTask, readme, changelog].forEach((document, index) => {
            assert.ok(document.includes('1.0.2-r1'), `Current authority document ${index + 1} is missing the v1.0.2 runtime identity.`);
          });
          assert.ok(releaseRecord.includes('Runtime asset revision: `1.0.2-r1`'), 'The v1.0.2 release record must contain the current runtime identity.');
          assert.ok(previousReleaseRecord.includes('1.0.1-r1'), 'The immutable v1.0.1 release record must retain its original r1 evidence.');
"""
text = exact(text, old_loop, new_loop, path)
outputs[path] = text

for path, content in outputs.items():
    create_blob(path, content)

print(f"V102_RELEASE_AUTHORITY_BLOB_COUNT={len(outputs)}")
