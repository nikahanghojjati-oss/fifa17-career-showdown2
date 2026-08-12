from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_exact(path, old, new, expected=1):
    p = ROOT / path
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f'{path}: expected {expected} occurrences of {old!r}, found {count}')
    p.write_text(text.replace(old, new), encoding='utf-8')

replace_exact('package.json', '"version": "1.1.2"', '"version": "1.1.3"')
replace_exact('package-lock.json', '"version": "1.1.2"', '"version": "1.1.3"', expected=2)
replace_exact('index.html', '1.1.2-r1', '1.1.3-r1', expected=10)
replace_exact('index.html', 'v1.1.2 · Stable', 'v1.1.3 · Stable')
replace_exact('js/app.js', 'const APP_VERSION = "1.1.2";', 'const APP_VERSION = "1.1.3";')
replace_exact('js/app.js', 'css/visual-fidelity-r3.css?v=1.1.2-r1', 'css/visual-fidelity-r3.css?v=1.1.3-r1')
replace_exact('js/optionalModules.js', 'return revision || "1.1.2-r1";', 'return revision || "1.1.3-r1";')
replace_exact('js/footballVisuals.js', 'return meta && meta.content ? meta.content.trim() : "1.1.2-r1";', 'return meta && meta.content ? meta.content.trim() : "1.1.3-r1";')

print('Applied v1.1.3 / 1.1.3-r1 release identity without altering startup timing or gameplay rules.')
