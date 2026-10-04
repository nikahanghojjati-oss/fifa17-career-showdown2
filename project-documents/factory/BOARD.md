# Showdown Factory board

**78 of 135 jobs done and checked · 65 %** · updated Sat 8:19 p.m. Eastern

✅ **Quality check:** a job counts as done only after Claude checks it against the quality bar (average 4.2 or more, nothing under 3, hard gates pass). Average score 4.24 over 26 scored jobs. 🔍 Waiting for Claude's check: 60. 🔧 Sent back with a fix list: 47, 58, 77, 83, 87, 94, 114, 115.

██████░░░░

**Where to run:** 🟡 **project job** = new chat in the ChatGPT project "Showdown visual", type the number. 🟣 **image job** = its ticket in a ChatGPT **Temporary Chat** outside any project, then drop the picture in Claude's factory thread.

🟡 **Type next:** 47 (fix), 58 (fix), 77 (fix), 83 (fix), 87 (fix), 94 (fix), 114 (fix), 115 (fix) · then 61, 117, 119, 120, 125

🟣 **Image next:** 118

**Working:** 50, 84, 95, 116 · **Blocked:** -

## Screens

```
Home           ██████████ 8/8
League         ██████████ 8/8
Club           ██████████ 6/7
Transfer       ███░░░░░░░ 1/6
Loading        ██████████ 4/4
Trophy Room    █████████░ 7/10
Career Stats   █████░░░░░ 5/10
Rivalry        ████░░░░░░ 4/9
Legacy         █████░░░░░ 5/10
Season Results ████░░░░░░ 3/9
Final Winner   ██████░░░░ 4/8
Start/Join     ███░░░░░░░ 2/8
Standings      ██░░░░░░░░ 1/4
Rule Book      ██████████ 3/4
Settings       ███░░░░░░░ 1/4
Setup          ██████████ 2/2
Foundation     ██████████ 7/7
Art            ██████████ 8/8
Top bar        ░░░░░░░░░░ 0/1
Integration    ░░░░░░░░░░ 0/8
```

## Team V ↔ Team G (latest 3)

- Sat 10:40 a.m. Eastern · Team G → Team V · G2V-007: DATA_CONTRACT_V1 fixtures ready (raw index.json link); extra model fields; G-8, G-11 merged; G-9/10/12/18 written; V2G-005 adopted
- Sat 10:55 a.m. Eastern · Team G → Team V · G2V-008: Fixture update: after a Showdown closes, Daniel gets CREATE and Nik gets JOIN (model bug fixed, 5 files regenerated)
- Sat 7:55 p.m. Eastern · Team G → Team V · G2V-009: Gameplay done before G-13; when is the visual package ready? G-10 transfer fields

## Full board

Branch `factory/v1-wtt5ye`. 135 Team V jobs, plus 5 lines that track Team G. Two kinds of job. **Project (type number):** open a new chat in the ChatGPT project "Showdown visual" and type the number (up to 5 at once). **Fresh chat (image):** run the job's ticket from [tickets/](tickets/README.md) in a ChatGPT Temporary Chat (no memory) outside any project, then drop the image in Claude's factory thread (up to 2 at once).

**Overall (Team V):** ██████░░░░ 65 % · 78 of 135 jobs done

**Start now · project (type the number in Showdown visual):** 47 (fix), 58 (fix), 77 (fix), 83 (fix), 87 (fix), 94 (fix), 114 (fix), 115 (fix) · queued next: 61, 117, 119, 120, 125

**Start now · fresh chat (image ticket, outside the project):** 118

**Start now (Sol Work mode, press Use Work):** -

**Working:** 50, 84, 95, 116 · **Blocked:** -

**Team G tracking (never start these):** 98 (done), 99 (open), 100 (open), 101 (open), 102 (open). Claude marks them done when Team G delivers.

