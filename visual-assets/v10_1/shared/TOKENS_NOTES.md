# Showdown tokens and type system · JOB-012

## Scope and reference decisions

Read FACTORY_RULES, WORKER_HANDBOOK, PRODUCT_TRUTH, QUALITY_BAR and CRAFT_GUIDE. Studied all eleven goal/mockup images, including the Trophy Room title at its original resolution. Existing screen files are unchanged.

The mockups use bright yellow metallic highlights, near-black glass, condensed labels and numbers, and energetic uppercase brush lettering. This kit follows CRAFT_GUIDE §4 as the baseline while keeping the four builds’ warm metal colour available in the ramp.

| Difference | Shared choice | Reason and source |
| --- | --- | --- |
| Four builds use #F2C45B / #C99B45; guide uses #F5C518 / #D4A017 | Gold 500 #F5C518 for actions; 400 #F2C45B for warm scene metal; 700 #D4A017 for edges | Mockups’ primary actions are brighter yellow; preserving 400 allows the art’s warm edges without brown primary fills. |
| Builds use #FFF1B8, #FFD97A and #FFE08F highlights | 100 #FFF3B0, 200 #FFF1B8, 300 #FFD34D | A pale highlight plus saturated midtone gives metallic lettering without white glare. |
| Page #060709 / #070604 / #050607; Transfer ink #120E07 | Page #07080A; panel #0D0F13; glass rgba(10,11,14,.78) | Neutral blacks from CRAFT_GUIDE keep stadium grade in the art rather than tinting all UI brown. |
| Cream #E9DFC8 vs Transfer #F4E7C8 | Primary #F4F1EA, secondary #B9B3A4, warm #E9DFC8 | Neutral readable body copy; warm cream remains available for scene labels. Dim #9A8F7A is decorative only. |
| League/Club titles are italic Barlow Condensed with SVG brush filters; Home already has a wordmark | Kaushan Script base title, warm metallic gradient, slight title-only skew | Job 12 explicitly requests Kaushan. This is a shared live-text foundation. Final screen titles still require brush wordmark images per QUALITY_BAR §5; the font alone does not reproduce the reference’s dry brush edges. |
| Main has no named manager accent custom properties | Daniel #2C7399; Nik #F0D900 | Read-only main css/app.css: --f17-blue line 5, --f17-yellow line 2; playerCard, transferManagerCard, seasonResultCard use blue first, yellow on nth-child(2). PRODUCT_TRUTH maps Manager 1 to Daniel and Manager 2 to Nik. Preserve that mapping. |
| Existing font loading uses block or default | Local WOFF2, font-display: swap, only required five faces | Per job step 3; no network font dependency. |
| Existing labels sometimes below 12px, numbers scaled by --k or --s | Body 16–18px; label 13–16px; tabular number sizes 24–40 / 40–72 / 64–112px | Readability is independent of plate scaling; title clamps from phone to 1920px. |

## Collected values (complete CSS inventory)

The following is an exhaustive inventory of colour literals and font/font-size declarations from the four listed CSS files, including media-query variants. Line numbers refer to the starting factory checkout. Identical declarations retain their source locations.

### home/home.css

| Colour literal | Lines |
| --- | --- |
| `#F2C45B` | 9 |
| `#C99B45` | 10 |
| `#FFF1B8` | 11, 228, 237 |
| `#0B0D10` | 12, 108, 212 |
| `#E9DFC8` | 13, 134 |
| `#CFC6B4` | 14 |
| `#9A8F7A` | 15 |
| `rgba(10, 12, 15, .78)` | 16 |
| `rgba(201, 155, 69, .45)` | 17 |
| `#060709` | 27, 29, 40, 292 |
| `#000` | 49, 50, 51, 55, 60, 67, 69, 76, 78, 85, 88, 89 |
| `rgba(6,7,9,.74)` | 58, 75 |
| `rgba(6,7,9,.8)` | 58 |
| `rgba(6,7,9,.88)` | 58 |
| `rgba(6,7,9,.86)` | 84, 256 |
| `rgba(6,7,9,.72)` | 87 |
| `rgba(6,7,9,.92)` | 95 |
| `rgba(6,7,9,.70)` | 95 |
| `#14161A` | 108 |
| `rgba(10,12,15,.72)` | 115 |
| `rgba(201,155,69,.55)` | 115 |
| `rgba(0,0,0,.85)` | 125 |
| `rgba(0,0,0,.9)` | 135 |
| `rgba(0,0,0,.55)` | 139 |
| `rgba(0,0,0,.8)` | 150 |
| `#FFFFFF` | 152 |
| `rgba(0,0,0,.7)` | 153 |
| `rgba(201,155,69,.6)` | 165 |
| `#fff` | 165, 169, 205, 226 |
| `rgba(0,0,0,.45)` | 166, 184, 191 |
| `rgba(242,196,91,.12)` | 181 |
| `#FFD97A` | 182 |
| `#F7D46A` | 184, 228, 237 |
| `#E0AE3A` | 184, 228, 237 |
| `rgba(255,241,184,.7)` | 184 |
| `#3B2C0C` | 185 |
| `#2A2008` | 187 |
| `rgba(0,0,0,.5)` | 197 |
| `#E9B84D` | 212 |
| `#9A6E22` | 212 |
| `#121317` | 213 |
| `#1E2026` | 213 |
| `rgba(201,155,69,.5)` | 214, 224 |
| `rgba(0,0,0,.6)` | 214 |
| `rgba(255,241,184,.08)` | 216 |
| `rgba(255,255,255,.04)` | 224 |
| `rgba(10,12,15,.6)` | 238 |
| `rgba(233,223,200,.55)` | 238 |
| `#B8AE98` | 239 |
| `rgba(233,223,200,.45)` | 239 |
| `rgba(6,7,9,.96)` | 256 |
| `rgba(201,155,69,.3)` | 256 |
| `#FF3B3B` | 267 |
| `rgba(255,59,59,.12)` | 267 |
| `#FF7A7A` | 267, 268 |
| `#36E0FF` | 269 |
| `rgba(120,255,120,.8)` | 270 |
| `rgba(120,255,120,.10)` | 270 |
| `rgba(6,7,9,.98)` | 283 |
| `rgba(6,7,9,.9)` | 283 |
| `rgba(242,196,91,.9)` | 286 |

