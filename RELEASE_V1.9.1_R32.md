# Career Mode Showdown v1.9.1 — Runtime r32

Application version: `v1.9.1`
Release tag: `v1.9.1`
Runtime asset revision: `1.9.1-r32`
Previous known-good runtime: `1.9.1-r31`

The online identity surface hides the internal Offline App panel. Its update button was therefore invisible on both physical devices even when the correct Settings module loaded. Application now contains a visible update action that uses the existing safe activation boundary.

The network-only `production-authorization-acceptance.html?update=1` entry lets an already-installed r29 client obtain the current runtime. Update mode loads no Firebase or acceptance-probe code. It verifies the latest complete cached shell before explicit activation, then returns to the game. It never clears browser storage, unregisters the device, redraws clubs or replaces the Showdown.

The r31 Career Start acknowledgement recovery and r30 Transfer Challenge continuation remain intact. Remote Joining engineering provenance remains repository-only.

Firebase remains Spark-only. Billing remains permanently OFF. App Check enforcement remains OFF. No Firestore Rules change, paid service or additional provider authority is introduced. SSJR-1.1 remains exactly `0/100` until genuine physical acceptance.
