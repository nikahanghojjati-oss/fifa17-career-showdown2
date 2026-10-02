# SHOWDOWN LEADS RELAY CONTRACT (Visual lead <-> Gameplay lead)

Version: 1.0
Owner: Nik
Repository: nikahanghojjati-oss/fifa17-career-showdown2
Relay branch: leads/relay
Live slot: project-documents/leads-relay/LATEST.md
Archive: project-documents/leads-relay/archive/
Modelled on: visual/cinematic-system-v10 project-documents/model-relay/CONTRACT.md v1.1

## 1. Purpose
The two Claude leads (Visual, Gameplay) talk through the repo so Nik never carries messages.
A draft tracker PR from leads/relay into leads/relay-base (frozen, never merged) is subscribed
by both leads; every push wakes the other lead. If a wake is missed, Nik types "relay" to a lead:
it means "read LATEST.md and act if it is addressed to you".

## 2. One live slot
LATEST.md is the only live message. Every message is also saved unchanged in archive/.
Ids: V2G-NNN_<topic> (Visual -> Gameplay), G2V-NNN_<topic> (Gameplay -> Visual).
A direct reply reuses the incoming number; add R2, R3 on collision. A new topic uses the
sender's next unused number.

## 3. Header (every message)
    # SHOWDOWN LEADS RELAY
    Relay-Version: 1.0
    Message-ID: <archive stem>
    From: <Visual lead | Gameplay lead>
    To: <Gameplay lead | Visual lead>
    In-Reply-To: <id or NONE>
    Supersedes: <own unanswered id, only if any>
    Date: <ISO time>
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
3. Write archive/<id>.md and LATEST.md in one commit. Fast-forward push only. Never force-push.
4. If rejected, re-fetch, re-read, decide again.

## 6. Authority
The relay moves information; it does not move authority. Nik is the owner. Each lead holds
product truth and history for its area. GPT-5.6 Sol chats are workers. main stays protected;
nothing visual goes into main until Nik approves the full visual package. Firestore Rules
deploys need Nik's typed words.

## 7. Failure
If a push fails, say so plainly to Nik in your own project, give the full message there, and
retry when access returns. Never claim the relay was updated when it was not.
