from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"{path}: required cleanup source not found")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "css/legacy.css",
    '''.legacyImportNativeInput{
    width:100%;
    min-height:44px;
    margin-top:8px;
    padding:7px 8px;
    color:#26343e;
    background:#fff;
    border:1px solid #aab8c0;
    font-size:12px;
}''',
    '''.legacyImportNativeInput{
    position:absolute;
    width:1px;
    height:1px;
    padding:0;
    margin:-1px;
    overflow:hidden;
    clip:rect(0 0 0 0);
    clip-path:inset(50%);
    white-space:nowrap;
    border:0;
}'''
)

replace_once(
    "tests/browser/import-analysis-audit.cjs",
    '        for(const selector of [".legacyImportDropZone", "#careerModeImportFile", ".legacyImportActions .primaryDataButton"]){',
    '        for(const selector of [".legacyImportDropZone", ".legacyImportActions .primaryDataButton", ".legacyImportActions .compactButton:last-child"]){'
)

print("Candidate B visible file-control cleanup applied.")
