#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TERMS = ("1.0.1-r5", "visual-fidelity-r2", "reus-r2", "v1.0.1 · Stable", "APP_VERSION = \"1.0.1\"")
SKIP_PARTS = {".git", "node_modules", "test-results"}
EXTENSIONS = {".html", ".js", ".cjs", ".mjs", ".css", ".yml", ".yaml", ".md", ".json", ".py"}

matches = []
for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
        continue
    relative = path.relative_to(ROOT)
    if any(part in SKIP_PARTS for part in relative.parts):
        continue
    # Historical handoffs/releases may intentionally mention old revisions.
    if relative.suffix.lower() == ".md":
        continue
    text = path.read_text(encoding="utf-8", errors="replace")
    for line_number, line in enumerate(text.splitlines(), 1):
        for term in TERMS:
            if term in line:
                matches.append((str(relative), line_number, term, line.strip()))

print(f"ACTIVE_STALE_REFERENCE_COUNT={len(matches)}")
for relative, line_number, term, line in matches:
    print(f"{relative}:{line_number}: [{term}] {line}")
