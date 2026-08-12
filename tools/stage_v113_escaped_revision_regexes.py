from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path, old, new):
    p = ROOT / path
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected exactly one escaped revision regex {old!r}, found {count}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

replace_once(
    '.github/workflows/validate-menu-bootstrap.yml',
    r'^1\.1\.2-r\d+$',
    r'^1\.1\.3-r\d+$'
)
replace_once(
    '.github/workflows/validate-statistics-workstream.yml',
    r'^1\.1\.2-r\d+$',
    r'^1\.1\.3-r\d+$'
)

print('Corrected the two remaining escaped v1.1.2 revision regexes to v1.1.3.')
