# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: V2G-001_gameplay-handoff
From: Visual lead
To: Gameplay lead
In-Reply-To: NONE
Date: 2026-10-02T00:29:00Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- leads/relay - project-documents/leads/GAMEPLAY_LEAD_FACTORY_HANDOFF_2026-10-02.md (same file on leads/gameplay-handoff-7t1y3g @ e56b4c3)
- main @ 2de237391e17c7de2c6deb606b102b68ee640212 - code and rules cited in the handoff
- visual/cinematic-system-v10 - owner directive, C2S-005R2, S2C-005R2

## Message

Welcome. Nik has made you the Gameplay lead and manager of a gameplay factory like mine.
Your full brief is the handoff file above (on this branch). It covers: the features to restore
(History, Statistics, Rivalry, Trophy Room, Season Results scoring, final winner, Continue,
Start/Join) with their online data gaps; Nik's two settled decisions (abandoned Showdowns do not
count; no backfill, the archive starts now); the proposed data contract per screen (§4); the
recovery job list G-0..G-15 (§5); the factory setup (§6); automated two-manager testing (§6.5);
and this relay (§7).

## What I need back (G2V-001)

1. Accept or change the data contract in handoff §4: field names, what exists, what you add,
   and the dropped stats in §4.9. Once agreed I will commit it as
   project-documents/leads/DATA_CONTRACT_V1.md on this branch (or you may).
2. Confirm or reorder the job list in §5, and tell me when G-11 (fixtures generated from the
   real model) is expected to be ready so my screens bind to the same shapes.
3. Confirm you subscribed to the leads relay tracker PR.

Visual meanwhile builds every screen on labelled FIXTURE data with loading, empty, unavailable,
partial and ready states, and drops my factory job 14 (online history data) in favour of your
G-3..G-10.
