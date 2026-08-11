from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,t): (ROOT/p).write_text(t,encoding='utf-8')
def one(t,o,n,label):
    c=t.count(o)
    if c != 1: raise RuntimeError(f'{label}: expected 1 match, found {c}')
    return t.replace(o,n,1)

# User-facing shell is now the v1.1.0 stable release candidate.
index=read('index.html').replace('v1.1.0 · Candidate A','v1.1.0 · Stable')
write('index.html',index)

# Stability contract: new release identity + Bug 1 authority + Candidate A ownership.
st=read('tests/contracts/stability-contracts.cjs')
st=st.replace('The v1.0.2 maintenance release must use its r1 cache identity.','The v1.1.0 Candidate A release must use its r1 cache identity.')
st=st.replace('assert.equal(storage.hasSavedShowdown(), true, "Malformed active bytes must remain guarded from silent replacement.");','assert.equal(storage.hasSavedShowdown(), false, "Malformed active bytes must remain preserved without advertising a usable Continue Career save.");')
st=st.replace('assert.ok(workflow.includes("npm run test:football-visual"), "Stability workflow must run crop-safe football visual QA.");','assert.ok(workflow.includes("npm run test:football-visual"), "Stability workflow must run crop-safe football visual QA.");\nassert.ok(workflow.includes("npm run test:backup-browser"), "Stability workflow must run Candidate A backup export QA.");')
st=st.replace('release coherence, runtime provenance, crop-safe visual gate ownership, corrupt data, quota rollback, CI ownership, and Node 24 actions.','release coherence, Candidate A backup ownership, runtime provenance, crop-safe visual gate ownership, corrupt data, quota rollback, CI ownership, and Node 24 actions.')
write('tests/contracts/stability-contracts.cjs',st)

# Home audit: broad ambience behind photo, bounded owner-requested rail may be above lower body only.
home=read('tests/browser/home-visual-audit.cjs')
home=one(home,
'''                beforeZIndex: Number.parseInt(beforeStyle.zIndex || "0", 10) || 0,\n                afterZIndex: Number.parseInt(afterStyle.zIndex || "0", 10) || 0\n''',
'''                beforeZIndex: Number.parseInt(beforeStyle.zIndex || "0", 10) || 0,\n                afterZIndex: Number.parseInt(afterStyle.zIndex || "0", 10) || 0,\n                afterHeight: Number.parseFloat(afterStyle.height || "0") || 0\n''','home geometry capture')
home=one(home,
'''    assert.ok(\n        result.image.zIndex > result.container.beforeZIndex && result.image.zIndex > result.container.afterZIndex,\n        `${label}: decorative geometry must remain behind the Reus photograph.`\n    );\n''',
'''    assert.ok(\n        result.image.zIndex > result.container.beforeZIndex,\n        `${label}: broad decorative ambience must remain behind the Reus photograph.`\n    );\n    assert.ok(\n        result.container.afterZIndex > result.image.zIndex,\n        `${label}: owner-requested Reus accent rail must render over the lower photo zone.`\n    );\n    assert.ok(\n        result.container.afterHeight > 0 && result.container.afterHeight <= result.container.height * .36,\n        `${label}: Reus foreground accent rail must remain bounded below the protected head/face zone.`\n    );\n''','home face-safe accent assertion')
write('tests/browser/home-visual-audit.cjs',home)

