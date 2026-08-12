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

# Current executable release validators. Historical release documents are not
# rewritten; only current expected runtime identity advances to v1.1.3.
replace_all('.github/workflows/validate-season-review.yml', 'v1.1.2', 'v1.1.3')
replace_all('.github/workflows/validate-v1-visual-immersion.yml', '1.1.2-r1', '1.1.3-r1')
replace_all('.github/workflows/validate-v1-visual-immersion.yml', 'v1.1.2', 'v1.1.3')
replace_all('.github/workflows/validate-v1-visual-immersion.yml', '"1.1.2"', '"1.1.3"')
replace_all('.github/workflows/validate-final-polish.yml', '1.1.2-r1', '1.1.3-r1')
replace_all('.github/workflows/validate-final-polish.yml', 'v1.1.2', 'v1.1.3')
replace_all('.github/workflows/validate-statistics-workstream.yml', 'v1.1.2', 'v1.1.3')
replace_all('.github/workflows/validate-menu-bootstrap.yml', '1.1.2-r1', '1.1.3-r1')
replace_all('.github/workflows/validate-menu-bootstrap.yml', 'v1.1.2', 'v1.1.3')
replace_all('.github/workflows/validate-v110-release-burnin.yml', 'v1.1.2', 'v1.1.3')

# Static release contract keeps immutable previous records but advances current
# authority to RELEASE_V1.1.3.md / 1.1.3-r1.
static_path = '.github/workflows/validate-static-app.yml'
replace_once(static_path, "const expectedVersion = '1.1.2';", "const expectedVersion = '1.1.3';")
replace_once(static_path, "const expectedRevision = '1.1.2-r1';", "const expectedRevision = '1.1.3-r1';")
replace_once(static_path, "const releaseRecord = fs.readFileSync('RELEASE_V1.1.2.md', 'utf8');\n          const previousReleaseRecord = fs.readFileSync('RELEASE_V1.1.1.md', 'utf8');", "const releaseRecord = fs.readFileSync('RELEASE_V1.1.3.md', 'utf8');\n          const previousReleaseRecord = fs.readFileSync('RELEASE_V1.1.2.md', 'utf8');\n          const jamesMaintenanceReleaseRecord = fs.readFileSync('RELEASE_V1.1.1.md', 'utf8');")
replace_once(static_path, "assert.ok(html.includes('v1.1.2 · Stable'), 'Stable user-facing footer identity is missing.');", "assert.ok(html.includes('v1.1.3 · Stable'), 'Stable user-facing footer identity is missing.');")
replace_once(static_path, "assert.ok(projectState.includes('**Application version:** v1.1.2 — Maintenance Candidate'), 'PROJECT_STATE current version is stale.');", "assert.ok(projectState.includes('**Application version:** v1.1.3 — Owner-Priority Maintenance Candidate'), 'PROJECT_STATE current version is stale.');")
replace_once(static_path, "assert.ok(projectState.includes('**Runtime asset revision:** `1.1.2-r1`'), 'PROJECT_STATE runtime revision is stale.');", "assert.ok(projectState.includes('**Runtime asset revision:** `1.1.3-r1`'), 'PROJECT_STATE runtime revision is stale.');")
replace_once(static_path, "assert.ok(nextTask.includes('## Current baseline: v1.1.2 Candidate B'), 'NEXT_TASK does not identify Candidate B as the current baseline.');", "assert.ok(nextTask.includes('## Current baseline: v1.1.3 Owner-Priority Maintenance Candidate'), 'NEXT_TASK does not identify the current v1.1.3 maintenance baseline.');")
replace_once(static_path, "assert.ok(readme.includes('**Application version:** v1.1.2 — Maintenance Candidate'), 'README current version is stale.');", "assert.ok(readme.includes('**Application version:** v1.1.3 — Owner-Priority Maintenance Candidate'), 'README current version is stale.');")
replace_once(static_path, "assert.ok(changelog.includes('# v1.1.2 — Candidate B Import Analysis + Migration Preview'), 'CHANGELOG v1.1.2 Candidate B entry is missing.');", "assert.ok(changelog.includes('# v1.1.3 — League Wheel Stability + Cinematic Football Visual Expansion'), 'CHANGELOG v1.1.3 maintenance entry is missing.');\n          assert.ok(changelog.includes('# v1.1.2 — Candidate B Import Analysis + Migration Preview'), 'Historical v1.1.2 Candidate B entry is missing.');")
replace_once(static_path, "assert.ok(releaseRecord.includes('Release tag: `v1.1.2`'), 'Permanent v1.1.2 release record is incomplete.');", "assert.ok(releaseRecord.includes('Release tag: `v1.1.3`'), 'Permanent v1.1.3 release record is incomplete.');")
replace_once(static_path, "assert.ok(document.includes('1.1.2-r1'), `Current authority document ${index + 1} is missing the v1.1.2 runtime identity.`);", "assert.ok(document.includes('1.1.3-r1'), `Current authority document ${index + 1} is missing the v1.1.3 runtime identity.`);")
replace_once(static_path, "assert.ok(releaseRecord.includes('Runtime asset revision: `1.1.2-r1`'), 'The v1.1.2 release record must contain the current runtime identity.');\n          assert.ok(previousReleaseRecord.includes('1.1.1-r1'), 'The immutable v1.1.1 release record must retain its deployed r1 evidence.');", "assert.ok(releaseRecord.includes('Runtime asset revision: `1.1.3-r1`'), 'The v1.1.3 release record must contain the current runtime identity.');\n          assert.ok(previousReleaseRecord.includes('1.1.2-r1'), 'The immutable v1.1.2 release record must retain its deployed r1 evidence.');\n          assert.ok(jamesMaintenanceReleaseRecord.includes('1.1.1-r1'), 'The immutable v1.1.1 release record must retain its deployed r1 evidence.');")

