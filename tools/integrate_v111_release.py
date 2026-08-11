from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Temporary guarded integration helper. Removed before final freeze.


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")
    print(f"updated {path}")


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    text = read(path)
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"{path}: expected {expected} occurrences of {old!r}, found {count}")
    write(path, text.replace(old, new))


def insert_before(path: str, marker: str, block: str) -> None:
    text = read(path)
    if block.strip() in text:
        raise RuntimeError(f"{path}: block already present")
    if text.count(marker) != 1:
        raise RuntimeError(f"{path}: marker {marker!r} not unique")
    write(path, text.replace(marker, block.rstrip() + "\n\n" + marker, 1))


replace("README.md", "**Application version:** v1.1.0 — Stable\n**Runtime asset revision:** `1.1.0-r1`\n**Current phase:** v1.1.0 Candidate A is merged/deployed/proven; a clean-stability seal is revalidating every permanent feature/workstream/release gate without changing runtime bytes unless a real defect reproduces", "**Application version:** v1.1.1 — Maintenance Candidate\n**Runtime asset revision:** `1.1.1-r1`\n**Current phase:** owner-directed James Rodríguez Real Madrid source refresh; Candidate A remains protected and Candidate B remains next after maintenance closure")
replace("README.md", "**Next roadmap candidate after Candidate A release proof:** Candidate B — Import Analysis + Migration Preview", "**Next roadmap candidate after v1.1.1 maintenance closure:** Candidate B — Import Analysis + Migration Preview")
insert_before("README.md", "## v1.1.0 — Data Safety and Recovery / Candidate A", """## v1.1.1 — James Rodríguez Real Madrid source refresh

v1.1.1 is a finite visual maintenance patch requested after the sealed v1.1.0 build. Create Showdown now uses a different Real Madrid-authored James Rodríguez photograph from September 2016, licensed CC BY 3.0 through Wikimedia Commons. The complete 863 × 1080 source frame is preserved and shown with the existing clean-anchor `object-fit: contain` policy, so the new source is not subjected to a second blind responsive crop.

The prior 2019 James runtime derivative is removed from the active asset set. Rashford, Martial, Messi, Lahm and the owner-liked Marco Reus Home/loading surfaces remain protected. Candidate A backup/export behavior, gameplay, routes, storage schema and Transfer/Season state machines are unchanged.

For this build, permanent release evidence is strengthened around exact source fingerprints, active-asset exclusivity, no-crop geometry, physical-pixel scale, frame occupancy, face-safe accent placement and four-viewport browser evidence. The owner additionally requires two independent executions of every permanent gate family on one frozen final SHA. Candidate B remains the next substantive roadmap step after this maintenance patch is closed.

See `RELEASE_V1.1.1.md` and `CAREER_MODE_SHOWDOWN_V1.1.1_JAMES_SOURCE_REFRESH_HANDOFF.md` for exact provenance and release evidence.""")

