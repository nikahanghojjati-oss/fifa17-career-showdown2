from pathlib import Path
import subprocess
import re

REPO_BRANCH = 'handoff/v1.4.36-r4-production-seal-recovered'
SOURCE_COMMIT = '980c9c42e909e794dc83afeb8b5c057427e1611a'
GEN = Path('scripts/tmp-handoff-v1436-seal.mjs')
WORKFLOW = Path('.github/workflows/tmp-handoff-v1436-recover.yml')
SELF = Path('scripts/recover-v1436-production-seal.py')


def run(*args, capture=False):
    return subprocess.run(args, check=True, text=True, capture_output=capture)

run('git', 'fetch', 'origin', SOURCE_COMMIT)
source = subprocess.check_output(['git', 'show', f'{SOURCE_COMMIT}:scripts/tmp-handoff-v1436-seal.mjs'], text=True)
GEN.write_text(source)
seal_yaml = subprocess.check_output(['git', 'show', f'{SOURCE_COMMIT}:.github/workflows/tmp-handoff-v1436-seal.yml'], text=True)

# Reuse the previously validated historical/SLE authority reconciliation block.
out = []
active = False
for line in seal_yaml.splitlines():
    if "node - <<'NODE'" in line:
        active = True
        continue
    if active and line.strip() == 'NODE':
        break
    if active:
        out.append(line[10:] if line.startswith('          ') else line)
if not out:
    raise SystemExit('could not recover validated authority patch')
Path('/tmp/reconcile.cjs').write_text('\n'.join(out) + '\n')
run('node', '/tmp/reconcile.cjs')

s = GEN.read_text()

def required_replace(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'missing {label} anchor')
    s = s.replace(old, new, 1)

required_replace(
    'SLE = Smart Lean Efficient. This is the deep-reference handoff behind ${STARTER}. Treat it as orientation only;',
    'SLE = Smart Lean Efficient. This is the deep-reference handoff behind ${STARTER}. Publication remains conditioned on required tests and required gates passing. Treat it as orientation only;',
    'deep handoff publication condition'
)
required_replace(
    "capsule.bootstrapBranch='handoff-v1.4.36-r4-production-seal';",
    "capsule.bootstrapBranch='handoff/v1.4.36-r4-production-seal-recovered';",
    'recovered bootstrap branch'
)

changelog_anchor = "let ch=read('CHANGELOG.md')"
provenance = "for(const p of ['CAREER_MODE_SHOWDOWN_V1.9.0_R4_MAINTENANCE_HANDOFF.md','RELEASE_V1.9.0_R4.md']){let rs=read(p);const proof='Production proof: PR #184 merge '+MAIN+'; Deploy GitHub Pages run '+PAGES_RUN+'; Stability/deployed-site-smoke run '+STABILITY_RUN+'.';if(!rs.includes(proof))rs=rs.trimEnd()+'\\n\\n'+proof+'\\n';write(p,rs);}\n"
required_replace(changelog_anchor, provenance + changelog_anchor, 'release provenance')

# PR #166 remains historical rollback provenance. PR #184 is current production provenance.
s, n = re.subn(r"capsule\.latestRuntimeMerge=\{pullRequest:184,[^\n]+\};\n", '', s, count=1)
if n != 1:
    raise SystemExit('latestRuntimeMerge overwrite anchor not found')
s = re.sub(r"sleTest=sleTest\.replace\([^\n]*latestRuntimeMerge\.pullRequest[^\n]*184[^\n]*\);\n", '', s)