| # | Job | Phase | Type | Lane | Depends on | Progress | State | Claude look |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | [Factory smoke test](jobs/JOB-000.md) | 0 Setup | test | project (type number) | - | ██████████ 100 % | DONE |  |
| 1 | [Baseline shots of the four built screens](jobs/JOB-001.md) | 0 Setup | review | project (type number) | - | ██████████ 100 % | DONE |  |
| 2 | [Truth sheet: Trophy Room](jobs/JOB-002.md) | 1 Truth | data | project (type number) | - | ██████████ 100 % | DONE |  |
| 3 | [Truth sheet: Career Statistics](jobs/JOB-003.md) | 1 Truth | data | project (type number) | - | ██████████ 100 % | DONE |  |
| 4 | [Truth sheet: Rivalry Statistics](jobs/JOB-004.md) | 1 Truth | data | project (type number) | - | ██████████ 100 % | DONE |  |
| 5 | [Truth sheet: Legacy (History)](jobs/JOB-005.md) | 1 Truth | data | project (type number) | - | ██████████ 100 % | DONE |  |
| 6 | [Truth sheet: Season Results](jobs/JOB-006.md) | 1 Truth | data | project (type number) | - | ██████████ 100 % | DONE |  |
| 7 | [Truth sheet: Final Winner](jobs/JOB-007.md) | 1 Truth | data | project (type number) | - | ██████████ 100 % | DONE |  |
| 8 | [Truth sheet: Start / Join](jobs/JOB-008.md) | 1 Truth | data | project (type number) | - | ██████████ 100 % | DONE |  |
| 9 | [Truth sheet: Rule Book](jobs/JOB-009.md) | 1 Truth | data | project (type number) | - | ██████████ 100 % | DONE |  |
| 10 | [Truth sheet: Settings](jobs/JOB-010.md) | 1 Truth | data | project (type number) | - | ██████████ 100 % | DONE |  |
| 11 | [Truth sheet: Loading](jobs/JOB-011.md) | 1 Truth | data | project (type number) | - | ██████████ 100 % | DONE |  |
| 12 | [Showdown tokens and type system](jobs/JOB-012.md) | 2 Foundation | build | project (type number) | - | ██████████ 100 % | DONE |  |
| 13 | [Panel, button and table kit](jobs/JOB-013.md) | 2 Foundation | build | project (type number) | 12 | ██████████ 100 % | DONE |  |
| 14 | [Character cut-out tool and standard](jobs/JOB-014.md) | 2 Foundation | build | project (type number) | 0 | ██████████ 100 % | DONE |  |
| 15 | [Cinematic stage engine](jobs/JOB-015.md) | 2 Foundation | build | project (type number) | 12, 14 | ██████████ 100 % | DONE |  |
| 16 | [Motion kit (pack-rip grade)](jobs/JOB-016.md) | 2 Foundation | build | project (type number) | 13 | ██████████ 100 % | DONE |  |
| 17 | [Shared QA harness and compare sheets](jobs/JOB-017.md) | 2 Foundation | build | project (type number) | - | ██████████ 100 % | DONE |  |
| 18 | [Foundation review](jobs/JOB-018.md) | 2 Foundation | review | project (type number) | 13, 15, 16, 14, 17 | ██████████ 100 % | DONE | yes |
| 19 | [Trophy art: Showdown Champion trophy](jobs/JOB-019.md) | 3 Art | image | fresh chat (image) | 0 | ██████████ 100 % | DONE |  |
| 20 | [Trophy art: League Title trophy](jobs/JOB-020.md) | 3 Art | image | fresh chat (image) | 0 | ██████████ 100 % | DONE |  |
| 21 | [Trophy art: Domestic Cup trophy](jobs/JOB-021.md) | 3 Art | image | fresh chat (image) | 0 | ██████████ 100 % | DONE |  |
| 22 | [Trophy art: Champions League (continental) trophy](jobs/JOB-022.md) | 3 Art | image | fresh chat (image) | 0 | ██████████ 100 % | DONE |  |
| 23 | [Plate: Trophy Room](jobs/JOB-023.md) | 3 Art | build | project (type number) | 0 | ██████████ 100 % | DONE |  |
| 24 | [Plate: Career Statistics](jobs/JOB-024.md) | 3 Art | build | project (type number) | 0 | ██████████ 100 % | DONE |  |
| 25 | [Plate: Rivalry Statistics](jobs/JOB-025.md) | 3 Art | build | project (type number) | 0 | ██████████ 100 % | DONE |  |
| 26 | [Plate: Legacy](jobs/JOB-026.md) | 3 Art | build | project (type number) | 0 | ██████████ 100 % | DONE |  |
| 27 | [Plate: Season Results](jobs/JOB-027.md) | 3 Art | build | project (type number) | 0 | ██████████ 100 % | DONE |  |
| 28 | [Plate: Start / Join](jobs/JOB-028.md) | 3 Art | build | project (type number) | 0 | ██████████ 100 % | DONE |  |
| 29 | [Plate: system stadium (no people)](jobs/JOB-029.md) | 3 Art | image | fresh chat (image) | 0 | ██████████ 100 % | DONE |  |
| 30 | [Art review: trophies and plates](jobs/JOB-030.md) | 3 Art | review | project (type number) | 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29 | ██████████ 100 % | DONE | yes |
| 31 | [Home: face edges and seams](jobs/JOB-031.md) | 4 Polish built screens | fix | project (type number) | 14, 1 | ██████████ 100 % | DONE |  |
| 32 | [Home: seven destinations and premium tiles](jobs/JOB-032.md) | 4 Polish built screens | build | project (type number) | 31, 18, 20, 122 | ██████████ 100 % | DONE |  |
| 33 | [Home: phone with seven destinations](jobs/JOB-033.md) | 4 Polish built screens | build | project (type number) | 32, 111 | ██████████ 100 % | DONE |  |
| 34 | [Home: review](jobs/JOB-034.md) | 4 Polish built screens | review | project (type number) | 33 | ██████████ 100 % | DONE |  |
| 35 | [Home: fix round](jobs/JOB-035.md) | 4 Polish built screens | fix | project (type number) | 34 | ██████████ 100 % | DONE |  |
| 36 | [Home: motion pass](jobs/JOB-036.md) | 4 Polish built screens | build | project (type number) | 35, 16 | ██████████ 100 % | DONE | yes |
| 37 | [League: hands on the wheel](jobs/JOB-037.md) | 4 Polish built screens | build | project (type number) | 14, 1, 18, 123 | ██████████ 100 % | DONE |  |
| 38 | [League: swap in the new league marks](jobs/JOB-038.md) | 4 Polish built screens | build | project (type number) | 37 | ██████████ 100 % | DONE |  |
| 39 | [League: phone with the hand in frame](jobs/JOB-039.md) | 4 Polish built screens | build | project (type number) | 37, 112 | ██████████ 100 % | DONE |  |
| 40 | [League: review](jobs/JOB-040.md) | 4 Polish built screens | review | project (type number) | 39 | ██████████ 100 % | DONE |  |
| 41 | [League: fix round](jobs/JOB-041.md) | 4 Polish built screens | fix | project (type number) | 40, 124 | ██████████ 100 % | DONE |  |
| 42 | [League: spin feel](jobs/JOB-042.md) | 4 Polish built screens | build | project (type number) | 41, 16 | ██████████ 100 % | DONE | yes |
| 43 | [Club: scene registration, faces, hands and seams](jobs/JOB-043.md) | 4 Polish built screens | fix | project (type number) | 14, 1 | ██████████ 100 % | DONE |  |
| 44 | [Club: panels and short-laptop fit](jobs/JOB-044.md) | 4 Polish built screens | build | project (type number) | 43, 18 | ██████████ 100 % | DONE |  |
| 45 | [Club: phone](jobs/JOB-045.md) | 4 Polish built screens | build | project (type number) | 44, 113 | ██████████ 100 % | DONE |  |
| 46 | [Club: review](jobs/JOB-046.md) | 4 Polish built screens | review | project (type number) | 45 | ██████████ 100 % | DONE |  |
| 47 | [Club: fix round](jobs/JOB-047.md) | 4 Polish built screens | fix | project (type number) | 46, 124 | ██████████ 100 % | IN PROGRESS · FIX |  |
| 48 | [Club: the pack rip](jobs/JOB-048.md) | 4 Polish built screens | build | project (type number) | 47, 16 | ██████████ 100 % | DONE | yes |
| 49 | [Transfer War: polish to the key art](jobs/JOB-049.md) | 4 Polish built screens | build | project (type number) | 1, 18 | ██████████ 100 % | DONE |  |
| 50 | [Transfer War: phone polish](jobs/JOB-050.md) | 4 Polish built screens | build | project (type number) | 49, 114 | ███░░░░░░░ 33 % | IN PROGRESS |  |
| 51 | [Transfer War: review](jobs/JOB-051.md) | 4 Polish built screens | review | project (type number) | 50 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 52 | [Transfer War: fix round](jobs/JOB-052.md) | 4 Polish built screens | fix | project (type number) | 51, 124 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 53 | [Transfer War: motion](jobs/JOB-053.md) | 4 Polish built screens | build | project (type number) | 52, 16 | ░░░░░░░░░░ 0 % | NOT STARTED | yes |
| 54 | [Loading: new look and Reus credit](jobs/JOB-054.md) | 4 Polish built screens | build | project (type number) | 11, 18 | ██████████ 100 % | DONE |  |
| 55 | [Loading: review](jobs/JOB-055.md) | 4 Polish built screens | review | project (type number) | 54 | ██████████ 100 % | DONE |  |
| 56 | [Loading: fix round](jobs/JOB-056.md) | 4 Polish built screens | fix | project (type number) | 55 | ██████████ 100 % | DONE | yes |
| 57 | [Trophy Room: build (desktop)](jobs/JOB-057.md) | 5 New screens | build | project (type number) | 2, 23, 18, 130, 136, 19, 20, 21, 22 | ██████████ 100 % | DONE |  |
| 58 | [Trophy Room: phone](jobs/JOB-058.md) | 5 New screens | build | project (type number) | 57, 115 | ██████████ 100 % | IN PROGRESS · FIX |  |
| 59 | [Trophy Room: review](jobs/JOB-059.md) | 5 New screens | review | project (type number) | 58 | ██████████ 100 % | DONE |  |
| 60 | [Trophy Room: fix round](jobs/JOB-060.md) | 5 New screens | fix | project (type number) | 59 | ██████████ 100 % | DONE |  |
| 61 | [Trophy Room: motion](jobs/JOB-061.md) | 5 New screens | build | project (type number) | 60, 16 | ░░░░░░░░░░ 0 % | NOT STARTED | yes |
| 62 | [Career Statistics: build (desktop)](jobs/JOB-062.md) | 5 New screens | build | project (type number) | 3, 24, 18, 131, 137, 19, 20, 21, 22 | ██████████ 100 % | DONE |  |
| 63 | [Career Statistics: phone](jobs/JOB-063.md) | 5 New screens | build | project (type number) | 62, 116 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 64 | [Career Statistics: review](jobs/JOB-064.md) | 5 New screens | review | project (type number) | 63 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 65 | [Career Statistics: fix round](jobs/JOB-065.md) | 5 New screens | fix | project (type number) | 64 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 66 | [Career Statistics: motion](jobs/JOB-066.md) | 5 New screens | build | project (type number) | 65, 16 | ░░░░░░░░░░ 0 % | NOT STARTED | yes |
| 67 | [Rivalry Statistics: build (desktop)](jobs/JOB-067.md) | 5 New screens | build | project (type number) | 4, 25, 18, 135, 19, 20, 21, 22 | ██████████ 100 % | DONE |  |
| 68 | [Rivalry Statistics: phone](jobs/JOB-068.md) | 5 New screens | build | project (type number) | 67, 117 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 69 | [Rivalry Statistics: review](jobs/JOB-069.md) | 5 New screens | review | project (type number) | 68 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 70 | [Rivalry Statistics: fix round](jobs/JOB-070.md) | 5 New screens | fix | project (type number) | 69 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 71 | [Rivalry Statistics: motion](jobs/JOB-071.md) | 5 New screens | build | project (type number) | 70, 16 | ░░░░░░░░░░ 0 % | NOT STARTED | yes |
| 72 | [Legacy (History): build (desktop)](jobs/JOB-072.md) | 5 New screens | build | project (type number) | 5, 26, 18, 132, 138, 19, 20, 21, 22 | ██████████ 100 % | DONE |  |
| 73 | [Legacy (History): phone](jobs/JOB-073.md) | 5 New screens | build | project (type number) | 72, 118 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 74 | [Legacy (History): review](jobs/JOB-074.md) | 5 New screens | review | project (type number) | 73 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 75 | [Legacy (History): fix round](jobs/JOB-075.md) | 5 New screens | fix | project (type number) | 74 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 76 | [Legacy (History): motion](jobs/JOB-076.md) | 5 New screens | build | project (type number) | 75, 16 | ░░░░░░░░░░ 0 % | NOT STARTED | yes |
| 77 | [Season Results: build (desktop)](jobs/JOB-077.md) | 5 New screens | build | project (type number) | 6, 27, 18, 133, 19, 20, 21, 22 | ██████████ 100 % | IN PROGRESS · FIX |  |
| 78 | [Season Results: phone](jobs/JOB-078.md) | 5 New screens | build | project (type number) | 77, 119 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 79 | [Season Results: review](jobs/JOB-079.md) | 5 New screens | review | project (type number) | 78 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 80 | [Season Results: fix round](jobs/JOB-080.md) | 5 New screens | fix | project (type number) | 79 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 81 | [Season Results: motion](jobs/JOB-081.md) | 5 New screens | build | project (type number) | 80, 16 | ░░░░░░░░░░ 0 % | NOT STARTED | yes |
| 82 | [Final Winner: build (desktop)](jobs/JOB-082.md) | 5 New screens | build | project (type number) | 7, 23, 18, 134, 139, 19, 20, 21, 22 | ██████████ 100 % | DONE |  |
| 83 | [Final Winner: phone](jobs/JOB-083.md) | 5 New screens | build | project (type number) | 82, 115 | ██████████ 100 % | IN PROGRESS · FIX |  |
| 84 | [Final Winner: review](jobs/JOB-084.md) | 5 New screens | review | project (type number) | 83 | ████░░░░░░ 42 % | IN PROGRESS |  |
| 85 | [Final Winner: fix round](jobs/JOB-085.md) | 5 New screens | fix | project (type number) | 84, 124 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 86 | [Final Winner: motion](jobs/JOB-086.md) | 5 New screens | build | project (type number) | 85, 16 | ░░░░░░░░░░ 0 % | NOT STARTED | yes |
| 87 | [Start / Join: build (desktop)](jobs/JOB-087.md) | 5 New screens | build | project (type number) | 8, 28, 18, 19, 20, 21, 22 | ██████████ 100 % | IN PROGRESS · FIX |  |
| 88 | [Start / Join: phone](jobs/JOB-088.md) | 5 New screens | build | project (type number) | 87, 120 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 89 | [Start / Join: review](jobs/JOB-089.md) | 5 New screens | review | project (type number) | 88 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 90 | [Start / Join: fix round](jobs/JOB-090.md) | 5 New screens | fix | project (type number) | 89 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 91 | [Start / Join: motion](jobs/JOB-091.md) | 5 New screens | build | project (type number) | 90, 16 | ░░░░░░░░░░ 0 % | NOT STARTED | yes |
| 92 | [Rule Book: build (desktop and phone)](jobs/JOB-092.md) | 5 New screens | build | project (type number) | 9, 29, 18, 121 | ██████████ 100 % | DONE |  |
| 93 | [Rule Book: review](jobs/JOB-093.md) | 5 New screens | review | project (type number) | 92 | ██████████ 100 % | DONE |  |
| 94 | [Rule Book: fix round and motion](jobs/JOB-094.md) | 5 New screens | fix | project (type number) | 93, 16, 124 | ██████████ 100 % | IN PROGRESS · FIX | yes |
| 95 | [Settings: build (desktop and phone)](jobs/JOB-095.md) | 5 New screens | build | project (type number) | 10, 29, 18, 121 | █████░░░░░ 58 % | IN PROGRESS |  |
| 96 | [Settings: review](jobs/JOB-096.md) | 5 New screens | review | project (type number) | 95 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 97 | [Settings: fix round and motion](jobs/JOB-097.md) | 5 New screens | fix | project (type number) | 96, 16, 124 | ░░░░░░░░░░ 0 % | NOT STARTED | yes |
| 98 | [Team G G-3: the pure career model](jobs/JOB-098.md) | 6 Online history | tracking | team-g | - | ██████████ 100 % | DONE |  |
| 99 | [Team G G-7: own-account career index](jobs/JOB-099.md) | 6 Online history | tracking | team-g | 98 | ░░░░░░░░░░ 0 % | WAITING ON TEAM G |  |
| 100 | [Team G G-8: completed-Showdown reader](jobs/JOB-100.md) | 6 Online history | tracking | team-g | 99 | ░░░░░░░░░░ 0 % | WAITING ON TEAM G |  |
| 101 | [Team G G-9 and G-10: Trophy Room standings and records, transfer history](jobs/JOB-101.md) | 6 Online history | tracking | team-g | 100 | ░░░░░░░░░░ 0 % | WAITING ON TEAM G |  |
| 102 | [Team G G-5, G-6 and G-11: active adapter, nav lock fields, model-true fixtures](jobs/JOB-102.md) | 6 Online history | tracking | team-g | 98 | ░░░░░░░░░░ 0 % | WAITING ON TEAM G |  |
| 103 | [Showcase: every screen in one place](jobs/JOB-103.md) | 7 Integration | integrate | project (type number) | 36, 42, 48, 53, 56, 61, 66, 71, 76, 81, 86, 91, 94, 97, 129 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 104 | [Showcase: screens read Team G's model-true fixtures](jobs/JOB-104.md) | 7 Integration | integrate | project (type number) | 103, 102 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 105 | [Full phone pass](jobs/JOB-105.md) | 7 Integration | review | project (type number) | 104 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 106 | [Full phone pass: fixes](jobs/JOB-106.md) | 7 Integration | fix | project (type number) | 105 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 107 | [Motion and sound consistency pass](jobs/JOB-107.md) | 7 Integration | review | project (type number) | 106 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 108 | [Final package review (Codex)](jobs/JOB-108.md) | 7 Integration | review | codex | 107 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 109 | [Final fixes](jobs/JOB-109.md) | 7 Integration | fix | project (type number) | 108 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 110 | [Package for Nik and handoff to GPT-5.6 Sol](jobs/JOB-110.md) | 7 Integration | integrate | project (type number) | 109 | ░░░░░░░░░░ 0 % | NOT STARTED | yes |
| 111 | [Phone art: Home](jobs/JOB-111.md) | 3 Art | build | project (type number) | 14, 1 | ██████████ 100 % | DONE |  |
| 112 | [Phone art: League](jobs/JOB-112.md) | 3 Art | build | project (type number) | 14, 1 | ██████████ 100 % | DONE |  |
| 113 | [Phone art: Club Assignment](jobs/JOB-113.md) | 3 Art | build | project (type number) | 14, 1 | ██████████ 100 % | DONE |  |
| 114 | [Phone art: Transfer War](jobs/JOB-114.md) | 3 Art | build | project (type number) | 14, 1 | ██████████ 100 % | IN PROGRESS · FIX |  |
| 115 | [Phone art: Trophy Room](jobs/JOB-115.md) | 3 Art | build | project (type number) | 14, 23 | ██████████ 100 % | IN PROGRESS · FIX |  |
| 116 | [Phone art: Career Statistics](jobs/JOB-116.md) | 3 Art | build | project (type number) | 14, 24 | ██████░░░░ 66 % | IN PROGRESS |  |
| 117 | [Phone art: Rivalry Statistics](jobs/JOB-117.md) | 3 Art | build | project (type number) | 14, 25 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 118 | [Phone art: Legacy (History)](jobs/JOB-118.md) | 3 Art | image | fresh chat (image) | 14, 26 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 119 | [Phone art: Season Results](jobs/JOB-119.md) | 3 Art | build | project (type number) | 14, 27 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 120 | [Phone art: Start / Join](jobs/JOB-120.md) | 3 Art | build | project (type number) | 14, 28 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 121 | [Phone art: system stadium portrait](jobs/JOB-121.md) | 3 Art | image | fresh chat (image) | 29 | ██████████ 100 % | DONE |  |
| 122 | [Art: Home tile illustrations](jobs/JOB-122.md) | 3 Art | image | fresh chat (image) | 0 | ██████████ 100 % | DONE |  |
| 123 | [Art: League wheel rim](jobs/JOB-123.md) | 3 Art | image | fresh chat (image) | 0, 1 | ██████████ 100 % | DONE |  |
| 124 | [Art: brush title wordmarks](jobs/JOB-124.md) | 3 Art | image | fresh chat (image) | 0 | ██████████ 100 % | DONE |  |
| 125 | [Top bar and phone bottom bar](jobs/JOB-125.md) | 5 New screens | build | project (type number) | 18, 124 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 126 | [Truth sheet: Standings](jobs/JOB-126.md) | 1 Truth | data | project (type number) | - | ██████████ 100 % | DONE |  |
| 127 | [Standings: build (desktop and phone)](jobs/JOB-127.md) | 5 New screens | build | project (type number) | 126, 25, 117, 18, 19, 20, 21, 22 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 128 | [Standings: review](jobs/JOB-128.md) | 5 New screens | review | project (type number) | 127 | ░░░░░░░░░░ 0 % | NOT STARTED |  |
| 129 | [Standings: fix round and motion](jobs/JOB-129.md) | 5 New screens | fix | project (type number) | 128, 16, 124 | ░░░░░░░░░░ 0 % | NOT STARTED | yes |
| 130 | [Truth sheet fix: Trophy Room](jobs/JOB-130.md) | 1 Truth | fix | project (type number) | 2 | ██████████ 100 % | DONE |  |
| 131 | [Truth sheet fix: Career Statistics](jobs/JOB-131.md) | 1 Truth | fix | project (type number) | 3 | ██████████ 100 % | DONE |  |
| 132 | [Truth sheet fix: Legacy (History)](jobs/JOB-132.md) | 1 Truth | fix | project (type number) | 5 | ██████████ 100 % | DONE |  |
| 133 | [Truth sheet fix: Season Results](jobs/JOB-133.md) | 1 Truth | fix | project (type number) | 6 | ██████████ 100 % | DONE |  |
| 134 | [Truth sheet fix: Final Winner](jobs/JOB-134.md) | 1 Truth | fix | project (type number) | 7 | ██████████ 100 % | DONE |  |
| 135 | [Truth sheet fix: Rivalry Statistics](jobs/JOB-135.md) | 1 Truth | fix | project (type number) | 4 | ██████████ 100 % | DONE |  |
| 136 | [Fixture realism: Trophy Room](jobs/JOB-136.md) | 1 Truth | fix | project (type number) | 130 | ██████████ 100 % | DONE |  |
| 137 | [Fixture realism: Career Statistics](jobs/JOB-137.md) | 1 Truth | fix | project (type number) | 131 | ██████████ 100 % | DONE |  |
| 138 | [Fixture realism: Legacy (History)](jobs/JOB-138.md) | 1 Truth | fix | project (type number) | 132 | ██████████ 100 % | DONE |  |
| 139 | [Fixture realism: Final Winner](jobs/JOB-139.md) | 1 Truth | fix | project (type number) | 134 | ██████████ 100 % | DONE |  |

Lanes: **project (type number)** = a GPT-5.6 Sol chat inside the ChatGPT project Showdown visual, started by typing the number; **fresh chat (image)** = Nik runs the job's ticket(s) in a ChatGPT Temporary Chat outside any project and drops each image in Claude's factory thread, then Claude checks, commits and finishes the job (max 2 at once); **codex** = Codex review (job 108 only); **team-g** = tracks a Team G job, never started by Team V.

Generated by `project-documents/factory/tools/board.py` from `BOARD.json`, `status/` and `tickets/`. Workers never edit this file; Claude regenerates it.
