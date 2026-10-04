# Factory inbox packer. Run this in your ChatGPT Python sandbox.
# It turns files (or one JOB-NNN.zip) into base64 text parts plus MANIFEST.json
# in /mnt/data/outbox/<DELIVERY>/. Save every file in that folder, unchanged,
# to project-documents/factory/inbox/<DELIVERY>/ on factory/v1-wtt5ye,
# parts first and MANIFEST.json LAST. Full guide: project-documents/factory/SELF_UPLOAD.md
import base64, hashlib, json, os

PART_CHARS = 20000  # base64 characters per part (about 15 KB of file)


def pack(delivery, job, message, files=(), zip_path=None, out_root="/mnt/data/outbox"):
    """files: list of (local_path, repo_path). zip_path: a zip with repo-relative paths inside."""
    out = os.path.join(out_root, delivery)
    os.makedirs(out, exist_ok=True)
    items = [(p, t, False) for p, t in files] + ([(zip_path, None, True)] if zip_path else [])
    entries = []
    for local, target, is_zip in items:
        blob = open(local, "rb").read()
        text = base64.b64encode(blob).decode()
        base = os.path.basename(local)
        parts, psha = [], []
        for k in range(0, max(len(text), 1), PART_CHARS):
            chunk = text[k:k + PART_CHARS]
            name = f"{base}.b64.{len(parts) + 1:03d}"
            # 76-character lines are easier to copy exactly than one long line.
            open(os.path.join(out, name), "w").write("\n".join(chunk[i:i + 76] for i in range(0, len(chunk), 76)) + "\n")
            parts.append(name)
            psha.append(hashlib.sha256(base64.b64decode(chunk)).hexdigest())
        e = {"bytes": len(blob), "sha256": hashlib.sha256(blob).hexdigest(), "parts": parts, "part_sha256": psha}
        e.update({"unzip": True} if is_zip else {"to": target})
        entries.append(e)
    m = {"job": str(job), "message": message, "files": entries}
    open(os.path.join(out, "MANIFEST.json"), "w").write(json.dumps(m, indent=2) + "\n")
    total = sum(len(e["parts"]) for e in entries)
    print(f"{out}: {total} part file(s) + MANIFEST.json")
    for f in sorted(os.listdir(out)):
        print(" ", f, os.path.getsize(os.path.join(out, f)), "chars")
    return out
