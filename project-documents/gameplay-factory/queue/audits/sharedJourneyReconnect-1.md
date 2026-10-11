# sharedJourneyReconnect.js audit, first half (lines 1-90)

no findings

Riskiest places checked:
1. Line 55-60 (`jrRemote`): a remote session with a different rivalry, account or device fails with JOURNEY_RECONNECT_AUTHORITY_MISMATCH. An "active" session without an id, account, device or expiry fails closed. Expired or pending sessions are never marked active.
2. Line 86-88 (`jrBase` fixed clubs and activeSeason): the ternary and `??` chain was checked for precedence. The fixed clubs and the active season come from the current setup or progression, and only fall back to the previous state when those are absent.
3. Line 64-65 (`jrSetup`): the setup must be revision 6, SHOWDOWN_CONFIRMED, with two different clubs and a rivalry id that matches the authority. This blocks a reconnect onto another rivalry's setup.
