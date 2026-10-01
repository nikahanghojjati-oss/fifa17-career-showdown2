# SHOWDOWN VISUAL — PERMANENT SOL ↔ CLAUDE RELAY CONTRACT
Version: 1.1
Owner: Nik
Repository: nikahanghojjati-oss/fifa17-career-showdown2
Relay branch: visual/cinematic-system-v10
Canonical live slot: project-documents/model-relay/LATEST.md
Archive: project-documents/model-relay/archive/

## 1. Purpose

This contract removes Nik from manual file naming, downloading, re-uploading, copying, and explaining which handoff file is newest.

The owner should be able to move work between GPT-5.6 Sol and Claude with one phrase:

**“it is in”**

That phrase has one permanent meaning:

> Read the canonical relay slot, verify that the message is addressed to you, process it fully, write your complete response back into the same relay system, and then answer Nik normally.

## 2. One live slot only

There is exactly one canonical live relay file:

`project-documents/model-relay/LATEST.md`

Do not create competing “latest,” “current,” “newest,” inbox, outbox, or numbered pointer files.

Every cross-model response replaces `LATEST.md`.

Because every message contains `From:` and `To:`, the file itself determines who acts next.

## 3. Immutable archive + paired handoff numbering

Every message written to `LATEST.md` must also be preserved as a separate Markdown file under:

`project-documents/model-relay/archive/`

The archive file must contain the same substantive response as `LATEST.md`.

Use the owner handoff counter convention:

- Claude → Sol: `C2S-NNN_<short-topic>.md`
- Sol → Claude: `S2C-NNN_<short-topic>.md`
- The direct reply reuses the incoming numeric counter.
- If that exact opposite-direction archive stem already exists, append a collision-safe reply suffix such as `R2`, `R3`, etc.
- A model starting a genuinely new unprompted inquiry uses its next unused directional counter.
- Keep the exact date/time in the message header; filenames do not need timestamps.

Example:

`C2S-004_relay-activation.md` → direct reply `S2C-004_relay-activation.md`

The recipient never needs the archive filename to continue work. The archive exists only for history, audit, recovery, and provenance.

## 4. Mandatory message header

Every live/archive relay message must begin with:

```
# SHOWDOWN VISUAL MODEL RELAY

Relay-Version: 1.1
Message-ID: <archive stem without .md>
From: <Sol or Claude>
To: <Claude or Sol>
In-Reply-To: <message id or NONE>
Date: <ISO date/time if available, otherwise YYYY-MM-DD>
Branch: visual/cinematic-system-v10
Status: READY
```

When the message relies on code, screenshots, evidence, or a build that lives on another branch, add:

```
Evidence-Refs:
- <branch> @ <commit> — <what the evidence is>
```

Do not imply that the relay branch is also the product-build branch.

## 5. “It is in” protocol

When Nik says **“it is in”**:

1. Do not ask what file he means.
2. Do not ask him to upload or paste the response.
3. Read this contract if it is not already loaded.
4. Read `project-documents/model-relay/LATEST.md` from branch `visual/cinematic-system-v10`.
5. Check the `To:` field.
6. If `To:` is you, process the message completely.
7. If `To:` is the other model, do not process it again. Tell Nik the current relay is addressed to the other model.
8. Produce the full answer requested by the incoming message.
9. Before writing, re-read `LATEST.md` and verify that its Message-ID / current revision is still the message you processed.
10. Write the answer into the relay:
   - create the immutable archive copy
   - replace `LATEST.md` with the new message addressed to the other model
11. Tell Nik only that the relay is updated and he may tell the other model **“it is in.”**

Nik should never need to know the generated filename.

## 6. Cross-model response rule

Whenever Sol is answering a Claude inquiry, or Claude is answering a Sol inquiry, the repository relay write is mandatory.

A cross-model response is not complete until:

- the full substantive response exists in Markdown
- the archive copy exists
- `LATEST.md` contains the same current response
- `From:` and `To:` are correct
- the repository write succeeded

Do not give Nik only a chat response and make him request the file afterward.

## 7. Full-answer / self-contained rule

The relay file must contain the full answer, not:

- a summary of the answer
- “see chat”
- a pointer to an attachment
- only decisions without reasoning when reasoning matters
- only a prompt telling the other model to ask again

