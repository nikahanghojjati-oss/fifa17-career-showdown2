# Historical QA Findings Ledger

Date compiled: 2026-10-04 ET  
Purpose: consolidate earlier Career Mode Showdown QA/reliability findings so a reviewer can understand recurring defect classes without depending on old chats.

## Evidence labels

- `LIVE_VERIFIED_2026-10-04`: re-checked against live GitHub during the current review.
- `PROJECT_SOURCE`: supported by a retained project/library source.
- `PRIOR_QA_RECORD`: preserved from an earlier QA session/conversation record but the original temporary branch/file was not independently retrievable during this compilation.
- `HISTORICAL_CLOSED`: previously fixed/proven at its historical exact head; not a claim about today's runtime unless re-verified.
- `UNKNOWN`: material detail could not be safely recovered.

This file is a history/lessons ledger. Current live authority still wins.

---

## H01 · Exact-head evidence must not be combined across moving heads

Classification: PROCESS_DEFECT prevention  
Status: recurring project rule  
Evidence: PROJECT_SOURCE

Across r9-r19 and POS20 handoffs, the project repeatedly established that CI, review, deployment and production evidence belong to the exact SHA on which they were observed.

Key lesson:
- a green run on an earlier candidate does not prove a later publication head;
- a clean merge is not semantic compatibility evidence;
- recorded SHAs in handoffs are orientation only until re-resolved.

Post-5.2 implication:
- every worker/factory job should carry `baseCommit` and `authoritySnapshotSha`;
- every candidate/release claim should bind checks to one exact head.

---

## H02 · Candidate C remains the sole destructive recovery/apply authority

Classification: reliability invariant  
Status: permanent product constraint  
Evidence: PROJECT_SOURCE

Historical recovery work separated:
- non-mutating export;
- read-only analysis;
- transactional destructive Apply with backup/rollback ownership.

Earlier QA closed defects around strict snapshot fallback and stale restore fixtures before v1.3 production proof.

Key lesson:
Do not let remote sync, factory integration, visual work or a future "simplification" create a second destructive local apply path.

---

## H03 · Service-worker/update acknowledgement ordering was a real defect class

Classification: PRODUCT_DEFECT, historical  
Status: HISTORICAL_CLOSED  
Evidence: PRIOR_QA_RECORD / historical project evidence

Earlier resilience QA found premature update activation acknowledgement. The corrected sequence required shell verification, awaited `skipWaiting()`, then acknowledgement.

Key lesson:
Presentation or status copy must not report a transition complete before the underlying authority transition actually completes.

This lesson generalizes to shared-game "waiting", commit and reconnect states.

---

## H04 · Save Library and focus/navigation regressions can escape data tests

Classification: PRODUCT_DEFECT, historical  
Status: HISTORICAL_CLOSED  
Evidence: PRIOR_QA_RECORD

After Save Library UI work, switching a Save and rerendering Settings moved focus outside the dialog and broke Escape-close behavior. The correction restored dialog focus.

Key lesson:
State/data correctness does not prove interaction correctness. Browser-level focus, keyboard and navigation behavior remain necessary.

---

## H05 · Same visible manager names must never become longitudinal identity authority

Classification: PRODUCT_DEFECT / architecture risk  
Status: historical finding that drove identity-safe analytics work  
Evidence: PROJECT_SOURCE and PRIOR_QA_RECORD

Earlier Analytics keyed manager aggregation through normalized visible names. Two distinct stable Local Profiles with the same label could collapse into one career identity.

The project later defined identity-safe semantics:
- stable profile identity owns identified longitudinal manager rows;
- same-name distinct profiles remain distinct;
- explicit profile reuse across Saves may aggregate;
- unresolved historical identity stays unresolved;
- visible names are presentation only and never infer identity;
- identity-independent totals remain complete.

Key lesson:
Human-readable labels must not silently become authorization or identity keys.

---

## H06 · Physical production proof cannot be replaced by automation

Classification: evidence gap, not necessarily a product defect  
Status: recurring requirement  
Evidence: PROJECT_SOURCE

At r44 the project had extensive automated/deployed-browser evidence for pairing, setup, Transfer, Results, Commit, scoring, history, multi-season, reconnect, reconciliation and terminal close.

The major unresolved proof was still a genuine production journey with:
- Daniel's real authenticated account;
- Nik's real authenticated account;
- two physical devices;
- two independent networks;
- one production rivalry;
- offline/reload recovery;
- Local Reconciliation;
- Final Reconciliation;
- Terminal Close;
- reload after CLOSED.

Key lesson:
Factory completion, CI, emulator and browser automation must never be promoted into "production proven" without the required physical evidence.

---

## H07 · Authority/tracker drift was already a first-class risk by r44

Classification: PROCESS_DEFECT  
Status: historical, recurring and still relevant  
Evidence: PROJECT_SOURCE

