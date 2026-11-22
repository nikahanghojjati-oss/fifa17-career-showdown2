# HO-026 (r75): PHONE_<KEY>_MARBLE mockup tickets. Picture 1 = approved PHONE_<KEY> layout, picture 2 = NEXT_<KEY> marble look.
# Job 1799 = 3 samples, job 1800 = the other 11 screens + Loading + Trophy Room single.
import os,sys
R=os.path.join(os.path.dirname(__file__),'..','..','tickets')+'/'
GH='https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/mockups/'
def tabs(on): return f'At the very bottom keep the tab bar exactly as in picture 1: HOME (house icon), CAREER (trophy icon), STANDINGS (three lines icon), STATS (bar chart icon), RULES (page icon), with {on} highlighted. '
NOTABS='There is no tab bar on this screen; do not add one. '
GEAR='Keep the round gear button at the top right. '
HDR='CAREER MODE SHOWDOWN 17'
# key: (name, scene, words, extra, people)   people: men | none | reus
P={
'HOME':('Home','the luxury marble lounge of picture 2: black marble pillars with gold light, leather sofas, the night stadium through the tall windows',
 'SIGN IN | NO ACTIVE SHOWDOWN | THE RIVALRY STARTS HERE | CAREER MODE SHOWDOWN 17 | TWO MANAGERS · ONE LEGACY | CAREER | CONTINUE CAREER | START A SHOWDOWN | LEGACY | STATISTICS | TROPHY ROOM | RULE BOOK | SETTINGS | AUDIUS SOUNDTRACK | PLAY TRACK | MUTE | TRACKS | HOME | CAREER | STANDINGS | STATS | RULES',
 GEAR+'The SIGN IN button must stay at the top left. '+tabs('HOME'),'men'),
'SEASON_RESULTS':('Season Results','the night stadium with floodlights and gold-lit stands of picture 2, and its black marble stage',
 'SEASON RESULTS | DANIEL | NIK | SEALED | HOW SCORING WORKS | Daniel | Arsenal | LEAGUE POSITION | 1 | LEAGUE POINTS | 86 | LEAGUE GOALS | 92 | Domestic Cup Winner | Champions League Winner | Top Scorer | Top Assist | REVIEW MY SEASON RESULT | BACK TO SHOWDOWN HOME',
 'The two men wear their black suits from picture 2, not football shirts. '+NOTABS,'men'),
'FINAL_WINNER':('Final Winner','the golden stadium stage of picture 2 with floodlights, falling gold confetti and black marble columns',
 'CAREER MODE SHOWDOWN 17 | SHOWDOWN CHAMPION | TWO MANAGERS · ONE LEGACY | SHARED SHOWDOWN CLOSED | DANIEL WINS | DANIEL | 16 | NIK | 8 | SUMMARY | HONOURS | FINAL SEASON 3 | 6 – 0 | DANIEL TAKES THE SEASON | SEASONS | 3 | PLAYED | MARGIN | 8 | POINTS | REVIEW MY SEASON RESULT | BACK TO SHOWDOWN HOME',
 'Keep the gold cup between the two men exactly as in picture 1. '+NOTABS,'men'),
'CONNECT_PLAYERS':('Connect Players','the black-marble tunnel of picture 2 with gold-lit pillars and the lit stadium at the far end',
 'CAREER MODE SHOWDOWN // 17 | CONNECT PLAYERS | DANIEL AND NIK MUST BOTH BE CONNECTED BEFORE THE CAREER BEGINS. | DANIEL · START | NIK · JOIN | CONNECTION | BACK | DANIEL · START | Choose seasons, create your code, and send it to Nik. | CHOOSE SEASONS | HOME | CAREER | STANDINGS | STATS | RULES',
 tabs('HOME'),'men'),
'LEAGUE':('Select League','the golden night stadium of picture 2 with gold banners and the black marble plinth under the wheel',
 'CAREER MODE | SHOWDOWN // 17 | DANIEL | SEASON 1 / 1 | SELECT LEAGUE | PREMIER LEAGUE | PREMIER LEAGUE | LIGUE 1 | LALIGA | SERIE A | BUNDESLIGA | Premier League has been selected and locked. Press Continue to confirm the league and open Club Assignment. | CONTINUE TO CLUB ASSIGNMENT | Career Mode Showdown | v1.9.1 · Stable',
 'Keep the league wheel exactly as in picture 1, in picture 2\'s polished gold. The gold ring must never cover any part of a league name or league symbol: every name and symbol sits fully inside its dark segment. '+NOTABS,'men'),
'CLUB':('Club Assignment','the dark gold-lit marble lounge of picture 2 with the stadium seen through the glass behind',
 'CLUB ASSIGNMENT | CLUB PACK | CM17 | CLUB PACK | CM17 | RIVALRY | VS | LOCK | LEAGUE CONFIRMED | Premier League | 01 | Daniel | ASSIGNED CLUB | Watford | REVEALED | 02 | Nik | ASSIGNED CLUB | Everton | REVEALED | CLUBS LOCKED | Daniel vs Nik | Premier League · 1 season | These clubs are permanent for the full showdown. Confirmation starts the rivalry and never rerolls either club. | CONFIRM RIVALRY & START SHOWDOWN',
 'Both men keep holding their black club packs as in picture 1. Keep the two club badges exactly as in picture 1. '+NOTABS,'men'),
'TRANSFER':('Transfer War','the luxury office of picture 2: night city and stadium through the tall windows, dark wood and gold, black marble desk',
 'TRANSFER WAR | TRANSFER WINDOW LIVE • BUILD YOUR FIFA 17 SQUAD | 14:28 | 15 MIN | 3 SIGNINGS | 3 GUESSES | Guess a league or nationality. A matching signing must be released. | /// DANIEL | YOU | Ends early only if you both agree. | /// NIK | SEALED | REQUEST EARLY END | HOME | SEASON 1 · TRANSFER CHALLENGE | 01 | Window | 02 | 03 | 04 | REFRESH',
 'Keep the round HOME and REFRESH buttons at the bottom as in picture 1. '+NOTABS,'men'),
'STANDINGS':('Standings','the gold-framed arena of picture 2 with the night stadium and floodlights behind',
 'CAREER MODE SHOWDOWN 17 | STANDINGS | TWO MANAGERS • ONE LEGACY | THIS SHOWDOWN | CAREER | HEAD-TO-HEAD | SEASON 3 OF 3 | SHOWDOWN POINTS | DANIEL | 16 : 8 | DANIEL LEADS | NIK | SEASON WINS 2 1 | SEASON DRAWS 0 0 | SEASON LOSSES 1 2 | CHAMPIONS LEAGUES 1 1 | LEAGUE TITLES 2 1 | DOMESTIC CUPS 2 0 | TOTAL TROPHIES 5 2 | HOME | CAREER | STANDINGS | STATS | RULES',
 GEAR+'Keep the two club badges exactly as in picture 1. '+tabs('STANDINGS'),'men'),
'RIVALRY':('Rivalry Statistics','the golden night stadium of picture 2 with floodlights and gold banners',
 'CAREER MODE SHOWDOWN 17 | RIVALRY STATISTICS | TWO MANAGERS • ONE LEGACY | TOTALS | HEAD-TO-HEAD | SEASONS | TROPHIES | DANIEL | CLUB_A | 3 / 3 SEASONS COMPLETED | NIK | CLUB_B | 16 | SHOWDOWN POINTS | 8 | 2 Season Wins 1 | 5 Total Trophies 2 | 1 Champions Leagues 1 | 2 League Titles 1 | 2 Domestic Cups 0 | Unavailable Transfer Signings Unavailable | BACK TO SHOWDOWN HOME | HOME | CAREER | STANDINGS | STATS | RULES',
 GEAR+'Keep the two club badges exactly as in picture 1. '+tabs('STANDINGS'),'men'),
'LEGACY':('Legacy','the black-marble trophy hall of picture 2 with tall arches and lit glass display cases',
 'BACK | LEGACY ARCHIVE | TROPHY ROOM | RECORDS | Showdown #1 | Daniel | Barcelona | 15 - 5 | DANIEL WINS | 3 / 3 Seasons | Nik | Real Madrid | VIEW SEASON HISTORY | HOME | CAREER | STANDINGS | STATS | RULES',
 GEAR+'Keep the BACK button at the top left and the two club badges exactly as in picture 1. '+tabs('CAREER'),'men'),
'TROPHY_ROOM':('Trophy Room','the black-marble trophy hall of picture 2 with lit glass display cases along both walls',
 'CAREER MODE SHOWDOWN 17 | TROPHY ROOM | TWO MANAGERS. ONE LEGACY. | SHOWDOWN CHAMPION | CAREER MODE SHOWDOWN | ALL | SHOWDOWN | LEAGUE TITLES | DOMESTIC CUPS | CHAMPIONS LEAGUE | SHOWDOWN CHAMPION | DANIEL ×1 | NIK – | LEAGUE TITLE | DANIEL ×2 | NIK ×1 | DOMESTIC CUP | DANIEL ×2 | NIK – | CHAMPIONS LEAGUE | DANIEL ×1 | NIK ×1 | BACK | MORE | HOME | CAREER | STANDINGS | STATS | RULES',
 GEAR+'Keep every cup exactly as in picture 1, inside black marble display cases. '+tabs('CAREER'),'men'),
'TROPHY_ROOM_SINGLE':('Trophy Room single cup','the black-marble trophy hall of picture 2 with lit glass display cases along both walls',
 'CAREER MODE SHOWDOWN 17 | TROPHY ROOM | TWO MANAGERS. ONE LEGACY. | SHOWDOWN CHAMPION | CAREER MODE SHOWDOWN | ALL | SHOWDOWN | LEAGUE TITLES | DOMESTIC CUPS | CHAMPIONS LEAGUE | CHAMPIONS LEAGUE | DANIEL | ×1 | NIK | ×1 | BACK | MORE | HOME | CAREER | STANDINGS | STATS | RULES',
 GEAR+'Keep the one big cup exactly as in picture 1, inside a black marble display case. The CHAMPIONS LEAGUE tab stays highlighted. '+tabs('CAREER'),'men'),
'STATISTICS':('Career Statistics','the dark luxury lounge of picture 2 with gold bokeh lights, glass shelves with gold footballs and the night city',
 'CAREER STATISTICS | TWO MANAGERS. ONE LEGACY. | COMPLETED SHOWDOWNS | 1 | TOGETHER | SEASONS PLAYED | D 3 / N 3 | CAREER POINTS | D 15 / N 5 | TROPHIES WON | D 4 / N 2 | TABLE | COMPARE | LEADERS | CAREER TABLE | # | Manager | Showdowns | Season W-D-L | Points | Trophies | 1 | Daniel | 1 | 2-0-1 | 15 | 4 | 2 | Nik | 1 | 1-0-2 | 5 | 2 | BACK TO MAIN MENU | OPEN TROPHY ROOM | HOME | CAREER | STANDINGS | STATS | RULES',
 GEAR+tabs('STATS'),'men'),
'RULE_BOOK':('Rule Book','the gold-lit library of picture 2: tall bookshelves, black marble columns and the marble floor',
 'CAREER MODE SHOWDOWN | RULE BOOK | THE LOCKED COMPETITION RULES | 01 | SHOWDOWN FORMAT | Career Mode Showdown is a two-player rivalry for Daniel and Nik. | Daniel is Player One. Nik is Player Two. | Both managers compete in the same selected league. | The assigned clubs remain fixed for the entire Showdown, across every season. | A Showdown may contain 1, 3, 5, or 10 seasons. | The manager with the most Showdown points across all seasons wins; equal totals are a draw. | 02 | MATCH PLAY | 03 | TRANSFER CHALLENGE | 04 | SCORING | 05 | TIEBREAK | 06 | CONNECTION & RECOVERY | BACK TO MAIN MENU | HOME | CAREER | STANDINGS | STATS | RULES',
 GEAR+'Write the six rule lines exactly as listed, nothing more. '+tabs('RULES'),'none'),
'SETTINGS':('Settings','the luxury penthouse lounge of picture 2: black marble walls with gold veins, gold shelves and the night city through the windows',
 'CAREER MODE SHOWDOWN | SETTINGS | TWO MANAGERS. ONE LEGACY. | ACCOUNT | DANIEL & NIK | Your player identity and this browser. | PLAYER | Not selected | DEVICE | Not ready | SIGN IN WITH GOOGLE | APPLICATION | CAREER MODE SHOWDOWN | Daniel and Nik\'s two-manager FIFA 17 Career Mode rivalry companion, built for the connected Showdown experience. | DONE',
 'Keep the square close button (×) at the top right. Use only picture 1\'s cards: do not copy any extra card or switch from picture 2. '+NOTABS,'none'),
'LOADING':('Loading','the black-marble tunnel of picture 2 with gold light and the lit stadium behind',
 'CM17 | THE RIVALRY STARTS HERE | CAREER MODE SHOWDOWN 17 | TWO MANAGERS · ONE LEGACY | PREPARING CAREER MODE SHOWDOWN | TWO MANAGERS · ONE SHOWDOWN | Marco Reus photo: Tim Reckmann · CC BY 2.0 · Display crop',
 'Keep the footballer in the yellow and black kit exactly as in picture 1 (same man, same pose); he is the only person on this screen. Keep the small photo credit line at the bottom left, letter for letter. '+NOTABS,'reus'),
}
WHO={'men':"The two men must look exactly like picture 2: same faces, hair, beards and black suits (Daniel has curly hair and a white shirt, Nik has a beard and a black shirt). Keep each man's pose and place from picture 1. Daniel stays on the LEFT and Nik on the RIGHT, never flipped. Show both men's full heads and all their hair, both in the same natural lighting as the scene: never dim, grey, blur, darken or fade either man. ",
     'none':"There are no people on this screen; do not add any. ",
     'reus':""}
