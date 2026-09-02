# Stage 5E Production Private Remote Joining Runtime — implementation proof

Status: production runtime candidate; provider-live host/join acceptance not yet claimed.

Stage 5E connects the already provider-live standard-auth private-session protocol to a user-facing, action-only runtime. The dashboard launcher is present at startup, but `js/sparkRemoteJoining.js` is not loaded until the owner opens Private Remote Joining. Opening the panel performs no Firebase/account/device/rivalry initialization. Those dependencies resolve only for Host, Join, Refresh/Read or Close.

The runtime uses the current standard Firebase authenticated UID, the current account-owned registered device metadata, and the exact attached Connected Rivalry. Host creates a fresh 256-bit `session_<64 hex>` capability. Join accepts only an exact capability. Refresh reads only that exact path. Close uses the existing terminal active-member close transition.

There is no collection listing, discovery, lobby, public profile, matchmaking, community or ranking surface. Session capability state is page-memory-only and is not written to localStorage, sessionStorage or IndexedDB. Canonical local gameplay storage remains exactly the three protected Career Mode Showdown keys and Stage 5E performs no gameplay mutation or Candidate C Apply.

Firebase remains Spark, billing stays disabled, Firestore persistence remains memory-only and App Check enforcement remains OFF. Spark quota/provider failure fails closed while local Career Mode remains available.

Deterministic contracts mock the already-proven provider dependencies and prove exact Host/Join/Read/Close wiring plus no RJR inflation. The rendered Chromium audit proves ordinary startup contains no Remote Joining runtime or dependency scripts, opening the panel loads only the presentation runtime, provider dependencies remain unloaded until a session action, and canonical local storage bytes do not change.

RJR remains exactly 87/100 until provider-live two-account/two-device Remote Joining evidence proves currently uncredited fixed-domain capability.
