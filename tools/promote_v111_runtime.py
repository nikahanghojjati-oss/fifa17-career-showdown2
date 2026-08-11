from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace(path: str, old: str, new: str, expected: int | None = None) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if expected is not None and count != expected:
        raise RuntimeError(f"{path}: expected {expected} occurrences of {old!r}, found {count}")
    if count == 0:
        raise RuntimeError(f"{path}: missing expected text {old!r}")
    target.write_text(text.replace(old, new), encoding="utf-8")
    print(f"updated {path}: {count} replacement(s)")


replace("index.html", "1.1.0-r1", "1.1.1-r1", expected=10)
replace("index.html", "v1.1.0 · Stable", "v1.1.1 · Stable", expected=1)
replace("js/app.js", 'const APP_VERSION = "1.1.0";', 'const APP_VERSION = "1.1.1";', expected=1)
replace("js/app.js", "css/visual-fidelity-r3.css?v=1.1.0-r1", "css/visual-fidelity-r3.css?v=1.1.1-r1", expected=1)
replace("js/menuExperience.js", "assets/marco-reus-2015-cc-by.webp?v=1.1.0-r1", "assets/marco-reus-2015-cc-by.webp?v=1.1.1-r1", expected=1)
replace("js/footballVisuals.js", '"1.1.0-r1"', '"1.1.1-r1"', expected=1)
replace("js/optionalModules.js", '"1.1.0-r1"', '"1.1.1-r1"', expected=1)
replace("js/backup.js", 'return typeof APP_VERSION === "string" ? APP_VERSION : "1.1.0";', 'return typeof APP_VERSION === "string" ? APP_VERSION : "1.1.1";', expected=1)
replace("js/settings.js", 'Career Mode Showdown v1.1.0', 'Career Mode Showdown v1.1.1', expected=1)
replace("js/settings.js", 'return typeof APP_VERSION === "string" ? APP_VERSION : "1.1.0";', 'return typeof APP_VERSION === "string" ? APP_VERSION : "1.1.1";', expected=1)
replace("tests/contracts/backup-contracts.cjs", 'content: "1.1.0-r1"', 'content: "1.1.1-r1"', expected=1)
replace("tests/contracts/backup-contracts.cjs", 'assert.equal(full.appVersion, "1.1.0");', 'assert.equal(full.appVersion, "1.1.1");', expected=1)
replace("tests/contracts/backup-contracts.cjs", 'assert.equal(full.runtimeRevision, "1.1.0-r1");', 'assert.equal(full.runtimeRevision, "1.1.1-r1");', expected=1)
replace("tests/support/run-release-burnin-pass.sh", "v1.1.0 release burn-in", "v1.1.1 release burn-in", expected=3)

package_path = ROOT / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
if package.get("version") != "1.1.0":
    raise RuntimeError(f"package.json: unexpected version {package.get('version')}")
package["version"] = "1.1.1"
package_path.write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")

lock_path = ROOT / "package-lock.json"
lock = json.loads(lock_path.read_text(encoding="utf-8"))
if lock.get("version") != "1.1.0" or lock.get("packages", {}).get("", {}).get("version") != "1.1.0":
    raise RuntimeError("package-lock root version authority is not v1.1.0")
lock["version"] = "1.1.1"
lock["packages"][""]["version"] = "1.1.1"
lock_path.write_text(json.dumps(lock, indent=2) + "\n", encoding="utf-8")
print("updated package.json/package-lock.json root release identity only")
