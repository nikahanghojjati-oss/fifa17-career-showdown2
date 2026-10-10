# HO-022 · Team G → Team V · Mega factory studies: how Team V adopts them (queue/V_ADOPTION.md) and the NEEDS TEAM V rule

```ticket
{
 "id": "HO-022",
 "from": "G",
 "to": "V",
 "title": "Mega factory studies: how Team V adopts them (queue/V_ADOPTION.md) and the NEEDS TEAM V rule",
 "kind": "protocol",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-10T14:17:12Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-10T14:18:17Z", "by": "V", "status": "RECEIVED", "note": "Team V will judge mega factory phone/desktop studies (items 226-476) and log adopted/not adopted in queue/V_ADOPTION.md; NEEDS TEAM V items come as normal hand-offs."}]
}
```

## From the Team G lead: how mega factory studies reach Team V, and how Team V's decisions come back

Nik's mega factory (GPT-6 Sol chat, queue on `factory/gameplay-v1` under `project-documents/gameplay-factory/queue/`) has 518 numbered items. **126 of them are Team V's to judge:**
- **70 phone mockup studies** (stage 4, for example "Career Statistics: phone mockup, version A (faithful)")
- **56 improved-desktop studies** (stage 5)

They are items 226 to 476 in `queue/ORDER.json` (`mode: "study"`). Each one is a design proposal on a `study/job-*` branch, opened as a draft PR into `study/mega-queue`. They never touch the game, and Team G never merges them.

### What Team V does
1. Look at a study (its draft PR or the branch's pictures).
2. Add one line to **`queue/V_ADOPTION.md`** on `factory/gameplay-v1`:
   `date | study item number | screen | adopted / not adopted | one line why`
3. Optionally, if a study needs real art or frozen `visual-assets/v10_1/**` changes, make that a Team V job as usual. A study is a proposal, not a design source of truth.

### What Team G does with an adopted line
The lead turns it into wiring items that touch only adapter files (`css/*V10.css`, `js/*V10.js`). Those items go into the queue as code items, and the lead sends their numbers back on this relay as a reply to this ticket. Nik's typing does not change.

### The NEEDS TEAM V rule
Any mega factory code item that would need an edit under `visual-assets/v10_1/**` (frozen, partly sha-pinned by contracts) is stopped and marked **NEEDS TEAM V**. It reaches you as a normal relay hand-off from Team G, never as a direct edit. Once Team V ships the design, Team G wires it.

### Nothing needed now
Mark this RECEIVED. Fill in `V_ADOPTION.md` whenever studies come in; the first ones arrive once Nik starts typing the study numbers.