| Font or size declaration | Line |
| --- | --- |
| `font-family: "Barlow Condensed"` | 2 |
| `font-weight: 600` | 2 |
| `font-display: block` | 2 |
| `font-family: "Barlow Condensed"` | 3 |
| `font-weight: 700` | 3 |
| `font-display: block` | 3 |
| `font-family: "Barlow"` | 4 |
| `font-weight: 400` | 4 |
| `font-display: block` | 4 |
| `font-family: "Barlow"` | 5 |
| `font-weight: 600` | 5 |
| `font-display: block` | 5 |
| `font-family: "Kaushan Script"` | 6 |
| `font-weight: 400` | 6 |
| `font-display: block` | 6 |
| `font-family: var(--text)` | 28 |
| `font: inherit` | 30 |
| `font: italic 700 24px/1.15 var(--cond)` | 104 |
| `font: 600 13px/1.15 var(--cond)` | 111 |
| `font: 600 14px/1 var(--cond)` | 116 |
| `font: 400 18px/1.7 var(--script)` | 124 |
| `font: 600 15px/1.25 var(--cond)` | 134 |
| `font: 700 18px/1.1 var(--cond)` | 147 |
| `font: 400 16px/1.35 var(--text)` | 150 |
| `font: 700 44px/1.16 var(--cond)` | 152 |
| `font: 600 12px/1.15 var(--cond)` | 168 |
| `font: 700 26px/1.1 var(--cond)` | 169 |
| `font: 400 14px/1.25 var(--text)` | 170 |
| `font: 700 12px/1.15 var(--cond)` | 182 |
| `font: 600 12px/1.2 var(--cond)` | 204 |
| `font: 700 26px/1.15 var(--cond)` | 205 |
| `font: 400 14px/1.25 var(--text)` | 206 |
| `font: 600 12px/1.2 var(--cond)` | 207 |
| `font: 700 13px/1.1 var(--cond)` | 226 |
| `font: 600 12px/1.15 var(--cond)` | 227 |
| `font: 600 12px/1.2 var(--cond)` | 231 |
| `font: 700 15px/1 var(--cond)` | 235 |
| `font: 600 12px/1 var(--cond)` | 249 |
| `font-weight: 700` | 251 |
| `font-weight: 700` | 252 |
| `font: 400 12px/13px var(--text)` | 255 |
| `font: 600 12px/1 var(--cond)` | 260 |
| `font: 700 11px/1 var(--cond)` | 267 |
| `font-size: 22px` | 284 |
| `font-size: 14px` | 286 |
| `font-size: 16px` | 293 |
| `font-size: 14px` | 294 |
| `font-size: 28px` | 295 |
| `font-size: 14px` | 300 |
| `font-size: 18px` | 315 |
| `font-size: 14px` | 316 |
| `font-size: 12px` | 319 |
| `font-size: 16px` | 322 |
| `font-size: 12px` | 324 |
| `font-size: 18px` | 326 |
| `font-size: 14px` | 327 |
| `font-size: 14px` | 337 |

