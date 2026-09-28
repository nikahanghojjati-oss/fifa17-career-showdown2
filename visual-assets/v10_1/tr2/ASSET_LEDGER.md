# TR2 Asset Ledger: approved images live here

Rule (Nik, 2026-09-28; adopted by Sol as TWG-S2): every approved image used by the visual system has a repo path and SHA-256 in this ledger. Once an asset is here and its hash verifies, it is **never requested from Nik again**, unless the hash is missing, the file is corrupt, or Nik supplies a replacement himself. Any chat (Claude Project, Cloud, Sol) fetches it from here. If a needed file is missing, the task stops and names the file, once. A replaced file gets a new ledger row; old rows are never overwritten.

Branch: `claude-cloud/transfer-tr2-plate-g` (plate G) and `claude-cloud/transfer-tr2-slice-01` (poses, CP1 plate).

| Asset | Status | Path | SHA-256 |
| --- | --- | --- | --- |
| Transfer War plate, edited (owner-accepted likeness source) | OWNER ACCEPTED 2026-09-28: "the likeness on the edited PNG … is very good" | `tr2/slice-02-plate/assets/src/ENV_TR2_PLATE_G_EDIT_V1.png` (1672×941) | `f2080706c2b9f9769b24c2947675c81961a8eba93303ffbb5f363ae8c0c891cc` |
| Plate G, locked | APPROVED FOR BUILD (Claude gate) | `tr2/slice-02-plate/assets/ENV_TR2_PLATE_G_LOCKED_V1_1672.png` | `6f7d3d9cefe8c074b954b7fdf0e121cbaf812a90a33698f9d3f6adb4797fa10b` |
| Plate G, locked, DPR2 | APPROVED FOR BUILD | `tr2/slice-02-plate/assets/ENV_TR2_PLATE_G_LOCKED_V1_3344.png` (3344×1882) | `c49ea5a4177c71baa5dfb278b50648746267b218f693e522a9f4588652f06656` |
| Plate G cleanup-zone mask (lock proof) | EVIDENCE | `tr2/slice-02-plate/assets/CLEAN_ZONES_MASK.png` | `481733d110bc93d611e1d345cb5c4f3d8d03db0fd98d1858f8479672dd0117eb` |
| Mobile glass 9-slice (crop of Plate G rules card C, no generation) | DERIVED 2026-09-28 (`tools/make_glass_slice.py`, byte-reproducible) | `tr2/slice-02-plate/assets/DER_TR2_PLATE_G_GLASS_C_V1.png` (440×324, plate rect 1299,552–1519,714 at 2×) | `b5c16f7491e9c30bf2e44478e552a26b3ef827df9d8d6787f8b47374910bc753` |
| Pose: Daniel window pitch (paper, open hand) | APPROVED (Gate 0) | `tr2/slice-01/assets/src/POSE_TR2_DANIEL_WINDOW_PITCH_V1.png` | `e606f640fcc0fceb57991c585e59d0366dc955dd83ebba1b14cddb5d9b397d2e` |
| Pose: Nik window point (tablet) | APPROVED (Gate 0) | `tr2/slice-01/assets/src/POSE_TR2_NIK_WINDOW_POINT_V1.png` | `ea7d465e70488045a1ebdaf431ecd6db205a89c5b2439a32f942f1c08e6c77ac` |
| Pose: Daniel focused (clipboard, pen) | APPROVED | `tr2/slice-01/assets/src/POSE_TRANSFER_DANIEL_FOCUSED_V1.png` | `8c9cde1e4ef118d57ca9b1b6dacc7429bb70494e5f8ebce853ed7f46036b2c49` |
| Pose: Nik tactical (tablet, pen) | APPROVED | `tr2/slice-01/assets/src/POSE_TRANSFER_NIK_TACTICAL_V1.png` | `92c40b1290b06945122ba442bb0368c8025cc20b39e494c3d69926396b8488f5` |
| War-room plate V1 (CP1, retired look) | HISTORY | `tr2/slice-01/assets/src/ENV_TR2_WARROOM_PLATE_V1.png` | `224a674659c853834d48e92411ffec5325b3c70c6e34f1d4e779a820128b15bb` |

Not in the repo: Nik's original 1536×864 key art. **Not needed:** Nik accepted the edited plate's likeness, so the pixel restore against that original is retired for plate G.

Verify a file: `sha256sum <path>`.
