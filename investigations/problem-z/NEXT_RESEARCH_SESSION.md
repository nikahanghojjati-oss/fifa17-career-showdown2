# Problem Z — Next session checkpoint

**As of:** 2026-10-08  
**Research program:** [40-block roadmap](RESEARCH_PROGRAM.md)  
**Research branch:** `investigation/problem-z-z-studio-2026-10-08`  
**Current ledger:** [RESEARCH_LEDGER.json](RESEARCH_LEDGER.json)  
**Just completed:** [Z-001 physical incident baseline](research-blocks/Z-001_INCIDENT_BASELINE.md) — **research-complete only**; no root cause confirmed.  
**NEXT:** **Z-002 — Live revision and deployment provenance.**  
**Review:** Team G Lead decision pending; research remains unapproved for gameplay implementation.

## Single question for next chat
Which GitHub commits, deployed GitHub Pages runs, expected index/app/service-worker revisions and observable browser-active revisions can actually be established for the reported playtest and the present production build? Which items remain uncertain?

## Next-session procedure
1. Re-read `AGENTS.md`, product guards, POS20 and this research program; get **fresh** live `main`, research branch and GitHub deployment metadata (do not trust stale `POS20_CURRENT_STATE.json` observed SHA).
2. Inspect `index.html` `app-asset-revision`, `service-worker.js` `RUNTIME_REVISION`/`PREVIOUS_RUNTIME_REVISION`, runtime loader and current Pages workflow run/success signal. Distinguish repository version, published build and device cache.
3. Map the GitHub history/workflow that would bracket the owner's October 7 physical run **if reliable timestamps exist**, with explicit inability to see Daniel's actual browser state.
4. Write `research-blocks/Z-002_DEPLOYMENT_PROVENANCE.md`, separating proven vs inferred chronology and framing safe non-secret device diagnostics that would be useful *only if authorized*.
5. Update [evidence register](EVIDENCE_REGISTER.md), [ledger](RESEARCH_LEDGER.json), [this checkpoint](NEXT_RESEARCH_SESSION.md); verify compare against `main` shows research files only.

## Success standard
We have a documented **source / deployment / device** three-way provenance model with cited GitHub authority and explicit unknowns. We have not cleared caches, asked players to repeatedly sign in, re-paired, deleted saves or touched `main`.

## Copy into a future chat
> Continue Problem Z on the existing isolated GitHub research branch. Follow `investigations/problem-z/RESEARCH_PROTOCOL.md`, read the ledger and NEXT_RESEARCH_SESSION.md, then investigate **only Z-002** deeply. Commit its evidence-based report and updated research ledger/checkpoint on the research branch; do not modify main or gameplay code or claim Team G Lead approval. Explain what was verified and what's next.
