from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, text):
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


optional = read("js/optionalModules.js")
optional = replace_once(
    optional,
    '        }else if(name === "legacy"){\n            showScreen("legacy");\n        }else if(name === "ruleBook"){',
    '        }else if(name === "legacy"){\n            return showScreen("legacy");\n        }else if(name === "ruleBook"){',
    "propagate Legacy route result"
)
write("js/optionalModules.js", optional)

browser = read("tests/browser/backup-export-audit.cjs")
if "schemaVersion: 2," not in browser:
    browser = replace_once(
        browser,
        '            id: 1700000000000,\n            name: "Browser Backup",',
        '            id: 1700000000000,\n            schemaVersion: 2,\n            name: "Browser Backup",',
        "browser fixture schema version"
    )
write("tests/browser/backup-export-audit.cjs", browser)

print("Candidate A Legacy route contract repair generated")