# Current Candidate A/B contracts report the current app envelope identity while
# preserving the underlying Candidate A/B behavior and schemas.
replace_all('tests/contracts/backup-contracts.cjs', '1.1.2-r1', '1.1.3-r1')
replace_all('tests/contracts/backup-contracts.cjs', '"1.1.2"', '"1.1.3"')
replace_all('tests/contracts/import-analysis-contracts.cjs', '1.1.2-r1', '1.1.3-r1')
replace_once('tests/contracts/import-analysis-contracts.cjs', 'PASS  v1.1.2 Candidate B import-analysis contracts', 'PASS  Candidate B import-analysis contracts on v1.1.3')
replace_once('tests/browser/import-analysis-audit.cjs', 'PASS  v1.1.2 Candidate B import-analysis browser audit', 'PASS  Candidate B import-analysis browser audit on v1.1.3')
replace_all('tests/support/run-release-burnin-pass.sh', 'v1.1.2', 'v1.1.3')

# Current authority docs. Production SHA remains explicitly the v1.1.2 runtime
# until the v1.1.3 expected-head merge actually happens.
replace_once('PROJECT_STATE.md', 'This project is already designed and implemented through the v1.0.2 visual-maintenance patch.', 'This project is already designed and implemented through the v1.1.3 owner-priority maintenance candidate.')
replace_once('PROJECT_STATE.md', '**Application version:** v1.1.2 — Maintenance Candidate', '**Application version:** v1.1.3 — Owner-Priority Maintenance Candidate')
replace_once('PROJECT_STATE.md', '**Runtime asset revision:** `1.1.2-r1`', '**Runtime asset revision:** `1.1.3-r1`')
replace_once('PROJECT_STATE.md', '**Current milestone:** v1.1.2 — Candidate B complete; Candidate C Atomic Restore + Recovery UX next', '**Current milestone:** v1.1.3 — League Wheel stability + licensed cinematic visual expansion in release validation; Candidate C next')
replace_once('PROJECT_STATE.md', '**Current activity:** Candidate B is merged/deployed/proven; next runtime work is Candidate C atomic restore with exact raw snapshots, explicit choices, storage-authority writes and verified rollback', '**Current activity:** owner-priority v1.1.3 maintenance is being validated for merge/deployment; Candidate C atomic restore begins only after this release is proven')
replace_once('PROJECT_STATE.md', '**Runtime change class:** lazy Data Management import-analysis module + migration/conflict preview + validation gates; gameplay, scoring, routes, storage schema/keys, Candidate A export semantics and state-machine rules remain locked', '**Runtime change class:** League Wheel transition-race correction + route-scoped licensed football photography expansion; gameplay, scoring, storage schema/keys, Candidate A/B semantics and state-machine rules remain locked')
replace_once('PROJECT_STATE.md', '**Current runtime authority:** v1.1.2 / `1.1.2-r1` at merge `6dfea100829016eee4820b342729b8c823426f95`', '**Current candidate identity:** v1.1.3 / `1.1.3-r1`; production runtime authority remains v1.1.2 merge `6dfea100829016eee4820b342729b8c823426f95` until v1.1.3 merges/deploys')
marker = '# v1.1.2 — Candidate B Import Analysis + Migration Preview'
state = read('PROJECT_STATE.md')
if '# v1.1.3 — League Wheel Stability + Cinematic Football Visual Expansion' not in state:
    section = '''# v1.1.3 — League Wheel Stability + Cinematic Football Visual Expansion\n\nThe owner reported that a League Wheel could appear to reroll after already stopping on a league, before Continue was pressed. The reproduced class is a transform-transition normalization race, not a second random league draw. v1.1.3 scopes the transform transition to the active spin and disarms it before selected-angle normalization. Permanent League Confirmation gates protect settled/cancelled no-transition state and stale-operation rejection.\n\nThe owner also requested stronger James Rodríguez, Marcus Rashford and Anthony Martial source photography and at least seven additional photographs with cinematic/historic value. v1.1.3 activates new licensed Commons sources for those three players and adds Ronaldo, Pogba, Ibrahimović, Griezmann, Neymar, Falcao and Balotelli across seven bounded screen-purpose bands. The visual archive is route-scoped: Home startup requests zero football-photo assets, and each destination loads only its declared photograph(s). Protected Messi/Lahm derivatives and Marco Reus Home/loading presentation remain intact.\n\nThe release is still in validation. Candidate C remains the next substantive Data Safety and Recovery task after v1.1.3 is merged, deployed and proven.\n\n'''
    if marker not in state:
        raise RuntimeError('PROJECT_STATE v1.1.2 marker missing')
    write('PROJECT_STATE.md', state.replace(marker, section + marker, 1))