# Current workflow authority: active validators should follow current release identity.
for path in sorted((ROOT/'.github/workflows').glob('*.yml')):
    text=path.read_text(encoding='utf-8')
    text=text.replace('1.0.2-r1','1.1.0-r1').replace('v1.0.2','v1.1.0').replace('1.0.2','1.1.0')
    # Visual immersion must now require bounded face-safe Reus accent rather than no accent.
    text=text.replace(
        "assert.ok(visualCss.includes('.menuCoverAthlete::after') && visualCss.includes('background:none'), 'Home Reus must not have a pale post-render wash overlay.');",
        "assert.ok(visualCss.includes('.menuCoverAthlete::after') && visualCss.includes('height:34%') && visualCss.includes('rgba(66,185,218,.28)'), 'Home Reus must keep the bounded owner-requested lower-body accent rail.');"
    )
    # Static App: current release is 1.1; v1.0.2 becomes immediate rollback evidence.
    text=text.replace("const previousReleaseRecord = fs.readFileSync('RELEASE_V1.0.1.md', 'utf8');", "const previousReleaseRecord = fs.readFileSync('RELEASE_V1.0.2.md', 'utf8');")
    text=text.replace("assert.ok(previousReleaseRecord.includes('1.0.1-r1'), 'The immutable v1.0.1 release record must retain its original r1 evidence.');", "assert.ok(previousReleaseRecord.includes('1.0.2-r1'), 'The immutable v1.0.2 release record must retain its deployed r1 evidence.');")
    path.write_text(text,encoding='utf-8')

release='''# Career Mode Showdown — v1.1.0 Release Record\n\nDate: 2026-08-11\nRelease tag: `v1.1.0`\nApplication version: `v1.1.0`\nRuntime asset revision: `1.1.0-r1`\nRelease class: roadmap advancement + maintenance hardening\nOwner status: v1.0.2 approved; v1.1 face-safe accent retune pending deployed real-device inspection\n\n## Roadmap milestone\n\nv1.1.0 ships **Data Safety and Recovery — Candidate A only**: `Versioned Backup Envelope + Non-Mutating Export`.\n\nCandidate B import analysis and Candidate C restore remain explicitly deferred.\n\n## Candidate A\n\n- read-only storage snapshot remains owned by `js/storage.js`;\n- lazy `js/backup.js` creates a format-v1 envelope;\n- active Showdown, Legacy and preferences are represented;\n- malformed current bytes are retained in labelled recovery records;\n- SHA-256 detects accidental corruption/tampering after export;\n- readable JSON downloads locally with a timestamped filename;\n- export performs zero canonical `localStorage.setItem()` / `removeItem()` operations;\n- existing Showdown IDs/timestamps are preserved.\n\n## Five maintenance fixes\n\n1. corrupt non-empty active data no longer advertises a usable Continue Career save;\n2. malformed Legacy shape is reported/preserved instead of silently appearing empty;\n3. Settings degraded fallback identity is no longer stuck on v1.0.1;\n4. committed destructive Data Management actions give explicit success feedback;\n5. backup export is single-flight under rapid repeated activation.\n\n## Visual amendment\n\nThe owner approved v1.0.2 clean-anchor photography but asked that FIFA 17-inspired diagonal energy remain. v1.1 restores bounded cyan/yellow accent rails only in lower-body/photo-edge zones. Permanent browser tests reject rails that enter the protected head/face region.\n\nThe owner-liked loading screen remains regression-protected.\n\n## Quality boundary\n\nBefore merge, all eleven permanent workflow families must pass on one frozen SHA. Candidate A contracts/browser QA must cover empty/partial/full/corrupt/large-history states, real JSON download, keyboard/touch, reduced motion, axe, overflow, zero-write proof and checksum verification. Licensed visual QA must cover desktop/windowed/mobile face-safe accents.\n\nAfter merge, Pages must deploy the exact merge and Stability must repeat deployed bytes, runtime provenance, Home/Reus, football photos, Candidate A export and the complete journey.\n\n## Rollback\n\nImmediate runtime rollback target is deployed v1.0.2 runtime merge:\n\n`7a573ff2691b6143ecbc53df589822d5609f5e05`\n\n`RELEASE_V1.0.2.md` remains immutable previous-release evidence.\n'''
write('RELEASE_V1.1.0.md',release)