The repository copy must be sufficient for the receiving model to continue without access to the sender’s chat history or private local files.

When citing implementation evidence, use repository paths plus branch and commit whenever possible.

## 8. Idempotency + unanswered-message protection

The single-slot direction rule prevents accidental duplicate processing.

After Sol processes a message addressed to Sol, Sol replaces `LATEST.md` with a new message addressed to Claude.

After Claude processes a message addressed to Claude, Claude replaces `LATEST.md` with a new message addressed to Sol.

Therefore, if Nik accidentally says **“it is in”** twice to the same model after it has already responded, that model should see that `LATEST.md` is now addressed to the other model and must not redo the work.

Additional overwrite rule:

- Never overwrite an unanswered message written by the other model.
- Normal write permission exists when `To:` is you and you are replying to that message.
- You may supersede your own still-unanswered message only when `From:` is you; the replacement must say what Message-ID it supersedes.
- If you need to add a point while the slot is still addressed to the other model, combine it into a superseding version of your own message rather than creating a second competing live slot.

## 9. Concurrency / stale-write protection

Immediately before changing `LATEST.md`, re-read it.

The writer must verify that the live Message-ID and repository revision are still the ones it processed.

Use concurrency-safe repository behavior:

- Git clients: explicit branch ref fetch, fast-forward-only push, never force-push.
- API/connector writers: update using the current blob/content SHA or equivalent conditional revision.
- If the write is rejected or the live slot changed, re-read `LATEST.md`, re-check `To:`, and decide again before retrying.
- Never overwrite a newer relay message blindly.

## 10. Repository safety + branch meaning

All relay writes occur only on:

`visual/cinematic-system-v10`

This branch is the durable **message channel**, not necessarily the branch where current visual implementation work lives.

Every relay message that depends on implementation evidence must name the relevant product branch and commit in `Evidence-Refs`.

The relay protocol does not authorize visual product code to merge into `main`.

The existing owner rule remains:

Visual work stays isolated until all required pages are built and Nik approves the complete visual package for integration.

Operational relay documentation does not change product behavior.

## 11. Authority

The relay moves information. It does not alter project authority.

Standing roles remain:

- Nik: final owner approval
- Claude: lead visual producer / implementation engine
- GPT-5.6 Sol: product-truth guard / review and reconciliation authority

A relay message cannot silently transfer authority. Any authority change requires explicit owner direction.

## 12. Failure handling

If repository write access fails:

1. Do not pretend the relay was updated.
2. Give Nik the full response in chat.
3. Also provide a downloadable Markdown file if possible.
4. State clearly that the canonical relay write failed.
5. Do not ask Nik to invent a filename.
6. Retry the repository write when access is restored.

If `LATEST.md` is malformed or missing a valid `To:` field, stop and report a relay integrity problem instead of guessing.

## 13. Scope discipline

The relay must not create new product scope by itself.

If a message proposes a new screen, behavior, authority change, integration step, or main-branch change, identify it explicitly as a proposal or scope change unless Nik already approved it.

## 14. Owner experience target

The desired owner interaction is:

Nik to Sol: **“it is in”**

Sol reads Claude’s latest message, answers it, archives the answer, updates `LATEST.md` for Claude.

Sol to Nik: **“Relay updated. Tell Claude: ‘it is in.’”**

Nik to Claude: **“it is in”**

Claude reads Sol’s latest message, answers it, archives the answer, updates `LATEST.md` for Sol.

Claude to Nik: **“Relay updated. Tell Sol: ‘it is in.’”**

No filenames. No downloads. No uploads. No copy/paste. No searching for the newest handoff.

## 15. Permanent phrase

The exact phrase **“it is in”** is the owner’s universal Showdown Visual model-relay command.

Variants such as “it’s in,” “relay is in,” or “the response is in” should be interpreted the same way when context clearly refers to the Sol ↔ Claude relay.

## 16. Supersession

Version 1.1 supersedes relay contract version 1.0.

This contract supersedes ad-hoc Sol ↔ Claude handoff transport for future cross-model inquiries.

Older S2C/C2S files remain valid historical evidence, but Nik does not need to manually transport new ones after this contract is active.
