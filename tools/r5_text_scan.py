from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TERMS = [
    "1.0.1-r4",
    "james-rodriguez-real-madrid-2016-r4",
    "marcus-rashford-man-utd-2016-r4",
    "anthony-martial-man-utd-2015-r4",
    "James Rodríguez in September 2016 - 01.jpg",
    "Marcus Rashford September 2016 (cropped).jpg",
    "Anthony Martial 2015.jpg",
]
SKIP = {".git", "node_modules"}
OUT = ROOT / "test-results" / "r5-stale-reference-scan.txt"
OUT.parent.mkdir(parents=True, exist_ok=True)

lines = []
for path in sorted(ROOT.rglob("*")):
    if not path.is_file() or any(part in SKIP for part in path.parts):
        continue
    if path.suffix.lower() in {".webp", ".jpg", ".jpeg", ".png", ".zip", ".woff", ".woff2"}:
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        continue
    rel = path.relative_to(ROOT)
    for number, line in enumerate(text.splitlines(), 1):
        for term in TERMS:
            if term in line:
                lines.append(f"{rel}:{number}: [{term}] {line.strip()}")

OUT.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
print(OUT.read_text(encoding="utf-8"), end="")