# Current authority docs. Historical release sections remain intact.
ps=read('PROJECT_STATE.md')
ps=ps.replace('**Application version:** v1.0.2 — Stable','**Application version:** v1.1.0 — Stable',1)
ps=ps.replace('**Runtime asset revision:** `1.0.2-r1`','**Runtime asset revision:** `1.1.0-r1`',1)
ps=ps.replace('**Current milestone:** v1.0.x finite visual-maintenance lane','**Current milestone:** v1.1.0 Data Safety and Recovery — Candidate A',1)
ps=ps.replace('**Current activity:** v1.0.2 clean-anchor footballer photography maintenance candidate; owner real-device acceptance remains open until the public build is inspected','**Current activity:** v1.1.0 Candidate A non-mutating backup/export plus five maintenance fixes; face-safe FIFA accent retune awaits deployed owner inspection',1)
ps=ps.replace('**Next feature after owner acceptance or explicit deferral:** v1.1.0 Data Safety and Recovery — Candidate A only','**Next roadmap candidate after v1.1.0 release proof:** Candidate B — Import Analysis + Migration Preview (read-only)',1)
marker='---\n\n# v1.0.2 — clean-anchor footballer photography maintenance\n'
section='''---\n\n# v1.1.0 — Data Safety and Recovery / Candidate A\n\nThe owner approved v1.0.2 and unlocked the post-v1 roadmap. Candidate A adds a versioned, checksum-protected, human-readable local backup export without introducing restore writes or a second persistence authority. Five maintenance bugs are fixed in the same bounded release. FIFA-style diagonal accents return only in lower-body face-safe zones; the loading screen remains protected.\n\nCandidate B/C remain dependency-blocked until this release is merged, deployed and proven.\n\n# v1.0.2 — clean-anchor footballer photography maintenance\n'''
ps=ps.replace(marker,section,1)
write('PROJECT_STATE.md',ps)

next_task='''# NEXT TASK — Career Mode Showdown\n\nLast updated: 2026-08-11\n\nApplication version: v1.1.0\n\nRuntime asset revision: `1.1.0-r1`\n\n## Current baseline: v1.1.0 Stable\n\nPR #14 is the v1.1.0 Candidate A release path. The current branch implements **Versioned Backup Envelope + Non-Mutating Export**, five maintenance fixes, and the owner-requested face-safe return of FIFA-style diagonal accents.\n\n## Current technical gate\n\nBefore merge, all eleven permanent workflows must pass on one frozen PR head. Stability must reach the new backup contracts and two full Chromium cycles. Licensed Football Visuals must show the line retune at desktop, 940px and mobile without entering the protected face/head zones. Candidate A Data Management screenshots must be inspected. Temporary tooling must not survive.\n\nAfter merge, verify exact Pages bytes and rerun deployed runtime provenance, Home/Reus, football visuals, Candidate A export and the complete journey.\n\n## Current owner gate\n\nv1.0.2 visual direction is approved. The new v1.1 diagonal accent retune is **pending deployed real-device inspection**. Automated gates do not replace owner art-direction judgment.\n\n## Scope lock\n\nCandidate B import analysis and Candidate C restore are not part of PR #14. Do not begin them until Candidate A is merged/deployed/proven. Do not change gameplay, scoring, routing, storage keys/schema, player source crops, loading-screen composition, Messi/Lahm or the existing save identity model.\n\n## Next roadmap step after Candidate A release proof\n\nCandidate B — **Import Analysis + Migration Preview** — remains read-only/dry-run and must perform zero canonical localStorage writes/removals.\n'''
write('NEXT_TASK.md',next_task)

