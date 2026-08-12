from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')


def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected exactly one {old!r}, found {count}')
    write(path, text.replace(old, new, 1))


def replace_all(path, old, new, minimum=1):
    text = read(path)
    count = text.count(old)
    if count < minimum:
        raise RuntimeError(f'{path}: expected at least {minimum} {old!r}, found {count}')
    write(path, text.replace(old, new))
    return count

# Narrow one-time helper for the six workflow files that remained stale after
# Season Review and ordinary current-authority files were already published.
# It is intentionally fail-closed and is removed before release freeze.
replace_all('.github/workflows/validate-v1-visual-immersion.yml', '1.1.2-r1', '1.1.3-r1')
replace_all('.github/workflows/validate-v1-visual-immersion.yml', 'v1.1.2', 'v1.1.3')
replace_all('.github/workflows/validate-v1-visual-immersion.yml', '"1.1.2"', '"1.1.3"')
replace_all('.github/workflows/validate-final-polish.yml', '1.1.2-r1', '1.1.3-r1')
replace_all('.github/workflows/validate-final-polish.yml', 'v1.1.2', 'v1.1.3')
replace_all('.github/workflows/validate-statistics-workstream.yml', 'v1.1.2', 'v1.1.3')
replace_all('.github/workflows/validate-menu-bootstrap.yml', '1.1.2-r1', '1.1.3-r1')
replace_all('.github/workflows/validate-menu-bootstrap.yml', 'v1.1.2', 'v1.1.3')
replace_all('.github/workflows/validate-v110-release-burnin.yml', 'v1.1.2', 'v1.1.3')

static_path = '.github/workflows/validate-static-app.yml'
replace_once(static_path, "const expectedVersion = '1.1.2';", "const expectedVersion = '1.1.3';")
replace_once(static_path, "const expectedRevision = '1.1.2-r1';", "const expectedRevision = '1.1.3-r1';")
replace_once(
    static_path,
    "const releaseRecord = fs.readFileSync('RELEASE_V1.1.2.md', 'utf8');\n          const previousReleaseRecord = fs.readFileSync('RELEASE_V1.1.1.md', 'utf8');",
    "const releaseRecord = fs.readFileSync('RELEASE_V1.1.3.md', 'utf8');\n          const previousReleaseRecord = fs.readFileSync('RELEASE_V1.1.2.md', 'utf8');\n          const jamesMaintenanceReleaseRecord = fs.readFileSync('RELEASE_V1.1.1.md', 'utf8');"
)
replace_once(static_path, "assert.ok(html.includes('v1.1.2 · Stable'), 'Stable user-facing footer identity is missing.');", "assert.ok(html.includes('v1.1.3 · Stable'), 'Stable user-facing footer identity is missing.');")
replace_once(static_path, "assert.ok(projectState.includes('**Application version:** v1.1.2 — Maintenance Candidate'), 'PROJECT_STATE current version is stale.');", "assert.ok(projectState.includes('**Application version:** v1.1.3 — Owner-Priority Maintenance Candidate'), 'PROJECT_STATE current version is stale.');")
replace_once(static_path, "assert.ok(projectState.includes('**Runtime asset revision:** `1.1.2-r1`'), 'PROJECT_STATE runtime revision is stale.');", "assert.ok(projectState.includes('**Runtime asset revision:** `1.1.3-r1`'), 'PROJECT_STATE runtime revision is stale.');")
replace_once(static_path, "assert.ok(nextTask.includes('## Current baseline: v1.1.2 Candidate B'), 'NEXT_TASK does not identify Candidate B as the current baseline.');", "assert.ok(nextTask.includes('## Current baseline: v1.1.3 Owner-Priority Maintenance Candidate'), 'NEXT_TASK does not identify the current v1.1.3 maintenance baseline.');")
replace_once(static_path, "assert.ok(readme.includes('**Application version:** v1.1.2 — Maintenance Candidate'), 'README current version is stale.');", "assert.ok(readme.includes('**Application version:** v1.1.3 — Owner-Priority Maintenance Candidate'), 'README current version is stale.');")
replace_once(static_path, "assert.ok(changelog.includes('# v1.1.2 — Candidate B Import Analysis + Migration Preview'), 'CHANGELOG v1.1.2 Candidate B entry is missing.');", "assert.ok(changelog.includes('# v1.1.3 — League Wheel Stability + Cinematic Football Visual Expansion'), 'CHANGELOG v1.1.3 maintenance entry is missing.');\n          assert.ok(changelog.includes('# v1.1.2 — Candidate B Import Analysis + Migration Preview'), 'Historical v1.1.2 Candidate B entry is missing.');")
replace_once(static_path, "assert.ok(releaseRecord.includes('Release tag: `v1.1.2`'), 'Permanent v1.1.2 release record is incomplete.');", "assert.ok(releaseRecord.includes('Release tag: `v1.1.3`'), 'Permanent v1.1.3 release record is incomplete.');")
replace_once(static_path, "assert.ok(document.includes('1.1.2-r1'), `Current authority document ${index + 1} is missing the v1.1.2 runtime identity.`);", "assert.ok(document.includes('1.1.3-r1'), `Current authority document ${index + 1} is missing the v1.1.3 runtime identity.`);")
replace_once(
    static_path,
    "assert.ok(releaseRecord.includes('Runtime asset revision: `1.1.2-r1`'), 'The v1.1.2 release record must contain the current runtime identity.');\n          assert.ok(previousReleaseRecord.includes('1.1.1-r1'), 'The immutable v1.1.1 release record must retain its deployed r1 evidence.');",
    "assert.ok(releaseRecord.includes('Runtime asset revision: `1.1.3-r1`'), 'The v1.1.3 release record must contain the current runtime identity.');\n          assert.ok(previousReleaseRecord.includes('1.1.2-r1'), 'The immutable v1.1.2 release record must retain its deployed r1 evidence.');\n          assert.ok(jamesMaintenanceReleaseRecord.includes('1.1.1-r1'), 'The immutable v1.1.1 release record must retain its deployed r1 evidence.');"
)

# Protected performance ceilings are verified, never edited.
static = read('.github/workflows/validate-static-app.yml')
final_polish = read('.github/workflows/validate-final-polish.yml')
if 'const maximumInitialAssetBytes = 165000;' not in static:
    raise RuntimeError('Static raw startup ceiling changed or disappeared')
if 'const maximumCompressedInitialAssetBytes = 37500;' not in static:
    raise RuntimeError('Static gzip startup ceiling changed or disappeared')
if 'rawBytes <= 165000' not in final_polish or 'compressedBytes <= 37500' not in final_polish:
    raise RuntimeError('Final Polish startup ceilings changed or disappeared')

print('Prepared exact six-workflow v1.1.3 identity alignment; protected startup ceilings unchanged.')
