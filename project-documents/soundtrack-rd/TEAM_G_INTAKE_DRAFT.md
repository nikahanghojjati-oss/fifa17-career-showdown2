# Team G Intake Draft — Multi-Tab Audius Soundtrack Library

Status: R&D DRAFT — NOT YET SUBMITTED TO TEAM G
Owner: Nik
Prepared by: GPT-5.6 Sol · Soundtrack R&D
Source branch: r-and-d/persian-soundtrack-lab
Date: 2026-10-06

## Proposed production job title

Multi-tab Audius soundtrack library with Persian rap collections

Do not claim a Team G shared job number yet. The Team G lead owns intake, scoping and official job creation.

## Why this exists

The current Home has a working Audius soundtrack with eleven flat track choices. R&D proposes turning it into a curated library with up to seven tabs and up to ten visible tracks per tab, while preserving the existing single persistent audio element and user-tap playback behavior.

The owner's desired direction is a soundtrack that can include dedicated Persian artist collections plus English rap and rock/alternative material.

## Proposed ownership

Primary production owner: Team G
Reason: this changes Home soundtrack data model, selection state and playback/navigation behavior.

Visual owner when needed: Team V
Reason: final tab rail, sheet composition, active-state styling and any new visual assets are design/presentation work.

Soundtrack R&D remains research/evidence provider and should not merge to main.

## Proposed tabs

1. SHOWDOWN
2. ZEDBAZI
3. SHAYEA
4. GDAAL + FRIENDS
5. PERSIAN LEGENDS
6. ENGLISH RAP
7. FIFA ALT

Each tab: up to ten displayed tracks.

Use one canonical track registry. Tabs reference track keys so FEATURED/SHOWDOWN can reuse songs without duplicate Audius metadata.

## Existing implementation facts

Current player:
- one persistent <audio>
- preload=none
- stream URL generated only for the selected Audius track
- nothing requested until Play is pressed
- song persists after leaving Home
- next() rolls through the current flat track array

Likely affected production surfaces:
- js/homeScreensV10.js
- visual-assets/v10_1/home/soundtrack.js
- css/homeV10.css
- related Home/browser/contract tests

Final file list must be re-resolved against current main at intake time.

## Non-goals

- no Firebase changes
- no billing changes
- no Firestore Rules changes
- no scoring/gameplay changes
- no Shared Showdown data change
- no automatic playback without user interaction
- no change to POS20, Showdown Gate or Physio
- no production deployment from the R&D branch

## Proof requested from R&D before Team G accepts implementation

- final tab taxonomy
- exact track list
- Audius id for every track
- current availability check
- stream check
- provenance/uploader classification
- duplicates resolved
- explicit rejected-track list
- mobile capacity rationale
- expected playback semantics across tab switch / next / pause / leaving Home
- rollback to the current flat playlist described

## Current readiness

Architecture: READY FOR R&D
Catalog: INCOMPLETE
Audius identity verification: IN PROGRESS
Stream verification: INCOMPLETE
Team V visual handoff: NOT NEEDED YET
Team G official job: NOT READY TO CLAIM

## Intake trigger

This packet is intentionally for the post-bug-hunt feature board, not the current bug-hunt board. Nik's plan is to finish the present visual/gameplay bug-hunt phase first, then start a new feature board where soundtrack expansion can become an official Team G job. Submit this packet when that future feature-board intake opens and the catalog has reached the agreed evidence floor.

At submission time:
1. re-resolve live main;
2. compare this branch to main;
3. refresh affected-file list;
4. attach exact R&D commits;
5. let Team G decide scope and shared job number;
6. let Team G create any Team V hand-off ticket required for visual work;
7. follow the current POS20-selected proof floor before main integration.