project_old = """**Application version:** v1.1.0 — Stable
**Runtime asset revision:** `1.1.0-r1`
**Hosting:** GitHub Pages
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage
**Product mode:** exactly two managers, one device/browser, one active showdown
**Current milestone:** v1.1.0 Stable — Clean Stability Seal
**Current activity:** Candidate A is merged, deployed and proven; the clean-stability pass is revalidating the exact production baseline across every permanent feature/workstream/release gate before the next roadmap step
**Protected loading-screen status:** owner explicitly likes the loading presentation; v1.0.2 preserves its composition/timing and treats it as a regression-protected surface
**Runtime change class:** no application-byte change for the clean-stability pass unless a reproduced defect requires a bounded fix; gameplay, scoring, routes, storage schema/keys and state-machine rules remain locked
**Production v1.1.0 runtime merge:** `7aba9609130e7f72f256bfb20936441e8beaecaa`
**Production v1.1.0 Pages state:** exact deployed runtime bytes and complete public journey proven by Stability; clean-stability post-merge smoke is required again before closure
**Clean-build baseline Licensed Football Visuals:** PR #15 run `31526372109` — success
**Clean-build baseline Stability Lane:** PR #15 run `31526372201` — storage/contracts success and two-cycle Chromium success; deployed-site smoke intentionally waits for `main`
**Next roadmap candidate after v1.1.0 release proof:** Candidate B — Import Analysis + Migration Preview (read-only)"""
project_new = """**Application version:** v1.1.1 — Maintenance Candidate
**Runtime asset revision:** `1.1.1-r1`
**Hosting:** GitHub Pages
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage
**Product mode:** exactly two managers, one device/browser, one active showdown
**Current milestone:** v1.1.1 — James Rodríguez Real Madrid Source Refresh
**Current activity:** replace only the Create Showdown James source with a different Real Madrid-authored licensed image, deepen changed-surface gates, and require two independent executions of every permanent gate on one frozen candidate
**Protected loading-screen status:** owner explicitly likes the loading presentation; its composition/timing remains regression-protected
**Runtime change class:** licensed James visual/source + coherent v1.1.1 cache/release authority only; gameplay, scoring, routes, storage schema/keys, Candidate A semantics and state-machine rules remain locked
**Previous production runtime:** v1.1.0 / `1.1.0-r1`, fully sealed before this maintenance branch
**Next roadmap candidate after v1.1.1 maintenance closure:** Candidate B — Import Analysis + Migration Preview (read-only)"""
replace("PROJECT_STATE.md", project_old, project_new)
insert_before("PROJECT_STATE.md", "# v1.1.0 — Data Safety and Recovery / Candidate A", """# v1.1.1 — James Rodríguez Real Madrid source refresh

The owner explicitly requested a different James Rodríguez picture source while keeping the subject in his Real Madrid period. The selected source is the Real Madrid-authored CC BY 3.0 Commons photograph `James Rodríguez in September 2016 - 02.jpg` from 28 September 2016.

The complete 863 × 1080 licensed source frame is preserved as `assets/football/james-rodriguez-real-madrid-2016-smart-v111.webp`, with no source crop and no runtime secondary crop. The clean-anchor/face-safe diagonal system remains the visual architecture. The replaced 2019 James runtime derivative is removed from the active asset set and is guarded against returning.

This is a bounded maintenance patch, not Candidate B. Candidate A backup/export remains unchanged. Candidate B import analysis remains the next substantive roadmap candidate after v1.1.1 is merged, deployed and visually accepted or explicitly deferred.

Release evidence for this patch is intentionally deeper on the changed failure surface and must execute every permanent gate family twice on the exact frozen SHA.""")

start_old = """Application: `v1.1.0`

Runtime asset revision: `1.1.0-r1`

Current production runtime implementation merge:

`7aba9609130e7f72f256bfb20936441e8beaecaa`

Current clean repository baseline before this stabilization pass:

`d23cea4d0a8bb3c428265546555a78008269d228`

Application/runtime identity remains `v1.1.0 / 1.1.0-r1`. Candidate A — Versioned Backup Envelope + Non-Mutating Export — is complete, merged, deployed and post-merge proven. The final pre-clean baseline passed five independent release burn-in runners plus Stability exact-byte/public-site smoke.

The owner-liked loading screen remains protected. James/Rashford/Martial keep the clean-anchor/face-safe presentation and Reus/Messi/Lahm protections remain intact. Automated visual gates do not replace owner real-device art-direction judgment; the v1.1 face-safe accent retune remains open to owner inspection until explicitly accepted.

The current maintenance action is a finite **v1.1.0 Clean Stability Build**: reproduce the deployed baseline against every permanent feature/workstream/release gate, fix only reproduced defects, and preserve application bytes when no runtime defect exists.

After that seal, the next substantive roadmap candidate is Candidate B — Import Analysis + Migration Preview — and it remains read-only/dry-run with zero canonical localStorage writes/removals. Candidate C restore remains blocked behind Candidate B evidence. Do not start PWA, profiles, cloud, accounts, QR pairing, or two-device work before their dependency gate is reached."""
start_new = """Application: `v1.1.1`

Runtime asset revision: `1.1.1-r1`

Previous sealed production line: `v1.1.0 / 1.1.0-r1`.

Candidate A — Versioned Backup Envelope + Non-Mutating Export — remains complete, merged, deployed and protected. Candidate B has not started.

The current owner-directed maintenance action is a finite **v1.1.1 James Rodríguez Real Madrid Source Refresh**. It replaces only the Create Showdown James source with a different Real Madrid-authored CC BY 3.0 Commons photograph from September 2016, preserves the clean-anchor/face-safe visual architecture, and does not bundle Candidate B.

The owner-liked loading screen remains protected. Rashford, Martial, Messi and Lahm remain on their accepted sources. Every permanent release gate must pass twice on one frozen final v1.1.1 SHA; changed-surface visual evidence additionally covers exact source fingerprints, active-asset exclusivity, no-crop geometry, physical-pixel scale, occupancy and face-safe accent placement.

After v1.1.1 is merged/deployed/proven and its art direction is accepted or explicitly deferred, Candidate B — Import Analysis + Migration Preview — remains the next substantive roadmap candidate. It stays read-only/dry-run with zero canonical localStorage writes/removals. Candidate C restore remains blocked behind Candidate B evidence."""
replace("00_DEVELOPER_START_HERE.md", start_old, start_new)

