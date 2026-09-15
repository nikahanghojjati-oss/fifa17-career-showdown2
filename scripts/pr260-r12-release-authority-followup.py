from pathlib import Path

OLD = "1.9.1-r20"
NEW = "1.9.1-r21"


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)

# The lazy whole-shell assets must carry the same install identity as index/manifest/SW.
app_path = Path("js/app.js")
app = app_path.read_text()
app = replace_once(app, f'VISUAL_FIDELITY_STYLESHEET="css/visual-fidelity-r3.css?v={OLD}"', f'VISUAL_FIDELITY_STYLESHEET="css/visual-fidelity-r3.css?v={NEW}"', "visual fidelity shell revision")
app_path.write_text(app)

menu_path = Path("js/menuExperience.js")
menu = menu_path.read_text()
menu = replace_once(menu, f'thumbnail: "assets/marco-reus-2015-cc-by.webp?v={OLD}"', f'thumbnail: "assets/marco-reus-2015-cc-by.webp?v={NEW}"', "lazy menu image shell revision")
menu_path.write_text(menu)

# r20 physical-journey proof remains historical; only its current-shell assertions become dynamic.
physical_path = Path("tests/contracts/ssjr-physical-journey-publication-contracts.cjs")
physical = physical_path.read_text()
old_block = '''assert.match(index,/meta name="app-asset-revision" content="1\\.9\\.1-r20"/);\nassert.equal(index.includes("?v=1.9.1-r19"),false,"r20 HTML shell must not retain r19 asset queries");\nassert.match(app,/VISUAL_FIDELITY_STYLESHEET="css\\/visual-fidelity-r3\\.css\\?v=1\\.9\\.1-r20"/);\nassert.match(menu,/marco-reus-2015-cc-by\\.webp\\?v=1\\.9\\.1-r20/,\n  "lazy menu image must share the current r20 whole-shell identity");\nassert.equal(manifest.includes("?v=1.9.1-r19"),false,"r20 manifest must not retain r19 icon queries");\nassert.match(manifest,/showdown-192\\.svg\\?v=1\\.9\\.1-r20/);\nassert.match(worker,/const RUNTIME_REVISION = "1\\.9\\.1-r20";/);\nassert.match(worker,/const PREVIOUS_RUNTIME_REVISION = "1\\.9\\.1-r19";/);\n'''
new_block = '''const currentRevision=(index.match(/meta name="app-asset-revision" content="([^"]+)"/)||[])[1];\nassert.match(currentRevision||"",/^1\\.9\\.1-r[1-9]\\d*$/);\nassert.match(app,new RegExp(`VISUAL_FIDELITY_STYLESHEET="css\\\\/visual-fidelity-r3\\\\.css\\\\?v=${currentRevision.replace(/\\./g,"\\\\.")}"`));\nassert.match(menu,new RegExp(`marco-reus-2015-cc-by\\\\.webp\\\\?v=${currentRevision.replace(/\\./g,"\\\\.")}`),\n  "lazy menu image must share the current whole-shell identity while r20 physical evidence remains historical");\nassert.match(manifest,new RegExp(`showdown-192\\\\.svg\\\\?v=${currentRevision.replace(/\\./g,"\\\\.")}`));\nassert.match(worker,new RegExp(`const RUNTIME_REVISION = "${currentRevision.replace(/\\./g,"\\\\.")}";`));\n'''
if physical.count(old_block) != 1:
    raise SystemExit(f"physical publication shell block: expected one match, found {physical.count(old_block)}")
physical_path.write_text(physical.replace(old_block, new_block, 1))
