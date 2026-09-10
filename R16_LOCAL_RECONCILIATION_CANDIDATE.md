# r16 Local Reconciliation candidate

Starting authority: main `928f8c9e945f57ee1044debcc81ed4400712f605`; MDP 86.50/100; SSJR 0/100.

Frozen capability: `local-reconciliation`, weight 5. This candidate integrates Shared Journey state with the existing Connected Rivalry Candidate B/C reconciliation authority. It adds no new Firestore collection, list authority, provider mutation path or direct canonical-storage writer. Read-only preview may use the already-observed exact remote envelope while offline; Apply is explicitly denied offline and requires user confirmation online. Candidate C remains the sole destructive local Apply authority, including backup, exact remote freshness guards, stale-local guard, guarded raw transaction and rollback.

Candidate lifecycle credit remains unawarded until exact-head POS20 proves the final candidate. Product-integration credit remains unawarded until coherent r16 publication, final publication-head POS20, expected-head merge, Pages deployment, exact-main POS20 and two-pass Release Integration Burn-In. MDP stays 86.50 until separate post-integration accounting.
