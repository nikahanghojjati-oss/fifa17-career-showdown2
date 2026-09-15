from pathlib import Path

path=Path("RELEASE_V1.9.1_R21.md")
text=path.read_text()
anchor="r21 does not by itself earn physical-journey acceptance credit. Production Pages and Rules deployment/readback must pass on the merged exact main head before genuine two-device testing is requested.\n"
replacement="SSJR-1.1 remains exactly `0/100`; no source commit, CI pass, merge, deployment or release-note publication earns physical-journey acceptance credit. MDP remains `95.50/100` until separately governed evidence changes it.\n\nProduction Pages and Rules deployment/readback must pass on the merged exact main head before genuine two-device testing is requested.\n"
if text.count(anchor)!=1:
    raise SystemExit(f"release credit anchor: expected one match, found {text.count(anchor)}")
path.write_text(text.replace(anchor,replacement,1))
