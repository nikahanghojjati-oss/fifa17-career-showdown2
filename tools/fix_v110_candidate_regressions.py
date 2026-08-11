from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[1]

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def write(path,text): (ROOT/path).write_text(text,encoding='utf-8')

# Restore exact accepted Home implementation from main; only advance one cache query.
main_menu=subprocess.check_output(['git','show','origin/main:js/menuExperience.js'],cwd=ROOT).decode('utf-8')
count=main_menu.count('assets/marco-reus-2015-cc-by.webp?v=1.0.2-r1')
if count != 1: raise RuntimeError(f'Expected one main Reus cache ref, found {count}')
main_menu=main_menu.replace('assets/marco-reus-2015-cc-by.webp?v=1.0.2-r1','assets/marco-reus-2015-cc-by.webp?v=1.1.0-r1',1)
write('js/menuExperience.js',main_menu)

football=read('js/footballVisuals.js')
old_revision='return meta && meta.content ? meta.content.trim() : "1.0.2-r1";'
new_revision='return meta && meta.content ? meta.content.trim() : "1.1.0-r1";'
if football.count(old_revision)!=1: raise RuntimeError('Football visual revision fallback not found exactly once')
football=football.replace(old_revision,new_revision,1)
write('js/footballVisuals.js',football)

static=read('.github/workflows/validate-static-app.yml')
old="assert.ok(changelog.includes('# v1.1.0 — Clean-Anchor Visual Maintenance'), 'CHANGELOG stability release entry is missing.');"
new="assert.ok(changelog.includes('# v1.1.0 — Data Safety and Recovery / Candidate A'), 'CHANGELOG v1.1.0 Candidate A release entry is missing.');"
if static.count(old)!=1: raise RuntimeError('Static changelog assertion not found exactly once')
static=static.replace(old,new,1)
static=static.replace("'Permanent v1.0.1 release record is incomplete.'","'Permanent v1.1.0 release record is incomplete.'",1)
write('.github/workflows/validate-static-app.yml',static)

stability=read('.github/workflows/validate-stability-lane.yml')
stability=stability.replace('uses: actions/upload-artifact@v4','uses: actions/upload-artifact@v7')
write('.github/workflows/validate-stability-lane.yml',stability)

# Guard against any active runtime cache identity split left by the candidate.
stale=[]
for path in (ROOT/'js').glob('*.js'):
    if '1.0.2-r1' in path.read_text(encoding='utf-8'):
        stale.append(str(path.relative_to(ROOT)))
if stale:
    raise RuntimeError('Stale v1.0.2 runtime cache refs remain: '+', '.join(stale))

print('Candidate A regression repairs generated')