visual_old = """## 6. Current v1.0.2 visual authority

James Rodríguez:

- asset: `assets/football/james-rodriguez-real-madrid-2019-smart-r5.webp`;
- authored source crop: `[20, 0, 540, 705]`;
- output: `520 × 705`;
- runtime shows the full authored derivative with `object-fit: contain`.

Marcus Rashford:

- asset: `assets/football/marcus-rashford-man-utd-2017-smart-r5.webp`;
- final source: Manchester United v RSC Anderlecht, 20 April 2017;
- authored source crop: `[1050, 300, 2350, 2200]`;
- output: `753 × 1100`;
- desktop Transfer media stage: `43%`;
- mobile/small-phone media stage: `52%`;
- runtime shows the full authored derivative with `object-fit: contain`.

Anthony Martial:

- asset: `assets/football/anthony-martial-man-utd-2016-smart-r5.webp`;
- source: Manchester United v Zorya Luhansk, September 2016;
- authored source crop: `[0, 0, 1800, 2400]`;
- output: `825 × 1100`;
- desktop Transfer media stage: `48%`;
- mobile/small-phone media stage: `56%`;
- runtime shows the full authored derivative with `object-fit: contain`.

Marco Reus remains the Home/loading identity.

Messi and Lahm remain their protected crop-safe assets.

Do not return automatically to rejected r3/r4 treatments or the rejected intermediate 2016 Rashford candidate. The current source/photo derivatives remain the authority unless new owner evidence requires a source change."""
visual_new = """## 6. Current football visual authority — v1.1.1 maintenance candidate

James Rodríguez:

- asset: `assets/football/james-rodriguez-real-madrid-2016-smart-v111.webp`;
- source: Real Madrid-authored `James Rodríguez in September 2016 - 02.jpg`;
- license: CC BY 3.0;
- source/full-frame policy: `[0, 0, 863, 1080]`;
- output: `863 × 1080`;
- source/output SHA-256 fingerprints are locked in `assets/football/asset-manifest.json` and `RELEASE_V1.1.1.md`;
- runtime shows the complete derivative with `object-fit: contain`, zero declared crop, clean-anchor layering and face-safe lower accent geometry;
- replaced 2019 James runtime derivative must not return.

Marcus Rashford:

- asset: `assets/football/marcus-rashford-man-utd-2017-smart-r5.webp`;
- final source: Manchester United v RSC Anderlecht, 20 April 2017;
- authored source crop: `[1050, 300, 2350, 2200]`;
- output: `753 × 1100`;
- desktop Transfer media stage: `34%`;
- 701–1020 windowed media stage: `40%`;
- small phones stack Transfer panels vertically;
- runtime shows the full authored derivative with `object-fit: contain`.

Anthony Martial:

- asset: `assets/football/anthony-martial-man-utd-2016-smart-r5.webp`;
- source: Manchester United v Zorya Luhansk, September 2016;
- authored source crop: `[0, 0, 1800, 2400]`;
- output: `825 × 1100`;
- desktop Transfer media stage: `36%`;
- 701–1020 windowed media stage: `42%`;
- small phones stack Transfer panels vertically;
- runtime shows the full authored derivative with `object-fit: contain`.

Marco Reus remains the protected Home/loading identity. Messi and Lahm remain their protected crop-safe assets.

Do not return automatically to rejected r3/r4 treatments, the replaced 2019 James runtime source, or the rejected intermediate 2016 Rashford candidate. Current source/photo derivatives remain authority unless new owner evidence requires another source change."""
replace("00_DEVELOPER_START_HERE.md", visual_old, visual_new)