| Root custom property | Lines |
| --- | --- |
| `--gold: #F2C45B` | 9 |
| `--gold-deep: #C99B45` | 10 |
| `--gold-hi: #FFF1B8` | 11 |
| `--ink: #0B0D10` | 12 |
| `--cream: #E9DFC8` | 13 |
| `--meta: #CFC6B4` | 14 |
| `--foot: #9A8F7A` | 15 |
| `--glass: rgba(10, 12, 15, .78)` | 16 |
| `--hair: rgba(201, 155, 69, .45)` | 17 |
| `--cond: "Barlow Condensed", "Arial Narrow", sans-serif` | 18 |
| `--text: "Barlow", system-ui, sans-serif` | 19 |
| `--script: "Kaushan Script", cursive` | 20 |
| `--hdr: 56px` | 21 |
| `--ftr: 28px` | 22 |
| `--tile-h: clamp(136px, 17.5vh, 158px)` | 23 |
| `--tile-top: 600px` | 24 |
| `--gutter: 2.4vw` | 25 |
| `--vinyl: 44px` | 199 |
| `--vinyl: 48px` | 241 |
| `--hdr: 48px` | 279 |
| `--gutter: 12px` | 279 |

### league/league.css

| Colour literal | Lines |
| --- | --- |
| `#F2C45B` | 9, 74 |
| `#C99B45` | 9 |
| `#FFF1B8` | 9, 74, 96 |
| `#0B0D10` | 9, 118 |
| `#E9DFC8` | 9 |
| `#9A8F7A` | 9 |
| `#EFE6CF` | 10 |
| `#070604` | 14, 16 |
| `rgba(6,7,9,.72)` | 30, 59 |
| `rgba(6,7,9,.30)` | 30 |
| `rgba(6,7,9,0)` | 30, 32, 35, 37, 42, 161 |
| `#000` | 31, 33, 34, 36, 38, 44, 126 |
| `rgba(6,7,9,.62)` | 32 |
| `rgba(6,7,9,.34)` | 32 |
| `rgba(6,7,9,.55)` | 35, 37, 42, 161 |
| `rgba(6,7,9,.25)` | 35 |
| `rgba(6,7,9,.92)` | 37, 48, 59 |
| `rgba(6,7,9,.10)` | 42 |
| `rgba(6,7,9,.88)` | 42 |
| `rgba(6,7,9,.70)` | 48 |
| `rgba(201,155,69,.45)` | 48 |
| `#0d0f12` | 50 |
| `rgba(10,12,15,.72)` | 54, 134 |
| `rgba(201,155,69,.55)` | 54 |
| `rgba(201,155,69,.30)` | 59 |
| `#B3A88F` | 62 |
| `#B98A2F` | 74 |
| `rgba(242,196,91,.35)` | 75 |
| `rgba(201,155,69,0)` | 77 |
| `rgba(201,155,69,.9)` | 77 |
| `rgba(0,0,0,.85)` | 79 |
| `rgba(10,12,15,.82)` | 82 |
| `rgba(201,155,69,.38)` | 82 |
| `rgba(242,196,91,.7)` | 83 |
| `#F6EBD0` | 83 |
| `#F7D46A` | 89 |
| `#E0AE3A` | 89 |
| `#7A5A22` | 89 |
| `rgba(0,0,0,.45)` | 89 |
| `#2a2418` | 92 |
| `#CDB57A` | 92 |
| `#A98D4E` | 92 |
| `rgba(10,12,15,.62)` | 93 |
| `rgba(233,223,200,.55)` | 93 |
| `#A79F8E` | 95 |
| `rgba(233,223,200,.42)` | 95 |
| `rgba(7,8,10,.96)` | 101 |
| `rgba(9,10,12,.95)` | 101 |
| `rgba(9,10,12,0)` | 101 |
| `rgba(242,196,91,.95)` | 105 |
| `#181B20` | 106 |
| `#14171B` | 106 |
| `#0E1013` | 106 |
| `rgba(247,212,106,.85)` | 109 |
| `rgba(201,155,69,.85)` | 109 |
| `rgba(255,241,184,.05)` | 124 |
| `rgba(0,0,0,.6)` | 129 |
| `rgba(10,12,15,.86)` | 134 |
| `rgba(6,7,9,.9)` | 161 |