readme=read('README.md')
readme=readme.replace('**Application version:** v1.0.2 — Stable','**Application version:** v1.1.0 — Stable',1)
readme=readme.replace('**Runtime asset revision:** `1.0.2-r1`','**Runtime asset revision:** `1.1.0-r1`',1)
readme=readme.replace('**Current phase:** finite clean-anchor footballer-photography maintenance; technical validation/deployment gate in progress and owner real-device acceptance remains separate','**Current phase:** v1.1.0 Data Safety and Recovery — Candidate A release validation',1)
readme=readme.replace('**Next feature after owner acceptance or explicit deferral:** v1.1.0 Candidate A — Versioned Backup Envelope + Non-Mutating Export','**Next roadmap candidate after Candidate A release proof:** Candidate B — Import Analysis + Migration Preview',1)
needle='---\n\n## v1.0.2 — Clean-anchor footballer photography maintenance\n'
new='''---\n\n## v1.1.0 — Data Safety and Recovery / Candidate A\n\nv1.1.0 adds a versioned, SHA-256-protected, human-readable local backup export for active Showdown, Legacy and preferences without mutating canonical storage. It also fixes five bounded maintenance defects and restores FIFA-style diagonal accent energy only in face-safe lower-body zones. Candidate B/C remain deferred.\n\n## v1.0.2 — Clean-anchor footballer photography maintenance\n'''
readme=readme.replace(needle,new,1)
write('README.md',readme)

start=read('00_DEVELOPER_START_HERE.md')
start=start.replace('Application: `v1.0.2`','Application: `v1.1.0`',1)
start=start.replace('Runtime asset revision: `1.0.2-r1`','Runtime asset revision: `1.1.0-r1`',1)
start=start.replace('Current runtime implementation merge: `7a573ff2691b6143ecbc53df589822d5609f5e05`','Previous stable runtime / rollback: `7a573ff2691b6143ecbc53df589822d5609f5e05`',1)
start=start.replace('Technical v1.0.2 state: `COMPLETE, MERGED, DEPLOYED, POST-MERGE GREEN`','Current v1.1.0 state: `CANDIDATE A IN PR #14 VALIDATION`',1)
start=start.replace('Owner visual state: `PENDING REAL-DEVICE REVIEW OF DEPLOYED V1.0.2`','Owner visual state: `v1.0.2 APPROVED; v1.1 ACCENT RETUNE PENDING DEPLOYED REVIEW`',1)
write('00_DEVELOPER_START_HERE.md',start)

ch=read('CHANGELOG.md')
anchor='---\n\n# v1.0.2 — Clean-Anchor Visual Maintenance\n'
entry='''---\n\n# v1.1.0 — Data Safety and Recovery / Candidate A\n\nDate: **August 11, 2026**\n\nRuntime asset revision: **`1.1.0-r1`**\n\n- adds format-v1 non-mutating local backup export with SHA-256 checksum;\n- captures active Showdown, Legacy and preferences through `js/storage.js`;\n- preserves malformed raw bytes in recovery data;\n- fixes corrupt active-save false positive, malformed Legacy shape handling, stale Settings fallback, destructive-action success feedback and duplicate export activation;\n- restores owner-requested FIFA diagonal accents in bounded face-safe lower-body zones;\n- extends Stability with Candidate A desktop/mobile/reduced-motion/a11y/download/deployed audits;\n- leaves Candidate B/C, PWA, profiles and cloud dependency-blocked.\n\n# v1.0.2 — Clean-Anchor Visual Maintenance\n'''
ch=ch.replace(anchor,entry,1)
write('CHANGELOG.md',ch)

# Roadmap: mark Candidate A as active/shipping, keep B/C sequencing explicit.
road=read('POST_V1_ROADMAP_EXECUTION.md')
road=road.replace('Current implementation baseline: `v1.0.1 / 1.0.1-r5`','Current implementation baseline: `v1.1.0 / 1.1.0-r1`',1)
road=road.replace('Current owner gate: real-device visual acceptance of r5 remains open.','Current owner gate: v1.0.2 visual direction approved; v1.1 face-safe accent retune awaits deployed inspection.',1)
write('POST_V1_ROADMAP_EXECUTION.md',road)

print('v1.1.0 release authority migration complete')