road_old = """Current application: `v1.0.1`

Current runtime revision: `1.0.1-r5`

Current product model:

- exactly two managers;
- one browser/device;
- one active local Showdown;
- manual FIFA 17 result entry;
- localStorage persistence;
- GitHub Pages deployment;
- static SPA using HTML/CSS/vanilla JavaScript.

Current r5 visual implementation merge:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

Technical r5 state is complete/green. Owner real-device visual acceptance remains open.

The next substantive feature milestone remains `v1.1.0 Data Safety and Recovery` after owner r5 acceptance or explicit deferral."""
road_new = """Current application candidate: `v1.1.1`

Current runtime revision: `1.1.1-r1`

Current product model:

- exactly two managers;
- one browser/device;
- one active local Showdown;
- manual FIFA 17 result entry;
- localStorage persistence;
- GitHub Pages deployment;
- static SPA using HTML/CSS/vanilla JavaScript.

Candidate A — Versioned Backup Envelope + Non-Mutating Export — is complete, merged, deployed and protected. The current finite maintenance patch refreshes only the James Rodríguez Real Madrid source photograph and does not start Candidate B.

After v1.1.1 maintenance is merged/deployed/proven and its owner art-direction gate is accepted or explicitly deferred, Candidate B — Import Analysis + Migration Preview — is the next substantive roadmap candidate. Candidate B remains read-only; Candidate C restore remains dependency-blocked."""
replace("POST_V1_ROADMAP_EXECUTION.md", road_old, road_new)

insert_before("CHANGELOG.md", "# v1.1.0 — Data Safety and Recovery / Candidate A", """# v1.1.1 — James Rodríguez Real Madrid Source Refresh

Date: **August 11, 2026**

Runtime asset revision: **`1.1.1-r1`**

- replaces the Create Showdown James Rodríguez source with Real Madrid-authored `James Rodríguez in September 2016 - 02.jpg` under CC BY 3.0;
- preserves the complete 863 × 1080 source frame and displays it with clean-anchor `object-fit: contain` rather than a second responsive crop;
- removes the replaced 2019 James runtime derivative from the active asset set;
- locks exact Commons/source/output fingerprints and cross-checks manifest, runtime data and notices;
- expands changed-surface browser evidence to desktop, 1100 × 720 compact desktop, 940 × 700 windowed and 390 × 844 DPR2 mobile;
- preserves face-safe diagonal accents, Reus Home/loading and the accepted Rashford/Martial/Messi/Lahm sources;
- changes no gameplay, storage schema, Candidate A behavior, routes or Transfer/Season rules;
- requires two independent executions of every permanent gate family on the same frozen candidate SHA before promotion;
- leaves Candidate B import analysis as the next substantive roadmap candidate after maintenance closure.""")

replace(".github/workflows/validate-v1-visual-immersion.yml", "1.1.0-r1", "1.1.1-r1", expected=2)
replace(".github/workflows/validate-v1-visual-immersion.yml", "v1.1.0 · Stable", "v1.1.1 · Stable")
replace(".github/workflows/validate-v1-visual-immersion.yml", 'const APP_VERSION = "1.1.0"', 'const APP_VERSION = "1.1.1"')
replace(".github/workflows/validate-final-polish.yml", "1.1.0-r1", "1.1.1-r1", expected=1)
replace(".github/workflows/validate-menu-bootstrap.yml", "1.1.0-r1", "1.1.1-r1", expected=2)
replace(".github/workflows/validate-menu-bootstrap.yml", "^1\\.1\\.0-r\\d+$", "^1\\.1\\.1-r\\d+$", expected=1)
replace(".github/workflows/validate-menu-bootstrap.yml", "v1.1.0 cache revision", "v1.1.1 cache revision", expected=1)
replace(".github/workflows/validate-season-review.yml", "^1\\.1\\.0-r\\d+$", "^1\\.1\\.1-r\\d+$", expected=1)
replace(".github/workflows/validate-season-review.yml", "v1.1.0 cache revision", "v1.1.1 cache revision", expected=1)
replace(".github/workflows/validate-statistics-workstream.yml", "^1\\.1\\.0-r\\d+$", "^1\\.1\\.1-r\\d+$", expected=1)
replace(".github/workflows/validate-statistics-workstream.yml", "v1.1.0 deployment asset revision", "v1.1.1 deployment asset revision", expected=1)
replace(".github/workflows/validate-v110-release-burnin.yml", "name: Validate v1.1.0 Release Burn-In", "name: Validate v1.1.1 Release Burn-In")

