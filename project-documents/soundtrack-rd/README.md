# Career Mode Showdown — Soundtrack R&D Lab

Status: ACTIVE R&D
Owner: Nik
Worker identity: GPT-5.6 Sol, Soundtrack R&D worker
Created: 2026-10-06
Repository: nikahanghojjati-oss/fifa17-career-showdown2
Branch: r-and-d/persian-soundtrack-lab
Base main head at registration: bc77a0b934c3d43279f27f73a72db21c2db2b4f2

## Purpose

This is an isolated research and implementation lane for the Career Mode Showdown soundtrack, beginning with Persian rap and Persian music that fits the FIFA 17-inspired game identity and can be verified as available through Audius.

## Identity and trace

Work committed under this folder is attributable to the Soundtrack R&D worker named above. The GitHub connector is authenticated to the repository and can read current project authority plus write to this dedicated branch.

Every substantive soundtrack change should record:
1. the song and artist;
2. the Audius track id or other exact provider identity;
3. the date availability was verified;
4. whether API streaming was verified;
5. the reason the track fits Career Mode Showdown;
6. files changed;
7. tests or checks run;
8. unresolved licensing, durability, or provider risk.

## Authority boundaries

- main is read-only to this lab.
- Do not merge, force-push, deploy, modify Firebase settings, or modify production Rules.
- POS20 remains the project merge authority. The Showdown Gate is currently a shadow/supplemental gate and does not replace POS20.
- POS10 remains the inherited minimum safety kernel underneath POS20.
- Showdown Gate Physio is infrastructure owned by the project. This lab does not edit, disable, re-run, or work around it.
- Permanent product guards remain in force, including Firebase Spark only and Billing permanently OFF.
- Live repository state must be re-resolved before any future mutation. Recorded heads are observations, not authorization.

## Relationship to Team G

Team G currently leads gameplay product truth and its own factory on factory/gameplay-v1. This soundtrack lab is not a Team G gameplay job and must not edit Team G BOARD, job, status, gate, Physio, POS20, POS10, SSJR, or gameplay-factory authority files.

When soundtrack work eventually affects gameplay or shared product behavior, prepare a compact handoff for Team G rather than silently changing its domain.

## Relationship to Team V

Team V owns the visual presentation factory. Soundtrack R&D may study Team V's current Home, Transfer War, Trophy Room, loading, and other visual presentation work to choose music that fits each environment.

Do not edit Team V's factory branch or visual authority files from this lab. If soundtrack presentation requires visual UI changes, record a handoff for Team V.

## Current product context observed at registration

- Live main: bc77a0b934c3d43279f27f73a72db21c2db2b4f2
- Team G board reports live runtime 1.9.1-r62 on the same main head.
- Team G board is in bug-hunting mode with no new gameplay features until further notice.
- Main's current soundtrack implementation is in js/homeScreensV10.js and uses Audius track ids.
- The existing soundtrack code already records a prior Audius deletion, so availability and durability checks are a first-class R&D requirement.
- POS20_CURRENT_STATE.json contains older observed heads; per AGENTS.md those observations are not live authority and must not override the resolved main head.

## Promotion rule

Nothing in this branch reaches production merely because the R&D result is good.

A production candidate must be reconciled against the then-current main, routed through the appropriate owning team, tested under the current POS20-selected proof floor, reviewed, and merged only by the project's authorized integration path with Nik's required approval.

## First research packet

Initial Persian soundtrack shortlist:
- Behzad Leito & Sijal feat. Sepehr Khalse, Saman Wilson, Sohrab MJ & Alireza JJ — Business
- Zedbazi feat. Behzad Leito — Nakoni Bavar
- Ho3ein feat. Sadegh — Shaba
- Reza Pishro feat. Ho3ein — Miri Tu Lak
- Shayea — Asabani
- Gdaal feat. Erfan, Sami Beigi & Madgal — Hala Na
- Hichkas — Bezan (Shadm3hr Remix)
- Ali Sorena — Bezan Haroomi (Shadm3hr Remix)
- Reza Pishro — Batel Shod
- Zedbazi — Tabestoon Kootahe

These are research candidates, not yet production-approved tracks. Provider identity, streamability, uploader provenance, durability, and any applicable rights constraints must be verified before implementation.