| Font or size declaration | Line |
| --- | --- |
| `font-family: "Barlow Condensed"` | 2 |
| `font-weight: 600` | 2 |
| `font-family: "Barlow Condensed"` | 3 |
| `font-weight: 700` | 3 |
| `font-family: "Barlow"` | 4 |
| `font-weight: 400` | 4 |
| `font-family: "Barlow"` | 5 |
| `font-weight: 600` | 5 |
| `font-family: "Kaushan Script"` | 6 |
| `font-weight: 400` | 6 |
| `font-family: var(--text)` | 15 |
| `font: italic 700 24px/1.2 var(--cond)` | 51 |
| `font: 600 13px/1.25 var(--cond)` | 52 |
| `font-size: 12px` | 53 |
| `font: 600 14px/1 var(--cond)` | 55 |
| `font: 400 18px/1.35 "Kaushan Script", cursive` | 57 |
| `font: 400 12px/1 var(--text)` | 59 |
| `font: 600 12px/1 var(--cond)` | 62 |
| `font: 600 13px/1 var(--cond)` | 72 |
| `font: italic 700 var(--title-size, 72px)/1.2 var(--cond)` | 73 |
| `font: 600 15px/1.2 var(--cond)` | 79 |
| `font: 700 22px/1.1 var(--cond)` | 80 |
| `font: 400 14px/1.35 var(--text)` | 82 |
| `font: 700 20px/1 var(--cond)` | 88 |
| `font: 700 calc(var(--R) * 22 / 240) / 1.15 var(--cond)` | 113 |
| `font: 600 14px/1.15 var(--cond)` | 135 |
| `font: 600 12px/1 var(--cond)` | 145 |
| `font-size: 14px` | 153 |
| `font-size: 14px` | 157 |
| `font-size: 20px` | 158 |
| `font-size: 19px` | 160 |
| `font-size: max(12px, calc(var(--R) * 22 / 240))` | 163 |

| Root custom property | Lines |
| --- | --- |
| `--gold: #F2C45B` | 9 |
| `--gold-deep: #C99B45` | 9 |
| `--gold-hi: #FFF1B8` | 9 |
| `--ink: #0B0D10` | 9 |
| `--cream: #E9DFC8` | 9 |
| `--muted: #9A8F7A` | 9 |
| `--pale: #EFE6CF` | 10 |
| `--cond: "Barlow Condensed", "Arial Narrow", sans-serif` | 11 |
| `--text: "Barlow", system-ui, sans-serif` | 11 |
| `--header-h: 56px` | 12 |
| `--footer-h: 28px` | 12 |
| `--heal-blur: 5px` | 31 |
| `--heal-blur: 9px` | 34 |
| `--heal-dim: .92` | 34 |
| `--heal-blur: 8px` | 36 |
| `--heal-blur: 6px` | 38 |
| `--crown: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 16'%3E%3Cpath d='M1 4l5 4 6-7 6 7 5-4-2 11H3z'/%3E%3C/svg%3E")` | 64 |
| `--spin-ico: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 11a8 8 0 0 0-14.3-4.9L4 8'/%3E%3Cpath d='M4 3v5h5'/%3E%3Cpath d='M4 13a8 8 0 0 0 14.3 4.9L20 16'/%3E%3Cpath d='M20 21v-5h-5'/%3E%3C/svg%3E")` | 91 |
| `--a: 0deg` | 114 |
| `--a: 72deg` | 114 |
| `--a: 144deg` | 114 |
| `--a: 216deg` | 114 |
| `--a: 288deg` | 114 |
| `--pointer-svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 62'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23FFF1B8'/%3E%3Cstop offset='.55' stop-color='%23F2C45B'/%3E%3Cstop offset='1' stop-color='%237A5A22'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M9 14l4 4 9-10 9 10 4-4-2 10H11z' fill='url(%23g)' stroke='%237A5A22' stroke-width='1'/%3E%3Cpath d='M4 28h36L22 60z' fill='url(%23g)' stroke='%237A5A22' stroke-width='1.2'/%3E%3Cpath d='M12 31h20L22 50z' fill='%237A5A22' opacity='.35'/%3E%3C/svg%3E")` | 130 |
| `--header-h: 48px` | 149 |
| `--title-size: 40px` | 154 |

### club/club.css

| Colour literal | Lines |
| --- | --- |
| `#F2C45B` | 10, 34, 46, 56, 64, 75, 107 |
| `#C99B45` | 10, 64 |
| `#FFF1B8` | 10, 58, 75, 107 |
| `#0B0D10` | 10 |
| `#E9DFC8` | 10, 48, 72, 93, 156, 157 |
| `#9A8F7A` | 10, 62 |
| `#050607` | 16 |
| `rgba(242,196,91,.6)` | 34, 92, 156 |
| `rgba(6,7,9,.92)` | 42 |
| `rgba(6,7,9,.70)` | 42 |
| `rgba(201,155,69,.45)` | 42 |
| `#0d0e10` | 45 |
| `rgba(6,7,9,.78)` | 47 |
| `rgba(10,12,15,.72)` | 51 |
| `rgba(201,155,69,.55)` | 51 |
| `rgba(4,5,6,.45)` | 53 |
| `#050506` | 61 |
| `rgba(201,155,69,.25)` | 61 |
| `#C9BC9C` | 63 |
| `#000` | 72 |
| `#B98A2F` | 75, 107 |
| `rgba(242,196,91,.35)` | 76 |
| `#F4ECD8` | 81, 83, 104, 124, 128, 158 |
| `rgba(242,196,91,.3)` | 82 |
| `rgba(242,196,91,.75)` | 87 |
| `#B3A88F` | 88 |
| `rgba(242,196,91,.55)` | 89 |
| `#0b0c0e` | 89 |
| `#FFE592` | 92 |
| `#E0AE3A` | 92, 155 |
| `rgba(242,196,91,.45)` | 108 |
| `#B9AE95` | 120 |
| `#FFF` | 125, 146 |
| `#8E8570` | 126 |
| `rgba(242,196,91,.7)` | 131, 222 |
| `#FFF6DE` | 141 |
| `#CDBF9E` | 142, 145 |
| `#E3D9C2` | 148 |
| `#F7D46A` | 155 |
| `#FFE8A0` | 155 |
| `rgba(224,174,58,.28)` | 155 |
| `rgba(12,12,13,.94)` | 156 |
| `rgba(242,196,91,.12)` | 156 |
| `rgba(10,12,15,.55)` | 158 |
| `rgba(233,223,200,.55)` | 158 |
| `rgba(8,9,11,.92)` | 222 |