static_path = ".github/workflows/validate-static-app.yml"
static = read(static_path)
for old, new, count in [
    ("const expectedVersion = '1.1.0';", "const expectedVersion = '1.1.1';", 1),
    ("const expectedRevision = '1.1.0-r1';", "const expectedRevision = '1.1.1-r1';", 1),
    ("const releaseRecord = fs.readFileSync('RELEASE_V1.1.0.md', 'utf8');", "const releaseRecord = fs.readFileSync('RELEASE_V1.1.1.md', 'utf8');", 1),
    ("const previousReleaseRecord = fs.readFileSync('RELEASE_V1.0.2.md', 'utf8');", "const previousReleaseRecord = fs.readFileSync('RELEASE_V1.1.0.md', 'utf8');\n          const visualMaintenanceReleaseRecord = fs.readFileSync('RELEASE_V1.0.2.md', 'utf8');", 1),
    ("v1.1.0 · Stable", "v1.1.1 · Stable", 1),
    ("**Application version:** v1.1.0 — Stable", "**Application version:** v1.1.1 — Maintenance Candidate", 2),
    ("**Runtime asset revision:** `1.1.0-r1`", "**Runtime asset revision:** `1.1.1-r1`", 1),
    ("## Current baseline: v1.1.0 Stable", "## Current baseline: v1.1.1 Maintenance Candidate", 1),
    ("assert.ok(changelog.includes('# v1.1.0 — Data Safety and Recovery / Candidate A'), 'CHANGELOG v1.1.0 Candidate A release entry is missing.');", "assert.ok(changelog.includes('# v1.1.1 — James Rodríguez Real Madrid Source Refresh'), 'CHANGELOG v1.1.1 maintenance entry is missing.');\n          assert.ok(changelog.includes('# v1.1.0 — Data Safety and Recovery / Candidate A'), 'Historical v1.1.0 Candidate A release entry is missing.');", 1),
    ("assert.ok(releaseRecord.includes('Release tag: `v1.1.0`'), 'Permanent v1.1.0 release record is incomplete.');", "assert.ok(releaseRecord.includes('Release tag: `v1.1.1`'), 'Permanent v1.1.1 release record is incomplete.');", 1),
    ("document.includes('1.1.0-r1')", "document.includes('1.1.1-r1')", 1),
    ("missing the v1.1.0 runtime identity", "missing the v1.1.1 runtime identity", 1),
    ("assert.ok(releaseRecord.includes('Runtime asset revision: `1.1.0-r1`'), 'The v1.1.0 release record must contain the current runtime identity.');", "assert.ok(releaseRecord.includes('Runtime asset revision: `1.1.1-r1`'), 'The v1.1.1 release record must contain the current runtime identity.');", 1),
    ("assert.ok(previousReleaseRecord.includes('1.0.2-r1'), 'The immutable v1.0.2 release record must retain its deployed r1 evidence.');", "assert.ok(previousReleaseRecord.includes('1.1.0-r1'), 'The immutable v1.1.0 release record must retain its deployed r1 evidence.');\n          assert.ok(visualMaintenanceReleaseRecord.includes('1.0.2-r1'), 'The immutable v1.0.2 release record must retain its deployed r1 evidence.');", 1),
]:
    actual = static.count(old)
    if actual != count:
        raise RuntimeError(f"{static_path}: expected {count} occurrences of {old!r}, found {actual}")
    static = static.replace(old, new)
write(static_path, static)

