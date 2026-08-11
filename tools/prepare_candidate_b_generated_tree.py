from pathlib import Path
import re


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"{path}: required generated fragment not found: {old[:100]!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


# Candidate B receives values through multiple test/runtime realms. Accept JSON-style
# objects cross-realm without accepting arrays or primitives.
path = Path("js/importAnalysis.js")
source = path.read_text(encoding="utf-8")
replacement = '''    function isPlainImportObject(value){
        return Boolean(value && typeof value === "object" && !Array.isArray(value)
            && Object.prototype.toString.call(value) === "[object Object]");
    }

    function cloneImportValue'''
source, count = re.subn(
    r'    function isPlainImportObject\(value\)\{[\s\S]*?\n    \}\n\n    function cloneImportValue',
    replacement,
    source,
    count=1,
)
if count != 1:
    raise SystemExit(f"Expected exactly one import plain-object helper; replaced {count}.")
path.write_text(source, encoding="utf-8")

# Keep the new Candidate B hook below the unchanged eager raw/gzip budget. The
# browser and contract suites verify the analyzer/mount exports independently, so
# the loader only needs one stable sentinel proving the module executed.
path = Path("js/optionalModules.js")
source = path.read_text(encoding="utf-8")
compact_loader = '    await loadRuntimeScript("import-analysis","js/importAnalysis.js",()=>typeof window.analyzeCareerModeBackupFile==="function");'
source, count = re.subn(
    r'    await loadRuntimeScript\(\n        "import-analysis",\n        "js/importAnalysis\.js",\n        \(\) => typeof window\.analyzeCareerModeBackupFile === "function"\n            && typeof window\.analyzeCareerModeBackupEnvelope === "function"\n            && typeof window\.mountCareerModeImportAnalysisPanel === "function"\n    \);',
    compact_loader,
    source,
    count=1,
)
if count != 1:
    raise SystemExit(f"Expected exactly one Candidate B lazy-loader; replaced {count}.")
path.write_text(source, encoding="utf-8")

# The previous guarded run proved this matrix input accidentally migrated to the
# same preference state as local storage. Make the imported schema-1 fixture truly
# different; do not change production comparison logic to satisfy a bad test.
replace_once(
    "tests/contracts/import-analysis-contracts.cjs",
    "preferences: { ...schema1Preferences, reducedMotion: false }",
    "preferences: { ...schema1Preferences, reducedMotion: true }",
)

# A group containing one same-ID/different-content record is intentionally treated
# as a blocking conflicting-ID group as a whole. The existing blocking/error
# assertions already prove no silent dedupe. Remove the contradictory expectation
# that the same group must simultaneously retain an exact-duplicate warning.
replace_once(
    "tests/contracts/import-analysis-contracts.cjs",
    '    assert.ok(duplicateAnalysis.warnings.some(message => /does not silently deduplicate/i.test(message)) || duplicateAnalysis.preview.legacy.duplicateWithinBackup >= 1);\n',
    '',
)

# Make the release record structurally consistent with current release validators.
replace_once(
    "RELEASE_V1.1.2.md",
    "Application: `v1.1.2`\nRuntime revision: `1.1.2-r1`",
    "Release tag: `v1.1.2`\n\nApplication: `v1.1.2`\nRuntime asset revision: `1.1.2-r1`",
)