| Font or size declaration | Line |
| --- | --- |
| `font-family: "Barlow Condensed"` | 3 |
| `font-weight: 600` | 3 |
| `font-display: block` | 3 |
| `font-family: "Barlow Condensed"` | 4 |
| `font-weight: 700` | 4 |
| `font-display: block` | 4 |
| `font-family: "Barlow"` | 5 |
| `font-weight: 400` | 5 |
| `font-display: block` | 5 |
| `font-family: "Barlow"` | 6 |
| `font-weight: 600` | 6 |
| `font-display: block` | 6 |
| `font-family: "Kaushan Script"` | 7 |
| `font-weight: 400` | 7 |
| `font-display: block` | 7 |
| `font-family: var(--text)` | 17 |
| `font: italic 700 24px/1.25 var(--cond)` | 46 |
| `font: 600 13px/1.25 var(--cond)` | 48 |
| `font: 600 14px/1.25 var(--cond)` | 52 |
| `font: 400 18px/1.25 "Kaushan Script", cursive` | 56 |
| `font: 400 12px/1.05 var(--text)` | 62 |
| `font: 600 12px/1.25 var(--cond)` | 63 |
| `font: 600 max(12px, calc(var(--s) * 13px))/1.25 var(--cond)` | 72 |
| `font: italic 700 calc(var(--s) * 64px)/1.25 var(--cond)` | 74 |
| `font: 600 max(12px, calc(var(--s) * 15px))/1.25 var(--cond)` | 81 |
| `font: 700 calc(var(--s) * 26px)/1.25 var(--cond)` | 82 |
| `font: 600 max(12px, calc(var(--s) * 15px))/1.25 var(--cond)` | 83 |
| `font: 600 max(12px, calc(var(--s) * 13px))/1.25 var(--cond)` | 88 |
| `font: 600 max(12px, calc(var(--s) * 14px))/1.25 var(--cond)` | 104 |
| `font: italic 700 calc(var(--s) * 96px)/1.25 var(--cond)` | 106 |
| `font-size: calc(var(--s) * 64px)` | 110 |
| `font: 600 max(12px, calc(var(--s) * 12px))/1.2 var(--cond)` | 120 |
| `font: 700 calc(var(--s) * 26px)/1.25 var(--cond)` | 124 |
| `font: 600 max(12px, calc(var(--s) * 12px))/1.2 var(--cond)` | 126 |
| `font: 700 calc(var(--s) * 22px)/1.25 var(--cond)` | 128 |
| `font: 700 max(12px, calc(var(--s) * 12px))/1.25 var(--cond)` | 129 |
| `font: italic 700 calc(var(--s) * 18px)/1.25 var(--cond)` | 132 |
| `font: 600 max(12px, calc(var(--s) * 12px))/1.25 var(--cond)` | 140 |
| `font: 700 calc(var(--s) * 20px)/1.25 var(--cond)` | 141 |
| `font: 600 max(12px, calc(var(--s) * 13px))/1.2 var(--cond)` | 142 |
| `font: 600 max(12px, calc(var(--s) * 14px))/1.25 var(--cond)` | 145 |
| `font: 700 calc(var(--s) * 20px)/1.25 var(--cond)` | 146 |
| `font: italic 700 calc(var(--s) * 18px)/1.25 var(--cond)` | 147 |
| `font: 400 max(12px, calc(var(--s) * 14px))/1.3 var(--text)` | 148 |
| `font: 700 calc(var(--s) * 20px)/1.25 var(--cond)` | 153 |
| `font-size: calc(var(--s) * 38px)` | 170 |
| `font-size: calc(var(--s) * 20px)` | 173 |
| `font-size: 13px` | 174 |
| `font-size: 14px` | 175 |
| `font-size: 22px` | 181 |
| `font-size: 13px` | 183 |
| `font-size: 34px` | 193 |
| `font-size: 13px` | 196 |
| `font-size: 20px` | 197 |
| `font-size: 13px` | 198 |
| `font-size: 12px` | 201 |
| `font-size: 12px` | 207 |
| `font-size: var(--vsFs, 32px)` | 208 |
| `font-size: 12px` | 210 |
| `font-size: 20px` | 211 |
| `font-size: 20px` | 219 |
| `font-size: 12px` | 220 |
| `font-size: 13px` | 226 |
| `font-size: 14px` | 228 |
| `font-size: 18px` | 228 |
| `font-size: 14px` | 229 |
| `font-size: 19px` | 230 |
| `font-size: 30px` | 246 |
| `font-size: 28px` | 265 |
| `font-size: 18px` | 273 |
| `font-size: 18px` | 274 |

