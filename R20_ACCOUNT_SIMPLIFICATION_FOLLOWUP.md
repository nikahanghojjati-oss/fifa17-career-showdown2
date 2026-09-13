# Two-person identity follow-up after r20

This note records the owner-requested follow-up without mixing it into the r20 routing repair.

## Product goal

Career Mode Showdown is permanently a two-person private product for Nik and Daniel. The existing Firebase UID, registered-device, Connected Account and Connected Rivalry authorities remain the security boundary. A future profile/avatar surface may display the current manager, but presentation labels must never replace UID/device/rivalry authority.

## Intended simplification

After r20 is merged and independently proven, implement a separately reviewed capability that can:

- reuse the existing registered browser identity instead of registering it for every Showdown;
- reuse the existing Nik/Daniel private relationship instead of issuing a fresh pairing for every Showdown when the current authority is still valid;
- derive friendly manager names from the already-authenticated identity / locally approved profile labels rather than asking for both names on every new Showdown;
- generate the required internal Showdown name automatically while retaining the existing storage field for compatibility;
- expose a read-only current-player identity state suitable for the future top-right avatar / “Welcome Nik” or “Welcome Daniel” visual surface;
- keep the private session capability ephemeral unless a separate security review proves a safer simplification;
- preserve exactly two accounts, no discovery/listing/community, Spark-only Firebase, and Billing permanently OFF.

## Auth persistence boundary

Current `browserSessionPersistence` is deliberate historical authority. The earlier auth policy explicitly allowed durable remembered-device persistence to be reconsidered only after registered-device security was proven and separately authorized. That prerequisite now exists, but any switch to durable Firebase Auth persistence must be a distinct security capability with explicit sign-out, revoked/missing-device fail-closed behavior, exact account/device matching and regression tests. r20 does not change Auth persistence.

## Sequencing

1. Finish and prove r20 peer-entry + Physical Journey instrumentation repair.
2. Branch from the resulting exact main.
3. Build the low-risk two-person identity/auto-fill/auto-name/reuse layer first.
4. Treat durable remembered Auth, if adopted, as its own explicit security boundary rather than a convenience one-line change.

This follow-up earns no MDP credit by itself. MDP remains 95.50/100 until the required production Physical Journey evidence and accounting lifecycle complete.