replace_once('README.md', '**Application version:** v1.1.2 — Maintenance Candidate', '**Application version:** v1.1.3 — Owner-Priority Maintenance Candidate')
replace_once('README.md', '**Runtime asset revision:** `1.1.2-r1`', '**Runtime asset revision:** `1.1.3-r1`')
replace_once('README.md', '**Current phase:** Candidate B is complete/deployed/protected; Candidate C — Atomic Restore + Recovery UX — is next', '**Current phase:** v1.1.3 owner-priority maintenance is in release validation; Candidate C — Atomic Restore + Recovery UX — remains next')
readme = read('README.md')
if '## v1.1.3 — League Wheel stability + cinematic football visual expansion' not in readme:
    readme_marker = '## v1.1.2 — Candidate B Import Analysis + Migration Preview'
    section = '''## v1.1.3 — League Wheel stability + cinematic football visual expansion\n\nv1.1.3 fixes the post-selection League Wheel visual reroll by making transform animation exist only during a real spin and disarming it before the chosen angle is normalized. It also replaces the active James Rodríguez, Marcus Rashford and Anthony Martial source photographs and adds seven more licensed historic/cinematic football visuals across League Wheel, Club Assignment, Showdown Home, Season Results, Season Summary, Legacy and Rule Book.\n\nThe licensed visual archive is route-scoped rather than startup-preloaded: Home startup requests zero football-photo assets. Permanent gates protect the 12-image provenance/byte set, no-upscaling/contain policy, responsive clean-anchor geometry, reduced motion, and the unchanged 165,000 raw / 37,500 gzip eager-code budgets. Candidate C remains next after this maintenance release is deployed/proven.\n\n'''
    if readme_marker not in readme:
        raise RuntimeError('README v1.1.2 marker missing')
    write('README.md', readme.replace(readme_marker, section + readme_marker, 1))