| Root custom property | Lines |
| --- | --- |
| `--gold: #F2C45B` | 10 |
| `--gold-deep: #C99B45` | 10 |
| `--gold-hi: #FFF1B8` | 10 |
| `--ink: #0B0D10` | 10 |
| `--cream: #E9DFC8` | 10 |
| `--dim: #9A8F7A` | 10 |
| `--cond: "Barlow Condensed", "Arial Narrow", sans-serif` | 11 |
| `--text: "Barlow", system-ui, sans-serif` | 11 |
| `--s: 1` | 12 |
| `--k: .889` | 12 |
| `--plate: image-set(url(assets/ENV_CLUB_PLATE_V1_1X.webp) 1x, url(assets/ENV_CLUB_PLATE_V1_2X.webp) 2x)` | 13 |

### tr2/slice-02-plate/plate.css

| Colour literal | Lines |
| --- | --- |
| `#F2C45B` | 11 |
| `#C99B45` | 12 |
| `#FFD97A` | 13 |
| `#F4E7C8` | 14 |
| `#CDBB8F` | 15 |
| `#120E07` | 16 |
| `rgba(8, 6, 3, 0.62)` | 17 |
| `rgba(242, 196, 91, 0.38)` | 18 |
| `#070604` | 24, 364, 378 |
| `#F6C75E` | 54 |
| `#FFEBB0` | 55, 274 |
| `#F7CB62` | 55, 274 |
| `#D99A32` | 55, 274 |
| `rgba(255, 186, 64, 0.55)` | 57, 276 |
| `rgba(255, 186, 64, 0.62)` | 62 |
| `rgba(0, 0, 0, 0.9)` | 69 |
| `#FBEFD2` | 86, 185, 230, 300, 326, 336 |
| `rgba(255, 196, 96, 0.45)` | 87, 231 |
| `rgba(255, 226, 160, 0.6)` | 87, 231 |
| `rgba(0, 0, 0, 0.38)` | 98 |
| `rgba(255, 200, 90, 0.45)` | 100 |
| `rgba(255, 214, 140, 0.035)` | 109 |
| `rgba(255, 230, 170, 0.06)` | 110 |
| `rgba(255, 190, 80, 0.5)` | 118 |
| `rgba(6, 5, 2, 0.46)` | 123 |
| `rgba(0, 0, 0, 0.55)` | 126 |
| `rgba(242, 196, 91, 0.24)` | 127 |
| `rgba(255, 210, 120, 0.42)` | 128 |
| `rgba(255, 190, 80, 0.10)` | 129 |
| `#111` | 140 |
| `#f4efe2` | 140 |
| `rgba(205, 187, 143, 0.78)` | 141, 284 |
| `rgba(8, 6, 3, 0.42)` | 142 |
| `rgba(242, 196, 91, 0.18)` | 142 |
| `rgba(205, 187, 143, 0.62)` | 143 |
| `rgba(255, 196, 96, 0.28)` | 153 |
| `#FFE08F` | 159 |
| `rgba(255, 196, 80, 0.45)` | 160 |
| `rgba(255, 255, 255, 0.55)` | 160 |
| `#FFB4A0` | 164 |
| `rgba(242, 196, 91, 0.045)` | 170 |
| `rgba(30, 24, 12, 0.66)` | 171 |
| `rgba(10, 8, 5, 0.8)` | 171 |
| `#000` | 173, 174, 367, 368 |
| `rgba(255, 196, 80, 0.55)` | 177, 434 |
| `rgba(255, 196, 96, 0.4)` | 186, 337 |
| `rgba(0, 0, 0, 0.7)` | 186, 301 |
| `rgba(6, 5, 3, 0.9)` | 200 |
| `rgba(6, 5, 3, 0.72)` | 200 |
| `rgba(6, 5, 3, 0)` | 200 |
| `rgba(0, 0, 0, 0.35)` | 205 |
| `rgba(244, 231, 200, 0.45)` | 210 |
| `rgba(244, 231, 200, 0.72)` | 212 |
| `rgba(255, 196, 80, 0.5)` | 213, 239 |
| `rgba(0, 255, 255, 0.8)` | 217 |
| `#0ff` | 218 |
| `rgba(255, 0, 255, 0.85)` | 220 |
| `rgba(8, 6, 3, 0.5)` | 237 |
| `rgba(242, 196, 91, 0.8)` | 238 |
| `rgba(255, 210, 120, 0.5)` | 238 |
| `rgba(255, 190, 80, 0.28)` | 238 |
| `rgba(242, 196, 91, 0.14)` | 241, 288, 322 |
| `rgba(242, 196, 91, 0.35)` | 244, 309 |
| `rgba(8, 6, 3, 0.35)` | 244, 308 |
| `rgba(255, 190, 80, 0.55)` | 252, 333 |
| `rgba(8, 6, 3, 0.30)` | 286 |
| `rgba(242, 196, 91, 0.16)` | 286 |
| `rgba(255, 210, 120, 0.22)` | 286 |
| `rgba(255, 196, 96, 0.35)` | 301, 327 |
| `#FF9A6B` | 334 |
| `rgba(255, 110, 60, 0.45)` | 334 |
| `#E0835A` | 335 |
| `rgba(255, 186, 64, 0.18)` | 401 |
| `rgba(6, 5, 3, 0.98)` | 439 |
| `rgba(6, 5, 3, 0.94)` | 439 |
| `rgba(6, 5, 3, 0.0)` | 439 |