CHK={'men':'   - Daniel (curly hair, white shirt) on the LEFT and Nik (beard, black shirt) on the RIGHT, faces like picture 2, poses like picture 1\n',
     'none':'   - no people anywhere\n',
     'reus':'   - the same footballer as picture 1, and the photo credit line is still there\n'}
FIXMEN={'men':'Same two men as picture 2, Daniel on the left. ','none':'No people. ','reus':'Same footballer as picture 1. '}
JOBS={1799:['HOME','SEASON_RESULTS','FINAL_WINNER'],
      1800:['CONNECT_PLAYERS','LEAGUE','CLUB','TRANSFER','STANDINGS','RIVALRY','LEGACY','TROPHY_ROOM','STATISTICS','RULE_BOOK','SETTINGS','LOADING','TROPHY_ROOM_SINGLE']}
# usage: python3 tickets.py 1800   (1799 files were written by the first version; regenerate them only on purpose)
for JOB in [int(a) for a in sys.argv[1:]] or [1800]:
    keys=JOBS[JOB]
    n=len(keys); rows=[]
    for i,k in enumerate(keys,1):
        name,scene,words,extra,people=P[k]
        t=f"""# Ticket {JOB} · {i} of {n} · {name} phone mockup in the marble look (PHONE_{k}_MARBLE)

One image only. It is a tall phone picture of the {name} screen: the same layout as today's phone picture, redrawn in the black-and-gold marble look of the desktop picture. Nik approves it; then Team G builds the phone screen to match (hand-off HO-026, r75). The clean background (cyan-box step) is made from it afterwards.

1. Open a **new normal ChatGPT chat outside any project** (not a Temporary Chat; it cannot make pictures). Use a brand-new chat for every ticket.
2. Attach these two files, in this order. On iPhone open each link in Safari, press and hold the picture, then Save to Photos.
   - Picture 1 (the layout): **PHONE_{k}.png** {GH}PHONE_{k}.png
   - Picture 2 (the look{' and the two men' if people=='men' else ''}): **NEXT_{k}.png** {GH}NEXT_{k}.png
3. Paste the prompt below exactly. If ChatGPT asks a question or offers to change it, reply: `No, use my prompt exactly.`
4. Check the picture:
   - tall phone shape, same layout as picture 1: every panel, title, card, button and word in the same position, size and order (the game code keeps this layout; only the look changes)
   - every word is spelled exactly as in the word list (no new words, no missing words)
   - the look is the black marble with gold veins and polished gold of picture 2; no stadium-night blue, no glass panels, no neon
{CHK[people]}   - no new buttons, tabs, icons or people
5. If it passes, download it and drop it into Claude's factory thread with the words `{JOB} {k}`. If it fails, paste the fix line below once in the same chat; if it still fails, start again in a brand-new chat (up to 3 tries).

Fix line (paste once if needed):

```
Wrong. Keep picture 1's layout and every word exactly, letter for letter, and only change the look to picture 2's black-and-gold marble. {FIXMEN[people]}No new words, buttons, tabs or icons.
```

Prompt:

```
MOST IMPORTANT: only use words that are already in picture 1, letter for letter. Do not invent any text, rule, tab, button, icon or number. Never add SQUAD, TRANSFERS, COMPETITIONS, COMPETE, PROFILE, SHOP, a bell, an avatar or a search icon. Do not move any button, tab or icon.

I am attaching two pictures. Picture 1 is a tall phone screen of a football career game. Picture 2 is the desktop version of the same screen in its final premium look.

Redraw picture 1 as a tall phone screen in the exact look of picture 2. Keep picture 1's layout exactly: the same title, cards, buttons, tabs and words, with every panel in the same position, size and order, in the same tall shape. Do not redesign or rearrange anything. Change only the look: use picture 2's black marble with gold veins, polished brushed gold frames and warm controlled gold light, and set the screen in {scene}. The cards become black marble and black lacquer panels with thin gold edges, like picture 2. The main button is polished gold. Copy every club badge from picture 1 exactly; never draw a real club crest or logo. No glass panels, no neon, no blue stadium-night tint and no new effects.

{WHO[people]}{extra}

Words on this screen, exactly as written: {words}
```
"""
        fn=f'TICKET-{JOB}_{i}_OF_{n}_PHONE_{k}_MARBLE.md'
        open(R+fn,'w').write(t); rows.append(f'| {i} | {name} | {fn} |')
    head={1799:'first 3 samples',1800:'the other 11 screens, Loading and Trophy Room single'}[JOB]
    open(R+f'TICKET-{JOB}_README.md','w').write(f"""# Ticket {JOB}: marble phone mockups, {head} (HO-026, r75)

Nik's decision (12 Oct 2026): phone, sideways and tablet use exactly the desktop marble look, and each phone layout stays exactly as approved (only the look changes). Each result is saved as `mockups/PHONE_<KEY>_MARBLE.png` (the old PHONE_<KEY>.png stays). Then the cyan-box method makes the clean plate `ENV_<KEY>_PHONE_V2`.

| # | Screen | Ticket |
| --- | --- | --- |
"""+'\n'.join(rows)+'\n')
print('ok')