The r44 coaching dossier reported:
- `POS20_CURRENT_STATE.json` still carried older heads/objective;
- `MILESTONE_DELIVERY_PROGRESS.json` still described r18-era runtime and implementation state while r44 contained later physical-journey tooling;
- `NEXT_TASK.md` still described r18-era work that already existed;
- readiness score, engineering delivery and stale metadata were being conflated.

The dossier explicitly preferred:
- one tiny current-state file;
- one current task file;
- one current product architecture file;
- historical handoffs moved to archive/history;
- an automated stale-pointer check.

This is the direct ancestor of the current "one truth, many workers" recommendation.

---

## H08 · POS20/POS10 authority ambiguity has repeatedly reappeared

Classification: PROCESS_DEFECT  
Status: recurring  
Evidence: PROJECT_SOURCE + LIVE_VERIFIED_2026-10-04

Historical POS20 transition material described POS20 as the active planning/operating layer over the frozen POS10 safety kernel, while older POS10 files remained prominent.

Current live review found a fresh version of the same problem:
- root `AGENTS.md` says POS20 is active;
- `CURRENT_PRODUCT_GUARDS.json` still says `"operatingSystem": "POS10"`.

This may be provenance rather than intent, but the field is ambiguous to a new agent.

Recommendation:
make "active authority" and "guard provenance/kernel origin" separate machine-readable concepts.

---

## H09 · MDP / readiness/accounting files can be numerically correct yet operationally misleading

Classification: PROCESS_DEFECT  
Status: recurring historical finding  
Evidence: PROJECT_SOURCE + PRIOR_QA_RECORD

Several historical states legitimately carried different concepts at once:
- engineering work delivered;
- milestone accounting score;
- physical evidence score;
- current runtime/head pointers.

A prior QA/model-comparison review also flagged an assessor/narrative mismatch where one path reported MDP 95.50 while inherited narrative still said 39.00.

The exact old assessor implementation was not re-verified in this compilation, so that numeric mismatch is retained as PRIOR_QA_RECORD rather than LIVE_VERIFIED.

Key lesson:
Never use one unlabeled "progress score" to stand in for:
- implementation completeness;
- release acceptance;
- production evidence;
- physical proof;
- current-head validity.

---

## H10 · Navigation/repeated-click reliability remained inconsistent after targeted fixes

Classification: PRODUCT_DEFECT + TEST_DEFECT  
Status: PRIOR_QA_RECORD from 2026-09-25  
Evidence: PRIOR_QA_RECORD

Earlier QA reviewed repeated-click handling after PR #280 had added tap coalescing/busy behavior around some Shared Setup Continue/club actions.

The review found the pattern was still inconsistent across navigation surfaces.

Most serious risk:
a delayed older navigation/load could complete after a newer user choice and overwrite the newer route.

Bounded recommendation from that review:
- shared in-flight navigation state;
- coalesce duplicate requests;
- visible/busy UI while unresolved;
- stale-route supersession;
- delayed-load regression tests.

The associated temporary QA branch/report could not be re-resolved on GitHub on 2026-10-04, so a reconstructed copy is included separately in this packet.

---

## H11 · Integration layer became the weak point as online capability grew

Classification: architecture/reliability risk  
Status: recurring  
Evidence: PROJECT_SOURCE

A September browser-reliability dossier identified recurring failure classes:

A. capability exists but route never loads it  
B. capability installed at startup but not refreshed when eligible  
C. visible action owns stale state  
D. first click only refreshes authority and player must click again  
E. polling changes provider state but panel does not rerender  
F. hidden legacy screen still owns navigation  
G. copy says a feature is separate although later capability is canonical  
H. button label reflects engineering state instead of the next player action  
I. mobile Safari background/resume loses presentation  
J. reload returns to stale local presentation  
K. error text outlives its cause  
L. wait-state has no clear next action  
M. tests inject dependencies production never loads  
N. DOM tests call APIs directly instead of reproducing real clicks

These classes remain useful as a QA checklist for new screens and integration work.

---

## H12 · Single-click and duplicate-click rules are product-quality requirements

Classification: UX/reliability standard  
Status: active lesson  
Evidence: PROJECT_SOURCE

Earlier physical/browser QA established:
- one deliberate click per intended logical player action;
- mutation buttons disabled while unresolved;
- one operation identity;
- uncertain outcomes reconciled before offering a fresh mutation;
- waiting/confirmed/unknown shown distinctly.

If a normal action requires click -> wait -> click again -> refresh -> Home -> reopen for the same logical transition, treat that as a defect unless the second action represents genuinely distinct authority.

This directly predicts the later race and fewer-taps work in Team G.

---

## H13 · Wait states must explain actor, state and recovery

Classification: UX/reliability standard  
Status: active lesson  
Evidence: PROJECT_SOURCE

