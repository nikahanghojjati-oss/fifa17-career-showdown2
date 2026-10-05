# SHOWDOWN LEADS RELAY CONTRACT (Visual lead <-> Gameplay lead)

Version: 1.2 (2026-10-05: §8 hand-off tickets, §9 direct wake; messages unchanged)
Owner: Nik
Repository: nikahanghojjati-oss/fifa17-career-showdown2
Relay branch: leads/relay
Live slot: project-documents/leads-relay/LATEST.md
Archive: project-documents/leads-relay/archive/
Modelled on: visual/cinematic-system-v10 project-documents/model-relay/CONTRACT.md v1.1

## 1. Purpose
The two Claude leads, Team V (visual) and Team G (gameplay), talk through the repo so Nik never carries messages.
A draft tracker PR from leads/relay into leads/relay-base (frozen, never merged) is subscribed
by both leads. A plain push does not wake a subscriber, so the Action .github/workflows/leads-relay-ping.yml
posts one comment on PR #312 for each new FEED.md row; that comment wakes the other lead. If a wake is missed, Nik types "relay" to a lead:
it means "read LATEST.md and act if it is addressed to you".

## 2. One live slot
LATEST.md is the only live message. Every message is also saved unchanged in archive/.
Ids: V2G-NNN_<topic> (Visual -> Gameplay), G2V-NNN_<topic> (Gameplay -> Visual).
A direct reply reuses the incoming number; add R2, R3 on collision. A reply to an R-suffixed message may use the plain number or the same suffix (a reply to V2G-001R2 may be G2V-001 or G2V-001R2); both are valid. A new topic uses the
sender's next unused number.

## 2a. Feed (for Nik)
FEED.md gets one table row per message, in the same commit as the message:
| Time (UTC) | From | To | Message | Subject | Needs reply |
Time = the message's commit time (UTC). Rows stay oldest to newest. Never edit old rows except to correct a time. Team V's Overview board renders this feed so Nik can watch the teams talk.

## 3. Header (every message)
    # SHOWDOWN LEADS RELAY
    Relay-Version: 1.2 (2026-10-05: §8 hand-off tickets, §9 direct wake; messages unchanged)
    Message-ID: <archive stem>
    From: <Team V | Team G>
    To: <Team G | Team V>
    In-Reply-To: <id or NONE>
    Supersedes: <own unanswered id, only if any>
    Date: <ISO time = the commit time of the push that carries the message>
    Branch: leads/relay
    Status: READY
    Evidence-Refs:
    - <branch> @ <commit> - <what>

## 4. On wake
1. Fetch with an explicit refspec: git fetch origin +refs/heads/leads/relay:refs/remotes/origin/leads/relay
2. Read LATEST.md. Act only if To: is you. If To: is the other lead, do nothing.
3. Do the work fully. The message holds the full answer, never "see chat".

## 5. Writing
1. Re-read LATEST.md just before writing; it must still be the message you processed.
2. Never overwrite an unanswered message from the other lead. You may supersede your own
   unanswered message, naming the id you supersede.
3. Write archive/<id>.md, LATEST.md and the FEED.md row in one commit. Fast-forward push only. Never force-push.
4. If rejected, re-fetch, re-read, decide again.

## 6. Authority
The relay moves information; it does not move authority. Nik is the owner. Each lead holds
product truth and history for its area. GPT-5.6 Sol chats are workers. main stays protected;
nothing visual goes into main until Nik approves the full visual package. Firestore Rules
deploys need Nik's typed words.

## 7. Failure
If a push fails, say so plainly to Nik in your own project, give the full message there, and
retry when access returns. Never claim the relay was updated when it was not.

## 8. Hand-off tickets (v1.1): passing and splitting work
Messages carry news and answers. Work that one factory passes to the other travels as a hand-off ticket, so it arrives in
full and Nik can watch it move.
1. One ticket = one file `handoffs/HO-NNN_<slug>.md`: a fenced `ticket` JSON header (id, from, to, title, kind, priority,
   suggested worker, parent, job, status, steps, evidence, log) and a brief with everything the receiver needs
   (what, why, where in the repo with exact refs, done-when, how to prove it). Never "see chat".
2. Write and update tickets only with `tools/handoff.py` (it keeps the header valid). Commit, then fast-forward push.
3. States: SENT (sender) → DELIVERED (automatic: the relay Action posts the whole ticket as a PR #312 comment marked
   `relay:HO-NNN:delivered`) → RECEIVED (receiver acknowledges on wake) → WORKING (receiver links its job PR with `--job`;
   that PR's progress block drives the bar) → DONE (receiver, with evidence). RETURNED = receiver hands it back with a reason.
4. Split: one ticket per part, each with `--parent HO-NNN`; parts can go to either factory. The parent lists its parts.
5. Routing: gameplay and visual wiring bugs belong to Team G; only real design changes (new look, new asset, new screen)
   go to Team V. Team G stays the only team that touches main.
6. Ownership: the sender writes the brief; only the receiver moves RECEIVED, WORKING, DONE and RETURNED. Either side
   may tick steps it did. A delivered ticket not acknowledged within 6 hours shows a warning on both boards.
7. Where Nik sees it: Team G's board (BOARD.md, CUSTOM_VIEW.html) and RELAY.md on factory/gameplay-v1 show every
   message in full and every ticket's pipeline. Each team's own board may show the same tickets; neither edits the
   other's board files.

## 9. Wake in seconds (v1.2)
Measured 2026-10-05: GitHub posted every ticket on PR #312 within 40 seconds, but Team V picked up HO-001..HO-005
about 3 hours later, when Nik typed "Update?", and the Team G lead also missed the RECEIVED comments. Test the same
day: a thread subscribed to PR #312 was woken by the relay Action's comment 2 seconds after it posted. So the
comments work; the relay threads were simply not subscribed.
1. Each team's relay thread keeps a subscription to PR #312 (claude-code-remote `subscribe_pr_activity`, owner
   nikahanghojjati-oss, repo fifa17-career-showdown2, pullNumber 312). Subscribe again whenever the relay moves to a
   new thread. Events wake an idle thread; nothing polls.
2. `INBOX.json` names each team's current relay session (`session_id`). Each team keeps only its own entry current.
3. Second path: after pushing anything for the other team, the sender also calls `send_message` with the other team's
   `session_id` (`handoff.py new/set` and `handoff.py wake --to X --text "..."` print the exact call). The sender is
   already running, so it costs no extra turn.
4. Both boards show each ticket's pickup time (Delivered to Received), so a missed wake is visible at once.
5. A thread that wakes on its own relay echo (for example its own message's comment) ends the turn without work.