visual_path = ".github/workflows/validate-football-visuals.yml"
visual = read(visual_path)
visual = visual.replace("const browserAudit = fs.readFileSync('tests/browser/football-visual-audit.cjs','utf8');", "const browserAudit = fs.readFileSync('tests/browser/football-visual-audit.cjs','utf8');\n          const builder = fs.readFileSync('tools/build_r5_player_visuals.py','utf8');")
visual = visual.replace("'james-rodriguez-real-madrid-2019-smart-r5.webp',", "'james-rodriguez-real-madrid-2016-smart-v111.webp',")
visual = visual.replace("'james-rodriguez-real-madrid-2016.webp',", "'james-rodriguez-real-madrid-2016.webp',\n            'james-rodriguez-real-madrid-2019-smart-r5.webp',")
old_james = """          const james = manifest.assets.find(asset => asset.id === 'james-rodriguez-real-madrid-2019-smart-r5');
          assert.ok(james, 'r5 James Rodríguez visual is missing.');
          assert.strictEqual(james.author, 'Real Madrid', 'James attribution changed unexpectedly.');
          assert.strictEqual(james.license, 'CC BY 3.0', 'James license changed unexpectedly.');
          assert.ok(decodeURI(james.source_page).includes('James_Rodríguez_in_2019.jpg'), 'James r5 source changed unexpectedly.');
          assert.deepStrictEqual(james.crop_box_on_source, [20,0,540,705], 'James r5 authored crop box changed unexpectedly.');"""
new_james = """          const james = manifest.assets.find(asset => asset.id === 'james-rodriguez-real-madrid-2016-smart-v111');
          assert.ok(james, 'v1.1.1 James Rodríguez Real Madrid visual is missing.');
          assert.strictEqual(james.output, 'james-rodriguez-real-madrid-2016-smart-v111.webp', 'James runtime filename drifted.');
          assert.strictEqual(james.source_file, 'James Rodríguez in September 2016 - 02.jpg', 'James source filename drifted.');
          assert.strictEqual(james.author, 'Real Madrid', 'James attribution changed unexpectedly.');
          assert.strictEqual(james.license, 'CC BY 3.0', 'James license changed unexpectedly.');
          assert.ok(decodeURI(james.source_page).includes('James_Rodríguez_in_September_2016_-_02.jpg'), 'James v1.1.1 source changed unexpectedly.');
          assert.deepStrictEqual(james.source_dimensions, [863,1080], 'James source dimensions changed unexpectedly.');
          assert.deepStrictEqual(james.crop_box_on_source, [0,0,863,1080], 'James must preserve the complete licensed source frame.');
          assert.deepStrictEqual(james.output_dimensions, [863,1080], 'James derivative geometry must preserve the complete source frame without upscaling.');
          assert.strictEqual(james.output_bytes, 85228, 'James derivative byte identity changed unexpectedly.');
          assert.strictEqual(james.source_sha1_commons, '8f1b085518ab1b36e25cda150afb3ae6900622d7', 'James Commons source fingerprint changed.');
          assert.strictEqual(james.source_sha256, 'bd29eb5b69468bf7a542f10f3a5c3aebc5d7b5d66beaacc2980c3b987c0b659c', 'James downloaded-source fingerprint changed.');
          assert.strictEqual(james.output_sha256, '0ed0f578a12f42b19b071488a51fde6b6faac1554ff81b4ffa7a5d810ce73be8', 'James derivative fingerprint changed.');
          assert.ok(/complete licensed source frame preserved/.test(james.crop_policy || ''), 'James full-frame no-secondary-crop policy is missing.');
          assert.ok(data.includes('james-rodriguez-real-madrid-2016-smart-v111.webp'), 'Runtime data must activate the new James source derivative.');
          assert.ok(!data.includes('james-rodriguez-real-madrid-2019-smart-r5.webp'), 'Runtime data must not reference the replaced 2019 James derivative.');
          assert.ok(notices.includes('James Rodríguez in September 2016 - 02.jpg') && notices.includes('0ed0f578a12f42b19b071488a51fde6b6faac1554ff81b4ffa7a5d810ce73be8'), 'James v1.1.1 notice provenance/fingerprint is incomplete.');
          assert.ok(builder.includes('James Rodríguez in September 2016 - 02.jpg') && builder.includes('james-rodriguez-real-madrid-2016-smart-v111'), 'Deterministic builder is not aligned with the active James source.');
          assert.ok(builder.includes('crop_box_on_source') && builder.includes('[0, 0, 863, 1080]') && builder.includes('--only'), 'Builder must preserve the complete James frame and support targeted deterministic rebuilds.');"""
if visual.count(old_james) != 1:
    raise RuntimeError("validate-football-visuals: old James contract block not found exactly once")
