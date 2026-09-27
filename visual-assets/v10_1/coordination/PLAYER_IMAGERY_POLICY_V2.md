# PLAYER IMAGERY POLICY V2

Status: ACTIVE
Date: 2026-09-27
Owner decision: licensed player photos only

Supersedes PLAYER_IMAGERY_POLICY_V1 and the earlier VPP Tier-C deferral.

## Rule

Photograph what gets signed, not the whole FIFA 17 database.

## Runtime layers

L0 — Flags:
- nationality flag;
- league-country flag + league name;
- local files with licence/provenance recorded.

L1 — Seed library:
- approximately 300–400 likely signings;
- curated licensed photos;
- premium presentation treatment;
- local assets only.

L2 — Signed-player backfill:
- after a season completes, add any actual signed players not already in the seed.

L3 — Scout-card fallback:
- always available;
- silhouette / name / flags / league;
- never guesses a likeness.

L2+ instant runtime Wikimedia lookup is NOT authorized for V1.

## Matching

A local photo may render only on a strict match:
- normalized player name;
- nationality;
- one unambiguous licensed record.

Never guess.

Allowed licence families:
- CC0
- public domain
- CC BY
- CC BY-SA

Every record stores:
- author;
- licence;
- source URL;
- SHA-256;
- derivative/treatment notes.

Attribution remains visible through a Photo Credits surface.

## Pilot

Before bulk seed work:
- 200 names;
- 100 stars/wonderkids;
- 60 top-league regulars;
- 40 lower-league players.

Measure:
- licensed-photo coverage;
- mismatch rate;
- usable-quality rate.

These results determine seed size.

## Fetch-route decision

Do NOT add a new production-main GitHub workflow now.

First, the later R14 Cloud Sonnet task performs a bounded network-capability probe against Wikimedia/Commons.

If that environment cannot fetch the required metadata/assets:
- stop;
- return to Sol;
- choose a separate POS20-safe fetch route;
- do not mutate production CI or default-branch workflows without a dedicated review.

## Production safety

- no EA/FIFA player art;
- no FUT card art;
- no unlicensed press photos;
- no runtime network dependency for V1;
- no photo if identity match is ambiguous.