A valid wait state should answer:
- what am I waiting for?
- who must act?
- is my own action confirmed?
- will this update automatically?
- what should I do if it does not?

Technical implementation copy should not leak into player-facing flow when a canonical next action exists.

---

## H14 · Sign-in order and mobile Safari are first-class acceptance concerns

Classification: UX/reliability standard  
Status: active lesson  
Evidence: PROJECT_SOURCE

Historical physical testing found misleading failures when instructions attempted Start Showdown before explicit sign-in.

Canonical entry order became:
1. open app;
2. sign in;
3. establish manager identity;
4. start/join Showdown;
5. pair;
6. gameplay.

Mobile Safari must tolerate:
- backgrounding;
- visibility changes;
- cellular interruption;
- resume;
- same-tab reload;
while preserving unpublished local draft where valid and avoiding replayed writes.

---

## H15 · External Grok review warned about documentation/process complexity before factories

Classification: PROCESS_DEFECT risk  
Status: historical advisory, later corroborated  
Evidence: PROJECT_SOURCE

The saved August 21 Grok expert review praised:
- exactly two private managers;
- local-first completeness before networking;
- deterministic synchronization;
- recovery separation;
- stable identity layers;
- Spark-only cost boundary;
- evidence discipline.

Its main structural warning was that multiple authority files, handoffs, overrides and provenance layers were becoming a first-class risk.

It recommended simplifying authority and requiring successor sessions to re-verify live state instead of inheriting long narrative handoffs.

The current factory control-plane drift strongly corroborates that warning.

---

## H16 · Visual work must not silently become product authority

Classification: process / architecture boundary  
Status: active lesson  
Evidence: PROJECT_SOURCE

Showdown Visual was intentionally isolated:
- presentation only;
- no backend/Firebase authority changes;
- no invented product behavior;
- DOM/JS owns dynamic truth;
- production main read-only until senior reconciliation.

The later Team V factory correctly preserved this separation through a dedicated factory branch and handoff.

Post-5.2:
keep presentation and gameplay factories specialized, linked by a versioned contract rather than shared implicit authority.

---

## H17 · Visual worker routing has measurable specialization

Classification: PROCESS_DEFECT / optimization finding  
Status: LIVE_VERIFIED_2026-10-04 from Team V scorecard

Team V final scorecard:

| Worker | Jobs | First-time pass | Fix rounds | First scored avg |
| --- | ---: | ---: | ---: | ---: |
| GPT-5.6 Sol normal chat | 121 | 83% | 27 on 20 jobs | 4.01 |
| Claude Sonnet 5.5 | 52 | 96% | 2 | 4.22 |
| Claude Opus 5.5 | 34 | 100% | 0 | 4.32 |
| Astra Work | 9 | 100% | 0 | 4.3, small sample |
| GPT-6.1 Sol Work | 6 | 100% | 0 | 4.3, small sample |

By job class:
- GPT-5.6: 46/46 first-time on truth/review/motion/data style work;
- GPT-5.6: 1/7 first-time on initial screen builds;
- GPT-5.6: 12/21 first-time on phone layouts;
- Opus: 18/18 first-time on phone layouts.

Recommendation:
route by job class, not by a universal model ranking.

---

## H18 · Fable rescue pattern validated the two-failure reroute rule

Classification: process optimization  
Status: LIVE_VERIFIED_2026-10-04

Jobs 58, 83 and 114 each failed two GPT repair rounds. Fable 5.1 fixed all three in one pass, roughly 13 minutes total.

CC-007 also re-cut about 100 jobs for $7.89 in 16 minutes.

Lesson:
after two failures on the same acceptance item under materially unchanged evidence, reframe or change worker. Do not spend a third identical loop.

Caution:
PR #341 was accidentally opened toward main from a cloud/factory branch and remained titled DO NOT MERGE. High-speed cloud work needs automatic target-branch validation.

---

## H19 · Work mode is useful when the environment is the reason for using it

Classification: process optimization  
Status: LIVE_VERIFIED_2026-10-04 from scorecard

Work-mode jobs passed, but Team V recorded:
- high metered usage;
- repeated Continue interactions on long bundles;
- save collisions such as HTTP 422/409.

Recommendation:
use Work mode for terminal/npm/emulator/environment-dependent jobs, not simply because a task is "hard".

---

## H20 · Team G race/UX bug hunt found real player-facing friction

Classification: PRODUCT_DEFECT group  
Status: mostly fixed/merged by 2026-10-04; production status must be checked per release  
Evidence: LIVE repo factory reports

Sonnet r52 read-only bug hunt identified:
1. simultaneous two-writer actions could show permission-denied to the loser;
2. tie-rule code/docs disagreement;
3. no cross-check for impossible paired season results;
4. irreversible Transfer lock actions lacked confirmation;
5. long 5/10-season games could outlive the private session TTL;
plus raw setup error codes.