replace_once('NEXT_TASK.md', 'Application version: v1.1.2', 'Application version: v1.1.3')
replace_once('NEXT_TASK.md', 'Runtime asset revision: `1.1.2-r1`', 'Runtime asset revision: `1.1.3-r1`')
replace_once('NEXT_TASK.md', 'Runtime implementation authority: `6dfea100829016eee4820b342729b8c823426f95`', 'Production runtime authority until v1.1.3 merge: `6dfea100829016eee4820b342729b8c823426f95`')
replace_once('NEXT_TASK.md', '## Current baseline: v1.1.2 Candidate B — Complete and Protected', '## Current baseline: v1.1.3 Owner-Priority Maintenance Candidate')
next_task = read('NEXT_TASK.md')
needle = '## Current baseline: v1.1.3 Owner-Priority Maintenance Candidate\n\n'
if 'The active v1.1.3 maintenance candidate fixes the owner-reported League Wheel' not in next_task:
    insert = ('The active v1.1.3 maintenance candidate fixes the owner-reported League Wheel post-selection visual reroll and replaces/expands licensed football photography with route-scoped loading. It changes no gameplay, scoring or persistence semantics. It must be merged/deployed/proven before Candidate C starts.\n\n')
    if needle not in next_task:
        raise RuntimeError('NEXT_TASK v1.1.3 baseline marker missing')
    write('NEXT_TASK.md', next_task.replace(needle, needle + insert, 1))

replace_once('00_DEVELOPER_START_HERE.md', 'Application: `v1.1.2`', 'Application: `v1.1.3`')
replace_once('00_DEVELOPER_START_HERE.md', 'Runtime asset revision: `1.1.2-r1`.', 'Runtime asset revision: `1.1.3-r1`.')
replace_once('00_DEVELOPER_START_HERE.md', 'Candidate A backup/export and Candidate B — Import Analysis + Migration Preview — are complete, merged, deployed and protected. Candidate C — Atomic Restore + Recovery UX — is now the next legal substantive Data Safety and Recovery build.', 'Candidate A backup/export and Candidate B — Import Analysis + Migration Preview — are complete, merged, deployed and protected. The owner-priority v1.1.3 League Wheel/football-visual maintenance candidate is in release validation. Candidate C — Atomic Restore + Recovery UX — remains the next substantive Data Safety and Recovery build after v1.1.3 is deployed/proven.')
replace_once('00_DEVELOPER_START_HERE.md', 'The v1.1.2 runtime authority is `6dfea100829016eee4820b342729b8c823426f95`. v1.2.0 remains reserved for Installable Offline App after Candidate C closes v1.1 Data Safety and Recovery.', 'The current candidate identity is v1.1.3 / `1.1.3-r1`; production runtime authority remains v1.1.2 merge `6dfea100829016eee4820b342729b8c823426f95` until the v1.1.3 expected-head merge and Pages deployment complete. v1.2.0 remains reserved for Installable Offline App after Candidate C closes v1.1 Data Safety and Recovery.')

changelog = read('CHANGELOG.md')
if not changelog.startswith('# v1.1.3 — League Wheel Stability + Cinematic Football Visual Expansion'):
    entry = '''# v1.1.3 — League Wheel Stability + Cinematic Football Visual Expansion\n\nDate: **August 12, 2026**\n\nRuntime asset revision: **`1.1.3-r1`**\n\n- fixes the League Wheel post-selection visual reroll by scoping transform animation to the active spin and disarming it before selected-angle normalization;\n- permanently gates settled/cancelled no-transition state, single league draw and stale-operation rejection;\n- replaces James Rodríguez with a different licensed 2014 World Cup source and does not reuse either previously rejected James source;\n- replaces Marcus Rashford and Anthony Martial with new licensed match sources;\n- adds seven more licensed historic/cinematic screen-purpose photographs: Ronaldo, Pogba, Ibrahimović, Griezmann, Neymar, Falcao and Balotelli;\n- expands the football visual plan to 11 destinations / 12 local derivatives while preserving protected Messi, Lahm and Marco Reus assets;\n- changes the football visual loader from global archive preloading to route-owned loading, requiring zero football-photo requests at Home startup;\n- retains `object-fit: contain`, clean-anchor face safety, responsive Chromebook/mobile controls and unchanged 165,000 raw / 37,500 gzip eager-code budgets;\n- changes no scoring, gameplay, storage schema/keys, Candidate A export semantics or Candidate B read-only analysis semantics;\n- leaves Candidate C Atomic Restore + Recovery UX as the next substantive v1.1 task after this maintenance release is merged/deployed/proven.\n\n'''
    write('CHANGELOG.md', entry + changelog)

print('Aligned current v1.1.3 validators and authority docs without rewriting immutable historical release records.')
