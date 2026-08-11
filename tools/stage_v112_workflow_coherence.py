from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGE = ROOT / "_candidate_b_generated_workflows"
STAGE.mkdir(exist_ok=True)

PATCHES = {
    "validate-menu-bootstrap.yml": [
        ("assets/marco-reus-2015-cc-by.webp?v=1.1.1-r1", "assets/marco-reus-2015-cc-by.webp?v=1.1.2-r1"),
        ("/^1\\.1\\.1-r\\d+$/", "/^1\\.1\\.2-r\\d+$/"),
        ("v1.1.1 cache revision", "v1.1.2 cache revision"),
    ],
    "validate-season-review.yml": [
        ("/^1\\.1\\.1-r\\d+$/", "/^1\\.1\\.2-r\\d+$/"),
        ("v1.1.1 cache revision", "v1.1.2 cache revision"),
    ],
    "validate-statistics-workstream.yml": [
        ("/^1\\.1\\.1-r\\d+$/", "/^1\\.1\\.2-r\\d+$/"),
        ("v1.1.1 deployment asset revision", "v1.1.2 deployment asset revision"),
    ],
    "validate-final-polish.yml": [
        ("'1.1.1-r1'", "'1.1.2-r1'"),
        ("v1.1.0 maintenance patch", "v1.1.2 Candidate B release"),
    ],
    "validate-v1-visual-immersion.yml": [
        ("'1.1.1-r1'", "'1.1.2-r1'"),
        ("v1.1.1 · Stable", "v1.1.2 · Stable"),
        ('const APP_VERSION = \\"1.1.1\\"', 'const APP_VERSION = \\"1.1.2\\"'),
        ("css/visual-fidelity-r3.css?v=1.1.1-r1", "css/visual-fidelity-r3.css?v=1.1.2-r1"),
        ("v1.1.0 maintenance cache identity", "v1.1.2 Candidate B cache identity"),
        ("application version is not sealed at v1.1.0", "application version is not sealed at v1.1.2"),
    ],
}

for name, replacements in PATCHES.items():
    source_path = ROOT / ".github" / "workflows" / name
    source = source_path.read_text(encoding="utf-8")
    for old, new in replacements:
        if old not in source:
            raise SystemExit(f"{name}: required current-release assertion not found: {old}")
        source = source.replace(old, new)
    (STAGE / name).write_text(source, encoding="utf-8")

# Current-release pins must be gone from the patched validators.
for name in PATCHES:
    staged = (STAGE / name).read_text(encoding="utf-8")
    if "1.1.1-r1" in staged or "/^1\\.1\\.1-r\\d+$/" in staged:
        raise SystemExit(f"{name}: stale v1.1.1 runtime pin remains after staging")

print("Staged five v1.1.2 current-release validator coherence blobs.")