Follow-up work included:
- PR #344 lost simultaneous tap retry;
- PR #343 tie-doc decision;
- PR #346 result-clash warning;
- PR #345 lock confirmation;
- PR #350 long-game reconnect path.

Factory/recovery merge is not automatically production proof.

---

## H21 · Current Team G control plane is stale relative to live execution

Classification: PROCESS_DEFECT  
Severity: High  
Status: LIVE_VERIFIED_2026-10-04

Observed contradictions:
- JOB-29 status: IN PROGRESS 3/4; PR #357 merged.
- board: JOB-31 NOT WRITTEN; PR #350 merged and bug section calls it DONE.
- board: JOB-33 NOT WRITTEN; PR #358 merged and relay says merged.
- JOB-27 status: READY / PR none; PR #362 exists and running board shows 6/7.

Interpretation:
the execution plane can move ahead of the factory status ledger.

Recommendation:
derive/reconcile board state from status + PR + merge + branch head + exact-head CI. When contradictory, show `CONTROL_PLANE_STALE` rather than a normal status.

---

## H22 · Lead-executed/direct jobs can become orphan execution

Classification: PROCESS_DEFECT  
Severity: High  
Status: LIVE_VERIFIED_2026-10-04

Jobs can be completed or advanced by a lead/direct PR without the job/status record moving with them.

Recommendation:
a factory PR should carry a machine-readable job id and the control-plane record should update automatically from GitHub events.

---

## H23 · Claude lead quality is high but lead usage is a throughput dependency

Classification: PROCESS_DEFECT / capacity risk  
Severity: Medium  
Status: LIVE_VERIFIED_2026-10-04

Team G board showed the Gaffer/lead pool paused at 91% of the active usage window.

Recommendation:
split:
- authority/judgment: lead;
- mechanical intake/reconciliation: delegated worker using frozen checklist.

The delegate reports; it does not redefine product truth.

---

## H24 · "Done" currently represents too many distinct states

Classification: PROCESS_DEFECT  
Severity: Medium-High  
Status: current systems recommendation

A worker may mean:
- task files written;
- lead accepted;
- PR merged;
- candidate green;
- physical device test passed;
- deployed production verified.

Recommendation:
use explicit lifecycle vocabulary:
`WORKER_DONE`
`LEAD_ACCEPTED`
`INTEGRATED`
`CANDIDATE_GREEN`
`DEVICE_PROVEN`
`PRODUCTION_PROVEN`
`CLOSED`

---

## H25 · Current recommended operating model: one truth, many workers

Classification: system design recommendation  
Status: proposal, not authority

Keep:
- Team V specialized for presentation;
- Team G specialized for gameplay/data;
- one serial integration lane;
- QA independent and non-mutating;
- specialized model routing;
- blind review for high-risk diagnosis.

Add:
- one small canonical machine-readable current authority snapshot;
- one exact integration candidate manifest;
- factory jobs pinned to authority snapshot/contract/base SHA;
- boards as derived views rather than product authority;
- explicit cross-factory contract version/hash;
- automatic stale-control-plane detection;
- temporary milestone factories that are archived after integration.

Do not:
- merge the two factories into one giant board;
- make Claude/GPT/Fable/Astra a source of truth;
- run blind parallel implementations of the same product surface;
- equate factory completion with production proof.

---

## H26 · Blind review is useful; blind implementation is usually not

Classification: QA process recommendation  
Status: proposal

Use independent blind reviewers for:
- race-condition diagnosis;
- Firestore Rules/authz;
- reconciliation/history convergence;
- scoring/tiebreak logic;
- release blockers;
- pre-main review;
- sampled visual owner gates.

Protocol:
1. freeze exact SHA and acceptance rules;
2. give reviewers identical evidence;
3. keep hypotheses hidden from each other;
4. require facts, hypothesis, confidence, smallest fix, regression check;
5. lead/Sol adjudicates against source;
6. one implementation worker mutates.

Competition belongs in analysis/review, not concurrent edits to the same surface.

---

## H27 · Post-5.2 factories should be temporary milestone systems

Classification: lifecycle recommendation  
Status: proposal

After release:
1. prove exact deployed release and physical path;
2. reconcile boards/status/PRs;
3. resolve authority metadata ambiguity;
4. freeze/archive completed Team V and Team G milestone state;
5. preserve scorecards/evidence;
6. start a new small factory only for the next milestone from a frozen authority snapshot.

Avoid one immortal factory accumulating hundreds of permanently operational historical status files.

---

## Highest-value recurring lesson

The project has repeatedly solved hard product defects and then rediscovered a similar process defect:

the implementation moves forward faster than the written map of the implementation.

The long-term fix is not less evidence. It is a smaller, machine-reconciled current-authority surface with history clearly demoted to audit evidence.