validation_anchor = '// Validate the current handoff package before committing.'
contract_patch = r'''let st=read('tests/contracts/sle-handoff-packaging-contracts.cjs');
const bundled=/assert\.equal\(capsule\.latestRuntimeMerge\.pullRequest,\s*184\s*\);\s*assert\.equal\(capsule\.latestRuntimeMerge\.mergeSha,[^;]+\);\s*assert\.equal\(capsule\.latestRuntimeMerge\.postMergeRunsSuccessful,\s*15\s*\);\s*assert\.equal\(capsule\.latestRuntimeMerge\.pagesRunId,\s*33713396948\s*\);\s*assert\.equal\(capsule\.latestRuntimeMerge\.stabilityRunId,\s*33713396979\s*\);\s*assert\.equal\(capsule\.latestRuntimeMerge\.productionProofRecorded,\s*true\s*\);/;
const corrected='assert.equal(capsule.latestRuntimeMerge.pullRequest,166,"Historical latestRuntimeMerge remains PR #166 rollback provenance."); assert.equal(capsule.latestRuntimeMerge.mergeSha,"32c32afb1365c9ae6120d810a68e5c72c4b8229a"); assert.equal(capsule.latestRuntimeMerge.rollbackRunId,33190961085); assert.equal(capsule.lastProductionProvenRuntime.pullRequest,184); assert.equal(capsule.lastProductionProvenRuntime.mergeSha,"2bfb7656940be23b635cb7092127a0ab0f62c7a4"); assert.equal(capsule.lastProductionProvenRuntime.runtimeRevision,"1.9.0-r4"); assert.equal(capsule.successorPackage.pagesRunId,33713396948); assert.equal(capsule.successorPackage.stabilityRunId,33713396979);';
if(bundled.test(st)) st=st.replace(bundled,corrected);
else {
 st=st.replace(/assert\.equal\(capsule\.latestRuntimeMerge\.pullRequest,\s*184\s*\);/,'assert.equal(capsule.latestRuntimeMerge.pullRequest,166);');
 st=st.replace(/assert\.equal\(capsule\.latestRuntimeMerge\.mergeSha,[^;]+\);/,'assert.equal(capsule.latestRuntimeMerge.mergeSha,"32c32afb1365c9ae6120d810a68e5c72c4b8229a");');
}
if(!/capsule\.latestRuntimeMerge\.pullRequest,\s*166/.test(st)) throw new Error('SLE historical PR166 provenance assertion missing');
if(!st.includes('capsule.lastProductionProvenRuntime.pullRequest')){
 const after=st.match(/assert\.equal\(capsule\.latestRuntimeMerge\.mergeSha,[^;]+\);/)?.[0] || st.match(/assert\.equal\(capsule\.latestRuntimeMerge\.pullRequest,\s*166[^;]*\);/)?.[0];
 if(!after) throw new Error('SLE current production provenance insertion point missing');
 st=st.replace(after,after+'\nassert.equal(capsule.lastProductionProvenRuntime.pullRequest,184);\nassert.equal(capsule.lastProductionProvenRuntime.mergeSha,"2bfb7656940be23b635cb7092127a0ab0f62c7a4");\nassert.equal(capsule.lastProductionProvenRuntime.runtimeRevision,"1.9.0-r4");');
}
write('tests/contracts/sle-handoff-packaging-contracts.cjs',st);

let hit=read('tests/contracts/handoff-immediate-next-task-contracts.cjs');
const oldRe=/assert\.equal\(bootstrap\.latestRuntimeMerge\?\.runtimeRevision,\s*productionRuntime\s*,[^\n]+\);/;
if(oldRe.test(hit)) hit=hit.replace(oldRe,'assert.equal(bootstrap.latestRuntimeMerge?.runtimeRevision,"1.8.1-r5","SESSION_BOOTSTRAP must preserve PR #166 rollback provenance at the historical r5 runtime.");\nassert.equal(bootstrap.lastProductionProvenRuntime?.pullRequest,184,"SESSION_BOOTSTRAP must identify PR #184 as the current production-proven runtime publication.");\nassert.equal(bootstrap.lastProductionProvenRuntime?.runtimeRevision,productionRuntime,"Current production runtime provenance must agree with the deployed shell.");');
else if(!hit.includes('bootstrap.lastProductionProvenRuntime?.pullRequest,184')) throw new Error('historical/current runtime provenance contract anchor not found');
write('tests/contracts/handoff-immediate-next-task-contracts.cjs',hit);
'''
required_replace(validation_anchor, contract_patch + validation_anchor, 'validation insertion')

# The recovered workflow owns cleanup/commit/push so the generator only generates and validates.
tail = "execFileSync('git',['rm'"
pos = s.find(tail)
if pos < 0:
    raise SystemExit('generator cleanup tail not found')
s = s[:pos]
GEN.write_text(s)

run('node', str(GEN))

# Package validation passed. Remove all temporary recovery machinery before the final branch commit.
GEN.unlink(missing_ok=True)
run('git', 'rm', str(WORKFLOW), str(SELF))
run('git', 'config', 'user.name', 'github-actions[bot]')
run('git', 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')
run('git', 'add', '-A')
run('git', 'diff', '--cached', '--check')
run('git', 'commit', '-m', 'Seal v1.4.36 r4 production-proven successor package')
run('git', 'push', 'origin', f'HEAD:{REPO_BRANCH}')
