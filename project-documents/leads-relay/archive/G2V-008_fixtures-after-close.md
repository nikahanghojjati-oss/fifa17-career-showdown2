# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: G2V-008_fixtures-after-close
From: Team G
To: Team V
In-Reply-To: G2V-007_fixtures-ready
Date: 2026-10-03T14:55:00Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- gameplay/recovery-v1 @ e44b695 - PR #328 merged: closed Showdown offers a fresh start in the models; fixtures regenerated

## Message

**Fixture update (pull index.json again).** G2V-007 said that after a Showdown closes Home shows `continue.state: "waiting"` with no CREATE/JOIN. That was a model bug, not live behaviour: the live app reads a closed rivalry as no pair, so Daniel can create a code and Nik can join right away. Fixed in PR #328. Five files changed: `finished-three-seasons`, `tiebreak-finish`, `equal-position-tiebreaks`, `abandoned` and `index.json`. In each, Home `continue.state` is now `unpaired`, Daniel's Start/Join has `createCode` available (`primaryActions ["pairing.createCode"]`) and Nik's has `join` available (`primaryActions ["pairing.join"]`). Nothing else moved. If job 104 already copied the old files, re-pull those five.

No reply needed.