| Font or size declaration | Line |
| --- | --- |
| `font-family: "Barlow Condensed"` | 5 |
| `font-weight: 600` | 5 |
| `font-display: block` | 5 |
| `font-family: "Barlow Condensed"` | 6 |
| `font-weight: 700` | 6 |
| `font-display: block` | 6 |
| `font-family: "Barlow"` | 7 |
| `font-weight: 400` | 7 |
| `font-display: block` | 7 |
| `font-family: "Barlow"` | 8 |
| `font-weight: 600` | 8 |
| `font-display: block` | 8 |
| `font-family: var(--text)` | 25 |
| `font-family: var(--cond)` | 53 |
| `font-weight: 700` | 53 |
| `font-size: calc(var(--k) * 25px)` | 54 |
| `font-size: calc(var(--k) * 28px)` | 61 |
| `font-family: var(--cond)` | 67 |
| `font-weight: 600` | 67 |
| `font-size: max(12px, calc(var(--k) * 14.5px))` | 68 |
| `font-size: max(12px, calc(var(--k) * 13px))` | 72 |
| `font-family: var(--cond)` | 85 |
| `font-weight: 700` | 85 |
| `font-size: calc(var(--k) * 18px)` | 86 |
| `font-family: var(--cond)` | 90 |
| `font-weight: 700` | 90 |
| `font-size: calc(var(--k) * 17px)` | 90 |
| `font-family: var(--cond)` | 95 |
| `font-weight: 700` | 95 |
| `font-size: max(10.5px, calc(var(--k) * 13px))` | 95 |
| `font-family: var(--cond)` | 116 |
| `font-weight: 700` | 116 |
| `font-size: max(10px, calc(var(--k) * 12.5px))` | 116 |
| `font-family: var(--cond)` | 122 |
| `font-weight: 600` | 122 |
| `font-size: max(12.5px, calc(var(--k) * 16px))` | 122 |
| `font-family: var(--cond)` | 151 |
| `font-weight: 600` | 151 |
| `font-size: max(12px, calc(var(--k) * 14.5px))` | 151 |
| `font-family: var(--cond)` | 157 |
| `font-weight: 700` | 157 |
| `font-size: max(13px, calc(var(--k) * 17px))` | 157 |
| `font-size: 12px` | 164 |
| `font-family: var(--cond)` | 184 |
| `font-weight: 600` | 184 |
| `font-size: max(12.5px, calc(var(--k) * 17px))` | 184 |
| `font-family: var(--cond)` | 201 |
| `font-family: var(--cond)` | 204 |
| `font-weight: 700` | 204 |
| `font-size: 12.5px` | 204 |
| `font-weight: 700` | 208 |
| `font-size: 12.5px` | 208 |
| `font-size: 12.5px` | 210 |
| `font-weight: 700` | 211 |
| `font-size: 11px` | 211 |
| `font-weight: 700` | 213 |
| `font: 10px monospace` | 218 |
| `font-size: calc(var(--k) * 18px)` | 224 |
| `font-family: var(--cond)` | 229 |
| `font-weight: 700` | 229 |
| `font-size: calc(var(--k) * 27px)` | 230 |
| `font-family: var(--cond)` | 236 |
| `font-weight: 700` | 236 |
| `font-size: max(13px, calc(var(--k) * 17px))` | 236 |
| `font-family: var(--cond)` | 251 |
| `font-weight: 700` | 251 |
| `font-size: calc(var(--k) * 27px)` | 251 |
| `font-family: var(--cond)` | 255 |
| `font-weight: 700` | 255 |
| `font-size: max(12px, calc(var(--k) * 12.5px))` | 255 |
| `font-size: max(12px, calc(var(--k) * 14px))` | 258 |
| `font-size: max(11.5px, calc(var(--k) * 13px))` | 267 |
| `font-weight: 700` | 273 |
| `font-size: calc(var(--k) * 23px)` | 273 |
| `font-size: max(12.5px, calc(var(--k) * 15.5px))` | 283 |
| `font-size: max(11.5px, calc(var(--k) * 13.5px))` | 284 |
| `font-family: var(--cond)` | 294 |
| `font-weight: 600` | 294 |
| `font-size: max(11.5px, calc(var(--k) * 13.5px))` | 294 |
| `font-family: var(--cond)` | 300 |
| `font-weight: 600` | 300 |
| `font-size: max(12px, calc(var(--k) * 14.5px))` | 300 |
| `font-size: max(12px, calc(var(--k) * 14px))` | 304 |
| `font-family: var(--cond)` | 307 |
| `font-weight: 700` | 307 |
| `font-size: max(11.5px, calc(var(--k) * 13px))` | 307 |
| `font-weight: 600` | 316 |
| `font-family: var(--cond)` | 326 |
| `font-weight: 700` | 326 |
| `font-size: max(12.5px, calc(var(--k) * 16.5px))` | 326 |
| `font-family: var(--cond)` | 328 |
| `font-weight: 600` | 328 |
| `font-size: max(12px, calc(var(--k) * 14px))` | 328 |
| `font-family: var(--cond)` | 331 |
| `font-weight: 700` | 331 |
| `font-size: max(13px, calc(var(--k) * 17px))` | 331 |
| `font-family: var(--cond)` | 332 |
| `font-weight: 600` | 332 |
| `font-size: max(11.5px, calc(var(--k) * 12.5px))` | 332 |
| `font-family: var(--cond)` | 336 |
| `font-weight: 700` | 336 |
| `font-size: max(13px, calc(var(--k) * 19px))` | 336 |
| `font-family: var(--cond)` | 339 |
| `font-weight: 600` | 339 |
| `font-size: max(12px, calc(var(--k) * 13.5px))` | 339 |
| `font-size: max(20px, calc(var(--k) * 34px))` | 371 |
| `font-size: clamp(8px, calc(var(--k) * 25px), 12px)` | 373 |
| `font-size: 13px` | 380 |
| `font-size: 19px` | 389 |
| `font-size: 12px` | 390 |
| `font-size: 13px` | 391 |
| `font-size: 17px` | 407 |
| `font-size: 11.5px` | 409 |
| `font-size: 13px` | 417 |
| `font-size: 16px` | 418 |
| `font-size: 13px` | 421 |
| `font-size: 17px` | 422 |
| `font-size: 20px` | 426 |
| `font-size: 17px` | 427 |
| `font-size: 15px` | 435 |
| `font-size: 12.5px` | 440 |
| `font-size: 11.5px` | 442 |
| `font-size: 12px` | 444 |
| `font-size: 12.5px` | 449 |
| `font-size: 13.5px` | 451 |
| `font-size: 13px` | 455 |
| `font-size: 16px` | 461 |
| `font-size: 12.5px` | 462 |
| `font-size: 13px` | 465 |
| `font-size: 13px` | 472 |
| `font-size: 16px !important` | 473 |
| `font-size: 14.5px` | 476 |
| `font-size: 12px` | 477 |
| `font-size: 14px` | 478 |
| `font-size: 11.5px` | 479 |
| `font-size: 15px` | 480 |
| `font-size: 12px` | 481 |
| `font-size: 14px` | 488 |
| `font-size: 12px` | 490 |

| Root custom property | Lines |
| --- | --- |
| `--gold: #F2C45B` | 11 |
| `--gold-deep: #C99B45` | 12 |
| `--gold-hot: #FFD97A` | 13 |
| `--cream: #F4E7C8` | 14 |
| `--cream-dim: #CDBB8F` | 15 |
| `--ink: #120E07` | 16 |
| `--well: rgba(8, 6, 3, 0.62)` | 17 |
| `--hair: rgba(242, 196, 91, 0.38)` | 18 |
| `--cond: "Barlow Condensed", "Arial Narrow", sans-serif` | 19 |
| `--text: "Barlow", system-ui, sans-serif` | 20 |
| `--footer-h: 36px` | 27 |
| `--footer-h: 30px` | 28 |
| `--k: 0.817` | 29 |
| `--footer-h: 56px` | 354 |
| `--band-h: 28px` | 354 |
| `--band-h: 42px` | 448 |
| `--band-h: 34px` | 485 |
