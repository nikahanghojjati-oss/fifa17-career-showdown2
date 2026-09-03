from pathlib import Path
import subprocess
import re

REPO_BRANCH = 'handoff/v1.4.36-r4-production-seal-recovered'
SOURCE_BRANCH = 'handoff-v1.4.36-r4-production-seal'
GEN = Path('scripts/tmp-handoff-v1436-seal.mjs')
WORKFLOW = Path('.github/workflows/tmp-handoff-v1436-recover.yml')
SELF = Path('scripts/recover-v1436-production-seal.py')


def run(*args, capture=False):
    return subprocess.run(args, check=True, text=True, capture_output=capture)

run('git', 'fetch', 'origin', SOURCE_BRANCH)
source = subprocess.check_output(['git', 'show', f'origin/{SOURCE_BRANCH}:scripts/tmp-handoff-v1436-seal.mjs'], text=True)
GEN.write_text(source)
seal_yaml = subprocess.check_output(['git', 'show', f'origin/{SOURCE_BRANCH}:.github/workflows/tmp-handoff-v1436-seal.yml'], text=True)

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

changelog_anchor = "let ch=read('CHANGELOG.md')"
provenance = "for(const p of ['CAREER_MODE_SHOWDOWN_V1.9.0_R4_MAINTENANCE_HANDOFF.md','RELEASE_V1.9.0_R4.md']){let rs=read(p);const proof='Production proof: PR #184 merge '+MAIN+'; Deploy GitHub Pages run '+PAGES_RUN+'; Stability/deployed-site-smoke run '+STABILITY_RUN+'.';if(!rs.includes(proof))rs=rs.trimEnd()+'\\n\\n'+proof+'\\n';write(p,rs);}\n"
required_replace(changelog_anchor, provenance + changelog_anchor, 'release provenance')

# PR #166 remains the historical rollback provenance. PR #184 is the current production-proven runtime.
s, n = re.subn(r"capsule\.latestRuntimeMerge=\{pullRequest:184,[^\n]+\};\n", '', s, count=1)
if n != 1:
    raise SystemExit('latestRuntimeMerge overwrite anchor not found')
# Remove either the original generator or recovered authority-patch attempt to rewrite PR166 history as PR184.
s = s.replace("sleTest=sleTest.replace('assert.equal(capsule.latestRuntimeMerge.pullRequest, 166);','assert.equal(capsule.latestRuntimeMerge.pullRequest, 184);');\n", '')
s = s.replace("sleTest=sleTest.replace('assert.equal(capsule.latestRuntimeMerge.pullRequest,166);','assert.equal(capsule.latestRuntimeMerge.pullRequest,184);');\n", '')

validation_anchor = '// Validate the current handoff package before committing.'
contract_patch = r'''let st=read('tests/contracts/sle-handoff-packaging-contracts.cjs');
st=st.replace('assert.equal(capsule.latestRuntimeMerge.pullRequest, 184);','assert.equal(capsule.latestRuntimeMerge.pullRequest, 166);');
st=st.replace('assert.equal(capsule.latestRuntimeMerge.pullRequest,184);','assert.equal(capsule.latestRuntimeMerge.pullRequest,166);');
const stRollback='assert.equal(capsule.latestRuntimeMerge.rollbackRunId, 33190961085);';
if(!st.includes(stRollback)) throw new Error('SLE historical rollback provenance anchor not found');
if(!st.includes('capsule.lastProductionProvenRuntime.pullRequest')) st=st.replace(stRollback,stRollback+'\\nassert.equal(capsule.lastProductionProvenRuntime.pullRequest, 184, "Current production-proven runtime publication must be PR #184.");\\nassert.equal(capsule.lastProductionProvenRuntime.runtimeRevision, sourceRevision, "Current production-proven runtime must match the deployed r4 source revision.");');
write('tests/contracts/sle-handoff-packaging-contracts.cjs',st);

let hit=read('tests/contracts/handoff-immediate-next-task-contracts.cjs');
const hitOld='assert.equal(bootstrap.latestRuntimeMerge?.runtimeRevision,productionRuntime,"SESSION_BOOTSTRAP runtime provenance must agree with deployed production runtime.");';
const hitNew='assert.equal(bootstrap.latestRuntimeMerge?.runtimeRevision,"1.8.1-r5","SESSION_BOOTSTRAP must preserve PR #166 rollback provenance at the historical r5 runtime.");\\nassert.equal(bootstrap.lastProductionProvenRuntime?.pullRequest,184,"SESSION_BOOTSTRAP must identify PR #184 as the current production-proven runtime publication.");\\nassert.equal(bootstrap.lastProductionProvenRuntime?.runtimeRevision,productionRuntime,"Current production runtime provenance must agree with the deployed shell.");';
if(hit.includes(hitOld)) hit=hit.replace(hitOld,hitNew);
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