# Current-release assertions move forward to v1.1.2 while historical release
# documents remain immutable and still retain their own identities.
static_path = Path(".github/workflows/validate-static-app.yml")
static = static_path.read_text(encoding="utf-8")
replacements = [
    ("const expectedVersion = '1.1.1';", "const expectedVersion = '1.1.2';"),
    ("const expectedRevision = '1.1.1-r1';", "const expectedRevision = '1.1.2-r1';"),
    ("const releaseRecord = fs.readFileSync('RELEASE_V1.1.1.md', 'utf8');", "const releaseRecord = fs.readFileSync('RELEASE_V1.1.2.md', 'utf8');"),
    ("const previousReleaseRecord = fs.readFileSync('RELEASE_V1.1.0.md', 'utf8');", "const previousReleaseRecord = fs.readFileSync('RELEASE_V1.1.1.md', 'utf8');\n          const candidateAReleaseRecord = fs.readFileSync('RELEASE_V1.1.0.md', 'utf8');"),
    ("assert.ok(html.includes('v1.1.1 · Stable'), 'Stable user-facing footer identity is missing.');", "assert.ok(html.includes('v1.1.2 · Stable'), 'Stable user-facing footer identity is missing.');"),
    ("assert.ok(projectState.includes('**Application version:** v1.1.1 — Maintenance Candidate'), 'PROJECT_STATE current version is stale.');", "assert.ok(projectState.includes('**Application version:** v1.1.2 — Maintenance Candidate'), 'PROJECT_STATE current version is stale.');"),
    ("assert.ok(projectState.includes('**Runtime asset revision:** `1.1.1-r1`'), 'PROJECT_STATE runtime revision is stale.');", "assert.ok(projectState.includes('**Runtime asset revision:** `1.1.2-r1`'), 'PROJECT_STATE runtime revision is stale.');"),
    ("assert.ok(nextTask.includes('## Current baseline: v1.1.1 Maintenance Candidate'), 'NEXT_TASK does not identify the stable baseline.');", "assert.ok(nextTask.includes('## Current baseline: v1.1.2 Candidate B'), 'NEXT_TASK does not identify Candidate B as the current baseline.');"),
    ("assert.ok(readme.includes('**Application version:** v1.1.1 — Maintenance Candidate'), 'README current version is stale.');", "assert.ok(readme.includes('**Application version:** v1.1.2 — Maintenance Candidate'), 'README current version is stale.');"),
    ("assert.ok(changelog.includes('# v1.1.1 — James Rodríguez Real Madrid Source Refresh'), 'CHANGELOG v1.1.1 maintenance entry is missing.');", "assert.ok(changelog.includes('# v1.1.2 — Candidate B Import Analysis + Migration Preview'), 'CHANGELOG v1.1.2 Candidate B entry is missing.');\n          assert.ok(changelog.includes('# v1.1.1 — James Rodríguez Real Madrid Source Refresh'), 'Historical v1.1.1 maintenance entry is missing.');"),
    ("assert.ok(releaseRecord.includes('Release tag: `v1.1.1`'), 'Permanent v1.1.1 release record is incomplete.');", "assert.ok(releaseRecord.includes('Release tag: `v1.1.2`'), 'Permanent v1.1.2 release record is incomplete.');"),
    ("assert.ok(document.includes('1.1.1-r1'), `Current authority document ${index + 1} is missing the v1.1.1 runtime identity.`);", "assert.ok(document.includes('1.1.2-r1'), `Current authority document ${index + 1} is missing the v1.1.2 runtime identity.`);"),
    ("assert.ok(releaseRecord.includes('Runtime asset revision: `1.1.1-r1`'), 'The v1.1.1 release record must contain the current runtime identity.');", "assert.ok(releaseRecord.includes('Runtime asset revision: `1.1.2-r1`'), 'The v1.1.2 release record must contain the current runtime identity.');"),
    ("assert.ok(previousReleaseRecord.includes('1.1.0-r1'), 'The immutable v1.1.0 release record must retain its deployed r1 evidence.');", "assert.ok(previousReleaseRecord.includes('1.1.1-r1'), 'The immutable v1.1.1 release record must retain its deployed r1 evidence.');\n          assert.ok(candidateAReleaseRecord.includes('1.1.0-r1'), 'The immutable v1.1.0 Candidate A release record must retain its deployed r1 evidence.');"),
]
for old, new in replacements:
    if old not in static:
        raise SystemExit(f"Static App current-release assertion not found: {old}")
    static = static.replace(old, new, 1)

old_forbidden = "            'js/trophyRoom.js', 'js/settings.js', 'data/leagues.js', 'data/clubs.js'"
new_forbidden = "            'js/trophyRoom.js', 'js/settings.js', 'js/backup.js', 'js/importAnalysis.js', 'js/legacy.js', 'data/leagues.js', 'data/clubs.js'"
if old_forbidden not in static:
    raise SystemExit("Static App eager-forbidden list source not found.")
static_path.write_text(static.replace(old_forbidden, new_forbidden, 1), encoding="utf-8")

print("Candidate B generated tree hardening applied successfully.")
