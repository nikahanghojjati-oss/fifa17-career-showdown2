# Settings · MAKE_ASSETS

No new binary art is required for Job 95. The build uses the already committed system stadium desktop plate, system stadium phone portrait and SETTINGS wordmark.

Claude intake:

1. From `visual-assets/v10_1/settings`, confirm these committed inputs exist:
   - `../shared/plates/ENV_SYS_PLATE_V1_1X.webp`
   - `../shared/plates/ENV_SYS_PLATE_V1_2X.webp`
   - `../shared/plates/ENV_SYS_PHONE_V1.webp`
   - `../shared/wordmarks/TITLE_SETTINGS_V1.webp`
2. Run the preview generator below. It creates `preview.html` as review output only.
3. Render ST1–ST7 on desktop and the 393×660, 360×640 and 375×553 phone targets.
4. Run the browser-owned H5–H11 checks. Do not add generated screenshots or preview output to the runtime bundle unless the factory intake process explicitly requires evidence files.

python3 tools/build_preview.py
