# Owner authority: SSJR-2.2 simple SSJR test (2026-10-26)

**Owner:** Nik (product owner), in the Team G lead thread:
- 2026-10-26 23:20 UTC: "streamline and simplify processes while making sure we prove ssjr 100 to make gameplay officially lunch as fully playable".
- 2026-10-26 23:46 UTC: chose "One run proves both": one 3-season real-device game proves r84 and SSJR 100.
- 2026-10-26 23:47 UTC: "Build ssjr test a lot easier and simpler panel that would be automated".

**Why the evidence rules changed.** An emulator run of the SSJR-2.1 recorder on runtime r84 could not complete. Since JOB-1038 the Showdown closes itself after the last season, so the SSJR-2.1 order (offline, reload and Local Reconciliation preview after the last season, then a manual close, then a reload) is impossible. The automatic close also races each device's Local and Final Reconciliation.

**What SSJR-2.2 changes (evidence rules only).**
- One link, `?ssjr=1`, loads only the recorder panel: no typed labels (the device label comes from browser facts; the network is one tap), no reset or check buttons.
- The offline, reconnect (after the game held its state offline) and reload checks are made during the game, after the career starts and before the automatic close. The reload must find the same Showdown again.
- The close is recorded live, then confirmed after a later reload by one read-only check of the signed-in account's career index and the completed-Showdown reader. The recorder still never writes to Firebase.
- Local Reconciliation (read-only PREVIEW_READY with its unchanged storage proof) and Final Reconciliation of the last season must be proven on at least one device of the pair. A preview that a device does record must carry its storage proof. Candidate C Apply stays forbidden.

**What does not change.** SSJR-2.1 capabilities, weights, dependencies, the credit script and owner attestation, the rule that only a validated two-device production pair plus Nik's attestation earns credit, and the rule that no emulator, CI, review or merge evidence earns credit.