visual = visual.replace(old_james, new_james)
visual = visual.replace("assert.ok(data.includes('marcus-rashford-man-utd-2017-smart-r5.webp'), 'Runtime data must activate the final subject-dominant Rashford derivative.');", "assert.ok(data.includes('james-rodriguez-real-madrid-2016-smart-v111.webp'), 'Runtime data must activate the new v1.1.1 James derivative.');\n          assert.ok(data.includes('marcus-rashford-man-utd-2017-smart-r5.webp'), 'Runtime data must activate the final subject-dominant Rashford derivative.');")
visual = visual.replace("console.log(`v1.1.0 clean-anchor licensed visual contracts passed: ${manifest.assets.length} images / ${total} staged presentation bytes.`);", "console.log(`v1.1.1 licensed visual contracts passed: ${manifest.assets.length} images / ${total} staged presentation bytes; new James source identity, full-frame policy and protected-player regressions verified.`);")
write(visual_path, visual)

browser_path = "tests/browser/football-visual-audit.cjs"
browser = read(browser_path)
browser = browser.replace('    { name: "desktop", viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 },\n    { name: "windowed-near-breakpoint",', '    { name: "desktop", viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 },\n    { name: "compact-desktop", viewport: { width: 1100, height: 720 }, deviceScaleFactor: 1 },\n    { name: "windowed-near-breakpoint",')
browser = browser.replace('    "james-rodriguez-real-madrid-2016.webp",', '    "james-rodriguez-real-madrid-2016.webp",\n    "james-rodriguez-real-madrid-2019-smart-r5.webp",')
browser = browser.replace('    "james-rodriguez-real-madrid-2019-smart-r5",', '    "james-rodriguez-real-madrid-2016-smart-v111",')
marker = "const requiredCleanAnchorAssets = new Set([\n"
if browser.count(marker) != 1:
    raise RuntimeError("football visual browser clean-anchor marker missing")
browser = browser.replace(marker, 'const REQUIRED_JAMES_ASSET = "james-rodriguez-real-madrid-2016-smart-v111";\n' + marker, 1)
metrics_marker = """        const metrics = getObjectFitMetrics(panel, result.deviceScaleFactor);
        assert.ok(
            metrics.objectScale <= MAX_PHYSICAL_SCALE,"""
if browser.count(metrics_marker) != 1:
    raise RuntimeError("browser metrics marker missing")
metrics_new = """        const metrics = getObjectFitMetrics(panel, result.deviceScaleFactor);
        if(panel.asset === REQUIRED_JAMES_ASSET){
            assert.equal(panel.naturalWidth, 863, `${screenName}/${panel.asset}: James derivative width no longer matches the reviewed source.`);
            assert.equal(panel.naturalHeight, 1080, `${screenName}/${panel.asset}: James derivative height no longer matches the reviewed source.`);
            assert.equal(panel.objectFit, "contain", `${screenName}/${panel.asset}: James must remain contain-framed.`);
            assert.ok(metrics.objectScale <= 1.0, `${screenName}/${panel.asset}: the refreshed James source must never be physically upscaled.`);
            assert.ok(metrics.visibleSourceFraction >= 0.995, `${screenName}/${panel.asset}: James must preserve essentially the complete 863x1080 derivative.`);
            assert.ok(metrics.frameCoverage >= MIN_SUBJECT_SAFE_FRAME_COVERAGE, `${screenName}/${panel.asset}: James source is technically present but visually under-occupies its frame.`);
            assert.ok(panel.accentTop >= panel.frameHeight * .60, `${screenName}/${panel.asset}: James accent rail moved into the protected head/face zone.`);
        }
        assert.ok(
            metrics.objectScale <= MAX_PHYSICAL_SCALE,"""
browser = browser.replace(metrics_marker, metrics_new)
warm_marker = """        expectedAssets.forEach(file => {
            assert.ok(
                footballRequests.some(url => url.includes(file)),
                `${config.name}: required football photograph was not proactively warmed on startup: ${file}`
            );
        });"""
warm_new = warm_marker + """
        assert.ok(
            !footballRequests.some(url => url.includes("james-rodriguez-real-madrid-2019-smart-r5.webp")),
            `${config.name}: replaced 2019 James asset was requested by the runtime.`
        );"""
if browser.count(warm_marker) != 1:
    raise RuntimeError("browser warmup marker missing")
browser = browser.replace(warm_marker, warm_new)
write(browser_path, browser)

print("v1.1.1 release integration completed")
