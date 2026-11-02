> **RETIRED 2026-10-03.** Workers no longer upload binaries. See WORKER_HANDBOOK §7: text only; binary files are made by Claude from the recipe in tools/MAKE_ASSETS.md.

# Self-upload: save your own files to the repo (no zip for Nik)

This is the normal way to save work for every factory job since 2026-10-03 (WORKER_HANDBOOK §7). Do not save screenshots or QA renders at all; Claude renders those from your committed code.

Use this instead of "Drop JOB-NNN.zip into the Claude project chat" whenever your chat can write text files to `factory/v1-wtt5ye`. Nik carries nothing.

## 1. Text files: save them directly

HTML, CSS, JS, JSON, MD, SVG and your status file are text. Save each one straight to its repo path on `factory/v1-wtt5ye`, as in Path A of the handbook. No zip, no inbox.

## 2. Binary files (WebP, PNG, JPG, fonts, a zip): use the inbox

Your writer can only save text, so you send binary files as base64 text parts. A GitHub Action on the branch turns them back into the real files, checks every byte, commits them, and leaves a receipt.

**Step A. Pack in Python.** Read `project-documents/factory/tools/inbox_pack.py` from the repo, paste it into your Python sandbox, then call it:

```python
pack(
    delivery="JOB-111-step3",          # JOB-NNN-<short tag>; unique for every delivery
    job="111",
    message="Job 111 step 3/5: phone crop",
    files=[("/mnt/data/out/BG_HOME_PHONE.webp",
            "visual-assets/v10_1/home/assets/BG_HOME_PHONE.webp")],   # (sandbox file, repo path)
    # or a whole job zip whose inside paths are repo-relative:
    # zip_path="/mnt/data/JOB-111.zip",
)
```

It writes `/mnt/data/outbox/<delivery>/`: part files (`<name>.b64.001`, `.002`, ...) and `MANIFEST.json`.

**Step B. Save the parts.** Save every part file, unchanged, to `project-documents/factory/inbox/<delivery>/<same file name>` on `factory/v1-wtt5ye`. Copy the text exactly as printed: do not retype, shorten, re-wrap or "fix" it. One part per save.

**Step C. Save MANIFEST.json last.** The Action only unpacks a delivery that has its manifest, so saving it last means a half-finished upload is never unpacked.

**Step D. Check the receipt.** Do NOT wait or poll for it. Read it once at the start of your next turn (after `continue`); if it is not there yet, note `receipt pending` and carry on, Claude checks receipts too. Read `project-documents/factory/inbox/receipts/<delivery>.md`.
- `Result: OK`: the files are in the repo at their paths, the inbox folder is gone. Carry on.
- `Result: FAILED`: nothing was written. It names the part that broke (for example `part 2 of 4 ... checksum differs`). Save that part again from your sandbox, then save `MANIFEST.json` again (same content) to retry.

## Limits

- Only paths under `visual-assets/` or `project-documents/` are written.
- Each part is about 20,000 characters (about 15 KB of file). Small files (crops, icons, thumbnails, a small zip): up to about 10 parts per delivery is fine.
- **Big pictures are too large for this.** A full-size PNG or WebP plate (hundreds of KB to several MB) would need dozens to hundreds of parts, which you cannot copy reliably. For those, fall back to the old way: offer `JOB-NNN.zip` as a download and tell Nik `Drop JOB-NNN.zip into the Claude project chat. Reason: too big for the inbox: <file names>.` (put only those files in the zip) Make the files you can't upload as small as the job allows first (WebP, the size the job names), and upload everything else yourself.
- Image tickets run in a ChatGPT Temporary Chat, which has no GitHub connector. Those pictures still go to Nik, who drops them in Claude's factory thread.

## Why base64 and not the zip itself

The GitHub writer in a ChatGPT chat sends what you type as text. It cannot attach a file from your sandbox, and your sandbox cannot reach github.com. Base64 is the binary file written in plain letters and digits, so it travels as text; the checksums catch any character that changed on the way.
