from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
changed=[]
for path in sorted((ROOT/'.github/workflows').glob('*.yml')):
    text=path.read_text(encoding='utf-8')
    new=text.replace(r'1\.0\.2', r'1\.1\.0')
    if new != text:
        path.write_text(new,encoding='utf-8')
        changed.append(str(path.relative_to(ROOT)))
print('V110_ESCAPED_CHANGED=' + ','.join(changed))
